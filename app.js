/**
 * Zero-Cost Decentralized P2P Omegle
 * Production-Ready WebRTC & PeerJS Matchmaking Engine
 */

// Application State
let peer = null;
let myPeerId = null;
let localStream = null;
let currentCall = null;
let chatConn = null;
let isAudioMuted = false;
let isVideoOff = false;
let unreadMessagesCount = 0;

// Native Sponsored Video Ads Config & Feature Flag
const ENABLE_SPONSORED_VIDEO_ADS = false; // Set to true when paying sponsor video ad clients are active
const AD_FREQUENCY = 5; // Trigger a sponsored video ad every 5th stranger match attempt when enabled
const AD_TIMEOUT_SECONDS = 8; // 8-second auto-skip countdown timer

let matchCounter = 0;
let isAdPlaying = false;
let adTimerInterval = null;
let hostConnectTimeout = null;
let retryMatchmakingTimeout = null;

const adsPool =
  typeof SPONSORED_ADS_POOL !== "undefined" && SPONSORED_ADS_POOL.length
    ? SPONSORED_ADS_POOL
    : [
        {
          id: "ad-1",
          title: "CyberShield High-Speed VPN",
          desc: "Encrypt your P2P video calls and protect your privacy worldwide.",
          videoUrl: "assets/ads/vpn_ad.mp4",
          linkUrl: "https://hashgang.com",
          badgeText: "FEATURED PARTNER",
        },
      ];

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

  // Poll active users count every 15 seconds
  setInterval(fetchActiveUsersBackend, 15000);

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

  // Anti-Bypass Check: If user refreshed page during an active ad break, resume ad break first!
  try {
    if (localStorage.getItem("sc_pending_ad_break") === "true") {
      console.log(
        "Interrupted ad break detected on reload. Resuming sponsored ad break...",
      );
      setTimeout(() => {
        playSponsoredVideoAd();
      }, 500);
    }
  } catch (e) {}
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

  try {
    if (elements.btnNext)
      elements.btnNext.addEventListener("click", handleStartOrNext);
  } catch (e) {}

  try {
    if (elements.btnStop) elements.btnStop.addEventListener("click", stopCall);
  } catch (e) {}

  try {
    if (elements.btnMute)
      elements.btnMute.addEventListener("click", toggleAudio);
  } catch (e) {}

  try {
    if (elements.btnVideo)
      elements.btnVideo.addEventListener("click", toggleVideo);
  } catch (e) {}

  try {
    if (elements.btnReport)
      elements.btnReport.addEventListener("click", reportAndBlockStranger);
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

  // Custom Ad Control Event Listeners
  try {
    if (elements.btnAdPlayPause)
      elements.btnAdPlayPause.addEventListener("click", toggleAdPlayPause);
  } catch (e) {}
  try {
    if (elements.btnAdRewind)
      elements.btnAdRewind.addEventListener("click", rewindAd5Seconds);
  } catch (e) {}
  try {
    if (elements.btnAdSkip)
      elements.btnAdSkip.addEventListener("click", skipAdAndProceed);
  } catch (e) {}
  try {
    if (elements.sponsoredCtaLink) {
      elements.sponsoredCtaLink.addEventListener("click", () => {
        if (isAdPlaying && currentAdConfig) {
          recordAdImpressionBackend(
            currentAdConfig.adId,
            adMaxWatchedTime,
            false,
            false,
            true,
          );
        }
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

  // Increment Match Counter for Frequency Control
  matchCounter++;

  // Trigger Native Sponsored Video Ad every N-th match (Skipped when feature flag is false)
  if (ENABLE_SPONSORED_VIDEO_ADS && matchCounter % AD_FREQUENCY === 0) {
    playSponsoredVideoAd();
    return;
  }

  elements.btnNextLabel.textContent = "Next Stranger";
  updateStatus("searching", "Searching for a Stranger...");
  updateToolbarVisibility("searching");
  showSearchingOverlay(
    "Searching for a Stranger...",
    "Connecting you to a random stranger worldwide...",
  );

  // Start automated zero-cost matchmaking
  findAndConnectPeer();
}

/**
 * Native Sponsored Video Ad Engine (Product & Architect Specification)
 */
let currentAdIndex = 0;
let adMaxWatchedTime = 0;
let currentAdConfig = null;

async function playSponsoredVideoAd() {
  isAdPlaying = true;
  adMaxWatchedTime = 0;
  hideSearchingOverlay();
  hideFirewallWarning();

  // Set Anti-Bypass Ad Lock in localStorage
  try {
    localStorage.setItem("sc_pending_ad_break", "true");
  } catch (e) {}

  // Select ad item sequentially using Round-Robin rotation
  let adItem = adsPool[currentAdIndex];
  currentAdIndex = (currentAdIndex + 1) % adsPool.length;

  // Check if adItem is a dynamic VAST XML Tag URL
  if (
    adItem &&
    adItem.videoUrl &&
    (adItem.videoUrl.endsWith(".xml") || adItem.isVast)
  ) {
    const vastConfig = await fetchAndParseVastAd(adItem.videoUrl);
    if (vastConfig) {
      adItem = vastConfig;
    }
  }

  currentAdConfig = adItem;

  // Update Ad Overlay Metadata Text & Links
  if (elements.sponsoredTitle)
    elements.sponsoredTitle.textContent = currentAdConfig.title;
  if (elements.sponsoredDesc)
    elements.sponsoredDesc.textContent = currentAdConfig.desc;
  if (elements.sponsoredBadgeText)
    elements.sponsoredBadgeText.textContent = currentAdConfig.badgeText;
  if (elements.sponsoredCtaLink)
    elements.sponsoredCtaLink.href = currentAdConfig.linkUrl;

  // Initialize Skip Button State
  updateSkipButtonState(0);

  // Show Ad Overlay Card & Hide Main Control Toolbar and Local PIP Feed
  if (elements.sponsoredOverlay)
    elements.sponsoredOverlay.classList.remove("hidden");
  if (elements.controlToolbar) elements.controlToolbar.classList.add("hidden");
  if (elements.localPipContainer)
    elements.localPipContainer.classList.add("hidden");

  // Setup Remote Video
  const video = elements.remoteVideo;
  video.srcObject = null;
  video.src = currentAdConfig.videoUrl;
  video.loop = false; // Video must play to end so ended event fires!
  video.muted = false; // Mute NOT allowed!

  // Attach Video Event Listeners
  video.addEventListener("timeupdate", handleAdTimeUpdate);
  video.addEventListener("seeking", handleAdSeeking);
  video.addEventListener("volumechange", handleAdVolumeChange);
  video.addEventListener("ended", handleAdEnded);

  video.play().catch((e) => console.warn("Video Ad Autoplay Notice:", e));

  if (elements.adPlayPauseIcon)
    elements.adPlayPauseIcon.className = "fa-solid fa-pause";
  updateStatus("connected", "Connected with Sponsored Partner");
  elements.btnNextLabel.textContent = "Next Stranger";
}

function handleAdTimeUpdate() {
  if (!isAdPlaying) return;
  const video = elements.remoteVideo;
  if (!video.duration) return;

  // 1. Anti-Forward Seeking Enforcement:
  // If user attempts to jump forward beyond highest watched time, force back to max watched time
  if (video.currentTime > adMaxWatchedTime + 0.5) {
    video.currentTime = adMaxWatchedTime;
    return;
  }

  // Track highest watched playback time
  if (video.currentTime > adMaxWatchedTime) {
    adMaxWatchedTime = video.currentTime;
  }

  // 2. Timeline Progress Bar & Time Display (00:04 / 00:15)
  const progressPercent = (video.currentTime / video.duration) * 100;
  if (elements.adProgressBar)
    elements.adProgressBar.style.width = `${progressPercent}%`;

  const currentFmt = formatTime(video.currentTime);
  const durationFmt = formatTime(video.duration);
  if (elements.adTimeDisplay)
    elements.adTimeDisplay.textContent = `${currentFmt} / ${durationFmt}`;

  // 3. Skip Threshold Evaluation
  updateSkipButtonState(video.currentTime);
}

function updateSkipButtonState(currentTime) {
  if (!currentAdConfig || !elements.btnAdSkip || !elements.adSkipText) return;

  const video = elements.remoteVideo;
  const videoDuration =
    video && video.duration && !isNaN(video.duration) ? video.duration : null;
  const rawThreshold = currentAdConfig.skipAfterSeconds;

  // Smart Edge Case Handling: If ad video duration is shorter than skip threshold (e.g. 6s video vs 10s skip),
  // treat it as a short unskippable ad that finishes naturally!
  let threshold = rawThreshold;
  if (
    videoDuration &&
    typeof rawThreshold === "number" &&
    videoDuration <= rawThreshold
  ) {
    threshold = null;
  }

  if (typeof threshold === "number" && threshold > 0) {
    const remainingToSkip = Math.ceil(threshold - currentTime);
    if (remainingToSkip > 0) {
      elements.btnAdSkip.disabled = true;
      elements.adSkipText.innerHTML = `Skip in ${remainingToSkip}s`;
    } else {
      elements.btnAdSkip.disabled = false;
      elements.adSkipText.innerHTML = `Skip Ad &nbsp;<i class="fa-solid fa-forward-step"></i>`;
    }
  } else {
    // Short / Full Duration Video Ad - Finish naturally
    elements.btnAdSkip.disabled = true;
    elements.adSkipText.innerHTML = `Ad plays full duration`;
  }
}

function handleAdSeeking() {
  if (!isAdPlaying) return;
  const video = elements.remoteVideo;
  // Block forward seek beyond adMaxWatchedTime
  if (video.currentTime > adMaxWatchedTime + 0.5) {
    video.currentTime = adMaxWatchedTime;
  }
}

function handleAdVolumeChange() {
  if (!isAdPlaying) return;
  // Enforce NO Muting allowed
  if (elements.remoteVideo.muted) {
    elements.remoteVideo.muted = false;
  }
}

function toggleAdPlayPause() {
  if (!isAdPlaying) return;
  const video = elements.remoteVideo;
  if (video.paused) {
    video.play();
    if (elements.adPlayPauseIcon)
      elements.adPlayPauseIcon.className = "fa-solid fa-pause";
  } else {
    video.pause();
    if (elements.adPlayPauseIcon)
      elements.adPlayPauseIcon.className = "fa-solid fa-play";
  }
}

function rewindAd5Seconds() {
  if (!isAdPlaying) return;
  const video = elements.remoteVideo;
  // Rewind 5 seconds (Backward seeking is allowed!)
  video.currentTime = Math.max(0, video.currentTime - 5);
}

function skipAdAndProceed() {
  if (!isAdPlaying) return;
  console.log("Skip Ad clicked! Transitioning directly to stranger search...");
  if (currentAdConfig) {
    recordAdImpressionBackend(
      currentAdConfig,
      adMaxWatchedTime,
      false,
      true,
      false,
    );
  }
  cleanupAdState();

  // Directly start searching for stranger (bypass handleStartOrNext matchCounter trigger)
  elements.btnNextLabel.textContent = "Next Stranger";
  updateStatus("searching", "Searching for a Stranger...");
  updateToolbarVisibility("searching");
  showSearchingOverlay(
    "Searching for a Stranger...",
    "Connecting you to a random stranger worldwide...",
  );
  findAndConnectPeer();
}

function handleAdEnded() {
  if (!isAdPlaying) return;
  console.log(
    "Ad video ended naturally. Transitioning directly to stranger search...",
  );
  if (currentAdConfig) {
    recordAdImpressionBackend(
      currentAdConfig,
      adMaxWatchedTime,
      true,
      false,
      false,
    );
  }
  cleanupAdState();

  // Directly start searching for stranger
  elements.btnNextLabel.textContent = "Next Stranger";
  updateStatus("searching", "Searching for a Stranger...");
  updateToolbarVisibility("searching");
  showSearchingOverlay(
    "Searching for a Stranger...",
    "Connecting you to a random stranger worldwide...",
  );
  findAndConnectPeer();
}

function cleanupAdState() {
  isAdPlaying = false;
  adMaxWatchedTime = 0;
  currentAdConfig = null;

  try {
    localStorage.removeItem("sc_pending_ad_break");
  } catch (e) {}

  const video = elements.remoteVideo;
  if (video) {
    video.removeEventListener("timeupdate", handleAdTimeUpdate);
    video.removeEventListener("seeking", handleAdSeeking);
    video.removeEventListener("volumechange", handleAdVolumeChange);
    video.removeEventListener("ended", handleAdEnded);
    try {
      video.pause();
      video.removeAttribute("src");
      video.load();
    } catch (e) {}
  }

  const adsterraBox = document.getElementById("adsterra-banner-container");
  if (adsterraBox) adsterraBox.innerHTML = "";

  if (elements.sponsoredOverlay)
    elements.sponsoredOverlay.classList.add("hidden");
  if (elements.controlToolbar)
    elements.controlToolbar.classList.remove("hidden");
  if (elements.localPipContainer)
    elements.localPipContainer.classList.remove("hidden");
  if (elements.adPlayPauseIcon)
    elements.adPlayPauseIcon.className = "fa-solid fa-pause";
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
  if (currentCall || isAdPlaying) return;

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
        if (!currentCall && !isAdPlaying) {
          playSimulatedStrangerVideo();
        }
      }, 5000);
      return;
    }
  }

  isSimulatedCallActive = true;
  hideSearchingOverlay();
  hideFirewallWarning();

  // Force hide searching overlay element so video is 100% visible on stage
  const overlay =
    document.getElementById("searching-overlay") || elements.searchingOverlay;
  if (overlay) {
    overlay.classList.add("hidden");
    overlay.style.display = "none";
  }

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
    if (isSimulatedCallActive && !currentCall && !isAdPlaying) {
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

    const duration = elements.remoteVideo.duration;
    let targetPlayDurationMs = 3000;

    if (!isNaN(duration) && duration > 0) {
      if (duration <= 3.5) {
        // Short Videos (2s - 3.5s): Start at 0s, play full duration
        elements.remoteVideo.currentTime = 0;
        targetPlayDurationMs = Math.max(1800, (duration - 0.2) * 1000);
      } else {
        // Medium/Long Videos (> 3.5s): Random start offset & 2.2s - 3.8s human jitter duration
        const maxStart = Math.max(0, duration - 3.0);
        elements.remoteVideo.currentTime = Math.random() * maxStart;
        const remainingTimeMs =
          (duration - elements.remoteVideo.currentTime) * 1000;
        const jitterDuration = Math.floor(Math.random() * 1600) + 2200; // 2200ms - 3800ms human jitter
        targetPlayDurationMs = Math.min(
          jitterDuration,
          Math.max(1800, remainingTimeMs - 200),
        );
      }
    }

    if (simulatedVideoTimer) clearTimeout(simulatedVideoTimer);
    simulatedVideoTimer = setTimeout(() => {
      if (isSimulatedCallActive && !currentCall && !isAdPlaying) {
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
  if (simulatedVideoTimer) {
    clearTimeout(simulatedVideoTimer);
    simulatedVideoTimer = null;
  }
  if (simulatedSearchDelayTimeout) {
    clearTimeout(simulatedSearchDelayTimeout);
    simulatedSearchDelayTimeout = null;
  }

  // Stage 1: Pause video & show disconnect state
  if (elements.remoteVideo && !elements.remoteVideo.srcObject) {
    try {
      elements.remoteVideo.pause();
      elements.remoteVideo.removeAttribute("src");
      elements.remoteVideo.load();
    } catch (e) {}
  }

  // Restore searching overlay element display
  const overlay =
    document.getElementById("searching-overlay") || elements.searchingOverlay;
  if (overlay) {
    overlay.style.display = "";
    overlay.classList.remove("hidden");
  }

  // Stage 2: Show realistic Omegle searching radar transition
  updateStatus("searching", "Stranger disconnected. Searching...");
  showSearchingOverlay(
    "Searching for a Stranger...",
    "Connecting you to a random stranger worldwide...",
  );
  updateToolbarVisibility("searching");
  appendSystemChatMessage("Stranger has disconnected.");

  // Stage 3: Randomized 1.2s to 1.8s realistic search delay before connecting next stranger
  const searchDelay = Math.floor(Math.random() * 600) + 1200; // 1200ms - 1800ms

  simulatedSearchDelayTimeout = setTimeout(() => {
    simulatedSearchDelayTimeout = null;
    if (isSimulatedCallActive && !currentCall && !isAdPlaying) {
      updateStatus("connected", "Connecting...");
      setTimeout(() => {
        if (isSimulatedCallActive && !currentCall && !isAdPlaying) {
          playSimulatedStrangerVideo();
        }
      }, 300);
    }
  }, searchDelay);
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
  if (videoDevices.length <= 1) return;

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
  } catch (e) {
    console.warn("Failed to switch camera device:", e);
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

function findAndConnectPeer() {
  // Target slot 1 primary lobby (or current index) so 2 active users always land on the same slot
  const targetHostId = LOBBY_PREFIX + currentSlotScanIndex;

  // Create client Peer instance
  const tempClientId = "client-" + Math.floor(Math.random() * 1000000);

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
  if (peer && peer.id === hostId) {
    console.warn("Self-connection prevented: current peer is already the host of this slot.");
    becomeWaitingHost(hostId);
    return;
  }

  // Try calling the host ID
  const call = peer.call(hostId, localStream);

  let connected = false;

  call.on("stream", (remoteStream) => {
    connected = true;
    currentCall = call;
    onPeerConnected(remoteStream);
    monitorICEConnection(call);
  });

  // Establish P2P DataChannel for chat
  const conn = peer.connect(hostId);
  setupDataConnection(conn);

  // Track & manage host connection timeout
  if (hostConnectTimeout) {
    clearTimeout(hostConnectTimeout);
    hostConnectTimeout = null;
  }

  // If host doesn't respond within 800ms, become the waiting host
  hostConnectTimeout = setTimeout(() => {
    hostConnectTimeout = null;
    if (!connected && currentCall !== call && !isAdPlaying) {
      call.close();
      becomeWaitingHost(hostId);
    }
  }, 800);
}

/**
 * Register current peer as the waiting Host on a public slot
 */
function becomeWaitingHost(hostId) {
  // Never disrupt an active Video Ad!
  if (isAdPlaying) return;

  if (chatConn) {
    try {
      chatConn.close();
    } catch (e) {}
    chatConn = null;
  }

  if (peer && !peer.destroyed) peer.destroy();

  // Initialize peer with the host slot ID
  peer = new Peer(hostId, STUN_CONFIG);

  peer.on("open", (id) => {
    myPeerId = id;
    console.log("Waiting as Host on slot:", id);
    if (!isAdPlaying) {
      updateStatus("searching", "Waiting for a stranger to join...");
      showSearchingOverlay(
        "Waiting for a Stranger...",
        "You are in the waiting queue. A peer will connect shortly.",
      );

      // Instant simulated video fallback if no real peer joins within 200ms
      if (simulatedFallbackTimeout) clearTimeout(simulatedFallbackTimeout);
      simulatedFallbackTimeout = setTimeout(() => {
        if (!currentCall && !isAdPlaying) {
          playSimulatedStrangerVideo();
        }
      }, 200);
    }
  });

  peer.on("call", (call) => {
    stopSimulatedStrangerVideo();
    call.answer(localStream);
    currentCall = call;

    call.on("stream", (remoteStream) => {
      onPeerConnected(remoteStream);
      monitorICEConnection(call);
    });
  });

  peer.on("connection", (conn) => {
    setupDataConnection(conn);
  });

  peer.on("error", (err) => {
    console.warn("Host Slot Conflict, retrying another slot...", err);
    if (retryMatchmakingTimeout) clearTimeout(retryMatchmakingTimeout);
    retryMatchmakingTimeout = setTimeout(findAndConnectPeer, 500);
  });
}

/**
 * Handle incoming WebRTC call
 */
function handleIncomingCall(call) {
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
  if (isSimulatedCallActive && !currentCall && !isAdPlaying) {
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
let currentBeautyIndex = 0; // Default: "studio" AI Smooth active!

function applyBeautyFilter(mode) {
  const localVid = document.getElementById("local") || elements.localVideo;
  const remoteVid = document.getElementById("remote") || elements.remoteVideo;
  const btnBeauty = document.getElementById("btn-beauty-filter");

  BEAUTY_MODES.forEach((m) => {
    if (localVid) localVid.classList.remove(`beauty-${m}`);
    if (remoteVid) remoteVid.classList.remove(`beauty-${m}`);
  });

  if (mode !== "off") {
    if (localVid) localVid.classList.add(`beauty-${mode}`);
    if (remoteVid) remoteVid.classList.add(`beauty-${mode}`);
    if (btnBeauty) btnBeauty.classList.add("beauty-active");
  } else {
    if (localVid) localVid.classList.add("beauty-off");
    if (remoteVid) remoteVid.classList.add("beauty-off");
    if (btnBeauty) btnBeauty.classList.remove("beauty-active");
  }

  localStorage.setItem("hashgang_beauty_mode", mode);
}

function cycleBeautyFilter() {
  currentBeautyIndex = (currentBeautyIndex + 1) % BEAUTY_MODES.length;
  const nextMode = BEAUTY_MODES[currentBeautyIndex];
  applyBeautyFilter(nextMode);
}

function initBeautyFilter() {
  const savedMode = localStorage.getItem("hashgang_beauty_mode") || "glow";
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
  if (!localStream) return;
  isAudioMuted = !isAudioMuted;
  localStream.getAudioTracks().forEach((t) => (t.enabled = !isAudioMuted));

  elements.btnMute.classList.toggle("muted", isAudioMuted);
  elements.btnMute.innerHTML = isAudioMuted
    ? '<i class="fa-solid fa-microphone-slash"></i>'
    : '<i class="fa-solid fa-microphone"></i>';
}

/**
 * Toggle Video Camera
 */
function toggleVideo() {
  if (!localStream) return;
  isVideoOff = !isVideoOff;
  localStream.getVideoTracks().forEach((t) => (t.enabled = !isVideoOff));

  elements.btnVideo.classList.toggle("off", isVideoOff);
  elements.btnVideo.innerHTML = isVideoOff
    ? '<i class="fa-solid fa-video-slash"></i>'
    : '<i class="fa-solid fa-video"></i>';
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
  cleanupAdState();

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

function showSearchingOverlay(title, sub) {
  elements.overlayTitle.textContent = title;
  elements.overlaySub.textContent =
    sub ||
    `Connecting you to 1 stranger among ${currentOnlineUsersCount.toLocaleString()} online strangers worldwide...`;
  elements.searchingOverlay.classList.remove("hidden");
}

function hideSearchingOverlay() {
  elements.searchingOverlay.classList.add("hidden");
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
    }).catch((e) => console.warn("Visit log API notice:", e));
  } catch (e) {}
}

async function recordAdImpressionBackend(
  adConfig,
  durationWatched,
  completedFull,
  skipped,
  clickedCta,
) {
  if (typeof BACKEND_API_BASE === "undefined" || !adConfig) return;
  try {
    const visitorId = getVisitorId();
    const device = window.innerWidth <= 768 ? "mobile" : "desktop";
    const adId = adConfig.adId || adConfig.id || "unknown-ad";

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
      }),
    }).catch((e) => console.warn("Ad impression API notice:", e));
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
        matchesCount: matchCounter,
      }),
    }).catch((e) => console.warn("Session time API notice:", e));
  } catch (e) {}
}

// Start 30-second session time tracking heartbeat
setInterval(() => {
  recordSessionTimeBackend(30);
}, 30000);

async function fetchActiveUsersBackend() {
  if (typeof BACKEND_API_BASE === "undefined") return;
  try {
    const res = await fetch(`${BACKEND_API_BASE}/active-users`);
    const data = await res.json();
    if (data && data.success && typeof data.activeUsers === "number") {
      updateOnlineUsersDisplay(data.activeUsers);
    }
  } catch (e) {}
}

function updateOnlineUsersDisplay(count) {
  currentOnlineUsersCount = Math.max(1, count);
  const badgeEl = document.getElementById("online-users-badge");

  if (currentOnlineUsersCount < 100) {
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
 * VAST 2.0 / 3.0 In-Stream XML Video Ad Parser
 */
async function fetchAndParseVastAd(vastUrl) {
  try {
    const res = await fetch(vastUrl);
    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    // Extract MediaFile (Actual Advertiser MP4 Video Stream URL)
    const mediaFiles = xmlDoc.getElementsByTagName("MediaFile");
    let videoUrl = null;
    for (let i = 0; i < mediaFiles.length; i++) {
      const type = mediaFiles[i].getAttribute("type");
      if (type && (type.includes("mp4") || type.includes("webm"))) {
        videoUrl = mediaFiles[i].textContent.trim();
        break;
      }
    }
    if (!videoUrl && mediaFiles.length > 0) {
      videoUrl = mediaFiles[0].textContent.trim();
    }

    // Extract AdTitle
    const titleNode = xmlDoc.getElementsByTagName("AdTitle")[0];
    const title = titleNode
      ? titleNode.textContent.trim()
      : "Sponsored Video Ad";

    // Extract ClickThrough (Landing URL)
    const clickNode = xmlDoc.getElementsByTagName("ClickThrough")[0];
    const linkUrl = clickNode
      ? clickNode.textContent.trim()
      : "https://hashgang.com";

    // Extract Description
    const descNode = xmlDoc.getElementsByTagName("Description")[0];
    const desc = descNode
      ? descNode.textContent.trim()
      : "Sponsored Video Content";

    if (videoUrl) {
      return {
        adId: "vast-dynamic-ad",
        title,
        desc,
        videoUrl,
        linkUrl,
        badgeText: "SPONSORED VIDEO AD",
        skipAfterSeconds: 10,
      };
    }
  } catch (e) {
    console.warn("VAST Video Tag fetch notice:", e);
  }
  return null;
}

/**
 * Dynamic Responsive Adsterra Resolution Switcher
 */
function getResponsiveAdsterraConfig() {
  const width = window.innerWidth;

  if (width <= 500) {
    // Mobile Devices: 300x250 Box
    return {
      key: "ede40fc4ab13bf9c6140311ae9860f4f",
      height: 250,
      width: 300,
      scriptUrl:
        "https://www.highperformanceformat.com/ede40fc4ab13bf9c6140311ae9860f4f/invoke.js",
    };
  } else if (width <= 900) {
    // Tablets / Mid-Size: 468x60 Banner
    return {
      key: "d9676c3a7d2b29be111c5b2e061f9ab2",
      height: 60,
      width: 468,
      scriptUrl:
        "https://www.highperformanceformat.com/d9676c3a7d2b29be111c5b2e061f9ab2/invoke.js",
    };
  } else {
    // Large Desktop Displays: 728x90 Leaderboard Banner
    return {
      key: "4f2e5f584936737065419e1ba469a31d",
      height: 90,
      width: 728,
      scriptUrl:
        "https://www.highperformanceformat.com/4f2e5f584936737065419e1ba469a31d/invoke.js",
    };
  }
}

let inCallAdsterraTimer = null;

/**
 * Show Live In-Call Adsterra Sponsored Banner Overlay (4-Second Ultra-Fast Fade Out)
 */
function showInCallAdsterraBanner() {
  const bannerBox = document.getElementById("incall-adsterra-banner-container");
  if (!bannerBox) return;

  if (inCallAdsterraTimer) clearTimeout(inCallAdsterraTimer);
  bannerBox.innerHTML = "";
  bannerBox.classList.remove("hidden", "fading-out");

  const adConfig = getResponsiveAdsterraConfig();
  const scriptConf = document.createElement("script");
  scriptConf.type = "text/javascript";
  scriptConf.text = `
    atOptions = {
      'key' : '${adConfig.key}',
      'format' : 'iframe',
      'height' : ${adConfig.height},
      'width' : ${adConfig.width},
      'params' : {}
    };
  `;
  const scriptInvoke = document.createElement("script");
  scriptInvoke.type = "text/javascript";
  scriptInvoke.src = adConfig.scriptUrl;
  bannerBox.appendChild(scriptConf);
  bannerBox.appendChild(scriptInvoke);

  // 6-Second Timer (2s Network Iframe Render Offset + 4s Full Rendered Impression View)
  inCallAdsterraTimer = setTimeout(() => {
    bannerBox.classList.add("fading-out");
    setTimeout(() => {
      bannerBox.classList.add("hidden");
      bannerBox.innerHTML = "";
    }, 500);
  }, 6000);
}

function hideInCallAdsterraBanner() {
  if (inCallAdsterraTimer) {
    clearTimeout(inCallAdsterraTimer);
    inCallAdsterraTimer = null;
  }
  const bannerBox = document.getElementById("incall-adsterra-banner-container");
  if (bannerBox) {
    bannerBox.classList.add("hidden");
    bannerBox.innerHTML = "";
  }
}

// Psychological Variable Jitter Schedule: Alternating Long (180s = 3m) & Short (60s = 1m) Gaps
const JITTER_GAPS = [180, 60];
let currentJitterIndex = 0;
let inCallJitterTimeout = null;

/**
 * Psychological Behavioral Adsterra In-Call Monetization Engine
 * - 1st Impression: At 15s Gate (Filters rapid visual scanning skips).
 * - Subsequent Impressions: Alternating Long & Short Gaps (Eliminates pattern fatigue).
 */
function startInCallAdsterraJitterEngine() {
  stopInCallAdsterraJitterEngine();
  currentJitterIndex = 0;

  // 15-Second Initial Engagement Gate
  inCallJitterTimeout = setTimeout(() => {
    showInCallAdsterraBanner();
    currentJitterIndex++;
    scheduleNextJitterAd();
  }, 15000);
}

function scheduleNextJitterAd() {
  if (inCallJitterTimeout) clearTimeout(inCallJitterTimeout);

  const gapSeconds = JITTER_GAPS[(currentJitterIndex - 1) % JITTER_GAPS.length];
  inCallJitterTimeout = setTimeout(() => {
    showInCallAdsterraBanner();
    currentJitterIndex++;
    scheduleNextJitterAd();
  }, gapSeconds * 1000);
}

function stopInCallAdsterraJitterEngine() {
  if (inCallJitterTimeout) {
    clearTimeout(inCallJitterTimeout);
    inCallJitterTimeout = null;
  }
  currentJitterIndex = 0;
  hideInCallAdsterraBanner();
}

// Expose Chat & Camera & Emoji handlers globally on window object for HTML inline onclick attributes
window.toggleChatDrawer = toggleChatDrawer;
window.sendChatMessage = sendChatMessage;
window.switchCamera = switchCamera;
window.toggleVideoSwap = toggleVideoSwap;
window.toggleEmojiBar = toggleEmojiBar;
window.sendEmojiReaction = sendEmojiReaction;
window.cycleBeautyFilter = cycleBeautyFilter;

document.addEventListener("DOMContentLoaded", () => {
  detectCameraDevices();
  initBeautyFilter();
});
