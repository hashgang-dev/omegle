let peer;
let conn;
let myId;
let localStream;
let currentCall;

function randomId() {
  return Math.random().toString(36).substring(2, 8);
}

async function start() {
  const ROOM_ID = "telugu-chat-room";
  myId = ROOM_ID + "-" + Math.floor(Math.random() * 1000);

  peer = new Peer(myId);

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

  findRandomPeer();
}

function findRandomPeer() {
  const targetId = prompt("Enter peer ID to connect:");

  if (!targetId) return;

  const call = peer.call(targetId, localStream);

  call.on("stream", (remoteStream) => {
    document.getElementById("remote").srcObject = remoteStream;
    currentCall = call;
  });
}

function generateGuessIds() {
  let ids = [];
  for (let i = 0; i < 20; i++) {
    ids.push(randomId());
  }
  return ids;
}

function next() {
  if (currentCall) currentCall.close();
  location.reload();
}
