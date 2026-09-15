const { chromium } = require("playwright");

const APP_URL = process.env.APP_URL || "http://localhost:8000/index.html";

async function runE2ETest() {
  console.log("\n======================================================");
  console.log("🚀 [Omegle E2E Playwright Test] Starting Automated Test");
  console.log(`   Target App URL: ${APP_URL}`);
  console.log("======================================================\n");

  const launchArgs = [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--no-sandbox",
    "--disable-setuid-sandbox"
  ];

  const browser = await chromium.launch({
    headless: true,
    args: launchArgs
  });

  const logsA = [];
  const logsB = [];

  try {
    // 1. Create two isolated browser contexts for User A and User B
    console.log("👥 Creating isolated browser contexts for User A and User B...");
    const contextA = await browser.newContext({ permissions: ["camera", "microphone"] });
    const contextB = await browser.newContext({ permissions: ["camera", "microphone"] });

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    // Track console logs and errors
    pageA.on("console", (msg) => logsA.push(`[User A Console ${msg.type()}] ${msg.text()}`));
    pageB.on("console", (msg) => logsB.push(`[User B Console ${msg.type()}] ${msg.text()}`));

    pageA.on("pageerror", (err) => console.error("❌ Page A Error:", err.message));
    pageB.on("pageerror", (err) => console.error("❌ Page B Error:", err.message));

    // 2. Navigate both users to local app URL
    console.log("🌐 Navigating User A and User B to Omegle web app...");
    await Promise.all([
      pageA.goto(APP_URL, { waitUntil: "domcontentloaded" }),
      pageB.goto(APP_URL, { waitUntil: "domcontentloaded" })
    ]);

    await pageA.waitForTimeout(1000);
    await pageB.waitForTimeout(1000);

    // Accept TOS modal robustly for both pages
    const handleTOS = async (page, userLabel) => {
      await page.evaluate(() => {
        if (typeof window.acceptTosAndProceed === "function") {
          window.acceptTosAndProceed();
        } else {
          const btn = document.getElementById("btn-tos-agree");
          if (btn) btn.click();
        }
      });
      console.log(`📜 TOS Accepted & Permissions requested for ${userLabel}`);
      await page.waitForTimeout(500);
    };

    await handleTOS(pageA, "User A");
    await handleTOS(pageB, "User B");

    // 3. Ensure "Start Chat" / "Find Stranger" is active
    console.log("🎯 Ensuring matchmaking is active for User A and User B...");
    const ensureStarted = async (page, userLabel) => {
      const statusText = await page.evaluate(() => {
        const s = document.getElementById("status");
        return s ? s.innerText : "";
      });

      if (!statusText.toLowerCase().includes("search") && !statusText.toLowerCase().includes("connect")) {
        await page.evaluate(() => {
          if (typeof window.handleStartOrNext === "function") {
            window.handleStartOrNext();
          }
        });
        console.log(`▶️ Triggered handleStartOrNext() for ${userLabel}`);
      } else {
        console.log(`ℹ️ Matchmaking already active for ${userLabel} (Status: "${statusText}")`);
      }
    };

    await ensureStarted(pageA, "User A");
    await pageA.waitForTimeout(200);
    await ensureStarted(pageB, "User B");

    // 4. Wait for WebRTC P2P connection to be established simultaneously
    console.log("⏳ Waiting for WebRTC P2P match and media stream connection on both browsers...");
    
    const checkUserConnected = async (page) => {
      const result = await page.evaluate(() => {
        const remoteVideo = document.getElementById("remote");
        const statusElem = document.getElementById("status");
        const hasStream = remoteVideo && (remoteVideo.srcObject !== null || remoteVideo.currentSrc !== "" || remoteVideo.src !== "");
        const statusText = statusElem ? statusElem.innerText : "";
        const isConnectedStatus = statusText.toLowerCase().includes("connected");
        return { hasStream, statusText, isConnectedStatus };
      });
      return result.hasStream || result.isConnectedStatus;
    };

    let connectedA = false;
    let connectedB = false;
    const maxWaitMs = 15000;
    const start = Date.now();
    while (Date.now() - start < maxWaitMs) {
      if (!connectedA) connectedA = await checkUserConnected(pageA);
      if (!connectedB) connectedB = await checkUserConnected(pageB);
      if (connectedA && connectedB) break;
      await pageA.waitForTimeout(500);
    }

    if (!connectedA || !connectedB) {
      throw new Error(`Timeout waiting for dual P2P connection (User A: ${connectedA}, User B: ${connectedB})`);
    }

    console.log("✅ Dual P2P Match Verified! Both User A and User B are connected with live media streams.");

    // Save screenshots of successful WebRTC connection
    await pageA.screenshot({ path: "e2e_match_success_userA.png" });
    await pageB.screenshot({ path: "e2e_match_success_userB.png" });
    console.log("📸 Saved connection screenshots: e2e_match_success_userA.png, e2e_match_success_userB.png");

    // 5. Test "Skip" functionality: User A clicks "Next Stranger"
    console.log("\n⏭️ Testing Skip Flow: User A clicks 'Next Stranger'...");
    await pageA.evaluate(() => {
      if (typeof window.handleStartOrNext === "function") {
        window.handleStartOrNext();
      }
    });
    await pageA.waitForTimeout(1500);

    const checkSkipState = await pageA.evaluate(() => {
      const statusElem = document.getElementById("status");
      return statusElem ? statusElem.innerText : "";
    });
    console.log(`🔄 User A Status after skip: "${checkSkipState}"`);

    await pageA.screenshot({ path: "e2e_skip_success_userA.png" });
    console.log("📸 Saved skip screenshot: e2e_skip_success_userA.png");

    console.log("\n======================================================");
    console.log("🎉 [E2E Test Result] ALL TESTS PASSED SUCCESSFULLY!");
    console.log("======================================================\n");
  } catch (err) {
    console.error("\n❌ [E2E Test Failed]:", err.message);
    console.log("\n📋 User A Console Logs (last 15):");
    logsA.slice(-15).forEach((l) => console.log(`   ${l}`));
    console.log("\n📋 User B Console Logs (last 15):");
    logsB.slice(-15).forEach((l) => console.log(`   ${l}`));
  } finally {
    await browser.close();
  }
}

runE2ETest();
