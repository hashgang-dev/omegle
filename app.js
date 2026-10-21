/**
 * HashGANG Chat v2 - Streamlined WebRTC & Socket.io Engine
 * Modular 3-Stage User Experience Architecture
 */

// Application State Variables
let socket = null;
let localStream = null;
let currentPeerConnection = null;
let currentMatchTargetId = null;
let currentChatMode = "text"; // Default Mode: 'text' | 'audio' | 'video'
window.currentChatMode = currentChatMode;
let isStoppedByUser = true;
let isAudioMuted = false;
let isVideoOff = false;
let inCall = false;
window.inCall = inCall;

// Group Chat State Variables (Multiplayer Fallback & 1v1 Hub)
let currentNickname = localStorage.getItem("hg_user_nickname") || "";
let is18Confirmed = localStorage.getItem("hg_18_confirmed") === "true";
let activeGroupRoomId = null;
let activeGroupRoomNumber = 1;
let activeGroupReplyTo = null; // { id, nickname, text }
let liveGroupMsgCounter = 0;

// DOM Elements Registry
let el = {};

function initDOMElements() {
  el = {
    statusPill: document.getElementById("v2-status-pill"),
    statusDot: document.getElementById("v2-status-dot"),
    statusText: document.getElementById("v2-status-text"),
    searchStage: document.getElementById("v2-search-stage"),
    searchTitle: document.getElementById("v2-search-title"),
    searchSub: document.getElementById("v2-search-sub"),
    permGuideBox: document.getElementById("v2-perm-guide-box"),
    engagedBox: document.getElementById("v2-engaged-box"),
    remoteVideo: document.getElementById("remote"),
    localVideo: document.getElementById("local"),
    localPip: document.getElementById("v2-local-pip"),
    audioVisualizer: document.getElementById("v2-audio-avatar-overlay"),
    privacyShield: document.getElementById("v2-privacy-shield"),
    videoTraceWatermark: document.getElementById("v2-video-trace-watermark"),
    audioTraceWatermark: document.getElementById("v2-audio-trace-watermark"),
    textTraceWatermark: document.getElementById("v2-text-trace-watermark"),
    toolbar: document.getElementById("v2-control-toolbar"),
    btnNext: document.getElementById("v2-btn-next"),
    btnNextLabel: document.getElementById("v2-next-label"),
    chatDrawer: document.getElementById("v2-chat-drawer"),
    chatMessages: document.getElementById("v2-chat-messages") || document.getElementById("chat-messages"),
    chatInput: document.getElementById("chat-input"),
    btnSendChat: document.getElementById("btn-send-chat"),
    popoverMenu: document.getElementById("v2-popover-menu"),
    shareModal: document.getElementById("v2-share-modal"),
    btnFlagReport: document.getElementById("v2-btn-flag-report"),
    toast: document.getElementById("v2-toast"),
    toastText: document.getElementById("v2-toast-text"),

    // Group Chat UI Elements
    groupChatStage: document.getElementById("v2-group-chat-stage"),
    groupRoomBadge: document.getElementById("v2-group-room-badge"),
    groupOnlineCount: document.getElementById("v2-group-online-count"),
    userNicknameDisplay: document.getElementById("v2-user-nickname-display"),
    groupMessagesFeed: document.getElementById("v2-group-messages-feed"),
    groupReplyBar: document.getElementById("v2-group-reply-bar"),
    replyTargetName: document.getElementById("v2-reply-target-name"),
    replyTargetSnippet: document.getElementById("v2-reply-target-snippet"),
    groupInputField: document.getElementById("v2-group-input-field"),
    ageModal: document.getElementById("v2-age-modal"),
    nicknameModal: document.getElementById("v2-nickname-modal"),
    inputNewNick: document.getElementById("v2-input-new-nick")
  };

  if (el.chatInput && !el.chatInput.value) {
    el.chatInput.value = "Hi 👋";
  }
}

let toastTimer = null;
function v2ShowToast(msg) {
  const toast = document.getElementById("v2-toast");
  const toastText = document.getElementById("v2-toast-text");
  if (!toast || !toastText) return;

  toastText.textContent = msg;
  toast.classList.remove("hidden");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 3200);
}
window.v2ShowToast = v2ShowToast;

// Google Analytics 4 (GA4) Event Tracker Helper
function trackV2Event(eventName, params = {}) {
  try {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, Object.assign({ clientVersion: "v2" }, params));
    }
  } catch (err) {
    console.warn("Analytics event tracking error:", err);
  }
}
window.trackV2Event = trackV2Event;

// Initialize Application Engine on Page Load
function initV2App() {
  initDOMElements();
  console.log("🚀 [HashGANG] Application Engine Initializing...");
  registerV2ServiceWorker();
  checkV2UrlInviteParameters();
  initSocketConnection();
  setupEventListeners();
  startBrandTitleAnimation();
  checkAgeConfirmationOnLoad();
  updateUIState("idle");

  recordVisitBackend();
  fetchActiveUsersBackend();
  fetchSelfBrandAdsFromBackend();
  setTimeout(prefetchV2AdsterraAd, 1200);
  setInterval(fetchActiveUsersBackend, 15000);
  setInterval(() => {
    recordSessionTimeBackend(30);
  }, 30000);
}

function registerV2ServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swPath = "./sw.js";
      navigator.serviceWorker
        .register(swPath, { updateViaCache: "none" })
        .then((reg) => {
          console.log("⚡ [PWA v2] ServiceWorker registered with updateViaCache:none", reg.scope);
          // Check for fresh deployment on server
          try { reg.update(); } catch (e) {}

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("⚡ [HashGANG v2] New update deployed! Refreshing app shell...");
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn("⚠️ [PWA v2] ServiceWorker registration notice:", err);
        });

      const hadPreviousController = !!navigator.serviceWorker.controller;
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        // If there was no controller when the page initially loaded, this is the first SW installation.
        // DO NOT reload the page, as it resets user state and wipes query parameters on first visit!
        if (!hadPreviousController) {
          console.log("⚡ [PWA v2] Initial Service Worker activated (skipping reload).");
          return;
        }
        if (!refreshing) {
          refreshing = true;
          console.log("⚡ [HashGANG v2] Active controller changed! Refreshing app shell...");
          window.location.reload();
        }
      });
    });
  }
}

function startBrandTitleAnimation() {
  const titles = ["HashGANG", "#GANG"];
  let index = 0;

  setInterval(() => {
    index = (index + 1) % titles.length;
    const currentName = titles[index];
    const brandEl = document.getElementById("v2-brand-title-text");

    if (brandEl) {
      brandEl.style.transition = "opacity 0.25s ease-in-out, transform 0.25s ease-in-out";
      brandEl.style.opacity = "0";
      brandEl.style.transform = "translateY(-3px)";
      setTimeout(() => {
        brandEl.textContent = currentName;
        brandEl.style.opacity = "1";
        brandEl.style.transform = "translateY(0)";
      }, 250);
    }
  }, 3000);
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initV2App);
} else {
  initV2App();
}

// Top-Level Application Helper Functions
function playAudioChime(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "connect") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "disconnect") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (err) {
    console.warn("Audio chime playback error:", err);
  }
}

function triggerV2AudioMediaUpload() {
  if (!currentMatchTargetId) {
    v2ShowToast("⚠️ Connect to a voice stranger first to share photos/videos!");
    return;
  }
  let audioInput = document.getElementById("v2-audio-file-input");
  if (!audioInput) {
    audioInput = document.createElement("input");
    audioInput.type = "file";
    audioInput.id = "v2-audio-file-input";
    audioInput.accept = "image/*,video/*";
    audioInput.style.cssText = "position:fixed; top:-9999px; left:-9999px; opacity:0;";
    audioInput.onchange = (e) => v2HandleMediaUpload(e);
    document.body.appendChild(audioInput);
  }
  audioInput.click();
}

function dismissV2AudioSharedMedia() {
  const stage = document.getElementById("v2-audio-shared-media-stage");
  const content = document.getElementById("v2-audio-media-content");
  if (stage) stage.classList.add("hidden");
  if (content) content.innerHTML = "";
}

function renderSharedAudioMedia(mediaType, dataUrl) {
  const stage = document.getElementById("v2-audio-shared-media-stage");
  const content = document.getElementById("v2-audio-media-content");
  if (!stage || !content) return;

  content.innerHTML = "";
  if (mediaType === "image") {
    content.innerHTML = `<img src="${dataUrl}" class="v2-audio-media-img" alt="Shared Media" onclick="openV2Lightbox('image', '${dataUrl}')" />`;
  } else {
    content.innerHTML = `<video src="${dataUrl}" class="v2-audio-media-video" controls playsinline preload="metadata"></video>`;
  }

  stage.classList.remove("hidden");
  v2ShowToast("📸 Shared photo/video is live on screen! Discuss together over voice 🎙️");
}

function dismissV2VideoSharedMedia() {
  const stage = document.getElementById("v2-video-shared-media-stage");
  const content = document.getElementById("v2-video-media-content");
  const viewport = document.querySelector(".v2-viewport-area");
  if (viewport) viewport.classList.remove("has-video-media");
  if (stage) stage.classList.add("hidden");
  if (content) content.innerHTML = "";
}

function renderSharedVideoMedia(mediaType, dataUrl) {
  const stage = document.getElementById("v2-video-shared-media-stage");
  const content = document.getElementById("v2-video-media-content");
  const viewport = document.querySelector(".v2-viewport-area");
  if (!stage || !content) return;

  content.innerHTML = "";
  if (mediaType === "image") {
    content.innerHTML = `<img src="${dataUrl}" class="v2-video-media-img" alt="Shared Media" onclick="openV2Lightbox('image', '${dataUrl}')" />`;
  } else {
    content.innerHTML = `<video src="${dataUrl}" class="v2-video-media-video" controls playsinline preload="metadata"></video>`;
  }

  if (viewport) viewport.classList.add("has-video-media");
  stage.classList.remove("hidden");
  v2ShowToast("📸 Shared photo/video is live on top screen!");
}

let isDisconnectedHandled = false;

function setAudioDisconnectedUI(isDisconnected) {
  const circle = document.getElementById("v2-audio-circle");
  const pulse = document.getElementById("v2-pulse-ring");
  const icon = document.getElementById("v2-audio-avatar-icon");
  const eq = document.getElementById("v2-equalizer-bars");
  const label = document.getElementById("v2-audio-label");

  if (isDisconnected) {
    dismissV2AudioSharedMedia();
    if (circle) circle.classList.add("disconnected");
    if (pulse) pulse.classList.add("disconnected");
    if (icon) icon.className = "fa-solid fa-user-slash text-rose-400";
    if (eq) eq.classList.add("stopped");
    if (label) label.innerHTML = `<span class="text-rose-400 font-bold">🔴 Voice Stranger Disconnected</span>`;
  } else {
    dismissV2AudioSharedMedia();
    if (circle) circle.classList.remove("disconnected");
    if (pulse) pulse.classList.remove("disconnected");
    if (icon) icon.className = "fa-solid fa-user-astronaut";
    if (eq) eq.classList.remove("stopped");
    if (label) label.innerHTML = `<span class="text-emerald-400 font-bold">🟢 Voice Stranger Connected</span>`;
  }
}

function setVideoDisconnectedUI(isDisconnected) {
  const discOverlay = document.getElementById("v2-video-disc-overlay");
  if (isDisconnected) {
    if (discOverlay) discOverlay.classList.remove("hidden");
  } else {
    if (discOverlay) discOverlay.classList.add("hidden");
  }
}

function handleStrangerDisconnected(force = false) {
  if (isDisconnectedHandled && !force) return;
  isDisconnectedHandled = true;

  console.log("❌ [v2 Engine] Stranger Disconnected.");
  const leavingPeerId = currentMatchTargetId;
  if (leavingPeerId) {
    skippedPeersCooldownMapV2.delete(leavingPeerId);
  }
  dismissV2AudioSharedMedia();
  dismissV2VideoSharedMedia();
  cleanupPeerConnection(false);
  playAudioChime("disconnect");
  if (navigator.vibrate) {
    try { navigator.vibrate(200); } catch (e) {}
  }
  updateStatus("disconnected", "🔴 Stranger Disconnected");
  if (currentChatMode === "text") {
    appendSystemCard("disconnect", "🔴 Stranger has disconnected.", true);
    const chatInputRow = document.getElementById("v2-chat-input-row");
    const discBar = document.getElementById("v2-chat-disconnected-bar");
    if (chatInputRow) chatInputRow.style.display = "none";
    if (discBar) discBar.classList.remove("hidden");
    const peerDot = document.getElementById("v2-chat-peer-dot");
    const peerStatus = document.getElementById("v2-chat-peer-status-text");
    if (peerDot) peerDot.classList.add("disc");
    if (peerStatus) peerStatus.textContent = "🔴 Disconnected";
  } else if (currentChatMode === "audio") {
    setAudioDisconnectedUI(true);
  } else if (currentChatMode === "video") {
    setVideoDisconnectedUI(true);
  }
  v2ShowToast("🔴 Stranger Disconnected");
  if (el.btnFlagReport) el.btnFlagReport.classList.add("hidden");
  const pwaBtn = document.getElementById("v2-btn-pwa-install");
  if (pwaBtn) pwaBtn.classList.remove("hidden");
  if (el.chatInput) el.chatInput.blur();
}

/**
 * Report & Block Stranger Action
 */
function v2ReportAndBlockStranger() {
  if (!currentMatchTargetId && !inCall) {
    v2ShowToast("⚠️ No active stranger to report.");
    return;
  }
  const targetId = currentMatchTargetId;
  if (targetId) {
    recordSkippedPeerV2(targetId);
  }
  if (socket && socket.connected && targetId) {
    socket.emit("skip_peer", { targetId: targetId, clientVersion: "v2" });
  }
  handleStrangerDisconnected();
  if (el.btnFlagReport) el.btnFlagReport.classList.add("hidden");
  v2ShowToast("🚩 Stranger reported & blocked!");
}
window.v2ReportAndBlockStranger = v2ReportAndBlockStranger;

let isV2VideoSwapped = false;
function toggleV2VideoSwap() {
  const remoteVideo = document.getElementById("v2-remote-video");
  const localVideo = document.getElementById("v2-local-video");
  if (!remoteVideo || !localVideo) return;

  isV2VideoSwapped = !isV2VideoSwapped;
  const tempStream = remoteVideo.srcObject;
  remoteVideo.srcObject = localVideo.srcObject;
  localVideo.srcObject = tempStream;
  v2ShowToast(isV2VideoSwapped ? "🔄 Video Swapped: Showing local video full size" : "🔄 Video Swapped: Showing stranger video full size");
}

let deferredPwaPromptV2 = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPwaPromptV2 = e;
  const pwaBtn = document.getElementById("v2-btn-pwa-install");
  const pwaMenu = document.getElementById("v2-menu-pwa-install");
  if (pwaBtn && !currentMatchTargetId) pwaBtn.classList.remove("hidden");
  if (pwaMenu) pwaMenu.classList.remove("hidden");
});

function handlePwaInstallPrompt(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (deferredPwaPromptV2) {
    deferredPwaPromptV2.prompt();
    deferredPwaPromptV2.userChoice.then((choiceResult) => {
      if (choiceResult && choiceResult.outcome === "accepted") {
        v2ShowToast("🎉 Thank you for installing #GANG!");
      }
      deferredPwaPromptV2 = null;
    });
  } else {
    v2ShowToast("📲 Tap browser menu (⋮ / Share) -> 'Add to Home Screen' to install!");
  }
}

function switchCamera() {
  if (!localStream) {
    v2ShowToast("⚠️ Camera not active!");
    return;
  }
  v2ShowToast("🔄 Switching camera...");
}



async function v2RetryMediaPermission() {
  v2ShowToast("🎙️ Retrying microphone & camera access...");
  const granted = await initLocalMedia(currentChatMode);
  if (granted) {
    if (el.permGuideBox) el.permGuideBox.classList.add("hidden");
    v2ShowToast("✅ Permission granted! Starting chat...");
    v2HandleStartOrNext();
  } else {
    v2ShowToast("⚠️ Permission denied. Please allow mic/camera in browser settings!");
  }
}

function getBackendOrigin() {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1" && !window.location.hostname.startsWith("192.168.")) {
    return "https://api.hashgang.com";
  }
  if (typeof BACKEND_API_BASE !== "undefined" && BACKEND_API_BASE) {
    try {
      return new URL(BACKEND_API_BASE).origin;
    } catch (e) {
      console.warn("⚠️ [v2] Failed to parse BACKEND_API_BASE from ads.js:", e);
    }
  }
  return "http://localhost:5000";
}

/**
 * Socket.io Connection to Signaling Server
 */
function initSocketConnection() {
  const hostOrigin = getBackendOrigin();
  const socketHost = window.SIGNALING_SERVER_URL || (hostOrigin + "/omegle");
  console.log("⚡ [v2 Socket Matchmaker] Connecting to signaling server:", socketHost);

  try {
    if (typeof io === "undefined") {
      console.warn("⚠️ Socket.io client not loaded yet, retrying in 500ms...");
      setTimeout(initSocketConnection, 500);
      return;
    }

    socket = io(socketHost, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10
    });
    window.socket = socket;

    socket.on("connect", () => {
      console.log("🌐 [Socket.io v2] Connected to Signaling Server:", socket.id);
      if (is18Confirmed) {
        let codeToJoin = window.pendingV2InviteCode;
        if (!codeToJoin) {
          try {
            const stored = sessionStorage.getItem("hg_pending_invite");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed && parsed.code && (Date.now() - parsed.ts < 15 * 60 * 1000)) {
                codeToJoin = parsed.code;
                if (parsed.mode) currentChatMode = parsed.mode;
              }
            }
          } catch (e) {}
        }
        if (codeToJoin || window.isJoiningPrivateInvite) {
          if (codeToJoin) {
            console.log(`🤝 [v2 Personal Invite] Auto-joining private invite room on connect: ${codeToJoin}`);
            window.pendingV2InviteCode = null;
            window.isJoiningPrivateInvite = true;
            v2ShowToast(`🤝 Connecting to private ${currentChatMode.toUpperCase()} chat...`);
            socket.emit("join_invite_room", { inviteCode: codeToJoin, mode: currentChatMode, clientVersion: "v2", nickname: currentNickname });
            return;
          }
        }
        updateStatus("idle", "In Group Chat");
        joinGroupChatOnConnect();
      }
    });

    socket.on("banned", (data) => {
      const reasonMsg = (data && data.reason) ? data.reason : "Access suspended due to multiple user reports.";
      console.warn("⛔ [Socket.io Ban Notice]", data);
      alert(`🔴 Account Suspended\n\n${reasonMsg}`);
      v2ShowToast(`🔴 ${reasonMsg}`);
      updateStatus("idle", "Access Suspended");
      v2StopCall();
    });

    socket.on("report_acknowledged", (data) => {
      console.log("🚩 [Omegle Report] Server report result:", data);
    });

    socket.on("online_count", (data) => {
      if (data && data.count) {
        updateOnlineUsersDisplay(data.count);
      }
    });

    socket.on("matched", async (data) => {
      console.log("⚡ [Socket.io v2] Match Found with Stranger:", data);

      const targetId = data.peerId || data.targetSocketId;
      const now = Date.now();
      const cooldownUntil = skippedPeersCooldownMapV2.get(targetId);

      const isDirectOrGroupInvite = !!(
        data.isGroupInvite ||
        data.isInviteMatch ||
        data.isInvite ||
        data.inviteCode ||
        window.pendingV2InviteCode
      );

      // Direct & Group Invites: Bypass cooldown completely & delete any lingering cooldown entry
      if (isDirectOrGroupInvite) {
        skippedPeersCooldownMapV2.delete(targetId);
        isCurrentAdsterraImpressionV2 = false;
        console.log("🤝 [v2 Direct/Group Call] Consensual invite match confirmed: Bypassing cooldown and ad dwell lock for instant connection.");
      } else if (cooldownUntil && now < cooldownUntil) {
        // Client-Side Cooling Period Guard: ONLY for random strangers in queue within 60s
        console.warn("⏳ [v2 Cooling Period] Recently skipped stranger matched (" + targetId + "). Auto-requesting next stranger...");
        if (socket && socket.connected) {
          socket.emit("skip_peer", { targetId });
          socket.emit("join_queue", { mode: currentChatMode });
        }
        return;
      }

      clearSearchTimeout();

      const executeMatchTransition = async () => {
        isDisconnectedHandled = false;
        closeV2ShareModal();
        closeV2CallDrawer();
        window.pendingV2InviteCode = null;
        window.isJoiningPrivateInvite = false;
        try { sessionStorage.removeItem("hg_pending_invite"); } catch (e) {}
        dismissV2AudioSharedMedia();
        dismissV2VideoSharedMedia();
        v2HideEngagedOverlay();
        currentMatchTargetId = targetId;
        window.currentMatchTargetId = currentMatchTargetId;
        inCall = true;
        window.inCall = inCall;
        window.socket = socket;
        updateStatus("connected", "🟢 Live Chat");
        trackV2Event("v2_matched", { mode: currentChatMode, targetId: targetId });
        if (el.searchStage) el.searchStage.classList.add("hidden");
        const groupStage = document.getElementById("v2-group-chat-stage");
        if (groupStage) groupStage.classList.add("hidden");
        if (data.mode) {
          currentChatMode = data.mode;
        }
        window.currentChatMode = currentChatMode;
        if (currentChatMode !== "text" && !localStream) {
          const hasPerm = await initLocalMedia(currentChatMode);
          if (!hasPerm) {
            v2ShowToast(`⚠️ ${currentChatMode === "video" ? "Camera & Microphone" : "Microphone"} access denied. Please allow in browser settings.`);
          }
        }
        if (el.btnFlagReport) el.btnFlagReport.classList.remove("hidden");
        const pwaBtn = document.getElementById("v2-btn-pwa-install");
        if (pwaBtn) pwaBtn.classList.add("hidden");

        const peerDot = document.getElementById("v2-chat-peer-dot");
        const peerStatus = document.getElementById("v2-chat-peer-status-text");
        if (peerDot) peerDot.classList.remove("disc");
        if (peerStatus) peerStatus.textContent = "Private Chat";

        const chatInputRow = document.getElementById("v2-chat-input-row");
        const discBar = document.getElementById("v2-chat-disconnected-bar");
        if (chatInputRow) chatInputRow.style.display = "";
        if (discBar) discBar.classList.add("hidden");

        // Clear previous stranger messages & display connection system badge
        clearChatHistory();
        const isFromGroup = !!(data && (data.isGroupInvite || data.isInviteMatch || data.inviteCode || window.pendingV2InviteCode));
        const partnerName = (data && data.partnerName) ? data.partnerName : (isFromGroup ? "Group Member" : "Stranger");

        appendSystemCard("connect", isFromGroup 
          ? `🟢 Connected in Private ${currentChatMode.toUpperCase()} with ${escapeHtml(partnerName)}! Say Hi 👋`
          : "🟢 Connected with stranger! Say Hi 👋"
        );
        updateToolbarForMode("active");
        playAudioChime("connect");
        if (navigator.vibrate) {
          try { navigator.vibrate([100, 50, 100]); } catch (e) {}
        }

        // Generate Session Trace Watermark Code (Server Authoritative)
        const sessionTraceCode = (data && data.traceCode) ? data.traceCode : ((targetId || "HG" + Math.random().toString(36).substring(2, 8)).slice(-8).toUpperCase());
        window.currentSessionTraceCode = sessionTraceCode;
        if (el.videoTraceWatermark) {
          el.videoTraceWatermark.textContent = sessionTraceCode;
          el.videoTraceWatermark.classList.remove("hidden");
        }
        if (el.audioTraceWatermark) {
          el.audioTraceWatermark.textContent = sessionTraceCode;
          el.audioTraceWatermark.classList.remove("hidden");
        }
        if (el.textTraceWatermark) {
          el.textTraceWatermark.textContent = sessionTraceCode;
        }

        if (currentChatMode === "text") {
          if (el.chatDrawer) el.chatDrawer.classList.remove("closed");
          if (el.chatInput) {
            if (!el.chatInput.value) el.chatInput.value = "Hi 👋";
            setTimeout(() => {
              if (typeof autoGrowChatInput === "function") autoGrowChatInput();
            }, 60);
          }
        } else if (currentChatMode === "audio") {
          if (el.audioVisualizer) el.audioVisualizer.classList.remove("hidden");
          setAudioDisconnectedUI(false);
          v2ShowToast(isFromGroup ? `🎙️ Connected to Private Voice Call with ${partnerName}!` : "🎙️ Connected to Voice Stranger!");
        } else if (currentChatMode === "video") {
          if (el.localPip) el.localPip.classList.remove("hidden");
          setVideoDisconnectedUI(false);
          v2ShowToast(isFromGroup ? `🎥 Connected to Private Video Call with ${partnerName}!` : "🎥 Connected to Video Stranger!");
        }

        if (data.initiator && currentChatMode !== "text") {
          await createWebRTCPeerConnection(currentMatchTargetId, true);
        }

        // Pre-fetch next Adsterra ad in background during conversation for instant display on next skip
        setTimeout(prefetchV2AdsterraAd, 2000);
      };

      // Adsterra 4.2s Guaranteed Impression Safety Gate
      if (isCurrentAdsterraImpressionV2) {
        const elapsed = Date.now() - searchingStartTimeV2;
        const remaining = MIN_SEARCHING_DWELL_MS_V2 - elapsed;
        if (remaining > 0) {
          setTimeout(executeMatchTransition, remaining);
        } else {
          executeMatchTransition();
        }
      } else {
        // Internal self-brand ad: instant (0ms) transition!
        executeMatchTransition();
      }
    });

    socket.on("invite_fallback", (data) => {
      const msg = (data && data.message) ? data.message : "🤝 Inviter unavailable.";
      console.log(`🔄 [v2 Invite Fallback] ${msg}`);
      v2ShowToast(`ℹ️ ${msg}`, 4500);

      window.pendingV2InviteCode = null;
      window.isJoiningPrivateInvite = false;
      try { sessionStorage.removeItem("hg_pending_invite"); } catch (e) {}
      joinGroupChatOnConnect();
    });

    socket.on("signal", async (data) => {
      if (!data || !data.signal) return;

      // Handle Instant Peer Left / Disconnect Signal
      if (data.signal.type === "peer_left") {
        console.log("❌ [Socket.io v2] Received peer_left signal from stranger.");
        handleStrangerDisconnected();
        return;
      }

      // Handle Text Chat Signals
      if (data.signal.type === "chat") {
        appendChatMessage("Stranger", data.signal.text, "stranger", data.signal.replyTo, data.signal.msgId);
        if (el.chatDrawer) el.chatDrawer.classList.remove("closed");
        return;
      }

      // Handle Chat Emoji Reaction Signal
      if (data.signal.type === "chat_reaction") {
        applyV2MessageReaction(data.signal.msgId, data.signal.emoji, "stranger");
        return;
      }

      // Handle Media Transfer Start Progress Alert
      if (data.signal.type === "media_transfer_start") {
        if (currentChatMode === "text") {
          const transferCardId = "media-progress-loader";
          removeElementById(transferCardId);

          const msgDiv = document.createElement("div");
          msgDiv.id = transferCardId;
          msgDiv.className = "v2-chat-msg stranger media-loader";
          msgDiv.style.cssText = "background: rgba(6,182,212,0.18); border: 1px solid rgba(6,182,212,0.4); padding: 10px 14px; border-radius: 12px; font-size: 0.85rem; margin-bottom: 6px; color: #67e8f9;";
          msgDiv.innerHTML = `⏳ Sending ${data.signal.mediaType || "attachment"}... Please wait!`;
          el.chatMessages.appendChild(msgDiv);
          el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
          if (el.chatDrawer) el.chatDrawer.classList.remove("closed");
        }
        return;
      }

      // Handle Image/Video Media Signals
      if (data.signal.type === "media") {
        removeElementById("media-progress-loader");
        if (currentChatMode === "audio") {
          renderSharedAudioMedia(data.signal.mediaType, data.signal.dataUrl);
        } else if (currentChatMode === "video") {
          renderSharedVideoMedia(data.signal.mediaType, data.signal.dataUrl);
        } else {
          appendMediaMessage("Stranger", data.signal.mediaType, data.signal.dataUrl, "stranger", data.signal.replyTo, data.signal.msgId);
          if (el.chatDrawer) el.chatDrawer.classList.remove("closed");
        }
        return;
      }

      // Handle In-Call Mode Upgrade Invite (Text -> Audio / Video)
      if (data.signal.type === "in_call_upgrade_invite") {
        const upgradeMode = data.signal.mode || "video";
        const inviterName = data.signal.senderName ? escapeHtml(data.signal.senderName) : "Stranger";
        const promptDiv = document.createElement("div");
        promptDiv.className = "v2-chat-upgrade-prompt";
        promptDiv.innerHTML = `
          <div class="v2-upgrade-prompt-icon"><i class="fa-solid fa-${upgradeMode === 'video' ? 'video' : 'microphone'}"></i></div>
          <div class="v2-upgrade-prompt-text">
            <strong>${inviterName}</strong> invited you to switch to a <strong>${upgradeMode.toUpperCase()} Call</strong>!
          </div>
          <div class="v2-upgrade-prompt-btns">
            <button class="v2-btn-accept-upgrade" onclick="respondInCallModeUpgrade('${upgradeMode}', true, this)">Accept ${upgradeMode === 'video' ? 'Video' : 'Voice'}</button>
            <button class="v2-btn-decline-upgrade" onclick="respondInCallModeUpgrade('${upgradeMode}', false, this)">Decline</button>
          </div>
        `;
        if (el.chatMessages) {
          el.chatMessages.appendChild(promptDiv);
          el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
        }
        if (el.chatDrawer) el.chatDrawer.classList.remove("closed");
        playAudioChime("connect");
        return;
      }

      // Handle In-Call Mode Upgrade Response
      if (data.signal.type === "in_call_upgrade_response") {
        const upgradeMode = data.signal.mode || "video";
        if (data.signal.accepted) {
          v2ShowToast(`🎉 Stranger accepted! Switching to ${upgradeMode.toUpperCase()} Call...`);
          executeInCallModeUpgrade(upgradeMode, true);
        } else {
          v2ShowToast("Stranger preferred to continue in Text Chat.");
          appendSystemCard("connect", "Stranger preferred to continue in Text Chat.");
        }
        return;
      }


      // Handle WebRTC Peer Connection Signals (Audio / Video Modes)
      if (!currentPeerConnection && currentChatMode !== "text") {
        await createWebRTCPeerConnection(data.senderId || currentMatchTargetId, false);
      }

      if (currentPeerConnection) {
        if (data.signal.sdp) {
          await currentPeerConnection.setRemoteDescription(new RTCSessionDescription(data.signal.sdp));
          if (data.signal.sdp.type === "offer") {
            const answer = await currentPeerConnection.createAnswer();
            await currentPeerConnection.setLocalDescription(answer);
            socket.emit("signal", { targetId: data.senderId, signal: { sdp: answer }, clientVersion: "v2" });
          }
        } else if (data.signal.candidate) {
          await currentPeerConnection.addIceCandidate(new RTCIceCandidate(data.signal.candidate));
        }
      }
    });

    socket.on("peer_left", () => {
      console.log("❌ [Socket.io v2] Stranger left the call.");
      handleStrangerDisconnected();
    });

    socket.on("peer_disconnected", () => {
      console.log("❌ [Socket.io v2] Stranger disconnected.");
      handleStrangerDisconnected();
    });

    // ==========================================
    // GROUP CHAT & DUAL-TRACK 1v1 CALL HANDLERS
    // ==========================================

    socket.on("group_joined", (data) => {
      console.log("💬 [Group Chat] Successfully joined group room:", data.roomId);
      activeGroupRoomId = data.roomId;
      activeGroupRoomNumber = data.roomNumber || 1;
      window.activeGroupRoomId = activeGroupRoomId;
      window.activeGroupRoomNumber = activeGroupRoomNumber;
      liveGroupMsgCounter = 0;

      if (data.requestedRoomFull) {
        v2ShowToast(`ℹ️ Group #${window.pendingV2RequestedRoom || 1} is at full capacity (25/25). Joined Group #${activeGroupRoomNumber}!`, 4500);
      }
      window.pendingV2RequestedRoom = null;

      const badge = document.getElementById("v2-group-room-badge");
      if (badge) badge.innerHTML = `<i class="fa-solid fa-comments"></i> Group #${data.roomNumber || 1}`;

      const counter = document.getElementById("v2-group-online-count");
      if (counter) counter.textContent = data.memberCount || 1;

      if (data.nickname) {
        currentNickname = data.nickname;
        localStorage.setItem("hg_user_nickname", currentNickname);
        updateNicknameDisplay(currentNickname);
      }

      // Render initial messages feed
      const feed = document.getElementById("v2-group-messages-feed");
      if (feed) {
        feed.innerHTML = "";

        const welcomeSlot = document.getElementById("v2-group-welcome-slot");
        if (welcomeSlot) {
          welcomeSlot.innerHTML = "";
        }

        const messages = Array.isArray(data.messages) ? data.messages : [];
        const isStandalone = (typeof window !== "undefined" && ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone)));

        // 1. PWA App Card before the first message (at top of chat history)
        if (!isStandalone) {
          feed.appendChild(renderPWAInstallFeedCard("App"));
        }

        let adInjected = false;
        let viralInjected = false;
        const totalMsgs = messages.length;

        messages.forEach((msg, idx) => {
          feed.appendChild(renderGroupMessageRow(msg));

          // In-feed card injection in middle of history: Show internal house promo without consuming live Adsterra quota
          if (idx === Math.floor(totalMsgs * 0.35) && !adInjected && totalMsgs >= 6) {
            feed.appendChild(renderMyLeaderPromoFeedCard());
            adInjected = true;
          } else if (idx === Math.floor(totalMsgs * 0.7) && !viralInjected && totalMsgs >= 12) {
            feed.appendChild(renderViralCommunityCard());
            viralInjected = true;
          }
        });

        // 2. Inline Welcome Card placed directly AFTER the last backlog message!
        feed.appendChild(renderWelcomeKnowledgeCard(activeGroupRoomNumber));

        // 3. Render active call invites if any
        if (Array.isArray(data.activeInvites)) {
          data.activeInvites.forEach((inv) => {
            feed.appendChild(renderCallInviteCard(inv));
          });
        }

        // Auto-post invite if user requested upon return, now that room is 100% active
        if (window.pendingAutoInviteMode) {
          const modeToInvite = window.pendingAutoInviteMode;
          window.pendingAutoInviteMode = null;
          socket.emit("post_call_invite", { mode: modeToInvite, nickname: currentNickname });
          v2ShowToast(`💬 You're back in Group! Your ${modeToInvite.toUpperCase()} invite is live.`);
        }

        setTimeout(() => { feed.scrollTop = feed.scrollHeight; }, 100);
      }
    });

    socket.on("group_member_count", (data) => {
      const counter = document.getElementById("v2-group-online-count");
      if (counter && data && data.memberCount) {
        counter.textContent = data.memberCount;
      }
    });

    socket.on("nickname_updated", (data) => {
      if (data && data.nickname) {
        currentNickname = data.nickname;
        localStorage.setItem("hg_user_nickname", currentNickname);
        updateNicknameDisplay(currentNickname);
      }
    });

    socket.on("new_group_msg", (msg) => {
      const feed = document.getElementById("v2-group-messages-feed");
      if (feed) {
        feed.appendChild(renderGroupMessageRow(msg));
        liveGroupMsgCounter++;
        console.log(`💬 [In-Feed Pacing] Message count: ${liveGroupMsgCounter}`);
        if (liveGroupMsgCounter % 12 === 0) {
          handleInFeedPacingInjection(feed, liveGroupMsgCounter);
        }
        feed.scrollTop = feed.scrollHeight;
      }
    });

    socket.on("new_group_reaction", (data) => {
      const msgRow = document.getElementById(`msg-${data.messageId}`);
      if (msgRow) {
        let reactionsRow = msgRow.querySelector(".v2-msg-reactions-row");
        if (!reactionsRow) {
          reactionsRow = document.createElement("div");
          reactionsRow.className = "v2-msg-reactions-row";
          msgRow.appendChild(reactionsRow);
        }
        let found = false;
        reactionsRow.querySelectorAll(".v2-reaction-chip").forEach((chip) => {
          if (chip.textContent.includes(data.emoji)) {
            const count = parseInt(chip.textContent.replace(data.emoji, "").trim()) || 0;
            chip.textContent = `${data.emoji} ${count + 1}`;
            chip.style.transform = "scale(1.25)";
            setTimeout(() => { chip.style.transform = "scale(1)"; }, 200);
            found = true;
          }
        });
        if (!found) {
          const newChip = document.createElement("span");
          newChip.className = "v2-reaction-chip";
          newChip.textContent = `${data.emoji} 1`;
          newChip.onclick = () => quickSendReaction(data.messageId, data.emoji);
          reactionsRow.appendChild(newChip);
        }
      }
    });

    socket.on("new_call_invite", (invite) => {
      const feed = document.getElementById("v2-group-messages-feed");
      if (feed) {
        feed.appendChild(renderCallInviteCard(invite));
        feed.scrollTop = feed.scrollHeight;
      }
    });

    socket.on("call_invite_taken", (data) => {
      const card = document.getElementById(`card-${data.inviteId}`);
      if (card) {
        card.className = "v2-feed-call-card taken";
        const statusEl = document.getElementById(`status-${data.inviteId}`);
        const taker = data.takerName ? escapeHtml(data.takerName) : "Group Member";
        if (statusEl) statusEl.textContent = `🔒 Joined by ${taker}`;
        const btn = card.querySelector(".v2-btn-join-call-action");
        if (btn) {
          btn.outerHTML = `<div class="v2-btn-join-call-action" style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); cursor: default;"><i class="fa-solid fa-check"></i> Connected in Private Call</div>`;
        }
      }
    });

    socket.on("call_invite_cancelled", (data) => {
      const card = document.getElementById(`card-${data.inviteId}`);
      if (card) {
        card.className = "v2-feed-call-card expired";
        const statusEl = document.getElementById(`status-${data.inviteId}`);
        if (statusEl) statusEl.textContent = "⚪ Expired";
        const btn = card.querySelector(".v2-btn-join-call-action");
        if (btn) {
          btn.outerHTML = `<div class="v2-btn-join-call-action" style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); cursor: default;"><i class="fa-solid fa-clock-rotate-left"></i> Invite Expired</div>`;
        }
      }
    });

    socket.on("call_invite_error", (data) => {
      v2ShowToast(`⚠️ ${data.message || "Invite error"}`);
    });

    socket.on("group_message_error", (data) => {
      v2ShowToast(data?.message || "⚠️ Message error");
    });

    socket.on("group_rate_limited", (data) => {
      v2ShowToast(`⏳ ${data.message || "Slow down!"}`);
    });
  } catch (err) {
    console.error("Socket.io initialization error:", err);
    if (typeof window.logAppError === "function") {
      window.logAppError(err.message || String(err), "socket_init_error", 0);
    }
  }
}

function removeElementById(id) {
  const elem = document.getElementById(id);
  if (elem) elem.remove();
}

/**
 * Clear Chat History for New Stranger Match
 */
function clearChatHistory() {
  if (el.chatMessages) {
    el.chatMessages.innerHTML = '<div class="v2-chat-spacer"></div>';
  }
  if (typeof cancelV2ChatReply === "function") cancelV2ChatReply();
  if (el.chatInput) {
    el.chatInput.value = "Hi 👋";
    if (typeof autoGrowChatInput === "function") autoGrowChatInput();
  }
}

/**
 * Contextual Mode-Specific Footer Toolbar Controller
 */
function updateToolbarForMode(stageState) {
  if (!el.toolbar) initDOMElements();
  if (!el.toolbar) return;

  const btnMute = document.getElementById("v2-btn-mute");
  const btnCam = document.getElementById("v2-btn-cam");
  const btnSettings = document.getElementById("v2-btn-settings");
  const btnEnd = document.getElementById("v2-btn-end");
  const btnChatNext = document.getElementById("v2-btn-chat-next");

  if (stageState === "idle" || stageState === "searching" || currentChatMode === "text") {
    // In Text Mode, idle, or searching stages, hide the floating bottom toolbar completely!
    // Text Mode uses integrated inline action buttons inside the chat input bar.
    el.toolbar.classList.add("hidden");

    if (currentChatMode === "text" && (stageState === "active" || stageState === "connected")) {
      if (btnChatNext) btnChatNext.classList.remove("hidden");
    } else {
      if (btnChatNext) btnChatNext.classList.add("hidden");
    }
    return;
  }

  // Audio / Video Modes: Show floating toolbar with Mic/Cam controls
  el.toolbar.classList.remove("hidden");
  if (btnChatNext) btnChatNext.classList.add("hidden");

  if (currentChatMode === "audio") {
    // Audio Mode: Show Mic, hide Cam & End!
    if (btnMute) btnMute.classList.remove("hidden");
    if (btnCam) btnCam.classList.add("hidden");
    if (btnEnd) btnEnd.classList.add("hidden");
  } else {
    // Video Mode: Show Mic & Cam controls, hide End!
    if (btnMute) btnMute.classList.remove("hidden");
    if (btnCam) btnCam.classList.remove("hidden");
    if (btnEnd) btnEnd.classList.add("hidden");
  }
}

/**
 * Stage 1: Mode Selection & 1-Click Launch
 */
function v2SelectModeAndStart(mode) {
  currentChatMode = mode;
  console.log(`🌐 [v2 Mode Selected]: ${mode}`);
  trackV2Event("v2_mode_selected", { mode: mode });
  

  v2HandleStartOrNext();
}

/**
 * System Chat Stream Connection & Disconnection Card Renderer
 */
function appendSystemCard(type, text) {
  if (!el.chatMessages) initDOMElements();
  if (!el.chatMessages) return;

  const wrapper = document.createElement("div");
  wrapper.className = "v2-sys-msg-wrapper";

  const card = document.createElement("div");
  card.className = `v2-sys-card ${type}`;
  card.innerHTML = `<span>${text}</span>`;

  wrapper.appendChild(card);
  el.chatMessages.appendChild(wrapper);
  setTimeout(() => {
    if (el.chatMessages) el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
  }, 30);
}

let matchCount = 0;
const ADSTERRA_TIMESTAMPS_KEY_V2 = "v2_adsterra_impression_timestamps";

function recordV2AdsterraImpression() {
  try {
    const raw = localStorage.getItem(ADSTERRA_TIMESTAMPS_KEY_V2);
    const arr = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const valid = Array.isArray(arr) ? arr.filter((ts) => now - ts < 3600000) : [];
    valid.push(now);
    localStorage.setItem(ADSTERRA_TIMESTAMPS_KEY_V2, JSON.stringify(valid));
  } catch (e) {}
}

const MIN_SEARCHING_DWELL_MS_V2 = 5000; // 5.0s Minimum Display Lock for Adsterra eCPM viewability
const MAX_ADSTERRA_PER_HOUR_V2 = 4; // Maximum 4 Adsterra impressions per 1-hour window per user
const ADSTERRA_HOURLY_TRACKER_KEY_V2 = "v2_adsterra_hourly_tracker";
const ADSTERRA_MAX_DISPLAY_TIME_MS_V2 = 8000; // 8.0s Maximum Adsterra display time before auto-swapping to MyLeader promo

let searchingStartTimeV2 = 0;
let isCurrentAdsterraImpressionV2 = false;
let adsterraAutoSwapTimerV2 = null;
let sessionSearchCountV2 = 0; // Session search counter for 1st search 0-delay rule

function getV2HourlyAdsterraStatus() {
  try {
    const raw = localStorage.getItem(ADSTERRA_HOURLY_TRACKER_KEY_V2);
    const now = Date.now();
    if (!raw) return { canShow: true, count: 0 };
    const data = JSON.parse(raw);
    if (!data || typeof data.count !== "number" || typeof data.windowStart !== "number") {
      return { canShow: true, count: 0 };
    }
    if (now - data.windowStart > 3600000) {
      localStorage.removeItem(ADSTERRA_HOURLY_TRACKER_KEY_V2);
      return { canShow: true, count: 0 };
    }
    return { canShow: data.count < MAX_ADSTERRA_PER_HOUR_V2, count: data.count };
  } catch (e) {
    return { canShow: true, count: 0 };
  }
}

function incrementV2HourlyAdsterraCount() {
  try {
    const now = Date.now();
    const status = getV2HourlyAdsterraStatus();
    const raw = localStorage.getItem(ADSTERRA_HOURLY_TRACKER_KEY_V2);
    let windowStart = now;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.windowStart && (now - parsed.windowStart <= 3600000)) {
          windowStart = parsed.windowStart;
        }
      } catch (e) {}
    }
    const newCount = status.count + 1;
    localStorage.setItem(ADSTERRA_HOURLY_TRACKER_KEY_V2, JSON.stringify({ count: newCount, windowStart }));
  } catch (e) {}
}

function clearV2AdsterraAutoSwapTimer() {
  if (adsterraAutoSwapTimerV2) {
    clearTimeout(adsterraAutoSwapTimerV2);
    adsterraAutoSwapTimerV2 = null;
  }
}

// Skipped Peers Cooling Period Management (60 Seconds Cooldown)
const SKIPPED_PEERS_COOLDOWN_MS_V2 = 60000; // 60s Cooling Period per skipped stranger
const skippedPeersCooldownMapV2 = new Map();

function recordSkippedPeerV2(peerId) {
  if (!peerId) return;
  const now = Date.now();
  skippedPeersCooldownMapV2.set(peerId, now + SKIPPED_PEERS_COOLDOWN_MS_V2);
  for (const [id, expireTime] of skippedPeersCooldownMapV2.entries()) {
    if (now >= expireTime) {
      skippedPeersCooldownMapV2.delete(id);
    }
  }
}

function getActiveSkippedPeersV2() {
  const now = Date.now();
  const activeSkipped = [];
  for (const [peerId, expireTime] of skippedPeersCooldownMapV2.entries()) {
    if (now < expireTime) {
      activeSkipped.push(peerId);
    } else {
      skippedPeersCooldownMapV2.delete(peerId);
    }
  }
  return activeSkipped;
}

const MIN_AD_INTERVAL_MS_V2 = 40000; // 40 seconds minimum deduplication & rapid-skip protection interval
const PREFETCH_STALE_EXPIRATION_MS_V2 = 60000; // 60 seconds stale prefetch buffer expiration

function getLastV2AdsterraStart() {
  try {
    const raw = localStorage.getItem(ADSTERRA_TIMESTAMPS_KEY_V2);
    if (!raw) return 0;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    return arr[arr.length - 1];
  } catch (e) {
    return 0;
  }
}

let prefetchedAdElementV2 = null;
let prefetchedAdTimestampV2 = 0;

function prefetchV2AdsterraAd() {
  const buffer = document.getElementById("v2-ad-prefetch-buffer");
  if (!buffer) return;

  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const mediationConfig = window.AD_MEDIATION_CONFIG || {};
  const skipLocal = mediationConfig.settings && mediationConfig.settings.skipOnLocalhost;

  if (isLocalhost && skipLocal) return;

  const now = Date.now();
  // Discard stale pre-fetched iframe if older than 60 seconds
  if (prefetchedAdElementV2 && prefetchedAdTimestampV2 > 0 && (now - prefetchedAdTimestampV2 > PREFETCH_STALE_EXPIRATION_MS_V2)) {
    try { buffer.innerHTML = ""; } catch (e) {}
    prefetchedAdElementV2 = null;
    prefetchedAdTimestampV2 = 0;
  }

  // Don't overwrite if buffer already has a fresh pre-fetched ad ready
  if (prefetchedAdElementV2 && buffer.contains(prefetchedAdElementV2)) return;

  try {
    buffer.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.style.width = "300px";
    iframe.style.height = "250px";
    iframe.style.border = "none";
    iframe.style.borderRadius = "12px";
    iframe.style.overflow = "hidden";
    iframe.style.background = "transparent";
    iframe.scrolling = "no";
    iframe.title = "Sponsored Ad";

    buffer.appendChild(iframe);

    const htmlString = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            html, body, iframe, div {
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              background: transparent !important;
              background-color: transparent !important;
              color-scheme: dark !important;
              overflow: hidden;
              height: 100vh;
            }
          </style>
        </head>
        <body>
          <script type="text/javascript">
            atOptions = {
              'key' : 'ede40fc4ab13bf9c6140311ae9860f4f',
              'format' : 'iframe',
              'height' : 250,
              'width' : 300,
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://www.highperformanceformat.com/ede40fc4ab13bf9c6140311ae9860f4f/invoke.js"></script>
        </body>
      </html>
    `;

    if ("srcdoc" in iframe) {
      iframe.srcdoc = htmlString;
    }
    if (iframe.contentWindow) {
      try {
        const doc = iframe.contentWindow.document;
        doc.open();
        doc.write(htmlString);
        doc.close();
      } catch (e) {}
    }

    prefetchedAdElementV2 = iframe;
    prefetchedAdTimestampV2 = Date.now();
    console.log("⚡ [v2 Ad Engine] Pre-fetched Adsterra banner ad in background buffer.");
  } catch (e) {
    console.warn("⚠️ [v2 Ad Engine] Pre-fetch notice:", e);
  }
}

function renderSearchingAd() {
  const adBox = document.getElementById("v2-searching-ad-container");
  if (!adBox) return;

  clearV2AdsterraAutoSwapTimer();
  matchCount++;
  sessionSearchCountV2++;

  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  const mediationConfig = window.AD_MEDIATION_CONFIG || {};
  const skipLocal = mediationConfig.settings && mediationConfig.settings.skipOnLocalhost;

  // Step 1: ALWAYS render MyLeader AI Platform Internal Promotion Card immediately at 0ms (NO white box space!)
  adBox.innerHTML = `
    <div class="v2-self-brand-card" id="v2-internal-promo-card">
      <span class="v2-self-brand-badge">FEATURED PROMOTION</span>
      <h4 class="v2-self-brand-title">MyLeader AI Platform</h4>
      <p class="v2-self-brand-desc">Streamline leadership workflows & team collaboration with AI.</p>
      <a href="https://hashgang.com" target="_blank" rel="noopener noreferrer" class="v2-self-brand-cta">
        <span>Explore MyLeader 🚀</span>
        <i class="fa-solid fa-arrow-up-right-from-square"></i>
      </a>
    </div>
  `;

  // Rule: 1st connection of session ALWAYS shows MyLeader internal ad (0-delay instant connect!)
  if (sessionSearchCountV2 === 1) {
    isCurrentAdsterraImpressionV2 = false;
    console.log("⚡ [v2 Ad Engine] 1st Search of session: Serving MyLeader Internal Ad with 0-delay instant connect.");
    return;
  }

  // Step 2: Check 1-Hour Cap (Max 4 Adsterra ads/hr) & Rapid-Skip deduplication (40s min interval)
  const now = Date.now();
  const lastAdTime = getLastV2AdsterraStart();
  const elapsedSinceLastAd = now - lastAdTime;
  const isRapidSkip = lastAdTime > 0 && elapsedSinceLastAd < MIN_AD_INTERVAL_MS_V2;

  const hourlyStatus = getV2HourlyAdsterraStatus();
  const isHourlyQuotaAvailable = hourlyStatus.canShow;

  const shouldShowAdsterra = (!isLocalhost || !skipLocal) && !isRapidSkip && isHourlyQuotaAvailable;
  const buffer = document.getElementById("v2-ad-prefetch-buffer");

  // Step 3: If pre-fetched fresh iframe exists and rapid skip guard is clear, attach it over internal promo smoothly
  if (shouldShowAdsterra && prefetchedAdElementV2 && buffer && buffer.contains(prefetchedAdElementV2)) {
    isCurrentAdsterraImpressionV2 = true;
    recordV2AdsterraImpression();
    incrementV2HourlyAdsterraCount();

    const adWrap = document.createElement("div");
    adWrap.id = "v2-adsterra-active-wrap";
    adWrap.style.position = "absolute";
    adWrap.style.top = "0";
    adWrap.style.left = "0";
    adWrap.style.transform = "none";
    adWrap.style.width = "300px";
    adWrap.style.height = "250px";
    adWrap.style.borderRadius = "12px";
    adWrap.style.overflow = "hidden";
    adWrap.style.opacity = "0";
    adWrap.style.transition = "opacity 0.4s ease";
    adWrap.style.background = "transparent";
    adWrap.style.zIndex = "30";

    adWrap.appendChild(prefetchedAdElementV2);
    adBox.appendChild(adWrap);

    prefetchedAdElementV2 = null;
    prefetchedAdTimestampV2 = 0;

    // Smoothly reveal Adsterra banner after network render window (no white flash!)
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (adWrap) adWrap.style.opacity = "1";
      }, 1200);
    });

    // AdBlocker / Load Failure Fallback Guard: Remove adWrap if AdBlocker blocks iframe
    setTimeout(() => {
      try {
        if (!adWrap || !adWrap.parentNode) return;
        const iframeEl = adWrap.querySelector("iframe");
        if (!iframeEl || iframeEl.offsetHeight === 0 || iframeEl.offsetWidth === 0) {
          console.warn("🛡️ [v2 Ad Engine] AdBlocker or load failure detected. Falling back to MyLeader Internal Promo.");
          try { adWrap.remove(); } catch (e) {}
        }
      } catch (e) {}
    }, 1500);

    // 8-Second Maximum Display Auto-Swap Rule: Swap back to MyLeader AI Platform at 8s if search is still ongoing
    adsterraAutoSwapTimerV2 = setTimeout(() => {
      if (adWrap && adWrap.parentNode) {
        console.log("⏱️ [v2 Ad Engine] 8s Adsterra Max Display Limit reached. Auto-swapping to MyLeader Internal Promo.");
        adWrap.style.opacity = "0";
        setTimeout(() => {
          try { adWrap.remove(); } catch (e) {}
        }, 400);
      }
    }, ADSTERRA_MAX_DISPLAY_TIME_MS_V2);

    // Queue pre-fetch for subsequent search in background
    setTimeout(prefetchV2AdsterraAd, 1500);
  } else if (shouldShowAdsterra) {
    isCurrentAdsterraImpressionV2 = true;
    recordV2AdsterraImpression();
    incrementV2HourlyAdsterraCount();

    // Trigger immediate pre-fetch so it is ready during search
    prefetchV2AdsterraAd();
  } else {
    isCurrentAdsterraImpressionV2 = false;
    if (!isHourlyQuotaAvailable) {
      console.log(`🛡️ [v2 Ad Engine] Adsterra 1-hour quota reached (${hourlyStatus.count}/${MAX_ADSTERRA_PER_HOUR_V2}). Serving MyLeader Internal Promotion.`);
    } else if (isRapidSkip) {
      console.log(`🛡️ [v2 Ad Engine] Rapid skip detected (${Math.round(elapsedSinceLastAd / 1000)}s since last ad). Serving MyLeader Internal Promotion.`);
    }
  }
}

let searchTimeoutTimer = null;
let searchingSecondsInterval = null;
let searchingElapsedSeconds = 0;
let v2TimeoutInviteUrl = "";

function clearSearchTimeout() {
  if (searchTimeoutTimer) {
    clearTimeout(searchTimeoutTimer);
    searchTimeoutTimer = null;
  }
  clearV2AdsterraAutoSwapTimer();
  stopSearchingTicker();
}

function startSearchingTicker() {
  stopSearchingTicker();
  searchingElapsedSeconds = 0;
  updateSearchingTimerDisplay();
  
  searchingSecondsInterval = setInterval(() => {
    searchingElapsedSeconds++;
    updateSearchingTimerDisplay();
  }, 1000);
}

function stopSearchingTicker() {
  if (searchingSecondsInterval) {
    clearInterval(searchingSecondsInterval);
    searchingSecondsInterval = null;
  }
}

function updateSearchingTimerDisplay() {
  const searchSub = document.getElementById("v2-search-sub");
  if (!searchSub) return;

  const isEngaged = searchingElapsedSeconds >= 12;
  const timeBadge = `<span class="v2-search-timer-pill"><i class="fa-solid fa-clock"></i> ${searchingElapsedSeconds}s</span>`;

  if (!isEngaged) {
    searchSub.innerHTML = `Matching you with random online users worldwide ${timeBadge}`;
  } else {
    searchSub.innerHTML = `Everyone is busy chatting. Searching for a real stranger... Please wait or invite friends! ${timeBadge}`;
  }
}

function v2ShowEngagedOverlay() {
  const box = document.getElementById("v2-engaged-box");
  const switchBtn = document.getElementById("v2-btn-engaged-switch");
  const radarSpinner = document.getElementById("v2-radar-spinner");
  const searchTitle = document.getElementById("v2-search-title");

  if (radarSpinner) {
    radarSpinner.classList.remove("hidden");
    radarSpinner.classList.add("engaged");
  }

  if (searchTitle) {
    searchTitle.innerHTML = '⚡ 100% Humans • Zero AI Bots';
    searchTitle.classList.remove("hidden");
  }

  updateSearchingTimerDisplay();

  if (box) {
    if (switchBtn) {
      if (currentChatMode === "text" || currentChatMode === "audio") {
        switchBtn.innerHTML = '<i class="fa-solid fa-video"></i> Switch to Video Mode 📹';
      } else {
        switchBtn.innerHTML = '<i class="fa-solid fa-comments"></i> Switch to Text Mode 💬';
      }
    }
    box.classList.remove("hidden");
  }
}

function v2HideEngagedOverlay() {
  const box = document.getElementById("v2-engaged-box");
  const switchBtn = document.getElementById("v2-btn-engaged-switch");
  const radarSpinner = document.getElementById("v2-radar-spinner");
  const searchTitle = document.getElementById("v2-search-title");

  if (box) {
    if (switchBtn) {
      if (currentChatMode === "text" || currentChatMode === "audio") {
        switchBtn.innerHTML = '<i class="fa-solid fa-video"></i> Switch to Video Mode 📹';
      } else {
        switchBtn.innerHTML = '<i class="fa-solid fa-comments"></i> Switch to Text Mode 💬';
      }
    }
    box.classList.remove("hidden");
  }

  if (radarSpinner) {
    radarSpinner.classList.remove("hidden");
    radarSpinner.classList.remove("engaged");
  }

  if (searchTitle) {
    searchTitle.innerHTML = '✨ Finding a Stranger...';
    searchTitle.classList.remove("hidden");
  }

  updateSearchingTimerDisplay();
}

function v2SwitchModeAndSearch() {
  v2HideEngagedOverlay();
  const nextMode = (currentChatMode === "text" || currentChatMode === "audio") ? "video" : "text";
  v2SelectModeAndStart(nextMode);
}

/**
 * Handle Start / Next Stranger Chat
 */
async function v2HandleStartOrNext() {
  if (!el.searchStage) initDOMElements();
  isStoppedByUser = false;
  cleanupPeerConnection(true);
  clearChatHistory();
  clearSearchTimeout();
  v2HideEngagedOverlay();
  startSearchingTicker();
  
  // Record searching start timestamp for 4.2s Adsterra impression gate
  searchingStartTimeV2 = Date.now();
  
  // Release or request media tracks based on mode
  if (currentChatMode !== "text") {
    const hasPerm = await initLocalMedia(currentChatMode);
    if (!hasPerm) {
      if (el.searchStage) el.searchStage.classList.remove("hidden");
      if (el.permGuideBox) el.permGuideBox.classList.remove("hidden");

      const searchTitle = document.getElementById("v2-search-title");
      const searchSub = document.getElementById("v2-search-sub");
      const radarSpinner = document.getElementById("v2-radar-spinner");
      const searchAdContainer = document.getElementById("v2-searching-ad-container");
      const btnStopSearchLabel = document.getElementById("v2-btn-stop-search-label");
      const btnStopSearchIcon = document.getElementById("v2-btn-stop-search-icon");
      const btnEngagedSwitch = document.getElementById("v2-btn-engaged-switch");
      const engagedBox = document.getElementById("v2-engaged-box");

      if (searchTitle) searchTitle.classList.add("hidden");
      if (searchSub) searchSub.classList.add("hidden");
      if (radarSpinner) radarSpinner.classList.add("hidden");
      if (searchAdContainer) searchAdContainer.classList.add("hidden");

      // Change bottom action button from "Stop Searching" to "Select Mode"
      if (btnStopSearchLabel) btnStopSearchLabel.textContent = "Select Mode";
      if (btnStopSearchIcon) btnStopSearchIcon.className = "fa-solid fa-arrow-left text-purple-400";

      // Show "Switch to Text Mode" button (Text mode requires no permissions)
      if (engagedBox) engagedBox.classList.remove("hidden");
      if (btnEngagedSwitch) {
        btnEngagedSwitch.innerHTML = `<i class="fa-solid fa-comments text-cyan-400"></i> Switch to Text Mode 💬`;
        btnEngagedSwitch.onclick = () => v2SelectModeAndStart("text");
      }

      stopSearchingTicker();
      return;
    }
  } else {
    // If text mode, ensure drawer is open and input focused
    if (el.chatDrawer) el.chatDrawer.classList.remove("closed");
  }

  const searchTitle = document.getElementById("v2-search-title");
  const searchSub = document.getElementById("v2-search-sub");
  const radarSpinner = document.getElementById("v2-radar-spinner");
  const searchAdContainer = document.getElementById("v2-searching-ad-container");
  const btnStopSearchLabel = document.getElementById("v2-btn-stop-search-label");
  const btnStopSearchIcon = document.getElementById("v2-btn-stop-search-icon");
  const btnEngagedSwitch = document.getElementById("v2-btn-engaged-switch");

  if (searchTitle) searchTitle.classList.remove("hidden");
  if (searchSub) searchSub.classList.remove("hidden");
  if (radarSpinner) radarSpinner.classList.remove("hidden");
  if (searchAdContainer) searchAdContainer.classList.remove("hidden");

  if (btnStopSearchLabel) btnStopSearchLabel.textContent = "Stop Searching";
  if (btnStopSearchIcon) btnStopSearchIcon.className = "fa-solid fa-stop text-rose-400";

  if (btnEngagedSwitch) {
    const nextMode = (currentChatMode === "text" || currentChatMode === "audio") ? "video" : "text";
    const modeIcon = nextMode === "video" ? '<i class="fa-solid fa-video"></i>' : '<i class="fa-solid fa-comments"></i>';
    btnEngagedSwitch.innerHTML = `${modeIcon} Switch to ${nextMode.toUpperCase()} Mode`;
    btnEngagedSwitch.onclick = v2SwitchModeAndSearch;
  }

  if (el.permGuideBox) el.permGuideBox.classList.add("hidden");
  const groupStage = document.getElementById("v2-group-chat-stage");
  if (groupStage) groupStage.classList.add("hidden");
  if (el.searchStage) el.searchStage.classList.remove("hidden");
  
  // Render Searching Ad (Adsterra 3s Countdown or Fast Internal Ad)
  renderSearchingAd();

  updateStatus("searching", `Searching for ${currentChatMode.toUpperCase()} Stranger...`);
  updateToolbarForMode("searching");

  if (el.btnNextLabel) el.btnNextLabel.textContent = "Next Stranger";

  // Set 12s timeout to display No Strangers Engaged Card if queue is quiet
  searchTimeoutTimer = setTimeout(() => {
    if (!isStoppedByUser && el.searchStage && !el.searchStage.classList.contains("hidden")) {
      v2ShowEngagedOverlay();
    }
  }, 12000);

  const queuePayload = {
    mode: currentChatMode
  };

  const emitJoinQueueWhenReady = (attemptsLeft = 30) => {
    if (socket && socket.connected) {
      if (window.pendingV2InviteCode) {
        console.log(`🤝 [v2 Personal Invite] Joining private invite room: ${window.pendingV2InviteCode}`);
        socket.emit("join_invite_room", { inviteCode: window.pendingV2InviteCode, mode: currentChatMode, clientVersion: "v2" });
        window.pendingV2InviteCode = null;
      } else {
        socket.emit("join_queue", queuePayload);
      }
    } else if (attemptsLeft > 0) {
      setTimeout(() => emitJoinQueueWhenReady(attemptsLeft - 1), 300);
    }
  };

  emitJoinQueueWhenReady();
}

/**
 * Stop Call & Reset to Group Chat
 */
function v2StopCall() {
  isStoppedByUser = true;
  clearSearchTimeout();
  v2HideEngagedOverlay();
  cleanupPeerConnection();
  clearChatHistory();
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
  if (el.searchStage) el.searchStage.classList.add("hidden");
  const groupStage = document.getElementById("v2-group-chat-stage");
  if (groupStage) groupStage.classList.remove("hidden");
  if (el.chatDrawer) el.chatDrawer.classList.add("closed");
  if (el.btnFlagReport) el.btnFlagReport.classList.add("hidden");
  const pwaBtn = document.getElementById("v2-btn-pwa-install");
  if (pwaBtn) pwaBtn.classList.remove("hidden");
  if (el.localPip) el.localPip.classList.add("hidden");
  if (el.audioVisualizer) el.audioVisualizer.classList.add("hidden");
  if (el.videoTraceWatermark) el.videoTraceWatermark.classList.add("hidden");
  if (el.audioTraceWatermark) el.audioTraceWatermark.classList.add("hidden");
  if (el.btnNextLabel) el.btnNextLabel.textContent = "Start Chat";
  updateStatus("idle", "In Group Chat");
  updateToolbarForMode("idle");
  if (socket && socket.connected) {
    socket.emit("leave_queue", { clientVersion: "v2" });
    socket.emit("join_group_chat", { nickname: currentNickname });
  }
}

/**
 * WebRTC PeerConnection Setup
 */
async function createWebRTCPeerConnection(targetId, isInitiator) {
  const iceServers = {
    iceServers: [
      { urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
        "stun:stun3.l.google.com:19302",
        "stun:stun4.l.google.com:19302",
        "stun:stun.services.mozilla.com:3478",
        "stun:stun.global.stun.twilio.com:3478"
      ]}
    ],
    iceCandidatePoolSize: 10
  };

  currentPeerConnection = new RTCPeerConnection(iceServers);

  if (localStream) {
    localStream.getTracks().forEach(track => currentPeerConnection.addTrack(track, localStream));
  }

  currentPeerConnection.ontrack = (event) => {
    if (el.remoteVideo && event.streams[0]) {
      el.remoteVideo.srcObject = event.streams[0];
    }
  };

  let iceReconnectTimeoutV2 = null;
  currentPeerConnection.oniceconnectionstatechange = () => {
    const state = currentPeerConnection ? currentPeerConnection.iceConnectionState : "";
    console.log(`🧊 [WebRTC ICE State v2]: ${state}`);
    if (state === "disconnected") {
      v2ShowToast("⚠️ Signal flicker... Reconnecting call 🔄");
      clearTimeout(iceReconnectTimeoutV2);
      iceReconnectTimeoutV2 = setTimeout(() => {
        if (currentPeerConnection && (currentPeerConnection.iceConnectionState === "disconnected" || currentPeerConnection.iceConnectionState === "failed")) {
          setAudioDisconnectedUI(true);
          playAudioChime("disconnect");
          updateStatus("disconnected", "🔴 Stranger Disconnected");
          v2ShowToast("🔴 Stranger Disconnected");
        }
      }, 3500);
    } else if (state === "connected" || state === "completed") {
      clearTimeout(iceReconnectTimeoutV2);
    } else if (state === "failed" || state === "closed") {
      clearTimeout(iceReconnectTimeoutV2);
      setAudioDisconnectedUI(true);
      playAudioChime("disconnect");
      updateStatus("disconnected", "🔴 Stranger Disconnected");
    }
  };

  currentPeerConnection.onicecandidate = (event) => {
    if (event.candidate && socket) {
      socket.emit("signal", { targetId: targetId, signal: { candidate: event.candidate }, clientVersion: "v2" });
    }
  };

  if (isInitiator) {
    const offer = await currentPeerConnection.createOffer();
    await currentPeerConnection.setLocalDescription(offer);
    socket.emit("signal", { targetId: targetId, signal: { sdp: offer }, clientVersion: "v2" });
  }
}

function cleanupPeerConnection(isStrangerSkip = false) {
  dismissV2AudioSharedMedia();
  dismissV2VideoSharedMedia();
  if (currentMatchTargetId && isStrangerSkip) {
    recordSkippedPeerV2(currentMatchTargetId);
  }
  if (currentPeerConnection) {
    try {
      currentPeerConnection.close();
    } catch (e) {}
    currentPeerConnection = null;
  }
  currentMatchTargetId = null;
  window.currentMatchTargetId = null;
  if (el.remoteVideo) el.remoteVideo.srcObject = null;
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }
}

/**
 * Hardware Camera & Microphone Media Permission Handler
 */
async function initLocalMedia(mode) {
  try {
    const mediaConstraintsHierarchy = mode === "audio"
      ? [
          { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false },
          { audio: true, video: false }
        ]
      : [
          {
            video: { width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 }, facingMode: "user" },
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          },
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
      }
    }

    if (!acquiredStream) {
      if (lastMediaError) throw lastMediaError;
      return false;
    }

    if (localStream) {
      try { localStream.getTracks().forEach(track => track.stop()); } catch (e) {}
    }
    localStream = acquiredStream;
    if (el.localVideo && mode === "video") {
      el.localVideo.muted = true;
      el.localVideo.srcObject = localStream;
      el.localVideo.play().catch(e => console.warn("Local video play notice:", e));
    }
    return true;
  } catch (err) {
    console.warn("Media permissions denied or unavailable:", err);
    return false;
  }
}

let currentV2ReplyTarget = null;

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function autoGrowChatInput() {
  if (!el.chatInput) return;
  el.chatInput.style.height = "auto";
  const newHeight = Math.max(Math.min(el.chatInput.scrollHeight, 140), 36);
  el.chatInput.style.height = newHeight + "px";
  if (el.chatInput.scrollHeight > 140) {
    el.chatInput.style.overflowY = "auto";
  } else {
    el.chatInput.style.overflowY = "hidden";
  }
}

function initiateV2ChatReply(msgId, sender) {
  const msgElem = document.getElementById(msgId);
  if (!msgElem) return;

  let snippet = "";
  const textContent = msgElem.querySelector(".v2-msg-text-content");
  if (textContent) {
    snippet = textContent.dataset.fullText || textContent.innerText;
  } else if (msgElem.querySelector(".v2-chat-media-img")) {
    snippet = "📷 Photo";
  } else if (msgElem.querySelector(".v2-chat-media-video")) {
    snippet = "🎥 Video";
  } else {
    snippet = msgElem.innerText.replace("😊", "").replace("↩️", "").trim();
  }

  if (snippet.length > 60) snippet = snippet.substring(0, 60) + "...";

  currentV2ReplyTarget = { msgId, sender, snippet };

  const previewBox = document.getElementById("v2-chat-reply-preview");
  const previewLabel = document.getElementById("v2-reply-preview-label");
  const previewText = document.getElementById("v2-reply-preview-text");

  if (previewLabel) previewLabel.textContent = `Replying to ${sender}`;
  if (previewText) previewText.textContent = `"${snippet}"`;
  if (previewBox) previewBox.classList.remove("hidden");

  if (el.chatInput) el.chatInput.focus();
}

function cancelV2ChatReply() {
  currentV2ReplyTarget = null;
  const previewBox = document.getElementById("v2-chat-reply-preview");
  if (previewBox) previewBox.classList.add("hidden");
}

function toggleV2ReadMore(btn) {
  const container = btn.closest(".v2-msg-text-content");
  if (!container) return;
  const isExpanded = container.dataset.expanded === "true";
  const fullText = container.dataset.fullText;
  const truncText = container.dataset.truncText;

  if (isExpanded) {
    container.dataset.expanded = "false";
    container.innerHTML = `${escapeHtml(truncText)}... <span class="v2-read-more-btn" onclick="toggleV2ReadMore(this)">Read More</span>`;
  } else {
    container.dataset.expanded = "true";
    container.innerHTML = `${escapeHtml(fullText)} <span class="v2-read-more-btn" onclick="toggleV2ReadMore(this)">Read Less</span>`;
  }
}

function toggleV2ReactionPicker(msgId, event) {
  if (event) event.stopPropagation();

  const msgElem = document.getElementById(msgId);
  // User messages are read-only for reactions (user cannot click/change reactions on their own message)
  if (msgElem && msgElem.classList.contains("user")) {
    return;
  }

  const oldPicker = document.querySelector(".v2-reaction-picker");
  if (oldPicker) {
    const parentMsgId = oldPicker.dataset.forMsgId;
    oldPicker.remove();
    if (parentMsgId === msgId) return;
  }

  const btn = document.getElementById(`react-btn-${msgId}`);
  if (!btn) return;

  const rect = btn.getBoundingClientRect();

  const picker = document.createElement("div");
  picker.className = "v2-reaction-picker";
  picker.dataset.forMsgId = msgId;

  // Calculate position in viewport to prevent any overflow/clipping
  const pickerWidth = 210;
  let leftPos = rect.left - 40;
  if (leftPos < 12) leftPos = 12;
  if (leftPos + pickerWidth > window.innerWidth - 12) {
    leftPos = window.innerWidth - pickerWidth - 12;
  }
  let topPos = rect.top - 46;
  if (topPos < 10) topPos = rect.bottom + 8;

  picker.style.cssText = `position: fixed !important; top: ${topPos}px !important; left: ${leftPos}px !important; z-index: 9999 !important;`;

  const emojis = ["❤️", "👍", "😂", "🔥", "😮", "😢"];
  emojis.forEach(emoji => {
    const item = document.createElement("span");
    item.className = "v2-reaction-emoji-item";
    item.textContent = emoji;
    item.onclick = (e) => {
      e.stopPropagation();
      sendV2Reaction(msgId, emoji);
      picker.remove();
    };
    picker.appendChild(item);
  });

  document.body.appendChild(picker);

  const closeHandler = (e) => {
    if (!picker.contains(e.target)) {
      picker.remove();
      document.removeEventListener("click", closeHandler);
    }
  };
  setTimeout(() => document.addEventListener("click", closeHandler), 50);
}

function sendV2Reaction(msgId, emoji) {
  applyV2MessageReaction(msgId, emoji, "user");
  if (socket && currentMatchTargetId) {
    socket.emit("signal", {
      targetId: currentMatchTargetId,
      signal: { type: "chat_reaction", msgId: msgId, emoji: emoji },
      clientVersion: "v2"
    });
  }
}

function applyV2MessageReaction(msgId, emoji, senderType) {
  const btn = document.getElementById(`react-btn-${msgId}`);
  if (!btn) return;
  btn.textContent = emoji;
  btn.classList.remove("hidden");
  btn.classList.add("active-reaction");

  const msgElem = document.getElementById(msgId);
  if (msgElem && msgElem.classList.contains("user")) {
    btn.style.pointerEvents = "none";
    btn.style.cursor = "default";
    btn.title = `Stranger reacted ${emoji}`;
  }
}

function openV2Lightbox(mediaType, dataUrl) {
  const modal = document.getElementById("v2-lightbox-modal");
  const container = document.getElementById("v2-lightbox-content");
  if (!modal || !container) return;

  if (mediaType === "image") {
    container.innerHTML = `<img src="${dataUrl}" class="v2-lightbox-media-img" alt="Enlarged Photo" />`;
  } else {
    container.innerHTML = `<video src="${dataUrl}" class="v2-lightbox-media-video" controls autoplay playsinline></video>`;
  }
  modal.classList.remove("hidden");
}

function closeV2Lightbox() {
  const modal = document.getElementById("v2-lightbox-modal");
  const container = document.getElementById("v2-lightbox-content");
  if (modal) modal.classList.add("hidden");
  if (container) container.innerHTML = "";
}

window.initiateV2ChatReply = initiateV2ChatReply;
window.cancelV2ChatReply = cancelV2ChatReply;
window.toggleV2ReadMore = toggleV2ReadMore;
window.toggleV2ReactionPicker = toggleV2ReactionPicker;
window.sendV2Reaction = sendV2Reaction;
window.applyV2MessageReaction = applyV2MessageReaction;
window.openV2Lightbox = openV2Lightbox;
window.closeV2Lightbox = closeV2Lightbox;
window.sendChatMessage = sendChatMessage;

/**
 * Event Listeners & UI Helpers
 */
function setupEventListeners() {
  if (el.btnSendChat) {
    el.btnSendChat.addEventListener("click", sendChatMessage);
  }
  if (el.chatInput) {
    el.chatInput.addEventListener("input", autoGrowChatInput);
    el.chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
      }
    });
  }

  const groupInput = document.getElementById("v2-group-input-field");
  if (groupInput) {
    groupInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendGroupMessage();
      }
    });
    groupInput.addEventListener("input", () => {
      groupInput.style.height = "auto";
      const newHeight = Math.min(groupInput.scrollHeight, 110);
      groupInput.style.height = (newHeight > 36 ? newHeight : 36) + "px";
    });
  }

  const inputNewNick = document.getElementById("v2-input-new-nick");
  if (inputNewNick) {
    inputNewNick.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveNewNickname();
      }
    });
  }

  // Close Top Dropdown Popover Menu when clicking outside
  document.addEventListener("click", (e) => {
    const menuBtn = document.getElementById("v2-btn-menu-toggle");
    if (el.popoverMenu && !el.popoverMenu.classList.contains("hidden")) {
      if (!el.popoverMenu.contains(e.target) && (!menuBtn || !menuBtn.contains(e.target))) {
        el.popoverMenu.classList.add("hidden");
      }
    }
  });

  // Window Focus Blur Privacy Shield (Active ONLY during live Video Call Mode)
  window.addEventListener("blur", () => {
    if (currentChatMode === "video" && !isStoppedByUser && currentMatchTargetId && el.privacyShield) {
      el.privacyShield.classList.remove("hidden");
    }
  });
  window.addEventListener("focus", () => {
    if (el.privacyShield) el.privacyShield.classList.add("hidden");
  });

  // Screen-Wide Mouse Wheel Scrolling for Chat Messages Feed
  window.addEventListener("wheel", (e) => {
    if (currentChatMode === "text" && el.chatDrawer && !el.chatDrawer.classList.contains("closed") && el.chatMessages) {
      el.chatMessages.scrollTop += e.deltaY;
    }
  }, { passive: true });

  // Screen-Wide Touch Drag Scrolling for Mobile Devices
  let touchStartY = 0;
  window.addEventListener("touchstart", (e) => {
    if (e.touches && e.touches[0]) {
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (currentChatMode === "text" && el.chatDrawer && !el.chatDrawer.classList.contains("closed") && el.chatMessages) {
      if (e.touches && e.touches[0]) {
        const currentY = e.touches[0].clientY;
        const deltaY = touchStartY - currentY;
        touchStartY = currentY;
        el.chatMessages.scrollTop += deltaY;
      }
    }
  }, { passive: true });

  // Pagehide & Beforeunload Media Cleanup to prevent camera/mic leaks on tab close / minimize
  const cleanupMediaOnUnload = () => {
    try {
      cleanupPeerConnection();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
      }
      if (socket && socket.connected) {
        socket.emit("leave_queue", { clientVersion: "v2" });
        if (currentMatchTargetId) {
          socket.emit("disconnect_peer", { targetId: currentMatchTargetId });
        }
      }
    } catch (e) {}
  };

  window.addEventListener("pagehide", cleanupMediaOnUnload);
  window.addEventListener("beforeunload", cleanupMediaOnUnload);

  // Mobile Virtual Keyboard Viewport Height Adjustment for Chat Drawer
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", () => {
      if (currentChatMode === "text" && el.chatDrawer && !el.chatDrawer.classList.contains("closed")) {
        const keyboardHeight = window.innerHeight - window.visualViewport.height;
        if (keyboardHeight > 100) {
          el.chatDrawer.style.paddingBottom = `${keyboardHeight}px`;
          if (el.chatMessages) el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
        } else {
          el.chatDrawer.style.paddingBottom = "0px";
        }
      }
    });
  }
}

function sendChatMessage() {
  if (!el.chatInput) return;
  const text = el.chatInput.value.trim();
  if (!text || !socket || !currentMatchTargetId) return;
  
  const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const replyData = currentV2ReplyTarget ? { ...currentV2ReplyTarget } : null;

  appendChatMessage("You", text, "user", replyData, msgId);
  
  socket.emit("signal", {
    targetId: currentMatchTargetId,
    signal: { type: "chat", text: text, msgId: msgId, replyTo: replyData },
    clientVersion: "v2"
  });

  el.chatInput.value = "";
  autoGrowChatInput();
  cancelV2ChatReply();
}

/**
 * Client-Side Auto Compression for High-Res Camera Images
 */
function compressImageBeforeSend(file, maxDim = 1200, quality = 0.75) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Safe Compressed Media Upload & Progress Notification
 */
async function v2HandleMediaUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file || !socket || !currentMatchTargetId) {
    if (!currentMatchTargetId) v2ShowToast("⚠️ Connect to a stranger first!");
    return;
  }

  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    v2ShowToast("⚠️ Please select an Image or Video file.");
    return;
  }

  // Safety Limit: 800KB for video base64 payload to prevent Socket.io 1MB maxHttpBufferSize disconnects
  if (isVideo && file.size > 800 * 1024) {
    v2ShowToast("⚠️ Video file is too large (Max 800KB). Please pick a smaller clip!");
    return;
  }
  if (isImage && file.size > 10 * 1024 * 1024) {
    v2ShowToast("⚠️ Image size exceeds 10MB limit.");
    return;
  }

  const mediaType = isImage ? "image" : "video";

  // Notify partner that file transfer has started
  socket.emit("signal", {
    targetId: currentMatchTargetId,
    signal: { type: "media_transfer_start", mediaType: mediaType },
    clientVersion: "v2"
  });

  v2ShowToast("⏳ Optimizing & sending attachment...");

  try {
    let dataUrl = "";
    if (isImage) {
      // Auto compress phone camera photos (e.g. 6MB -> 150KB) to prevent socket frame overflow!
      dataUrl = await compressImageBeforeSend(file);
    } else {
      dataUrl = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
    }

    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const replyData = currentV2ReplyTarget ? { ...currentV2ReplyTarget } : null;

    if (currentChatMode === "audio") {
      renderSharedAudioMedia(mediaType, dataUrl);
    } else if (currentChatMode === "video") {
      renderSharedVideoMedia(mediaType, dataUrl);
    } else {
      appendMediaMessage("You", mediaType, dataUrl, "user", replyData, msgId);
    }

    socket.emit("signal", {
      targetId: currentMatchTargetId,
      signal: { type: "media", mediaType: mediaType, dataUrl: dataUrl, msgId: msgId, replyTo: replyData },
      clientVersion: "v2"
    });
    cancelV2ChatReply();
  } catch (err) {
    console.error("Media compression/upload error:", err);
    v2ShowToast("⚠️ Failed to process file attachment.");
  }

  event.target.value = "";
}

function appendChatMessage(sender, text, type, replyTo = null, msgId = null) {
  if (!el.chatMessages) initDOMElements();
  if (!el.chatMessages) el.chatMessages = document.getElementById("v2-chat-messages") || document.getElementById("chat-messages");
  if (!el.chatMessages) return;

  if (!msgId) msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const msgDiv = document.createElement("div");
  msgDiv.id = msgId;
  msgDiv.className = `v2-chat-msg ${type}`;

  let replyHtml = "";
  if (replyTo) {
    replyHtml = `<div class="v2-quoted-bubble"><span class="v2-quoted-author">${escapeHtml(replyTo.sender)}</span><span class="v2-quoted-text">${escapeHtml(replyTo.snippet)}</span></div>`;
  }

  let textHtml = "";
  const lines = text.split("\n");
  if (text.length > 320 || lines.length > 6) {
    let truncatedText = text;
    if (lines.length > 6) {
      truncatedText = lines.slice(0, 5).join("\n");
    }
    if (truncatedText.length > 320) {
      truncatedText = truncatedText.substring(0, 320);
    }
    textHtml = `<span class="v2-msg-text-content" data-expanded="false" data-full-text="${escapeHtml(text)}" data-trunc-text="${escapeHtml(truncatedText)}">${escapeHtml(truncatedText)}... <span class="v2-read-more-btn" onclick="toggleV2ReadMore(this)">Read More</span></span>`;
  } else {
    textHtml = `<span class="v2-msg-text-content">${escapeHtml(text)}</span>`;
  }

  let actionsHtml = "";
  if (type === "user") {
    actionsHtml = `<div class="v2-msg-external-actions"><button class="v2-ext-act-btn hidden" id="react-btn-${msgId}" title="Reaction" style="pointer-events: none; cursor: default;">😊</button><button class="v2-ext-act-btn" title="Reply" onclick="initiateV2ChatReply('${msgId}', 'You')">↩️</button></div>`;
  } else {
    actionsHtml = `<div class="v2-msg-external-actions"><button class="v2-ext-act-btn" title="Reply" onclick="initiateV2ChatReply('${msgId}', 'Stranger')">↩️</button><button class="v2-ext-act-btn" id="react-btn-${msgId}" title="React" onclick="toggleV2ReactionPicker('${msgId}', event)">😊</button></div>`;
  }

  msgDiv.innerHTML = `${replyHtml}${textHtml}${actionsHtml}`;
  el.chatMessages.appendChild(msgDiv);

  setTimeout(() => {
    if (el.chatMessages) el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
  }, 30);
}

function appendMediaMessage(sender, mediaType, dataUrl, type, replyTo = null, msgId = null) {
  if (!el.chatMessages) initDOMElements();
  if (!el.chatMessages) el.chatMessages = document.getElementById("v2-chat-messages") || document.getElementById("chat-messages");
  if (!el.chatMessages) return;

  if (!msgId) msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  const msgDiv = document.createElement("div");
  msgDiv.id = msgId;
  msgDiv.className = `v2-chat-msg ${type}`;

  let replyHtml = "";
  if (replyTo) {
    replyHtml = `<div class="v2-quoted-bubble"><span class="v2-quoted-author">${escapeHtml(replyTo.sender)}</span><span class="v2-quoted-text">${escapeHtml(replyTo.snippet)}</span></div>`;
  }

  let mediaHtml = "";
  if (mediaType === "image") {
    mediaHtml = `<img src="${dataUrl}" class="v2-chat-media-img" alt="Shared Photo" onclick="openV2Lightbox('image', '${dataUrl}')" />`;
  } else {
    mediaHtml = `<video src="${dataUrl}" class="v2-chat-media-video" controls playsinline onclick="openV2Lightbox('video', '${dataUrl}')"></video>`;
  }

  let actionsHtml = "";
  if (type === "user") {
    actionsHtml = `<div class="v2-msg-external-actions"><button class="v2-ext-act-btn hidden" id="react-btn-${msgId}" title="Reaction" style="pointer-events: none; cursor: default;">😊</button><button class="v2-ext-act-btn" title="Reply" onclick="initiateV2ChatReply('${msgId}', 'You')">↩️</button></div>`;
  } else {
    actionsHtml = `<div class="v2-msg-external-actions"><button class="v2-ext-act-btn" title="Reply" onclick="initiateV2ChatReply('${msgId}', 'Stranger')">↩️</button><button class="v2-ext-act-btn" id="react-btn-${msgId}" title="React" onclick="toggleV2ReactionPicker('${msgId}', event)">😊</button></div>`;
  }

  msgDiv.innerHTML = `${replyHtml}${mediaHtml}${actionsHtml}`;
  el.chatMessages.appendChild(msgDiv);

  setTimeout(() => {
    if (el.chatMessages) el.chatMessages.scrollTop = el.chatMessages.scrollHeight;
  }, 30);
}

function updateStatus(state, text) {
  if (el.statusDot) el.statusDot.className = `v2-status-dot ${state}`;
  if (el.statusText) el.statusText.textContent = text;
}

function updateUIState(state) {
  if (state === "idle") {
    if (el.groupChatStage) el.groupChatStage.classList.remove("hidden");
    if (el.searchStage) el.searchStage.classList.add("hidden");
    updateToolbarForMode("idle");
  }
}

/* UI Popover Toggles & Global Window Bindings */
function toggleV2Menu(e) {
  if (e) e.stopPropagation();
  if (el.popoverMenu) el.popoverMenu.classList.toggle("hidden");
}

let currentV2InviteCode = null;
let currentV2InviteUrl = null;

function generateV2InviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

let activeModalOrigin = "hero";
let currentShare1v1Mode = "video";

function openV2ShareModal(context = "invite", selectedMode = null) {
  const mode = selectedMode || (context === "direct_1v1" ? "video" : currentChatMode || "text");
  currentShare1v1Mode = mode;
  currentV2InviteCode = generateV2InviteCode();
  const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
  const timestamp = Date.now();
  currentV2InviteUrl = `${baseUrl}?invite=${currentV2InviteCode}&mode=${mode}&t=${timestamp}`;
  v2TimeoutInviteUrl = currentV2InviteUrl;
  window.v2TimeoutInviteUrl = v2TimeoutInviteUrl;
  window.currentV2InviteCode = currentV2InviteCode;
  window.currentV2InviteUrl = currentV2InviteUrl;

  if (socket && socket.connected) {
    socket.emit("create_invite_room", { inviteCode: currentV2InviteCode, mode: mode, clientVersion: "v2" });
  }

  if (context === "viral_card") {
    activeModalOrigin = "viral_card";
  } else if (context === "direct_1v1") {
    activeModalOrigin = "direct_1v1";
  } else {
    activeModalOrigin = "search_early";
  }

  // Dynamic DOM Text Updates
  const badgeEl = document.getElementById("v2-timeout-badge-text");
  const headingEl = document.getElementById("v2-timeout-status-heading");
  const subtextEl = document.getElementById("v2-timeout-subtext-para");
  const retryBtnText = document.getElementById("v2-btn-timeout-retry-text");
  const retryBtnIcon = document.getElementById("v2-btn-timeout-retry-icon");
  const modeSelector = document.getElementById("v2-share-mode-selector");
  const linkInputBox = document.getElementById("v2-share-link-input-box");
  const linkInput = document.getElementById("v2-share-link-input");
  const trustBox = document.getElementById("v2-timeout-trust-box");
  const protipBox = document.getElementById("v2-timeout-protip-box");

  if (activeModalOrigin === "direct_1v1") {
    const modeLabel = (mode === "video") ? "Video Call" : (mode === "audio") ? "Audio Call" : "Text Chat";
    if (badgeEl) badgeEl.innerHTML = '<i class="fa-solid fa-lock text-purple-400"></i> Private Link';
    if (headingEl) {
      headingEl.className = "v2-timeout-status-badge invite-mode";
      headingEl.innerHTML = `🔒 Private ${modeLabel} Link`;
    }
    if (subtextEl) subtextEl.innerHTML = `Share this private link with anyone. They click to connect directly with you in private ${modeLabel.toLowerCase()} (No phone number or login needed).`;
    if (retryBtnText) retryBtnText.textContent = "Back to Group";
    if (retryBtnIcon) retryBtnIcon.className = "fa-solid fa-arrow-left";

    // Show mode selector & direct link input
    if (modeSelector) modeSelector.classList.remove("hidden");
    if (linkInputBox) linkInputBox.classList.remove("hidden");
    if (linkInput) linkInput.value = currentV2InviteUrl;
    updateShareModePillUI(mode);

    // Hide unnecessary marketing text boxes
    if (trustBox) trustBox.classList.add("hidden");
    if (protipBox) protipBox.classList.add("hidden");
  } else {
    // Normal share modes (Timeout, Group Room invite, or Hero)
    if (modeSelector) modeSelector.classList.add("hidden");
    if (linkInputBox) linkInputBox.classList.add("hidden");
    if (trustBox) trustBox.classList.remove("hidden");
    if (protipBox) protipBox.classList.remove("hidden");

    if (activeModalOrigin === "viral_card") {
      if (badgeEl) badgeEl.innerHTML = '<i class="fa-solid fa-user-group text-emerald-400"></i> Group #' + (activeGroupRoomNumber || 1) + ' Invite';
      if (headingEl) {
        headingEl.className = "v2-timeout-status-badge invite-mode";
        headingEl.innerHTML = '👥 Bring Friends into Group #' + (activeGroupRoomNumber || 1) + '!';
      }
      if (subtextEl) subtextEl.innerHTML = 'Share the link on WhatsApp! Friends join this room anonymously with secret random nicknames.';
      if (retryBtnText) retryBtnText.textContent = "Back to Chat";
      if (retryBtnIcon) retryBtnIcon.className = "fa-solid fa-arrow-left";
    } else {
      if (badgeEl) badgeEl.innerHTML = '<i class="fa-solid fa-paper-plane text-purple-400"></i> Instant Direct Connect';
      if (headingEl) {
        headingEl.className = "v2-timeout-status-badge invite-mode";
        headingEl.innerHTML = '🚀 Invite Friends to HashGANG!';
      }
      if (subtextEl) subtextEl.innerHTML = 'Share your personal room link below to jump directly into a private chat or match instantly with active online users!';
      if (retryBtnText) retryBtnText.textContent = "Back to Search";
      if (retryBtnIcon) retryBtnIcon.className = "fa-solid fa-magnifying-glass";
    }
  }

  const modal = document.getElementById("v2-share-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
  }
}

function switchShare1v1Mode(newMode) {
  if (!["video", "audio", "text"].includes(newMode)) return;
  currentShare1v1Mode = newMode;
  updateShareModePillUI(newMode);

  const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
  const timestamp = Date.now();
  currentV2InviteUrl = `${baseUrl}?invite=${currentV2InviteCode}&mode=${newMode}&t=${timestamp}`;
  v2TimeoutInviteUrl = currentV2InviteUrl;
  window.v2TimeoutInviteUrl = v2TimeoutInviteUrl;

  const headingEl = document.getElementById("v2-timeout-status-heading");
  const subtextEl = document.getElementById("v2-timeout-subtext-para");
  const linkInput = document.getElementById("v2-share-link-input");
  const modeLabel = (newMode === "video") ? "Video Call" : (newMode === "audio") ? "Audio Call" : "Text Chat";

  if (headingEl) headingEl.innerHTML = `🔒 Private ${modeLabel} Link`;
  if (subtextEl) subtextEl.innerHTML = `Share this private link with anyone. They click to connect directly with you in private ${modeLabel.toLowerCase()} (No phone number or login needed).`;
  if (linkInput) linkInput.value = currentV2InviteUrl;

  if (socket && socket.connected && currentV2InviteCode) {
    socket.emit("create_invite_room", { inviteCode: currentV2InviteCode, mode: newMode, clientVersion: "v2" });
  }

  v2ShowToast(`Switched to ${modeLabel} link!`);
}

function updateShareModePillUI(mode) {
  const pills = {
    video: document.getElementById("v2-share-pill-video"),
    audio: document.getElementById("v2-share-pill-audio"),
    text: document.getElementById("v2-share-pill-text")
  };
  Object.keys(pills).forEach((k) => {
    if (pills[k]) {
      if (k === mode) {
        pills[k].classList.add("active");
      } else {
        pills[k].classList.remove("active");
      }
    }
  });
}

function handleDynamicModalAction() {
  closeV2ShareModal();
}

function closeV2ShareModal(e) {
  const modal = document.getElementById("v2-share-modal");
  if (e && e.target !== modal && !e.target.classList.contains("v2-close-btn")) return;
  
  const origin = activeModalOrigin;
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }
}

function closeV2TimeoutModal(e) {
  closeV2ShareModal(e);
}

function copyV2Link() {
  copyV2TimeoutInviteLink();
}

function triggerV2TimeoutNativeShare(platform) {
  let shareText = `🔥 Hey! Join me on HashGANG (100% Real Humans, No Bots). Click to connect directly with me: ${v2TimeoutInviteUrl || window.location.href}`;
  if (activeModalOrigin === "viral_card") {
    shareText = `🔥 Hey! Join me in Group #${activeGroupRoomNumber || 1} on HashGANG! Everyone chats anonymously with secret nicknames: ${v2TimeoutInviteUrl || window.location.href}`;
  } else if (activeModalOrigin === "direct_1v1") {
    const modeLabel = (currentShare1v1Mode === "video") ? "Private Video Call" : (currentShare1v1Mode === "audio") ? "Private Audio Call" : "Private Text Chat";
    shareText = `🔒 Join my ${modeLabel} on HashGANG (100% Free & Anonymous, No App Download):\n\n${currentV2InviteUrl}`;
  }
  
  if (platform === "telegram") {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(v2TimeoutInviteUrl || window.location.href)}&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, "_blank");
    v2ShowToast("Opening Telegram Share... ✈️");
    return;
  }

  // Default WhatsApp / Web Share
  if (navigator.share) {
    navigator.share({
      title: "HashGANG",
      text: shareText,
      url: v2TimeoutInviteUrl || window.location.href
    }).then(() => {
      v2ShowToast("Shared! Waiting for friend to connect... 🚀");
    }).catch((err) => {
      if (err.name !== "AbortError") {
        const encodedMsg = encodeURIComponent(shareText);
        window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, "_blank");
      }
    });
  } else {
    const encodedMsg = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, "_blank");
    v2ShowToast("Opening WhatsApp Share... 🚀");
  }
}

function copyV2TimeoutInviteLink() {
  let shareText = v2TimeoutInviteUrl || window.location.href;
  if (activeModalOrigin === "direct_1v1") {
    shareText = currentV2InviteUrl;
  } else if (activeModalOrigin === "viral_card") {
    shareText = `🔥 Hey! Join me in Group #${activeGroupRoomNumber || 1} on HashGANG: ${v2TimeoutInviteUrl || window.location.href}`;
  }
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareText).then(() => {
      v2ShowToast("Link copied to clipboard! 📋");
    }).catch(() => {
      fallbackCopyText(shareText);
    });
  } else {
    fallbackCopyText(shareText);
  }
}

function fallbackCopyText(text) {
  const tempInput = document.createElement("textarea");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  try {
    document.execCommand("copy");
    v2ShowToast("Invite Link Copied! Share in your groups 🚀");
  } catch (err) {
    v2ShowToast("Failed to copy link.");
  }
  document.body.removeChild(tempInput);
}

function v2StartCall() {
  v2SelectModeAndStart(currentChatMode || "text");
}

function retryV2SearchFromTimeout() {
  closeV2ShareModal();
  v2StartCall();
}

function checkV2UrlInviteParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const rawInviteCode = urlParams.get("invite");
  const modeParam = urlParams.get("mode");
  const timestampParam = urlParams.get("t");

  // Sanitize inviteCode to alphanumeric characters only (max 12 chars)
  const inviteCode = rawInviteCode ? rawInviteCode.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12) : null;

  if (modeParam && ["video", "audio", "text"].includes(modeParam)) {
    currentChatMode = modeParam;
  }

  if (inviteCode) {
    // 15-Minute Link Expiry Check
    const parsedTs = parseInt(timestampParam, 10);
    const isExpired = !isNaN(parsedTs) && (Date.now() - parsedTs > 15 * 60 * 1000);
    if (isExpired) {
      console.log("⏰ [v2 Url Invite] Invite link expired. Falling back to group chat.");
      v2ShowToast("⏰ This private link has expired. Welcome to Group Chat!");
      try { sessionStorage.removeItem("hg_pending_invite"); } catch (e) {}
    } else {
      window.pendingV2InviteCode = inviteCode;
      window.isJoiningPrivateInvite = true;
      try {
        sessionStorage.setItem("hg_pending_invite", JSON.stringify({
          code: inviteCode,
          mode: currentChatMode,
          ts: !isNaN(parsedTs) ? parsedTs : Date.now()
        }));
      } catch (e) {}
      console.log(`🔗 [v2 Url Invite] Found personal invite code: ${inviteCode} [Mode: ${currentChatMode}]`);
      v2ShowToast(`🤝 Connecting to private ${currentChatMode.toUpperCase()} chat...`, 4000);
    }
  } else {
    // Check sessionStorage for persisted pending invite across page reload or SW activation
    try {
      const stored = sessionStorage.getItem("hg_pending_invite");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.code && (Date.now() - parsed.ts < 15 * 60 * 1000)) {
          window.pendingV2InviteCode = parsed.code;
          window.isJoiningPrivateInvite = true;
          if (parsed.mode && ["video", "audio", "text"].includes(parsed.mode)) {
            currentChatMode = parsed.mode;
          }
          console.log(`🔗 [v2 Session Invite] Restored pending invite from sessionStorage: ${parsed.code} [Mode: ${currentChatMode}]`);
        } else {
          sessionStorage.removeItem("hg_pending_invite");
        }
      }
    } catch (e) {}
  }

  // Parse Group Room URL Parameter (e.g. ?room=2)
  const roomParam = urlParams.get("room");
  if (roomParam) {
    const parsedRoom = parseInt(roomParam, 10);
    if (!isNaN(parsedRoom) && parsedRoom > 0 && parsedRoom <= 1000) {
      window.pendingV2RequestedRoom = parsedRoom;
      console.log(`👥 [v2 Group Invite] Found requested group room: #${parsedRoom}`);
    }
  }

  // Clean address bar so user never retains or re-shares stale query parameters
  if (urlParams.has("invite") || urlParams.has("room") || urlParams.has("mode") || urlParams.has("t")) {
    try {
      if (window.history && window.history.replaceState) {
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    } catch (e) {}
  }
}

function shareToSocial(platform) {
  const textInput = document.getElementById("v2-share-text-input");
  const messageText = textInput ? textInput.value : `🔥 Hey! Connect with me on HashGANG!\n💬 Free HD Video, Audio & Text Chat (No Signup required).\nJoin directly: ${currentV2InviteUrl || "https://chat.hashgang.com"}`;
  const encodedText = encodeURIComponent(messageText);
  const rawUrl = currentV2InviteUrl || "https://chat.hashgang.com";
  const encodedUrl = encodeURIComponent(rawUrl);

  if (platform === "whatsapp") {
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`);
  } else if (platform === "telegram") {
    window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent("🔥 Hey! Connect with me on HashGANG!\n💬 Free HD Video, Audio & Text Chat (No Signup required).\nJoin directly:")}`);
  } else if (platform === "twitter") {
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}`);
  } else if (platform === "facebook") {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`);
  } else if (platform === "snapchat") {
    navigator.clipboard.writeText(messageText);
    v2ShowToast("Message & private link copied! Paste in Snapchat Story or DM 👻");
  } else if (platform === "instagram") {
    navigator.clipboard.writeText(messageText);
    v2ShowToast("Message & private link copied! Paste in Instagram DM, Bio or Story 📸");
  }
}

function toggleAudio() {
  if (!localStream) {
    v2ShowToast("⚠️ Connect to a call first to toggle microphone!");
    return;
  }
  const audioTrack = localStream.getAudioTracks()[0];
  if (!audioTrack) {
    v2ShowToast("⚠️ No audio track found.");
    return;
  }

  audioTrack.enabled = !audioTrack.enabled;
  const isMuted = !audioTrack.enabled;

  const btnMute = document.getElementById("v2-btn-mute");
  if (btnMute) {
    if (isMuted) {
      btnMute.classList.add("muted");
      btnMute.innerHTML = `<i class="fa-solid fa-microphone-slash text-rose-400"></i>`;
      btnMute.title = "Unmute Mic";
    } else {
      btnMute.classList.remove("muted");
      btnMute.innerHTML = `<i class="fa-solid fa-microphone"></i>`;
      btnMute.title = "Mute Mic";
    }
  }

  const avatarLabel = document.getElementById("v2-audio-label");
  if (avatarLabel && currentChatMode === "audio") {
    avatarLabel.innerHTML = isMuted 
      ? `<span class="text-rose-400">🔇 Microphone Muted</span>`
      : `<span class="text-emerald-400">🟢 Voice Stranger Connected</span>`;
  }

  v2ShowToast(isMuted ? "🔇 Microphone Muted" : "🎙️ Microphone Active");
}

function toggleVideo() {
  if (!localStream) {
    v2ShowToast("⚠️ Connect to a video call first to toggle camera!");
    return;
  }
  const videoTrack = localStream.getVideoTracks()[0];
  if (!videoTrack) {
    v2ShowToast("⚠️ No video track found.");
    return;
  }

  videoTrack.enabled = !videoTrack.enabled;
  const isOff = !videoTrack.enabled;

  const btnCam = document.getElementById("v2-btn-cam");
  if (btnCam) {
    if (isOff) {
      btnCam.classList.add("off");
      btnCam.innerHTML = `<i class="fa-solid fa-video-slash text-rose-400"></i>`;
      btnCam.title = "Turn On Camera";
    } else {
      btnCam.classList.remove("off");
      btnCam.innerHTML = `<i class="fa-solid fa-video"></i>`;
      btnCam.title = "Turn Off Camera";
    }
  }

  v2ShowToast(isOff ? "📹 Camera Turned Off" : "🎥 Camera Active");
}

/**
 * Toggle Collapsible Footer SEO Links Section
 */
function toggleV2SeoLinks() {
  const container = document.getElementById("v2-seo-links-container");
  const chevron = document.getElementById("v2-seo-chevron");
  if (!container) return;
  const isHidden = container.classList.toggle("hidden");
  if (chevron) {
    chevron.style.transform = isHidden ? "rotate(0deg)" : "rotate(180deg)";
  }
}
window.toggleV2SeoLinks = toggleV2SeoLinks;


// Bind all global click handler functions to window object
window.v2SelectModeAndStart = v2SelectModeAndStart;
window.v2HandleStartOrNext = v2HandleStartOrNext;
window.v2StartCall = v2StartCall;
window.v2StopCall = v2StopCall;
window.toggleV2Menu = toggleV2Menu;
window.openV2ShareModal = openV2ShareModal;
window.closeV2ShareModal = closeV2ShareModal;
window.copyV2Link = copyV2Link;
window.toggleAudio = toggleAudio;
window.toggleVideo = toggleVideo;
window.toggleV2VideoSwap = toggleV2VideoSwap;
window.v2RetryMediaPermission = v2RetryMediaPermission;
window.v2SwitchModeAndSearch = v2SwitchModeAndSearch;
window.shareToSocial = shareToSocial;
window.v2HandleMediaUpload = v2HandleMediaUpload;
window.v2ShowToast = v2ShowToast;
window.triggerV2AudioMediaUpload = triggerV2AudioMediaUpload;
window.dismissV2AudioSharedMedia = dismissV2AudioSharedMedia;
window.dismissV2VideoSharedMedia = dismissV2VideoSharedMedia;
window.handlePwaInstallPrompt = handlePwaInstallPrompt;
window.switchCamera = switchCamera;
window.closeV2TimeoutModal = closeV2TimeoutModal;
window.triggerV2TimeoutNativeShare = triggerV2TimeoutNativeShare;
window.copyV2TimeoutInviteLink = copyV2TimeoutInviteLink;
window.retryV2SearchFromTimeout = retryV2SearchFromTimeout;
window.handleDynamicModalAction = handleDynamicModalAction;

function v2ReportAndBlockStranger() {
  if (!currentMatchTargetId) {
    v2ShowToast("⚠️ Connect to a stranger first before reporting.");
    return;
  }

  const traceCode = window.currentSessionTraceCode || "N/A";
  const confirmReport = confirm(`🚩 Report this stranger for inappropriate behavior / nudity?\n\nSession Trace Code: ${traceCode}\nThey will be immediately blocked and reported.`);
  if (!confirmReport) return;

  const targetId = currentMatchTargetId;
  currentMatchTargetId = null;
  window.currentMatchTargetId = null;
  recordSkippedPeerV2(targetId);

  // Auto-copy Session Trace Code to user's clipboard for legal reference
  if (traceCode && traceCode !== "N/A" && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(`HashGANG Session Trace Code: ${traceCode}`).catch(() => {});
  }

  if (socket && socket.connected) {
    socket.emit("report_peer", { targetId: targetId, traceCode: traceCode, reason: "inappropriate" });
  }

  v2ShowToast(`🚩 Reported! Trace Code: ${traceCode} (Copied to Clipboard)`);
  v2HandleStartOrNext();
}
window.v2ReportAndBlockStranger = v2ReportAndBlockStranger;

/**
 * Stranger Chat Backend API Telemetry & Analytics Integration
 */
function updateOnlineUsersDisplay(count) {
  const badge = document.getElementById("v2-online-count-text") || document.getElementById("online-users-count");
  if (badge && typeof count === "number") {
    badge.textContent = `${count.toLocaleString()} Online Users`;
  }
}
window.updateOnlineUsersDisplay = updateOnlineUsersDisplay;

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
      body: JSON.stringify({ visitorId, country: "UNKNOWN", device }),
    }).catch(() => {});
  } catch (e) {}
}

async function recordSessionTimeBackend(durationSeconds = 30) {
  if (typeof BACKEND_API_BASE === "undefined") return;
  try {
    const visitorId = getVisitorId();
    fetch(`${BACKEND_API_BASE}/analytics/session-time`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId, durationSeconds }),
    }).catch(() => {});
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
  } catch (e) {}
}

async function fetchSelfBrandAdsFromBackend() {
  try {
    const cached = localStorage.getItem("v2_cached_ad_mediation_config");
    if (cached) {
      window.AD_MEDIATION_CONFIG = JSON.parse(cached);
    }
  } catch (e) {}

  if (typeof BACKEND_API_BASE === "undefined") return;
  try {
    fetch(`${BACKEND_API_BASE}/ads/mediation-config`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.config) {
          window.AD_MEDIATION_CONFIG = data.config;
          try {
            localStorage.setItem("v2_cached_ad_mediation_config", JSON.stringify(data.config));
          } catch (e) {}
          console.log("Ad mediation config synced dynamically from backend server & cached in localStorage");
        }
      })
      .catch(() => {});
  } catch (e) {}
}

async function recordAdImpressionBackend(adConfig, durationWatched = 0, completedFull = false, skipped = false, clickedCta = false) {
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
        visitorId
      }),
    }).catch(() => {});
  } catch (e) {}
}

// ==========================================
// GROUP CHAT (MULTIPLAYER FALLBACK) ENGINE
// ==========================================

function checkAgeConfirmationOnLoad() {
  if (!currentNickname) {
    currentNickname = generateCoolNickname();
    localStorage.setItem("hg_user_nickname", currentNickname);
  }
  updateNicknameDisplay(currentNickname);

  const ageModal = document.getElementById("v2-age-modal");
  if (!is18Confirmed) {
    if (ageModal) ageModal.classList.remove("hidden");
  } else {
    if (ageModal) ageModal.classList.add("hidden");
    if (socket && socket.connected) {
      if (window.pendingV2InviteCode || window.isJoiningPrivateInvite) {
        let codeToJoin = window.pendingV2InviteCode;
        if (!codeToJoin) {
          try {
            const stored = sessionStorage.getItem("hg_pending_invite");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed && parsed.code && (Date.now() - parsed.ts < 15 * 60 * 1000)) codeToJoin = parsed.code;
            }
          } catch (e) {}
        }
        if (codeToJoin) {
          console.log(`🤝 [v2 Personal Invite] Auto-joining private invite room: ${codeToJoin}`);
          window.pendingV2InviteCode = null;
          window.isJoiningPrivateInvite = true;
          v2ShowToast("🤝 Connecting directly to your friend's private call...");
          socket.emit("join_invite_room", { inviteCode: codeToJoin, mode: currentChatMode, clientVersion: "v2", nickname: currentNickname });
          return;
        }
      }
      joinGroupChatOnConnect();
    }
  }
}

function confirmAgeAndEnter() {
  is18Confirmed = true;
  localStorage.setItem("hg_18_confirmed", "true");
  const ageModal = document.getElementById("v2-age-modal");
  if (ageModal) ageModal.classList.add("hidden");

  let codeToJoin = window.pendingV2InviteCode;
  if (!codeToJoin) {
    try {
      const stored = sessionStorage.getItem("hg_pending_invite");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.code && (Date.now() - parsed.ts < 15 * 60 * 1000)) {
          codeToJoin = parsed.code;
          if (parsed.mode) currentChatMode = parsed.mode;
        }
      }
    } catch (e) {}
  }

  if (codeToJoin || window.isJoiningPrivateInvite) {
    window.isJoiningPrivateInvite = true;
    window.pendingV2InviteCode = codeToJoin;
    v2ShowToast(`🤝 Connecting to private ${currentChatMode.toUpperCase()} chat...`);
    if (socket && socket.connected) {
      console.log(`🤝 [v2 Personal Invite] Joining private invite room directly: ${codeToJoin}`);
      window.pendingV2InviteCode = null;
      socket.emit("join_invite_room", { inviteCode: codeToJoin, mode: currentChatMode, clientVersion: "v2", nickname: currentNickname });
    } else {
      console.log(`⏳ [v2 Personal Invite] Socket connecting, invite code ${codeToJoin} will auto-join on connect.`);
    }
    return;
  }
  joinGroupChatOnConnect();
}

function generateCoolNickname() {
  const maleCharacters = [
    "Batman", "SpiderMan", "IronMan", "Deadpool", "Wolverine",
    "Thor", "Hanuman", "Baahubali", "Bheem", "Vikram",
    "Karna", "JonSnow", "MrBean", "Sherlock", "JackSparrow",
    "WalterWhite", "HarryPotter", "JamesBond", "Krrish", "Shaktimaan",
    "Joker", "DoctorStrange", "CaptainAmerica", "Tarzan", "Hulk",
    "Superman", "BlackPanther", "Mario", "ThomasShelby", "PercyJackson"
  ];

  const femaleCharacters = [
    "WonderWoman", "BlackWidow", "HarleyQuinn", "AryaStark", "SansaStark",
    "Daenerys", "Hermione", "Wednesday", "Barbie", "Catwoman",
    "LaraCroft", "ScarletWitch", "Supergirl", "Batgirl", "Gamora",
    "Katniss", "Mulan", "Elsa", "Cleopatra", "Ahsoka",
    "Rey", "Trinity", "CaptainMarvel", "Padme", "Maleficent",
    "Moana", "Rapunzel", "SheHulk", "EnolaHolmes", "PrincessLeia"
  ];

  const neutralCharacters = [
    "Eleven", "Loki", "Groot", "Yoda", "BabyYoda",
    "Pikachu", "Sonic", "Baymax", "Toothless", "Stitch",
    "WallE", "Kirby", "Minion", "Casper", "Phoenix"
  ];

  const allCharacters = [...maleCharacters, ...femaleCharacters, ...neutralCharacters];
  const chosen = allCharacters[Math.floor(Math.random() * allCharacters.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${chosen}_${num}`;
}

function joinGroupChatOnConnect() {
  if (window.isJoiningPrivateInvite || window.pendingV2InviteCode) {
    console.log("🛡️ [Group Chat] Prevented auto-join: 1-on-1 private invite is active.");
    return;
  }
  if ((typeof inCall !== "undefined" && inCall) || currentMatchTargetId) {
    console.log("🛡️ [Group Chat] Prevented auto-join: Already active in a 1-on-1 call.");
    return;
  }
  if (!socket || !socket.connected) {
    setTimeout(joinGroupChatOnConnect, 300);
    return;
  }
  console.log("💬 [Group Chat] Emitting join_group_chat with nickname:", currentNickname);
  const payload = { nickname: currentNickname };
  if (window.pendingV2RequestedRoom) {
    payload.requestedRoomNumber = window.pendingV2RequestedRoom;
  }
  socket.emit("join_group_chat", payload);
}

function promptEditNickname() {
  const modal = document.getElementById("v2-nickname-modal");
  const input = document.getElementById("v2-input-new-nick");
  if (modal && input) {
    input.value = currentNickname || "";
    modal.classList.remove("hidden");
    input.focus();
  }
}

function closeNicknameModal() {
  const modal = document.getElementById("v2-nickname-modal");
  if (modal) modal.classList.add("hidden");
}

function saveNewNickname() {
  const input = document.getElementById("v2-input-new-nick");
  if (!input) return;
  const clean = input.value.trim().slice(0, 20);
  if (clean) {
    currentNickname = clean;
    localStorage.setItem("hg_user_nickname", currentNickname);
    updateNicknameDisplay(currentNickname);
    if (socket && socket.connected) {
      socket.emit("update_nickname", { nickname: currentNickname });
    }
    v2ShowToast(`✨ Nickname changed to ${currentNickname}`);
  }
  closeNicknameModal();
}

function updateNicknameDisplay(name) {
  const display = document.getElementById("v2-user-nickname-display");
  if (display) {
    display.textContent = name || "Stranger";
  }
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderGroupMessageRow(msg) {
  const isSelf = (socket && socket.id && msg.senderId === socket.id) || (msg.nickname === currentNickname);
  const row = document.createElement("div");
  row.className = `v2-group-msg-row ${isSelf ? "self" : "other"}`;
  row.id = `msg-${msg.id}`;

  let replyHtml = "";
  if (msg.replyTo) {
    replyHtml = `
      <div class="v2-bubble-reply-quote">
        <strong>${escapeHtml(msg.replyTo.nickname)}</strong>: ${escapeHtml(msg.replyTo.text)}
      </div>
    `;
  }

  let reactionsHtml = "";
  if (msg.reactions && Object.keys(msg.reactions).length > 0) {
    reactionsHtml = `<div class="v2-msg-reactions-row">`;
    for (const [emoji, count] of Object.entries(msg.reactions)) {
      if (count > 0) {
        reactionsHtml += `<span class="v2-reaction-chip" onclick="quickSendReaction('${msg.id}', '${emoji}')">${emoji} ${count}</span>`;
      }
    }
    reactionsHtml += `</div>`;
  }

  const senderNick = escapeHtml(msg.nickname || "Stranger");
  const cleanText = escapeHtml(msg.text);

  let actionsHtml = "";
  if (isSelf) {
    actionsHtml = `
      <div class="v2-msg-external-actions">
        <button class="v2-ext-act-btn hidden" id="group-react-btn-${msg.id}" title="Reaction" style="pointer-events: none; cursor: default;">😊</button>
        <button class="v2-ext-act-btn" title="Reply" onclick="startReplyToMessage('${msg.id}', 'You', '${cleanText.slice(0, 50)}')">↩️</button>
      </div>
    `;
  } else {
    actionsHtml = `
      <div class="v2-msg-external-actions">
        <button class="v2-ext-act-btn" title="Reply" onclick="startReplyToMessage('${msg.id}', '${senderNick}', '${cleanText.slice(0, 50)}')">↩️</button>
        <button class="v2-ext-act-btn" id="group-react-btn-${msg.id}" title="React" onclick="toggleGroupReactionPicker('${msg.id}', event)">😊</button>
      </div>
    `;
  }

  const senderLabel = isSelf
    ? `<span class="v2-msg-sender-name self"><span class="v2-you-pill">You</span> ${senderNick}</span>`
    : `<span class="v2-msg-sender-name">${senderNick}</span>`;

  row.innerHTML = `
    ${senderLabel}
    <div class="v2-msg-bubble">
      ${replyHtml}
      <span>${cleanText}</span>
      ${actionsHtml}
    </div>
    ${reactionsHtml}
  `;

  return row;
}

function renderCallInviteCard(invite) {
  const isSelf = (socket && socket.id && invite.inviterSocketId === socket.id);
  const card = document.createElement("div");
  card.className = `v2-feed-call-card ${invite.status}`;
  card.id = `card-${invite.inviteId}`;

  const modeIcon = invite.mode === "video" ? "video" : (invite.mode === "audio" ? "microphone" : "comment-dots");

  let actionBtnHtml = "";
  if (invite.status === "open") {
    if (isSelf) {
      actionBtnHtml = `<div class="v2-btn-join-call-action" style="background: rgba(255,255,255,0.1); cursor: default;">
        <i class="fa-solid fa-satellite-dish"></i> Your Open Invite (Waiting for member...)
      </div>`;
    } else {
      actionBtnHtml = `<button class="v2-btn-join-call-action" onclick="acceptCallInvite('${invite.inviteId}', '${invite.mode}')">
        <i class="fa-solid fa-bolt"></i> Join Private ${invite.mode.toUpperCase()} Chat ⚡
      </button>`;
    }
  } else if (invite.status === "accepted") {
    actionBtnHtml = `<div class="v2-btn-join-call-action" style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); cursor: default;">
      <i class="fa-solid fa-check"></i> Connected in Private Call
    </div>`;
  } else {
    actionBtnHtml = `<div class="v2-btn-join-call-action" style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); cursor: default;">
      <i class="fa-solid fa-clock-rotate-left"></i> Invite Expired
    </div>`;
  }

  card.innerHTML = `
    <div class="v2-call-card-top">
      <span class="v2-card-mode-pill ${invite.mode}">
        <i class="fa-solid fa-${modeIcon}"></i> Private ${invite.mode}
      </span>
      <span class="v2-card-status-text" id="status-${invite.inviteId}">
        ${invite.status === 'open' ? '🟢 Active Now' : (invite.status === 'accepted' ? '🔒 Connected' : '⚪ Expired')}
      </span>
    </div>
    <div class="v2-call-card-desc">
      <strong>${escapeHtml(invite.inviterName || "Member")}</strong> invited the group to a private ${invite.mode} chat!
    </div>
    ${actionBtnHtml}
  `;

  // Client-side visual auto-expiry guard (60s lifetime from invite creation)
  if (invite.status === "open") {
    const elapsed = Date.now() - (invite.createdAt || Date.now());
    const remainingMs = Math.max(0, 60000 - elapsed);
    setTimeout(() => {
      const cardEl = document.getElementById(`card-${invite.inviteId}`);
      if (cardEl && !cardEl.classList.contains("taken")) {
        cardEl.className = "v2-feed-call-card expired";
        const statusEl = document.getElementById(`status-${invite.inviteId}`);
        if (statusEl) statusEl.textContent = "⚪ Expired";
        const btn = cardEl.querySelector(".v2-btn-join-call-action");
        if (btn) {
          btn.outerHTML = `<div class="v2-btn-join-call-action" style="background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.4); cursor: default;"><i class="fa-solid fa-clock-rotate-left"></i> Invite Expired</div>`;
        }
      }
    }, remainingMs);
  }

  return card;
}

function renderWelcomeKnowledgeCard(roomNumber = 1) {
  const card = document.createElement("div");
  card.className = "v2-feed-welcome-card inline-welcome";
  card.id = "v2-feed-welcome-card";
  const nick = escapeHtml(currentNickname || "Anonymous");
  card.innerHTML = `
    <div class="v2-welcome-top">
      <span class="v2-welcome-emoji">👋</span>
      <div class="v2-welcome-headings">
        <h4>Welcome to HashGANG</h4>
        <p>You are chatting as <strong style="color: #c084fc;">${nick}</strong>. Chat freely or start a private call:</p>
      </div>
    </div>
    <div class="v2-welcome-modes-strip">
      <button class="v2-welcome-mode-btn video" onclick="request1v1CallInvite('video')" title="Start Private Video Call">
        <i class="fa-solid fa-video"></i> <span>Video Call</span>
      </button>
      <button class="v2-welcome-mode-btn audio" onclick="request1v1CallInvite('audio')" title="Start Private Voice Call">
        <i class="fa-solid fa-microphone"></i> <span>Voice Call</span>
      </button>
      <button class="v2-welcome-mode-btn text" onclick="request1v1CallInvite('text')" title="Start Private Text Chat">
        <i class="fa-solid fa-comment-dots"></i> <span>Text Chat</span>
      </button>
    </div>
  `;
  return card;
}

function render1v1DiscoveryFeedCard() {
  const card = document.createElement("div");
  card.className = "v2-feed-discovery-card";
  card.innerHTML = `
    <div class="v2-discovery-card-header">
      <div class="v2-discovery-badge">
        <i class="fa-solid fa-bolt text-amber-400"></i> Direct Private Chat
      </div>
      <span class="v2-discovery-tag">Direct Match</span>
    </div>
    <div class="v2-discovery-card-body">
      <h5>Skip the crowd! Connect privately</h5>
      <p>Connect with an anonymous stranger in an encrypted room:</p>
      <div class="v2-discovery-action-tiles">
        <button class="v2-discovery-tile video" onclick="request1v1CallInvite('video')" title="Start Private Video Call">
          <i class="fa-solid fa-video"></i>
          <span>Video Call</span>
        </button>
        <button class="v2-discovery-tile audio" onclick="request1v1CallInvite('audio')" title="Start Private Voice Call">
          <i class="fa-solid fa-microphone"></i>
          <span>Voice Call</span>
        </button>
        <button class="v2-discovery-tile text" onclick="request1v1CallInvite('text')" title="Start Private Text Chat">
          <i class="fa-solid fa-comment-dots"></i>
          <span>Text Chat</span>
        </button>
      </div>
    </div>
  `;
  return card;
}

function dismissWelcomeKnowledgeCard() {
  const slot = document.getElementById("v2-group-welcome-slot");
  if (slot) slot.innerHTML = "";
  const card = document.getElementById("v2-feed-welcome-card");
  if (card) card.remove();
  try {
    localStorage.setItem("hg_welcome_dismissed", "true");
  } catch (e) {}
}

function renderViralCommunityCard() {
  const card = document.createElement("div");
  card.className = "v2-feed-viral-card";
  card.id = "v2-feed-viral-card";
  card.innerHTML = `
    <div class="v2-viral-top-content">
      <div class="v2-viral-badge">
        <i class="fa-solid fa-user-group text-emerald-400"></i> Better with Friends
      </div>
      <h5>Bring your friends into this group chat!</h5>
      <p>Share with friends — they'll join anonymously with secret nicknames too!</p>
    </div>
    <div class="v2-viral-share-strip">
      <button class="v2-social-strip-btn whatsapp" onclick="triggerDirectPlatformShare('whatsapp')" title="Share to WhatsApp">
        <i class="fa-brands fa-whatsapp"></i> WhatsApp
      </button>
      <button class="v2-social-strip-btn telegram" onclick="triggerDirectPlatformShare('telegram')" title="Share to Telegram">
        <i class="fa-brands fa-telegram"></i> Telegram
      </button>
      <button class="v2-social-strip-btn instagram" onclick="triggerDirectPlatformShare('instagram')" title="Share to Instagram">
        <i class="fa-brands fa-instagram"></i> Instagram
      </button>
      <button class="v2-social-strip-btn snapchat" onclick="triggerDirectPlatformShare('snapchat')" title="Share to Snapchat">
        <i class="fa-brands fa-snapchat"></i> Snapchat
      </button>
      <button class="v2-social-strip-btn twitter" onclick="triggerDirectPlatformShare('twitter')" title="Share to X (Twitter)">
        <i class="fa-brands fa-x-twitter"></i> X
      </button>
      <button class="v2-social-strip-btn copy" onclick="triggerDirectPlatformShare('copy')" title="Copy Room Invite Link">
        <i class="fa-solid fa-link"></i> Copy Link
      </button>
    </div>
  `;
  return card;
}

function renderDirect1v1SocialInviteFeedCard() {
  const card = document.createElement("div");
  card.className = "v2-feed-viral-card direct-1v1";
  card.id = "v2-feed-direct-1v1-card";
  card.innerHTML = `
    <div class="v2-viral-top-content">
      <div class="v2-viral-badge" style="color: #c084fc;">
        <i class="fa-solid fa-lock text-purple-400"></i> Secret Private Link
      </div>
      <h5>Invite a friend to private chat!</h5>
      <p>Send a secret link on WhatsApp or Telegram to connect in a private encrypted room:</p>
    </div>
    <div class="v2-viral-share-strip">
      <button class="v2-social-strip-btn whatsapp" onclick="triggerDirect1v1Share('video')" title="Share Private Video Link on WhatsApp">
        <i class="fa-brands fa-whatsapp"></i> WhatsApp Link
      </button>
      <button class="v2-social-strip-btn telegram" onclick="triggerDirect1v1Share('video')" title="Share Private Video Link on Telegram">
        <i class="fa-brands fa-telegram"></i> Telegram Link
      </button>
      <button class="v2-social-strip-btn" onclick="openV2ShareModal('direct_1v1', 'video')" title="Choose Video, Audio, or Text Mode" style="background: rgba(192, 132, 252, 0.15); border-color: rgba(192, 132, 252, 0.4); color: #e9d5ff;">
        <i class="fa-solid fa-link"></i> Get Secret Link
      </button>
    </div>
  `;
  return card;
}

function triggerDirectPlatformShare(platform) {
  const roomNum = activeGroupRoomNumber || 1;
  const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
  const shareUrl = `${baseUrl}?room=${roomNum}`;
  const shareText = `Hey! Come join me in HashGANG Anonymous Group #${roomNum} — chat freely with strangers anonymously without login!`;
  const fullMessage = `${shareText} ${shareUrl}`;

  switch (platform) {
    case "whatsapp": {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
      window.open(waUrl, "_blank");
      break;
    }
    case "telegram": {
      const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      window.open(tgUrl, "_blank");
      break;
    }
    case "instagram": {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullMessage).catch(() => {});
      }
      v2ShowToast("Opening Instagram... Link copied! Paste in Story/DM 📸");
      setTimeout(() => {
        window.location.href = "instagram://app";
      }, 400);
      break;
    }
    case "snapchat": {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullMessage).catch(() => {});
      }
      v2ShowToast("Opening Snapchat... Link copied! Paste in Snap/Story 👻");
      setTimeout(() => {
        window.location.href = "snapchat://";
      }, 400);
      break;
    }
    case "twitter": {
      const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
      window.open(twUrl, "_blank");
      break;
    }
    case "copy":
    default: {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          v2ShowToast("📋 Room invite link copied to clipboard!");
        }).catch(() => {
          v2CopyFallback(shareUrl);
        });
      } else {
        v2CopyFallback(shareUrl);
      }
      break;
    }
  }
}

const GROUP_ADSTERRA_HOURLY_KEY = "v2_group_adsterra_hourly_tracker_v2";
const MAX_GROUP_ADSTERRA_PER_HOUR = 4;
let houseCardCycleIndex = 0;

function getGroupHourlyAdsterraStatus() {
  try {
    const raw = localStorage.getItem(GROUP_ADSTERRA_HOURLY_KEY);
    const now = Date.now();
    if (!raw) return { canShow: true, count: 0 };
    const data = JSON.parse(raw);
    if (!data || typeof data.count !== "number" || typeof data.windowStart !== "number") {
      return { canShow: true, count: 0 };
    }
    if (now - data.windowStart > 3600000) {
      localStorage.removeItem(GROUP_ADSTERRA_HOURLY_KEY);
      return { canShow: true, count: 0 };
    }
    return { canShow: data.count < MAX_GROUP_ADSTERRA_PER_HOUR, count: data.count };
  } catch (e) {
    return { canShow: true, count: 0 };
  }
}

function incrementGroupHourlyAdsterraCount() {
  try {
    const now = Date.now();
    const status = getGroupHourlyAdsterraStatus();
    const raw = localStorage.getItem(GROUP_ADSTERRA_HOURLY_KEY);
    let windowStart = now;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.windowStart && (now - parsed.windowStart <= 3600000)) {
          windowStart = parsed.windowStart;
        }
      } catch (e) {}
    }
    const newCount = status.count + 1;
    localStorage.setItem(GROUP_ADSTERRA_HOURLY_KEY, JSON.stringify({ count: newCount, windowStart }));
  } catch (e) {}
}

function renderPWAInstallFeedCard(badgeText = "Promoted") {
  const card = document.createElement("div");
  card.className = "v2-feed-house-card pwa";
  card.innerHTML = `
    <div class="v2-house-card-header">
      <span class="v2-house-tag"><i class="fa-solid fa-mobile-screen-button"></i> 1-Tap Fast App</span>
      <span class="v2-house-ad-badge">${badgeText}</span>
    </div>
    <div class="v2-house-card-body">
      <div class="v2-house-icon-wrap">
        <img src="logo-sm.webp" alt="HashGANG" class="v2-house-app-icon" width="40" height="40" />
      </div>
      <div class="v2-house-card-text">
        <h5>Install HashGANG on Home Screen</h5>
        <p>Instant stranger chat & zero browser reload lag.</p>
      </div>
    </div>
    <button class="v2-btn-house-action pwa" onclick="handlePwaInstallPrompt(event)">
      <i class="fa-solid fa-download"></i> Add to Home Screen (Free)
    </button>
  `;
  return card;
}

function renderMyLeaderPromoFeedCard() {
  const card = document.createElement("div");
  card.className = "v2-feed-house-card myleader";
  card.innerHTML = `
    <div class="v2-house-card-header">
      <span class="v2-house-tag business"><i class="fa-solid fa-rocket"></i> Business Tools</span>
      <span class="v2-house-ad-badge">Promoted</span>
    </div>
    <div class="v2-house-card-body">
      <div class="v2-house-icon-wrap myleader">
        <i class="fa-solid fa-users-gear"></i>
      </div>
      <div class="v2-house-card-text">
        <h5>MyLeader AI Workspace</h5>
        <p>Automate team management, attendance, payroll & leave policies with AI.</p>
      </div>
    </div>
    <a href="https://hashgang.com" target="_blank" rel="noopener noreferrer" class="v2-btn-house-action myleader">
      <span>Explore MyLeader Platform</span> <i class="fa-solid fa-arrow-up-right-from-square"></i>
    </a>
  `;
  return card;
}

function handleInFeedPacingInjection(feed, currentCount) {
  if (!feed) return;
  const count = typeof currentCount === "number" ? currentCount : liveGroupMsgCounter;
  const cycleIndex = Math.floor(count / 12);

  if (cycleIndex % 2 === 1) {
    // ==========================================
    // ODD SLOTS (12, 36, 60, 84, 108, 132...): REVENUE FIRST!
    // ==========================================
    const status = getGroupHourlyAdsterraStatus();
    if (status.canShow) {
      injectInFeedAdsterraBanner(feed);
      incrementGroupHourlyAdsterraCount();
      console.log(`🎯 [In-Feed Monetization] Injected Adsterra Ad (${status.count + 1}/${MAX_GROUP_ADSTERRA_PER_HOUR})`);
    } else {
      feed.appendChild(renderMyLeaderPromoFeedCard());
      console.log(`💼 [In-Feed Monetization] 4/hr Adsterra quota reached (${status.count}/${MAX_GROUP_ADSTERRA_PER_HOUR}). Injected MyLeader AI House Promo.`);
    }
  } else {
    // ==========================================
    // EVEN SLOTS (24, 48, 72, 96, 120...): 4-CARD FEATURE ROTATION
    // ==========================================
    const evenStep = Math.floor(cycleIndex / 2); // 1, 2, 3, 4, 5...
    const rotationIndex = (evenStep - 1) % 4;    // 0, 1, 2, 3

    switch (rotationIndex) {
      case 0:
        // Msg 24, 120...: Card 3 - Direct 1-on-1 Discovery within Group
        feed.appendChild(render1v1DiscoveryFeedCard());
        console.log("⚡ [In-Feed Discovery] Injected 1-on-1 Discovery Card (Inside Group).");
        break;

      case 1:
        // Msg 48, 144...: Card 1 - Social Share (Group Chat Invite)
        feed.appendChild(renderViralCommunityCard());
        console.log("🔗 [In-Feed Community] Injected Group Chat Social Share Card.");
        break;

      case 2:
        // Msg 72, 168...: Card 2 - Social Share (Direct 1-on-1 Outside Invite)
        feed.appendChild(renderDirect1v1SocialInviteFeedCard());
        console.log("🔒 [In-Feed 1v1 Share] Injected Direct 1-on-1 Outside Social Share Card.");
        break;

      case 3:
      default: {
        // Msg 96, 192...: Card 4 - PWA Install Card
        const isStandalone = (typeof window !== "undefined" && ((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone)));
        if (!isStandalone) {
          feed.appendChild(renderPWAInstallFeedCard("App"));
          console.log("📱 [In-Feed PWA] Injected PWA Install Card.");
        } else {
          feed.appendChild(render1v1DiscoveryFeedCard());
          console.log("⚡ [In-Feed PWA Fallback] App is standalone. Injected 1-on-1 Discovery Card.");
        }
        break;
      }
    }
  }
}

let inFeedAdSequence = 0;
function injectInFeedAdsterraBanner(container) {
  inFeedAdSequence++;
  const slotId = inFeedAdSequence === 1 ? "v2-infeed-ad-slot" : `v2-infeed-ad-slot-${inFeedAdSequence}`;
  const wrapperId = inFeedAdSequence === 1 ? "v2-infeed-ad-wrapper" : `v2-infeed-ad-wrapper-${inFeedAdSequence}`;

  const adBox = document.createElement("div");
  adBox.className = "v2-infeed-ad-wrapper";
  adBox.id = wrapperId;
  adBox.innerHTML = `
    <div class="v2-infeed-ad-header">
      <span class="v2-infeed-ad-badge">Ad</span>
    </div>
    <div id="${slotId}" class="v2-infeed-ad-slot">
      <div class="v2-infeed-ad-placeholder">
        <span class="v2-ad-loading-text"><i class="fa-solid fa-circle-notch fa-spin"></i> Sponsored</span>
      </div>
    </div>
  `;
  container.appendChild(adBox);

  setTimeout(() => {
    try {
      const slot = document.getElementById(slotId);
      if (!slot) return;
      const iframe = document.createElement("iframe");
      iframe.width = "300";
      iframe.height = "250";
      iframe.style.border = "none";
      iframe.style.overflow = "hidden";
      iframe.style.borderRadius = "8px";
      iframe.style.background = "transparent";
      iframe.setAttribute("scrolling", "no");

      const adHtml = `<!DOCTYPE html><html><head><base target="_blank"><style>body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;background:transparent;overflow:hidden;height:100vh;}</style></head><body><script type="text/javascript">atOptions={'key':'ede40fc4ab13bf9c6140311ae9860f4f','format':'iframe','height':250,'width':300,'params':{}};</script><script type="text/javascript" src="https://www.highperformanceformat.com/ede40fc4ab13bf9c6140311ae9860f4f/invoke.js"></script></body></html>`;

      if ("srcdoc" in iframe) {
        iframe.srcdoc = adHtml;
      }
      if (iframe.contentWindow) {
        try {
          const doc = iframe.contentWindow.document;
          doc.open();
          doc.write(adHtml);
          doc.close();
        } catch (e) {}
      }
      iframe.onload = () => {
        if (slot) slot.classList.add("loaded");
      };
      // Fallback reveal after 1.2s to guarantee visibility
      setTimeout(() => {
        if (slot) slot.classList.add("loaded");
      }, 1200);

      slot.appendChild(iframe);
    } catch (e) {
      console.warn("⚠️ [In-Feed Adsterra] Notice:", e);
    }
  }, 350);
}

let lastGroupMsgTime = 0;
function sendGroupMessage() {
  const input = document.getElementById("v2-group-input-field");
  if (!input) return;
  const rawText = input.value.trim();
  if (!rawText) return;

  const text = rawText.slice(0, 180);

  // Link / URL blocking: Prevent external links, promos, and spam
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.(com|in|org|net|xyz|me|io|co|ai|app|site|online|tv|ru|cn|cc|to|is|gg|link|live|fun|store|club)[^\s]*)|(t\.me\/[^\s]+)|(wa\.me\/[^\s]+)/i;
  if (urlRegex.test(text)) {
    v2ShowToast("⚠️ Links are not allowed in group chat to keep everyone safe.");
    return;
  }

  const now = Date.now();
  if (now - lastGroupMsgTime < 1000) {
    v2ShowToast("⏳ Slow down! 1 message per second.");
    return;
  }
  lastGroupMsgTime = now;

  if (socket && socket.connected) {
    socket.emit("send_group_msg", {
      text,
      replyTo: activeGroupReplyTo,
      nickname: currentNickname
    });
    input.value = "";
    input.style.height = "36px";
    cancelGroupReply();
  } else {
    v2ShowToast("⚠️ Connecting to chat server...");
  }
}

function quickSendEmoji(emoji) {
  const input = document.getElementById("v2-group-input-field");
  if (input) {
    input.value += emoji;
    input.focus();
  }
}

function quickSendReaction(msgId, emoji) {
  if (socket && socket.connected) {
    socket.emit("send_group_reaction", { messageId: msgId, emoji });
  }
}

function toggleGroupReactionPicker(msgId, event) {
  if (event) event.stopPropagation();

  const oldPicker = document.querySelector(".v2-reaction-picker");
  if (oldPicker) {
    const parentMsgId = oldPicker.dataset.forMsgId;
    oldPicker.remove();
    if (parentMsgId === msgId) return;
  }

  const btn = document.getElementById(`group-react-btn-${msgId}`);
  if (!btn) return;

  const rect = btn.getBoundingClientRect();
  const picker = document.createElement("div");
  picker.className = "v2-reaction-picker";
  picker.dataset.forMsgId = msgId;

  const pickerWidth = 240;
  let leftPos = rect.left - 40;
  if (leftPos < 8) leftPos = 8;
  if (leftPos + pickerWidth > window.innerWidth - 8) {
    leftPos = window.innerWidth - pickerWidth - 8;
  }
  let topPos = rect.top - 46;
  if (topPos < 10) topPos = rect.bottom + 8;

  picker.style.cssText = `position: fixed !important; top: ${topPos}px !important; left: ${leftPos}px !important; z-index: 9999 !important;`;

  const emojis = ["❤️", "🔥", "😂", "👏", "👍", "🎉"];
  emojis.forEach((emoji) => {
    const item = document.createElement("span");
    item.className = "v2-reaction-emoji-item";
    item.textContent = emoji;
    item.onclick = (e) => {
      e.stopPropagation();
      quickSendReaction(msgId, emoji);
      picker.remove();
    };
    picker.appendChild(item);
  });

  document.body.appendChild(picker);

  const closeHandler = (e) => {
    if (!picker.contains(e.target)) {
      picker.remove();
      document.removeEventListener("click", closeHandler);
    }
  };
  setTimeout(() => document.addEventListener("click", closeHandler), 50);
}

function startReplyToMessage(id, nickname, text) {
  activeGroupReplyTo = { id, nickname, text: text.slice(0, 60) };
  const replyBar = document.getElementById("v2-group-reply-bar");
  const targetName = document.getElementById("v2-reply-target-name");
  const targetSnippet = document.getElementById("v2-reply-target-snippet");
  if (replyBar && targetName && targetSnippet) {
    targetName.textContent = nickname;
    targetSnippet.textContent = text.slice(0, 60) + (text.length > 60 ? "..." : "");
    replyBar.classList.remove("hidden");
  }
  const input = document.getElementById("v2-group-input-field");
  if (input) input.focus();
}

function cancelGroupReply() {
  activeGroupReplyTo = null;
  const replyBar = document.getElementById("v2-group-reply-bar");
  if (replyBar) replyBar.classList.add("hidden");
}

async function request1v1CallInvite(mode) {
  if (!socket || !socket.connected) {
    v2ShowToast("⚠️ Connecting to server... please wait 1 sec.");
    return;
  }

  // Pre-flight permission verification
  if (mode === "audio") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.warn("Mic permission denied for audio invite:", err);
      alert("🎙️ Microphone Access Required\n\nPlease allow microphone permissions in your browser to start a Voice Call.");
      return;
    }
  } else if (mode === "video") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.warn("Camera/Mic permission denied for video invite:", err);
      alert("📹 Camera & Microphone Access Required\n\nPlease allow camera and microphone permissions in your browser to start a Video Call.");
      return;
    }
  }

  currentChatMode = mode;
  socket.emit("post_call_invite", { mode, nickname: currentNickname });
  v2ShowToast(`🚀 Private ${mode.toUpperCase()} Invite sent to group!`);
}

async function acceptCallInvite(inviteId, mode) {
  if (!socket || !socket.connected) {
    v2ShowToast("⚠️ Connecting to server... please wait.");
    return;
  }

  // Pre-flight permission verification for joiner
  if (mode === "audio") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      alert("🎙️ Microphone Access Required\n\nPlease allow microphone permissions in your browser to join this Voice Call.");
      return;
    }
  } else if (mode === "video") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      alert("📹 Camera & Microphone Access Required\n\nPlease allow camera and microphone permissions in your browser to join this Video Call.");
      return;
    }
  }

  currentChatMode = mode;
  socket.emit("accept_call_invite", { inviteId });
}

async function requestInCallModeUpgrade(mode) {
  if (!currentMatchTargetId || !socket || !socket.connected) {
    v2ShowToast("⚠️ Not connected to a stranger.");
    return;
  }

  // Pre-flight permission verification
  if (mode === "audio") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      alert("🎙️ Microphone Access Required\n\nPlease allow microphone permissions in your browser to start a Voice Call.");
      return;
    }
  } else if (mode === "video") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      alert("📹 Camera & Microphone Access Required\n\nPlease allow camera and microphone permissions in your browser to start a Video Call.");
      return;
    }
  }

  socket.emit("signal", {
    targetId: currentMatchTargetId,
    signal: {
      type: "in_call_upgrade_invite",
      mode,
      senderName: currentNickname
    }
  });

  v2ShowToast(`🚀 Sent ${mode.toUpperCase()} Call invite to stranger!`);
  appendSystemCard("connect", `You invited stranger to switch to ${mode.toUpperCase()} Call. Waiting for response...`);
}

async function respondInCallModeUpgrade(mode, accepted, btnEl) {
  if (btnEl && btnEl.closest(".v2-chat-upgrade-prompt")) {
    const prompt = btnEl.closest(".v2-chat-upgrade-prompt");
    prompt.innerHTML = `<div class="v2-upgrade-status-text">${accepted ? `Accepted ${mode.toUpperCase()} Call invite! Connecting...` : "Declined call invite. Continuing in text chat."}</div>`;
  }

  if (!accepted) {
    if (socket && socket.connected && currentMatchTargetId) {
      socket.emit("signal", {
        targetId: currentMatchTargetId,
        signal: {
          type: "in_call_upgrade_response",
          accepted: false,
          mode
        }
      });
    }
    return;
  }

  // If accepted, check pre-flight permission
  if (mode === "audio") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      alert("🎙️ Microphone Access Required\n\nPlease allow microphone permissions in your browser to join this Voice Call.");
      return;
    }
  } else if (mode === "video") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      alert("📹 Camera & Microphone Access Required\n\nPlease allow camera and microphone permissions in your browser to join this Video Call.");
      return;
    }
  }

  if (socket && socket.connected && currentMatchTargetId) {
    socket.emit("signal", {
      targetId: currentMatchTargetId,
      signal: {
        type: "in_call_upgrade_response",
        accepted: true,
        mode
      }
    });
    executeInCallModeUpgrade(mode, false);
  }
}

async function executeInCallModeUpgrade(newMode, isInitiator) {
  if (!currentMatchTargetId || !socket || !socket.connected) return;

  currentChatMode = newMode;

  // 1. Initialize local media
  const hasPerm = await initLocalMedia(newMode);
  if (!hasPerm) {
    v2ShowToast(`⚠️ ${newMode === "video" ? "Camera & Microphone" : "Microphone"} access required. Please allow in browser.`);
    return;
  }

  // 2. Adjust UI stages
  if (el.chatDrawer) el.chatDrawer.classList.add("closed");
  const groupStage = document.getElementById("v2-group-chat-stage");
  if (groupStage) groupStage.classList.add("hidden");
  if (el.searchStage) el.searchStage.classList.add("hidden");

  if (newMode === "video") {
    if (el.localPip) el.localPip.classList.remove("hidden");
    if (el.audioVisualizer) el.audioVisualizer.classList.add("hidden");
    setVideoDisconnectedUI(false);
  } else if (newMode === "audio") {
    if (el.localPip) el.localPip.classList.add("hidden");
    if (el.audioVisualizer) el.audioVisualizer.classList.remove("hidden");
    setAudioDisconnectedUI(false);
  }

  updateToolbarForMode("active");

  // 3. Reset peer connection for media streaming
  if (currentPeerConnection) {
    try { currentPeerConnection.close(); } catch (e) {}
    currentPeerConnection = null;
  }

  await createWebRTCPeerConnection(currentMatchTargetId, isInitiator);
  v2ShowToast(`🚀 Switched to ${newMode.toUpperCase()} Call!`);
}


function v2ReturnToGroupChat(autoInvite = false) {
  isDisconnectedHandled = false;
  clearSearchTimeout();

  const oldTargetId = currentMatchTargetId;
  if (oldTargetId) {
    skippedPeersCooldownMapV2.delete(oldTargetId);
  }

  cleanupPeerConnection(false);
  clearChatHistory();

  currentMatchTargetId = null;
  window.currentMatchTargetId = null;
  inCall = false;

  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  window.isJoiningPrivateInvite = false;
  window.pendingV2InviteCode = null;
  try { sessionStorage.removeItem("hg_pending_invite"); } catch (e) {}
  if (el.searchStage) el.searchStage.classList.add("hidden");
  const groupStage = document.getElementById("v2-group-chat-stage");
  if (groupStage) groupStage.classList.remove("hidden");
  if (el.chatDrawer) el.chatDrawer.classList.add("closed");
  if (el.localPip) el.localPip.classList.add("hidden");
  if (el.audioVisualizer) el.audioVisualizer.classList.add("hidden");
  if (el.btnFlagReport) el.btnFlagReport.classList.add("hidden");

  const chatInputRow = document.getElementById("v2-chat-input-row");
  const discBar = document.getElementById("v2-chat-disconnected-bar");
  if (chatInputRow) chatInputRow.style.display = "";
  if (discBar) discBar.classList.add("hidden");

  const videoDisc = document.getElementById("v2-video-disc-overlay");
  if (videoDisc) videoDisc.classList.add("hidden");

  // Reset top bar peer status
  const peerDot = document.getElementById("v2-chat-peer-dot");
  const peerStatus = document.getElementById("v2-chat-peer-status-text");
  if (peerDot) peerDot.classList.remove("disc");
  if (peerStatus) peerStatus.textContent = "Private Chat";

  const prevMode = currentChatMode;
  currentChatMode = "text";
  updateStatus("idle", "In Group Chat");
  updateToolbarForMode("idle");

  if (socket && socket.connected) {
    // Explicitly unpair from 1v1 private call on server cleanly (no cooldown)
    socket.emit("leave_1v1_call");

    if (autoInvite && prevMode) {
      window.pendingAutoInviteMode = prevMode;
    } else {
      window.pendingAutoInviteMode = null;
    }
    activeGroupRoomNumber = null;
    activeGroupRoomId = null;

    // Fresh journey into group: rejoin Group #1 cleanly
    socket.emit("join_group_chat", { nickname: currentNickname, requestedRoomNumber: 1 });
  }
}

function triggerDirect1v1Share(mode = "video") {
  closeV2CallDrawer();
  openV2ShareModal("direct_1v1", mode);
}

function toggleV2CallDrawer() {
  const backdrop = document.getElementById("v2-call-drawer-backdrop");
  if (!backdrop) return;
  if (backdrop.classList.contains("hidden")) {
    backdrop.classList.remove("hidden");
    backdrop.classList.add("open");
  } else {
    closeV2CallDrawer();
  }
}

function closeV2CallDrawer(event) {
  if (event && event.target && event.target.id !== "v2-call-drawer-backdrop" && !event.target.classList.contains("v2-drawer-close-btn") && !event.target.closest(".v2-drawer-close-btn")) {
    return;
  }
  const backdrop = document.getElementById("v2-call-drawer-backdrop");
  if (backdrop) {
    backdrop.classList.remove("open");
    backdrop.classList.add("hidden");
  }
}

function selectDrawerCallMode(mode) {
  closeV2CallDrawer();
  request1v1CallInvite(mode);
}

// Window object bindings for all interactive handlers
window.promptEditNickname = promptEditNickname;
window.closeNicknameModal = closeNicknameModal;
window.saveNewNickname = saveNewNickname;
window.confirmAgeAndEnter = confirmAgeAndEnter;
window.request1v1CallInvite = request1v1CallInvite;
window.acceptCallInvite = acceptCallInvite;
window.sendGroupMessage = sendGroupMessage;
window.quickSendEmoji = quickSendEmoji;
window.quickSendReaction = quickSendReaction;
window.startReplyToMessage = startReplyToMessage;
window.cancelGroupReply = cancelGroupReply;
window.toggleGroupReactionPicker = toggleGroupReactionPicker;
window.dismissWelcomeKnowledgeCard = dismissWelcomeKnowledgeCard;
window.renderWelcomeKnowledgeCard = renderWelcomeKnowledgeCard;
window.renderViralCommunityCard = renderViralCommunityCard;
window.v2ReturnToGroupChat = v2ReturnToGroupChat;
window.toggleV2CallDrawer = toggleV2CallDrawer;
window.closeV2CallDrawer = closeV2CallDrawer;
window.selectDrawerCallMode = selectDrawerCallMode;
window.triggerDirectPlatformShare = triggerDirectPlatformShare;
window.triggerDirect1v1Share = triggerDirect1v1Share;
window.switchShare1v1Mode = switchShare1v1Mode;
window.handleStrangerDisconnected = handleStrangerDisconnected;
window.render1v1DiscoveryFeedCard = render1v1DiscoveryFeedCard;
window.requestInCallModeUpgrade = requestInCallModeUpgrade;
window.respondInCallModeUpgrade = respondInCallModeUpgrade;
window.executeInCallModeUpgrade = executeInCallModeUpgrade;
