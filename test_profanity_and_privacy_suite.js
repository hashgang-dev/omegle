const { chromium } = require("playwright");

(async () => {
  console.log("🚀 Starting E2E verification for Multilingual Profanity Filter & Media Shielding...");

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"]
  });

  const context = await browser.newContext({
    permissions: ["camera", "microphone"],
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();
  
  // Capture page console logs
  page.on("console", msg => {
    if (msg.type() === "error") {
      console.log(`[Browser Error]: ${msg.text()}`);
    }
  });

  await page.goto("http://localhost:8000/index.html", { waitUntil: "networkidle" });

  // 1. Check window.HashGangModeration
  const moderationLoaded = await page.evaluate(() => {
    return typeof window.HashGangModeration !== "undefined" &&
           typeof window.containsUnparliamentaryWords === "function";
  });
  console.log("✅ 1. HashGangModeration loaded:", moderationLoaded);
  if (!moderationLoaded) {
    throw new Error("HashGangModeration or containsUnparliamentaryWords not defined on window!");
  }

  // 2. Test word moderation checks in browser context
  const testCases = await page.evaluate(() => {
    const fn = window.containsUnparliamentaryWords;
    return {
      suckAllowed: !fn("this game sucks"),
      suckWordAllowed: !fn("suck"),
      dengueAllowed: !fn("I have dengue fever"),
      helloAllowed: !fn("Hello friend!"),
      // English profanity blocked
      fuckBlocked: fn("what the fuck"),
      fukSpacedBlocked: fn("f u c k this"),
      bitchBlocked: fn("b.i.t.c.h"),
      // Telugu profanity blocked
      lanjaBlocked: fn("lanja"),
      denguBlocked: fn("dengu"),
      teluguScriptBlocked: fn("దెంగు"),
      // Hindi profanity blocked
      madarchodBlocked: fn("madarchod"),
      chutiyaBlocked: fn("chutiya"),
      hindiScriptBlocked: fn("मादरचोद"),
      // Spanish profanity blocked
      pendejoBlocked: fn("eres un pendejo"),
      // French profanity blocked
      merdeBlocked: fn("merde")
    };
  });

  console.log("✅ 2. Moderation engine results:", testCases);
  for (const [key, value] of Object.entries(testCases)) {
    if (!value) {
      throw new Error(`Moderation rule failed for test case: ${key}`);
    }
  }

  // 3. Test Nickname Modal Space Replacement & Inline Error
  console.log("Testing Nickname Modal space auto-replace and unparliamentary warning...");
  await page.evaluate(() => {
    window.__E2E_BYPASS_NICK_COOLDOWN__ = true;
    window.promptEditNickname();
  });

  await page.waitForSelector("#v2-input-new-nick", { state: "visible" });

  // Type spaces: "Super Cool Guy" -> should become "Super_Cool_Guy"
  const nickInput = page.locator("#v2-input-new-nick");
  await nickInput.fill("");
  await nickInput.pressSequentially("Super Cool Guy", { delay: 20 });
  const valWithUnderscores = await nickInput.inputValue();
  console.log("✅ 3a. Space replacement check:", valWithUnderscores);
  if (valWithUnderscores !== "Super_Cool_Guy") {
    throw new Error(`Expected 'Super_Cool_Guy', got '${valWithUnderscores}'`);
  }

  // Type unparliamentary name
  await nickInput.fill("");
  await nickInput.pressSequentially("bad_fuck_user", { delay: 20 });
  const errorText = await page.evaluate(() => {
    const err = document.getElementById("v2-nick-inline-error");
    return err ? err.innerText : "";
  });
  console.log("✅ 3b. Unparliamentary name inline warning:", errorText);
  if (!errorText.includes("unparliamentary")) {
    throw new Error(`Expected inline error warning, got: '${errorText}'`);
  }

  // Try saving the unparliamentary name -> should be blocked
  await page.evaluate(() => window.saveNewNickname());
  const errorTextAfterSave = await page.evaluate(() => {
    const err = document.getElementById("v2-nick-inline-error");
    return err ? err.innerText : "";
  });
  if (!errorTextAfterSave.includes("unparliamentary")) {
    throw new Error("saveNewNickname allowed unparliamentary name!");
  }
  console.log("✅ 3c. Unparliamentary nickname blocked from saving successfully.");

  // Close modal
  await page.evaluate(() => window.closeNicknameModal());

  // 4. Test Public Group Chat Unparliamentary Word Blocking
  console.log("Testing Public Group Chat profanity blocking...");
  // Navigate to group lounge
  await page.evaluate(() => {
    if (typeof window.switchMode === "function") {
      window.switchMode("group");
    }
  });
  await page.waitForTimeout(500);

  const groupInput = page.locator("#v2-group-input-field");
  await groupInput.fill("what the fuck is this");
  await page.evaluate(() => {
    window.sendGroupMessage();
  });

  const dockHint = await page.evaluate(() => {
    const hint = document.getElementById("v2-group-dock-hint");
    return hint ? hint.innerText : "";
  });
  console.log("✅ 4a. Group chat abusive message dock hint:", dockHint);
  if (!dockHint.includes("Unparliamentary words are not allowed")) {
    throw new Error(`Expected dock hint warning for abusive message, got: '${dockHint}'`);
  }

  // Test allowed message: "this game sucks"
  await groupInput.fill("this game sucks");
  await page.evaluate(() => {
    // Clear lastGroupMsgTime to bypass rate limit
    window.lastGroupMsgTime = 0;
    // Mock socket emit to avoid real network emit error
    if (window.socket) {
      window.__emittedGroupMsgs = [];
      const origEmit = window.socket.emit;
      window.socket.emit = function(event, data) {
        if (event === "send_group_msg") {
          window.__emittedGroupMsgs.push(data);
        }
        return origEmit.apply(this, arguments);
      };
    }
    window.sendGroupMessage();
  });

  const sucksEmitted = await page.evaluate(() => {
    return window.__emittedGroupMsgs && window.__emittedGroupMsgs.length > 0;
  });
  console.log("✅ 4b. 'this game sucks' allowed in group chat:", sucksEmitted);
  if (!sucksEmitted) {
    throw new Error("'this game sucks' was blocked unexpectedly!");
  }

  // 5. Verify 1v1 Private Chat DOES NOT filter profanity
  console.log("Testing 1v1 Private Chat allows banter / words...");
  await page.evaluate(() => {
    if (typeof window.switchMode === "function") {
      window.switchMode("text");
    }
    window.currentMatchTargetId = "dummy-target-123";
    window.__emittedPrivateSignals = [];
    if (window.socket) {
      const origEmit = window.socket.emit;
      window.socket.emit = function(event, data) {
        if (event === "signal") {
          window.__emittedPrivateSignals.push(data);
        }
        return origEmit.apply(this, arguments);
      };
    }
    const input = document.getElementById("chat-input");
    if (input) input.value = "damn what the fuck bro";
    window.sendChatMessage();
  });

  const privateSignalEmitted = await page.evaluate(() => {
    return window.__emittedPrivateSignals && window.__emittedPrivateSignals.some(s => s.signal && s.signal.text === "damn what the fuck bro");
  });
  console.log("✅ 5. 1v1 Private Chat allows text without restriction:", privateSignalEmitted);
  if (!privateSignalEmitted) {
    throw new Error("1v1 private chat filtered text when it should NOT have!");
  }

  // 6. Test Media Shielding in Group Chat & 1v1:
  // - Certified greeting sticker is direct display
  // - External GIF / sticker is shielded with Tap to View
  console.log("Testing Greeting sticker vs External GIF Tap to View...");
  const mediaShieldingTest = await page.evaluate(() => {
    localStorage.setItem("hg_media_display_mode", "tap_to_view");

    // Test greeting sticker row
    const greetingRow = window.renderGroupMessageRow({
      id: "grp-test-1",
      senderNick: "Alice",
      gif: { url: "/assets/stickers/greeting-wave.webp", type: "sticker", isGreeting: true },
      text: "Hi 👋",
      timestamp: Date.now()
    }, false);

    // Test external GIF row
    const gifRow = window.renderGroupMessageRow({
      id: "grp-test-2",
      senderNick: "Bob",
      gif: { url: "https://media.giphy.com/media/test/giphy.gif", type: "gif" },
      timestamp: Date.now()
    }, false);

    const greetingHasShield = greetingRow.outerHTML.includes("v2-media-privacy-card");
    const gifHasShield = gifRow.outerHTML.includes("v2-media-privacy-card");
    const gifHasTapToView = gifRow.outerHTML.includes("Tap to View");

    return {
      greetingHasShield,
      gifHasShield,
      gifHasTapToView
    };
  });

  console.log("✅ 6. Media Shielding results:", mediaShieldingTest);
  if (mediaShieldingTest.greetingHasShield) {
    throw new Error("Greeting sticker was shielded when it should be Direct Display!");
  }
  if (!mediaShieldingTest.gifHasShield || !mediaShieldingTest.gifHasTapToView) {
    throw new Error("External GIF was NOT shielded with Tap to View!");
  }

  console.log("\n🎉 ALL E2E VERIFICATIONS PASSED WITH 100% SUCCESS!");
  await browser.close();
})();
