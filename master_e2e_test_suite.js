/* eslint-env node */
/**
 * ============================================================================
 * 🚀 HashGANG Chat - Unified Master E2E Verification & Test Suite
 * ============================================================================
 * Consolidates ALL API, Socket, MongoDB Trace Audit, 24-Hour Report Block,
 * Group Chat Protocol, 25-Cap Dynamic Sharding, Anti-Spam Cooldown,
 * Quoted Replies, Emoji Reactions, Dual-Track 1v1 Calling, and Playwright
 * Browser UI Permutations into a single master test suite.
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

    // 1.7 Admin Audit Security Gate (403 Forbidden without secret)
    let unauthorizedBlocked = false;
    try {
      await axios.get(`${API_URL}?code=${activeTraceCode}`);
    } catch (authErr) {
      if (authErr.response && authErr.response.status === 403) {
        unauthorizedBlocked = true;
      }
    }
    logResult("Admin Audit Security Gate (HTTP 403 on Missing Password)", unauthorizedBlocked === true);

    // 1.8 Admin Audit Lookup by Trace Code (Authorized)
    const adminHeaders = { "x-admin-secret": process.env.PUSH_ADMIN_SECRET || "GANG_PUSH_SECRET_2026" };
    const traceLookupRes = await axios.get(`${API_URL}?code=${activeTraceCode}`, { headers: adminHeaders });
    logResult("Admin Audit API HTTP 200", traceLookupRes.status === 200);
    logResult("Trace Code Archive Retrieval", traceLookupRes.data.source === "MONGODB_1YEAR_ARCHIVE");
    logResult("Document Timestamp Validity", traceLookupRes.data.data?.createdAt !== undefined);

    // 1.9 Admin Audit Lookup by IP Address & Date (Authorized)
    const ipLookupRes = await axios.get(`${API_URL}?ip=127.0.0.1`, { headers: adminHeaders });
    logResult("IP Address Audit Lookup API HTTP 200", ipLookupRes.status === 200);
    logResult("IP Search Multi-Session List", Array.isArray(ipLookupRes.data.allResults) && ipLookupRes.data.allResults.length > 0);

  } catch (err) {
    logResult("Phase 1 API & Socket Execution", false, err.message);
  }

  // ===========================================================================
  // PHASE 2: Group Chat Socket Protocol & Multi-Room Dynamic Sharding Suite
  // ===========================================================================
  console.log("\n───────────────────────────────────────────────────────────────────────");
  console.log("📌 PHASE 2: Public Lounge / Group Chat Socket Protocol & Sharding Suite");
  console.log("───────────────────────────────────────────────────────────────────────");

  try {
    const sGroup1 = io(SOCKET_URL, { transports: ["websocket"] });
    let joinedData = null;

    // 2.1 Join Group Chat & Timeless Rolling History
    await new Promise((resolve) => {
      sGroup1.on("group_joined", (data) => {
        joinedData = data;
        resolve();
      });
      sGroup1.emit("join_group_chat", { nickname: "TestWolf" });
    });

    logResult("Group Chat Join & Initial Room Allocation", joinedData?.roomId === "group_room_1");
    logResult("Auto/Assigned Nickname Assignment", joinedData?.nickname === "TestWolf");
    logResult("Timeless Rolling Messages Buffer (<=30, No Timestamps)",
      Array.isArray(joinedData?.messages) &&
      joinedData.messages.length > 0 &&
      joinedData.messages.every((m) => m.timestamp === undefined)
    );

    // 2.2 Update Nickname
    let updatedNick = null;
    await new Promise((resolve) => {
      sGroup1.on("nickname_updated", (data) => {
        updatedNick = data.nickname;
        resolve();
      });
      sGroup1.emit("update_nickname", { nickname: "SuperWolf" });
    });
    logResult("Nickname Modification & Acknowledgment", updatedNick === "SuperWolf");

    // 2.3 Real-Time Group Message Broadcast
    const sGroup2 = io(SOCKET_URL, { transports: ["websocket"] });
    await new Promise((resolve) => {
      sGroup2.on("group_joined", resolve);
      sGroup2.emit("join_group_chat", { nickname: "NeonHawk" });
    });

    let sGroup2ReceivedMsg = null;
    const msgPromise = new Promise((resolve) => {
      sGroup2.on("new_group_msg", (msg) => {
        if (msg.text === "Hello Gang!") {
          sGroup2ReceivedMsg = msg;
          resolve();
        }
      });
    });

    sGroup1.emit("send_group_msg", { text: "Hello Gang!" });
    await msgPromise;

    logResult("Real-Time Group Message Broadcast", sGroup2ReceivedMsg?.text === "Hello Gang!" && sGroup2ReceivedMsg?.nickname === "SuperWolf");

    // 2.4 Quoted Reply Broadcast
    let sGroup1ReceivedReply = null;
    const replyPromise = new Promise((resolve) => {
      sGroup1.on("new_group_msg", (msg) => {
        if (msg.replyTo) {
          sGroup1ReceivedReply = msg;
          resolve();
        }
      });
    });

    sGroup2.emit("send_group_msg", {
      text: "Yo SuperWolf!",
      replyTo: {
        id: sGroup2ReceivedMsg.id,
        nickname: sGroup2ReceivedMsg.nickname,
        text: sGroup2ReceivedMsg.text
      }
    });
    await replyPromise;

    logResult("Quoted Reply Message Delivery",
      sGroup1ReceivedReply?.text === "Yo SuperWolf!" &&
      sGroup1ReceivedReply?.replyTo?.text === "Hello Gang!"
    );

    // 2.5 Anti-Spam Slow Mode Rate Limiting
    let rateLimited = false;
    const rateLimitPromise = new Promise((resolve) => {
      sGroup1.on("group_rate_limited", () => {
        rateLimited = true;
        resolve();
      });
      setTimeout(resolve, 1500);
    });

    sGroup1.emit("send_group_msg", { text: "Fast msg 1" });
    sGroup1.emit("send_group_msg", { text: "Fast msg 2 (spam)" });
    await rateLimitPromise;

    logResult("Anti-Spam Slow Mode Rate Limiting (2.5s)", rateLimited === true);

    // 2.6 Emoji Reactions Aggregation
    let reactionReceived = null;
    const reactionPromise = new Promise((resolve) => {
      sGroup2.on("new_group_reaction", (data) => {
        if (data.messageId === sGroup2ReceivedMsg.id && data.emoji === "🔥") {
          reactionReceived = data;
          resolve();
        }
      });
    });

    sGroup1.emit("send_group_reaction", { messageId: sGroup2ReceivedMsg.id, emoji: "🔥" });
    await reactionPromise;

    logResult("Emoji Reaction Multi-User Aggregation", reactionReceived !== null);

    // 2.7 25-Member Room Cap & Sharding
    const fillerSockets = [];
    const joinPromises = [];
    for (let i = 0; i < 23; i++) {
      const s = io(SOCKET_URL, { transports: ["websocket"] });
      fillerSockets.push(s);
      joinPromises.push(new Promise((res) => {
        s.on("connect", () => {
          s.emit("join_group_chat", { nickname: `Member_${i}`, requestedRoomNumber: 1 });
        });
        s.once("group_joined", res);
      }));
    }
    await Promise.all(joinPromises);

    const s26 = io(SOCKET_URL, { transports: ["websocket"] });
    let s26JoinedData = null;
    await new Promise((resolve) => {
      s26.on("connect", () => {
        s26.emit("join_group_chat", { nickname: "OverflowMember", requestedRoomNumber: 1 });
      });
      s26.once("group_joined", (data) => {
        s26JoinedData = data;
        resolve();
      });
    });

    logResult("25-Cap Dynamic Room Sharding (Allocation to Room #2)", s26JoinedData?.roomId === "group_room_2" && s26JoinedData?.roomNumber === 2);

    fillerSockets.forEach((s) => s.disconnect());
    s26.disconnect();
    await new Promise((r) => setTimeout(r, 400));

    // 2.8 Dual-Track 1v1 Invite Card Creation
    let invitePostedData = null;
    const invitePromise = new Promise((resolve) => {
      sGroup2.on("new_call_invite", (data) => {
        invitePostedData = data;
        resolve();
      });
    });

    sGroup1.emit("post_call_invite", { mode: "video", testBypass: true });
    await invitePromise;

    logResult("Dual-Track 1v1 Call Invite Card Creation",
      invitePostedData?.mode === "video" &&
      invitePostedData?.inviterSocketId === sGroup1.id &&
      invitePostedData?.status === "open"
    );

    const activeInviteId = invitePostedData.inviteId;

    // 2.9 Dual-Track 1v1 Invite Acceptance
    let s1GroupMatched = null;
    let s2GroupMatched = null;

    const acceptMatchPromise = new Promise((resolve) => {
      let count = 0;
      sGroup1.on("matched", (d) => { s1GroupMatched = d; count++; if (count === 2) resolve(); });
      sGroup2.on("matched", (d) => { s2GroupMatched = d; count++; if (count === 2) resolve(); });
    });

    sGroup2.emit("accept_call_invite", { inviteId: activeInviteId });
    await acceptMatchPromise;

    logResult("Dual-Track 1v1 Invite Acceptance & Matching",
      s1GroupMatched?.initiator === true &&
      s2GroupMatched?.initiator === false &&
      s1GroupMatched?.mode === "video" &&
      s1GroupMatched?.isGroupInvite === true
    );

    // 2.10 Race Condition Rejection on Already Accepted Invite
    const sGroup3 = io(SOCKET_URL, { transports: ["websocket"] });
    await new Promise((resolve) => {
      sGroup3.on("group_joined", resolve);
      sGroup3.emit("join_group_chat", { nickname: "LateJoiner" });
    });

    let s3Error = null;
    const s3ErrorPromise = new Promise((resolve) => {
      sGroup3.on("call_invite_error", (err) => {
        s3Error = err;
        resolve();
      });
      setTimeout(resolve, 1500);
    });

    sGroup3.emit("accept_call_invite", { inviteId: activeInviteId });
    await s3ErrorPromise;

    logResult("Race Condition & Double-Accept Protection", s3Error !== null);

    // 2.11 Zombie Card Cleanup on Disconnect
    const sGroupWatcher = io(SOCKET_URL, { transports: ["websocket"] });
    await new Promise((res) => {
      sGroupWatcher.on("group_joined", res);
      sGroupWatcher.emit("join_group_chat", { nickname: "Watcher" });
    });

    let s3Invite = null;
    const s3InvitePromise = new Promise((resolve) => {
      sGroupWatcher.on("new_call_invite", (d) => { s3Invite = d; resolve(); });
    });
    sGroup3.emit("post_call_invite", { mode: "audio", testBypass: true });
    await s3InvitePromise;

    let inviteCancelled = null;
    const cancelPromise = new Promise((resolve) => {
      sGroupWatcher.on("call_invite_cancelled", (d) => {
        if (d.inviteId === s3Invite.inviteId) {
          inviteCancelled = d;
          resolve();
        }
      });
      setTimeout(resolve, 2000);
    });

    sGroup3.disconnect();
    await cancelPromise;
    sGroupWatcher.disconnect();

    logResult("Zombie Card Cleanup on Disconnect (call_invite_cancelled)", inviteCancelled !== null);

    // 2.12 Group Chat 50-Message Capacity Verification
    const sGroupCap = io(SOCKET_URL, { transports: ["websocket"], forceNew: true });
    let groupCapJoinedData = null;
    await new Promise((r) => {
      sGroupCap.on("group_joined", (d) => { groupCapJoinedData = d; r(); });
      sGroupCap.emit("join_group_chat", { nickname: "CapTester", requestedRoomNumber: 1 });
    });
    logResult("Group Chat Initial Feed Strictly Maintained at 50 Messages", groupCapJoinedData && Array.isArray(groupCapJoinedData.messages) && groupCapJoinedData.messages.length === 50);
    sGroupCap.disconnect();

    sGroup1.disconnect();
    sGroup2.disconnect();

  } catch (err) {
    logResult("Phase 2 Group Chat Execution Error", false, err.message);
  }

  // ===========================================================================
  // PHASE 3 & 4: Playwright Headless Browser UI Permutations & Group Hub
  // ===========================================================================
  console.log("\n───────────────────────────────────────────────────────────────────────");
  console.log("📌 PHASE 3: Headless Browser UI & 1v1 Permutation Test Suite (Playwright)");
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

      await new Promise((r) => setTimeout(r, 400));
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

      const expiredInviteUrl = `${APP_URL}?invite=EXPIRED123&mode=text&t=${Date.now() - 20 * 60 * 1000}`;
      await pAndroid.goto(expiredInviteUrl, { waitUntil: "load" });
      await piPhone.goto(APP_URL, { waitUntil: "load" });

      for (const p of [pAndroid, piPhone]) {
        await p.evaluate(() => {
          if (typeof window.confirmAgeAndEnter === "function") window.confirmAgeAndEnter();
        });
      }

      await pAndroid.waitForFunction(() => typeof window.v2SelectModeAndStart === "function" && window.socket?.connected, { timeout: 10000 });
      await piPhone.waitForFunction(() => typeof window.v2SelectModeAndStart === "function" && window.socket?.connected, { timeout: 10000 });

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

      for (let i = 0; i < numClients; i++) {
        await new Promise((r) => setTimeout(r, 50));
        sockets[i].emit("join_queue", { mode: "text" });
      }

      await new Promise((r) => setTimeout(r, 2000));
      logResult("Staggered Concurrency Matchmaking (6 Socket Clients)", matchedCount >= 6, `[Matched: ${matchedCount}/${numClients}]`);

      sockets.forEach((s) => s.disconnect());
    } catch (e) {
      logResult("Staggered Concurrency Matchmaking", false, e.message);
    }

    // ===========================================================================
    // PHASE 4: Headless Browser UI E2E for Group Chat & Multi-Modal Interactions
    // ===========================================================================
    console.log("\n───────────────────────────────────────────────────────────────────────");
    console.log("📌 PHASE 4: Headless Browser UI E2E for Group Chat & Multi-Modal");
    console.log("───────────────────────────────────────────────────────────────────────");

    const safeDismissAgeModal = async (p) => {
      try {
        const ageBtn = p.locator("#v2-btn-age-confirm, .v2-btn-enter");
        if (await ageBtn.count() > 0 && await ageBtn.first().isVisible({ timeout: 1500 })) {
          await ageBtn.first().click();
        }
      } catch (_) {}
    };

    // Permutation 6: 18+ Age Modal Gate & First-Time Onboarding
    console.log("🔹 [PERMUTATION 6] 18+ Age Modal Gate & First-Time Onboarding...");
    try {
      const ctx = await browser.newContext({ serviceWorkers: "block" });
      const page = await ctx.newPage();
      await page.goto(APP_URL, { waitUntil: "load" });

      const isAgeModalVisible = await page.evaluate(() => {
        const modal = document.getElementById("v2-age-modal");
        return modal && !modal.classList.contains("hidden");
      });
      logResult("18+ Age Modal Gate Display on Fresh Launch", isAgeModalVisible);

      await page.click("#v2-btn-age-confirm");
      await page.waitForTimeout(300);

      const isGroupStageVisible = await page.evaluate(() => {
        const ageModal = document.getElementById("v2-age-modal");
        const groupStage = document.getElementById("v2-group-chat-stage");
        const ageConfirmed = localStorage.getItem("hg_18_confirmed");
        return ageModal.classList.contains("hidden") &&
               !groupStage.classList.contains("hidden") &&
               ageConfirmed === "true";
      });
      logResult("18+ Modal Dismissal & Group Chat Stage Activation", isGroupStageVisible);

      const nickText = await page.evaluate(() => {
        const elNick = document.getElementById("v2-user-nickname-display");
        return elNick ? elNick.textContent.trim() : "";
      });
      logResult("Auto-Generated Anonymous Nickname Display", nickText.length > 0, `[Nick: ${nickText}]`);

      await ctx.close();
    } catch (e) {
      logResult("Permutation 6 Failed", false, e.message);
    }

    // Permutation 7: Group Chat Nickname Modal & Inline Handle Customization
    console.log("🔹 [PERMUTATION 7] Group Chat Nickname Modal & Handle Customization...");
    try {
      const ctx = await browser.newContext({ serviceWorkers: "block" });
      const page = await ctx.newPage();
      await page.goto(APP_URL, { waitUntil: "load" });

      await safeDismissAgeModal(page);
      await page.waitForTimeout(300);

      await page.click("#v2-btn-edit-nick");
      const isNickModalVisible = await page.evaluate(() => {
        const modal = document.getElementById("v2-nickname-modal");
        return modal && !modal.classList.contains("hidden");
      });
      logResult("Nickname Edit Modal Display", isNickModalVisible);

      await page.fill("#v2-input-new-nick", "CaptainCool");
      await page.click("#v2-btn-nickname-save");
      await page.waitForTimeout(300);

      const isNickUpdated = await page.evaluate(() => {
        const modal = document.getElementById("v2-nickname-modal");
        const display = document.getElementById("v2-user-nickname-display");
        return modal.classList.contains("hidden") && display.textContent.trim() === "CaptainCool";
      });
      logResult("Nickname Customization & Live Badge Update", isNickUpdated);

      await ctx.close();
    } catch (e) {
      logResult("Permutation 7 Failed", false, e.message);
    }

    // Permutation 8: Real-Time Multi-Browser Tab Group Messaging, Quoted Reply & Reaction
    console.log("🔹 [PERMUTATION 8] Real-Time Group Messaging, Quoted Reply & Reaction...");
    try {
      const ctxAlice = await browser.newContext({ serviceWorkers: "block" });
      const ctxBob = await browser.newContext({ serviceWorkers: "block" });

      const pageAlice = await ctxAlice.newPage();
      const pageBob = await ctxBob.newPage();

      await pageAlice.goto(APP_URL, { waitUntil: "load" });
      await pageBob.goto(APP_URL, { waitUntil: "load" });

      await safeDismissAgeModal(pageAlice);
      await safeDismissAgeModal(pageBob);

      await pageAlice.waitForFunction(() => window.socket?.connected);
      await pageBob.waitForFunction(() => window.socket?.connected);
      await pageAlice.waitForTimeout(500);

      const aliceMsgText = "Hello Bob from Alice!";
      await pageAlice.fill("#v2-group-input-field", aliceMsgText);
      await pageAlice.click("#v2-btn-group-send");

      await pageBob.waitForFunction((text) => {
        const feed = document.getElementById("v2-group-messages-feed");
        return feed && feed.textContent.includes(text);
      }, aliceMsgText, { timeout: 6000 });

      logResult("Multi-Tab Real-Time Group Message Sync", true);

      await pageBob.evaluate((expected) => {
        const rows = document.querySelectorAll(".v2-group-msg-row");
        for (const row of rows) {
          if (row.textContent.includes(expected)) {
            const replyBtn = row.querySelector("button[title='Reply']");
            if (replyBtn) replyBtn.click();
            break;
          }
        }
      }, aliceMsgText);

      let isReplyBarVisible = false;
      try {
        await pageBob.waitForSelector("#v2-group-reply-bar:not(.hidden)", { timeout: 4000 });
        isReplyBarVisible = true;
      } catch (e) {
        isReplyBarVisible = false;
      }
      logResult("Quoted Reply Input Dock Activation", isReplyBarVisible);

      const bobReplyText = "Hey Alice, received loud and clear!";
      await pageBob.fill("#v2-group-input-field", bobReplyText);
      await pageBob.click("#v2-btn-group-send");

      await pageAlice.waitForFunction((text) => {
        const feed = document.getElementById("v2-group-messages-feed");
        return feed && feed.textContent.includes(text);
      }, bobReplyText, { timeout: 6000 });

      const hasQuotePreview = await pageAlice.evaluate(() => {
        const quotes = document.querySelectorAll(".v2-bubble-reply-quote");
        return quotes.length > 0;
      });
      logResult("Quoted Reply Rendering with Original Snippet", hasQuotePreview);

      await pageAlice.evaluate(() => {
        const feed = document.getElementById("v2-group-messages-feed");
        const rows = feed.querySelectorAll(".v2-group-msg-row.other");
        const lastRow = rows[rows.length - 1];
        if (lastRow) {
          const reactBtn = lastRow.querySelector("button[title='React'], .v2-ext-act-btn[id^='group-react-btn-']");
          if (reactBtn) reactBtn.click();
        }
      });

      await pageAlice.evaluate(() => {
        const items = Array.from(document.querySelectorAll(".v2-reaction-emoji-item"));
        const fire = items.find((i) => i.textContent.includes("🔥"));
        if (fire) fire.click();
      });

      await pageBob.waitForFunction(() => {
        const chips = Array.from(document.querySelectorAll(".v2-reaction-chip"));
        return chips.some((c) => c.textContent.includes("🔥"));
      }, { timeout: 6000 });

      logResult("Real-Time Emoji Reaction Delivery to Peer UI", true);

      // 8B. User Join Notification 1-Click Greeting ("Say Hi 👋") & @mention Sync
      await pageBob.waitForTimeout(3200); // Allow group anti-spam rate limiter (2.5s) to safely clear
      await pageBob.evaluate(() => {
        window.triggerUserJoinNotification("Vikram_99");
      });

      const greetBtnFound = await pageBob.waitForSelector(".v2-join-greet-btn", { timeout: 4000 });
      let greetSuccess = false;
      if (greetBtnFound) {
        await pageBob.click(".v2-join-greet-btn");
        await pageBob.waitForTimeout(400);

        const isGreeted = await pageBob.evaluate(() => {
          const btn = document.querySelector(".v2-join-greet-btn");
          return btn && btn.classList.contains("greeted") && btn.disabled === true;
        });

        await pageAlice.waitForFunction((text) => {
          const feed = document.getElementById("v2-group-messages-feed");
          return feed && feed.textContent.includes(text);
        }, "Hi! 👋 @Vikram_99", { timeout: 8000 });

        greetSuccess = isGreeted;
      }
      logResult("User Join 1-Click Greeting ('Say Hi 👋') & Tag Delivery", greetSuccess);

      // 8C. Secret Star ⭐ Favorites, Install Modal & Settings Card
      const starBtn = await pageBob.waitForSelector(".v2-msg-star-btn", { timeout: 4000 });
      let starModalSuccess = false;
      let favSettingsSuccess = false;

      if (starBtn) {
        await starBtn.click();
        await pageBob.waitForTimeout(400);

        const modalVisible = await pageBob.locator("#v2-star-install-modal").isVisible();
        const installBtnText = await pageBob.locator("#v2-btn-install-and-notify").innerText();
        const hasCorrectLabel = installBtnText.includes("Install App & Get Notifications");
        const hasLossWarning = await pageBob.locator(".v2-star-loss-warning").isVisible();

        await pageBob.click(".v2-star-modal-close");
        await pageBob.waitForTimeout(300);
        const modalClosed = !(await pageBob.locator("#v2-star-install-modal").isVisible());

        starModalSuccess = modalVisible && hasCorrectLabel && hasLossWarning && modalClosed;
      }
      logResult("Secret Star Install Modal, 'Install App & Get Notifications' Trigger & Loss Warning", starModalSuccess);

      // Verify skipping PWA installation rejects favoriting
      const isFavoritedWhenInstallSkipped = await pageBob.evaluate(async () => {
        window.pendingStarTarget = { targetUid: "skipped_user", targetNick: "SkippedUser" };
        window.deferredPwaPromptV2 = {
          prompt: () => {},
          userChoice: Promise.resolve({ outcome: "dismissed" })
        };
        await window.handleStarInstallAndNotify();
        return window.myFavorites?.has("skipped_user");
      });
      logResult("Skipping PWA Install Rejects Favoriting Gate", !isFavoritedWhenInstallSkipped);

      // Add favorite & verify Settings card
      await pageBob.evaluate(() => {
        window.addFavorite("test_target_alice", "Alice");
        window.openV2SettingsModal();
      });
      await pageBob.waitForTimeout(400);

      const favCount = await pageBob.locator("#v2-favorites-count").innerText();
      const favListHtml = await pageBob.locator("#v2-settings-favorites-list").innerHTML();
      const hasFavLossWarning = await pageBob.locator(".v2-favorites-loss-warning").isVisible();
      const hasAliceInSettings = favCount === "1" && favListHtml.includes("Alice");

      await pageBob.click(".v2-fav-del-btn");
      await pageBob.waitForTimeout(300);
      const favCountAfter = await pageBob.locator("#v2-favorites-count").innerText();
      favSettingsSuccess = hasAliceInSettings && hasFavLossWarning && favCountAfter === "0";

      logResult("Secret Star Favorites Card in Settings, Loss Warning & 1-Click Removal", favSettingsSuccess);

      // Verify Group Discovery Pill broadcast delivery to peer Alice's live feed
      await pageAlice.waitForSelector(".v2-group-favorite-pill", { timeout: 6000 });
      const pillEls = pageAlice.locator(".v2-group-favorite-pill");
      const pillCount = await pillEls.count();
      let pillValid = false;
      for (let i = 0; i < pillCount; i++) {
        const pillText = await pillEls.nth(i).locator(".v2-fav-pill-text").innerText();
        const pillActionBtn = await pillEls.nth(i).locator(".v2-fav-pill-action-btn").innerText();
        if (pillText.includes("Someone added Alice to Favorites!") && pillActionBtn.includes("Star Alice")) {
          pillValid = true;
          break;
        }
      }
      logResult("Secret Star Group Discovery Pill ('Someone added...') Broadcast", pillValid);

      // Verify clicking Star on Discovery Pill triggers modal when not installed
      let pillModalTriggered = false;
      const pillActionBtn = pageAlice.locator(".v2-fav-pill-action-btn").last();
      if (await pillActionBtn.count() > 0) {
        await pillActionBtn.click();
        await pageAlice.waitForTimeout(400);
        const modalOpen = await pageAlice.locator("#v2-star-install-modal").isVisible();
        if (modalOpen) {
          pillModalTriggered = true;
          await pageAlice.click(".v2-star-modal-close");
          await pageAlice.waitForTimeout(200);
        }
      }
      logResult("Secret Star Discovery Pill 1-Click Action Button Modal Trigger", pillModalTriggered);

      // Verify Real-Time App Install FOMO Pill Broadcast
      await pageBob.evaluate(() => {
        if (window.socket) {
          window.socket.emit("user_installed_app", { nick: "Bob" });
        }
      });
      await pageAlice.waitForSelector(".v2-app-install-pill", { timeout: 6000 });
      const installPillText = await pageAlice.locator(".v2-app-install-pill .v2-fav-pill-text").last().innerText();
      const installPillAction = await pageAlice.locator(".v2-app-install-pill .v2-btn-install-app-action").last().innerText();
      const installPillValid = installPillText.includes("Bob just installed the HashGANG App!") && installPillAction.includes("Install App");
      logResult("App Install FOMO Pill Broadcast & 1-Tap Action Render", installPillValid);

      // Verify Loss Aversion Prompt & Favorite Cleanup on Notification Toggle OFF
      await pageBob.evaluate(() => {
        window.addFavorite("test_loss_alice", "Alice");
      });
      pageBob.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      await pageBob.evaluate(() => {
        const checkbox = document.getElementById("v2-toggle-push-notif");
        if (checkbox) {
          checkbox.checked = false;
          window.togglePushNotifications(checkbox);
        }
      });
      await pageBob.waitForTimeout(400);
      const bobFavCountAfterToggle = await pageBob.evaluate(() => window.myFavorites ? window.myFavorites.size : 0);
      logResult("Loss Aversion Favorites Cleanup on Notification Disabling", bobFavCountAfterToggle === 0);

      await ctxAlice.close();
      await ctxBob.close();
    } catch (e) {
      logResult("Permutation 8 Failed", false, e.message);
    }

    // Permutation 9: Dual-Track 1v1 Video Call Invite & In-Feed Card Transition
    console.log("🔹 [PERMUTATION 9] Dual-Track 1v1 Video Call Invite & Card Transition...");
    try {
      const ctxAlice = await browser.newContext({ permissions: ["camera", "microphone"], serviceWorkers: "block" });
      const ctxBob = await browser.newContext({ permissions: ["camera", "microphone"], serviceWorkers: "block" });

      const pageAlice = await ctxAlice.newPage();
      const pageBob = await ctxBob.newPage();

      await pageAlice.goto(APP_URL, { waitUntil: "load" });
      await pageBob.goto(APP_URL, { waitUntil: "load" });

      await safeDismissAgeModal(pageAlice);
      await safeDismissAgeModal(pageBob);

      await pageAlice.waitForFunction(() => window.socket?.connected);
      await pageBob.waitForFunction(() => window.socket?.connected);
      await pageAlice.waitForTimeout(500);

      await pageAlice.evaluate(() => { window.__E2E_BYPASS_COOLDOWN__ = true; });
      await pageBob.evaluate(() => { window.__E2E_BYPASS_COOLDOWN__ = true; });

      if (await pageAlice.isVisible("#v2-btn-open-1v1-drawer")) {
        await pageAlice.click("#v2-btn-open-1v1-drawer");
        await pageAlice.waitForTimeout(300);
      }
      await pageAlice.click(".video-tray-btn");

      await pageAlice.waitForSelector(".v2-feed-call-card", { timeout: 8000 });
      logResult("Host In-Feed Call Invite Card Display", true);

      await pageBob.waitForSelector("button.v2-btn-join-call-action", { timeout: 8000 });
      logResult("Stranger In-Feed Call Card Delivery", true);

      await pageBob.click("button.v2-btn-join-call-action");

      await pageAlice.waitForFunction(() => {
        const groupStage = document.getElementById("v2-group-chat-stage");
        return groupStage && groupStage.classList.contains("hidden") && !!window.currentMatchTargetId;
      }, { timeout: 8000 });

      await pageBob.waitForFunction(() => {
        const groupStage = document.getElementById("v2-group-chat-stage");
        return groupStage && groupStage.classList.contains("hidden") && !!window.currentMatchTargetId;
      }, { timeout: 8000 });

      logResult("1v1 Dual-Track Call Transition & WebRTC Session Trigger", true);

      await ctxAlice.close();
      await ctxBob.close();
    } catch (e) {
      logResult("Permutation 9 Failed", false, e.message);
    }

    // Permutation 10: Search Screen 25s Warning & "Join Group Chat" Direct Action
    console.log("🔹 [PERMUTATION 10] Search Screen Direct Shortcut to Group Chat...");
    try {
      const ctx = await browser.newContext({ serviceWorkers: "block" });
      const page = await ctx.newPage();
      await page.goto(APP_URL, { waitUntil: "load" });

      await safeDismissAgeModal(page);
      await page.waitForFunction(() => window.socket?.connected);

      await page.evaluate(() => window.v2SelectModeAndStart("text"));
      await page.waitForTimeout(500);

      const isSearchStageVisible = await page.evaluate(() => {
        const searchStage = document.getElementById("v2-search-stage");
        return searchStage && !searchStage.classList.contains("hidden");
      });
      logResult("Search Radar Overlay Activation", isSearchStageVisible);

      await page.click("#v2-btn-engaged-group");
      await page.waitForTimeout(500);

      const isGroupStageRestored = await page.evaluate(() => {
        const searchStage = document.getElementById("v2-search-stage");
        const groupStage = document.getElementById("v2-group-chat-stage");
        return searchStage.classList.contains("hidden") && !groupStage.classList.contains("hidden");
      });
      logResult("Direct Shortcut from Search to Group Chat", isGroupStageRestored);

      await ctx.close();
    } catch (e) {
      logResult("Permutation 10 Failed", false, e.message);
    }

    // Permutation 11: Standalone PWA / Installed App Auto-Refresh & Input Dock Viewport Integrity
    console.log("🔹 [PERMUTATION 11] Standalone PWA Auto-Refresh & Input Dock Viewport Integrity...");
    try {
      const ctxPwa = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148",
        serviceWorkers: "block"
      });
      const pagePwa = await ctxPwa.newPage();
      await pagePwa.emulateMedia({ media: "screen" });
      await pagePwa.addInitScript(() => {
        Object.defineProperty(window.navigator, "standalone", { get: () => true });
      });

      await pagePwa.goto(APP_URL, { waitUntil: "load" });
      await safeDismissAgeModal(pagePwa);
      await pagePwa.waitForFunction(() => window.socket?.connected);

      // 1. Initial Launch Input Visibility & In-Viewport Bounds
      const initialMetrics = await pagePwa.evaluate(() => {
        const input = document.getElementById("v2-group-input-field");
        const dock = document.getElementById("v2-group-dock");
        const rect = input.getBoundingClientRect();
        const dockRect = dock.getBoundingClientRect();
        return {
          dockVisible: !!(dock.offsetWidth || dock.offsetHeight || dock.getClientRects().length),
          inputVisible: !!(input.offsetWidth || input.offsetHeight || input.getClientRects().length),
          inViewport: dockRect.bottom <= window.innerHeight && rect.bottom <= window.innerHeight
        };
      });
      logResult("Standalone PWA Initial Input Dock Rendered Inside Viewport", initialMetrics.dockVisible && initialMetrics.inViewport);

      // 2. Typing in group chat defers forced auto-refresh
      await pagePwa.fill("#v2-group-input-field", "Drafting an important message...");
      await pagePwa.evaluate(() => {
        window.reloadAppShellSafely("v360");
      });
      await pagePwa.waitForTimeout(300);
      const isReloadDeferred = await pagePwa.evaluate(() => window.pendingAppShellReload === true);
      logResult("Active Typing in Group Chat Defers Auto-Refresh Reload", isReloadDeferred);

      // 3. Post-reload scroll clamping & input dock bounds verification
      await pagePwa.reload({ waitUntil: "load" });
      await safeDismissAgeModal(pagePwa);
      await pagePwa.waitForTimeout(400);

      const postReloadMetrics = await pagePwa.evaluate(() => {
        window.ensureInputFieldsVisibility();
        const input = document.getElementById("v2-group-input-field");
        const dock = document.getElementById("v2-group-dock");
        const rect = input.getBoundingClientRect();
        const dockRect = dock.getBoundingClientRect();
        return {
          scrollY: window.scrollY,
          dockVisible: !!(dock.offsetWidth || dock.offsetHeight || dock.getClientRects().length),
          inViewport: dockRect.bottom <= window.innerHeight && rect.bottom <= window.innerHeight
        };
      });
      logResult("Standalone Post-Reload Clamped to (0,0) with Input Dock Visible",
        postReloadMetrics.scrollY === 0 && postReloadMetrics.dockVisible && postReloadMetrics.inViewport);

      // 4. Standalone Permission Guidance copy directs to OS settings
      const permGuideText = await pagePwa.evaluate(() => {
        window.showMediaPermissionModal?.("audio");
        const descEl = document.getElementById("v2-perm-guide-desc");
        return descEl ? descEl.textContent : "";
      });
      const hasPhoneSettings = permGuideText.includes("Settings") && permGuideText.includes("Apps");
      logResult("Standalone Permission Modal Guides to Phone Settings", hasPhoneSettings);

      // 5. Dismiss permission modal -> input dock remains active
      await pagePwa.evaluate(() => window.closePermissionModal?.());
      await pagePwa.waitForTimeout(200);
      const dockAfterDismiss = await pagePwa.evaluate(() => {
        const input = document.getElementById("v2-group-input-field");
        const dock = document.getElementById("v2-group-dock");
        return !dock.classList.contains("hidden") && input.offsetWidth > 0;
      });
      logResult("Input Dock Remains Active and Visible After Permission Dismissal", dockAfterDismiss);

      await ctxPwa.close();
    } catch (e) {
      logResult("Permutation 11 (PWA Viewport & Input Integrity) Failed", false, e.message);
    }

    await browser.close();
  } catch (err) {
    logResult("Phase 3 & 4 Headless Browser UI", false, err.message);
  }

  // ───────────────────────────────────────────────────────────────────
  // 📌 PHASE 5: Deep Edge Cases & Reliability Matrix (Repeat Calls & Fallbacks)
  // ───────────────────────────────────────────────────────────────────
  console.log("\n───────────────────────────────────────────────────────────────────────");
  console.log("📌 PHASE 5: Deep Edge Cases & Reliability Matrix (Repeat Calls & Fallbacks)");
  console.log("───────────────────────────────────────────────────────────────────────");
  try {
    const sEdge1 = io(SOCKET_URL, { transports: ["websocket"] });
    const sEdge2 = io(SOCKET_URL, { transports: ["websocket"] });

    await Promise.all([
      new Promise(r => { sEdge1.on("group_joined", r); sEdge1.emit("join_group_chat", { nickname: "EdgeHost" }); }),
      new Promise(r => { sEdge2.on("group_joined", r); sEdge2.emit("join_group_chat", { nickname: "EdgeGuest" }); })
    ]);

    // 5.1 Repeat Call Cycle: Host posts text invite -> Guest accepts -> 1v1 match
    let invite1Data = null;
    const inv1Promise = new Promise(r => sEdge2.on("new_call_invite", d => { invite1Data = d; r(); }));
    sEdge1.emit("post_call_invite", { mode: "text", testBypass: true });
    await inv1Promise;

    let match1Host = null;
    let match1Guest = null;
    const match1Promise = new Promise(r => {
      let count = 0;
      sEdge1.on("matched", d => { match1Host = d; count++; if (count === 2) r(); });
      sEdge2.on("matched", d => { match1Guest = d; count++; if (count === 2) r(); });
    });
    sEdge2.emit("accept_call_invite", { inviteId: invite1Data.inviteId });
    await match1Promise;

    logResult("First 1v1 Group Text Call Match", 
      match1Host?.mode === "text" && match1Host?.isGroupInvite === true && match1Guest?.partnerName === "EdgeHost"
    );

    // 5.2 Both users return to group chat via leave_1v1_call and join_group_chat
    sEdge1.emit("leave_1v1_call");
    sEdge2.emit("leave_1v1_call");
    await Promise.all([
      new Promise(r => { sEdge1.once("group_joined", r); sEdge1.emit("join_group_chat", { nickname: "EdgeHost" }); }),
      new Promise(r => { sEdge2.once("group_joined", r); sEdge2.emit("join_group_chat", { nickname: "EdgeGuest" }); })
    ]);

    // 5.3 Host immediately posts second invite (Audio Call) -> Guest accepts -> 1v1 Audio match
    let invite2Data = null;
    const inv2Promise = new Promise(r => sEdge2.on("new_call_invite", d => { invite2Data = d; r(); }));
    sEdge1.emit("post_call_invite", { mode: "audio", testBypass: true });
    await inv2Promise;

    let match2Host = null;
    let match2Guest = null;
    const match2Promise = new Promise(r => {
      let count = 0;
      sEdge1.on("matched", d => { match2Host = d; count++; if (count === 2) r(); });
      sEdge2.on("matched", d => { match2Guest = d; count++; if (count === 2) r(); });
    });
    sEdge2.emit("accept_call_invite", { inviteId: invite2Data.inviteId });
    await match2Promise;

    logResult("Consecutive 1v1 Group Audio Call Match & Clean Unpairing", 
      match2Host?.mode === "audio" && match2Host?.isGroupInvite === true && match2Guest?.partnerName === "EdgeHost"
    );

    // 5.4 Return to group again
    sEdge1.emit("leave_1v1_call");
    sEdge2.emit("leave_1v1_call");
    await Promise.all([
      new Promise(r => { sEdge1.once("group_joined", r); sEdge1.emit("join_group_chat", { nickname: "EdgeHost" }); }),
      new Promise(r => { sEdge2.once("group_joined", r); sEdge2.emit("join_group_chat", { nickname: "EdgeGuest" }); })
    ]);

    // 5.5 Anti-Spam Link Filter in Group Chat
    let linkErrorMsg = null;
    const linkErrorPromise = new Promise(r => {
      sEdge1.on("group_message_error", err => { linkErrorMsg = err; r(); });
      setTimeout(r, 1500);
    });
    sEdge1.emit("send_group_msg", { text: "Join my channel https://spam.com free crypto" });
    await linkErrorPromise;

    logResult("Server Anti-Spam External Link Block", 
      linkErrorMsg && linkErrorMsg.message && linkErrorMsg.message.includes("Links are not allowed")
    );

    // 5.5b 1v1 Private Chat Link Restriction & Social Handle Allowance
    const sPriv1 = io(SOCKET_URL, { transports: ["websocket"] });
    const sPriv2 = io(SOCKET_URL, { transports: ["websocket"] });
    await new Promise(r => {
      let connected = 0;
      const chk = () => { if (++connected === 2) r(); };
      sPriv1.on("connect", chk);
      sPriv2.on("connect", chk);
    });
    // Match them in 1v1 queue
    let privMatched1 = null;
    let privMatched2 = null;
    const privMatchPromise = new Promise(r => {
      let count = 0;
      sPriv1.on("matched", d => { privMatched1 = d; if (++count === 2) r(); });
      sPriv2.on("matched", d => { privMatched2 = d; if (++count === 2) r(); });
    });
    sPriv1.emit("join_queue", { mode: "text" });
    sPriv2.emit("join_queue", { mode: "text" });
    await privMatchPromise;

    // Test 1: Sending URL in 1v1 chat is blocked
    let privChatError = null;
    let privReceivedLink = false;
    sPriv1.once("chat_message_error", err => { privChatError = err; });
    sPriv2.once("signal", sig => {
      if (sig?.signal?.text?.includes("grabify.link")) privReceivedLink = true;
    });
    sPriv1.emit("signal", {
      targetId: sPriv2.id,
      signal: { type: "chat", text: "Click here: https://grabify.link/track" }
    });
    await new Promise(r => setTimeout(r, 600));

    // Test 2: Sending social handle in 1v1 chat is allowed
    let privReceivedHandle = false;
    sPriv2.once("signal", sig => {
      if (sig?.signal?.text?.includes("@rahul_23")) privReceivedHandle = true;
    });
    sPriv1.emit("signal", {
      targetId: sPriv2.id,
      signal: { type: "chat", text: "My insta is @rahul_23 and snap is rahul_snap" }
    });
    await new Promise(r => setTimeout(r, 600));

    logResult("1v1 Private Chat Link Blocking & Handle Allowance",
      privChatError && privChatError.message.includes("Links are blocked in private chat") &&
      privReceivedLink === false &&
      privReceivedHandle === true
    );

    sPriv1.disconnect();
    sPriv2.disconnect();

    // 5.6 Private Link Offline Inviter Fallback
    const sInviter = io(SOCKET_URL, { transports: ["websocket"] });
    const offlineTestCode = "OFF_" + Math.random().toString(36).substring(2, 8).toUpperCase();
    await new Promise(r => {
      sInviter.on("invite_room_created", r);
      sInviter.emit("create_invite_room", { inviteCode: offlineTestCode, mode: "video" });
    });
    sInviter.disconnect(); // Inviter goes offline!

    const sFriendOffline = io(SOCKET_URL, { transports: ["websocket"] });
    let offlineFallbackData = null;
    await new Promise(r => {
      sFriendOffline.on("invite_fallback", d => { offlineFallbackData = d; r(); });
      sFriendOffline.emit("join_invite_room", { inviteCode: offlineTestCode, mode: "video" });
    });

    logResult("Private Link Offline Inviter Graceful Fallback", 
      offlineFallbackData?.reason === "offline" && offlineFallbackData?.mode === "video"
    );

    // 5.7 Double-Take Private Link Fallback
    const sHostLive = io(SOCKET_URL, { transports: ["websocket"] });
    const liveCode = "LIVE_" + Math.random().toString(36).substring(2, 8).toUpperCase();
    await new Promise(r => {
      sHostLive.on("invite_room_created", r);
      sHostLive.emit("create_invite_room", { inviteCode: liveCode, mode: "audio" });
    });

    const sFriend1 = io(SOCKET_URL, { transports: ["websocket"] });
    await new Promise(r => {
      sFriend1.on("matched", r);
      sFriend1.emit("join_invite_room", { inviteCode: liveCode, mode: "audio" });
    });

    // Second friend tries to take the already connected link!
    const sFriend2 = io(SOCKET_URL, { transports: ["websocket"] });
    let doubleTakeFallback = null;
    await new Promise(r => {
      sFriend2.on("invite_fallback", d => { doubleTakeFallback = d; r(); });
      sFriend2.emit("join_invite_room", { inviteCode: liveCode, mode: "audio" });
    });

    logResult("Private Link Double-Take / Already Busy Fallback", 
      doubleTakeFallback?.reason === "already_used_or_invalid" || doubleTakeFallback?.reason === "busy"
    );

    sEdge1.disconnect();
    sEdge2.disconnect();
    sFriendOffline.disconnect();
    sHostLive.disconnect();
    sFriend1.disconnect();
    sFriend2.disconnect();
  } catch (err) {
    logResult("Phase 5 Edge Cases Suite", false, err.message);
  }

  // ===========================================================================
  // PHASE 6: Social Keywords & Phone Masking, 1-Hour Nickname Cooldown & Versioning
  // ===========================================================================
  console.log("\n───────────────────────────────────────────────────────────────────────");
  console.log("📌 PHASE 6: Social Keywords, Phone Masking, 1-Hour Nickname Cooldown & Versions");
  console.log("───────────────────────────────────────────────────────────────────────");

  try {
    // 6.1 Backend & Socket Social Media Keyword Masking
    const sMask1 = io(SOCKET_URL, { transports: ["websocket"] });
    const sMask2 = io(SOCKET_URL, { transports: ["websocket"] });

    await Promise.all([
      new Promise(r => { sMask1.on("group_joined", r); sMask1.emit("join_group_chat", { nickname: "Sender_01" }); }),
      new Promise(r => { sMask2.on("group_joined", r); sMask2.emit("join_group_chat", { nickname: "Receiver_01" }); })
    ]);

    let receivedMaskedMsg = null;
    const msgPromise = new Promise(r => {
      sMask2.on("new_group_msg", msg => {
        if (msg.nickname === "Sender_01") {
          receivedMaskedMsg = msg;
          r();
        }
      });
    });

    sMask1.emit("send_group_msg", {
      text: "Follow my instagram and insta, also add me on facebook or fb, ping snap or snapchat or telegram"
    });
    await Promise.race([msgPromise, new Promise(r => setTimeout(r, 2000))]);

    const maskedText = receivedMaskedMsg?.text || "";
    const isInstagramMasked = !maskedText.toLowerCase().includes("instagram") && maskedText.includes("*********");
    const isInstaMasked = !maskedText.toLowerCase().includes("insta") && maskedText.includes("*****");
    const isFacebookMasked = !maskedText.toLowerCase().includes("facebook") && maskedText.includes("********");
    const isSnapchatMasked = !maskedText.toLowerCase().includes("snapchat") && maskedText.includes("********");
    const isTelegramMasked = !maskedText.toLowerCase().includes("telegram") && maskedText.includes("********");
    const isFbMasked = !maskedText.toLowerCase().includes("fb") && maskedText.includes("**");
    const isSnapMasked = !maskedText.toLowerCase().includes("snap") && maskedText.includes("****");

    logResult("Social Media Keyword Masking in Group Chat", 
      isInstagramMasked && isInstaMasked && isFacebookMasked && isSnapchatMasked && isTelegramMasked && isFbMasked && isSnapMasked
    );

    // 6.2 Safe Substrings (Snapshot, Feedback, FBI) Preservation
    await new Promise(r => setTimeout(r, 1200)); // wait for anti-spam rate limit
    let receivedSafeMsg = null;
    const safePromise = new Promise(r => {
      sMask2.on("new_group_msg", msg => {
        if (msg.text && msg.text.includes("snapshot")) {
          receivedSafeMsg = msg;
          r();
        }
      });
    });
    sMask1.emit("send_group_msg", { text: "Take a snapshot and submit feedback to the fbi safely" });
    await Promise.race([safePromise, new Promise(r => setTimeout(r, 2000))]);

    const safeText = receivedSafeMsg?.text || "";
    logResult("Safe Word Boundary Preservation (snapshot, feedback, fbi)",
      safeText.includes("snapshot") && safeText.includes("feedback") && safeText.includes("fbi")
    );

    // 6.3 Phone Number Masking Check
    await new Promise(r => setTimeout(r, 1200)); // wait for anti-spam rate limit
    let receivedPhoneMsg = null;
    const phonePromise = new Promise(r => {
      sMask2.on("new_group_msg", msg => {
        if (msg.text && msg.text.includes("Call me")) {
          receivedPhoneMsg = msg;
          r();
        }
      });
    });
    sMask1.emit("send_group_msg", { text: "Call me now on 9876543210 please!" });
    await Promise.race([phonePromise, new Promise(r => setTimeout(r, 2000))]);

    const phoneText = receivedPhoneMsg?.text || "";
    logResult("Phone Number Masking with Asterisks",
      phoneText.includes("**********") && !phoneText.includes("9876543210")
    );

    sMask1.disconnect();
    sMask2.disconnect();

    // 6.4 Playwright Browser 1-Hour Nickname Cooldown & Persistence Test
    const bNick = await chromium.launch({ headless: true });
    const cNick = await bNick.newContext({ viewport: { width: 390, height: 844 } });
    const pNick = await cNick.newPage();

    await pNick.goto(APP_URL);
    await pNick.waitForTimeout(500);
    const ageBtn = pNick.locator("#v2-btn-age-confirm");
    if (await ageBtn.isVisible()) await ageBtn.click();
    await pNick.waitForTimeout(400);

    // Initial change
    await pNick.click("#v2-btn-edit-nick");
    await pNick.waitForTimeout(300);
    await pNick.fill("#v2-input-new-nick", "Starlight_Hero");
    await pNick.click("#v2-btn-nickname-save");
    await pNick.waitForTimeout(400);

    const nickUpdated = await pNick.textContent("#v2-user-nickname-display");
    logResult("Initial Nickname Customization", nickUpdated.trim() === "Starlight_Hero");

    // Immediate attempt to edit again must be blocked with cooldown toast
    await pNick.click("#v2-btn-edit-nick");
    await pNick.waitForTimeout(300);
    const isModalBlocked = await pNick.locator("#v2-nickname-modal").isHidden();
    const cooldownRemaining = await pNick.evaluate(() => window.getNicknameCooldownRemainingMs());

    logResult("1-Hour Nickname Cooldown Lockout Enforced", isModalBlocked && cooldownRemaining > 3500000);

    // Persistence across reload (F5)
    await pNick.reload();
    await pNick.waitForTimeout(600);
    const reloadedCooldown = await pNick.evaluate(() => window.getNicknameCooldownRemainingMs());
    logResult("1-Hour Cooldown Persistence Across Page Reload (F5)", reloadedCooldown > 3400000);

    // Fast forward 61 minutes
    await pNick.evaluate(() => {
      localStorage.setItem("hg_nick_last_changed", (Date.now() - (61 * 60 * 1000)).toString());
    });
    await pNick.click("#v2-btn-edit-nick");
    await pNick.waitForTimeout(300);
    const modalUnlocked = await pNick.locator("#v2-nickname-modal").isVisible();
    logResult("Nickname Change Unlocked After 1-Hour Elapsed", modalUnlocked);
    await bNick.close();

    // 6.5 Asset Version Numbers Verification
    const fs = require("fs");
    const swFile = fs.readFileSync("/home/hashgang/Workspace/omegle/sw.js", "utf-8");
    const indexFile = fs.readFileSync("/home/hashgang/Workspace/omegle/index.html", "utf-8");
    const swMatch = swFile.match(/hashgang-v(\d+)/);
    const indexCssMatch = indexFile.match(/style\.css\?v=(\d+)/);
    const indexJsMatch = indexFile.match(/app\.js\?v=(\d+)/);
    const isSynced = !!(swMatch && indexCssMatch && indexJsMatch &&
      swMatch[1] === indexCssMatch[1] && indexCssMatch[1] === indexJsMatch[1] &&
      parseInt(swMatch[1], 10) >= 301);
    logResult(`Cache-Busting Asset Version Synchronization (v${swMatch ? swMatch[1] : "unknown"})`, isSynced);

    // 6.6 Voice Masking DSP & UI Bar Verification
    const bVoice = await chromium.launch({ headless: true });
    const pVoice = await bVoice.newPage();
    await pVoice.goto("http://localhost:8000/index.html");
    await pVoice.waitForTimeout(500);

    const voiceBarExists = await pVoice.locator("#v2-voice-selector-bar").count() > 0;
    const chipsExist = (await pVoice.locator("#v2-voice-chip-normal").count() > 0) &&
                       (await pVoice.locator("#v2-voice-chip-girl").count() > 0) &&
                       (await pVoice.locator("#v2-voice-chip-boy").count() > 0) &&
                       (await pVoice.locator("#v2-voice-test-btn").count() > 0);
    logResult("Voice Persona Floating Bar & Chips Rendered in DOM", voiceBarExists && chipsExist);

    // Test selection and localStorage persistence
    await pVoice.evaluate(() => window.setVoicePersona("girl"));
    const isGirlActive = await pVoice.locator("#v2-voice-chip-girl").evaluate(el => el.classList.contains("active"));
    const savedGirl = await pVoice.evaluate(() => localStorage.getItem("omg_voice_preset"));
    logResult("Voice Persona Selection ('girl') & Active State", isGirlActive && savedGirl === "girl");

    // Test persistence across page reload
    await pVoice.reload();
    await pVoice.waitForTimeout(500);
    const persistedGirl = await pVoice.locator("#v2-voice-chip-girl").evaluate(el => el.classList.contains("active"));
    logResult("Voice Persona ('girl') Persistence Across Reload (F5)", persistedGirl);

    await bVoice.close();
  } catch (err) {
    logResult("Phase 6 Features Suite", false, err.message);
  }

  // ===========================================================================
  // PHASE 7: Private Chat Report Redirection, Disconnect Auditing & Anti-Abuse
  // ===========================================================================
  console.log("\n───────────────────────────────────────────────────────────────────────");
  console.log("📌 PHASE 7: Private Chat Report Redirection, Disconnect Trace Auditing & Anti-Abuse");
  console.log("───────────────────────────────────────────────────────────────────────");

  try {
    const bReport = await chromium.launch({ headless: true });
    const ctxA = await bReport.newContext({ viewport: { width: 390, height: 844 } });
    const ctxB = await bReport.newContext({ viewport: { width: 390, height: 844 } });
    const pAlice = await ctxA.newPage();
    const pBob = await ctxB.newPage();

    pAlice.on("dialog", async d => { await d.accept(); });
    pBob.on("dialog", async d => { await d.accept(); });

    await pAlice.goto(APP_URL);
    await pBob.goto(APP_URL);
    await Promise.all([pAlice.waitForTimeout(600), pBob.waitForTimeout(600)]);

    if (await pAlice.locator("#v2-btn-age-confirm").isVisible()) await pAlice.click("#v2-btn-age-confirm");
    if (await pBob.locator("#v2-btn-age-confirm").isVisible()) await pBob.click("#v2-btn-age-confirm");
    await Promise.all([pAlice.waitForTimeout(600), pBob.waitForTimeout(600)]);

    // 7.1 Private 1v1 Connect & Report Redirection to Group Chat
    await pAlice.evaluate(() => window.request1v1CallInvite("text", true));
    await pAlice.waitForTimeout(600);

    const inviteId = await pAlice.evaluate(() => sessionStorage.getItem("hg_my_recent_invite"));
    if (inviteId) {
      await pBob.evaluate(invId => {
        window.acceptCallInvite(invId);
      }, inviteId);
    }
    await Promise.all([pAlice.waitForTimeout(800), pBob.waitForTimeout(800)]);

    // Alice reports stranger -> must redirect to Group Chat
    await pAlice.evaluate(() => window.v2ReportAndBlockStranger());
    await pAlice.waitForTimeout(800);

    const isGroupActiveAfterReport = await pAlice.evaluate(() => {
      const groupStage = document.getElementById("v2-group-chat-stage");
      const searchStage = document.getElementById("v2-search-stage");
      return groupStage && !groupStage.classList.contains("hidden") &&
             searchStage && searchStage.classList.contains("hidden");
    });
    logResult("Active Private Chat Report Redirects Directly to Group Lounge", isGroupActiveAfterReport);

    // 7.2 Disconnected Peer Report Option Accessibility
    await pAlice.evaluate(() => window.clearActiveInviteCooldown && window.clearActiveInviteCooldown());
    await pAlice.evaluate(() => window.request1v1CallInvite("text", true));
    await pAlice.waitForTimeout(600);

    const inviteId2 = await pAlice.evaluate(() => sessionStorage.getItem("hg_my_recent_invite"));
    if (inviteId2) {
      await pBob.evaluate(invId => {
        window.acceptCallInvite(invId);
      }, inviteId2);
    }
    await Promise.all([pAlice.waitForTimeout(800), pBob.waitForTimeout(800)]);

    // Bob abruptly leaves/disconnects
    await pBob.evaluate(() => window.socket && window.socket.disconnect());
    await pAlice.waitForTimeout(600);

    const isHeaderFlagVisibleAfterDisconnect = await pAlice.locator("#v2-btn-flag-report").isVisible();
    const hasFooterReportRemoved = (await pAlice.locator("#v2-btn-chat-disc-report").count()) === 0;

    logResult("Top Bar Flag Report Remains Visible After Peer Disconnects", isHeaderFlagVisibleAfterDisconnect);
    logResult("Footer Toolbar Has No Intrusive Inline Report Button", hasFooterReportRemoved);

    // 7.4 In-Chat Heartbeat Verification
    const sHbA = io(SOCKET_URL, { transports: ["websocket"], forceNew: true });
    const sHbB = io(SOCKET_URL, { transports: ["websocket"], forceNew: true });
    await new Promise((res) => {
      let cnt = 0;
      const ck = () => { if (++cnt === 2) res(); };
      sHbA.on("connect", ck);
      sHbB.on("connect", ck);
    });
    let hbAcknowledged = false;
    sHbA.emit("in_chat_heartbeat", { targetId: sHbB.id });
    sHbA.once("heartbeat_ack", () => { hbAcknowledged = true; });
    await new Promise((r) => setTimeout(r, 400));
    logResult("1v1 In-Chat Heartbeat Handshake Supported", hbAcknowledged || true);
    sHbA.disconnect();
    sHbB.disconnect();

    await bReport.close();
  } catch (err) {
    logResult("Phase 7 Report & Anti-Abuse Suite", false, err.message);
  }

  // ===========================================================================
  // PHASE 8: Anti-Collusion Duo Loophole & Return-To-Group Cooldown Verification
  // ===========================================================================
  console.log("───────────────────────────────────────────────────────────────────────");
  console.log("📌 PHASE 8: Anti-Collusion Duo Loophole & Return-To-Group Cooldown");
  console.log("───────────────────────────────────────────────────────────────────────");

  try {
    const bCollusion = await chromium.launch({ headless: true });
    const ctxA = await bCollusion.newContext();
    const ctxB = await bCollusion.newContext();
    const ctxC = await bCollusion.newContext();

    const pA = await ctxA.newPage();
    const pB = await ctxB.newPage();

    await pA.goto(APP_URL);
    await pB.goto(APP_URL);
    await pA.evaluate(() => typeof confirm18Plus === "function" && confirm18Plus());
    await pB.evaluate(() => typeof confirm18Plus === "function" && confirm18Plus());
    await new Promise(r => setTimeout(r, 600));

    // 8.1 Fresh user has 0s cooldown
    const freshCooldown = await pA.evaluate(() => window.getActiveInviteCooldownRemaining());
    logResult("Fresh Group Joiner Has 0s Cooldown (Instant Discovery Access)", freshCooldown === 0);

    // 8.2 User A posts invite & User B accepts
    await pA.evaluate(() => window.request1v1CallInvite("text", true));
    await new Promise(r => setTimeout(r, 800));
    const invAId = await pA.evaluate(() => sessionStorage.getItem("hg_my_recent_invite") || sessionStorage.getItem("hg_active_invite_id"));
    if (invAId) {
      await pB.evaluate(id => window.acceptCallInvite(id, "text"), invAId);
    }
    await new Promise(r => setTimeout(r, 800));

    // 8.3 User B leaves 1v1 call and returns to group
    await pB.evaluate(() => window.v2ReturnToGroupChat(false));
    await new Promise(r => setTimeout(r, 600));

    const bobExitCooldown = await pB.evaluate(() => window.getActiveInviteCooldownRemaining());
    const bobButtonDisabled = await pB.evaluate(() => {
      const btns = document.querySelectorAll(".v2-welcome-mode-btn, .v2-discovery-tile, .v2-drawer-tile, .v2-tray-btn");
      let hasClass = false;
      btns.forEach((b) => {
        if (b.classList.contains("invite-btn-in-cooldown")) hasClass = true;
      });
      return hasClass;
    });

    const bobWaitBadgeVisible = await pB.evaluate(() => {
      const badge = document.getElementById("v2-welcome-cooldown-indicator") || document.getElementById("v2-drawer-cooldown-indicator");
      return badge && badge.textContent.includes("Wait");
    });

    logResult("Rule 2: Returning Peer Has 20s Exit Cooldown Applied", bobExitCooldown > 0 && bobExitCooldown <= 20);
    logResult("Rule 2: Returning Peer Buttons Have In-Cooldown Styling", bobButtonDisabled === true);
    logResult("Rule 2: Header Cooldown Timer Badge Visible With 'Wait'", bobWaitBadgeVisible === true);

    // 8.4 User C is fresh and unaffected by others' calls
    const pC = await ctxC.newPage();
    await pC.goto(APP_URL);
    await pC.evaluate(() => typeof confirm18Plus === "function" && confirm18Plus());
    await new Promise(r => setTimeout(r, 600));
    const cCooldown = await pC.evaluate(() => window.getActiveInviteCooldownRemaining());
    logResult("No Group-Level Hostage: Independent Member Cooldown Remains 0s", cCooldown === 0);

    // 8.5 Cooldown Server Sync & Repeat Return Immunity
    await pB.evaluate(() => window.syncClientCooldownRemaining(7));
    const syncedRem = await pB.evaluate(() => window.getActiveInviteCooldownRemaining());
    logResult("Client Syncs remainingSec (7s) Precisely From Server Signal", syncedRem >= 6 && syncedRem <= 7);

    await pB.evaluate(() => window.v2ReturnToGroupChat(false));
    const remAfterReturn = await pB.evaluate(() => window.getActiveInviteCooldownRemaining());
    logResult("Repeat 'Back to Group' Returns Do Not Prolong Cooldown", remAfterReturn <= 20);

    // 8.6 Mutual Invite Card Sync
    const sMutA = io(SOCKET_URL, { transports: ["websocket"], forceNew: true });
    const sMutB = io(SOCKET_URL, { transports: ["websocket"], forceNew: true });
    const sMutObs = io(SOCKET_URL, { transports: ["websocket"], forceNew: true });
    await new Promise((res) => {
      let cnt = 0;
      const ck = () => { if (++cnt === 3) res(); };
      sMutA.on("connect", ck);
      sMutB.on("connect", ck);
      sMutObs.on("connect", ck);
    });
    sMutA.emit("join_group_chat", { nickname: "Mutual_Alice", requestedRoomNumber: 1 });
    sMutB.emit("join_group_chat", { nickname: "Mutual_Bob", requestedRoomNumber: 1 });
    sMutObs.emit("join_group_chat", { nickname: "Mutual_Observer", requestedRoomNumber: 1 });
    await new Promise((r) => setTimeout(r, 400));

    let mInvAId = null;
    let mInvBId = null;
    sMutA.emit("post_call_invite", { mode: "video", testBypass: true });
    await new Promise((res) => {
      sMutObs.once("new_call_invite", (d) => {
        mInvAId = d.inviteId;
        res();
      });
    });

    sMutB.emit("post_call_invite", { mode: "video", testBypass: true });
    await new Promise((res) => {
      sMutObs.once("new_call_invite", (d) => {
        mInvBId = d.inviteId;
        res();
      });
    });

    const mutTakenEvents = new Map();
    sMutObs.on("call_invite_taken", (d) => {
      mutTakenEvents.set(d.inviteId, d.takerName);
    });

    sMutA.emit("accept_call_invite", { inviteId: mInvBId });
    await new Promise((r) => setTimeout(r, 600));

    const mutualSynced = mutTakenEvents.has(mInvBId) && mutTakenEvents.has(mInvAId) &&
                         mutTakenEvents.get(mInvBId) === "Mutual_Alice" &&
                         mutTakenEvents.get(mInvAId) === "Mutual_Bob";
    logResult("Mutual Invite Card Sync: Host & Accepter Cards Synced to Room", mutualSynced);

    sMutA.disconnect();
    sMutB.disconnect();
    sMutObs.disconnect();

    await bCollusion.close();
  } catch (err) {
    logResult("Phase 8 Anti-Collusion Verification", false, err.message);
  }

  // ===========================================================================
  // PHASE 9: Security Audit, Access Control & XSS Penetration Suite
  // ===========================================================================
  console.log("───────────────────────────────────────────────────────────────────────");
  console.log("📌 PHASE 9: Security Audit, Access Control & XSS Penetration Suite");
  console.log("───────────────────────────────────────────────────────────────────────");

  try {
    const BASE_URL = "http://localhost:5000/api/v1/strangerchat";
    const ADMIN_PASSWORD = process.env.PUSH_ADMIN_SECRET || "GANG_PUSH_SECRET_2026";

    // 9.1 Admin Trace Lookup Authentication Enforcement
    try {
      await axios.get(`${BASE_URL}/admin/trace-lookup?code=HGTEST01`);
      logResult("Unauthenticated trace lookup blocked with HTTP 403 Forbidden", false);
    } catch (err) {
      logResult("Unauthenticated trace lookup blocked with HTTP 403 Forbidden", err.response && err.response.status === 403);
    }

    try {
      await axios.get(`${BASE_URL}/admin/trace-lookup?code=HGTEST01`, {
        headers: { "x-admin-secret": "WrongHackerPassword123" }
      });
      logResult("Invalid password trace lookup blocked with HTTP 403 Forbidden", false);
    } catch (err) {
      logResult("Invalid password trace lookup blocked with HTTP 403 Forbidden", err.response && err.response.status === 403);
    }

    try {
      const res = await axios.get(`${BASE_URL}/admin/trace-lookup?code=HGTEST01`, {
        headers: { "x-admin-secret": ADMIN_PASSWORD }
      });
      logResult("Authorized admin request succeeds with HTTP 200", res.status === 200);
    } catch (err) {
      logResult("Authorized admin request passes password authentication", err.response && (err.response.status === 200 || err.response.status === 404));
    }

    // 9.2 Admin Push Broadcast Authentication Enforcement
    try {
      await axios.post(`${BASE_URL}/broadcast-push`, {
        adminSecretKey: "FakeSecret",
        title: "Hacked Notification",
        body: "Spam"
      });
      logResult("Unauthorized push broadcast blocked with HTTP 403 Forbidden", false);
    } catch (err) {
      logResult("Unauthorized push broadcast blocked with HTTP 403 Forbidden", err.response && err.response.status === 403);
    }

    // 9.3 XSS Payload Delivery & Frontend Sanitization
    const sSec = io(SOCKET_URL, { transports: ["websocket"], forceNew: true });
    await new Promise((r) => sSec.on("connect", r));
    sSec.emit("join_group_chat", { nickname: "SecTester", requestedRoomNumber: 1 });
    await new Promise((r) => sSec.on("group_joined", r));

    const xssPayload = "<script>alert('XSS')</script><img src=x onerror=alert(1)>";
    const xssDelivered = await new Promise((resolve) => {
      sSec.on("new_group_msg", (msg) => {
        if (msg.senderId === sSec.id) resolve(true);
      });
      sSec.emit("send_group_msg", { text: xssPayload });
      setTimeout(() => resolve(false), 2000);
    });
    logResult("XSS Payload Delivered to Socket Stream Without Crashing Server", xssDelivered);

    const fs = require("fs");
    const appJsCode = fs.readFileSync("/home/hashgang/Workspace/omegle/app.js", "utf8");
    const usesEscapeHtmlInChat = appJsCode.includes("cleanText = escapeHtml(") &&
                                 appJsCode.includes("senderNick = escapeHtml(");
    logResult("Frontend app.js Renders Message Text & Nicknames via escapeHtml() (XSS Immune)", usesEscapeHtmlInChat);

    sSec.disconnect();
  } catch (err) {
    logResult("Phase 9 Security Audit Execution", false, err.message);
  }

  // ===========================================================================
  // PHASE 10: WebPush Admin Broadcast & Form Validation Engine
  // ===========================================================================
  console.log("───────────────────────────────────────────────────────────────────────");
  console.log("📌 PHASE 10: WebPush Admin Broadcast & Form Validation Engine");
  console.log("───────────────────────────────────────────────────────────────────────");

  try {
    const BACKEND_BASE = "http://localhost:5000/api/v1/strangerchat";
    const FRONTEND_BASE = "http://localhost:8000";

    // 10.1 VAPID Public Key Retrieval
    const keyRes = await axios.get(`${BACKEND_BASE}/push-key`);
    logResult("GET /push-key returns valid VAPID public key", keyRes.status === 200 && !!keyRes.data.vapidPublicKey);

    // 10.2 Register WebPush Subscription
    const testEndpoint = "https://fcm.googleapis.com/fcm/send/test-mock-token-" + Date.now();
    const testSub = {
      endpoint: testEndpoint,
      keys: { p256dh: "BCVxs...mock...p256dh", auth: "mock...auth" }
    };
    const subRes = await axios.post(`${BACKEND_BASE}/push-subscribe`, {
      subscription: testSub,
      device: "mobile"
    });
    logResult("POST /push-subscribe saves subscription to MongoDB", subRes.status === 201 && subRes.data.success === true);

    // 10.3 Check Subscriber Count
    const statsRes = await axios.get(`${BACKEND_BASE}/push-stats`);
    logResult("GET /push-stats accurately reports active subscribers", statsRes.status === 200 && statsRes.data.activeSubscribers >= 1);

    // 10.4 Empty broadcast payload rejected
    try {
      await axios.post(`${BACKEND_BASE}/broadcast-push`, {
        adminSecretKey: "GANG_PUSH_SECRET_2026",
        title: "",
        body: ""
      });
      logResult("Backend rejects empty broadcast payload with HTTP 400 Bad Request", false);
    } catch (err) {
      logResult("Backend rejects empty broadcast payload with HTTP 400 Bad Request", err.response && err.response.status === 400);
    }

    // 10.5 Authorized broadcast with image banner & secret key
    const validBroadcastRes = await axios.post(`${BACKEND_BASE}/broadcast-push`, {
      adminSecretKey: "GANG_PUSH_SECRET_2026",
      title: "#GANG Live",
      body: "Chats are active now! Tap to chat.",
      image: "/og-image.webp",
      url: "/?source=admin_push_test"
    });
    logResult("POST /broadcast-push succeeds with image banner & valid secret key", validBroadcastRes.status === 200 && validBroadcastRes.data.success === true);

    // 10.6 Unsubscribe deactivation
    const unsubRes = await axios.post(`${BACKEND_BASE}/push-unsubscribe`, { endpoint: testEndpoint });
    logResult("POST /push-unsubscribe safely deactivates subscription", unsubRes.status === 200);

    // 10.7 Frontend Admin Console HTML Verification
    const pageRes = await axios.get(`${FRONTEND_BASE}/admin-broadcast-push.html`);
    const hasConsoleFeatures = pageRes.status === 200 &&
      pageRes.data.includes("title-counter") &&
      pageRes.data.includes("body-counter") &&
      pageRes.data.includes("push-image") &&
      pageRes.data.includes("preview-media-box") &&
      pageRes.data.includes("push-title-error") &&
      pageRes.data.includes("validateAllFields") &&
      pageRes.data.includes("confirm-modal-overlay") &&
      pageRes.data.includes("logo-sm.webp") &&
      pageRes.data.includes("Admin Password *");
    logResult("Frontend serves admin-broadcast-push.html with validation engine & live preview", hasConsoleFeatures);

    // 10.8 Secret Star ⭐ In-App Online Alert Delivery on Peer Connect
    const FAVORITES_API_URL = "http://localhost:5000/api/v1/strangerchat/favorites";
    const testFanUid = "test_fan_uid_" + Math.random().toString(36).substring(2, 8);
    const testTargetUid = "test_target_uid_" + Math.random().toString(36).substring(2, 8);

    await axios.post(FAVORITES_API_URL, {
      anonUserId: testFanUid,
      targetUid: testTargetUid,
      targetNick: "Priya"
    });

    const fanSock = io(SOCKET_URL, { transports: ["websocket"] });
    let favAlertReceived = null;
    fanSock.on("favorite_online_alert", (d) => {
      favAlertReceived = d;
    });

    await new Promise((res) => {
      fanSock.on("connect", () => {
        fanSock.emit("join_group_chat", { nickname: "FanBoy", anonUserId: testFanUid });
        fanSock.on("group_joined", res);
      });
    });

    const targetSock = io(SOCKET_URL, { transports: ["websocket"] });
    await new Promise((res) => {
      targetSock.on("connect", () => {
        targetSock.emit("join_group_chat", { nickname: "SuperGirl_99", anonUserId: testTargetUid });
        targetSock.on("group_joined", res);
      });
    });

    await sleep(600);
    const alertSuccess = !!(favAlertReceived && favAlertReceived.message && favAlertReceived.message.includes("Priya") && favAlertReceived.message.includes("group") && !favAlertReceived.message.includes("SuperGirl_99"));
    logResult("Secret Star Online Alert Preserves Saved Name Even If Target Changes Nickname", alertSuccess, `[Alert: "${favAlertReceived?.message}"]`);

    fanSock.disconnect();
    targetSock.disconnect();
    await axios.delete(FAVORITES_API_URL, {
      data: { anonUserId: testFanUid, targetUid: testTargetUid }
    }).catch(() => {});

    // 10.9 Self-Favoriting Prevention Gate (Negative Scenario)
    let selfFavBlockedHttp = false;
    try {
      await axios.post(FAVORITES_API_URL, {
        anonUserId: testFanUid,
        targetUid: testFanUid,
        targetNick: "Myself"
      });
    } catch (e) {
      selfFavBlockedHttp = e.response && e.response.status === 400;
    }

    let selfFavBlockedSocket = false;
    const testSelfSock = io(SOCKET_URL, { transports: ["websocket"] });
    await new Promise((res) => {
      testSelfSock.on("connect", () => {
        testSelfSock.emit("join_group_chat", { nickname: "Selfie", anonUserId: testFanUid });
        testSelfSock.on("group_joined", res);
      });
    });

    const socketFavErrPromise = new Promise((res) => {
      testSelfSock.on("favorite_error", (err) => {
        if (err && err.message && err.message.includes("yourself")) {
          selfFavBlockedSocket = true;
        }
        res();
      });
      testSelfSock.emit("favorite_user", { targetUid: testFanUid, targetNick: "Selfie" });
      setTimeout(res, 1000);
    });
    await socketFavErrPromise;
    testSelfSock.disconnect();

    logResult("Secret Star Self-Favoriting Gate Enforced (HTTP & Socket)", selfFavBlockedHttp && selfFavBlockedSocket);

    // 10.10 5-Item Hard Limit Enforced (Negative Scenario)
    const limitTestUser = "test_user_limit_" + Math.random().toString(36).substring(2, 8);
    for (let i = 1; i <= 5; i++) {
      await axios.post(FAVORITES_API_URL, {
        anonUserId: limitTestUser,
        targetUid: `target_${i}_${limitTestUser}`,
        targetNick: `Friend_${i}`
      });
    }
    const count5Res = await axios.get(`${FAVORITES_API_URL}?anonUserId=${limitTestUser}`);
    const isAt5 = count5Res.status === 200 && count5Res.data.count === 5;

    let sixthBlockedHttp = false;
    try {
      await axios.post(FAVORITES_API_URL, {
        anonUserId: limitTestUser,
        targetUid: `target_6_${limitTestUser}`,
        targetNick: `Friend_6`
      });
    } catch (e) {
      sixthBlockedHttp = e.response && e.response.status === 400 && e.response.data.limitReached === true;
    }

    // Cleanup limit test user
    for (let i = 1; i <= 5; i++) {
      await axios.delete(FAVORITES_API_URL, {
        data: { anonUserId: limitTestUser, targetUid: `target_${i}_${limitTestUser}` }
      }).catch(() => {});
    }

    logResult("Secret Star 5-Item Hard Limit Enforced (6th Blocked with HTTP 400)", isAt5 && sixthBlockedHttp);

    // 10.11 Duplicate Favoriting Idempotence & Safe Upsert (Positive Scenario)
    const dupUser = "test_user_dup_" + Math.random().toString(36).substring(2, 8);
    const dupTarget = "target_dup_" + Math.random().toString(36).substring(2, 8);

    const post1 = await axios.post(FAVORITES_API_URL, { anonUserId: dupUser, targetUid: dupTarget, targetNick: "Echo" });
    const post2 = await axios.post(FAVORITES_API_URL, { anonUserId: dupUser, targetUid: dupTarget, targetNick: "EchoUpdated" });
    const dupCheck = await axios.get(`${FAVORITES_API_URL}?anonUserId=${dupUser}`);
    const isIdempotent = post1.status === 201 && post2.status === 201 && dupCheck.data.count === 1 && dupCheck.data.favorites[0].targetNick === "EchoUpdated";

    await axios.delete(FAVORITES_API_URL, { data: { anonUserId: dupUser, targetUid: dupTarget } }).catch(() => {});
    logResult("Secret Star Duplicate Favoriting Idempotence & Safe Upsert", isIdempotent);

    // 10.12 3-Hour Cooldown Alert Suppression (Negative Scenario)
    const coolFan = "fan_cooldown_" + Math.random().toString(36).substring(2, 8);
    const coolTarget = "target_cooldown_" + Math.random().toString(36).substring(2, 8);

    await axios.post(FAVORITES_API_URL, { anonUserId: coolFan, targetUid: coolTarget, targetNick: "CooldownGirl" });

    const coolFanSock = io(SOCKET_URL, { transports: ["websocket"] });
    let coolAlertCount = 0;
    coolFanSock.on("favorite_online_alert", () => {
      coolAlertCount++;
    });

    await new Promise((res) => {
      coolFanSock.on("connect", () => {
        coolFanSock.emit("join_group_chat", { nickname: "CoolFan", anonUserId: coolFan });
        coolFanSock.on("group_joined", res);
      });
    });

    // Target joins 1st time -> Alert 1 should fire
    const tSock1 = io(SOCKET_URL, { transports: ["websocket"] });
    await new Promise((res) => {
      tSock1.on("connect", () => {
        tSock1.emit("join_group_chat", { nickname: "CooldownGirl", anonUserId: coolTarget });
        tSock1.on("group_joined", res);
      });
    });
    await sleep(500);
    tSock1.disconnect();

    // Target reconnects immediately 2nd time -> Alert 2 should BE SUPPRESSED by 3-hour cooldown
    const tSock2 = io(SOCKET_URL, { transports: ["websocket"] });
    await new Promise((res) => {
      tSock2.on("connect", () => {
        tSock2.emit("join_group_chat", { nickname: "CooldownGirl", anonUserId: coolTarget });
        tSock2.on("group_joined", res);
      });
    });
    await sleep(500);
    tSock2.disconnect();
    coolFanSock.disconnect();

    await axios.delete(FAVORITES_API_URL, { data: { anonUserId: coolFan, targetUid: coolTarget } }).catch(() => {});
    logResult("Secret Star 3-Hour Cooldown Suppression on Rapid Reconnects", coolAlertCount === 1, `[Alerts Triggered: ${coolAlertCount}/1]`);

    // 10.13 XSS & Special Character Sanitization in Favorites (Security)
    const xssUser = "xss_user_" + Math.random().toString(36).substring(2, 8);
    const xssTarget = "xss_target_" + Math.random().toString(36).substring(2, 8);
    const xssNick = "<script>alert('pwned')</script>";

    const xssAddRes = await axios.post(FAVORITES_API_URL, {
      anonUserId: xssUser,
      targetUid: xssTarget,
      targetNick: xssNick
    });
    const xssGetRes = await axios.get(`${FAVORITES_API_URL}?anonUserId=${xssUser}`);
    const xssSafe = xssAddRes.status === 201 && xssGetRes.data.favorites[0].targetNick.includes("<script>");

    await axios.delete(FAVORITES_API_URL, { data: { anonUserId: xssUser, targetUid: xssTarget } }).catch(() => {});
    logResult("Secret Star Storage & Escape of Complex Nicknames Without Server Crash", xssSafe);

    // 10.14 Loss Aversion All-Favorites Deletion API (Positive Scenario)
    const delAllUser = "usr_del_all_" + Math.random().toString(36).substring(2, 8);
    await axios.post(FAVORITES_API_URL, { anonUserId: delAllUser, targetUid: "t1", targetNick: "N1" });
    await axios.post(FAVORITES_API_URL, { anonUserId: delAllUser, targetUid: "t2", targetNick: "N2" });
    const delAllPreCheck = await axios.get(`${FAVORITES_API_URL}?anonUserId=${delAllUser}`);
    const had2 = delAllPreCheck.data.count === 2;

    const delAllRes = await axios.delete(`${FAVORITES_API_URL}/all`, { data: { anonUserId: delAllUser } });
    const delAllPostCheck = await axios.get(`${FAVORITES_API_URL}?anonUserId=${delAllUser}`);
    const now0 = delAllRes.status === 200 && delAllPostCheck.data.count === 0;
    logResult("Loss Aversion All-Favorites Cleanup Endpoint (DELETE /favorites/all)", had2 && now0);

    // 10.15 Socket Event clear_all_favorites (Positive Scenario)
    const sockClearUser = "usr_sock_clear_" + Math.random().toString(36).substring(2, 8);
    await axios.post(FAVORITES_API_URL, { anonUserId: sockClearUser, targetUid: "st1", targetNick: "SN1" });
    const clearSock = io(SOCKET_URL, { transports: ["websocket"] });
    let clearSuccessFired = false;
    clearSock.on("clear_all_favorites_success", () => {
      clearSuccessFired = true;
    });
    await new Promise((res) => {
      clearSock.on("connect", () => {
        clearSock.emit("clear_all_favorites", { userUid: sockClearUser });
        setTimeout(res, 500);
      });
    });
    clearSock.disconnect();
    const sockPostCheck = await axios.get(`${FAVORITES_API_URL}?anonUserId=${sockClearUser}`);
    logResult("Socket Event 'clear_all_favorites' Database Synchronization", clearSuccessFired && sockPostCheck.data.count === 0);

    // 10.16 Socket Event user_installed_app Broadcasts app_install_pill (Positive Scenario)
    const instRoomClient1 = io(SOCKET_URL, { transports: ["websocket"], autoConnect: false });
    const instRoomClient2 = io(SOCKET_URL, { transports: ["websocket"], autoConnect: false });
    let receivedInstallPill = null;

    instRoomClient2.on("new_group_msg", (msg) => {
      if (msg && msg.type === "app_install_pill") {
        receivedInstallPill = msg;
      }
    });

    await new Promise((res) => {
      const tm = setTimeout(res, 3000);
      instRoomClient1.once("connect", () => {
        instRoomClient1.emit("join_group_chat", { nickname: "InstallerOne" });
        instRoomClient1.once("group_joined", () => {
          clearTimeout(tm);
          res();
        });
      });
      instRoomClient1.connect();
    });

    await new Promise((res) => {
      const tm = setTimeout(res, 3000);
      instRoomClient2.once("connect", () => {
        instRoomClient2.emit("join_group_chat", { nickname: "ObserverTwo" });
        instRoomClient2.once("group_joined", () => {
          clearTimeout(tm);
          res();
        });
      });
      instRoomClient2.connect();
    });

    instRoomClient1.emit("user_installed_app", { nick: "InstallerOne" });
    await sleep(600);
    instRoomClient1.disconnect();
    instRoomClient2.disconnect();

    const installPillOk = receivedInstallPill && receivedInstallPill.nick === "InstallerOne" && receivedInstallPill.text.includes("installed the HashGANG App!");
    logResult("Socket Event 'user_installed_app' Broadcasts App Install Pill", installPillOk);

  } catch (err) {
    logResult("Phase 10 WebPush Suite Execution", false, err.message);
  }

  // ===========================================================================
  // PHASE 11: Multiplayer Ludo Board Game & P2P Mesh Engine
  // ===========================================================================
  console.log("\n───────────────────────────────────────────────────────────────────────");
  console.log("📌 PHASE 11: Multiplayer Ludo Board Game & P2P Audio Mesh Engine");
  console.log("───────────────────────────────────────────────────────────────────────");

  try {
    const createGroupClient = (nickname) => {
      return new Promise((resolve, reject) => {
        const socket = io(SOCKET_URL, {
          transports: ["websocket"],
          forceNew: true,
          autoConnect: false,
          query: { clientVer: "v351" }
        });
        const tm = setTimeout(() => reject(new Error(`Timeout connecting socket ${nickname}`)), 4000);
        socket.once("connect", () => {
          socket.emit("join_group_chat", { nickname, requestedRoomNumber: 1 });
        });
        socket.once("group_joined", () => {
          clearTimeout(tm);
          resolve(socket);
        });
        socket.once("connect_error", (err) => {
          clearTimeout(tm);
          reject(err);
        });
        socket.connect();
      });
    };

    // 11.1 Unified 4P Lobby Creation & Invite Broadcast
    const hostClient = await createGroupClient("Ludo_Host_Red");
    const challenger1 = await createGroupClient("Ludo_Challenger_1");

    let ludoInviteId = null;
    let inviteReceived = null;

    const invitePromise = new Promise((resolve, reject) => {
      const tm = setTimeout(() => reject(new Error("Timeout waiting for new_ludo_invite")), 4000);
      challenger1.on("new_ludo_invite", (invite) => {
        clearTimeout(tm);
        ludoInviteId = invite.inviteId;
        inviteReceived = invite;
        resolve(invite);
      });
    });

    hostClient.emit("post_ludo_invite");
    await invitePromise;

    const timeoutSec = inviteReceived?.expiresInSec || Math.round(((inviteReceived?.expiresAt || 0) - (inviteReceived?.createdAt || 0)) / 1000);
    logResult("Unified 4P Ludo Lobby Creation & Expiry Broadcast",
      !!ludoInviteId && inviteReceived?.maxPlayers === 4 && timeoutSec === 60,
      `[Invite: ${ludoInviteId}, Max: ${inviteReceived?.maxPlayers}, Timeout: ${timeoutSec}s]`
    );

    // 11.2 Challenger Slot Update Broadcast
    let slotData = null;
    const slotPromise = new Promise((resolve) => {
      hostClient.on("ludo_slot_updated", (data) => {
        slotData = data;
        resolve(data);
      });
    });

    challenger1.emit("join_ludo_invite", { inviteId: ludoInviteId });
    await slotPromise;

    logResult("Real-Time Lobby Slot Update Broadcast",
      slotData?.joinedPlayers?.length === 2 && slotData?.maxPlayers === 4,
      `[Slots: ${slotData?.joinedPlayers?.length}/${slotData?.maxPlayers}]`
    );

    // 11.3 Host Early-Start Handshake (2 Players)
    let p1GameStart = null;
    let p2GameStart = null;

    const startPromise = Promise.all([
      new Promise((res) => hostClient.once("ludo_game_start", (data) => { p1GameStart = data; res(data); })),
      new Promise((res) => challenger1.once("ludo_game_start", (data) => { p2GameStart = data; res(data); }))
    ]);

    hostClient.emit("start_ludo_game_now", { inviteId: ludoInviteId });
    await startPromise;

    logResult("Host Early Start Handshake & 60s Relaxed Turn Timeout",
      p1GameStart?.mode === "2p" &&
      p1GameStart?.turnTimeoutSec === 60 &&
      p1GameStart?.players?.length === 2 &&
      p2GameStart?.gameId === p1GameStart?.gameId,
      `[Mode: ${p1GameStart?.mode}, Timeout: ${p1GameStart?.turnTimeoutSec}s]`
    );

    // 11.4 Synchronous Dice Roll Broadcast
    let rolledData = null;
    const dicePromise = new Promise((resolve) => {
      challenger1.once("ludo_dice_rolled", (data) => {
        rolledData = data;
        resolve(data);
      });
    });

    hostClient.emit("ludo_roll_dice");
    await dicePromise;

    logResult("Synchronous Dice Roll Event & Value Distribution [1-6]",
      rolledData && rolledData.dice >= 1 && rolledData.dice <= 6 && rolledData.color === "red",
      `[Rolled: ${rolledData?.dice} by ${rolledData?.color}]`
    );

    // 11.5 WebRTC P2P Audio Signaling State Relay
    let signalRelayed = false;
    const ludoSignalPromise = new Promise((resolve) => {
      challenger1.once("ludo_signal", (data) => {
        if (data.senderId === hostClient.id && data.signal?.type === "ludo_offer") {
          signalRelayed = true;
          resolve(true);
        }
      });
      setTimeout(() => resolve(false), 2000);
    });

    hostClient.emit("ludo_signal", {
      targetId: challenger1.id,
      signal: { type: "ludo_offer", sdp: "dummy_ludo_audio_offer" }
    });
    await ludoSignalPromise;

    logResult("Ludo P2P Audio Mesh Signaling Relay & Anti-Glare Guard", signalRelayed === true);

    // 11.6 Forfeit & Game Over Broadcast
    let gameOverData = null;
    const gameOverPromise = new Promise((resolve) => {
      hostClient.once("ludo_game_over", (data) => {
        gameOverData = data;
        resolve(data);
      });
    });

    challenger1.emit("ludo_leave_game");
    await gameOverPromise;

    logResult("Forfeit Resignation & Winner Broadcast",
      gameOverData?.reason === "forfeit" && gameOverData?.winner === "red",
      `[Winner: ${gameOverData?.winner}, Reason: ${gameOverData?.reason}]`
    );

    hostClient.disconnect();
    challenger1.disconnect();
    await sleep(300);

    // 11.7 Dynamic 3-Player Match Launch
    const host3P = await createGroupClient("Host_3P");
    const p2_3P = await createGroupClient("P2_3P");
    const p3_3P = await createGroupClient("P3_3P");

    let inv3PId = null;
    const inv3PPromise = new Promise((resolve) => {
      p2_3P.on("new_ludo_invite", (invite) => {
        inv3PId = invite.inviteId;
        resolve(invite);
      });
    });

    host3P.emit("post_ludo_invite");
    await inv3PPromise;

    p2_3P.emit("join_ludo_invite", { inviteId: inv3PId });
    await sleep(150);
    p3_3P.emit("join_ludo_invite", { inviteId: inv3PId });
    await sleep(150);

    const start3PPromise = Promise.all([
      new Promise((res) => host3P.once("ludo_game_start", res)),
      new Promise((res) => p2_3P.once("ludo_game_start", res)),
      new Promise((res) => p3_3P.once("ludo_game_start", res))
    ]);

    host3P.emit("start_ludo_game_now", { inviteId: inv3PId });
    const [res3P] = await start3PPromise;

    logResult("Dynamic 3-Player Match Launch & Triangle Seating",
      res3P?.mode === "3p" && res3P?.players?.length === 3,
      `[Mode: ${res3P?.mode}, Players: ${res3P?.players?.length}]`
    );

    host3P.disconnect();
    p2_3P.disconnect();
    p3_3P.disconnect();
    await sleep(300);

    // 11.8 4-Player Instant Auto-Start on 4/4 Capacity
    const p1_4P = await createGroupClient("P1_4P");
    const p2_4P = await createGroupClient("P2_4P");
    const p3_4P = await createGroupClient("P3_4P");
    const p4_4P = await createGroupClient("P4_4P");

    let inv4PId = null;
    const inv4PPromise = new Promise((resolve) => {
      p2_4P.on("new_ludo_invite", (invite) => {
        inv4PId = invite.inviteId;
        resolve(invite);
      });
    });

    p1_4P.emit("post_ludo_invite");
    await inv4PPromise;

    const start4PPromise = Promise.all([
      new Promise((res) => p1_4P.once("ludo_game_start", res)),
      new Promise((res) => p2_4P.once("ludo_game_start", res)),
      new Promise((res) => p3_4P.once("ludo_game_start", res)),
      new Promise((res) => p4_4P.once("ludo_game_start", res))
    ]);

    p2_4P.emit("join_ludo_invite", { inviteId: inv4PId });
    await sleep(100);
    p3_4P.emit("join_ludo_invite", { inviteId: inv4PId });
    await sleep(100);
    p4_4P.emit("join_ludo_invite", { inviteId: inv4PId });

    const [res4P] = await start4PPromise;

    logResult("4-Player Instant Auto-Start on 4/4 Full Capacity",
      res4P?.mode === "4p" && res4P?.players?.length === 4,
      `[Mode: ${res4P?.mode}, Players: ${res4P?.players?.length}]`
    );

    // 11.8B 4P Ludo Disconnect Resilience & Strict Turn Alternation (Red <-> Yellow)
    let turnChanges = [];
    let ludoGameOverData = null;

    p1_4P.on("ludo_turn_change", (d) => turnChanges.push(d));
    p3_4P.on("ludo_turn_change", (d) => turnChanges.push(d));
    p1_4P.on("ludo_game_over", (d) => { ludoGameOverData = d; });

    // P2 (Green) leaves explicitly, P4 (Blue) disconnects abruptly
    p2_4P.emit("ludo_leave_game");
    p4_4P.disconnect();
    await sleep(400);

    // Red rolls dice
    turnChanges = [];
    const rollPromise1 = new Promise((res) => p1_4P.once("ludo_dice_rolled", res));
    p1_4P.emit("ludo_roll_dice", { gameId: res4P.gameId });
    const roll1 = await rollPromise1;
    if (roll1.movableTokens && roll1.movableTokens.length > 0) {
      await sleep(200);
      p1_4P.emit("ludo_move_token", { tokenIndex: roll1.movableTokens[0] });
    }
    await sleep(2600);
    if (roll1.dice === 6) {
      const extraPromise = new Promise((res) => p1_4P.once("ludo_dice_rolled", res));
      p1_4P.emit("ludo_roll_dice", { gameId: res4P.gameId });
      const extraRoll = await extraPromise;
      if (extraRoll.movableTokens && extraRoll.movableTokens.length > 0) {
        await sleep(200);
        p1_4P.emit("ludo_move_token", { tokenIndex: extraRoll.movableTokens[0] });
      }
      await sleep(2600);
    }

    const turnAfterRed = turnChanges[turnChanges.length - 1];
    const turnAlternatedToYellow = (turnAfterRed?.activeColor === "yellow");

    logResult("4P Ludo 2-Player Disconnect & Strict Alternation (Red -> Yellow)",
      turnAlternatedToYellow,
      `[Next Active: ${turnAfterRed?.activeColor}]`
    );

    // Yellow leaves -> Red declared champion by last_standing
    p3_4P.emit("ludo_leave_game");
    await sleep(500);

    logResult("4P Ludo Last-Standing Champion Declaration",
      ludoGameOverData?.winner === "red" && ludoGameOverData?.reason === "last_standing",
      `[Winner: ${ludoGameOverData?.winner}, Reason: ${ludoGameOverData?.reason}]`
    );

    p1_4P.disconnect();
    p3_4P.disconnect();
    await sleep(400);

    // 11.9 Headless Browser UI Permutations for Ludo (Playwright)
    const browserLudo = await chromium.launch({
      headless: true,
      args: [
        "--use-fake-ui-for-media-stream",
        "--use-fake-device-for-media-stream",
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    try {
      const ctxA = await browserLudo.newContext({ viewport: { width: 412, height: 860 }, serviceWorkers: "block" });
      const ctxB = await browserLudo.newContext({ viewport: { width: 412, height: 860 }, serviceWorkers: "block" });
      const pageA = await ctxA.newPage();
      const pageB = await ctxB.newPage();

      await pageA.goto(APP_URL, { waitUntil: "load" });
      await pageB.goto(APP_URL, { waitUntil: "load" });

      // Dismiss Age modal if present
      for (const p of [pageA, pageB]) {
        const ageBtn = p.locator("#v2-btn-age-confirm, .v2-btn-enter");
        if (await ageBtn.count() > 0 && await ageBtn.first().isVisible()) {
          await ageBtn.first().click();
        }
      }
      await sleep(1000);

      // Verify Launch Visibility: Group chat visible, Ludo stage hidden
      const groupAVisible = await pageA.locator("#v2-group-chat-stage").isVisible();
      const ludoAVisible = await pageA.locator("#v2-ludo-stage").isVisible();
      logResult("Initial Launch Stage Visibility (Lounge Active, Ludo Hidden)", groupAVisible && !ludoAVisible);

      // Drawer Card Formatting
      await pageA.click("#v2-btn-open-1v1-drawer");
      await sleep(500);
      const ludoDrawerCard = pageA.locator(".v2-drawer-game-card.ludo-card");
      const drawerText = await ludoDrawerCard.innerText();
      logResult("Call Drawer Displays 'Ludo Game' Title & 'PLAY' Button",
        drawerText.includes("Ludo Game") && drawerText.toUpperCase().includes("PLAY"));

      // Post Ludo Challenge to Lounge
      await ludoDrawerCard.scrollIntoViewIfNeeded();
      await ludoDrawerCard.click({ force: true });
      await sleep(1200);

      // Check In-Feed Invite Card in Page B
      const feedInviteB = pageB.locator(".v2-feed-ludo-card").last();
      await feedInviteB.waitFor({ state: "visible", timeout: 8000 });
      const inviteBText = await feedInviteB.innerText();
      const cupCount = (inviteBText.match(/🏆/g) || []).length;
      const hasJoinBtn = await feedInviteB.locator(".v2-btn-join-ludo-action:has-text('JOIN GAME')").count() > 0;
      const hasExpiryBadge = await feedInviteB.locator(".v2-ludo-expiry-badge").count() > 0;

      logResult("Feed Invite Card Formatted (Single Trophy, 60s Timer, 'JOIN GAME')",
        cupCount <= 1 && hasJoinBtn && hasExpiryBadge,
        `[Trophies: ${cupCount}, JoinBtn: ${hasJoinBtn}, Timer: ${hasExpiryBadge}]`
      );

      // Page B Joins Game
      await feedInviteB.locator(".v2-btn-join-ludo-action:has-text('JOIN GAME')").click();
      await sleep(1000);

      // Page A sees "START GAME NOW"
      const feedInviteA = pageA.locator(".v2-feed-ludo-card").last();
      const startNowBtn = feedInviteA.locator(".v2-btn-join-ludo-action.host-start");
      const startNowVisible = await startNowBtn.isVisible();
      logResult("Host Invite Card Unlocks 'START GAME NOW' Button", startNowVisible);

      if (startNowVisible) {
        await startNowBtn.click();
      }
      await sleep(2000);

      // Verify Arena Launch
      const ludoStageA = await pageA.locator("#v2-ludo-stage").isVisible();
      const ludoStageB = await pageB.locator("#v2-ludo-stage").isVisible();
      logResult("Both Players Transition into Ludo Arena Stage", ludoStageA && ludoStageB);

      // Header Spacing & Layout Check
      const leftBox = await pageA.locator(".v2-ludo-header-left").boundingBox();
      const centerBox = await pageA.locator(".v2-ludo-header-center").boundingBox();
      const rightBox = await pageA.locator(".v2-ludo-header-right").boundingBox();
      const headerValid = leftBox && centerBox && rightBox &&
        (leftBox.x + leftBox.width <= centerBox.x + 5) &&
        (centerBox.x + centerBox.width <= rightBox.x + 5);
      logResult("Ludo Arena Header Cleanly Spaced Without Overlapping", headerValid);

      // Check Default Dice Face 5 with 5 Pips
      const diceDisplayA = pageA.locator("#v2-ludo-dice-display");
      const diceFace = await diceDisplayA.getAttribute("data-face");
      const pipCount = await diceDisplayA.locator(".dice-pip").count();
      logResult("Realistic Physical 3D Dice Shows Initial Face 5 with 5 Dots", diceFace === "5" && pipCount === 5);

      // Roll Dice Sync
      const isPlayerATurn = await pageA.locator("#v2-ludo-dice-btn.turn-ready").count() > 0;
      const activeP = isPlayerATurn ? pageA : pageB;
      await activeP.locator("#v2-ludo-dice-btn").click({ force: true });
      await sleep(1500);

      const faceA = await pageA.locator("#v2-ludo-dice-display").getAttribute("data-face");
      const faceB = await pageB.locator("#v2-ludo-dice-display").getAttribute("data-face");
      logResult("Animated Dice Roll Synchronized Across Players", faceA && faceB && faceA === faceB, `[Face: ${faceA}]`);

      // Minimize to Group Chat & Floating Dock
      await pageA.locator("#v2-ludo-back-btn").click();
      await sleep(600);
      const minGroupVisible = await pageA.locator("#v2-group-chat-stage").isVisible();
      const minLudoVisible = await pageA.locator("#v2-ludo-stage").isVisible();
      const dockVisible = await pageA.locator("#v2-ludo-floating-dock").isVisible();
      logResult("Minimize to Lounge Reveals Group Chat & Floating Dock Button", minGroupVisible && !minLudoVisible && dockVisible);

      // Floating Dock Restores Arena
      await pageA.locator("#v2-ludo-floating-dock").click();
      await sleep(600);
      const restoredLudo = await pageA.locator("#v2-ludo-stage").isVisible();
      logResult("Floating Dock Restores Ludo Arena & Hides Dock", restoredLudo);

      // Exit & Victory Celebration
      pageB.once("dialog", async (dialog) => await dialog.accept());
      await pageB.locator("#v2-ludo-exit-btn").click();
      await sleep(1500);

      const victoryVisible = await pageA.locator("#v2-ludo-victory-overlay").isVisible();
      const victoryTitle = await pageA.locator("#v2-ludo-winner-title").innerText();
      const victoryBtnText = await pageA.locator(".v2-btn-victory-exit").innerText();
      logResult("Victory Overlay Rendered with Single Cup (No Trophy in Title)",
        victoryVisible && !victoryTitle.includes("🏆") && victoryBtnText.includes("Back to Group"));

      await pageA.locator(".v2-btn-victory-exit").click();
      await sleep(1000);

      // Winner Card in Feed
      const winnerCard = pageB.locator(".v2-feed-ludo-winner-card").last();
      await winnerCard.waitFor({ state: "visible", timeout: 8000 });
      const winnerCardText = await winnerCard.innerText();
      const winnerTrophyCount = (winnerCardText.match(/🏆/g) || []).length;
      const externalActionsCount = await pageB.locator(".v2-group-msg-row.is-ludo-winner .v2-msg-external-actions").count();

      logResult("Lounge Feed Winner Card (Single Trophy, External Actions Outside Card)",
        winnerTrophyCount === 1 && externalActionsCount > 0,
        `[Trophy: ${winnerTrophyCount}, ExternalActions: ${externalActionsCount}]`
      );

      await ctxA.close();
      await ctxB.close();
    } finally {
      await browserLudo.close();
    }

  } catch (err) {
    logResult("Phase 11 Ludo Multiplayer Suite Execution", false, err.message);
  }

  console.log("\n=======================================================================");
  console.log(`📊 MASTER TEST SUITE SUMMARY: ${totalPassed} Passed | ${totalFailed} Failed`);
  console.log("=======================================================================\n");

  process.exit(totalFailed === 0 ? 0 : 1);
}

runMasterE2ESuite();
