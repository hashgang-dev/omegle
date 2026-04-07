let peer;
let myId;
let localStream;
let currentCall;

async function start() {
  const ROOM_ID = "telugu-chat-room";
  myId = ROOM_ID + "-" + Math.floor(Math.random() * 1000);

  peer = new Peer(myId, {
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },

        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    },
  });

  peer.on("open", (id) => {
    console.log("My ID:", id);
    findRandomPeer();
  });

  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  document.getElementById("local").srcObject = localStream;

  peer.on("call", (call) => {
    call.answer(localStream);

    call.on("stream", (remoteStream) => {
      document.getElementById("remote").srcObject = remoteStream;
    });

    currentCall = call;
  });
}

function findRandomPeer() {
  const targetId = prompt("Enter peer ID:");

  if (!targetId) return;

  const call = peer.call(targetId, localStream);

  call.on("stream", (remoteStream) => {
    document.getElementById("remote").srcObject = remoteStream;
    currentCall = call;
  });
}

function next() {
  if (currentCall) currentCall.close();
  location.reload();
}
