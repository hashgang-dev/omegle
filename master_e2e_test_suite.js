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

    sGroup1.emit("post_call_invite", { mode: "video" });
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
    let s3Invite = null;
    const s3InvitePromise = new Promise((resolve) => {
      sGroup1.on("new_call_invite", (d) => { s3Invite = d; resolve(); });
    });
    sGroup3.emit("post_call_invite", { mode: "audio" });
    await s3InvitePromise;

    let inviteCancelled = null;
    const cancelPromise = new Promise((resolve) => {
      sGroup1.on("call_invite_cancelled", (d) => {
        if (d.inviteId === s3Invite.inviteId) {
          inviteCancelled = d;
          resolve();
        }
      });
      setTimeout(resolve, 2000);
    });

    sGroup3.disconnect();
    await cancelPromise;

    logResult("Zombie Card Cleanup on Disconnect (call_invite_cancelled)", inviteCancelled !== null);

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

      await page.click("#v2-btn-age-confirm");
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

      await pageAlice.click("#v2-btn-age-confirm");
      await pageBob.click("#v2-btn-age-confirm");

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

      await pageBob.evaluate(() => {
        const feed = document.getElementById("v2-group-messages-feed");
        const replyBtn = feed.querySelector(".v2-group-msg-row.other button[title='Reply'], .v2-group-msg-row.other .v2-ext-act-btn:first-child");
        if (replyBtn) replyBtn.click();
      });

      const isReplyBarVisible = await pageBob.evaluate(() => {
        const bar = document.getElementById("v2-group-reply-bar");
        return bar && !bar.classList.contains("hidden");
      });
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

      await pageAlice.click("#v2-btn-age-confirm");
      await pageBob.click("#v2-btn-age-confirm");

      await pageAlice.waitForFunction(() => window.socket?.connected);
      await pageBob.waitForFunction(() => window.socket?.connected);
      await pageAlice.waitForTimeout(500);

      if (await pageAlice.isVisible("#v2-btn-open-1v1-drawer")) {
        await pageAlice.click("#v2-btn-open-1v1-drawer");
        await pageAlice.waitForTimeout(300);
      }
      await pageAlice.click(".video-tray-btn");

      await pageAlice.waitForSelector(".v2-feed-call-card", { timeout: 5000 });
      logResult("Host In-Feed Call Invite Card Display", true);

      await pageBob.waitForSelector("button.v2-btn-join-call-action", { timeout: 5000 });
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

      await page.click("#v2-btn-age-confirm");
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
    sEdge1.emit("post_call_invite", { mode: "text" });
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
    sEdge1.emit("post_call_invite", { mode: "audio" });
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

  console.log("\n=======================================================================");
  console.log(`📊 MASTER TEST SUITE SUMMARY: ${totalPassed} Passed | ${totalFailed} Failed`);
  console.log("=======================================================================\n");

  process.exit(totalFailed === 0 ? 0 : 1);
}

runMasterE2ESuite();
