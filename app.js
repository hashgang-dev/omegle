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
let isStoppedByUser = true;
let isAudioMuted = false;
let isVideoOff = false;

// MediaPipe Selfie Segmentation Dynamic Loader
let selfieSegmentationInstance = null;

// DOM Elements Registry
let el = {};

function initDOMElements() {
  el = {
    statusPill: document.getElementById("v2-status-pill"),
    statusDot: document.getElementById("v2-status-dot"),
    statusText: document.getElementById("v2-status-text"),
    heroStage: document.getElementById("v2-hero-stage"),
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
    toastText: document.getElementById("v2-toast-text")
  };
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

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }
}

function startBrandTitleAnimation() {
  const titles = ["#GANG Chat", "HashGANG Chat"];
  let index = 0;
  const brandEl = document.getElementById("v2-brand-title-text");

  setInterval(() => {
    index = (index + 1) % titles.length;
    const currentName = titles[index];
    
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

function handleStrangerDisconnected() {
  if (isDisconnectedHandled) return;
  isDisconnectedHandled = true;

  console.log("❌ [v2 Engine] Stranger Disconnected.");
  dismissV2AudioSharedMedia();
  dismissV2VideoSharedMedia();
  cleanupPeerConnection();
  playAudioChime("disconnect");
  if (navigator.vibrate) {
    try { navigator.vibrate(200); } catch (e) {}
  }
  updateStatus("disconnected", "🔴 Stranger Disconnected");
  if (currentChatMode === "text") {
    appendSystemCard("disconnect", "🔴 Stranger has disconnected.", true);
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
        v2ShowToast("🎉 Thank you for installing HashGANG Chat!");
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
      updateStatus("idle", "Select Mode & Start");
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

      // Client-Side Cooling Period Guard: Prevent instant re-matching to skipped stranger within 60s
      if (cooldownUntil && now < cooldownUntil) {
        console.warn("⏳ [v2 Cooling Period] Recently skipped stranger matched (" + targetId + "). Auto-requesting next stranger...");
        if (socket && socket.connected) {
          socket.emit("skip_peer", { targetId });
          socket.emit("join_queue", { mode: currentChatMode });
        }
        return;
      }

      clearSearchTimeout();

      if (data.isInvite || data.isInviteMatch || data.inviteCode || window.pendingV2InviteCode) {
        isCurrentAdsterraImpressionV2 = false;
        console.log("🤝 [v2 Invite Link] Personal invite match confirmed: Bypassing ad dwell lock for instant 0-delay connection.");
      }

      const executeMatchTransition = async () => {
        isDisconnectedHandled = false;
        dismissV2AudioSharedMedia();
        dismissV2VideoSharedMedia();
        v2HideEngagedOverlay();
        currentMatchTargetId = targetId;
        window.currentMatchTargetId = currentMatchTargetId;
        window.socket = socket;
        updateStatus("connected", "🟢 Live Chat");
        trackV2Event("v2_matched", { mode: currentChatMode, targetId: targetId });
        if (el.searchStage) el.searchStage.classList.add("hidden");
        if (el.heroStage) el.heroStage.classList.add("hidden");
        if (el.btnFlagReport) el.btnFlagReport.classList.remove("hidden");
        const pwaBtn = document.getElementById("v2-btn-pwa-install");
        if (pwaBtn) pwaBtn.classList.add("hidden");

        // Clear previous stranger messages & display connection system badge
        clearChatHistory();
        appendSystemCard("connect", "🟢 Connected with stranger! Say Hi 👋");
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
        } else if (currentChatMode === "audio") {
          if (el.audioVisualizer) el.audioVisualizer.classList.remove("hidden");
          setAudioDisconnectedUI(false);
          v2ShowToast("🎙️ Connected to Voice Stranger!");
        } else if (currentChatMode === "video") {
          if (el.localPip) el.localPip.classList.remove("hidden");
          setVideoDisconnectedUI(false);
          v2ShowToast("🎥 Connected to Video Stranger!");
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
      const mode = (data && data.mode) ? data.mode : (currentChatMode || "text");
      console.log(`🔄 [v2 Invite Fallback] Inviter unavailable. Joining general stranger queue in [${mode}] mode.`);
      v2ShowToast("🤝 Inviter unavailable. Connecting you to an online stranger...");
      socket.emit("join_queue", { mode: mode });
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
  
  // Highlight active mode card
  document.querySelectorAll(".v2-mode-card").forEach(card => card.classList.remove("active"));
  const activeBtn = document.getElementById(`v2-btn-mode-${mode}`);
  if (activeBtn) activeBtn.classList.add("active");

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

function getV2AdsterraCount() {
  try {
    const raw = localStorage.getItem(ADSTERRA_TIMESTAMPS_KEY_V2);
    if (!raw) return 0;
    const arr = JSON.parse(raw);
    const now = Date.now();
    const valid = Array.isArray(arr) ? arr.filter((ts) => now - ts < 3600000) : [];
    return valid.length;
  } catch (e) {
    return 0;
  }
}

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
let searchTimeout25sTimer = null;
let searchingSecondsInterval = null;
let searchingElapsedSeconds = 0;
let v2TimeoutInviteCode = null;
let v2TimeoutInviteUrl = "";

function clearSearchTimeout() {
  if (searchTimeoutTimer) {
    clearTimeout(searchTimeoutTimer);
    searchTimeoutTimer = null;
  }
  if (searchTimeout25sTimer) {
    clearTimeout(searchTimeout25sTimer);
    searchTimeout25sTimer = null;
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

function v2KeepSearching() {
  v2HideEngagedOverlay();
  v2HandleStartOrNext();
}

/**
 * Handle Start / Next Stranger Chat
 */
async function v2HandleStartOrNext() {
  if (!el.heroStage) initDOMElements();
  isStoppedByUser = false;
  cleanupPeerConnection();
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
      if (el.heroStage) el.heroStage.classList.add("hidden");
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
  if (el.heroStage) el.heroStage.classList.add("hidden");
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

  // Set 25s timeout to auto-stop search and show 25s Timeout Modal
  searchTimeout25sTimer = setTimeout(() => {
    if (!isStoppedByUser && el.searchStage && !el.searchStage.classList.contains("hidden")) {
      v2Trigger25sSearchTimeout();
    }
  }, 25000);

  const queuePayload = {
    mode: currentChatMode
  };

  const emitJoinQueueWhenReady = (attemptsLeft = 30) => {
    if (socket && socket.connected) {
      if (window.pendingV2InviteCode) {
        console.log(`🤝 [v2 Personal Invite] Joining 1-on-1 invite room: ${window.pendingV2InviteCode}`);
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
 * Stop Call & Reset to Stage 1
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
  if (el.heroStage) el.heroStage.classList.remove("hidden");
  if (el.chatDrawer) el.chatDrawer.classList.add("closed");
  if (el.btnFlagReport) el.btnFlagReport.classList.add("hidden");
  const pwaBtn = document.getElementById("v2-btn-pwa-install");
  if (pwaBtn) pwaBtn.classList.remove("hidden");
  if (el.localPip) el.localPip.classList.add("hidden");
  if (el.audioVisualizer) el.audioVisualizer.classList.add("hidden");
  if (el.videoTraceWatermark) el.videoTraceWatermark.classList.add("hidden");
  if (el.audioTraceWatermark) el.audioTraceWatermark.classList.add("hidden");
  if (el.btnNextLabel) el.btnNextLabel.textContent = "Start Chat";
  updateStatus("idle", "Select Mode & Start");
  updateToolbarForMode("idle");
  if (socket && socket.connected) {
    socket.emit("leave_queue", { clientVersion: "v2" });
  }
}

/**
 * WebRTC PeerConnection Setup
 */
async function createWebRTCPeerConnection(targetId, isInitiator) {
  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
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

function cleanupPeerConnection() {
  dismissV2AudioSharedMedia();
  dismissV2VideoSharedMedia();
  if (currentMatchTargetId) {
    if (socket && socket.connected) {
      try {
        socket.emit("signal", {
          targetId: currentMatchTargetId,
          signal: { type: "peer_left" },
          clientVersion: "v2"
        });
      } catch (err) {
        console.warn("Error emitting peer_left signal:", err);
      }
    }
    recordSkippedPeerV2(currentMatchTargetId);
  }
  if (currentPeerConnection) {
    currentPeerConnection.close();
    currentPeerConnection = null;
  }
  currentMatchTargetId = null;
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
  const newHeight = Math.min(el.chatInput.scrollHeight, 140);
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
    if (el.heroStage) el.heroStage.classList.remove("hidden");
    if (el.searchStage) el.searchStage.classList.add("hidden");
    updateToolbarForMode("idle");
  }
}

/* UI Popover Toggles & Global Window Bindings */
function toggleV2Menu(e) {
  if (e) e.stopPropagation();
  if (el.popoverMenu) el.popoverMenu.classList.toggle("hidden");
}

function toggleV2SettingsPopover(e) {
  if (e) e.stopPropagation();
  if (el.settingsPopover) el.settingsPopover.classList.toggle("closed");
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

function openV2ShareModal(context = "invite") {
  currentV2InviteCode = generateV2InviteCode();
  const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
  const timestamp = Date.now();
  const mode = currentChatMode || "text";
  currentV2InviteUrl = `${baseUrl}?invite=${currentV2InviteCode}&mode=${mode}&t=${timestamp}`;
  v2TimeoutInviteUrl = currentV2InviteUrl;
  window.v2TimeoutInviteUrl = v2TimeoutInviteUrl;

  if (socket && socket.connected) {
    socket.emit("create_invite_room", { inviteCode: currentV2InviteCode, mode: mode, clientVersion: "v2" });
  }

  const isHeroVisible = el.heroStage && !el.heroStage.classList.contains("hidden");
  if (context === "timeout") {
    activeModalOrigin = "timeout";
  } else if (isHeroVisible) {
    activeModalOrigin = "hero";
  } else {
    activeModalOrigin = "search_early";
  }

  // Dynamic DOM Text Updates
  const badgeEl = document.getElementById("v2-timeout-badge-text");
  const headingEl = document.getElementById("v2-timeout-status-heading");
  const subtextEl = document.getElementById("v2-timeout-subtext-para");
  const retryBtnText = document.getElementById("v2-btn-timeout-retry-text");
  const retryBtnIcon = document.getElementById("v2-btn-timeout-retry-icon");

  if (activeModalOrigin === "timeout") {
    if (badgeEl) badgeEl.innerHTML = '<i class="fa-solid fa-hourglass-end text-amber-400"></i> Searched for 25s';
    if (headingEl) {
      headingEl.className = "v2-timeout-status-badge timeout-mode";
      headingEl.innerHTML = '<span class="v2-live-pulse">🔴</span> All Online Strangers are Busy in Active Chats!';
    }
    if (subtextEl) subtextEl.innerHTML = 'We searched for <strong>25 seconds</strong>! Right now, all live users are paired up in private 1-on-1 calls.';
    if (retryBtnText) retryBtnText.textContent = "Select Mode";
    if (retryBtnIcon) retryBtnIcon.className = "fa-solid fa-arrow-left";
  } else if (activeModalOrigin === "search_early") {
    if (badgeEl) badgeEl.innerHTML = '<i class="fa-solid fa-paper-plane text-purple-400"></i> Instant 1-on-1 Connect';
    if (headingEl) {
      headingEl.className = "v2-timeout-status-badge invite-mode";
      headingEl.innerHTML = '🚀 Invite Friends to HashGANG Chat!';
    }
    if (subtextEl) subtextEl.innerHTML = 'Share your personal room link below to jump directly into a private chat or match instantly with active online users!';
    if (retryBtnText) retryBtnText.textContent = "Back to Search";
    if (retryBtnIcon) retryBtnIcon.className = "fa-solid fa-magnifying-glass";
  } else {
    // Mode Selection Screen (Hero Stage)
    if (badgeEl) badgeEl.innerHTML = '<i class="fa-solid fa-paper-plane text-purple-400"></i> Instant 1-on-1 Connect';
    if (headingEl) {
      headingEl.className = "v2-timeout-status-badge invite-mode";
      headingEl.innerHTML = '🚀 Invite Friends to HashGANG Chat!';
    }
    if (subtextEl) subtextEl.innerHTML = 'Share your personal room link below to jump directly into a private chat or match instantly with active online users!';
    if (retryBtnText) retryBtnText.textContent = "Select Mode";
    if (retryBtnIcon) retryBtnIcon.className = "fa-solid fa-arrow-left";
  }

  const modal = document.getElementById("v2-share-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
  }
}

function handleDynamicModalAction() {
  const origin = activeModalOrigin;
  closeV2ShareModal();
  if (origin === "timeout") {
    v2StopCall();
  }
}

function closeV2ShareModal(e) {
  const modal = document.getElementById("v2-share-modal");
  if (e && e.target !== modal && !e.target.classList.contains("v2-close-btn")) return;
  
  const origin = activeModalOrigin;
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }

  if (origin === "timeout") {
    v2StopCall();
  }
}

function closeV2TimeoutModal(e) {
  closeV2ShareModal(e);
}

function copyV2Link() {
  copyV2TimeoutInviteLink();
}

function v2Trigger25sSearchTimeout() {
  clearSearchTimeout();
  
  if (socket && socket.connected) {
    socket.emit("leave_queue");
  }

  const radarSpinner = document.getElementById("v2-radar-spinner");
  if (radarSpinner) {
    radarSpinner.classList.remove("engaged");
  }

  updateStatus("idle", "Search Paused — All Strangers Busy");

  openV2ShareModal("timeout");
}

function triggerV2TimeoutNativeShare(platform) {
  const shareText = `🔥 Hey! Join me on HashGANG Chat (100% Real Humans, No Bots). Click to connect directly with me: ${v2TimeoutInviteUrl || window.location.href}`;
  
  if (platform === "telegram") {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(v2TimeoutInviteUrl || window.location.href)}&text=${encodeURIComponent("🔥 Hey! Join me on HashGANG Chat (100% Real Humans, No Bots). Click to connect directly with me:\n")}`;
    window.open(tgUrl, "_blank");
    v2ShowToast("Opening Telegram Share... ✈️");
    return;
  }

  // Default WhatsApp / Web Share
  if (navigator.share) {
    navigator.share({
      title: "HashGANG Chat",
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
  const shareText = `🔥 Hey! Join me on HashGANG Chat (100% Real Humans, No Bots). Click to connect directly with me: ${v2TimeoutInviteUrl || window.location.href}`;
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareText).then(() => {
      v2ShowToast("Invite Link Copied! Share in your groups 🚀");
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
      console.log("⏰ [v2 Url Invite] Invite link expired. Falling back to random stranger matchmaking.");
      return;
    }

    window.pendingV2InviteCode = inviteCode;
    console.log(`🔗 [v2 Url Invite] Found personal invite code: ${inviteCode} [Mode: ${currentChatMode}]`);
    
    // Display warm personal welcome badge on Hero Screen for invited friend
    const heroBrand = document.querySelector(".v2-hero-brand");
    if (heroBrand && !document.querySelector(".v2-personal-invite-pill")) {
      const invitePill = document.createElement("div");
      invitePill.className = "v2-personal-invite-pill";
      invitePill.innerHTML = `🤝 <strong>Your friend invited you to a 1-on-1 ${currentChatMode.toUpperCase()} chat!</strong> Click Start Chat to connect.`;
      heroBrand.prepend(invitePill);
    }
  }
}

function shareToSocial(platform) {
  const textInput = document.getElementById("v2-share-text-input");
  const messageText = textInput ? textInput.value : `🔥 Hey! Connect with me on HashGANG Chat!\n💬 Free HD Video, Audio & Text Chat (No Signup required).\nJoin directly: ${currentV2InviteUrl || "https://chat.hashgang.com"}`;
  const encodedText = encodeURIComponent(messageText);
  const rawUrl = currentV2InviteUrl || "https://chat.hashgang.com";
  const encodedUrl = encodeURIComponent(rawUrl);

  if (platform === "whatsapp") {
    window.open(`https://api.whatsapp.com/send?text=${encodedText}`);
  } else if (platform === "telegram") {
    window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent("🔥 Hey! Connect with me on HashGANG Chat!\n💬 Free HD Video, Audio & Text Chat (No Signup required).\nJoin directly:")}`);
  } else if (platform === "twitter") {
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}`);
  } else if (platform === "facebook") {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`);
  } else if (platform === "snapchat") {
    navigator.clipboard.writeText(messageText);
    v2ShowToast("Message & 1-on-1 link copied! Paste in Snapchat Story or DM 👻");
  } else if (platform === "instagram") {
    navigator.clipboard.writeText(messageText);
    v2ShowToast("Message & 1-on-1 link copied! Paste in Instagram DM, Bio or Story 📸");
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
    navigator.clipboard.writeText(`HashGANG Chat Session Trace Code: ${traceCode}`).catch(() => {});
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
