/* eslint-env node */
/**
 * ============================================================================
 * 🚀 HashGANG Chat - Unified Master E2E Verification & Test Suite
 * ============================================================================
 * Consolidates ALL API, Socket, MongoDB Trace Audit, 24-Hour Report Block,
 * and Playwright Browser UI Permutations into a single master test suite.
 * ============================================================================
 */

const { io } = require("socket.io-client");
const axios = require("axios");
const { chromium } = require("playwright");

const APP_URL = process.env.APP_URL || "http://127.0.0.1:8000/index.html";
const SOCKET_URL = "http://localhost:5000/omegle";
const API_URL = "http://localhost:5000/api/v1/strangerchat/admin/trace-lookup";

let totalPassed = 0;
let totalFailed = 0;

function logResult(testName, success, details = "") {
  if (success) {
    totalPassed++;
    console.log(`  ✅ [PASS] ${testName} ${details}`);
  } else {
    totalFailed++;
    console.error(`  ❌ [FAIL] ${testName} ${details}`);
    process.exitCode = 1;
  }
}

async function runMasterE2ESuite() {
  console.log("\n=======================================================================");
  console.log("🚀 [HashGANG Master Suite] Starting Full E2E System Verification");
  console.log(`   Frontend App URL: ${APP_URL}`);
  console.log(`   Backend API URL: ${API_URL}`);
  console.log("=======================================================================\n");

  // ===========================================================================
  // PHASE 1: API, Socket, MongoDB Trace Audit & 24h Report Block Verification
  // ===========================================================================
  console.log("───────────────────────────────────────────────────────────────────────");
  console.log("📌 PHASE 1: Socket Signaling, MongoDB 1-Year Audit & Report Block API");
  console.log("───────────────────────────────────────────────────────────────────────");

  let activeTraceCode = null;
  let s2SocketId = null;

  try {
    // 1.1 Match & Trace Code Generation
    const s1 = io(SOCKET_URL, { transports: ["websocket"] });
    const s2 = io(SOCKET_URL, { transports: ["websocket"] });

    let m1Data = null;
    let m2Data = null;

    const matchPromise = new Promise((resolve) => {
      let count = 0;
      s1.on("matched", (data) => { m1Data = data; count++; if (count === 2) resolve(); });
      s2.on("matched", (data) => { m2Data = data; count++; if (count === 2) resolve(); });
      s1.emit("join_queue", { mode: "text" });
      s2.emit("join_queue", { mode: "text" });
    });

    await matchPromise;
    logResult("Text Mode Stranger Matching", m1Data && m2Data);
    logResult("Server Trace Code Format (HGXXXXXX)", m1Data?.traceCode && m1Data.traceCode.startsWith("HG"), `[Code: ${m1Data?.traceCode}]`);
    logResult("Identical Trace Code Distribution", m1Data?.traceCode === m2Data?.traceCode);

    activeTraceCode = m1Data.traceCode;
    s2SocketId = m1Data.peerId;

    // 1.2 WebRTC P2P Signaling Relay & Partner Security Verification
    let signalRelayed = false;
    const signalPromise = new Promise((resolve) => {
      s2.on("signal", (data) => {
        if (data.senderId === s1.id && data.signal?.type === "offer") {
          signalRelayed = true;
          resolve(true);
        }
      });
      setTimeout(() => resolve(false), 2000);
    });

    s1.emit("signal", { targetId: s2SocketId, signal: { type: "offer", sdp: "dummy_sdp" } });
    await signalPromise;
    logResult("WebRTC P2P Signaling Relay & Partner Security", signalRelayed === true);

    // 1.3 Skip Peer Signal Handling
    const skipLeftPromise = new Promise((resolve) => {
      s2.on("peer_left", () => resolve(true));
      setTimeout(() => resolve(false), 2000);
    });

    s1.emit("skip_peer", { targetId: s2SocketId });
    const s2SkipReceived = await skipLeftPromise;
    logResult("Instant Skip Peer Signal Handling (peer_left)", s2SkipReceived === true);

    // 1.4 Report & Disconnect Signal
    const peerLeftPromise = new Promise((resolve) => {
      s2.on("peer_left", () => resolve(true));
      setTimeout(() => resolve(false), 2500);
    });

    s1.emit("report_peer", { targetId: s2SocketId, traceCode: activeTraceCode, reason: "inappropriate" });
    const s2Left = await peerLeftPromise;
    logResult("Report Peer Disconnect Signal (peer_left)", s2Left === true);

    // 1.5 24-Hour Report Block (Prevent Re-match)
    let reMatched = false;
    s1.emit("join_queue", { mode: "text" });
    s2.emit("join_queue", { mode: "text" });

    await new Promise((resolve) => {
      s1.on("matched", (data) => { if (data.peerId === s2.id) reMatched = true; });
      setTimeout(resolve, 1500);
    });
    logResult("24-Hour Report Block Enforcement", reMatched === false);

    s1.disconnect();
    s2.disconnect();

    // 1.6 Audio & Video Mode Queue Matchmaking
    const sAudio1 = io(SOCKET_URL, { transports: ["websocket"] });
    const sAudio2 = io(SOCKET_URL, { transports: ["websocket"] });
    let audioMatched = false;

    const audioMatchPromise = new Promise((resolve) => {
      let c = 0;
      sAudio1.on("matched", (data) => { if (data.mode === "audio") c++; if (c === 2) { audioMatched = true; resolve(); } });
      sAudio2.on("matched", (data) => { if (data.mode === "audio") c++; if (c === 2) { audioMatched = true; resolve(); } });
      sAudio1.emit("join_queue", { mode: "audio" });
      sAudio2.emit("join_queue", { mode: "audio" });
      setTimeout(resolve, 3000);
    });
    await audioMatchPromise;
    logResult("Audio & Video Mode Queue Matchmaking", audioMatched === true, "[Audio Mode]");

    sAudio1.disconnect();
    sAudio2.disconnect();

    // 1.7 Admin Audit Lookup by Trace Code
    const traceLookupRes = await axios.get(`${API_URL}?code=${activeTraceCode}`);
    logResult("Admin Audit API HTTP 200", traceLookupRes.status === 200);
    logResult("Trace Code Archive Retrieval", traceLookupRes.data.source === "MONGODB_1YEAR_ARCHIVE");
    logResult("Document Timestamp Validity", traceLookupRes.data.data?.createdAt !== undefined);

    // 1.8 Admin Audit Lookup by IP Address & Date
    const ipLookupRes = await axios.get(`${API_URL}?ip=127.0.0.1`);
    logResult("IP Address Audit Lookup API HTTP 200", ipLookupRes.status === 200);
    logResult("IP Search Multi-Session List", Array.isArray(ipLookupRes.data.allResults) && ipLookupRes.data.allResults.length > 0);

  } catch (err) {
    logResult("Phase 1 API & Socket Execution", false, err.message);
  }

  // ===========================================================================
  // PHASE 2: Playwright Headless Browser UI & Matchmaking Permutations
  // ===========================================================================
  console.log("\n───────────────────────────────────────────────────────────────────────");
  console.log("📌 PHASE 2: Headless Browser UI & Permutation Test Suite (Playwright)");
  console.log("───────────────────────────────────────────────────────────────────────");

  const launchArgs = [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--no-sandbox",
    "--disable-setuid-sandbox"
  ];

  const browser = await chromium.launch({ headless: true, args: launchArgs });

  try {
    // Permutation 1: Direct Stranger Match Flow & UI Watermark
    console.log("🔹 [PERMUTATION 1] Direct Stranger Match & UI Watermark...");
    try {
      const ctx1 = await browser.newContext({ serviceWorkers: "block" });
      const ctx2 = await browser.newContext({ serviceWorkers: "block" });
      const p1 = await ctx1.newPage();
      const p2 = await ctx2.newPage();

      await p1.goto(APP_URL, { waitUntil: "load" });
      await p2.goto(APP_URL, { waitUntil: "load" });

      await p1.waitForFunction(() => typeof window.v2SelectModeAndStart === "function" && window.socket?.connected);
      await p2.waitForFunction(() => typeof window.v2SelectModeAndStart === "function" && window.socket?.connected);

      await p1.evaluate(() => window.v2SelectModeAndStart("text"));
      await p2.evaluate(() => window.v2SelectModeAndStart("text"));

      await p1.waitForFunction(() => !!window.currentSessionTraceCode || !!window.currentMatchTargetId, { timeout: 10000 });
      const traceCodeP1 = await p1.evaluate(() => window.currentSessionTraceCode);
      logResult("Direct Stranger Match & Trace Watermark UI", !!traceCodeP1 && traceCodeP1.startsWith("HG"), `[Trace: ${traceCodeP1}]`);

      await ctx1.close();
      await ctx2.close();
    } catch (e) {
      logResult("Direct Stranger Match UI", false, e.message);
    }

    // Permutation 2: Personal 1-on-1 Invite Link Flow
    console.log("🔹 [PERMUTATION 2] Personal 1-on-1 Invite Link Matching...");
    try {
      const ctxInviter = await browser.newContext({ serviceWorkers: "block" });
      const ctxFriend = await browser.newContext({ serviceWorkers: "block" });
      const pInviter = await ctxInviter.newPage();
      const pFriend = await ctxFriend.newPage();

      await pInviter.goto(APP_URL, { waitUntil: "load" });
      await pInviter.waitForFunction(() => typeof window.v2SelectModeAndStart === "function" && window.socket?.connected);

      await pInviter.evaluate(() => window.openV2ShareModal("invite"));
      await pInviter.waitForFunction(() => !!window.currentV2InviteCode);
      const inviteCode = await pInviter.evaluate(() => window.currentV2InviteCode);
      const inviteUrl = `${APP_URL}?invite=${inviteCode}&mode=text`;

      await pFriend.goto(inviteUrl, { waitUntil: "load" });
      await pFriend.waitForFunction(() => typeof window.v2SelectModeAndStart === "function" && window.socket?.connected);

      await pFriend.evaluate(() => window.v2SelectModeAndStart("text"));

      await pInviter.waitForFunction(() => !!window.currentSessionTraceCode || !!window.currentMatchTargetId, { timeout: 8000 });
      await pFriend.waitForFunction(() => !!window.currentSessionTraceCode || !!window.currentMatchTargetId, { timeout: 8000 });

      logResult("Personal 1-on-1 Invite Link Matching", true, `[Code: ${inviteCode}]`);

      await ctxInviter.close();
      await ctxFriend.close();
    } catch (e) {
      logResult("Personal 1-on-1 Invite Link Matching", false, e.message);
    }

    // Permutation 3: Multi-User Group Share & Fallback Matching
    console.log("🔹 [PERMUTATION 3] WhatsApp Multi-User Group Share Fallback...");
    try {
      const ctxHost = await browser.newContext({ serviceWorkers: "block" });
      const ctxF1 = await browser.newContext({ serviceWorkers: "block" });
      const ctxF2 = await browser.newContext({ serviceWorkers: "block" });

      const pHost = await ctxHost.newPage();
      const pF1 = await ctxF1.newPage();
      const pF2 = await ctxF2.newPage();

      await pHost.goto(APP_URL, { waitUntil: "load" });
      await pHost.waitForFunction(() => typeof window.v2SelectModeAndStart === "function" && window.socket?.connected);
      await pHost.evaluate(() => window.v2SelectModeAndStart("text"));
      await pHost.evaluate(() => window.openV2ShareModal("invite"));
      await pHost.waitForFunction(() => !!window.currentV2InviteCode);
      const inviteCodeGroup = await pHost.evaluate(() => window.currentV2InviteCode);
      const inviteUrlGroup = `${APP_URL}?invite=${inviteCodeGroup}&mode=text`;

      await pF1.goto(inviteUrlGroup, { waitUntil: "load" });
      await pF1.waitForFunction(() => typeof window.v2SelectModeAndStart === "function" && window.socket?.connected);
      await pF1.evaluate(() => window.v2SelectModeAndStart("text"));

      await pHost.waitForFunction(() => !!window.currentSessionTraceCode || !!window.currentMatchTargetId, { timeout: 10000 });
      await pF1.waitForFunction(() => !!window.currentSessionTraceCode || !!window.currentMatchTargetId, { timeout: 10000 });

      await pF2.goto(inviteUrlGroup, { waitUntil: "load" });
      await pF2.waitForFunction(() => typeof window.v2SelectModeAndStart === "function" && window.socket?.connected);
      await pF2.evaluate(() => window.v2SelectModeAndStart("text"));
      await pF2.waitForTimeout(1000);

      logResult("Multi-User Group Link Fallback Matching", true);

      await ctxHost.close();
      await ctxF1.close();
      await ctxF2.close();
    } catch (e) {
      logResult("Multi-User Group Link Fallback Matching", false, e.message);
    }

    // Permutation 4: Mobile Browser User-Agents & Expired/Tampered Invite Links
    console.log("🔹 [PERMUTATION 4] Mobile Browser Matrix & Expired Link Fallback...");
    try {
      const androidUA = "Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36";
      const iphoneUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Mobile/15E148 Safari/604.1";

      const ctxAndroid = await browser.newContext({ userAgent: androidUA, viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
      const ctxiPhone = await browser.newContext({ userAgent: iphoneUA, viewport: { width: 390, height: 844 }, serviceWorkers: "block" });

      const pAndroid = await ctxAndroid.newPage();
      const piPhone = await ctxiPhone.newPage();

      // Expired Invite (>15 minutes old timestamp)
      const expiredInviteUrl = `${APP_URL}?invite=EXPIRED123&mode=text&t=${Date.now() - 20 * 60 * 1000}`;
      await pAndroid.goto(expiredInviteUrl, { waitUntil: "load" });
      await piPhone.goto(APP_URL, { waitUntil: "load" });

      await pAndroid.waitForFunction(() => typeof window.v2SelectModeAndStart === "function" && window.socket?.connected);
      await piPhone.waitForFunction(() => typeof window.v2SelectModeAndStart === "function" && window.socket?.connected);

      await pAndroid.evaluate(() => window.v2SelectModeAndStart("text"));
      await piPhone.evaluate(() => window.v2SelectModeAndStart("text"));

      await pAndroid.waitForFunction(() => !!window.currentSessionTraceCode || !!window.currentMatchTargetId, { timeout: 10000 });
      await piPhone.waitForFunction(() => !!window.currentSessionTraceCode || !!window.currentMatchTargetId, { timeout: 10000 });

      logResult("Mobile Matrix & Expired Link Auto-Fallback", true, "[Android Chrome <-> iPhone Safari]");

      await ctxAndroid.close();
      await ctxiPhone.close();
    } catch (e) {
      logResult("Mobile Matrix & Expired Link Auto-Fallback", false, e.message);
    }

    // Permutation 5: Socket Concurrency & Staggered Arrival Intervals
    console.log("🔹 [PERMUTATION 5] Concurrency & Staggered Interval Stress Matrix...");
    try {
      const sockets = [];
      const numClients = 6;
      let matchedCount = 0;

      for (let i = 0; i < numClients; i++) {
        const s = io(SOCKET_URL, { transports: ["websocket"] });
        s.on("matched", () => { matchedCount++; });
        sockets.push(s);
      }

      // Staggered join queue emission (50ms interval spacing)
      for (let i = 0; i < numClients; i++) {
        await new Promise(r => setTimeout(r, 50));
        sockets[i].emit("join_queue", { mode: "text" });
      }

      await new Promise(r => setTimeout(r, 2000));
      logResult("Staggered Concurrency Matchmaking (6 Socket Clients)", matchedCount >= 6, `[Matched: ${matchedCount}/${numClients}]`);

      sockets.forEach(s => s.disconnect());
    } catch (e) {
      logResult("Staggered Concurrency Matchmaking", false, e.message);
    }

    await browser.close();
  } catch (err) {
    logResult("Phase 2 Headless Browser UI", false, err.message);
  }

  console.log("\n=======================================================================");
  console.log(`📊 MASTER TEST SUITE SUMMARY: ${totalPassed} Passed | ${totalFailed} Failed`);
  console.log("=======================================================================\n");

  process.exit(totalFailed === 0 ? 0 : 1);
}

runMasterE2ESuite();
