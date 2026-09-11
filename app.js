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
let socket = null;
let currentPeerConnection = null;
let currentMatchTargetId = null;
let searchChunkTimer = null;
let isSocketConnected = false;
let isAudioMuted = false;
let isVideoOff = false;
let isSimulatedCallActive = false;
let isStoppedByUser = true;
let unreadMessagesCount = 0;
let currentOnlineUsersCount = 0;
const MIN_ONLINE_USERS_THRESHOLD = 500; // Minimum active users required before displaying online count badge in header

// Self-Brand Video Promotion Config & Feature Flag
const ENABLE_SELF_BRAND_ADS = true; // Set to false anytime to disable self-brand video ads
const BRAND_AD_FREQUENCY = 7; // Trigger a self-brand video ad every 7th match attempt
const BRAND_AD_SKIP_SECONDS = 5; // Enable skip button after 5 seconds


const SESSION_INSTANCE_ID = "sess_" + Date.now() + "_" + Math.floor(Math.random() * 10000000);
let previousTempClientId = null;

// Anti-Repetitive Peer Blacklist Engine (3-Minute Cooldown Memory)
const RECENTLY_MATCHED_PEERS_COOLDOWN_MS = 180000; // 3 Minutes (180,000ms)
const recentlyMatchedPeers = new Map();

let currentRemoteSessionId = null;
let currentRemotePeerId = null;

function addPeerToRecentlyMatchedBlacklist(peerId) {
  if (!peerId) return;
  recentlyMatchedPeers.set(peerId, Date.now());
  console.log("🚫 [Blacklist] Cooldown activated for 3 mins on peer/session:", peerId);
  const now = Date.now();
  for (const [id, ts] of recentlyMatchedPeers.entries()) {
    if (now - ts > RECENTLY_MATCHED_PEERS_COOLDOWN_MS) {
      recentlyMatchedPeers.delete(id);
    }
  }
}

function blacklistCurrentPeerSession() {
  if (currentRemoteSessionId) {
    addPeerToRecentlyMatchedBlacklist(currentRemoteSessionId);
  }
  if (currentRemotePeerId) {
    addPeerToRecentlyMatchedBlacklist(currentRemotePeerId);
  }
  if (currentCall && currentCall.peer) {
    addPeerToRecentlyMatchedBlacklist(currentCall.peer);
  }
}

function isPeerRecentlyMatched(peerId) {
  if (!peerId) return false;
  const ts = recentlyMatchedPeers.get(peerId);
  if (!ts) return false;
  if (Date.now() - ts > RECENTLY_MATCHED_PEERS_COOLDOWN_MS) {
    recentlyMatchedPeers.delete(peerId);
    return false;
  }
  return true;
}

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

// ICE Servers (Google/Cloudflare STUN + OpenRelay TURN for Global 4G/5G CGNAT Traversal)
const STUN_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:global.stun.twilio.com:3478" },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:443",
        "turn:openrelay.metered.ca:443?transport=tcp"
      ],
      username: "openrelay",
      credential: "openrelay"
    }
  ],
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceCandidatePoolSize: 10
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
  pwaInstallModal: document.getElementById("pwa-install-modal"),
  btnPwaInstall: document.getElementById("btn-pwa-install"),
  btnPwaDismiss: document.getElementById("btn-pwa-dismiss"),
  btnPwaClose: document.getElementById("btn-pwa-close"),
  pwaIosInstructions: document.getElementById("pwa-ios-instructions"),
  pwaInstallBtnText: document.getElementById("pwa-install-btn-text"),
  pwaInstallIcon: document.getElementById("pwa-install-icon"),
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

  elements.pwaInstallModal = document.getElementById("pwa-install-modal");
  elements.btnPwaInstall = document.getElementById("btn-pwa-install");
  elements.btnPwaDismiss = document.getElementById("btn-pwa-dismiss");
  elements.btnPwaClose = document.getElementById("btn-pwa-close");
  elements.pwaIosInstructions = document.getElementById("pwa-ios-instructions");
  elements.pwaLinuxNote = document.getElementById("pwa-linux-note");
  elements.pwaInstallBtnText = document.getElementById("pwa-install-btn-text");
  elements.pwaInstallIcon = document.getElementById("pwa-install-icon");
  elements.menuBtnInstallPwa = document.getElementById("menu-btn-install-pwa");



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
  setTimeout(prefetchNextAdsterraAd, 1500);

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

  // Prompt Terms of Service & Age Consent Modal on Page Load if missing/expired, else auto check permissions
  if (!isTosConsentValid()) {
    showTosModal();
  } else {
    checkPermissionsAndAutoStart();
  }

  // Register PWA Service Worker for Offline Shell, Fast Load & Automatic Live Updates
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("PWA Service Worker registered:", reg.scope);
          // Force update check for new release on server
          try { reg.update(); } catch (e) {}
          
          // Auto-Update Engine: Detect new release and activate immediately without re-installation
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("New PWA deployment release detected! Auto-refreshing app shell...");
                  showShareToast("🚀 New App Update Available! Applying latest release...");
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              });
            }
          });
        })
        .catch((err) => console.warn("PWA Service Worker registration failed:", err));

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }

  // Initialize Delayed PWA Installation Engine
  initPwaInstallEngine();

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

  try {
    if (elements.btnPwaInstall) {
      elements.btnPwaInstall.addEventListener("click", handlePwaInstallAction);
    }
    if (elements.btnPwaDismiss) {
      elements.btnPwaDismiss.addEventListener("click", handlePwaDismissAction);
    }
    if (elements.btnPwaClose) {
      elements.btnPwaClose.addEventListener("click", handlePwaDismissAction);
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

      // Auto-dismiss Popovers on Outside Click
      const bgPopover = document.getElementById("bg-effects-popover");
      if (bgPopover && !bgPopover.classList.contains("closed")) {
        const isInsideBgPopover = bgPopover.contains(e.target);
        const isBgBtnDesktop = e.target.closest("#btn-bg-effects");
        const isBgBtnMobile = e.target.closest("#btn-bg-effects-mobile");
        if (!isInsideBgPopover && !isBgBtnDesktop && !isBgBtnMobile) {
          bgPopover.classList.add("closed");
        }
      }

      const beautyPopover = document.getElementById("beauty-slider-popover");
      if (beautyPopover && !beautyPopover.classList.contains("closed")) {
        const isInsideBeautyPopover = beautyPopover.contains(e.target);
        const isBeautyBtn = e.target.closest("#btn-beauty-filter");
        if (!isInsideBeautyPopover && !isBeautyBtn) {
          beautyPopover.classList.add("closed");
        }
      }

      // Auto-dismiss App Navigation Popover on Outside Click
      const appNavPopover = document.getElementById("app-nav-popover");
      if (appNavPopover && !appNavPopover.classList.contains("hidden")) {
        const isInsideNavPopover = appNavPopover.contains(e.target);
        const isAppMenuBtn = e.target.closest("#btn-app-menu-toggle");
        if (!isInsideNavPopover && !isAppMenuBtn) {
          appNavPopover.classList.add("hidden");
        }
      }
    });
  } catch (e) {}

  window.toggleAppNavMenu = function (e) {
    if (e) e.stopPropagation();
    const appNavPopover = document.getElementById("app-nav-popover");
    if (appNavPopover) {
      appNavPopover.classList.toggle("hidden");
    }
  };

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

function validateMediaPermissions() {
  if (!localStream) return false;
  const videoTrack = localStream.getVideoTracks()[0];
  if (!videoTrack) return false;
  return videoTrack.readyState === "live" && videoTrack.enabled;
}

async function showPermissionGuidanceModal(isBlocked = false) {
  const modal = document.getElementById("permission-guidance-modal");
  const guideBox = document.getElementById("unblock-guide-box");
  const btnRequest = document.getElementById("btn-request-perm");
  const btnRefresh = document.getElementById("btn-perm-refresh");

  // Check browser site setting permission status for camera if not explicitly passed as blocked
  if (!isBlocked && navigator.permissions && navigator.permissions.query) {
    try {
      const permStatus = await navigator.permissions.query({ name: "camera" });
      if (permStatus && permStatus.state === "denied") {
        isBlocked = true;
      }
    } catch (e) {}
  }

  if (modal) modal.classList.remove("hidden");

  if (isBlocked) {
    if (guideBox) {
      guideBox.classList.remove("hidden");
      guideBox.style.setProperty("display", "block", "important");
    }
    if (btnRequest) {
      btnRequest.classList.add("hidden");
      btnRequest.style.setProperty("display", "none", "important");
    }
    if (btnRefresh) {
      btnRefresh.classList.remove("hidden");
      btnRefresh.style.setProperty("display", "block", "important");
    }
  } else {
    if (guideBox) {
      guideBox.classList.add("hidden");
      guideBox.style.setProperty("display", "none", "important");
    }
    if (btnRequest) {
      btnRequest.classList.remove("hidden");
      btnRequest.style.setProperty("display", "flex", "important");
    }
    if (btnRefresh) {
      btnRefresh.classList.add("hidden");
      btnRefresh.style.setProperty("display", "none", "important");
    }
  }
}

function hidePermissionGuidanceModal() {
  const modal = document.getElementById("permission-guidance-modal");
  if (modal) modal.classList.add("hidden");
}

async function requestMediaPermissionAndProceed() {
  updateStatus("searching", "Requesting camera & microphone access...");
  const success = await initLocalMedia();
  if (success && validateMediaPermissions()) {
    hidePermissionGuidanceModal();
    handleStartOrNext();
  } else {
    showPermissionGuidanceModal(true);
  }
}

async function checkPermissionsAndAutoStart() {
  if (validateMediaPermissions()) {
    hidePermissionGuidanceModal();
    handleStartOrNext();
    return;
  }

  // Detect if permission is already explicitly blocked in browser site settings
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const permStatus = await navigator.permissions.query({ name: "camera" });
      if (permStatus && permStatus.state === "denied") {
        console.warn("🔒 [Permission Security Guard] Camera is explicitly blocked in site settings.");
        showPermissionGuidanceModal(true);
        return;
      }
    } catch (e) {}
  }

  const success = await initLocalMedia();
  if (success && validateMediaPermissions()) {
    hidePermissionGuidanceModal();
    handleStartOrNext();
  } else {
    showPermissionGuidanceModal(true);
  }
}

function handlePermissionRevoked() {
  console.warn("🛡️ [Permission Security Guard] Camera permission lost or track ended mid-session!");
  isStoppedByUser = true;
  if (socket && socket.connected) {
    socket.emit("leave_queue");
  }
  cleanupCallState();

  if (localStream) {
    try {
      localStream.getTracks().forEach((t) => t.stop());
    } catch (e) {}
    localStream = null;
  }

  updateStatus("error", "Camera Access Lost");
  hideSearchingOverlay();
  showPermissionGuidanceModal(true);
}

async function acceptTosAndProceed() {
  localStorage.setItem("p2p_tos_accepted_at", Date.now().toString());
  hideTosModal();
  await checkPermissionsAndAutoStart();
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
let lastStartOrNextClickTime = 0;

async function handleStartOrNext() {
  const now = Date.now();
  if (now - lastStartOrNextClickTime < 300) {
    console.log("⏱️ [Throttle Guard] Rapid click ignored (<300ms)");
    return;
  }
  lastStartOrNextClickTime = now;
  isStoppedByUser = false;

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

  // Blacklist skipped peer ID & Session ID for 3 minutes to prevent immediate re-matching
  blacklistCurrentPeerSession();

  cleanupCallState();

  // Ensure local media stream is captured
  if (!localStream) {
    const success = await initLocalMedia();
    if (!success) return;
  }

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

  // Start automated zero-cost matchmaking (search radar 5s chunk timer is managed inside findAndConnectPeer)
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

  // If video aspect ratio differs significantly from container/screen aspect ratio (e.g. 16:9 widescreen simulation video on 9:16 vertical mobile screen):
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
  if (hostConnectTimeout) {
    clearTimeout(hostConnectTimeout);
    hostConnectTimeout = null;
  }
  if (retryMatchmakingTimeout) {
    clearTimeout(retryMatchmakingTimeout);
    retryMatchmakingTimeout = null;
  }

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

  // Handle actual load errors (ignoring transient AbortError / user interruptions)
  elements.remoteVideo.onerror = (e) => {
    const err = elements.remoteVideo.error;
    if (err && err.code === 2) return; // Ignore MEDIA_ERR_ABORTED
    console.warn(
      "Simulated video load error, auto-skipping:",
      videoUrl,
      err
    );
    if (isSimulatedCallActive && !currentCall) {
      setTimeout(skipSimulatedStrangerVideo, 500);
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

  // Guaranteed Hard Safety Fallback Timer: Ensure search radar NEVER gets stuck if loadedmetadata is delayed or blocked by browser permission dialogs
  if (simulatedVideoTimer) clearTimeout(simulatedVideoTimer);
  simulatedVideoTimer = setTimeout(() => {
    if (isSimulatedCallActive && !currentCall && !currentPeerConnection && !currentMatchTargetId) {
      console.warn("⏱️ [Simulation Safety Guard] Metadata delay detected (first permission grant or load stall). Auto-advancing search...");
      skipSimulatedStrangerVideo();
    }
  }, 3500);

  // Remove existing metadata handler if present
  if (currentSimulatedMetadataHandler && elements.remoteVideo) {
    elements.remoteVideo.removeEventListener(
      "loadedmetadata",
      currentSimulatedMetadataHandler
    );
    currentSimulatedMetadataHandler = null;
  }

  // Handle Dynamic Start Offset & Play Duration once metadata is loaded
  currentSimulatedMetadataHandler = () => {
    if (currentSimulatedMetadataHandler && elements.remoteVideo) {
      elements.remoteVideo.removeEventListener(
        "loadedmetadata",
        currentSimulatedMetadataHandler
      );
      currentSimulatedMetadataHandler = null;
    }

    if (!isSimulatedCallActive || currentCall || currentPeerConnection || currentMatchTargetId) return;

    const duration = elements.remoteVideo.duration;
    // Dynamic ultra-realistic duration: 2.5s to 3.8s (randomized jitter)
    let targetPlayDurationMs = Math.floor(Math.random() * 1300) + 2500; // 2500ms - 3800ms

    elements.remoteVideo.loop = false; // NEVER loop or repeat video clips

    if (!isNaN(duration) && duration > 0) {
      if (duration > 4.0) {
        // Pick a random start offset for long videos so it feels like joining an ongoing live stream!
        const maxStartOffset = Math.max(0, duration - 4.0);
        const randomStartOffset = Math.random() * maxStartOffset;
        try {
          elements.remoteVideo.currentTime = randomStartOffset;
        } catch (e) {}
      } else {
        // For short videos (< 4s), play naturally for its duration without looping
        elements.remoteVideo.currentTime = 0;
        const naturalDurationMs = Math.max(1500, (duration - 0.1) * 1000);
        targetPlayDurationMs = Math.min(naturalDurationMs, targetPlayDurationMs);
      }
    } else {
      elements.remoteVideo.currentTime = 0;
    }

    // Override hard safety timer with exact calculated clip duration
    if (simulatedVideoTimer) clearTimeout(simulatedVideoTimer);
    simulatedVideoTimer = setTimeout(() => {
      if (isSimulatedCallActive && !currentCall && !currentPeerConnection && !currentMatchTargetId) {
        skipSimulatedStrangerVideo();
      }
    }, targetPlayDurationMs);
  };

  elements.remoteVideo.addEventListener(
    "loadedmetadata",
    currentSimulatedMetadataHandler
  );

  const playPromise = elements.remoteVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      if (err && err.name === "AbortError") return; // Interrupted play request, safe to ignore
      console.warn(
        "Unmuted autoplay prevented by browser policy, falling back to muted playback:",
        err
      );
      elements.remoteVideo.muted = true;
      elements.remoteVideo.play().catch((e) => console.error("Play retry failed:", e));
    });
  }

  updateStatus("connected", "Connected with Stranger");
  updateToolbarVisibility("connected");
  appendSystemChatMessage("You are now chatting with a random stranger. Say hi!");
  onStrangerConnectedMatch();
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

  isSimulatedCallActive = false;
  findAndConnectPeer();
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
 * Capture Local User Camera and Microphone with Adaptive Multi-Device Resolution Fallback
 */
async function initLocalMedia() {
  const mediaConstraintsHierarchy = [
    // Priority 1: 720p HD (Ideal for Desktop & Modern Smartphones)
    {
      video: {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        frameRate: { ideal: 30, max: 30 }
      },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    },
    // Priority 2: 480p SD (Optimized for Budget Mobile Phones & Slow 3G Data)
    {
      video: {
        width: { ideal: 640, min: 320 },
        height: { ideal: 480, min: 240 },
        frameRate: { ideal: 24 }
      },
      audio: { echoCancellation: true, noiseSuppression: true }
    },
    // Priority 3: Basic Hardware Fallback (Maximum Device Compatibility)
    { video: true, audio: true }
  ];

  let acquiredStream = null;
  let lastMediaError = null;

  for (const constraints of mediaConstraintsHierarchy) {
    try {
      acquiredStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (acquiredStream) break;
    } catch (err) {
      lastMediaError = err;
      // If user explicitly denied permission, do not try lower constraints
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw err;
      }
    }
  }

  if (!acquiredStream && lastMediaError) {
    throw lastMediaError;
  }

  try {
    localStream = acquiredStream;
    elements.localVideo.srcObject = getActiveStream();

    // Attach Layer 2 Runtime Security Monitors: Detect camera disconnect or permission revocation mid-call
    const videoTrack = localStream.getVideoTracks()[0];
    const audioTrack = localStream.getAudioTracks()[0];
    if (videoTrack) {
      videoTrack.onended = () => {
        console.warn("📹 [Layer 2 Guard] Local video track ended or camera revoked!");
        handlePermissionRevoked();
      };
    }
    if (audioTrack) {
      audioTrack.onended = () => {
        console.warn("🎙️ [Layer 2 Guard] Local audio track ended or microphone revoked!");
        handlePermissionRevoked();
      };
    }

    // Attach Layer 3 Browser Permission Observer API (Chromium / Chrome / Edge)
    if (navigator.permissions && navigator.permissions.query) {
      try {
        navigator.permissions.query({ name: "camera" }).then((status) => {
          status.onchange = () => {
            console.log("🔒 [Layer 3 Observer] Browser camera status changed to:", status.state);
            if (status.state === "denied") {
              handlePermissionRevoked();
            }
          };
        });
      } catch (e) {}
    }

    // Remove permission overlay if previously shown
    const existingOverlay = document.getElementById("media-perm-overlay");
    if (existingOverlay) existingOverlay.remove();
    hidePermissionGuidanceModal();

    await detectCameraDevices();
    await setupBgSegmentationPipeline();
    return true;
  } catch (err) {
    hideSearchingOverlay();

    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      console.info("ℹ️ [Permission Notice] Camera & microphone permission denied by user or blocked by browser.");
      updateStatus("error", "Permission Denied");
      showPermissionGuidanceModal(true);
      return false;
    }

    if (err.name === "NotReadableError" || err.name === "TrackStartError" || err.name === "OverconstrainedError") {
      console.warn("⚠️ [Hardware Conflict] Camera is occupied by another application (Zoom/Teams).");
      updateStatus("error", "Camera Occupied");
      showShareToast("⚠️ Camera is in use by another app (Zoom/Teams). Please close it and retry!");
      showPermissionGuidanceModal(true);
      return false;
    }

    console.warn("Camera/Mic Permission Notice:", err);
    updateStatus("error", "Permission Denied");
    showPermissionGuidanceModal(true);
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
      if (bgRawVideo) bgRawVideo.srcObject = localStream;
      applyBgEffectToStreams();
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
 * High-Scale Real-Time Socket.io Stranger Matchmaker Engine
 */

/**
 * High-Scale Real-Time Socket.io Stranger Matchmaker Engine
 */

function initSocketConnection() {
  if (socket) return;

  const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const socketHost = window.SIGNALING_SERVER_URL || (isLocal ? `http://${window.location.hostname}:5000/omegle` : "https://api.hashgang.com/omegle");

  console.log("⚡ [Socket Matchmaker] Initializing connection to signaling server:", socketHost);

  try {
    socket = io(socketHost, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10
    });

    socket.on("connect", () => {
      isSocketConnected = true;
      console.log("⚡ [Socket Matchmaker] Connected to server with Socket ID:", socket.id);
      if (!isStoppedByUser && !currentPeerConnection) {
        console.log("🔄 [Socket Matchmaker] Socket reconnected while active. Auto-emitting join_queue...");
        socket.emit("join_queue");
      }
    });

    socket.on("online_count", (data) => {
      if (data && data.count) {
        currentOnlineUsersCount = data.count;
        updateOnlineUsersDisplay(data.count);
        console.log("📊 [Socket Matchmaker] Online users count updated:", data.count);
      }
    });

    socket.on("matched", async (data) => {
      if (isStoppedByUser) {
        console.log("🛑 [Socket Matchmaker] Ignoring incoming match because user has stopped matchmaking.");
        if (socket && socket.connected) socket.emit("leave_queue");
        return;
      }
      console.log("🤝 [Socket Matchmaker] MATCH FOUND with real stranger target:", data.peerId, "| Initiator:", data.initiator);
      
      if (searchChunkTimer) {
        clearTimeout(searchChunkTimer);
        searchChunkTimer = null;
      }
      if (simulatedFallbackTimeout) {
        clearTimeout(simulatedFallbackTimeout);
        simulatedFallbackTimeout = null;
      }
      stopSimulatedStrangerVideo();
      currentMatchTargetId = data.peerId;
      currentRemotePeerId = data.peerId;
      
      createWebRTCPeerConnection(data.peerId, data.initiator);
    });

    socket.on("signal", async (data) => {
      if (!data || !data.signal || isStoppedByUser) return;
      console.log("📡 [Socket Signaling] Incoming signal from:", data.senderId, "| Signal type:", data.signal.type || (data.signal.candidate ? "candidate" : "unknown"));
      handleWebRTCSignal(data.senderId, data.signal);
    });

    socket.on("peer_left", () => {
      console.log("🔌 [Socket Matchmaker] Peer left notification received from server");
      if (!isStoppedByUser && !isAutoSearchingAfterSkip && !isSimulatedCallActive) {
        onPeerSkippedUs();
      }
    });

    socket.on("auto_rejoin", () => {
      if (isStoppedByUser) {
        console.log("🛑 [Socket Matchmaker] Suppressing auto_rejoin because user stopped call");
        return;
      }
      console.log("🔄 [Socket Matchmaker] Auto rejoin requested by server");
      handleStartOrNext();
    });

    socket.on("disconnect", (reason) => {
      isSocketConnected = false;
      console.warn("🔌 [Socket Matchmaker] Socket disconnected from signaling server. Reason:", reason);
    });
  } catch (e) {
    console.error("❌ [Socket Matchmaker] Socket initialization error:", e);
  }
}

async function createWebRTCPeerConnection(targetId, isInitiator) {
  if (currentPeerConnection) {
    console.log("🧹 [WebRTC] Closing existing RTCPeerConnection before creating new one");
    try { currentPeerConnection.close(); } catch (e) {}
    currentPeerConnection = null;
  }

  console.log("🛠️ [WebRTC] Creating RTCPeerConnection for target:", targetId, "| IsInitiator:", isInitiator);
  const pc = new RTCPeerConnection(STUN_CONFIG);
  currentPeerConnection = pc;

  // Process any signals that arrived before RTCPeerConnection was ready
  if (pendingSignals.length > 0) {
    console.log(`📦 [WebRTC] Processing ${pendingSignals.length} buffered pending signals...`);
    while (pendingSignals.length > 0) {
      const item = pendingSignals.shift();
      processWebRTCSignal(item.senderId, item.signal);
    }
  }

  // Combine local microphone audio and video tracks into a unified MediaStream for WebRTC transmission
  const activeStream = getActiveStream();
  const mediaStreamToSend = new MediaStream();
  let hasTracks = false;

  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isAudioMuted;
      mediaStreamToSend.addTrack(audioTrack);
      hasTracks = true;
      console.log("🎙️ [WebRTC] Added microphone audio track to unified stream (enabled:", audioTrack.enabled, ")");
    }
  }

  const videoTrack = (activeStream || localStream) ? (activeStream || localStream).getVideoTracks()[0] : null;
  if (videoTrack) {
    videoTrack.enabled = !isVideoOff;
    mediaStreamToSend.addTrack(videoTrack);
    hasTracks = true;
    console.log("🎥 [WebRTC] Added video track to unified stream (enabled:", videoTrack.enabled, ")");
  }

  if (hasTracks) {
    mediaStreamToSend.getTracks().forEach((track) => {
      pc.addTrack(track, mediaStreamToSend);
    });
  } else {
    console.warn("⚠️ [WebRTC] No active local tracks available to attach!");
  }

  // Handle incoming remote media tracks
  pc.ontrack = (event) => {
    console.log("🎥 [WebRTC] Remote Media Track Received via WebRTC! Stream ID:", event.streams[0] ? event.streams[0].id : "N/A");
    if (event.streams && event.streams[0]) {
      stopSimulatedStrangerVideo();
      onPeerConnected(event.streams[0]);
    }
  };

  // ICE Candidate gathering
  pc.onicecandidate = (event) => {
    if (event.candidate && socket && socket.connected) {
      console.log("🧊 [WebRTC] Transmitting local ICE Candidate to target:", targetId);
      socket.emit("signal", {
        targetId: targetId,
        signal: { type: "candidate", candidate: event.candidate }
      });
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log("🌐 [WebRTC] ICE Connection State Changed:", pc.iceConnectionState);
    if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
      hideSearchingOverlay();
      hideFirewallWarning();
      updateStatus("connected", "Connected with Stranger");
    } else if (pc.iceConnectionState === "disconnected") {
      updateStatus("searching", "Reconnecting stranger...");
      setTimeout(() => {
        if (pc && pc.iceConnectionState === "disconnected") {
          console.warn("⚠️ [WebRTC] ICE disconnect timeout reached (4s). Auto-skipping to next stranger.");
          if (!isAutoSearchingAfterSkip && !isSimulatedCallActive) {
            onPeerSkippedUs();
          }
        }
      }, 4000);
    } else if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "closed") {
      if (!isAutoSearchingAfterSkip && !isSimulatedCallActive) {
        console.warn("❌ [WebRTC] ICE connection failed/closed. Auto-skipping...");
        onPeerSkippedUs();
      }
    }
  };

  // Initiator creates & transmits SDP Offer
  if (isInitiator) {
    try {
      console.log("📝 [WebRTC] Creating SDP Offer as Initiator...");
      const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      console.log("📡 [WebRTC] Transmitting SDP Offer to target:", targetId);
      socket.emit("signal", {
        targetId: targetId,
        signal: { type: "offer", offer: offer }
      });
    } catch (err) {
      console.error("❌ [WebRTC] Error creating SDP Offer:", err);
    }
  }
}

let pendingSignals = [];
let pendingIceCandidates = [];

async function handleWebRTCSignal(senderId, signal) {
  // PRIVACY & SECURITY GUARD: Drop signals from un-matched sender IDs
  if (currentMatchTargetId && senderId !== currentMatchTargetId) {
    console.warn(`🛡️ [WebRTC Security] Blocked signal spoofing attempt from sender ${senderId} (Expected: ${currentMatchTargetId})`);
    return;
  }

  if (!currentPeerConnection) {
    console.log("⏳ [WebRTC Buffer] Signal arrived before currentPeerConnection ready. Queuing signal type:", signal.type || (signal.candidate ? "candidate" : "unknown"));
    pendingSignals.push({ senderId, signal });
    return;
  }
  await processWebRTCSignal(senderId, signal);
}

async function processWebRTCSignal(senderId, signal) {
  if (!currentPeerConnection) return;
  const pc = currentPeerConnection;

  try {
    if (signal.type === "offer") {
      console.log("📥 [WebRTC] Received SDP Offer from:", senderId, ". Setting Remote Description & creating Answer...");
      await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
      while (pendingIceCandidates.length > 0) {
        const cand = pendingIceCandidates.shift();
        try { await pc.addIceCandidate(cand); } catch (e) {}
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (socket && socket.connected) {
        console.log("📡 [WebRTC] Transmitting SDP Answer back to sender:", senderId);
        socket.emit("signal", {
          targetId: senderId,
          signal: { type: "answer", answer: answer }
        });
      }
    } else if (signal.type === "answer") {
      console.log("📥 [WebRTC] Received SDP Answer from:", senderId, ". Setting Remote Description...");
      await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
      while (pendingIceCandidates.length > 0) {
        const cand = pendingIceCandidates.shift();
        try { await pc.addIceCandidate(cand); } catch (e) {}
      }
    } else if (signal.type === "candidate") {
      if (signal.candidate) {
        const cand = new RTCIceCandidate(signal.candidate);
        if (pc.remoteDescription && pc.remoteDescription.type) {
          console.log("🧊 [WebRTC] Added ICE Candidate directly to peer connection");
          await pc.addIceCandidate(cand);
        } else {
          console.log("⏳ [WebRTC Buffer] Buffering ICE Candidate until remote description is set");
          pendingIceCandidates.push(cand);
        }
      }
    } else if (signal.type === "chat") {
      appendChatMessage(signal.text, "received");
    } else if (signal.type === "emoji") {
      spawnFloatingEmoji(signal.emoji);
    }
  } catch (e) {
    console.error("❌ [WebRTC Signal Error] Error processing WebRTC Signal:", e);
  }
}

function findAndConnectPeer() {
  if (!validateMediaPermissions()) {
    console.warn("🛡️ [Permission Security Guard] Pre-queue check failed! Live camera stream required.");
    hideSearchingOverlay();
    checkPermissionsAndAutoStart();
    return;
  }

  initSocketConnection();

  cleanupCallState();
  updateStatus("searching", "Searching for a stranger...");
  showSearchingOverlay(
    "Searching for a Stranger...",
    "Connecting you instantly to a random real person...",
  );

  if (socket && socket.connected) {
    console.log("⚡ [Socket Matchmaker] Socket active. Emitting join_queue immediately...");
    socket.emit("join_queue");
  } else if (socket) {
    console.log("⚡ [Socket Matchmaker] Socket connecting... Queuing join_queue on connect event.");
    socket.once("connect", () => {
      console.log("⚡ [Socket Matchmaker] Connected! Emitting queued join_queue...");
      socket.emit("join_queue");
    });
  }

  // Smart 5-Second Search Chunk Timer
  if (searchChunkTimer) clearTimeout(searchChunkTimer);
  searchChunkTimer = setTimeout(() => {
    searchChunkTimer = null;
    // If no real human matched within 5 seconds, play 1 brief simulation video transition
    if (!currentPeerConnection && !currentMatchTargetId && !currentCall) {
      console.log("⏱️ [Search Radar] 5s elapsed without real human candidate. Playing 1 simulation video transition...");
      playSimulatedStrangerVideo();
    } else {
      console.log("⏱️ [Search Radar] 5s elapsed, but real match/connection is already active or in progress.");
    }
  }, 5000);
}

function becomeWaitingHost(hostId) {
  findAndConnectPeer();
}

function handleIncomingCall(call) {
  findAndConnectPeer();
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

  blacklistCurrentPeerSession();
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
      findAndConnectPeer();
      return;
    }
  }

  stopSimulatedStrangerVideo();
  elements.remoteVideo.srcObject = remoteStream;
  elements.remoteVideo.muted = false; // Always unmuted for live P2P stranger audio
  elements.remoteVideo.volume = 1.0;
  
  const playPromise = elements.remoteVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn("⚠️ [WebRTC] Playback attempt error:", err);
      // Retry playback with unmuted audio
      elements.remoteVideo.muted = false;
      elements.remoteVideo.play().catch(() => {});
    });
  }
  adjustVideoAspectFit();

  const matchedPeerId = currentMatchTargetId || (currentCall && currentCall.peer);
  if (matchedPeerId) {
    addPeerToRecentlyMatchedBlacklist(matchedPeerId);
  }

  hideSearchingOverlay();
  hideFirewallWarning();
  updateStatus("connected", "Connected with Stranger");
  updateToolbarVisibility("connected");


  // Enable Chat Input
  elements.chatInput.disabled = false;
  elements.btnSendChat.disabled = false;

  // Option B: Disable in-call ads during active calls for 100% clean video chat UX
  stopInCallAdsterraJitterEngine();
  hideInCallAdsterraBanner();

  // Start In-Call Control Toolbar Auto-Hider (Full Video UX)
  startInCallToolbarAutoHider();

  onStrangerConnectedMatch();
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

  if (currentMatchTargetId && socket && socket.connected) {
    try {
      socket.emit("signal", {
        targetId: currentMatchTargetId,
        signal: { type: "emoji", emoji: emojiSymbol }
      });
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

  const bgPopover = document.getElementById("bg-effects-popover");
  if (bgPopover && !bgPopover.classList.contains("closed")) {
    bgPopover.classList.add("closed");
  }
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
 * Real-Time Virtual Background & Segmentation Engine (MediaPipe + Canvas WebGL)
 */
const BG_PRESETS = [
  { 
    id: "office", 
    name: "Modern Office", 
    category: "office",
    url: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80",
    thumb: "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80') center/cover"
  },
  { 
    id: "nature", 
    name: "Lush Forest", 
    category: "nature",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80",
    thumb: "url('https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=80') center/cover"
  },
  { 
    id: "mountains", 
    name: "Mountains", 
    category: "nature",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    thumb: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=300&q=80') center/cover"
  },
  { 
    id: "sea", 
    name: "Tropical Sea", 
    category: "nature",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    thumb: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80') center/cover"
  },
  { 
    id: "living_room", 
    name: "Cozy Room", 
    category: "cyber",
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
    thumb: "url('https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=300&q=80') center/cover"
  },
  { 
    id: "cyberpunk", 
    name: "Neon City", 
    category: "cyber",
    url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=80",
    thumb: "url('https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=300&q=80') center/cover"
  }
];

// Preload high-res preset background images for instant rendering
BG_PRESETS.forEach((preset) => {
  if (preset.url) {
    preset.imgObj = new Image();
    preset.imgObj.crossOrigin = "anonymous";
    preset.imgObj.src = preset.url;
  }
});

let selfieSegmentationInstance = null;
let currentBgEffectType = "preset"; // "preset", "blur", "custom", "none"
let currentBgPresetIndex = 0;
let currentBlurRadius = 16; // Dynamic blur radius 5px - 35px
let currentBgCategory = "all"; // Category tab: "all", "office", "nature", "cyber"
let isNeonAuraActive = false; // Gen-Z Silhouette Aura Glow toggle
let customBgImageObj = null;
let previousNonOffBgType = "preset";

let bgCanvas = null;
let bgCtx = null;
let bgRawVideo = null;
let bgProcessedStream = null;
let isBgProcessingLoopActive = false;

function getActiveStream() {
  const stream = (currentBgEffectType !== "none" && bgProcessedStream) ? bgProcessedStream : localStream;
  if (stream) {
    stream.getAudioTracks().forEach((t) => (t.enabled = !isAudioMuted));
    stream.getVideoTracks().forEach((t) => (t.enabled = !isVideoOff));
  }
  return stream;
}

let strangerMatchCount = 0;

function onStrangerConnectedMatch() {
  strangerMatchCount++;
  console.log(`Stranger connection #${strangerMatchCount} established.`);

  const userInteracted = localStorage.getItem("hashgang_bg_user_interacted") === "true";

  if (!userInteracted) {
    currentBgEffectType = "none";
    isNeonAuraActive = false;
    renderBgPresetsGrid();
    updateBgUIControls();
    applyBgEffectToStreams();
  }
}

function initBgEffectState() {
  const userInteracted = localStorage.getItem("hashgang_bg_user_interacted") === "true";
  const savedType = localStorage.getItem("hashgang_bg_type");
  const savedPreset = localStorage.getItem("hashgang_bg_preset");
  const savedBlurRadius = localStorage.getItem("hashgang_bg_blur_radius");
  const savedAura = localStorage.getItem("hashgang_bg_aura");
  const savedCustomData = localStorage.getItem("hashgang_bg_custom_data");

  if (userInteracted && savedType) {
    currentBgEffectType = savedType;
    isNeonAuraActive = savedAura === "true";
  } else {
    // Initial start before 1st stranger match: Background + Neon Aura BOTH DEFAULT ON!
    currentBgEffectType = "preset";
    isNeonAuraActive = true;
  }

  if (savedPreset !== null && !isNaN(parseInt(savedPreset, 10))) {
    currentBgPresetIndex = parseInt(savedPreset, 10) % BG_PRESETS.length;
  } else {
    currentBgPresetIndex = Math.floor(Math.random() * BG_PRESETS.length);
  }

  if (savedBlurRadius) {
    currentBlurRadius = parseInt(savedBlurRadius, 10);
    const rangeInput = document.getElementById("bg-blur-range");
    const label = document.getElementById("bg-blur-val");
    if (rangeInput) rangeInput.value = currentBlurRadius;
    if (label) label.textContent = `${currentBlurRadius}px`;
  }

  renderBgPresetsGrid();
  updateBgUIControls();
  initBgKeyboardShortcut();
}

function drawPresetBackground(ctx, index, width, height) {
  const preset = BG_PRESETS[index % BG_PRESETS.length];
  ctx.save();

  if (preset && preset.imgObj && preset.imgObj.complete && preset.imgObj.naturalWidth > 0) {
    ctx.drawImage(preset.imgObj, 0, 0, width, height);
  } else {
    // Elegant dark glassmorphism fallback gradient while image loads
    let grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#1e1b4b");
    grad.addColorStop(0.5, "#312e81");
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
}

function detectOptimalSegmentationResolution() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;
  if (isMobile || cores <= 2) {
    return { width: 640, height: 360 };
  }
  return { width: 960, height: 540 };
}

async function setupBgSegmentationPipeline() {
  initBgEffectState();

  if (!bgCanvas) {
    const res = detectOptimalSegmentationResolution();
    bgCanvas = document.createElement("canvas");
    bgCanvas.width = res.width;
    bgCanvas.height = res.height;
    bgCtx = bgCanvas.getContext("2d", { willReadFrequently: true });
  }

  if (!bgRawVideo) {
    bgRawVideo = document.createElement("video");
    bgRawVideo.autoplay = true;
    bgRawVideo.muted = true;
    bgRawVideo.playsInline = true;
  }

  if (localStream) {
    bgRawVideo.srcObject = localStream;
    try { await bgRawVideo.play(); } catch (e) {}
  }

  if (!bgProcessedStream && bgCanvas) {
    bgProcessedStream = bgCanvas.captureStream(30);
  }

  if (localStream && bgProcessedStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      const existingAudio = bgProcessedStream.getAudioTracks()[0];
      if (existingAudio) bgProcessedStream.removeTrack(existingAudio);
      bgProcessedStream.addTrack(audioTrack);
    }
  }

  if (elements.localVideo) {
    elements.localVideo.srcObject = getActiveStream();
  }

  if (typeof SelfieSegmentation !== "undefined" && !selfieSegmentationInstance) {
    try {
      selfieSegmentationInstance = new SelfieSegmentation({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
      });
      selfieSegmentationInstance.setOptions({
        modelSelection: 1
      });
      selfieSegmentationInstance.onResults(handleSegmentationResults);
    } catch (err) {
      console.warn("SelfieSegmentation init error:", err);
    }
  }

  startBgProcessingLoop();
}

function startBgProcessingLoop() {
  if (isBgProcessingLoopActive) return;
  isBgProcessingLoopActive = true;

  async function loop() {
    if (!isBgProcessingLoopActive) return;

    if (document.hidden) {
      // Pause heavy segmentation in background tab to save CPU while keeping WebRTC audio/video stream active
      return requestAnimationFrame(loop);
    }

    if (localStream && bgRawVideo && bgRawVideo.readyState >= 2) {
      if (currentBgEffectType !== "none" && selfieSegmentationInstance) {
        try {
          await selfieSegmentationInstance.send({ image: bgRawVideo });
        } catch (e) {}
      } else if (bgCtx && bgCanvas) {
        bgCtx.drawImage(bgRawVideo, 0, 0, bgCanvas.width, bgCanvas.height);
      }
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

function handleSegmentationResults(results) {
  if (!bgCtx || !bgCanvas) return;

  const w = bgCanvas.width;
  const h = bgCanvas.height;

  bgCtx.save();
  bgCtx.clearRect(0, 0, w, h);

  if (currentBgEffectType === "none") {
    bgCtx.drawImage(results.image, 0, 0, w, h);
    bgCtx.restore();
    return;
  }

  // 1. Draw core human segmentation mask
  bgCtx.globalCompositeOperation = "copy";
  bgCtx.drawImage(results.segmentationMask, 0, 0, w, h);

  // 2. Soft Edge Dilation & Feathering (prevents hair, ear, and face clipping)
  bgCtx.globalCompositeOperation = "destination-over";
  bgCtx.filter = "blur(3px)";
  bgCtx.drawImage(results.segmentationMask, 0, 0, w, h);
  bgCtx.filter = "none";

  // 2b. Optional Gen-Z Neon Silhouette Aura Glow Layer
  if (isNeonAuraActive) {
    bgCtx.save();
    bgCtx.shadowColor = "#06b6d4";
    bgCtx.shadowBlur = 20;
    bgCtx.globalCompositeOperation = "destination-over";
    bgCtx.drawImage(results.segmentationMask, 0, 0, w, h);
    bgCtx.restore();
  }

  // 3. Composite human video frame into the feathered mask
  bgCtx.globalCompositeOperation = "source-in";
  bgCtx.drawImage(results.image, 0, 0, w, h);

  // 4. Draw background layer behind human
  bgCtx.globalCompositeOperation = "destination-over";

  if (currentBgEffectType === "blur") {
    bgCtx.filter = `blur(${currentBlurRadius}px)`;
    bgCtx.drawImage(results.image, 0, 0, w, h);
    bgCtx.filter = "none";
  } else if (currentBgEffectType === "preset") {
    drawPresetBackground(bgCtx, currentBgPresetIndex, w, h);
  } else if (currentBgEffectType === "custom" && customBgImageObj && customBgImageObj.complete) {
    bgCtx.drawImage(customBgImageObj, 0, 0, w, h);
  } else {
    drawPresetBackground(bgCtx, 0, w, h);
  }

  bgCtx.restore();
}

function toggleBgEffectsPopover(e) {
  if (e) e.stopPropagation();
  const popover = document.getElementById("bg-effects-popover");
  if (!popover) return;
  popover.classList.toggle("closed");

  const beautyPopover = document.getElementById("beauty-slider-popover");
  if (beautyPopover && !beautyPopover.classList.contains("closed")) {
    beautyPopover.classList.add("closed");
  }
}

function filterBgCategory(cat) {
  currentBgCategory = cat;
  document.querySelectorAll(".bg-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.id === `bg-tab-${cat}`);
  });
  renderBgPresetsGrid();
}

function updateBgBlurRadius(val) {
  currentBlurRadius = parseInt(val, 10);
  const label = document.getElementById("bg-blur-val");
  if (label) label.textContent = `${currentBlurRadius}px`;
  localStorage.setItem("hashgang_bg_blur_radius", currentBlurRadius);
  selectBgEffect("blur");
}

function toggleNeonAuraGlow() {
  isNeonAuraActive = !isNeonAuraActive;
  localStorage.setItem("hashgang_bg_aura", isNeonAuraActive ? "true" : "false");
  updateBgUIControls();
  applyBgEffectToStreams();
  showShareToast(isNeonAuraActive ? "✨ Neon Silhouette Aura Glow: ON" : "Neon Aura Glow: OFF");
}

let isBgKeyboardListenerAdded = false;
function initBgKeyboardShortcut() {
  if (isBgKeyboardListenerAdded) return;
  isBgKeyboardListenerAdded = true;

  document.addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable)) {
      return;
    }
    if (e.key === "b" || e.key === "B") {
      if (currentBgEffectType !== "none") {
        previousNonOffBgType = currentBgEffectType;
        selectBgEffect("none");
        showShareToast("Key [B]: Virtual Background OFF 🚫");
      } else {
        selectBgEffect(previousNonOffBgType || "preset");
        showShareToast("Key [B]: Virtual Background ON 🎨");
      }
    }
  });
}

function renderBgPresetsGrid() {
  const container = document.getElementById("bg-presets-grid");
  if (!container) return;

  const filteredPresets = BG_PRESETS.filter((p) => {
    if (currentBgCategory === "all") return true;
    return p.category === currentBgCategory;
  });

  container.innerHTML = "";
  filteredPresets.forEach((preset) => {
    const idx = BG_PRESETS.indexOf(preset);
    const card = document.createElement("div");
    card.className = `bg-preset-card ${currentBgEffectType === "preset" && currentBgPresetIndex === idx ? "active" : ""}`;
    card.style.background = preset.thumb;
    card.onclick = (e) => {
      e.stopPropagation();
      selectBgEffect("preset", idx);
    };

    const label = document.createElement("span");
    label.className = "bg-preset-label";
    label.textContent = preset.name;
    card.appendChild(label);

    if (currentBgPresetIndex === idx && currentBgEffectType === "preset") {
      const badge = document.createElement("span");
      badge.className = "bg-preset-badge";
      badge.textContent = "ON";
      card.appendChild(badge);
    }

    container.appendChild(card);
  });
}

function selectBgEffect(type, detail) {
  currentBgEffectType = type;

  // Record that user explicitly interacted with background options
  localStorage.setItem("hashgang_bg_user_interacted", "true");

  if (type === "preset") {
    if (typeof detail === "number") currentBgPresetIndex = detail;
  } else if (type === "blur") {
    if (typeof detail === "number") currentBlurRadius = detail;
  }

  localStorage.setItem("hashgang_bg_type", currentBgEffectType);
  localStorage.setItem("hashgang_bg_preset", currentBgPresetIndex);
  localStorage.setItem("hashgang_bg_blur_radius", currentBlurRadius);

  renderBgPresetsGrid();
  updateBgUIControls();
  applyBgEffectToStreams();
}

function handleCustomBgUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const dataUrl = evt.target.result;
    customBgImageObj = new Image();
    customBgImageObj.onload = () => {
      try {
        localStorage.setItem("hashgang_bg_custom_data", dataUrl);
      } catch (err) {
        console.warn("Image too large for localStorage:", err);
      }
      selectBgEffect("custom");
    };
    customBgImageObj.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

function updateBgUIControls() {
  const btnEffectsList = [
    document.getElementById("btn-bg-effects"),
    document.getElementById("btn-bg-effects-mobile")
  ];
  const btnAura = document.getElementById("bg-btn-aura-glow");
  const lblCustom = document.getElementById("bg-lbl-custom");
  const btnOff = document.getElementById("bg-btn-off");

  if (btnAura) btnAura.classList.toggle("active", isNeonAuraActive);
  if (lblCustom) lblCustom.classList.toggle("active", currentBgEffectType === "custom");
  if (btnOff) btnOff.classList.toggle("active", currentBgEffectType === "none");

  const isBgActive = currentBgEffectType !== "none" || isNeonAuraActive;
  btnEffectsList.forEach((btn) => {
    if (btn) btn.classList.toggle("bg-effect-active", isBgActive);
  });
}

function applyBgEffectToStreams() {
  const activeStream = getActiveStream();

  if (elements.localVideo && elements.localVideo.srcObject !== activeStream) {
    elements.localVideo.srcObject = activeStream;
  }

  const pc = currentPeerConnection || (currentCall && currentCall.peerConnection);
  if (pc && activeStream) {
    const videoTrack = activeStream.getVideoTracks()[0];
    if (videoTrack) {
      const senders = pc.getSenders();
      const videoSender = senders.find((s) => s.track && s.track.kind === "video");
      if (videoSender) {
        videoSender.replaceTrack(videoTrack);
      }
    }
  }
}

/**
 * Send P2P Text Message over DataChannel
 */
function sendChatMessage() {
  const input = document.getElementById("chat-input") || elements.chatInput;
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  if (currentMatchTargetId && socket && socket.connected) {
    socket.emit("signal", {
      targetId: currentMatchTargetId,
      signal: { type: "chat", text: text }
    });
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
  const container = document.getElementById("chat-messages") || elements.chatMessages;
  if (!container) return;
  const msgEl = document.createElement("div");
  msgEl.className = `chat-msg ${type}`;
  msgEl.textContent = text;
  container.appendChild(msgEl);
  container.scrollTop = container.scrollHeight;
  triggerChatAutoFade();

  if (type === "received") {
    const drawer = document.getElementById("chat-drawer") || elements.chatDrawer;
    if (drawer && drawer.classList.contains("closed")) {
      unreadMessagesCount++;
      const badge = document.getElementById("unread-badge") || elements.unreadBadge;
      if (badge) {
        badge.textContent = unreadMessagesCount;
        badge.classList.remove("hidden");
      }
    }
  }
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
  if (bgProcessedStream) {
    bgProcessedStream.getAudioTracks().forEach((t) => (t.enabled = !isAudioMuted));
  }
  if (currentPeerConnection) {
    currentPeerConnection.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === "audio") {
        sender.track.enabled = !isAudioMuted;
      }
    });
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
  if (bgProcessedStream) {
    bgProcessedStream.getVideoTracks().forEach((t) => (t.enabled = !isVideoOff));
  }
  if (currentPeerConnection) {
    currentPeerConnection.getSenders().forEach((sender) => {
      if (sender.track && sender.track.kind === "video") {
        sender.track.enabled = !isVideoOff;
      }
    });
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
  const blockedPeerId = currentMatchTargetId || (currentCall && currentCall.peer);
  if (blockedPeerId) {
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
  isStoppedByUser = true;
  if (socket && socket.connected) {
    console.log("🛑 [Socket Matchmaker] Emitting leave_queue on stopCall...");
    socket.emit("leave_queue");
  }
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
  setTimeout(prefetchNextAdsterraAd, 1000);
}

/**
 * Clean Call State & Peer Objects (No Page Reload)
 */
function cleanupCallState() {
  pendingIceCandidates = [];
  stopSimulatedStrangerVideo();
  stopInCallAdsterraJitterEngine();
  stopInCallToolbarAutoHider();

  if (searchChunkTimer) {
    clearTimeout(searchChunkTimer);
    searchChunkTimer = null;
  }
  if (hostConnectTimeout) {
    clearTimeout(hostConnectTimeout);
    hostConnectTimeout = null;
  }
  if (retryMatchmakingTimeout) {
    clearTimeout(retryMatchmakingTimeout);
    retryMatchmakingTimeout = null;
  }
  if (simulatedFallbackTimeout) {
    clearTimeout(simulatedFallbackTimeout);
    simulatedFallbackTimeout = null;
  }

  if (currentPeerConnection) {
    try {
      currentPeerConnection.close();
    } catch (e) {}
    currentPeerConnection = null;
  }
  currentMatchTargetId = null;

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

  if (elements.remoteVideo) {
    elements.remoteVideo.srcObject = null;
  }

  // Wipe chat history cleanly for complete privacy across new stranger connections
  if (elements.chatMessages) {
    elements.chatMessages.innerHTML = "";
  }
  unreadMessagesCount = 0;
  if (elements.unreadBadge) {
    elements.unreadBadge.classList.add("hidden");
  }

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
const MIN_SEARCHING_DWELL_MS = 4200; // 4.2s Guaranteed Impression Gate (3s Adsterra + 1.2s safety buffer)
let searchingCountdownInterval = null;

function renderSearchingAdsterraBanner() {
  const box = document.getElementById("searching-adsterra-banner-container");
  if (!box) return;
  renderMediationAdInContainer(box);
}

// Background Adsterra Pre-Fetch Buffer State
let prefetchedAdElement = null;
let prefetchedProviderId = null;

/**
 * Pre-fetch Adsterra/Waterfall Ad in Background Buffer for Instant (0ms) Display
 */
function prefetchNextAdsterraAd() {
  const buffer = document.getElementById("adsterra-prefetch-buffer");
  if (!buffer) return;

  // Don't overwrite if buffer already has a fresh pre-fetched ad ready
  if (prefetchedAdElement && buffer.contains(prefetchedAdElement)) return;

  const selection = selectWaterfallAdProvider();
  if (!selection || selection.type !== "provider") return;

  const p = selection.data;
  try {
    buffer.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.style.width = `${p.width || 300}px`;
    iframe.style.height = `${p.height || 250}px`;
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.style.borderRadius = "8px";
    iframe.style.background = "transparent";
    iframe.scrolling = "no";

    buffer.appendChild(iframe);

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
    } else if (iframe.contentWindow) {
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(htmlString);
      doc.close();
    }

    prefetchedAdElement = iframe;
    prefetchedProviderId = p.id;
  } catch (e) {
    console.warn("Ad pre-fetch notice:", e);
  }
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
    // Retain socket online users count dynamically
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
  currentOnlineUsersCount = Math.max(0, count);
  const badgeEl = document.getElementById("online-users-badge");

  if (currentOnlineUsersCount < MIN_ONLINE_USERS_THRESHOLD) {
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

const ADSTERRA_TIMESTAMPS_KEY = "sc_adsterra_impression_timestamps";

function getAdsterraImpressionTimestamps() {
  try {
    const raw = localStorage.getItem(ADSTERRA_TIMESTAMPS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    const now = Date.now();
    // Filter timestamps within last rolling 60 minutes (3,600,000 ms)
    return Array.isArray(arr) ? arr.filter((ts) => now - ts < 3600000) : [];
  } catch (e) {
    return [];
  }
}

function recordAdsterraImpression() {
  try {
    const timestamps = getAdsterraImpressionTimestamps();
    timestamps.push(Date.now());
    localStorage.setItem(ADSTERRA_TIMESTAMPS_KEY, JSON.stringify(timestamps));
  } catch (e) {}
}

function getRollingHourlyImpressionCount() {
  return getAdsterraImpressionTimestamps().length;
}

function getTimeSinceLastAdsterraStart() {
  const timestamps = getAdsterraImpressionTimestamps();
  if (timestamps.length === 0) return Infinity;
  const lastStart = timestamps[timestamps.length - 1];
  return Date.now() - lastStart;
}

let isAdBlockerDetected = false;

/**
 * Universal Browser-Agnostic AdBlocker Detector
 * Checks DOM trap element hiding (used by Brave, uBlock, AdGuard, ABP).
 */
function runUniversalAdBlockerProbe() {
  try {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalhost) {
      isAdBlockerDetected = false;
      return;
    }

    const trap = document.createElement("div");
    trap.className = "adsbygoogle";
    trap.style.position = "absolute";
    trap.style.top = "-9999px";
    trap.style.left = "-9999px";
    trap.style.height = "10px";
    trap.style.width = "10px";
    document.body.appendChild(trap);

    setTimeout(() => {
      if (
        trap.offsetHeight === 0 ||
        window.getComputedStyle(trap).display === "none"
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

  // 1. Tab Visibility Check: If page is in background/minimized, serve selfBrandFallback directly!
  if (document.visibilityState && document.visibilityState !== "visible") {
    if (config.selfBrandFallback && config.selfBrandFallback.enabled !== false) {
      return { type: "selfBrandFallback", data: config.selfBrandFallback };
    }
  }

  // 2. AdBlocker / Brave Detection Check
  if (isAdBlockerDetected) {
    if (config.selfBrandFallback && config.selfBrandFallback.enabled !== false) {
      return { type: "selfBrandFallback", data: config.selfBrandFallback };
    }
  }

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";

  if (isLocalhost && config.settings && config.settings.skipOnLocalhost) {
    if (config.selfBrandFallback && config.selfBrandFallback.enabled !== false) {
      return { type: "selfBrandFallback", data: config.selfBrandFallback };
    }
    return null;
  }

  const settings = config.settings || {};
  const hourlyCap = settings.hourlyCapPerUser || 4;
  const minInterval = settings.minAdIntervalMs || 40000; // 40s total interval (35s post-end)

  // 3. Rolling Hourly Impression Cap (max 4 per 60 mins across all screens)
  const hourlyCount = getRollingHourlyImpressionCount();
  if (hourlyCount >= hourlyCap) {
    if (config.selfBrandFallback && config.selfBrandFallback.enabled !== false) {
      return { type: "selfBrandFallback", data: config.selfBrandFallback };
    }
  }

  // 4. Minimum Deduplication Interval (40 seconds minimum between Adsterra ad starts)
  const elapsedSinceLastAd = getTimeSinceLastAdsterraStart();
  if (elapsedSinceLastAd < minInterval) {
    if (config.selfBrandFallback && config.selfBrandFallback.enabled !== false) {
      return { type: "selfBrandFallback", data: config.selfBrandFallback };
    }
  }

  const tracker = getMediationDailyTracker();
  const providers = config.providers || [];
  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    if (p && p.enabled !== false) {
      const dailyCount = tracker[p.id] || 0;
      if (p.dailyCapPerUser && dailyCount >= p.dailyCapPerUser) {
        continue;
      }
      return { type: "provider", data: p };
    }
  }

  if (config.selfBrandFallback && config.selfBrandFallback.enabled !== false) {
    return { type: "selfBrandFallback", data: config.selfBrandFallback };
  }

  return null;
}

function renderMediationAdInContainer(containerBox) {
  if (!containerBox) return;

  const selection = selectWaterfallAdProvider();
  if (!selection || selection.type === "selfBrandFallback") {
    renderSelfBrandCard(containerBox);
    return;
  }

  if (selection.type === "provider") {
    const p = selection.data;

    try {
      containerBox.innerHTML = "";
      containerBox.classList.remove("hidden", "fading-out");

      const scriptOpts = document.createElement("script");
      scriptOpts.type = "text/javascript";
      scriptOpts.text = `
        atOptions = {
          'key' : '${p.invokeKey}',
          'format' : 'iframe',
          'height' : ${p.height || 250},
          'width' : ${p.width || 300},
          'params' : {}
        };
      `;

      const scriptInvoke = document.createElement("script");
      scriptInvoke.type = "text/javascript";
      scriptInvoke.src = p.scriptUrl;

      containerBox.appendChild(scriptOpts);
      containerBox.appendChild(scriptInvoke);

      recordAdsterraImpression();
      incrementMediationImpressionCount(p.id);
    } catch (e) {
      console.warn("Mediation ad render notice:", e);
      renderSelfBrandCard(containerBox);
    }
  }
}

let inCallAdsterraTimer = null;
let inCallAdsterraHideTimer = null;

/**
 * Show Live In-Call Adsterra Sponsored Banner Overlay (Auto-disappears after 4.2s viewability threshold)
 */
function showInCallAdsterraBanner() {
  hideInCallAdsterraBanner();
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

function startInCallAdsterraJitterEngine() {
  stopInCallAdsterraJitterEngine();
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

let dynamicWatermarkTimer = null;

function getSessionTraceId() {
  if (!traceIdSessionKey) {
    traceIdSessionKey = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  return traceIdSessionKey;
}

function updateWatermarkDisplay() {
  const code = getSessionTraceId();
  const els = document.querySelectorAll(".trace-code-val");
  els.forEach((el) => {
    el.textContent = code;
  });

  if (!dynamicWatermarkTimer) {
    shiftDynamicWatermarkNodes();
    dynamicWatermarkTimer = setInterval(shiftDynamicWatermarkNodes, 3500);
  }
}

function shiftDynamicWatermarkNodes() {
  const node = document.getElementById("watermark-single-node");
  if (node) {
    const top = Math.floor(Math.random() * 70) + 10; // 10% to 80%
    const left = Math.floor(Math.random() * 70) + 10; // 10% to 80%
    node.style.top = top + "%";
    node.style.left = left + "%";
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
  showShareToast("⛔ Security Cooldown: Multiple tab switches or restricted actions detected. 60s cooldown active to protect stranger privacy.", 6000);

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
    showShareToast("✅ Cooldown Complete! Click 'Start Chat' to connect with strangers.", 4000);
  }, 60000);
}

function showPeerPrivacyViolationAlert(reason = "restricted_action") {
  showShareToast("🔒 Privacy Alert: Stranger switched tabs or attempted a restricted action.", 4000);
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
      showShareToast("⚠️ Privacy Shield Active: You switched tabs/browsers. Return to chat tab.", 3000);
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
window.toggleBgEffectsPopover = toggleBgEffectsPopover;
window.selectBgEffect = selectBgEffect;
window.handleCustomBgUpload = handleCustomBgUpload;
window.filterBgCategory = filterBgCategory;
window.updateBgBlurRadius = updateBgBlurRadius;
window.toggleNeonAuraGlow = toggleNeonAuraGlow;
window.showPwaInstallPrompt = showPwaInstallPrompt;
window.hidePwaInstallPrompt = hidePwaInstallPrompt;
window.handlePwaInstallAction = handlePwaInstallAction;
window.handlePwaDismissAction = handlePwaDismissAction;
window.handlePwaMenuClick = handlePwaMenuClick;

/* ==========================================================================
   Delayed PWA Installation Engine
   (Condition A: 4-min connected call OR Condition B: 6-min active site usage)
   ========================================================================== */

const PWA_CALL_ELIGIBILITY_MS = 240000; // 4 Minutes (240,000ms) of connected call duration
const PWA_ACTIVE_USAGE_ELIGIBILITY_MS = 360000; // 6 Minutes (360,000ms) of active site usage
let deferredInstallPrompt = null;
let activeWebsiteUsageMs = 0;
let connectedCallUsageMs = 0;
let isPwaEligible = false;
let isPwaPromptShowing = false;
let pwaEligibilityTimer = null;

function getBrowserPlatformInfo() {
  const ua = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isLinux = /Linux|Ubuntu/i.test(ua);
  const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/i.test(ua) && !isIOS;
  const isWindows = /Win32|Win64|Windows|WinCE/i.test(ua);

  const isChrome = /Chrome|CriOS|HeadlessChrome/i.test(ua) && !/Edg|OPR|Brave/i.test(ua);
  const isEdge = /Edg/i.test(ua);
  const isSafari = (isIOS || /Safari/i.test(ua)) && !/Chrome|CriOS|HeadlessChrome|Edg|OPR|Brave|Android/i.test(ua);

  return { isIOS, isAndroid, isLinux, isMac, isWindows, isChrome, isEdge, isSafari };
}

function isSafariBrowser() {
  return getBrowserPlatformInfo().isSafari;
}

function isIOSUserAgent() {
  return getBrowserPlatformInfo().isIOS;
}

function isPwaAlreadyInstalled() {
  if (localStorage.getItem("pwa_installed") === "true") return true;
  if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
  if (window.navigator.standalone === true) return true;
  return false;
}

function getTodayDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isPwaDismissedToday() {
  const dismissedDate = localStorage.getItem("pwa_dismissed_date");
  return dismissedDate === getTodayDateString();
}

function showPwaInstallPrompt(force = false) {
  if (isPwaAlreadyInstalled() && !force) {
    refreshElements();
    if (elements.menuBtnInstallPwa) elements.menuBtnInstallPwa.style.display = "none";
    return;
  }
  if (isPwaDismissedToday() && !force) return;
  if (isPwaPromptShowing) return;

  refreshElements();
  if (!elements.pwaInstallModal) return;

  isPwaPromptShowing = true;

  const { isIOS, isSafari, isLinux } = getBrowserPlatformInfo();

  // Safari / iOS Safari Guidance (Hidden strictly on Linux / Windows / Android Chrome)
  if ((isIOS || isSafari) && !deferredInstallPrompt) {
    if (elements.pwaIosInstructions) {
      elements.pwaIosInstructions.style.display = "flex";
      elements.pwaIosInstructions.classList.remove("hidden");
    }
    if (elements.pwaInstallBtnText) elements.pwaInstallBtnText.textContent = "Got It";
    if (elements.pwaInstallIcon) elements.pwaInstallIcon.className = "fa-solid fa-check";
  } else {
    if (elements.pwaIosInstructions) {
      elements.pwaIosInstructions.style.display = "none";
      elements.pwaIosInstructions.classList.add("hidden");
    }
    if (elements.pwaInstallBtnText) elements.pwaInstallBtnText.textContent = "Install App";
    if (elements.pwaInstallIcon) elements.pwaInstallIcon.className = "fa-solid fa-download";
  }

  // Linux OS Desktop Shortcut Hint (Shown strictly on Linux)
  if (isLinux) {
    if (elements.pwaLinuxNote) {
      elements.pwaLinuxNote.style.display = "flex";
      elements.pwaLinuxNote.classList.remove("hidden");
    }
  } else {
    if (elements.pwaLinuxNote) {
      elements.pwaLinuxNote.style.display = "none";
      elements.pwaLinuxNote.classList.add("hidden");
    }
  }

  elements.pwaInstallModal.style.display = "flex";
  elements.pwaInstallModal.classList.remove("hidden");
}

function handlePwaMenuClick(e) {
  if (e) e.preventDefault();
  const popover = document.getElementById("app-nav-popover");
  if (popover) popover.classList.add("hidden");

  // Open the PWA Install Card UI consistently
  showPwaInstallPrompt(true);
}

function hidePwaInstallPrompt() {
  isPwaPromptShowing = false;
  refreshElements();
  if (elements.pwaInstallModal) {
    elements.pwaInstallModal.style.display = "none";
    elements.pwaInstallModal.classList.add("hidden");
  }
}

async function handlePwaInstallAction() {
  if (isIOSUserAgent()) {
    localStorage.setItem("pwa_dismissed_date", getTodayDateString());
    hidePwaInstallPrompt();
    return;
  }

  if (deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      console.log("PWA install prompt user choice outcome:", outcome);
      if (outcome === "accepted") {
        localStorage.setItem("pwa_installed", "true");
      } else {
        localStorage.setItem("pwa_dismissed_date", getTodayDateString());
      }
    } catch (e) {
      console.warn("PWA install prompt error:", e);
      localStorage.setItem("pwa_dismissed_date", getTodayDateString());
    }
    deferredInstallPrompt = null;
  } else {
    localStorage.setItem("pwa_dismissed_date", getTodayDateString());
  }

  hidePwaInstallPrompt();
}

function handlePwaDismissAction() {
  localStorage.setItem("pwa_dismissed_date", getTodayDateString());
  hidePwaInstallPrompt();
}

function initPwaInstallEngine() {
  // Capture Chromium beforeinstallprompt event immediately without showing UI
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log("PWA beforeinstallprompt event captured & deferred.");
  });

  window.addEventListener("appinstalled", () => {
    console.log("PWA appinstalled event detected.");
    localStorage.setItem("pwa_installed", "true");
    deferredInstallPrompt = null;
    hidePwaInstallPrompt();
    refreshElements();
    if (elements.menuBtnInstallPwa) elements.menuBtnInstallPwa.style.display = "none";
  });

  if (isPwaAlreadyInstalled()) {
    refreshElements();
    if (elements.menuBtnInstallPwa) elements.menuBtnInstallPwa.style.display = "none";
  }

  if (pwaEligibilityTimer) clearInterval(pwaEligibilityTimer);
  pwaEligibilityTimer = setInterval(() => {
    if (isPwaAlreadyInstalled() || isPwaPromptShowing) return;

    // Track active website usage (only when tab is visible)
    if (!document.hidden) {
      activeWebsiteUsageMs += 1000;
    }

    // Track connected call usage (only when call stream is active & connected)
    const isCallConnected = (currentCall && currentCall.open) || isSimulatedCallActive;
    if (isCallConnected && !document.hidden) {
      connectedCallUsageMs += 1000;
    }

    // Evaluate eligibility: 4-min connected call OR 6-min active site usage
    if (!isPwaEligible) {
      if (connectedCallUsageMs >= PWA_CALL_ELIGIBILITY_MS || activeWebsiteUsageMs >= PWA_ACTIVE_USAGE_ELIGIBILITY_MS) {
        isPwaEligible = true;
        console.log(`PWA install eligibility satisfied! (Call connected: ${connectedCallUsageMs / 1000}s, Active site usage: ${activeWebsiteUsageMs / 1000}s)`);
      }
    }

    // Show prompt at natural break points (when call is not actively ongoing)
    if (isPwaEligible && !isPwaDismissedToday()) {
      const isUserInActiveCall = currentCall && currentCall.open;
      if (!isUserInActiveCall) {
        showPwaInstallPrompt();
      }
    }
  }, 1000);
}

window.pwaEngine = {
  getStats: () => ({
    activeWebsiteUsageMs,
    connectedCallUsageMs,
    isPwaEligible,
    isPwaPromptShowing,
    isInstalled: isPwaAlreadyInstalled(),
    isDismissedToday: isPwaDismissedToday(),
    hasDeferredPrompt: !!deferredInstallPrompt
  }),
  simulateEligibility: (callMs = 240000, siteMs = 360000) => {
    connectedCallUsageMs = callMs;
    activeWebsiteUsageMs = siteMs;
    isPwaEligible = true;
    showPwaInstallPrompt();
  },
  resetDismissed: () => {
    localStorage.removeItem("pwa_dismissed_date");
    localStorage.removeItem("pwa_installed");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  detectCameraDevices();
  initBeautyFilter();
  initBgEffectState();
  initAntiScreenRecording();
  initAntiDevToolsProtection();
  initScreenCaptureInterception();
  initVisualViewportHandler();
  initSocketConnection();
});


