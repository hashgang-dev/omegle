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

// Matchmaking Pool Config (Zero-Cost Public Lobby Slots)
const LOBBY_PREFIX = "p2p-omegle-v1-slot-";
const TOTAL_SLOTS = 20;

// ICE Servers (Google & Cloudflare STUN)
const STUN_CONFIG = {
  config: {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun.cloudflare.com:3478" }
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
  statusText: document.getElementById("status-text")
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  updateStatus("idle", "Click 'Start Chat' to connect");
});

function setupEventListeners() {
  elements.btnNext.addEventListener("click", handleStartOrNext);
  elements.btnStop.addEventListener("click", stopCall);
  elements.btnMute.addEventListener("click", toggleAudio);
  elements.btnVideo.addEventListener("click", toggleVideo);
  
  elements.btnChatToggle.addEventListener("click", toggleChatDrawer);
  elements.btnCloseChat.addEventListener("click", () => elements.chatDrawer.classList.add("closed"));
  elements.btnSendChat.addEventListener("click", sendChatMessage);
  
  elements.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });
}

/**
 * Handle Start / Next Stranger Click
 */
async function handleStartOrNext() {
  hideFirewallWarning();
  cleanupCallState();

  // Ensure local media stream is captured
  if (!localStream) {
    const success = await initLocalMedia();
    if (!success) return;
  }

  elements.btnNextLabel.textContent = "Next Stranger";
  updateStatus("searching", "Searching for a Stranger...");
  showSearchingOverlay("Searching for a Stranger...", "Zero-cost end-to-end P2P connection is being established.");

  // Start automated zero-cost matchmaking
  findAndConnectPeer();
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
    return true;
  } catch (err) {
    console.error("Camera/Mic Permission Error:", err);
    alert("Camera and Microphone access are required for P2P video chat.");
    updateStatus("error", "Media permission denied");
    hideSearchingOverlay();
    return false;
  }
}

/**
 * Automated Matchmaking Lobby Protocol
 */
function findAndConnectPeer() {
  // Try to acquire an open host slot in the public lobby pool
  const randomSlotIndex = Math.floor(Math.random() * TOTAL_SLOTS) + 1;
  const targetHostId = LOBBY_PREFIX + randomSlotIndex;
  
  // Create client Peer instance
  const tempClientId = "client-" + Math.floor(Math.random() * 1000000);
  
  peer = new Peer(tempClientId, STUN_CONFIG);

  peer.on("open", (id) => {
    myPeerId = id;
    console.log("Registered Peer ID:", id);
    
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

  // If host doesn't respond within 2.5 seconds, become the waiting host
  setTimeout(() => {
    if (!connected && currentCall !== call) {
      call.close();
      becomeWaitingHost(hostId);
    }
  }, 2500);
}

/**
 * Register current peer as the waiting Host on a public slot
 */
function becomeWaitingHost(hostId) {
  if (peer && !peer.destroyed) peer.destroy();

  // Initialize peer with the host slot ID
  peer = new Peer(hostId, STUN_CONFIG);

  peer.on("open", (id) => {
    myPeerId = id;
    console.log("Waiting as Host on slot:", id);
    updateStatus("searching", "Waiting for a stranger to join...");
    showSearchingOverlay("Waiting for a Stranger...", "You are in the waiting queue. A peer will connect shortly.");
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
    // Retry with another random slot
    setTimeout(findAndConnectPeer, 500);
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
 * Monitor WebRTC ICE Connection State for Strict Firewall / NAT Failures
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
    } else if (state === "failed" || state === "disconnected") {
      console.warn("P2P Connection failed due to Strict Firewall / NAT.");
      showFirewallWarning();
      updateStatus("error", "Firewall Restricted");
      hideSearchingOverlay();
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
 * Disconnect and Stop Current Call
 */
function stopCall() {
  cleanupCallState();
  elements.btnNextLabel.textContent = "Start Chat";
  updateStatus("idle", "Disconnected. Click 'Start Chat'");
  hideSearchingOverlay();
  hideFirewallWarning();
}

/**
 * Clean Call State & Peer Objects (No Page Reload)
 */
function cleanupCallState() {
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
  elements.statusDot.className = `status-dot ${state}`;
  elements.statusText.textContent = text;
}

function showSearchingOverlay(title, sub) {
  elements.overlayTitle.textContent = title;
  elements.overlaySub.textContent = sub;
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
