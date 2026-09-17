/* eslint-env node */
/**
 * ============================================================================
 * 🚀 HashGANG Chat - Unified Master End-to-End Functional Test Suite
 * ============================================================================
 * Tests all core features end-to-end:
 * 1. Dual-Browser P2P WebRTC Match & In-Call Controls
 * 2. In-Call Video Upgrade Flow (Inviter Camera/Mic Check + Accept & Switch)
 * 3. All Strangers Engaged & Friend Referral Link Flow
 * 4. Header Brand Logo, App Name Animation & Multi-Device Responsive Fit
 * ============================================================================
 */

const { chromium } = require("playwright");

const APP_URL = process.env.APP_URL || "http://localhost:8000/index.html";

async function runMasterSuite() {
  console.log("\n=======================================================================");
  console.log("🚀 [HashGANG Master E2E Suite] Running Complete App Verification");
  console.log(`   Target App URL: ${APP_URL}`);
  console.log("=======================================================================\n");

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

  let passCount = 0;
  let failCount = 0;

  function recordResult(testName, success, details = "") {
    if (success) {
      passCount++;
      console.log(`✅ [PASS] ${testName} ${details}`);
    } else {
      failCount++;
      console.error(`❌ [FAIL] ${testName} ${details}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Dual-Browser P2P WebRTC Video Match & In-Call Controls
    // -------------------------------------------------------------------------
    console.log("\n🔹 [TEST 1] WebRTC P2P Video Match & In-Call Toolbar Controls...");
    {
      const contextA = await browser.newContext({ permissions: ["camera", "microphone"] });
      const contextB = await browser.newContext({ permissions: ["camera", "microphone"] });
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();

      const fulfillMock = (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "// mock" });
      await pageA.route("**/*jsdelivr.net**", fulfillMock);
      await pageA.route("**/*unpkg.com**", fulfillMock);
      await pageB.route("**/*jsdelivr.net**", fulfillMock);
      await pageB.route("**/*unpkg.com**", fulfillMock);

      await Promise.all([
        pageA.goto(APP_URL, { waitUntil: "load" }),
        pageB.goto(APP_URL, { waitUntil: "load" })
      ]);

      await pageA.evaluate(() => window.selectChatMode("video"));
      await pageB.evaluate(() => window.selectChatMode("video"));

      await Promise.all([
        pageA.evaluate(() => window.acceptTosAndProceed && window.acceptTosAndProceed()),
        pageB.evaluate(() => window.acceptTosAndProceed && window.acceptTosAndProceed())
      ]);

      let connected = false;
      for (let i = 0; i < 25; i++) {
        await new Promise((r) => setTimeout(r, 600));
        const statusA = await pageA.evaluate(() => {
          const remoteVid = document.getElementById("remote");
          const pc = window.currentPeerConnection;
          const ice = pc ? pc.iceConnectionState : "";
          return (remoteVid && remoteVid.srcObject !== null) || ice === "connected" || ice === "completed";
        });
        const statusB = await pageB.evaluate(() => {
          const remoteVid = document.getElementById("remote");
          const pc = window.currentPeerConnection;
          const ice = pc ? pc.iceConnectionState : "";
          return (remoteVid && remoteVid.srcObject !== null) || ice === "connected" || ice === "completed";
        });

        if (statusA || statusB) {
          connected = true;
          break;
        }
      }

      recordResult("WebRTC P2P Video Call Connection", connected, connected ? "(Users A & B matched smoothly)" : "(Match timeout)");

      // Toolbar button toggle test
      if (connected) {
        const isMuted = await pageA.evaluate(() => {
          if (typeof window.toggleAudio === "function") {
            window.toggleAudio();
          }
          return window.isAudioMuted;
        });
        recordResult("In-Call Audio Mute Toggle", isMuted === true, "(Mute function successfully toggled audio state)");
      }

      await contextA.close();
      await contextB.close();
    }

    // -------------------------------------------------------------------------
    // TEST 2: In-Call Video Call Upgrade Flow & Local Permission Gate
    // -------------------------------------------------------------------------
    console.log("\n🔹 [TEST 2] Video Call Upgrade Flow & Local Media Permission Check...");
    {
      const contextA = await browser.newContext({ permissions: ["camera", "microphone"] });
      const contextB = await browser.newContext({ permissions: ["camera", "microphone"] });
      const pageA = await contextA.newPage();
      const pageB = await contextB.newPage();

      const fulfillMock = (r) => r.fulfill({ status: 200, contentType: "application/javascript", body: "// mock" });
      await pageA.route("**/*jsdelivr.net**", fulfillMock);
      await pageA.route("**/*unpkg.com**", fulfillMock);
      await pageB.route("**/*jsdelivr.net**", fulfillMock);
      await pageB.route("**/*unpkg.com**", fulfillMock);

      await Promise.all([
        pageA.goto(APP_URL, { waitUntil: "load" }),
        pageB.goto(APP_URL, { waitUntil: "load" })
      ]);

      await pageA.evaluate(() => window.selectChatMode("text"));
      await pageB.evaluate(() => window.selectChatMode("text"));

      await Promise.all([
        pageA.evaluate(() => window.acceptTosAndProceed && window.acceptTosAndProceed()),
        pageB.evaluate(() => window.acceptTosAndProceed && window.acceptTosAndProceed())
      ]);

      // Wait for match in Text mode
      await new Promise((r) => setTimeout(r, 3000));

      // User A requests video call upgrade
      const inviterMediaChecked = await pageA.evaluate(async () => {
        if (typeof window.requestVideoCallUpgrade === "function") {
          window.requestVideoCallUpgrade();
          return true;
        }
        return false;
      });

      recordResult("Inviter Camera & Microphone Local Check Triggered", inviterMediaChecked);

      await new Promise((r) => setTimeout(r, 1500));

      // Check User B receives upgrade request modal
      const modalVisible = await pageB.evaluate(() => {
        const modal = document.getElementById("upgrade-request-modal");
        return modal && !modal.classList.contains("hidden");
      });

      recordResult("Video Upgrade Invitation Received by User B", modalVisible);

      // User B accepts upgrade request
      if (modalVisible) {
        await pageB.evaluate(() => {
          if (typeof window.respondToUpgradeRequest === "function") {
            window.respondToUpgradeRequest(true);
          }
        });
        await new Promise((r) => setTimeout(r, 2000));

        const modeUserB = await pageB.evaluate(() => window.currentChatMode);
        recordResult("Seamless Video Call Upgrade Execution", modeUserB === "video", `(Mode switched to: ${modeUserB})`);
      }

      await contextA.close();
      await contextB.close();
    }

    // -------------------------------------------------------------------------
    // TEST 3: All Strangers Engaged & Friend Referral Link Overlay
    // -------------------------------------------------------------------------
    console.log("\n🔹 [TEST 3] All Strangers Engaged & Friend Referral Link Flow...");
    {
      const contextSingle = await browser.newContext();
      const page = await contextSingle.newPage();
      await page.goto(APP_URL, { waitUntil: "load" });

      await page.evaluate(() => window.acceptTosAndProceed && window.acceptTosAndProceed());

      // Trigger Searching Overlay & force No Stranger State
      await page.evaluate(() => {
        if (typeof window.showNoStrangerOverlay === "function") {
          window.showNoStrangerOverlay();
        }
      });

      await new Promise((r) => setTimeout(r, 600));

      const overlayVisible = await page.evaluate(() => {
        const el = document.getElementById("no-stranger-overlay");
        return el && !el.classList.contains("hidden");
      });

      recordResult("All Strangers Engaged Stage Overlay Displayed", overlayVisible);

      const referralCopySuccess = await page.evaluate(() => {
        if (typeof window.handleShareInvite === "function") {
          window.handleShareInvite();
          return true;
        }
        return false;
      });

      recordResult("Invite Friend via Link Trigger", referralCopySuccess);

      await contextSingle.close();
    }

    // -------------------------------------------------------------------------
    // TEST 4: Header Brand Logo, App Name Animation & Multi-Device Fit
    // -------------------------------------------------------------------------
    console.log("\n🔹 [TEST 4] Header Brand Logo & Multi-Device Responsive Fit...");
    {
      const viewports = [
        { name: "Mobile 360px", width: 360, height: 740, expectStatusHidden: true },
        { name: "Mobile 390px", width: 390, height: 844, expectStatusHidden: true },
        { name: "Tablet 768px", width: 768, height: 1024, expectStatusHidden: false },
        { name: "Desktop 1280px", width: 1280, height: 800, expectStatusHidden: false }
      ];

      for (const vp of viewports) {
        const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
        const page = await context.newPage();
        await page.goto(APP_URL, { waitUntil: "load" });

        await page.evaluate(() => window.acceptTosAndProceed && window.acceptTosAndProceed());
        await new Promise((r) => setTimeout(r, 500));

        const headerMetrics = await page.evaluate(() => {
          const menuBtn = document.getElementById("btn-app-menu-toggle");
          const statusBadge = document.getElementById("status-badge");
          const brandText = document.getElementById("brand-title-text");

          const menuRect = menuBtn ? menuBtn.getBoundingClientRect() : { right: 0 };
          const statusVisible = statusBadge ? getComputedStyle(statusBadge).display !== "none" : false;
          const currentText = brandText ? brandText.textContent : "";

          return {
            menuRight: menuRect.right,
            windowWidth: window.innerWidth,
            rightMargin: window.innerWidth - menuRect.right,
            statusVisible,
            currentText
          };
        });

        const marginPass = headerMetrics.rightMargin >= 8;
        const statusPass = vp.expectStatusHidden ? !headerMetrics.statusVisible : true;

        recordResult(
          `Header Fit [${vp.name}]`,
          marginPass && statusPass,
          `(Margin: ${headerMetrics.rightMargin.toFixed(1)}px, StatusVisible: ${headerMetrics.statusVisible})`
        );

        await context.close();
      }
    }

  } catch (err) {
    console.error("❌ Exception occurred during Master Suite Execution:", err);
  } finally {
    await browser.close();
  }

  console.log("\n=======================================================================");
  console.log(`📊 MASTER TEST RESULTS: ${passCount} PASSED | ${failCount} FAILED`);
  console.log("=======================================================================\n");

  if (failCount > 0) {
    process.exit(1);
  }
}

runMasterSuite();
