/**
 * Zero-Cost Decentralized P2P Omegle
 * Production-Ready WebRTC & PeerJS Matchmaking Engine
 */

// Organic Matchmaking Threshold: Disable simulated videos when active users >= 300
const SIMULATED_VIDEO_DISABLE_THRESHOLD = 300;

// Application State
let peer = null;
let myPeerId = null;
let localStream = null;
let currentCall = null;
let chatConn = null;
let isAudioMuted = false;
let isVideoOff = false;
let isSimulatedCallActive = false;
let unreadMessagesCount = 0;
let currentOnlineUsersCount = 1420;

// Self-Brand Video Promotion Config & Feature Flag
const ENABLE_SELF_BRAND_ADS = true; // Set to false anytime to disable self-brand video ads
const BRAND_AD_FREQUENCY = 7; // Trigger a self-brand video ad every 7th match attempt
const BRAND_AD_SKIP_SECONDS = 5; // Enable skip button after 5 seconds


const SESSION_INSTANCE_ID = "sess_" + Date.now() + "_" + Math.floor(Math.random() * 10000000);
let previousTempClientId = null;

let matchCounter = 0;
let isSelfBrandAdPlaying = false;
let selfBrandAdTimer = null;
let selfBrandAdStartTime = 0;
let currentPlayingSelfBrandConfig = null;
let adPauseCount = 0;
let adRewindCount = 0;
let adMaxTimeWatched = 0;
let adDwellStartTime = 0;


let SELF_BRAND_ADS_POOL = [];


let hostConnectTimeout = null;
let retryMatchmakingTimeout = null;

// Matchmaking Pool Config (Zero-Cost Public Lobby Slots)
const LOBBY_PREFIX = "p2p-omegle-v1-slot-";
const TOTAL_SLOTS = 20;

// ICE Servers (Google STUN + Free TURN Relays for 4G/5G Mobile CGNAT Traversal)
const STUN_CONFIG = {
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun.cloudflare.com:3478" },
      // OpenRelay Public TURN Servers (Crucial for 4G/5G Mobile Data & Strict NAT)
      {
        urls: "turn:openrelay.metered.ca:80",
        username: "openrelay",
        credential: "openrelay",
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelay",
        credential: "openrelay",
      },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelay",
        credential: "openrelay",
      },
    ],
  },
};

// DOM Elements
const elements = {
  localVideo: document.getElementById("local"),
  remoteVideo: document.getElementById("remote"),
  btnMute: document.getElementById("btn-mute"),
  btnVideo: document.getElementById("btn-video"),
  btnSwitchCamera: document.getElementById("btn-switch-camera"),
  btnNext: document.getElementById("btn-next"),
  btnNextLabel: document.getElementById("btn-next-label"),
  btnStop: document.getElementById("btn-stop"),
  btnChatToggle: document.getElementById("btn-chat-toggle"),
  btnCloseChat: document.getElementById("btn-close-chat"),
  btnSendChat: document.getElementById("btn-send-chat"),
  chatInput: document.getElementById("chat-input"),
  chatMessages: document.getElementById("chat-messages"),
  chatDrawer: document.getElementById("chat-drawer"),
  unreadBadge: document.getElementById("unread-badge"),
  searchingOverlay: document.getElementById("searching-overlay"),
  overlayTitle: document.getElementById("overlay-status-title"),
  overlaySub: document.getElementById("overlay-status-sub"),
  firewallBanner: document.getElementById("firewall-banner"),
  statusDot: document.getElementById("status-dot"),
  btnThemeToggle: document.getElementById("btn-theme-toggle"),
  themeIcon: document.getElementById("theme-icon"),
  tosModal: document.getElementById("tos-modal"),
  chkAge: document.getElementById("chk-age"),
  chkTos: document.getElementById("chk-tos"),
  btnTosAgree: document.getElementById("btn-tos-agree"),
  sponsoredOverlay: document.getElementById("sponsored-ad-overlay"),
  sponsoredTitle: document.getElementById("sponsored-title"),
  sponsoredDesc: document.getElementById("sponsored-desc"),
  sponsoredCtaLink: document.getElementById("sponsored-cta-link"),
  sponsoredBadgeText: document.getElementById("sponsored-badge-text"),
  btnAdSkip: document.getElementById("btn-ad-skip"),
  adSkipText: document.getElementById("ad-skip-text"),
  btnAdPlayPause: document.getElementById("btn-ad-play-pause"),
  adPlayPauseIcon: document.getElementById("ad-play-pause-icon"),
  btnAdRewind: document.getElementById("btn-ad-rewind"),
  adProgressBar: document.getElementById("ad-progress-bar"),
  adTimeDisplay: document.getElementById("ad-time-display"),
  controlToolbar: document.getElementById("control-toolbar"),
  btnReport: document.getElementById("btn-report"),
  localPipContainer: document.getElementById("local-pip-container"),
  onlineUsersCount: document.getElementById("online-users-count"),
};

function setMobileVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

function refreshElements() {
  elements.localVideo = document.getElementById("local");
  elements.remoteVideo = document.getElementById("remote");
  elements.btnMute = document.getElementById("btn-mute");
  elements.btnVideo = document.getElementById("btn-video");
  elements.btnNext = document.getElementById("btn-next");
  elements.btnNextLabel = document.getElementById("btn-next-label");
  elements.btnStop = document.getElementById("btn-stop");
  elements.btnChatToggle = document.getElementById("btn-chat-toggle");
  elements.btnCloseChat = document.getElementById("btn-close-chat");
  elements.btnSendChat = document.getElementById("btn-send-chat");
  elements.chatInput = document.getElementById("chat-input");
  elements.chatMessages = document.getElementById("chat-messages");
  elements.chatDrawer = document.getElementById("chat-drawer");
  elements.unreadBadge = document.getElementById("unread-badge");
  elements.searchingOverlay = document.getElementById("searching-overlay");
  elements.overlayTitle = document.getElementById("overlay-status-title");
  elements.overlaySub = document.getElementById("overlay-status-sub");
  elements.firewallBanner = document.getElementById("firewall-banner");
  elements.statusDot = document.getElementById("status-dot");
  elements.btnThemeToggle = document.getElementById("btn-theme-toggle");
  elements.themeIcon = document.getElementById("theme-icon");
  elements.tosModal = document.getElementById("tos-modal");
  elements.chkAge = document.getElementById("chk-age");
  elements.chkTos = document.getElementById("chk-tos");
  elements.btnTosAgree = document.getElementById("btn-tos-agree");
  elements.sponsoredOverlay = document.getElementById("sponsored-ad-overlay");
  elements.sponsoredTitle = document.getElementById("sponsored-title");
  elements.sponsoredDesc = document.getElementById("sponsored-desc");
  elements.sponsoredCtaLink = document.getElementById("sponsored-cta-link");
  elements.sponsoredBadgeText = document.getElementById("sponsored-badge-text");
  elements.btnAdSkip = document.getElementById("btn-ad-skip");
  elements.adSkipText = document.getElementById("ad-skip-text");
  elements.btnAdPlayPause = document.getElementById("btn-ad-play-pause");
  elements.adPlayPauseIcon = document.getElementById("ad-play-pause-icon");
  elements.btnAdRewind = document.getElementById("btn-ad-rewind");
  elements.adProgressBar = document.getElementById("ad-progress-bar");
  elements.adTimeDisplay = document.getElementById("ad-time-display");
  elements.controlToolbar = document.getElementById("control-toolbar");
  elements.btnReport = document.getElementById("btn-report");
  elements.localPipContainer = document.getElementById("local-pip-container");
  elements.onlineUsersCount = document.getElementById("online-users-count");
  elements.idleStageOverlay = document.getElementById("idle-stage-overlay");

  elements.selfBrandOverlay = document.getElementById("self-brand-ad-overlay");
  elements.selfBrandVideoPlayer = document.getElementById("self-brand-video-player");
  elements.selfBrandTitle = document.getElementById("self-brand-title");
  elements.selfBrandDesc = document.getElementById("self-brand-desc");
  elements.selfBrandCtaLink = document.getElementById("self-brand-cta-link");
  elements.selfBrandCtaText = document.getElementById("self-brand-cta-text");
  elements.selfBrandBadgeText = document.getElementById("self-brand-badge-text");
  elements.btnSelfBrandSkip = document.getElementById("btn-self-brand-skip");
  elements.selfBrandSkipTimer = document.getElementById("self-brand-skip-timer");
  elements.selfBrandProgressFill = document.getElementById("self-brand-progress-fill");
  elements.btnSelfBrandRewind = document.getElementById("btn-self-brand-rewind");
  elements.btnSelfBrandPause = document.getElementById("btn-self-brand-pause");
  elements.iconSelfBrandPause = document.getElementById("icon-self-brand-pause");
  elements.btnSelfBrandMute = document.getElementById("btn-self-brand-mute");
  elements.iconSelfBrandMute = document.getElementById("icon-self-brand-mute");



  if (elements.remoteVideo) {
    elements.remoteVideo.addEventListener("loadedmetadata", adjustVideoAspectFit);
    elements.remoteVideo.addEventListener("playing", adjustVideoAspectFit);
  }
  window.addEventListener("resize", adjustVideoAspectFit);
}

/**
 * Dynamic Alternating Brand Name Switcher ('HashGANG Chat' <-> '#GANG Chat')
 */
function initBrandAlternatingTitle() {
  const titles = ["HashGANG Chat", "#GANG Chat"];
  let index = 0;
  const brandTitleText = document.getElementById("brand-title-text");

  setInterval(() => {
    index = (index + 1) % titles.length;
    const currentName = titles[index];
    document.title = currentName;

    if (brandTitleText) {
      brandTitleText.style.opacity = "0";
      setTimeout(() => {
        brandTitleText.textContent = currentName;
        brandTitleText.style.opacity = "1";
      }, 200);
    }
  }, 5000);
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  setMobileVh();
  window.addEventListener("resize", setMobileVh);
  window.addEventListener("orientationchange", setMobileVh);
  initTheme();
  loadSimulatedVideosManifest();
  setupEventListeners();
  initBrandAlternatingTitle();
  updateStatus("idle", "Click Start Chat to Connect");
  updateToolbarVisibility("idle");
  recordVisitBackend();
  fetchActiveUsersBackend();
  fetchSelfBrandAdsFromBackend();

  // Poll active users count every 15 seconds
  setInterval(fetchActiveUsersBackend, 15000);

  // Log 30-second session time heartbeat
  setInterval(() => {
    recordSessionTimeBackend(30);
  }, 30000);

  // Tab Visibility Restoration: Resume video playback when returning from background tab
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && elements.remoteVideo) {
      if (
        elements.remoteVideo.paused &&
        (isSimulatedCallActive || currentCall)
      ) {
        elements.remoteVideo
          .play()
          .catch((e) => console.warn("Background return video play error:", e));
      }
    }
  });

  // Prompt Terms of Service & Age Consent Modal on Page Load if missing/expired
  if (!isTosConsentValid()) {
    showTosModal();
  }

  // Register PWA Service Worker for Offline Shell & Fast Load
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("PWA Service Worker registered:", reg.scope))
        .catch((err) => console.warn("PWA Service Worker registration failed:", err));
    });
  }

  // Backend telemetry initialized cleanly
});

function setupEventListeners() {
  refreshElements();

  try {
    if (elements.btnThemeToggle)
      elements.btnThemeToggle.addEventListener("click", toggleTheme);
  } catch (e) {}

  try {
    if (elements.chkAge && elements.chkTos) {
      const updateAgreeButton = () => {
        if (elements.btnTosAgree) {
          elements.btnTosAgree.disabled = !(
            elements.chkAge.checked && elements.chkTos.checked
          );
        }
      };
      elements.chkAge.addEventListener("change", updateAgreeButton);
      elements.chkTos.addEventListener("change", updateAgreeButton);
    }
  } catch (e) {}

  try {
    if (elements.btnTosAgree)
      elements.btnTosAgree.addEventListener("click", acceptTosAndProceed);
  } catch (e) {}

  // Note: Toolbar buttons (btnNext, btnStop, btnMute, btnVideo, btnReport) use clean inline onclick handlers in HTML

  try {
    if (elements.btnSelfBrandSkip) {
      elements.btnSelfBrandSkip.addEventListener("click", () => {
        if (!elements.btnSelfBrandSkip.classList.contains("disabled")) {
          skipSelfBrandAdAndProceed(true);
        }
      });
    }

    if (elements.btnSelfBrandRewind) {
      elements.btnSelfBrandRewind.addEventListener("click", () => {
        if (elements.selfBrandVideoPlayer) {
          elements.selfBrandVideoPlayer.currentTime = Math.max(0, elements.selfBrandVideoPlayer.currentTime - 5);
          adRewindCount++;
          console.log("Ad video rewound -5s. Total rewinds:", adRewindCount);
        }
      });
    }

    if (elements.btnSelfBrandPause) {
      elements.btnSelfBrandPause.addEventListener("click", () => {
        if (elements.selfBrandVideoPlayer) {
          if (elements.selfBrandVideoPlayer.paused) {
            elements.selfBrandVideoPlayer.play();
            if (elements.iconSelfBrandPause) elements.iconSelfBrandPause.className = "fa-solid fa-pause";
          } else {
            elements.selfBrandVideoPlayer.pause();
            adPauseCount++;
            if (elements.iconSelfBrandPause) elements.iconSelfBrandPause.className = "fa-solid fa-play";
            console.log("Ad video paused. Total pauses:", adPauseCount);
          }
        }
      });
    }

    if (elements.btnSelfBrandMute) {
      elements.btnSelfBrandMute.addEventListener("click", () => {
        if (elements.selfBrandVideoPlayer) {
          elements.selfBrandVideoPlayer.muted = !elements.selfBrandVideoPlayer.muted;
          if (elements.iconSelfBrandMute) {
            elements.iconSelfBrandMute.className = elements.selfBrandVideoPlayer.muted
              ? "fa-solid fa-volume-xmark"
              : "fa-solid fa-volume-high";
          }
        }
      });
    }
  } catch (e) {}



  try {
    if (elements.selfBrandCtaLink) {
      elements.selfBrandCtaLink.addEventListener("click", () => {
        if (isSelfBrandAdPlaying && currentPlayingSelfBrandConfig) {
          const durationWatched = (Date.now() - selfBrandAdStartTime) / 1000;
          recordAdImpressionBackend(
            currentPlayingSelfBrandConfig,
            durationWatched,
            false,
            false,
            true
          );
        }
      });
    }
  } catch (e) {}

  // Global Event Delegation for Chat Toggle & Close Buttons (Bulletproof!)
  try {
    document.addEventListener("click", (e) => {
      const toggleBtn = e.target.closest("#btn-chat-toggle");
      if (toggleBtn) {
        e.preventDefault();
        e.stopPropagation();
        toggleChatDrawer();
        return;
      }

      const closeBtn = e.target.closest("#btn-close-chat");
      if (closeBtn) {
        e.preventDefault();
        e.stopPropagation();
        const drawer =
          document.getElementById("chat-drawer") || elements.chatDrawer;
        if (drawer) {
          drawer.classList.add("closed");
          drawer.classList.remove("open");
        }
        return;
      }
    });
  } catch (e) {}

  try {
    if (elements.btnChatToggle)
      elements.btnChatToggle.addEventListener("click", toggleChatDrawer);
  } catch (e) {}

  try {
    if (elements.btnCloseChat) {
      elements.btnCloseChat.addEventListener("click", () => {
        const drawer =
          document.getElementById("chat-drawer") || elements.chatDrawer;
        if (drawer) {
          drawer.classList.add("closed");
          drawer.classList.remove("open");
        }
      });
    }
  } catch (e) {}

  try {
    if (elements.btnSendChat)
      elements.btnSendChat.addEventListener("click", sendChatMessage);
  } catch (e) {}

  try {
    if (elements.chatInput) {
      elements.chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") sendChatMessage();
      });
    }
  } catch (e) {}



}

/**
 * Terms of Service & Disclaimer Modal Handlers (24-Hour Expiry Window)
 */
const TOS_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 Hours

function isTosConsentValid() {
  const timestampStr = localStorage.getItem("p2p_tos_accepted_at");
  if (!timestampStr) return false;

  const acceptedAt = parseInt(timestampStr, 10);
  if (isNaN(acceptedAt)) return false;

  // Check if consent was accepted within the last 24 hours
  return Date.now() - acceptedAt < TOS_EXPIRATION_MS;
}

function showTosModal() {
  if (elements.tosModal) elements.tosModal.classList.remove("hidden");
}

function hideTosModal() {
  if (elements.tosModal) elements.tosModal.classList.add("hidden");
}

function acceptTosAndProceed() {
  localStorage.setItem("p2p_tos_accepted_at", Date.now().toString());
  hideTosModal();
  handleStartOrNext();
}

/**
 * Theme Management Engine
 * - Auto-detects browser / device preference (prefers-color-scheme)
 * - Defaults to Dark Mode if un-set
 * - Supports manual toggle override saved in localStorage
 */
function initTheme() {
  const savedTheme = localStorage.getItem("app-theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    applyTheme(savedTheme, false);
  } else {
    // Check browser preference, default to dark if ambiguous
    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const lightQuery = window.matchMedia("(prefers-color-scheme: light)");

    if (lightQuery.matches) {
      applyTheme("light", false);
    } else {
      applyTheme("dark", false);
    }

    // Dynamic listener for browser media query changes
    const handleMediaChange = () => {
      if (!localStorage.getItem("app-theme")) {
        applyTheme(darkQuery.matches ? "dark" : "light", false);
      }
    };

    if (darkQuery.addEventListener) {
      darkQuery.addEventListener("change", handleMediaChange);
    } else if (darkQuery.addListener) {
      darkQuery.addListener(handleMediaChange);
    }
  }
}

function applyTheme(theme, save = true) {
  document.documentElement.setAttribute("data-theme", theme);

  if (save) {
    localStorage.setItem("app-theme", theme);
  }

  if (elements.themeIcon) {
    if (theme === "dark") {
      elements.themeIcon.className = "fa-solid fa-sun";
      elements.btnThemeToggle.title = "Switch to Light Mode";
    } else {
      elements.themeIcon.className = "fa-solid fa-moon";
      elements.btnThemeToggle.title = "Switch to Dark Mode";
    }
  }
}

function toggleTheme() {
  const currentTheme =
    document.documentElement.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme, true);
}

/**
 * Handle Start / Next Stranger Click
 */
async function handleStartOrNext() {
  if (isUserOnCooldown) {
    updateStatus("error", "Matchmaking cooldown active (60s). Please wait...");
    return;
  }

  hideFirewallWarning();
  if (elements.idleStageOverlay) elements.idleStageOverlay.classList.add("hidden");


  // Enforce Terms of Service & Age Consent (24-Hour Session Expiry)
  if (!isTosConsentValid()) {
    showTosModal();
    return;
  }

  // Notify connected peer before skipping so they automatically re-enter search
  if (chatConn && chatConn.open) {
    try {
      chatConn.send({ type: "PEER_SKIPPED" });
    } catch (e) {}
  }

  cleanupCallState();

  // Ensure local media stream is captured
  if (!localStream) {
    const success = await initLocalMedia();
    if (!success) return;
  }

  // Cycle lobby slot index for next stranger scan
  currentSlotScanIndex = (currentSlotScanIndex % TOTAL_SLOTS) + 1;

  elements.btnNextLabel.textContent = "Next Stranger";
  updateStatus("searching", "Searching for a Stranger...");
  updateToolbarVisibility("searching");
  showSearchingOverlay(
    "Searching for a Stranger...",
    "Connecting you to a random stranger worldwide...",
  );

  // Increment matchCounter & trigger Self-Brand Video Ad on BRAND_AD_FREQUENCY (e.g. 7th match)
  matchCounter++;
  if (
    ENABLE_SELF_BRAND_ADS &&
    SELF_BRAND_ADS_POOL.length > 0 &&
    matchCounter % BRAND_AD_FREQUENCY === 0
  ) {
    console.log(
      `Match counter (${matchCounter}) reached BRAND_AD_FREQUENCY (${BRAND_AD_FREQUENCY}). Triggering Self-Brand Video Promotion...`,
    );
    playSelfBrandVideoAd();
    return;
  }



  // Start automated zero-cost matchmaking
  findAndConnectPeer();
}

/**
 * Dynamic Self-Brand Video Ad Engine
 */
function playSelfBrandVideoAd() {
  if (isSelfBrandAdPlaying || currentCall) return;

  stopSimulatedStrangerVideo();
  hideSearchingOverlay();
  isSelfBrandAdPlaying = true;
  selfBrandAdStartTime = Date.now();
  adDwellStartTime = Date.now();
  adPauseCount = 0;
  adRewindCount = 0;
  adMaxTimeWatched = 0;

  // CPU/Battery Saver: Mute/disable local camera track while full-screen ad overlay plays
  if (localStream) {
    try {
      localStream.getVideoTracks().forEach((track) => (track.enabled = false));
    } catch (e) {}
  }


  if (elements.iconSelfBrandPause) {
    elements.iconSelfBrandPause.className = "fa-solid fa-pause";
  }
  if (elements.iconSelfBrandMute && elements.selfBrandVideoPlayer) {
    elements.iconSelfBrandMute.className = elements.selfBrandVideoPlayer.muted
      ? "fa-solid fa-volume-xmark"
      : "fa-solid fa-volume-high";
  }


  const adIndex =
    Math.floor(matchCounter / BRAND_AD_FREQUENCY - 1) %
    SELF_BRAND_ADS_POOL.length;
  const adConfig = SELF_BRAND_ADS_POOL[adIndex] || SELF_BRAND_ADS_POOL[0];
  currentPlayingSelfBrandConfig = adConfig;

  if (elements.selfBrandTitle)
    elements.selfBrandTitle.textContent = adConfig.title;
  if (elements.selfBrandDesc)
    elements.selfBrandDesc.textContent = adConfig.desc;
  if (elements.selfBrandBadgeText)
    elements.selfBrandBadgeText.textContent =
      adConfig.badgeText || "FEATURED PROMOTION";
  if (elements.selfBrandCtaText)
    elements.selfBrandCtaText.textContent = adConfig.ctaText || "Visit Website";
  if (elements.selfBrandCtaLink)
    elements.selfBrandCtaLink.href = adConfig.linkUrl || "#";

  if (elements.selfBrandVideoPlayer) {
    elements.selfBrandVideoPlayer.src = adConfig.videoUrl;
    elements.selfBrandVideoPlayer.currentTime = 0;
  }

  if (elements.btnSelfBrandSkip) {
    elements.btnSelfBrandSkip.classList.add("disabled");
  }
  if (elements.selfBrandSkipTimer) {
    elements.selfBrandSkipTimer.textContent = `Skip in ${BRAND_AD_SKIP_SECONDS}s`;
  }
  if (elements.selfBrandProgressFill) {
    elements.selfBrandProgressFill.style.width = "0%";
  }

  if (elements.selfBrandOverlay) {
    elements.selfBrandOverlay.classList.remove("hidden");
  }

  let countdownSec = BRAND_AD_SKIP_SECONDS;
  if (selfBrandAdTimer) clearInterval(selfBrandAdTimer);
  selfBrandAdTimer = setInterval(() => {
    countdownSec--;
    if (elements.selfBrandSkipTimer) {
      if (countdownSec > 0) {
        elements.selfBrandSkipTimer.textContent = `Skip in ${countdownSec}s`;
      } else {
        elements.selfBrandSkipTimer.textContent = "Skip Ad ⏭️";
        if (elements.btnSelfBrandSkip) {
          elements.btnSelfBrandSkip.classList.remove("disabled");
        }
        clearInterval(selfBrandAdTimer);
        selfBrandAdTimer = null;
      }
    }
  }, 1000);

  if (elements.selfBrandVideoPlayer) {
    const playPromise = elements.selfBrandVideoPlayer.play();
    if (playPromise !== undefined) {
      playPromise.catch((e) => {
        if (elements.selfBrandVideoPlayer) {
          elements.selfBrandVideoPlayer.muted = true;
          elements.selfBrandVideoPlayer
            .play()
            .catch((err) => console.warn("Self-brand play error:", err));
        }
      });
    }

    elements.selfBrandVideoPlayer.onended = () => {
      skipSelfBrandAdAndProceed();
    };

    // Prevent manual forward seeking (anti-skipping protection)
    elements.selfBrandVideoPlayer.onseeking = () => {
      if (
        elements.selfBrandVideoPlayer &&
        elements.selfBrandVideoPlayer.currentTime > adMaxTimeWatched + 0.5
      ) {
        elements.selfBrandVideoPlayer.currentTime = adMaxTimeWatched;
      }
    };

    elements.selfBrandVideoPlayer.ontimeupdate = () => {
      if (elements.selfBrandVideoPlayer) {
        if (elements.selfBrandVideoPlayer.currentTime > adMaxTimeWatched) {
          adMaxTimeWatched = elements.selfBrandVideoPlayer.currentTime;
        }
        if (elements.selfBrandProgressFill && elements.selfBrandVideoPlayer.duration) {
          const pct =
            (elements.selfBrandVideoPlayer.currentTime /
              elements.selfBrandVideoPlayer.duration) *
            100;
          elements.selfBrandProgressFill.style.width = `${pct}%`;
        }
      }
    };
  }
}

function skipSelfBrandAdAndProceed(skippedByClick = false) {
  if (currentPlayingSelfBrandConfig) {
    const durationWatched = (Date.now() - selfBrandAdStartTime) / 1000;
    const totalTimeSpent = (Date.now() - adDwellStartTime) / 1000;
    const skipSec = currentPlayingSelfBrandConfig.skipAfterSeconds || BRAND_AD_SKIP_SECONDS;
    const completedFull = !skippedByClick && durationWatched >= skipSec;
    recordAdImpressionBackend(
      currentPlayingSelfBrandConfig,
      durationWatched,
      completedFull,
      skippedByClick,
      false,
      totalTimeSpent,
      adPauseCount,
      adRewindCount,
      adMaxTimeWatched
    );
  }
  cleanupSelfBrandAdState();

  updateStatus("searching", "Searching for a Stranger...");
  showSearchingOverlay(
    "Searching for a Stranger...",
    "Connecting you to a random stranger worldwide...",
  );
  updateToolbarVisibility("searching");

  findAndConnectPeer();
}


function cleanupSelfBrandAdState() {
  isSelfBrandAdPlaying = false;

  // CPU/Battery Saver: Re-enable local camera track when ad overlay closes
  if (localStream) {
    try {
      localStream.getVideoTracks().forEach((track) => (track.enabled = true));
    } catch (e) {}
  }

  if (selfBrandAdTimer) {
    clearInterval(selfBrandAdTimer);
    selfBrandAdTimer = null;
  }

  if (elements.selfBrandVideoPlayer) {
    try {
      elements.selfBrandVideoPlayer.pause();
      elements.selfBrandVideoPlayer.onended = null;
      elements.selfBrandVideoPlayer.ontimeupdate = null;
    } catch (e) {}
  }
  if (elements.selfBrandOverlay) {
    elements.selfBrandOverlay.classList.add("hidden");
  }
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Simulated Stranger Video Pool Engine (Cold-Start Solution with Dynamic Manifest & Anti-Detection Randomization)
let SIMULATED_VIDEOS_POOL = [
  "assets/simulated_videos/stranger_1.mp4",
  "assets/simulated_videos/stranger_2.mp4",
  "assets/simulated_videos/stranger_3.mp4",
  "assets/simulated_videos/stranger_4.mp4",
  "assets/simulated_videos/stranger_5.mp4",
];
let activeShuffledPool = [];
let poolTrackIndex = 0;
let simulatedVideoTimer = null;
let simulatedFallbackTimeout = null;
let isExhaustionPauseActive = false;

/**
 * Fisher-Yates Array Shuffle Algorithm
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Dynamically load simulated video list from assets/simulated_videos/manifest.json & Shuffle
 */
async function loadSimulatedVideosManifest() {
  try {
    const res = await fetch("assets/simulated_videos/manifest.json");
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        SIMULATED_VIDEOS_POOL = data;
        console.log(
          "Simulated videos pool dynamically loaded from manifest.json:",
          SIMULATED_VIDEOS_POOL.length,
          "videos",
        );
      }
    }
  } catch (e) {
    console.warn("Using default simulated video pool list:", e);
  }
  activeShuffledPool = shuffleArray(SIMULATED_VIDEOS_POOL);
  poolTrackIndex = 0;
}

/**
 * Automatically adapt video object-fit & container layout to ensure ZERO cropping of height & width on ALL devices (Mobile, Tablet, Desktop)
 */
function adjustVideoAspectFit() {
  const video = elements.remoteVideo;
  if (!video || !video.videoWidth || !video.videoHeight) return;

  const container =
    video.parentElement || document.querySelector(".remote-video-container");
  if (!container) return;

  const videoAspect = video.videoWidth / video.videoHeight;
  const viewportAspect = window.innerWidth / window.innerHeight;

  // Calculate normalized aspect ratio mismatch ratio
  const aspectDiff =
    Math.abs(videoAspect - viewportAspect) /
    Math.max(videoAspect, viewportAspect);

  // If video aspect ratio differs significantly from screen aspect ratio (e.g. 16:9 widescreen video on 9:16 vertical mobile screen):
  // Set object-fit: contain so 100% of height AND 100% of width are displayed with ZERO CROPPING!
  if (aspectDiff > 0.15) {
    container.classList.add("contain-fit");
    video.style.objectFit = "contain";
  } else {
    container.classList.remove("contain-fit");
    video.style.objectFit = "cover";
  }
}

let isVideoSwapped = false;

function toggleVideoSwap() {
  isVideoSwapped = !isVideoSwapped;
  const viewport = document.querySelector(".video-viewport");
  if (viewport) {
    viewport.classList.toggle("swapped", isVideoSwapped);
  }
}

let currentSimulatedMetadataHandler = null;

function clearChatMessages() {
  const container =
    document.getElementById("chat-messages") || elements.chatMessages;
  if (container) {
    container.innerHTML = "";
  }
}

function playSimulatedStrangerVideo() {
  if (currentCall) return;

  // Threshold Guard: When active online users count >= 300, disable simulated videos to force 100% organic stranger matching
  if (currentOnlineUsersCount >= SIMULATED_VIDEO_DISABLE_THRESHOLD) {
    console.log(
      `Active online users (${currentOnlineUsersCount}) >= ${SIMULATED_VIDEO_DISABLE_THRESHOLD}. Disabling simulated videos to force 100% organic stranger matching.`,
    );
    updateStatus("searching", "High traffic: Matching real strangers...");
    showSearchingOverlay(
      "Searching Organic Strangers...",
      "High live user traffic. Connecting you directly to an organic stranger...",
    );
    return;
  }

  clearChatMessages();

  // Queue Exhaustion Check (Option A + Option B Integration)
  if (poolTrackIndex >= activeShuffledPool.length) {
    if (!isExhaustionPauseActive) {
      isExhaustionPauseActive = true;
      console.log(
        "Simulated video pool exhausted. Triggering Option B Soft Traffic Pause + Option A Re-shuffle.",
      );

      // Stage B: Soft Traffic Pause
      updateStatus(
        "searching",
        "High active traffic in your region. Matching...",
      );
      showSearchingOverlay(
        "High Active Traffic",
        "Matching you with the next available stranger...",
      );
      updateToolbarVisibility("searching");

      // Stage A: Re-shuffle & Resume after 5-second traffic pause
      setTimeout(() => {
        isExhaustionPauseActive = false;
        activeShuffledPool = shuffleArray(SIMULATED_VIDEOS_POOL);
        poolTrackIndex = 0;
        if (!currentCall) {
          playSimulatedStrangerVideo();
        }
      }, 5000);
      return;
    }
  }

  isSimulatedCallActive = true;
  hideSearchingOverlay();
  hideFirewallWarning();

  const videoUrl = activeShuffledPool[poolTrackIndex];
  console.log(
    `Playing simulated video [${poolTrackIndex + 1}/${activeShuffledPool.length}]:`,
    videoUrl,
  );
  poolTrackIndex++;

  if (elements.remoteVideo.srcObject) {
    elements.remoteVideo.srcObject = null;
  }

  elements.remoteVideo.onerror = () => {
    console.warn(
      "Simulated video failed to play (404 / deleted / corrupt), auto-skipping:",
      videoUrl,
    );
    if (isSimulatedCallActive && !currentCall) {
      setTimeout(skipSimulatedStrangerVideo, 200);
    }
  };

  try {
    elements.remoteVideo.pause();
    elements.remoteVideo.src = videoUrl;
    elements.remoteVideo.load();
    elements.remoteVideo.muted = false; // Audio enabled by default
    adjustVideoAspectFit();
  } catch (e) {
    console.warn("Video src load error:", e);
  }

  // Remove existing metadata handler if present
  if (currentSimulatedMetadataHandler && elements.remoteVideo) {
    elements.remoteVideo.removeEventListener(
      "loadedmetadata",
      currentSimulatedMetadataHandler,
    );
    currentSimulatedMetadataHandler = null;
  }

  // Handle Dynamic Start Offset & Play Duration once metadata is loaded
  currentSimulatedMetadataHandler = () => {
    if (currentSimulatedMetadataHandler && elements.remoteVideo) {
      elements.remoteVideo.removeEventListener(
        "loadedmetadata",
        currentSimulatedMetadataHandler,
      );
      currentSimulatedMetadataHandler = null;
    }

    if (!isSimulatedCallActive || currentCall) return;

    // 1. Always start videos from 0:00 (beginning) for 100% natural greetings
    elements.remoteVideo.currentTime = 0;

    // 2. Smooth call duration: 8.0s to 12.0s (or full video length if video is shorter)
    const duration = elements.remoteVideo.duration;
    let targetPlayDurationMs = 9000;

    if (!isNaN(duration) && duration > 0) {
      const fullDurationMs = Math.max(2000, (duration - 0.2) * 1000);
      const randomCallDurationMs = Math.floor(Math.random() * 4000) + 8000; // 8000ms - 12000ms (8s - 12s)
      targetPlayDurationMs = Math.min(fullDurationMs, randomCallDurationMs);
    }

    if (simulatedVideoTimer) clearTimeout(simulatedVideoTimer);
    simulatedVideoTimer = setTimeout(() => {
      if (isSimulatedCallActive && !currentCall) {
        skipSimulatedStrangerVideo();
      }
    }, targetPlayDurationMs);
  };

  elements.remoteVideo.addEventListener(
    "loadedmetadata",
    currentSimulatedMetadataHandler,
  );

  const playPromise = elements.remoteVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn(
        "Unmuted autoplay prevented by browser policy, falling back to muted playback:",
        err,
      );
      elements.remoteVideo.muted = true;
      elements.remoteVideo.play().catch((e) => console.error("Play retry failed:", e));
    });
  }

  updateStatus("connected", "Connected with Stranger");
  updateToolbarVisibility("connected");
  appendSystemChatMessage("You are now chatting with a random stranger. Say hi!");
}

let simulatedSearchDelayTimeout = null;

function skipSimulatedStrangerVideo() {
  clearChatMessages();
  stopInCallAdsterraJitterEngine();

  if (simulatedVideoTimer) {
    clearTimeout(simulatedVideoTimer);
    simulatedVideoTimer = null;
  }
  if (simulatedSearchDelayTimeout) {
    clearTimeout(simulatedSearchDelayTimeout);
    simulatedSearchDelayTimeout = null;
  }

  // Stage 1: Pause & clear previous remote video completely (Prevents background audio/video playback & error loops)
  if (elements.remoteVideo && !elements.remoteVideo.srcObject) {
    try {
      elements.remoteVideo.onerror = null;
      elements.remoteVideo.pause();
      elements.remoteVideo.removeAttribute("src");
      elements.remoteVideo.load();
    } catch (e) {}
  }

  // Stage 2: Show searching radar overlay with 4.0s guaranteed dwell time & ad banner
  updateStatus("searching", "Searching for a Stranger...");
  showSearchingOverlay(
    "Searching for a Stranger...",
    "Connecting you to a random stranger worldwide...",
  );
  updateToolbarVisibility("searching");

  // Stage 3: Perfectly synchronized 4.0s dwell time before launching next video
  simulatedSearchDelayTimeout = setTimeout(() => {
    simulatedSearchDelayTimeout = null;
    if (isSimulatedCallActive && !currentCall) {
      matchCounter++;
      if (
        ENABLE_SELF_BRAND_ADS &&
        SELF_BRAND_ADS_POOL.length > 0 &&
        matchCounter % BRAND_AD_FREQUENCY === 0
      ) {
        console.log(
          `Auto-next match counter (${matchCounter}) reached BRAND_AD_FREQUENCY (${BRAND_AD_FREQUENCY}). Triggering Self-Brand Video Promotion...`,
        );
        playSelfBrandVideoAd();
        return;
      }
      playSimulatedStrangerVideo();
    }
  }, MIN_SEARCHING_DWELL_MS);

}

function stopSimulatedStrangerVideo() {
  if (simulatedVideoTimer) {
    clearTimeout(simulatedVideoTimer);
    simulatedVideoTimer = null;
  }
  if (simulatedFallbackTimeout) {
    clearTimeout(simulatedFallbackTimeout);
    simulatedFallbackTimeout = null;
  }
  if (simulatedSearchDelayTimeout) {
    clearTimeout(simulatedSearchDelayTimeout);
    simulatedSearchDelayTimeout = null;
  }
  isSimulatedCallActive = false;

  if (currentSimulatedMetadataHandler && elements.remoteVideo) {
    elements.remoteVideo.removeEventListener(
      "loadedmetadata",
      currentSimulatedMetadataHandler,
    );
    currentSimulatedMetadataHandler = null;
  }

  const overlay =
    document.getElementById("searching-overlay") || elements.searchingOverlay;
  if (overlay) {
    overlay.style.display = "";
  }

  if (elements.remoteVideo) {
    try {
      elements.remoteVideo.pause();
      elements.remoteVideo.srcObject = null;
      elements.remoteVideo.removeAttribute("src");
      elements.remoteVideo.load();
    } catch (e) {}
  }
}

/**
 * Capture Local User Camera and Microphone
 */
async function initLocalMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true,
    });
    elements.localVideo.srcObject = localStream;

    // Remove permission overlay if previously shown
    const existingOverlay = document.getElementById("media-perm-overlay");
    if (existingOverlay) existingOverlay.remove();

    await detectCameraDevices();
    return true;
  } catch (err) {
    console.error("Camera/Mic Permission Error:", err);
    showMediaPermissionError();
    updateStatus("error", "Permission Denied");
    hideSearchingOverlay();
    return false;
  }
}

let videoDevices = [];
let currentCameraIndex = 0;

async function detectCameraDevices() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    const btnSwitch = document.getElementById("btn-switch-camera") || elements.btnSwitchCamera;
    if (btnSwitch) btnSwitch.classList.add("hidden");
    return;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    videoDevices = devices.filter((d) => d.kind === "videoinput");

    const btnSwitch = document.getElementById("btn-switch-camera") || elements.btnSwitchCamera;
    if (btnSwitch) {
      if (videoDevices.length > 1) {
        btnSwitch.classList.remove("hidden");
      } else {
        btnSwitch.classList.add("hidden");
      }
    }
  } catch (e) {
    const btnSwitch = document.getElementById("btn-switch-camera") || elements.btnSwitchCamera;
    if (btnSwitch) btnSwitch.classList.add("hidden");
  }
}

async function switchCamera() {
  if (videoDevices.length <= 1) {
    showShareToast("1 Camera detected on device (Front/Default)");
    return;
  }

  currentCameraIndex = (currentCameraIndex + 1) % videoDevices.length;
  const targetDevice = videoDevices[currentCameraIndex];

  try {
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: targetDevice.deviceId } },
      audio: true,
    });

    const videoTrack = newStream.getVideoTracks()[0];
    if (localStream && videoTrack) {
      const oldTrack = localStream.getVideoTracks()[0];
      if (oldTrack) {
        localStream.removeTrack(oldTrack);
        oldTrack.stop();
      }
      localStream.addTrack(videoTrack);
      if (elements.localVideo) elements.localVideo.srcObject = localStream;

      if (currentCall && currentCall.peerConnection) {
        const senders = currentCall.peerConnection.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        }
      }
    }
    showShareToast(`Switched to: ${targetDevice.label || "Camera " + (currentCameraIndex + 1)}`);
  } catch (e) {
    console.warn("Failed to switch camera device:", e);
    showShareToast("Could not switch camera device.");
  }
}

function showMediaPermissionError() {
  const container = document.getElementById("local-pip-container");
  if (!container) return;

  let existingOverlay = document.getElementById("media-perm-overlay");
  if (!existingOverlay) {
    existingOverlay = document.createElement("div");
    existingOverlay.id = "media-perm-overlay";
    existingOverlay.className = "media-perm-overlay";
    existingOverlay.innerHTML = `
      <i class="fa-solid fa-video-slash"></i>
      <strong>Access Denied</strong>
      <span>Please allow camera & mic permissions in your browser.</span>
    `;
    container.appendChild(existingOverlay);
  }
}

/**
 * Automated Smart Matchmaking Lobby Protocol
 */
let currentSlotScanIndex = 1;
let lastConnectAttemptTime = 0;

function findAndConnectPeer() {
  const now = Date.now();
  if (now - lastConnectAttemptTime < 800) {
    console.warn("Throttling peer connection attempt - rate limit cooldown active.");
    return;
  }
  lastConnectAttemptTime = now;

  // Target slot 1 primary lobby (or current index) so 2 active users always land on the same slot
  const targetHostId = LOBBY_PREFIX + currentSlotScanIndex;

  // Create client Peer instance
  const tempClientId = "client-" + Math.floor(Math.random() * 1000000);
  previousTempClientId = tempClientId;

  peer = new Peer(tempClientId, STUN_CONFIG);

  peer.on("open", (id) => {
    myPeerId = id;
    console.log(
      "Registered Peer ID:",
      id,
      "Targeting Lobby Slot:",
      targetHostId,
    );

    // Attempt to call the target host slot
    connectToHostOrBecomeHost(targetHostId);
  });

  peer.on("call", (call) => {
    handleIncomingCall(call);
  });

  peer.on("connection", (conn) => {
    setupDataConnection(conn);
  });

  peer.on("error", (err) => {
    console.warn("PeerJS Error:", err);
    if (err.type === "peer-unavailable") {
      // Host slot is empty; become the waiting host!
      becomeWaitingHost(targetHostId);
    } else {
      updateStatus("error", "Connection error");
    }
  });
}

/**
 * Attempt connection to a host slot or register as host
 */
function connectToHostOrBecomeHost(hostId) {
  if ((peer && peer.id === hostId) || hostId === previousTempClientId) {
    console.warn("Self-connection prevented: current peer is already the host of this slot.");
    becomeWaitingHost(hostId);
    return;
  }

  // Try calling the host ID with session metadata
  const call = peer.call(hostId, localStream, {
    metadata: { sessionInstanceId: SESSION_INSTANCE_ID, callerId: peer.id }
  });

  let connected = false;

  call.on("stream", (remoteStream) => {
    connected = true;
    currentCall = call;
    onPeerConnected(remoteStream);
    monitorICEConnection(call);
  });

  // Establish P2P DataChannel for chat
  const conn = peer.connect(hostId, {
    metadata: { sessionInstanceId: SESSION_INSTANCE_ID, callerId: peer.id }
  });
  setupDataConnection(conn);

  // Track & manage host connection timeout
  if (hostConnectTimeout) {
    clearTimeout(hostConnectTimeout);
    hostConnectTimeout = null;
  }

  // If host doesn't respond within 800ms, become the waiting host
  hostConnectTimeout = setTimeout(() => {
    hostConnectTimeout = null;
    if (!connected && currentCall !== call) {
      call.close();
      becomeWaitingHost(hostId);
    }
  }, 800);
}

/**
 * Register current peer as the waiting Host on a public slot
 */
function becomeWaitingHost(hostId) {

  if (chatConn) {
    try {
      chatConn.close();
    } catch (e) {}
    chatConn = null;
  }

  if (peer && !peer.destroyed) {
    previousTempClientId = peer.id;
    peer.destroy();
  }

  // Initialize peer with the host slot ID
  peer = new Peer(hostId, STUN_CONFIG);

  peer.on("open", (id) => {
    myPeerId = id;
    console.log("Waiting as Host on slot:", id);
    updateStatus("searching", "Waiting for a stranger to join...");
    showSearchingOverlay(
      "Waiting for a Stranger...",
      "You are in the waiting queue. A peer will connect shortly.",
    );

    // Synchronized simulated video fallback with 5.0s radar countdown dwell time
    if (simulatedFallbackTimeout) clearTimeout(simulatedFallbackTimeout);
    simulatedFallbackTimeout = setTimeout(() => {
      if (!currentCall) {
        playSimulatedStrangerVideo();
      }
    }, MIN_SEARCHING_DWELL_MS);
  });

  peer.on("call", (call) => {
    const callerSessionId = call.metadata && call.metadata.sessionInstanceId;
    const callerId = call.peer || (call.metadata && call.metadata.callerId);
    if (callerSessionId === SESSION_INSTANCE_ID || callerId === previousTempClientId || callerId === myPeerId) {
      console.warn("Self-call detected & blocked in becomeWaitingHost:", callerId);
      try { call.close(); } catch (e) {}
      return;
    }

    stopSimulatedStrangerVideo();
    call.answer(localStream);
    currentCall = call;

    call.on("stream", (remoteStream) => {
      onPeerConnected(remoteStream);
      monitorICEConnection(call);
    });
  });

  peer.on("connection", (conn) => {
    const callerSessionId = conn.metadata && conn.metadata.sessionInstanceId;
    const callerId = conn.peer || (conn.metadata && conn.metadata.callerId);
    if (callerSessionId === SESSION_INSTANCE_ID || callerId === previousTempClientId || callerId === myPeerId) {
      console.warn("Self DataConnection detected & blocked:", callerId);
      try { conn.close(); } catch (e) {}
      return;
    }
    setupDataConnection(conn);
  });

  peer.on("error", (err) => {
    console.warn("Host Slot Conflict, retrying another slot...", err);
    currentSlotScanIndex = (currentSlotScanIndex % TOTAL_SLOTS) + 1;
    if (retryMatchmakingTimeout) clearTimeout(retryMatchmakingTimeout);
    retryMatchmakingTimeout = setTimeout(findAndConnectPeer, 500);
  });

}

/**
 * Handle incoming WebRTC call
 */
function handleIncomingCall(call) {
  const callerSessionId = call.metadata && call.metadata.sessionInstanceId;
  const callerId = call.peer || (call.metadata && call.metadata.callerId);
  if (callerSessionId === SESSION_INSTANCE_ID || callerId === previousTempClientId || callerId === myPeerId) {
    console.warn("Self-call detected & blocked in handleIncomingCall:", callerId);
    try { call.close(); } catch (e) {}
    return;
  }

  stopSimulatedStrangerVideo();
  call.answer(localStream);
  currentCall = call;

  call.on("stream", (remoteStream) => {
    onPeerConnected(remoteStream);
    monitorICEConnection(call);
  });
}

let isAutoSearchingAfterSkip = false;


function onPeerSkippedUs() {
  if (isAutoSearchingAfterSkip) return;
  isAutoSearchingAfterSkip = true;

  appendSystemChatMessage(
    "Stranger has left or skipped. Auto-searching next stranger...",
  );
  updateStatus("searching", "Stranger skipped. Auto-searching...");
  showSearchingOverlay(
    "Stranger Skipped You",
    "Connecting you to the next stranger...",
  );

  cleanupCallState();

  setTimeout(() => {
    isAutoSearchingAfterSkip = false;
    handleStartOrNext();
  }, 400);
}

/**
 * Monitor WebRTC ICE Connection State for Disconnects & Reconnections
 */
function monitorICEConnection(call) {
  if (!call || !call.peerConnection) return;

  let iceDisconnectTimeout = null;

  call.peerConnection.oniceconnectionstatechange = () => {
    const state = call.peerConnection.iceConnectionState;
    console.log("ICE Connection State:", state);

    if (state === "connected" || state === "completed") {
      if (iceDisconnectTimeout) {
        clearTimeout(iceDisconnectTimeout);
        iceDisconnectTimeout = null;
      }
      hideSearchingOverlay();
      hideFirewallWarning();
      updateStatus("connected", "Connected with Stranger");
    } else if (state === "disconnected") {
      updateStatus("searching", "Reconnecting stranger...");
      if (!iceDisconnectTimeout) {
        iceDisconnectTimeout = setTimeout(() => {
          iceDisconnectTimeout = null;
          if (
            call.peerConnection &&
            call.peerConnection.iceConnectionState === "disconnected"
          ) {
            console.warn(
              "ICE disconnect timeout reached (4s). Auto-skipping to next stranger.",
            );
            if (!isAutoSearchingAfterSkip && !isSimulatedCallActive) {
              onPeerSkippedUs();
            }
          }
        }, 4000);
      }
    } else if (state === "failed" || state === "closed") {
      if (iceDisconnectTimeout) {
        clearTimeout(iceDisconnectTimeout);
        iceDisconnectTimeout = null;
      }
      if (!isAutoSearchingAfterSkip && !isSimulatedCallActive) {
        onPeerSkippedUs();
      }
    }
  };
}

/**
 * Triggered when P2P Connection & Video Stream are successfully established
 */
function onPeerConnected(remoteStream) {
  if (localStream && remoteStream) {
    const localTrack = localStream.getVideoTracks()[0] || localStream.getAudioTracks()[0];
    const remoteTrack = remoteStream.getVideoTracks()[0] || remoteStream.getAudioTracks()[0];
    if (localTrack && remoteTrack && localTrack.id === remoteTrack.id) {
      console.warn("Self-stream loop detected on remote stream! Dropping self-connection...");
      cleanupCallState();
      becomeWaitingHost(LOBBY_PREFIX + currentSlotScanIndex);
      return;
    }
  }

  stopSimulatedStrangerVideo();
  elements.remoteVideo.srcObject = remoteStream;
  elements.remoteVideo.muted = false; // Ensure unmuted audio for live P2P stream
  adjustVideoAspectFit();
  hideSearchingOverlay();
  hideFirewallWarning();
  updateStatus("connected", "Connected with Stranger");
  updateToolbarVisibility("connected");


  // Enable Chat Input
  elements.chatInput.disabled = false;
  elements.btnSendChat.disabled = false;

  // Trigger Psychological In-Call Adsterra Engine (15s Gate + Alternating Long/Short Jitter Gaps)
  startInCallAdsterraJitterEngine();

  // Start In-Call Control Toolbar Auto-Hider (Full Video UX)
  startInCallToolbarAutoHider();
}


/**
 * Setup WebRTC P2P DataConnection for Text Messaging
 */
function setupDataConnection(conn) {
  chatConn = conn;

  chatConn.on("open", () => {
    console.log("P2P Chat DataChannel open");
    elements.chatInput.disabled = false;
    elements.btnSendChat.disabled = false;
  });

  chatConn.on("data", (data) => {
    // Handle object payloads
    if (data && typeof data === "object") {
      if (data.type === "PEER_SKIPPED") {
        onPeerSkippedUs();
        return;
      }
      if (data.type === "PRIVACY_VIOLATION_ATTEMPT") {
        showPeerPrivacyViolationAlert(data.reason || "restricted_action");
        return;
      }
      if (data.type === "reaction") {
        spawnFloatingEmoji(data.emoji);
        return;
      }

    }

    if (typeof data === "string") {
      appendChatMessage(data, "received");

      // Increment unread badge if drawer is closed
      if (elements.chatDrawer.classList.contains("closed")) {
        unreadMessagesCount++;
        elements.unreadBadge.textContent = unreadMessagesCount;
        elements.unreadBadge.classList.remove("hidden");
      }
    }
  });

  chatConn.on("close", () => {
    elements.chatInput.disabled = true;
    elements.btnSendChat.disabled = true;
    appendSystemChatMessage("Stranger disconnected from chat.");
    if (!isAutoSearchingAfterSkip && !isSimulatedCallActive && currentCall) {
      onPeerSkippedUs();
    }
  });
}

/**
 * Interactive Floating Emoji Reaction Engine (Emoji Rain)
 */
function toggleEmojiBar() {
  const bar = document.getElementById("emoji-reaction-bar");
  if (!bar) return;
  const isClosed = bar.classList.contains("closed");
  if (isClosed) {
    bar.classList.remove("closed");
  } else {
    bar.classList.add("closed");
  }
}

function spawnFloatingEmoji(emojiSymbol) {
  const viewport = document.querySelector(".video-viewport");
  if (!viewport) return;

  const count = Math.floor(Math.random() * 3) + 4;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      const particle = document.createElement("div");
      particle.className = "floating-emoji-particle";
      particle.textContent = emojiSymbol;

      const startLeft = Math.floor(Math.random() * 70) + 15;
      const driftX = (Math.random() * 140 - 70) + "px";
      const rotDeg = (Math.random() * 40 - 20) + "deg";

      particle.style.left = `${startLeft}%`;
      particle.style.setProperty("--drift-x", driftX);
      particle.style.setProperty("--rot-deg", rotDeg);

      viewport.appendChild(particle);

      particle.addEventListener("animationend", () => {
        particle.remove();
      });
    }, i * 130);
  }
}

function sendEmojiReaction(emojiSymbol) {
  // Auto-hide emoji reaction bar when an emoji is selected
  const bar = document.getElementById("emoji-reaction-bar");
  if (bar) {
    bar.classList.add("closed");
  }

  spawnFloatingEmoji(emojiSymbol);

  if (chatConn && chatConn.open) {
    try {
      chatConn.send({ type: "reaction", emoji: emojiSymbol });
    } catch (e) {}
  }

  // Simulated Call Counter-Reaction: Stranger echoes back the EXACT SAME emoji selected by user!
  if (isSimulatedCallActive && !currentCall) {
    const delay = Math.floor(Math.random() * 800) + 1200;
    setTimeout(() => {
      if (isSimulatedCallActive && !currentCall) {
        spawnFloatingEmoji(emojiSymbol);
      }
    }, delay);
  }
}

/**
 * Real-Time Live Video Beautification Shader Engine (Studio Cinema Matrix)
 */
const BEAUTY_MODES = ["studio", "glow", "warm", "glass", "off"];
let beautyIntensityPercent = 85;

function applyBeautyFilter(mode) {
  const localVid = document.getElementById("local") || elements.localVideo;
  const remoteVid = document.getElementById("remote") || elements.remoteVideo;
  const btnBeauty = document.getElementById("btn-beauty-filter");
  const viewport = document.querySelector(".video-viewport");

  BEAUTY_MODES.forEach((m) => {
    if (localVid) localVid.classList.remove(`beauty-${m}`);
    if (remoteVid) remoteVid.classList.remove(`beauty-${m}`);
  });

  if (mode !== "off") {
    if (localVid) localVid.classList.add(`beauty-${mode}`);
    if (remoteVid) remoteVid.classList.add(`beauty-${mode}`);
    if (btnBeauty) btnBeauty.classList.add("beauty-active");
    if (viewport) viewport.classList.add("beauty-active");
  } else {
    if (localVid) localVid.classList.add("beauty-off");
    if (remoteVid) remoteVid.classList.add("beauty-off");
    if (btnBeauty) btnBeauty.classList.remove("beauty-active");
    if (viewport) viewport.classList.remove("beauty-active");
  }

  updateBeautyIntensity(beautyIntensityPercent);
  localStorage.setItem("hashgang_beauty_mode", mode);
}

function toggleBeautySliderPopover(e) {
  if (e) e.stopPropagation();
  const popover = document.getElementById("beauty-slider-popover");
  if (!popover) return;
  popover.classList.toggle("closed");
}

function updateBeautyIntensity(val) {
  beautyIntensityPercent = parseInt(val, 10);
  const label = document.getElementById("beauty-val-label");
  if (label) label.textContent = `${beautyIntensityPercent}%`;

  const opacityVal = (beautyIntensityPercent / 100).toFixed(2);

  // Dynamically scale Virtual Ring Light & Shader Opacity
  const ringLight = document.getElementById("virtual-ring-light");
  if (ringLight) ringLight.style.opacity = (opacityVal * 0.9).toFixed(2);

  localStorage.setItem("hashgang_beauty_intensity", beautyIntensityPercent);
}

function cycleBeautyFilter() {
  currentBeautyIndex = (currentBeautyIndex + 1) % BEAUTY_MODES.length;
  const nextMode = BEAUTY_MODES[currentBeautyIndex];
  applyBeautyFilter(nextMode);
}

function initBeautyFilter() {
  const savedMode = localStorage.getItem("hashgang_beauty_mode") || "studio";
  const savedIntensity = localStorage.getItem("hashgang_beauty_intensity") || "85";
  beautyIntensityPercent = parseInt(savedIntensity, 10);

  const rangeInput = document.getElementById("beauty-intensity-range");
  if (rangeInput) rangeInput.value = beautyIntensityPercent;

  currentBeautyIndex = BEAUTY_MODES.indexOf(savedMode);
  if (currentBeautyIndex === -1) currentBeautyIndex = 0;
  applyBeautyFilter(BEAUTY_MODES[currentBeautyIndex]);
}

/**
 * Send P2P Text Message over DataChannel
 */
function sendChatMessage() {
  const input = document.getElementById("chat-input") || elements.chatInput;
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  if (chatConn && chatConn.open) {
    chatConn.send(text);
    appendChatMessage(text, "sent");
    input.value = "";
  } else {
    appendChatMessage(text, "sent");
    appendSystemChatMessage(
      "⚠️ Note: You are not connected to a stranger yet. Click 'Start Chat' to connect and chat!",
    );
    input.value = "";
  }
}

let chatInactivityTimer = null;

function triggerChatAutoFade() {
  const container = document.getElementById("chat-drawer") || elements.chatDrawer;
  if (!container) return;

  container.style.opacity = "1";

  if (chatInactivityTimer) clearTimeout(chatInactivityTimer);

  chatInactivityTimer = setTimeout(() => {
    if (container && !container.classList.contains("closed")) {
      container.style.opacity = "0.45";
    }
  }, 6000);
}

/**
 * Append chat message bubble to drawer UI
 */
function appendChatMessage(text, type) {
  const msgEl = document.createElement("div");
  msgEl.className = `chat-msg ${type}`;
  msgEl.textContent = text;
  elements.chatMessages.appendChild(msgEl);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
  triggerChatAutoFade();
}

function appendSystemChatMessage(text) {
  // Suppress system/info messages as requested (only display user text messages)
  return;
}

/**
 * Toggle Audio Mute
 */
function toggleAudio() {
  isAudioMuted = !isAudioMuted;
  if (localStream) {
    localStream.getAudioTracks().forEach((t) => (t.enabled = !isAudioMuted));
  }

  const btnMute = elements.btnMute || document.getElementById("btn-mute");
  if (btnMute) {
    btnMute.classList.toggle("muted", isAudioMuted);
    btnMute.innerHTML = isAudioMuted
      ? '<i class="fa-solid fa-microphone-slash"></i>'
      : '<i class="fa-solid fa-microphone"></i>';
  }
}

/**
 * Toggle Video Camera
 */
function toggleVideo() {
  isVideoOff = !isVideoOff;
  if (localStream) {
    localStream.getVideoTracks().forEach((t) => (t.enabled = !isVideoOff));
  }

  const btnVideo = elements.btnVideo || document.getElementById("btn-video");
  if (btnVideo) {
    btnVideo.classList.toggle("off", isVideoOff);
    btnVideo.innerHTML = isVideoOff
      ? '<i class="fa-solid fa-video-slash"></i>'
      : '<i class="fa-solid fa-video"></i>';
  }

  const pipBtnVideo = document.getElementById("pip-btn-toggle-video");
  if (pipBtnVideo) {
    pipBtnVideo.classList.toggle("off", isVideoOff);
    pipBtnVideo.innerHTML = isVideoOff
      ? '<i class="fa-solid fa-video-slash"></i>'
      : '<i class="fa-solid fa-video"></i>';
  }
}

/**
 * Report & Block Current Stranger
 */
function reportAndBlockStranger() {
  if (currentCall && currentCall.peer) {
    const blockedPeerId = currentCall.peer;
    try {
      const blocked = JSON.parse(
        localStorage.getItem("p2p_blocked_peers") || "[]",
      );
      if (!blocked.includes(blockedPeerId)) {
        blocked.push(blockedPeerId);
        localStorage.setItem("p2p_blocked_peers", JSON.stringify(blocked));
      }
    } catch (e) {}
  }

  updateStatus("error", "Stranger reported & blocked");
  cleanupCallState();
  handleStartOrNext();
}

/**
 * Toggle Chat Sidebar Drawer
 */
function toggleChatDrawer() {
  const drawer = document.getElementById("chat-drawer") || elements.chatDrawer;
  if (!drawer) return;

  const isClosed = drawer.classList.contains("closed");
  if (isClosed) {
    drawer.classList.remove("closed");
    drawer.classList.add("open");
    unreadMessagesCount = 0;
    const badge =
      document.getElementById("unread-badge") || elements.unreadBadge;
    if (badge) badge.classList.add("hidden");
    const input = document.getElementById("chat-input") || elements.chatInput;
    if (input) input.focus();
  } else {
    drawer.classList.add("closed");
    drawer.classList.remove("open");
  }
}

/**
 * Update Floating Control Toolbar Contextual Visibility
 * States: 'idle', 'searching', 'connected'
 */
function updateToolbarVisibility(state) {
  if (state === "idle") {
    if (elements.btnReport) elements.btnReport.classList.add("hidden");
    if (elements.btnStop) elements.btnStop.classList.add("hidden");
    elements.btnNextLabel.textContent = "Start Chat";
  } else if (state === "searching") {
    if (elements.btnReport) elements.btnReport.classList.add("hidden");
    if (elements.btnStop) elements.btnStop.classList.remove("hidden");
    elements.btnNextLabel.textContent = "Next Stranger";
  } else if (state === "connected") {
    if (elements.btnReport) elements.btnReport.classList.remove("hidden");
    if (elements.btnStop) elements.btnStop.classList.remove("hidden");
    elements.btnNextLabel.textContent = "Next Stranger";
  }
}

/**
 * Disconnect and Stop Current Call (Releases Local Camera Stream)
 */
function stopCall() {
  cleanupCallState();

  // Stop & Release local user camera & mic stream tracks
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  if (elements.localVideo) {
    elements.localVideo.srcObject = null;
  }

  updateStatus("idle", "Click Start Chat to Connect");
  hideSearchingOverlay();
  hideFirewallWarning();
  updateToolbarVisibility("idle");
  if (elements.idleStageOverlay) elements.idleStageOverlay.classList.remove("hidden");
}

/**
 * Clean Call State & Peer Objects (No Page Reload)
 */
function cleanupCallState() {
  stopSimulatedStrangerVideo();
  stopInCallAdsterraJitterEngine();
  stopInCallToolbarAutoHider();


  if (hostConnectTimeout) {
    clearTimeout(hostConnectTimeout);
    hostConnectTimeout = null;
  }
  if (retryMatchmakingTimeout) {
    clearTimeout(retryMatchmakingTimeout);
    retryMatchmakingTimeout = null;
  }

  if (currentCall) {
    try {
      currentCall.close();
    } catch (e) {}
    currentCall = null;
  }

  if (chatConn) {
    try {
      chatConn.close();
    } catch (e) {}
    chatConn = null;
  }

  if (peer && !peer.destroyed) {
    try {
      peer.destroy();
    } catch (e) {}
    peer = null;
  }

  elements.remoteVideo.srcObject = null;

  // Wipe chat history cleanly for complete privacy across new stranger connections
  if (elements.chatMessages) {
    elements.chatMessages.innerHTML = "";
  }
  unreadMessagesCount = 0;
  elements.unreadBadge.classList.add("hidden");

  // Reset video swap state to normal mode
  isVideoSwapped = false;
  const viewport = document.querySelector(".video-viewport");
  if (viewport) {
    viewport.classList.remove("swapped");
  }
}

/**
 * UI Helper Functions
 */
function updateStatus(state, text) {
  if (elements.statusDot) elements.statusDot.className = `status-dot ${state}`;
  if (elements.statusText) elements.statusText.textContent = text;
}

let searchingOverlayStartTime = 0;
const MIN_SEARCHING_DWELL_MS = 5000; // 5.0s Guaranteed Impression Gate with Live Countdown
let searchingCountdownInterval = null;

function renderSearchingAdsterraBanner() {
  const box = document.getElementById("searching-adsterra-banner-container");
  if (!box) return;
  renderMediationAdInContainer(box);
}


function showSearchingOverlay(title, sub) {
  elements.overlayTitle.textContent = title;
  elements.overlaySub.textContent =
    sub ||
    `Connecting you to 1 stranger among ${currentOnlineUsersCount.toLocaleString()} online strangers worldwide...`;

  // If Searching Overlay is ALREADY visible, update text without restarting 5s countdown or ad banner
  if (!elements.searchingOverlay.classList.contains("hidden")) {
    return;
  }

  searchingOverlayStartTime = Date.now();
  elements.searchingOverlay.classList.remove("hidden");

  // Stop & pause background video while radar searching overlay is active
  if (elements.remoteVideo && !elements.remoteVideo.srcObject) {
    try {
      elements.remoteVideo.pause();
      elements.remoteVideo.removeAttribute("src");
      elements.remoteVideo.load();
    } catch (e) {}
  }

  // Live 5s -> 1s Countdown Timer Ticker
  let countdownSec = 5;
  const numSpan = document.getElementById("countdown-num");
  if (numSpan) numSpan.textContent = countdownSec;

  if (searchingCountdownInterval) clearInterval(searchingCountdownInterval);
  searchingCountdownInterval = setInterval(() => {
    countdownSec--;
    if (numSpan) numSpan.textContent = Math.max(1, countdownSec);
    if (countdownSec <= 1) {
      clearInterval(searchingCountdownInterval);
      searchingCountdownInterval = null;
    }
  }, 1000);

  // Render Adsterra Banner synchronously at 0ms for maximum 5.0s screen time
  renderSearchingAdsterraBanner();
}

function hideSearchingOverlay() {
  if (searchingCountdownInterval) {
    clearInterval(searchingCountdownInterval);
    searchingCountdownInterval = null;
  }

  const elapsed = Date.now() - searchingOverlayStartTime;
  const remaining = MIN_SEARCHING_DWELL_MS - elapsed;

  if (remaining > 0) {
    setTimeout(() => {
      elements.searchingOverlay.classList.add("hidden");
    }, remaining);
  } else {
    elements.searchingOverlay.classList.add("hidden");
  }
}

function showFirewallWarning() {
  elements.firewallBanner.classList.remove("hidden");
}

function hideFirewallWarning() {
  elements.firewallBanner.classList.add("hidden");
}

/**
 * Stranger Chat Backend API Telemetry & Analytics Integration
 */
function getVisitorId() {
  let vid = localStorage.getItem("sc_visitor_id");
  if (!vid) {
    vid =
      "v_" +
      Math.random().toString(36).substring(2, 11) +
      Date.now().toString(36);
    localStorage.setItem("sc_visitor_id", vid);
  }
  return vid;
}

async function recordVisitBackend() {
  if (typeof BACKEND_API_BASE === "undefined") return;
  try {
    const visitorId = getVisitorId();
    const device = window.innerWidth <= 768 ? "mobile" : "desktop";
    fetch(`${BACKEND_API_BASE}/analytics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, country: "UNKNOWN", device }),
    }).catch((e) => {});
  } catch (e) {}
}

async function recordSessionTimeBackend(durationSeconds = 30) {
  if (typeof BACKEND_API_BASE === "undefined") return;
  try {
    const visitorId = getVisitorId();
    fetch(`${BACKEND_API_BASE}/analytics/session-time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        durationSeconds,
      }),
    }).catch((e) => {});
  } catch (e) {}
}

async function fetchActiveUsersBackend() {
  if (typeof BACKEND_API_BASE === "undefined") return;
  try {
    const res = await fetch(`${BACKEND_API_BASE}/active-users`);
    const data = await res.json();
    if (data && data.success && typeof data.activeUsers === "number") {
      updateOnlineUsersDisplay(data.activeUsers);
    }
  } catch (e) {
    // If backend server is offline during dev/test, fallback gracefully to 1
    updateOnlineUsersDisplay(1);
  }
}

async function fetchSelfBrandAdsFromBackend() {
  if (typeof BACKEND_API_BASE === "undefined") return;
  try {
    const res = await fetch(`${BACKEND_API_BASE}/ads`);
    const data = await res.json();
    if (data && data.success && Array.isArray(data.ads)) {
      SELF_BRAND_ADS_POOL = data.ads;
      console.log("Self-brand ads pool synced from MongoDB DB:", SELF_BRAND_ADS_POOL.length, "active ads");
    } else {
      SELF_BRAND_ADS_POOL = [];
    }
  } catch (e) {
    SELF_BRAND_ADS_POOL = [];
  }

  // Sync dynamic ad mediation config from backend API if available
  try {
    fetch(`${BACKEND_API_BASE}/ads/mediation-config`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.config) {
          window.AD_MEDIATION_CONFIG = data.config;
          console.log("Ad mediation config synced dynamically from backend server");
        }
      })
      .catch((e) => {});
  } catch (e) {}
}



async function recordAdImpressionBackend(
  adConfig,
  durationWatched = 0,
  completedFull = false,
  skipped = false,
  clickedCta = false,
  totalTimeSpent = 0,
  pauseCount = 0,
  rewindCount = 0,
  maxTimeWatched = 0
) {
  if (typeof BACKEND_API_BASE === "undefined" || !adConfig) return;
  try {
    const visitorId = getVisitorId();
    const device = window.innerWidth <= 768 ? "mobile" : "desktop";
    const adId = adConfig.adId || adConfig.id || "brand-ad-unknown";

    fetch(`${BACKEND_API_BASE}/ad-impression`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adId,
        country: "UNKNOWN",
        device,
        durationWatched: Math.round(durationWatched),
        completedFull,
        skipped,
        clickedCta,
        visitorId,
        totalTimeSpent: Math.round(totalTimeSpent || durationWatched),
        pauseCount,
        rewindCount,
        maxTimeWatched: Math.round(maxTimeWatched || durationWatched),
      }),
    }).catch((e) => console.warn("Ad impression API notice:", e));
  } catch (e) {}
}


function updateOnlineUsersDisplay(count) {
  currentOnlineUsersCount = Math.max(1, count);
  const badgeEl = document.getElementById("online-users-badge");

  if (currentOnlineUsersCount < 700) {
    if (badgeEl) {
      badgeEl.classList.add("hidden");
      badgeEl.style.setProperty("display", "none", "important");
    }
  } else {
    if (badgeEl) {
      badgeEl.classList.remove("hidden");
      badgeEl.style.setProperty("display", "inline-flex", "important");
    }
    if (elements.onlineUsersCount) {
      elements.onlineUsersCount.textContent =
        currentOnlineUsersCount.toLocaleString();
    }
  }
}



/**
 * Dynamic Waterfall Ad Mediation Engine (N-Providers Support + Self-Brand Fallback)
 */
function getTodayMediationStorageKey() {
  const today = new Date().toISOString().slice(0, 10);
  const targetKey = `sc_mediation_tracker_${today}`;
  
  // Cleanup old mediation tracking keys from previous days
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sc_mediation_tracker_") && k !== targetKey) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {}

  return targetKey;
}

function getMediationDailyTracker() {
  try {
    const data = localStorage.getItem(getTodayMediationStorageKey());
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

function incrementMediationImpressionCount(providerId) {
  try {
    const key = getTodayMediationStorageKey();
    const tracker = getMediationDailyTracker();
    tracker[providerId] = (tracker[providerId] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(tracker));
  } catch (e) {}
}

let isAdBlockerDetected = false;

/**
 * Universal Browser-Agnostic AdBlocker Detector
 * Checks DOM trap element hiding (used by Brave, uBlock, AdGuard, ABP).
 */
function runUniversalAdBlockerProbe() {
  try {
    const trap = document.createElement("div");
    trap.className = "adsbygoogle ad-banner ad-unit google-ad sponsor-ad";
    trap.style.position = "absolute";
    trap.style.top = "-9999px";
    trap.style.left = "-9999px";
    trap.style.height = "1px";
    trap.style.width = "1px";
    document.body.appendChild(trap);

    setTimeout(() => {
      if (
        trap.offsetHeight === 0 ||
        trap.clientWidth === 0 ||
        window.getComputedStyle(trap).display === "none" ||
        window.getComputedStyle(trap).visibility === "hidden"
      ) {
        isAdBlockerDetected = true;
      }
      try { trap.remove(); } catch (e) {}
    }, 200);
  } catch (e) {}
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runUniversalAdBlockerProbe);
} else {
  runUniversalAdBlockerProbe();
}

function renderSelfBrandCard(containerBox) {
  if (!containerBox) return;
  const config = window.AD_MEDIATION_CONFIG;
  const sb = (config && config.selfBrandFallback) || {
    title: "MyLeader AI Platform",
    desc: "Streamline leadership workflows & team collaboration with AI.",
    linkUrl: "https://hashgang.com",
    ctaText: "Explore MyLeader 🚀",
    badgeText: "FEATURED PROMOTION"
  };

  containerBox.innerHTML = "";
  containerBox.classList.remove("hidden", "fading-out");

  const card = document.createElement("div");
  card.className = "mediation-self-brand-card";
  card.innerHTML = `
    <span class="mediation-self-brand-badge">${sb.badgeText || "FEATURED PROMOTION"}</span>
    <h4 class="mediation-self-brand-title">${sb.title}</h4>
    <p class="mediation-self-brand-desc">${sb.desc}</p>
    <a href="${sb.linkUrl}" target="_blank" rel="noopener noreferrer" class="mediation-self-brand-cta">
      <span>${sb.ctaText}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
      </svg>
    </a>
  `;
  containerBox.appendChild(card);
}

function selectWaterfallAdProvider() {
  const config = window.AD_MEDIATION_CONFIG;
  if (!config) return null;

  // If AdBlocker / Brave is detected, bypass third-party ads and serve self-brand internal promotion directly!
  if (isAdBlockerDetected) {
    if (config.selfBrandFallback && config.selfBrandFallback.enabled !== false) {
      return { type: "selfBrandFallback", data: config.selfBrandFallback };
    }
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  // If localhost and skipOnLocalhost is enabled, bypass paid third-party ads and serve self-brand fallback directly
  if (isLocalhost && config.settings && config.settings.skipOnLocalhost) {
    if (config.selfBrandFallback && config.selfBrandFallback.enabled !== false) {
      return { type: "selfBrandFallback", data: config.selfBrandFallback };
    }
    return null;
  }

  const tracker = getMediationDailyTracker();
  const providers = config.providers || [];

  // Dynamically loop through N providers (Index 0 to N-1)
  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    if (p && p.enabled !== false) {
      const userDailyCount = tracker[p.id] || 0;
      if (userDailyCount < p.dailyCapPerUser) {
        return { type: "provider", data: p };
      }
    }
  }

  // All N paid providers exhausted or disabled -> Fallback to Self-Brand Promotion!
  if (config.selfBrandFallback && config.selfBrandFallback.enabled !== false) {
    return { type: "selfBrandFallback", data: config.selfBrandFallback };
  }

  return null;
}

function renderMediationAdInContainer(containerBox) {
  if (!containerBox) return;
  containerBox.innerHTML = "";

  const selection = selectWaterfallAdProvider();
  if (!selection) {
    containerBox.classList.add("hidden");
    return;
  }

  containerBox.classList.remove("hidden", "fading-out");

  if (selection.type === "provider") {
    const p = selection.data;
    incrementMediationImpressionCount(p.id);

    try {
      const iframe = document.createElement("iframe");
      iframe.style.width = `${p.width || 300}px`;
      iframe.style.height = `${p.height || 250}px`;
      iframe.style.border = "none";
      iframe.style.overflow = "hidden";
      iframe.style.borderRadius = "8px";
      iframe.style.background = "transparent";
      iframe.scrolling = "no";

      const htmlString = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: transparent; color: #fff; overflow: hidden; height: 100vh; font-family: sans-serif; }</style>
          </head>
          <body>
            <script type="text/javascript">
              atOptions = {
                'key' : '${p.invokeKey}',
                'format' : 'iframe',
                'height' : ${p.height || 250},
                'width' : ${p.width || 300},
                'params' : {}
              };
            </script>
            <script type="text/javascript" src="${p.scriptUrl}"></script>
          </body>
        </html>
      `;

      if ("srcdoc" in iframe) {
        iframe.srcdoc = htmlString;
      }
      containerBox.appendChild(iframe);

      if (!("srcdoc" in iframe) && iframe.contentWindow) {
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(htmlString);
        doc.close();
      }
    } catch (e) {
      console.warn("Mediation ad render notice:", e);
    }
  } else if (selection.type === "selfBrandFallback") {
    renderSelfBrandCard(containerBox);
  }
}

let inCallAdsterraTimer = null;
let inCallAdsterraHideTimer = null;

/**
 * Show Live In-Call Adsterra Sponsored Banner Overlay (Auto-disappears after 4.0s viewability threshold)
 */
function showInCallAdsterraBanner() {
  hideInCallAdsterraBanner();

  const bannerBox = document.getElementById("incall-adsterra-banner-container");
  if (!bannerBox) return;

  renderMediationAdInContainer(bannerBox);

  // Impression Record & Disappear: Auto-hide after 4.0s viewability threshold
  inCallAdsterraHideTimer = setTimeout(() => {
    hideInCallAdsterraBanner();
  }, 4000);
}


function hideInCallAdsterraBanner() {
  if (inCallAdsterraHideTimer) {
    clearTimeout(inCallAdsterraHideTimer);
    inCallAdsterraHideTimer = null;
  }
  const bannerBox = document.getElementById("incall-adsterra-banner-container");
  if (bannerBox) {
    bannerBox.classList.add("hidden");
    bannerBox.innerHTML = "";
  }
}

/**
 * Standardized Synchronized In-Call Adsterra Schedule:
 * - 1st Ad: Displays 15 seconds after call starts (Disappears after 4s impression dwell).
 * - Subsequent Ads: Displays every 60 seconds thereafter (Disappears after 4s impression dwell).
 */
function startInCallAdsterraJitterEngine() {
  stopInCallAdsterraJitterEngine();

  // First Ad at 15 Seconds
  inCallAdsterraTimer = setTimeout(() => {
    showInCallAdsterraBanner();

    // Subsequent Ads Every 60 Seconds
    inCallAdsterraTimer = setInterval(() => {
      showInCallAdsterraBanner();
    }, 60000);
  }, 15000);
}

function stopInCallAdsterraJitterEngine() {
  if (inCallAdsterraTimer) {
    clearTimeout(inCallAdsterraTimer);
    clearInterval(inCallAdsterraTimer);
    inCallAdsterraTimer = null;
  }
  hideInCallAdsterraBanner();
}

/**
 * In-Call Toolbar Auto-Hiding (Full Video UX)
 */
let inCallToolbarAutoHideTimer = null;

function startInCallToolbarAutoHider() {
  resetInCallToolbarAutoHide();
  window.addEventListener("mousemove", resetInCallToolbarAutoHide);
  window.addEventListener("touchstart", resetInCallToolbarAutoHide);
  window.addEventListener("touchmove", resetInCallToolbarAutoHide);
}

function stopInCallToolbarAutoHider() {
  if (inCallToolbarAutoHideTimer) {
    clearTimeout(inCallToolbarAutoHideTimer);
    inCallToolbarAutoHideTimer = null;
  }
  window.removeEventListener("mousemove", resetInCallToolbarAutoHide);
  window.removeEventListener("touchstart", resetInCallToolbarAutoHide);
  window.removeEventListener("touchmove", resetInCallToolbarAutoHide);
  if (elements.controlToolbar) {
    elements.controlToolbar.classList.remove("autohidden");
  }
}

function resetInCallToolbarAutoHide() {
  if (elements.controlToolbar) {
    elements.controlToolbar.classList.remove("autohidden");
  }
  if (inCallToolbarAutoHideTimer) {
    clearTimeout(inCallToolbarAutoHideTimer);
  }
  if (currentCall || isSimulatedCallActive) {
    inCallToolbarAutoHideTimer = setTimeout(() => {
      if ((currentCall || isSimulatedCallActive) && elements.controlToolbar) {
        elements.controlToolbar.classList.add("autohidden");
      }
    }, 3500);
  }
}

/**
 * User Anonymity & P2P Real-Time Privacy Security Suite
 */

let userViolationStrikeCount = 0;
let userMatchmakingCooldownTimer = null;
let isUserOnCooldown = false;
let traceIdSessionKey = null;

function getSessionTraceId() {
  if (!traceIdSessionKey) {
    traceIdSessionKey = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  return traceIdSessionKey;
}

function updateWatermarkDisplay() {
  const traceEl = document.getElementById("watermark-trace-id");
  if (traceEl) {
    traceEl.textContent = getSessionTraceId();
  }
}

function broadcastPrivacyViolationToPeer(reason = "restricted_action") {
  userViolationStrikeCount++;

  if (chatConn && chatConn.open) {
    try {
      chatConn.send({ type: "PRIVACY_VIOLATION_ATTEMPT", reason });
    } catch (e) {}
  }

  // 3-Strike Auto-Disconnect Penalty for Repeat Violators
  if (userViolationStrikeCount >= 3) {
    userViolationStrikeCount = 0;
    triggerViolationCooldownPenalty();
  }
}

function triggerViolationCooldownPenalty() {
  isUserOnCooldown = true;
  cleanupCallState();
  updateStatus("error", "Call ended due to repeated security violation attempts");

  const modal = document.getElementById("privacy-violation-alert-modal");
  if (modal) {
    modal.className = "privacy-violation-alert-modal";
    modal.innerHTML = `
      <div class="privacy-violation-toast-text">
        ⛔ Call ended due to multiple restricted actions. Please respect stranger privacy. 60s cooldown active.
      </div>
    `;
    setTimeout(() => {
      modal.classList.add("hidden");
    }, 6000);
  }

  if (userMatchmakingCooldownTimer) clearTimeout(userMatchmakingCooldownTimer);
  userMatchmakingCooldownTimer = setTimeout(() => {
    isUserOnCooldown = false;
    updateStatus("idle", "Cooldown complete. Click Start Chat to connect");
  }, 60000);
}

function showPeerPrivacyViolationAlert(reason = "restricted_action") {
  const modal = document.getElementById("privacy-violation-alert-modal");
  if (!modal) return;

  modal.className = "privacy-violation-alert-modal";
  modal.innerHTML = `
    <div class="privacy-violation-toast-text">
      🔒 Privacy Notice: Stranger attempted a restricted action. You can skip if uncomfortable.
    </div>
    <button class="privacy-violation-toast-btn" onclick="handleStartOrNext()">Skip Peer ⏭️</button>
  `;

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 7000);
}

function initAntiScreenRecording() {
  updateWatermarkDisplay();

  // Focus Loss & Tab Switch Privacy Shield
  const shield = document.getElementById("privacy-shield-overlay");

  function handleFocusLoss() {
    if ((currentCall || isSimulatedCallActive) && shield) {
      shield.classList.remove("hidden");
      if (elements.remoteVideo) {
        elements.remoteVideo.muted = true;
      }
      broadcastPrivacyViolationToPeer("tab_switch_focus_loss");
    }
  }

  function handleFocusGain() {
    if (shield) {
      shield.classList.add("hidden");
      if (elements.remoteVideo && !isAudioMuted) {
        elements.remoteVideo.muted = false;
      }
    }
  }

  window.addEventListener("blur", handleFocusLoss);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      handleFocusLoss();
    } else {
      handleFocusGain();
    }
  });
  window.addEventListener("focus", handleFocusGain);
}

function initAntiDevToolsProtection() {
  document.addEventListener("contextmenu", (e) => {
    if (currentCall || isSelfBrandAdPlaying) {
      e.preventDefault();
      broadcastPrivacyViolationToPeer("right_click");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (currentCall || isSelfBrandAdPlaying) {
      const key = e.key ? e.key.toLowerCase() : "";
      if (
        key === "f12" ||
        (e.ctrlKey && e.shiftKey && (key === "i" || key === "j" || key === "c")) ||
        (e.ctrlKey && key === "u")
      ) {
        e.preventDefault();
        broadcastPrivacyViolationToPeer("shortcut_key_" + key);
      }
    }
  });
}

function initScreenCaptureInterception() {
  if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
    const origGetDisplayMedia = navigator.mediaDevices.getDisplayMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getDisplayMedia = function (...args) {
      broadcastPrivacyViolationToPeer("screen_capture_api");
      return Promise.reject(new Error("Screen capture disabled on #GANG Chat for user privacy."));
    };
  }
}

// Expose Chat & Camera & Emoji & Audio handlers globally on window object for HTML inline onclick attributes
window.toggleAudio = toggleAudio;
window.toggleVideo = toggleVideo;
window.stopCall = stopCall;
window.reportAndBlockStranger = reportAndBlockStranger;
window.toggleChatDrawer = toggleChatDrawer;
window.sendChatMessage = sendChatMessage;
window.switchCamera = switchCamera;
window.toggleVideoSwap = toggleVideoSwap;
window.toggleEmojiBar = toggleEmojiBar;
window.sendEmojiReaction = sendEmojiReaction;
window.cycleBeautyFilter = cycleBeautyFilter;
window.toggleBeautySliderPopover = toggleBeautySliderPopover;
window.updateBeautyIntensity = updateBeautyIntensity;
window.handleStartOrNext = handleStartOrNext;

/**
 * In-App Viral Referral & Sharing Engine
 */
function handleShareInvite() {
  openShareModal();
}

function openShareModal() {
  const modal = document.getElementById("share-modal");
  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeShareModal(event) {
  if (event && event.target && event.target.classList.contains("share-modal-card")) {
    return;
  }
  const modal = document.getElementById("share-modal");
  if (modal) {
    modal.classList.add("hidden");
  }
}

async function copyInviteLink() {
  const shareUrl = "https://chat.hashgang.com";
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      const input = document.getElementById("share-link-input");
      if (input) {
        input.select();
        document.execCommand("copy");
      }
    }
    showShareToast("Invite link copied to clipboard! Share on WhatsApp or Telegram 🚀");
  } catch (err) {
    showShareToast("Copied: https://chat.hashgang.com");
  }
}

function shareToSocial(platform) {
  const shareText = encodeURIComponent("Hey! Try #GANG Chat - Free anonymous stranger video chat with AI beauty filter & zero login required! 🚀 Join here:");
  const shareUrl = encodeURIComponent("https://chat.hashgang.com");
  
  let targetUrl = "";
  if (platform === "whatsapp") {
    targetUrl = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`;
  } else if (platform === "telegram") {
    targetUrl = `https://t.me/share/url?url=${shareUrl}&text=${shareText}`;
  } else if (platform === "twitter") {
    targetUrl = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
  } else if (platform === "facebook") {
    targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
  }

  if (targetUrl) {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  }
}

function showShareToast(message) {
  const toast = document.getElementById("share-toast");
  const toastText = document.getElementById("share-toast-text");
  if (toast && toastText) {
    toastText.textContent = message;
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3500);
  }
}

/**
 * Mobile Soft-Keyboard Visual Viewport Engine
 */
function initVisualViewportHandler() {
  const chatInput = document.getElementById("chat-input");
  const chatDrawer = document.getElementById("chat-drawer") || elements.chatDrawer;

  if (!chatInput || !chatDrawer) return;

  const updateDrawerPosition = () => {
    if (!window.visualViewport) return;
    if (!chatDrawer.classList.contains("closed") && document.activeElement === chatInput) {
      const vv = window.visualViewport;
      const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop;
      if (keyboardHeight > 100) {
        chatDrawer.classList.add("keyboard-active");
        chatDrawer.style.bottom = `${keyboardHeight + 10}px`;
        chatDrawer.style.maxHeight = `${vv.height - 30}px`;
      }
    } else {
      chatDrawer.classList.remove("keyboard-active");
      chatDrawer.style.bottom = "";
      chatDrawer.style.maxHeight = "";
    }
  };

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", updateDrawerPosition);
    window.visualViewport.addEventListener("scroll", updateDrawerPosition);
  }

  chatInput.addEventListener("focus", () => {
    setTimeout(updateDrawerPosition, 100);
    const messages = document.getElementById("chat-messages") || elements.chatMessages;
    if (messages) messages.scrollTop = messages.scrollHeight;
  });

  chatInput.addEventListener("blur", () => {
    setTimeout(() => {
      chatDrawer.classList.remove("keyboard-active");
      chatDrawer.style.bottom = "";
      chatDrawer.style.maxHeight = "";
    }, 150);
  });
}

window.handleShareInvite = handleShareInvite;
window.openShareModal = openShareModal;
window.closeShareModal = closeShareModal;
window.copyInviteLink = copyInviteLink;
window.shareToSocial = shareToSocial;

document.addEventListener("DOMContentLoaded", () => {
  detectCameraDevices();
  initBeautyFilter();
  initAntiScreenRecording();
  initAntiDevToolsProtection();
  initScreenCaptureInterception();
  initVisualViewportHandler();
});


