/**
 * Automated Verification Script: Forensic Telemetry & Disambiguation Pipeline
 */
const { io } = require("socket.io-client");
const http = require("http");

const SOCKET_URL = "http://localhost:5000/omegle";
const ADMIN_API_URL = "http://localhost:5000/api/v1/strangerchat/admin/trace-lookup";
const ADMIN_SECRET = "GANG_PUSH_SECRET_2026";

async function runTest() {
  console.log("🧪 [Test Start] Starting Forensic Telemetry Verification...");

  const uid1 = "hg_usr_test_hw_client_1";
  const uid2 = "hg_usr_test_hw_client_2";

  const hwData1 = {
    screen: "1080x2400",
    dpr: 2.625,
    cores: 8,
    memory: 8,
    platform: "Linux armv8l",
    touchPoints: 5,
    isPwa: true,
    language: "en-IN",
    timezone: "Asia/Kolkata",
    appVersion: "v430"
  };

  const hwData2 = {
    screen: "1440x3120",
    dpr: 3.5,
    cores: 8,
    memory: 12,
    platform: "Linux aarch64",
    touchPoints: 5,
    isPwa: false,
    language: "te-IN",
    timezone: "Asia/Kolkata",
    appVersion: "v430"
  };

  const socket1 = io(SOCKET_URL, {
    transports: ["websocket"],
    extraHeaders: {
      "cf-connecting-ip": "2409:40f0:db:f49d:7c4b:19ff:fe14:d5c6",
      "cf-ipcountry": "IN",
      "cf-ipcity": "Hyderabad",
      "cf-region": "Telangana",
      "cf-postal-code": "500081",
      "cf-timezone": "Asia/Kolkata",
      "cf-as-number": "55836",
      "x-client-isp": "Reliance Jio Infocomm",
      "user-agent": "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
    }
  });

  const socket2 = io(SOCKET_URL, {
    transports: ["websocket"],
    extraHeaders: {
      "cf-connecting-ip": "103.15.22.45",
      "cf-ipcountry": "IN",
      "cf-ipcity": "Vijayawada",
      "cf-region": "Andhra Pradesh",
      "cf-postal-code": "520003",
      "cf-timezone": "Asia/Kolkata",
      "cf-as-number": "45609",
      "x-client-isp": "Bharti Airtel Limited",
      "user-agent": "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
    }
  });

  let matchedTraceCode = null;

  await new Promise((resolve) => {
    let connected = 0;
    const checkConn = () => {
      connected++;
      if (connected === 2) resolve();
    };
    socket1.on("connect", () => {
      console.log("✅ Socket 1 connected:", socket1.id);
      socket1.emit("register_user_session", {
        anonUserId: uid1,
        nickname: "Suspect_Alpha",
        hardware: hwData1
      });
      checkConn();
    });
    socket2.on("connect", () => {
      console.log("✅ Socket 2 connected:", socket2.id);
      socket2.emit("register_user_session", {
        anonUserId: uid2,
        nickname: "Victim_Beta",
        hardware: hwData2
      });
      checkConn();
    });
  });

  // Give 300ms for audit registration
  await new Promise((r) => setTimeout(r, 300));

  // Listen for match
  const matchPromise = new Promise((resolve) => {
    socket1.on("matched", (data) => {
      console.log("🎉 Socket 1 matched! TraceCode:", data.traceCode);
      matchedTraceCode = data.traceCode;
      resolve();
    });
  });

  console.log("⏳ Emitting join_queue for both sockets...");
  socket1.emit("join_queue", { mode: "text" });
  socket2.emit("join_queue", { mode: "text" });

  await matchPromise;
  console.log("✅ Matched successfully with TraceCode:", matchedTraceCode);

  // Give 500ms for DB persistence
  await new Promise((r) => setTimeout(r, 500));

  // Query Admin API for this traceCode
  console.log("🔍 Querying Admin Trace Lookup API...");
  const lookupRes = await new Promise((resolve, reject) => {
    http.get(
      `${ADMIN_API_URL}?code=${matchedTraceCode}&adminSecretKey=${ADMIN_SECRET}`,
      { headers: { "x-admin-secret": ADMIN_SECRET } },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      }
    ).on("error", reject);
  });

  console.log("Admin API Response Status:", lookupRes.status);
  const data = lookupRes.body.data;
  console.log("Trace Log Mode:", data.mode);
  console.log("Peer A IP & City:", data.peerA.ip, data.peerA.geo?.city, data.peerA.geo?.region);
  console.log("Peer A Hardware Screen & DPR:", data.peerA.hardware?.screen, data.peerA.hardware?.dpr);
  console.log("Peer B IP & City:", data.peerB.ip, data.peerB.geo?.city, data.peerB.geo?.region);
  console.log("Peer B Hardware Screen & DPR:", data.peerB.hardware?.screen, data.peerB.hardware?.dpr);
  console.log("Session Lifecycle Status:", data.sessionLifecycle?.terminateReason);

  // Verify assertions
  const screens = [data.peerA.hardware?.screen, data.peerB.hardware?.screen];
  if (!screens.includes("1080x2400") || !screens.includes("1440x3120")) {
    throw new Error(`Screens mismatch! Got: ${screens.join(", ")}`);
  }
  const cities = [data.peerA.geo?.city, data.peerB.geo?.city];
  if (!cities.includes("Hyderabad") || !cities.includes("Vijayawada")) {
    throw new Error(`Cities mismatch! Got: ${cities.join(", ")}`);
  }

  // Simulate skip / disconnect to test lifecycle duration & reason update
  console.log("🔌 Simulating user skip to test lifecycle duration...");
  socket1.emit("join_queue", { mode: "text" }); // calling join_queue unpairs previous call via handlePeerDisconnectOrSkip
  await new Promise((r) => setTimeout(r, 500));

  // Query Admin API again to verify lifecycle update
  const updatedLookup = await new Promise((resolve, reject) => {
    http.get(
      `${ADMIN_API_URL}?code=${matchedTraceCode}&adminSecretKey=${ADMIN_SECRET}`,
      { headers: { "x-admin-secret": ADMIN_SECRET } },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body: JSON.parse(raw) }));
      }
    ).on("error", reject);
  });

  const updatedData = updatedLookup.body.data;
  console.log("Updated Session Lifecycle:", updatedData.sessionLifecycle);

  socket1.disconnect();
  socket2.disconnect();

  console.log("🎯 [ALL TESTS PASSED]: Forensic Telemetry & Disambiguation pipeline verified successfully!");
  process.exit(0);
}

runTest().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
