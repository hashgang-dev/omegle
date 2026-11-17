const { chromium } = require("playwright");

(async () => {
  console.log("==================================================");
  console.log("🛡️ RUNNING MULTI-DEVICE FORENSIC WATERMARK SUITE");
  console.log("==================================================");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--use-fake-ui-for-media-stream"]
  });

  const sampleImgData = "data:image/png;base64,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";

  // Matrix of devices to test
  const devices = [
    { name: "mobile_portrait", width: 412, height: 915 },
    { name: "mobile_compact", width: 360, height: 740 },
    { name: "tablet_ipad", width: 768, height: 1024 },
    { name: "mobile_landscape", width: 844, height: 390 },
    { name: "desktop_hd", width: 1280, height: 800 }
  ];

  for (const dev of devices) {
    console.log(`📱 Testing Device: ${dev.name} (${dev.width}x${dev.height})...`);
    const context = await browser.newContext({
      viewport: { width: dev.width, height: dev.height }
    });
    const page = await context.newPage();

    await page.goto("http://localhost:8000/", { waitUntil: "domcontentloaded" });
    const ageBtn = page.locator("#v2-btn-age-confirm");
    if (await ageBtn.isVisible()) {
      await ageBtn.click();
    }
    await page.waitForTimeout(600);

    // Open Lightbox
    await page.evaluate((imgData) => {
      window.currentNickname = "CyberSamurai";
      window.currentSessionTraceCode = "HGWPL5DJ";
      window.openV2Lightbox("image", imgData, true);
    }, sampleImgData);

    await page.waitForTimeout(600);

    // Check canvas, hold overlay and modal fit
    const metrics = await page.evaluate(() => {
      const modal = document.getElementById("v2-lightbox-modal");
      const card = document.getElementById("v2-lightbox-card");
      const canvas = document.getElementById("v2-lightbox-canvas");
      const holdOverlay = document.getElementById("v2-lightbox-hold-overlay");
      const cardRect = card.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();
      return {
        modalVisible: modal && !modal.classList.contains("hidden"),
        holdOverlayVisible: holdOverlay && !holdOverlay.classList.contains("hidden"),
        holdText: holdOverlay ? holdOverlay.textContent.trim() : "",
        cardWidth: Math.round(cardRect.width),
        cardHeight: Math.round(cardRect.height),
        canvasWidth: Math.round(canvasRect.width),
        canvasHeight: Math.round(canvasRect.height),
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
        fitsInViewport: cardRect.width <= window.innerWidth && cardRect.height <= window.innerHeight
      };
    });

    console.log(`  🔍 ${dev.name}: Card ${metrics.cardWidth}x${metrics.cardHeight} (Fits: ${metrics.fitsInViewport}) | Canvas: ${metrics.canvasWidth}x${metrics.canvasHeight} | Hold Overlay: ${metrics.holdOverlayVisible}`);
    if (!metrics.modalVisible) throw new Error(`Lightbox modal failed to open on ${dev.name}`);
    if (!metrics.fitsInViewport) throw new Error(`Lightbox card overflows viewport on ${dev.name}`);
    if (!metrics.holdOverlayVisible || !(metrics.holdText.includes("Touch & Hold") || metrics.holdText.includes("Hold down"))) {
      throw new Error(`Hold overlay failed to render on ${dev.name}`);
    }

    // Save screenshot for primary mobile hold prompt
    if (dev.name === "mobile_portrait") {
      const holdShotPath = "/home/hashgang/.gemini/antigravity/brain/bd6c5e22-7e3d-41f2-881e-6f3dd0a8bd74/shot_forensic_hold_prompt.png";
      await page.screenshot({ path: holdShotPath });
      console.log("  📸 Saved mobile hold prompt screenshot:", holdShotPath);

      // Trigger hold to reveal the canvas and watermark
      await page.evaluate(() => {
        const overlay = document.getElementById("v2-lightbox-hold-overlay");
        if (overlay && overlay.onmousedown) {
          overlay.onmousedown({ type: "mousedown", button: 0 });
        }
      });
      await page.waitForTimeout(300);

      const shotPath = "/home/hashgang/.gemini/antigravity/brain/bd6c5e22-7e3d-41f2-881e-6f3dd0a8bd74/shot_forensic_lightbox_view_once.png";
      await page.screenshot({ path: shotPath });
      console.log("  📸 Saved revealed mobile screenshot:", shotPath);
    } else if (dev.name === "desktop_hd") {
      // Trigger hold on desktop
      await page.evaluate(() => {
        const overlay = document.getElementById("v2-lightbox-hold-overlay");
        if (overlay && overlay.onmousedown) {
          overlay.onmousedown({ type: "mousedown", button: 0 });
        }
      });
      await page.waitForTimeout(300);

      const shotPath = "/home/hashgang/.gemini/antigravity/brain/bd6c5e22-7e3d-41f2-881e-6f3dd0a8bd74/shot_forensic_lightbox_desktop.png";
      await page.screenshot({ path: shotPath });
      console.log("  📸 Saved desktop screenshot:", shotPath);
    } else if (dev.name === "mobile_landscape") {
      // Trigger hold on landscape
      await page.evaluate(() => {
        const overlay = document.getElementById("v2-lightbox-hold-overlay");
        if (overlay && overlay.onmousedown) {
          overlay.onmousedown({ type: "mousedown", button: 0 });
        }
      });
      await page.waitForTimeout(300);

      const shotPath = "/home/hashgang/.gemini/antigravity/brain/bd6c5e22-7e3d-41f2-881e-6f3dd0a8bd74/shot_forensic_lightbox_landscape.png";
      await page.screenshot({ path: shotPath });
      console.log("  📸 Saved landscape screenshot:", shotPath);
    }

    // Clean close
    await page.evaluate(() => window.closeV2Lightbox());
    await page.waitForTimeout(200);
    await context.close();
  }

  console.log("==================================================");
  console.log("🧪 TESTING STRICT VIEW-ONCE IN-CHAT & SETTINGS");
  console.log("==================================================");

  const testContext = await browser.newContext({ viewport: { width: 412, height: 915 } });
  const testPage = await testContext.newPage();
  await testPage.goto("http://localhost:8000/", { waitUntil: "domcontentloaded" });
  const ageBtn = testPage.locator("#v2-btn-age-confirm");
  if (await ageBtn.isVisible()) await ageBtn.click();
  await testPage.waitForTimeout(500);

  // 1. Verify Clean Settings Modal (Obsolete Media Card Removed)
  await testPage.evaluate(() => {
    window.openV2SettingsModal();
  });
  await testPage.waitForTimeout(500);
  const settingsCardCheck = await testPage.evaluate(() => {
    const card = document.querySelector(".v2-media-privacy-status-card");
    const options = document.querySelector(".v2-media-privacy-options");
    return {
      cardExists: Boolean(card || options)
    };
  });
  console.log("  🔍 Settings Obsolete Media Card Check (Should be false):", settingsCardCheck);
  if (settingsCardCheck.cardExists) {
    throw new Error("Settings modal still has obsolete media privacy card!");
  }
  const settingsShotPath = "/home/hashgang/.gemini/antigravity/brain/bd6c5e22-7e3d-41f2-881e-6f3dd0a8bd74/shot_settings_strictly_view_once.png";
  await testPage.screenshot({ path: settingsShotPath });
  console.log("  📸 Saved clean settings modal screenshot:", settingsShotPath);
  await testPage.evaluate(() => window.closeV2SettingsModal());
  await testPage.waitForTimeout(400);

  // 1b. Verify Attachment Menu (Clean Camera Logo, No Dotted '1' Circle)
  console.log("  📎 Testing Attachment Menu Clean UI...");
  await testPage.evaluate(() => {
    window.openV2AttachmentMenu();
  });
  await testPage.waitForTimeout(400);
  const attachMenuCheck = await testPage.evaluate(() => {
    const modal = document.getElementById("v2-attachment-modal");
    const mediaTile = modal ? (modal.querySelector(".view-once-tile") || modal.querySelector(".media-tile")) : null;
    const hasTileIconBadge = mediaTile ? Boolean(mediaTile.querySelector(".v2-attach-tile-icon .v2-view-once-badge-icon")) : false;
    const hasInlineOneInLabel = mediaTile ? Boolean(mediaTile.querySelector(".v2-attach-tile-label .v2-view-once-inline-icon")) : false;
    const label = mediaTile ? mediaTile.querySelector(".v2-attach-tile-label")?.textContent.trim() : "";
    return {
      modalVisible: modal && !modal.classList.contains("hidden"),
      hasTileIconBadge,
      hasInlineOneInLabel,
      label
    };
  });
  console.log("  🔍 Attachment Menu Tile Check:", attachMenuCheck);
  if (!attachMenuCheck.modalVisible || !attachMenuCheck.hasTileIconBadge || attachMenuCheck.hasInlineOneInLabel || attachMenuCheck.label !== "Photo / Video") {
    throw new Error("Attachment menu tile does not match required UI (should have tile badge 1 and no inline 1 in label)!");
  }
  const attachShotPath = "/home/hashgang/.gemini/antigravity/brain/bd6c5e22-7e3d-41f2-881e-6f3dd0a8bd74/shot_attachment_menu_clean.png";
  await testPage.screenshot({ path: attachShotPath });
  console.log("  📸 Saved clean attachment menu screenshot:", attachShotPath);
  await testPage.evaluate(() => window.closeV2AttachmentMenu());
  await testPage.waitForTimeout(400);

  // 2. Verify In-Chat View-Once Flow (No 'Confidential' keyword)
  console.log("  💬 Testing In-Chat View-Once Flow...");
  const chatFlowResult = await testPage.evaluate((imgData) => {
    // Switch to text chat
    window.currentChatMode = "text";
    window.inCall = true;
    window.currentMatchTargetId = "remote-test-peer";

    const testMsgId = "msg-test-view-once-1";
    // Simulate incoming photo from stranger
    window.appendMediaMessage("Stranger", "image", imgData, "stranger", null, testMsgId, true);

    const drawer = document.getElementById("v2-chat-drawer");
    if (drawer) drawer.classList.remove("closed");

    const card = document.getElementById(`privacy-card-${testMsgId}`);
    if (card) card.scrollIntoView();
    const badge = card ? card.querySelector(".v2-view-once-badge-icon") : null;
    const revealBtn = card ? card.querySelector(".v2-media-reveal-btn") : null;

    const hasConfidential = card ? card.textContent.includes("Confidential") : false;
    const initialCardOk = Boolean(card && badge && revealBtn && !hasConfidential);

    return {
      initialCardOk,
      btnText: revealBtn ? revealBtn.textContent.trim() : "",
      msgId: testMsgId
    };
  }, sampleImgData);

  console.log("  🔍 Initial In-Chat Card:", chatFlowResult);
  if (!chatFlowResult.initialCardOk) throw new Error("In-Chat View-Once card failed to render!");

  const chatCardShotPath = "/home/hashgang/.gemini/antigravity/brain/bd6c5e22-7e3d-41f2-881e-6f3dd0a8bd74/shot_private_chat_view_once_card.png";
  await testPage.screenshot({ path: chatCardShotPath });
  console.log("  📸 Saved in-chat card screenshot:", chatCardShotPath);

  // 3. Reveal and verify Lightbox opening + hold start + burning on release
  await testPage.evaluate((msgId) => {
    window.revealMediaCard(msgId);
  }, chatFlowResult.msgId);
  await testPage.waitForTimeout(500);

  const lightboxState = await testPage.evaluate(() => {
    const modal = document.getElementById("v2-lightbox-modal");
    const countdown = document.getElementById("v2-countdown-text");
    const holdOverlay = document.getElementById("v2-lightbox-hold-overlay");
    return {
      visible: modal && !modal.classList.contains("hidden"),
      countdownVal: countdown ? countdown.textContent : "",
      hasHoldOverlay: holdOverlay && !holdOverlay.classList.contains("hidden")
    };
  });
  console.log("  🔍 Lightbox Active with Hold Overlay:", lightboxState);
  if (!lightboxState.visible || !lightboxState.hasHoldOverlay) throw new Error("Lightbox failed to open with hold overlay!");

  // Start hold down
  await testPage.evaluate(() => {
    const overlay = document.getElementById("v2-lightbox-hold-overlay");
    if (overlay && overlay.onmousedown) {
      overlay.onmousedown({ type: "mousedown", button: 0 });
    }
  });
  await testPage.waitForTimeout(400);

  // Release hold to burn media
  await testPage.evaluate(() => {
    window.dispatchEvent(new MouseEvent("mouseup"));
  });
  await testPage.waitForTimeout(500);

  const postBurnCheck = await testPage.evaluate((msgId) => {
    const card = document.getElementById(`privacy-card-${msgId}`);
    const isBurnedInMemory = typeof window.v2PendingChatMedia[msgId] === "undefined";
    const cardHasOpened = card && card.classList.contains("opened") && card.textContent.includes("Opened");
    return {
      isBurnedInMemory,
      cardHasOpened
    };
  }, chatFlowResult.msgId);

  console.log("  🔥 Post-Burn Verification:", postBurnCheck);
  if (!postBurnCheck.isBurnedInMemory || !postBurnCheck.cardHasOpened) {
    throw new Error("Media was not burned or card did not update to Opened on hold release!");
  }

  // 3b. Verify Multi-Touch Gesture Detection (Blackout Curtain)
  console.log("  🛡️ Testing Multi-Touch Gesture Detection...");
  const multiTouchCheck = await testPage.evaluate((imgData) => {
    window.openV2Lightbox("image", imgData, true);
    const fakeTouchEvent = new Event("touchstart", { bubbles: true, cancelable: true });
    Object.defineProperty(fakeTouchEvent, "touches", {
      value: [{ clientX: 100, clientY: 100 }, { clientX: 200, clientY: 200 }]
    });
    window.dispatchEvent(fakeTouchEvent);

    const blackout = document.getElementById("v2-lightbox-blackout");
    return {
      blackoutVisible: blackout && !blackout.classList.contains("hidden")
    };
  }, sampleImgData);

  console.log("  🔍 Multi-Touch Blackout Result:", multiTouchCheck);
  if (!multiTouchCheck.blackoutVisible) throw new Error("Multi-touch gesture failed to trigger blackout curtain!");
  await testPage.waitForTimeout(700); // allow blackout timeout to close cleanly

  // 4. Verify Sticker Wave-Back Filtering (Only greeting stickers have Wave Back)
  console.log("  👋 Testing Sticker Wave-Back Filter...");
  const stickerWaveTest = await testPage.evaluate(() => {
    // 4a. Regular Non-Greeting Sticker
    const regularMsgId = "msg-sticker-regular-1";
    window.appendMediaMessage("Stranger", "sticker", "https://media.giphy.com/media/random_cat/200.webp", "stranger", null, regularMsgId, false, false);
    const regularEl = document.getElementById(regularMsgId);
    const regularHasWave = regularEl ? Boolean(regularEl.querySelector(".v2-wave-back-wrap")) : false;

    // 4b. Greeting Sticker
    const greetingMsgId = "msg-sticker-greeting-1";
    window.appendMediaMessage("Stranger", "sticker", "https://media1.giphy.com/media/w1OBpBd7kJqHrJnJ13/200.webp", "stranger", null, greetingMsgId, false, true);
    const greetingEl = document.getElementById(greetingMsgId);
    const greetingHasWave = greetingEl ? Boolean(greetingEl.querySelector(".v2-wave-back-wrap")) : false;

    return {
      regularHasWave,
      greetingHasWave
    };
  });
  console.log("  🔍 Sticker Wave-Back Results:", stickerWaveTest);
  if (stickerWaveTest.regularHasWave) {
    throw new Error("Regular non-greeting sticker has Wave Back chip!");
  }
  if (!stickerWaveTest.greetingHasWave) {
    throw new Error("Greeting sticker is missing Wave Back chip!");
  }

  // 5. Verify Video View-Once Press & Hold, Playback & Release Burn
  console.log("  🎬 Testing Video View-Once Press & Hold Flow...");
  const sampleVideoUrl = "http://localhost:8000/assets/ads/vpn_ad.mp4";
  
  await testPage.evaluate((vidUrl) => {
    window.openV2Lightbox("video", vidUrl, true, () => {
      window._testVideoClosedCallbackFired = true;
    });
  }, sampleVideoUrl);
  await testPage.waitForTimeout(600);

  const videoLightboxState = await testPage.evaluate(() => {
    const modal = document.getElementById("v2-lightbox-modal");
    const holdOverlay = document.getElementById("v2-lightbox-hold-overlay");
    const holdTitle = document.getElementById("v2-hold-title");
    const holdSub = document.getElementById("v2-hold-sub");
    const video = document.getElementById("v2-lightbox-hidden-video");
    const canvas = document.getElementById("v2-lightbox-canvas");
    return {
      modalOpen: modal && !modal.classList.contains("hidden"),
      hasOverlay: holdOverlay && !holdOverlay.classList.contains("hidden"),
      title: holdTitle ? holdTitle.textContent : "",
      sub: holdSub ? holdSub.textContent : "",
      videoPaused: video ? video.paused : true,
      canvasBlurred: canvas && canvas.style.filter.includes("blur")
    };
  });
  console.log("  🔍 Video View-Once Lightbox State:", videoLightboxState);
  if (!videoLightboxState.modalOpen || !videoLightboxState.hasOverlay || !videoLightboxState.title.includes("Touch & Hold to Play") || !videoLightboxState.videoPaused || !videoLightboxState.canvasBlurred) {
    throw new Error("Video View-Once failed to initialize paused with Press & Hold overlay and blurred canvas!");
  }

  // Save video hold prompt screenshot
  const videoHoldShotPath = "/home/hashgang/.gemini/antigravity/brain/bd6c5e22-7e3d-41f2-881e-6f3dd0a8bd74/shot_forensic_video_hold_prompt.png";
  await testPage.screenshot({ path: videoHoldShotPath });
  console.log("  📸 Saved video hold prompt screenshot:", videoHoldShotPath);

  // Trigger hold on touch pad / overlay to start playing video
  await testPage.evaluate(() => {
    const pad = document.getElementById("v2-hold-touch-pad") || document.getElementById("v2-lightbox-hold-overlay");
    if (pad && pad.onmousedown) {
      pad.onmousedown({ type: "mousedown", button: 0 });
    }
  });
  await testPage.waitForTimeout(600);

  const videoPlayingState = await testPage.evaluate(() => {
    const holdOverlay = document.getElementById("v2-lightbox-hold-overlay");
    const video = document.getElementById("v2-lightbox-hidden-video");
    const canvas = document.getElementById("v2-lightbox-canvas");
    return {
      overlayHidden: holdOverlay && holdOverlay.classList.contains("hidden"),
      videoPlaying: video && !video.paused,
      canvasUnblurred: canvas && canvas.style.filter === "none"
    };
  });
  console.log("  🔍 Video Playing on Hold:", videoPlayingState);
  if (!videoPlayingState.overlayHidden || !videoPlayingState.videoPlaying || !videoPlayingState.canvasUnblurred) {
    throw new Error("Video failed to play and unblur on press & hold!");
  }

  // Release hold to burn video
  await testPage.evaluate(() => {
    window.dispatchEvent(new MouseEvent("mouseup"));
  });
  await testPage.waitForTimeout(500);

  const postVideoBurnState = await testPage.evaluate(() => {
    const modal = document.getElementById("v2-lightbox-modal");
    const video = document.getElementById("v2-lightbox-hidden-video");
    return {
      modalClosed: modal && modal.classList.contains("hidden"),
      videoDestroyed: video && (video.paused || !video.src),
      callbackFired: Boolean(window._testVideoClosedCallbackFired)
    };
  });
  console.log("  🔥 Video Post-Burn State:", postVideoBurnState);
  if (!postVideoBurnState.modalClosed || !postVideoBurnState.callbackFired) {
    throw new Error("Video failed to close and destroy on hold release!");
  }

  console.log("==================================================");
  console.log("🎉 ALL MULTI-DEVICE & STRICT VIEW-ONCE TESTS PASSED!");
  console.log("==================================================");

  await testContext.close();
  await browser.close();
})();
