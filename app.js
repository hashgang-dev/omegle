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

// Native Sponsored Video Ads Config & Pool (Monetization Engine)
const AD_FREQUENCY = 3; // Trigger a sponsored video ad every 3rd stranger match attempt
const AD_TIMEOUT_SECONDS = 8; // 8-second auto-skip countdown timer

let matchCounter = 0;
let isAdPlaying = false;
let adTimerInterval = null;
let hostConnectTimeout = null;
let retryMatchmakingTimeout = null;

const adsPool = (typeof SPONSORED_ADS_POOL !== "undefined" && SPONSORED_ADS_POOL.length) 
  ? SPONSORED_ADS_POOL 
  : [
      {
        id: "ad-1",
        title: "CyberShield High-Speed VPN",
        desc: "Encrypt your P2P video calls and protect your privacy worldwide.",
        videoUrl: "assets/ads/vpn_ad.mp4",
        linkUrl: "https://google.com",
        badgeText: "FEATURED PARTNER"
      }
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
        credential: "openrelay"
      },
      {
        urls: "turn:openrelay.metered.ca:443",
        username: "openrelay",
        credential: "openrelay"
      },
      {
        urls: "turn:openrelay.metered.ca:443?transport=tcp",
        username: "openrelay",
        credential: "openrelay"
      }
    ]
  }
};

// DOM Elements
const elements = {
  localVideo: document.getElementById("local"),
  remoteVideo: document.getElementById("remote"),
  btnMute: document.getElementById("btn-mute"),
  btnVideo: document.getElementById("btn-video"),
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
  onlineUsersCount: document.getElementById("online-users-count")
};

let currentOnlineUsersCount = 1;

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupEventListeners();
  updateStatus("idle", "Click Start Chat to Connect");
  updateToolbarVisibility("idle");
  recordVisitBackend();
  fetchActiveUsersBackend();

  // Poll active users count every 15 seconds
  setInterval(fetchActiveUsersBackend, 15000);

  // Prompt Terms of Service & Age Consent Modal on Page Load if missing/expired
  if (!isTosConsentValid()) {
    showTosModal();
  }
});

function setupEventListeners() {
  if (elements.btnThemeToggle) {
    elements.btnThemeToggle.addEventListener("click", toggleTheme);
  }

  if (elements.chkAge && elements.chkTos) {
    const updateAgreeButton = () => {
      elements.btnTosAgree.disabled = !(elements.chkAge.checked && elements.chkTos.checked);
    };
    elements.chkAge.addEventListener("change", updateAgreeButton);
    elements.chkTos.addEventListener("change", updateAgreeButton);
  }

  if (elements.btnTosAgree) {
    elements.btnTosAgree.addEventListener("click", acceptTosAndProceed);
  }

  elements.btnNext.addEventListener("click", handleStartOrNext);
  elements.btnStop.addEventListener("click", stopCall);
  elements.btnMute.addEventListener("click", toggleAudio);
  elements.btnVideo.addEventListener("click", toggleVideo);
  
  if (elements.btnReport) {
    elements.btnReport.addEventListener("click", reportAndBlockStranger);
  }

  elements.btnChatToggle.addEventListener("click", toggleChatDrawer);
  elements.btnCloseChat.addEventListener("click", () => elements.chatDrawer.classList.add("closed"));
  elements.btnSendChat.addEventListener("click", sendChatMessage);
  
  elements.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });

  // Custom Ad Control Event Listeners
  if (elements.btnAdPlayPause) {
    elements.btnAdPlayPause.addEventListener("click", toggleAdPlayPause);
  }
  if (elements.btnAdRewind) {
    elements.btnAdRewind.addEventListener("click", rewindAd5Seconds);
  }
  if (elements.btnAdSkip) {
    elements.btnAdSkip.addEventListener("click", skipAdAndProceed);
  }
  if (elements.sponsoredCtaLink) {
    elements.sponsoredCtaLink.addEventListener("click", () => {
      if (isAdPlaying && currentAdConfig) {
        recordAdImpressionBackend(currentAdConfig, adMaxWatchedTime, false, false, true);
      }
    });
  }
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
  return (Date.now() - acceptedAt) < TOS_EXPIRATION_MS;
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
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme, true);
}

/**
 * Handle Start / Next Stranger Click
 */
async function handleStartOrNext() {
  hideFirewallWarning();

  // Enforce Terms of Service & Age Consent (24-Hour Session Expiry)
  if (!isTosConsentValid()) {
    showTosModal();
    return;
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

  // Trigger Native Sponsored Video Ad every N-th match (e.g. Every 3rd match)
  if (matchCounter % AD_FREQUENCY === 0) {
    playSponsoredVideoAd();
    return;
  }

  elements.btnNextLabel.textContent = "Next Stranger";
  updateStatus("searching", "Searching for a Stranger...");
  updateToolbarVisibility("searching");
  showSearchingOverlay("Searching for a Stranger...", "Connecting you to a random stranger worldwide...");

  // Start automated zero-cost matchmaking
  findAndConnectPeer();
}

/**
 * Native Sponsored Video Ad Engine (Product & Architect Specification)
 */
let currentAdIndex = 0;
let adMaxWatchedTime = 0;
let currentAdConfig = null;

function playSponsoredVideoAd() {
  isAdPlaying = true;
  adMaxWatchedTime = 0;
  hideSearchingOverlay();
  hideFirewallWarning();

  // Select ad item sequentially using Round-Robin rotation
  currentAdConfig = adsPool[currentAdIndex];
  currentAdIndex = (currentAdIndex + 1) % adsPool.length;

  // Update Ad Overlay Metadata Text & Links
  if (elements.sponsoredTitle) elements.sponsoredTitle.textContent = currentAdConfig.title;
  if (elements.sponsoredDesc) elements.sponsoredDesc.textContent = currentAdConfig.desc;
  if (elements.sponsoredBadgeText) elements.sponsoredBadgeText.textContent = currentAdConfig.badgeText;
  if (elements.sponsoredCtaLink) elements.sponsoredCtaLink.href = currentAdConfig.linkUrl;

  // Initialize Skip Button State
  updateSkipButtonState(0);

  // Show Ad Overlay Card & Hide Main Control Toolbar and Local PIP Feed
  if (elements.sponsoredOverlay) elements.sponsoredOverlay.classList.remove("hidden");
  if (elements.controlToolbar) elements.controlToolbar.classList.add("hidden");
  if (elements.localPipContainer) elements.localPipContainer.classList.add("hidden");

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

  video.play().catch(e => console.warn("Video Ad Autoplay Notice:", e));

  if (elements.adPlayPauseIcon) elements.adPlayPauseIcon.className = "fa-solid fa-pause";
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
  if (elements.adProgressBar) elements.adProgressBar.style.width = `${progressPercent}%`;

  const currentFmt = formatTime(video.currentTime);
  const durationFmt = formatTime(video.duration);
  if (elements.adTimeDisplay) elements.adTimeDisplay.textContent = `${currentFmt} / ${durationFmt}`;

  // 3. Skip Threshold Evaluation
  updateSkipButtonState(video.currentTime);
}

function updateSkipButtonState(currentTime) {
  if (!currentAdConfig || !elements.btnAdSkip || !elements.adSkipText) return;

  const video = elements.remoteVideo;
  const videoDuration = (video && video.duration && !isNaN(video.duration)) ? video.duration : null;
  const rawThreshold = currentAdConfig.skipAfterSeconds;

  // Smart Edge Case Handling: If ad video duration is shorter than skip threshold (e.g. 6s video vs 10s skip),
  // treat it as a short unskippable ad that finishes naturally!
  let threshold = rawThreshold;
  if (videoDuration && typeof rawThreshold === "number" && videoDuration <= rawThreshold) {
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
    if (elements.adPlayPauseIcon) elements.adPlayPauseIcon.className = "fa-solid fa-pause";
  } else {
    video.pause();
    if (elements.adPlayPauseIcon) elements.adPlayPauseIcon.className = "fa-solid fa-play";
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
    recordAdImpressionBackend(currentAdConfig, adMaxWatchedTime, false, true, false);
  }
  cleanupAdState();

  // Directly start searching for stranger (bypass handleStartOrNext matchCounter trigger)
  elements.btnNextLabel.textContent = "Next Stranger";
  updateStatus("searching", "Searching for a Stranger...");
  updateToolbarVisibility("searching");
  showSearchingOverlay("Searching for a Stranger...", "Connecting you to a random stranger worldwide...");
  findAndConnectPeer();
}

function handleAdEnded() {
  if (!isAdPlaying) return;
  console.log("Ad video ended naturally. Transitioning directly to stranger search...");
  if (currentAdConfig) {
    recordAdImpressionBackend(currentAdConfig, adMaxWatchedTime, true, false, false);
  }
  cleanupAdState();

  // Directly start searching for stranger
  elements.btnNextLabel.textContent = "Next Stranger";
  updateStatus("searching", "Searching for a Stranger...");
  updateToolbarVisibility("searching");
  showSearchingOverlay("Searching for a Stranger...", "Connecting you to a random stranger worldwide...");
  findAndConnectPeer();
}

function cleanupAdState() {
  isAdPlaying = false;
  adMaxWatchedTime = 0;
  currentAdConfig = null;

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

  if (elements.sponsoredOverlay) elements.sponsoredOverlay.classList.add("hidden");
  if (elements.controlToolbar) elements.controlToolbar.classList.remove("hidden");
  if (elements.localPipContainer) elements.localPipContainer.classList.remove("hidden");
  if (elements.adPlayPauseIcon) elements.adPlayPauseIcon.className = "fa-solid fa-pause";
}

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Capture Local User Camera and Microphone
 */
async function initLocalMedia() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: true
    });
    elements.localVideo.srcObject = localStream;

    // Remove permission overlay if previously shown
    const existingOverlay = document.getElementById("media-perm-overlay");
    if (existingOverlay) existingOverlay.remove();

    return true;
  } catch (err) {
    console.error("Camera/Mic Permission Error:", err);
    showMediaPermissionError();
    updateStatus("error", "Permission Denied");
    hideSearchingOverlay();
    return false;
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
    console.log("Registered Peer ID:", id, "Targeting Lobby Slot:", targetHostId);
    
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

  // If host doesn't respond within 2.5 seconds, become the waiting host
  hostConnectTimeout = setTimeout(() => {
    hostConnectTimeout = null;
    if (!connected && currentCall !== call && !isAdPlaying) {
      call.close();
      becomeWaitingHost(hostId);
    }
  }, 2500);
}

/**
 * Register current peer as the waiting Host on a public slot
 */
function becomeWaitingHost(hostId) {
  // Never disrupt an active Video Ad!
  if (isAdPlaying) return;

  if (peer && !peer.destroyed) peer.destroy();

  // Initialize peer with the host slot ID
  peer = new Peer(hostId, STUN_CONFIG);

  peer.on("open", (id) => {
    myPeerId = id;
    console.log("Waiting as Host on slot:", id);
    if (!isAdPlaying) {
      updateStatus("searching", "Waiting for a stranger to join...");
      showSearchingOverlay("Waiting for a Stranger...", "You are in the waiting queue. A peer will connect shortly.");
    }
  });

  peer.on("call", (call) => {
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
  call.answer(localStream);
  currentCall = call;

  call.on("stream", (remoteStream) => {
    onPeerConnected(remoteStream);
    monitorICEConnection(call);
  });
}

/**
 * Monitor WebRTC ICE Connection State for Disconnects & Reconnections
 */
function monitorICEConnection(call) {
  if (!call || !call.peerConnection) return;

  call.peerConnection.oniceconnectionstatechange = () => {
    const state = call.peerConnection.iceConnectionState;
    console.log("ICE Connection State:", state);

    if (state === "connected" || state === "completed") {
      hideSearchingOverlay();
      hideFirewallWarning();
      updateStatus("connected", "Connected with Stranger");
    } else if (state === "disconnected") {
      // Temporary network drop (e.g. cellular signal glitch) - WebRTC auto-reconnecting
      updateStatus("searching", "Reconnecting stranger...");
    } else if (state === "failed" || state === "closed") {
      // Permanent disconnect
      updateStatus("idle", "Stranger disconnected");
      appendSystemChatMessage("Stranger has left or disconnected.");
      cleanupCallState();
    }
  };
}

/**
 * Triggered when P2P Connection & Video Stream are successfully established
 */
function onPeerConnected(remoteStream) {
  elements.remoteVideo.srcObject = remoteStream;
  hideSearchingOverlay();
  hideFirewallWarning();
  updateStatus("connected", "Connected with Stranger");
  updateToolbarVisibility("connected");
  
  // Enable Chat Input
  elements.chatInput.disabled = false;
  elements.btnSendChat.disabled = false;
  
  appendSystemChatMessage("Connected with a stranger. Say hi!");
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
    appendChatMessage(data, "received");
    
    // Increment unread badge if drawer is closed
    if (elements.chatDrawer.classList.contains("closed")) {
      unreadMessagesCount++;
      elements.unreadBadge.textContent = unreadMessagesCount;
      elements.unreadBadge.classList.remove("hidden");
    }
  });

  chatConn.on("close", () => {
    elements.chatInput.disabled = true;
    elements.btnSendChat.disabled = true;
    appendSystemChatMessage("Stranger disconnected from chat.");
  });
}

/**
 * Send P2P Text Message over DataChannel
 */
function sendChatMessage() {
  const text = elements.chatInput.value.trim();
  if (!text) return;

  if (chatConn && chatConn.open) {
    chatConn.send(text);
    appendChatMessage(text, "sent");
    elements.chatInput.value = "";
  } else {
    appendSystemChatMessage("Cannot send message: P2P chat connection is not active.");
  }
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
}

function appendSystemChatMessage(text) {
  const msgEl = document.createElement("div");
  msgEl.className = "chat-msg system";
  msgEl.textContent = text;
  elements.chatMessages.appendChild(msgEl);
  elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

/**
 * Toggle Audio Mute
 */
function toggleAudio() {
  if (!localStream) return;
  isAudioMuted = !isAudioMuted;
  localStream.getAudioTracks().forEach(t => t.enabled = !isAudioMuted);
  
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
  localStream.getVideoTracks().forEach(t => t.enabled = !isVideoOff);
  
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
      const blocked = JSON.parse(localStorage.getItem("p2p_blocked_peers") || "[]");
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
  elements.chatDrawer.classList.toggle("closed");
  if (!elements.chatDrawer.classList.contains("closed")) {
    unreadMessagesCount = 0;
    elements.unreadBadge.classList.add("hidden");
    elements.chatInput.focus();
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
    localStream.getTracks().forEach(t => t.stop());
    localStream = null;
  }
  if (elements.localVideo) {
    elements.localVideo.srcObject = null;
  }

  updateStatus("idle", "Click Start Chat to Connect");
  hideSearchingOverlay();
  hideFirewallWarning();
  updateToolbarVisibility("idle");
}

/**
 * Clean Call State & Peer Objects (No Page Reload)
 */
function cleanupCallState() {
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
    try { currentCall.close(); } catch (e) {}
    currentCall = null;
  }

  if (chatConn) {
    try { chatConn.close(); } catch (e) {}
    chatConn = null;
  }

  if (peer && !peer.destroyed) {
    try { peer.destroy(); } catch (e) {}
    peer = null;
  }

  elements.remoteVideo.srcObject = null;
  elements.chatInput.disabled = true;
  elements.btnSendChat.disabled = true;
  
  // Wipe chat history for end-to-end privacy across strangers
  elements.chatMessages.innerHTML = '<div class="chat-msg system">Messages are end-to-end encrypted and never stored on any server.</div>';
  unreadMessagesCount = 0;
  elements.unreadBadge.classList.add("hidden");
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
  elements.overlaySub.textContent = sub || `Connecting you to 1 stranger among ${currentOnlineUsersCount.toLocaleString()} online strangers worldwide...`;
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
    vid = "v_" + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
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
      body: JSON.stringify({ visitorId, country: "UNKNOWN", device })
    }).catch(e => console.warn("Visit log API notice:", e));
  } catch (e) {}
}

async function recordAdImpressionBackend(adConfig, durationWatched, completedFull, skipped, clickedCta) {
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
        visitorId
      })
    }).catch(e => console.warn("Ad impression API notice:", e));
  } catch (e) {}
}

async function recordSessionTimeBackend(durationSeconds = 30) {
  if (typeof BACKEND_API_BASE === "undefined") return;
  try {
    const visitorId = getVisitorId();
    fetch(`${BACKEND_API_BASE}/analytics/session-time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, durationSeconds, matchesCount: matchCounter })
    }).catch(e => console.warn("Session time API notice:", e));
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
  if (elements.onlineUsersCount) {
    elements.onlineUsersCount.textContent = currentOnlineUsersCount.toLocaleString();
  }
}
