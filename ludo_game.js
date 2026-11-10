/**
 * HashGANG Ludo Multiplayer Engine (Canvas 2D + WebRTC Audio Mesh)
 * Supports 2-Player (1v1 Duel) and 4-Player (Classic) with zero server media cost.
 */

(function () {
  const LUDO_CANVAS_SIZE = 480;
  const CELL_SIZE = LUDO_CANVAS_SIZE / 15; // 32px

  const COLOR_PALETTES = {
    red: { base: "#EF4444", dark: "#B91C1C", light: "#FCA5A5", border: "#991B1B" },
    green: { base: "#10B981", dark: "#047857", light: "#6EE7B7", border: "#065F46" },
    yellow: { base: "#F59E0B", dark: "#D97706", light: "#FCD34D", border: "#B45309" },
    blue: { base: "#3B82F6", dark: "#1D4ED8", light: "#93C5FD", border: "#1E40AF" }
  };

  // Safe star squares on 52-step track
  const SAFE_STARS = [0, 8, 13, 21, 26, 34, 39, 47];

  // Global 52-square track coordinates (col, row)
  const TRACK_COORDS = [
    { c: 1, r: 6 },  { c: 2, r: 6 },  { c: 3, r: 6 },  { c: 4, r: 6 },  { c: 5, r: 6 },
    { c: 6, r: 5 },  { c: 6, r: 4 },  { c: 6, r: 3 },  { c: 6, r: 2 },  { c: 6, r: 1 },  { c: 6, r: 0 },
    { c: 7, r: 0 },
    { c: 8, r: 0 },  { c: 8, r: 1 },  { c: 8, r: 2 },  { c: 8, r: 3 },  { c: 8, r: 4 },  { c: 8, r: 5 },
    { c: 9, r: 6 },  { c: 10, r: 6 }, { c: 11, r: 6 }, { c: 12, r: 6 }, { c: 13, r: 6 }, { c: 14, r: 6 },
    { c: 14, r: 7 },
    { c: 14, r: 8 }, { c: 13, r: 8 }, { c: 12, r: 8 }, { c: 11, r: 8 }, { c: 10, r: 8 }, { c: 9, r: 8 },
    { c: 8, r: 9 },  { c: 8, r: 10 }, { c: 8, r: 11 }, { c: 8, r: 12 }, { c: 8, r: 13 }, { c: 8, r: 14 },
    { c: 7, r: 14 },
    { c: 6, r: 14 }, { c: 6, r: 13 }, { c: 6, r: 12 }, { c: 6, r: 11 }, { c: 6, r: 10 }, { c: 6, r: 9 },
    { c: 5, r: 8 },  { c: 4, r: 8 },  { c: 3, r: 8 },  { c: 2, r: 8 },  { c: 1, r: 8 },  { c: 0, r: 8 },
    { c: 0, r: 7 },
    { c: 0, r: 6 }
  ];

  // Private Home Columns (steps 51 to 55)
  const HOME_COLUMNS = {
    red:    [ { c: 1, r: 7 }, { c: 2, r: 7 }, { c: 3, r: 7 }, { c: 4, r: 7 }, { c: 5, r: 7 } ],
    green:  [ { c: 7, r: 1 }, { c: 7, r: 2 }, { c: 7, r: 3 }, { c: 7, r: 4 }, { c: 7, r: 5 } ],
    yellow: [ { c: 13, r: 7 }, { c: 12, r: 7 }, { c: 11, r: 7 }, { c: 10, r: 7 }, { c: 9, r: 7 } ],
    blue:   [ { c: 7, r: 13 }, { c: 7, r: 12 }, { c: 7, r: 11 }, { c: 7, r: 10 }, { c: 7, r: 9 } ]
  };

  // Center Home Goals (step 56)
  const GOAL_COORDS = { c: 7, r: 7 };

  // Yard token slot coordinates
  const YARD_SLOTS = {
    red:    [ { c: 1.5, r: 1.5 }, { c: 3.5, r: 1.5 }, { c: 1.5, r: 3.5 }, { c: 3.5, r: 3.5 } ],
    green:  [ { c: 10.5, r: 1.5 }, { c: 12.5, r: 1.5 }, { c: 10.5, r: 3.5 }, { c: 12.5, r: 3.5 } ],
    blue:   [ { c: 1.5, r: 10.5 }, { c: 3.5, r: 10.5 }, { c: 1.5, r: 12.5 }, { c: 3.5, r: 12.5 } ],
    yellow: [ { c: 10.5, r: 10.5 }, { c: 12.5, r: 10.5 }, { c: 10.5, r: 12.5 }, { c: 12.5, r: 12.5 } ]
  };

  // State
  let currentGame = null;
  let canvas = null;
  let ctx = null;
  let animFrameId = null;
  let pulseAngle = 0;
  let timerInterval = null;
  let turnSecondsLeft = 60;

  // WebRTC Mesh Voice State
  let localAudioStream = null;
  let isMicMuted = false;
  const peerConnections = new Map(); // socketId -> RTCPeerConnection

  // Sound management: Preloaded Authentic MP3 with Web Audio buffer for zero-latency playback
  let audioCtx = null;
  let diceAudioBuffer = null;
  let diceAudioElement = null;

  function getAudioCtx() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function preloadDiceSound() {
    try {
      diceAudioElement = new Audio("assets/dice-roll.mp3");
      diceAudioElement.preload = "auto";
      diceAudioElement.volume = 0.95;

      fetch("assets/dice-roll.mp3")
        .then(res => res.arrayBuffer())
        .then(arrayBuffer => {
          const actx = getAudioCtx();
          if (actx && actx.decodeAudioData) {
            actx.decodeAudioData(arrayBuffer, (decoded) => {
              diceAudioBuffer = decoded;
              console.log("🎲 [Ludo Audio] Authentic dice-roll.mp3 preloaded into memory.");
            }, () => {});
          }
        })
        .catch(() => {});
    } catch (e) {}
  }
  preloadDiceSound();

  function playLudoChime(type) {
    try {
      const actx = getAudioCtx();
      const now = actx ? actx.currentTime : 0;

      if (type === "roll") {
        // Priority 1: Zero-latency Web Audio Buffer playback
        if (actx && diceAudioBuffer) {
          try {
            const source = actx.createBufferSource();
            const gain = actx.createGain();
            source.buffer = diceAudioBuffer;
            gain.gain.setValueAtTime(0.95, actx.currentTime);
            source.connect(gain);
            gain.connect(actx.destination);
            source.start(0);
            return;
          } catch (e) {}
        }

        // Priority 2: HTML5 Audio element clone playback
        if (diceAudioElement) {
          try {
            const clone = diceAudioElement.cloneNode();
            clone.volume = 0.95;
            clone.play().catch(() => {});
            return;
          } catch (e) {}
        }

        // Priority 3: Fallback tactile synthesis
        if (actx) {
          const clicks = [
            { delay: 0.00, freq: 750, dur: 0.035, vol: 0.55 },
            { delay: 0.04, freq: 520, dur: 0.035, vol: 0.60 },
            { delay: 0.09, freq: 880, dur: 0.040, vol: 0.65 },
            { delay: 0.14, freq: 640, dur: 0.045, vol: 0.70 },
            { delay: 0.20, freq: 380, dur: 0.070, vol: 0.85 }
          ];
          clicks.forEach(({ delay, freq, dur, vol }) => {
            const t = now + delay;
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(Math.max(60, freq * 0.4), t + dur);
            gain.gain.setValueAtTime(vol, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
            osc.connect(gain);
            gain.connect(actx.destination);
            osc.start(t);
            osc.stop(t + dur);
          });
        }
        return;
      } else if (type === "settle") {
        // MP3 already contains natural roll & settle sound, no extra synthetic noise needed
        return;
      } else if (type === "hop") {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === "cut") {
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start(now);
        osc.stop(now + 0.26);
      } else if (type === "home" || type === "win") {
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0.18, now + i * 0.08);
          gain.gain.linearRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
          osc.connect(gain);
          gain.connect(actx.destination);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.22);
        });
      }
    } catch (e) {}
  }

  // ==========================================
  // Board Rendering (Crisp Canvas 2D)
  // ==========================================

  function initLudoCanvas() {
    canvas = document.getElementById("v2-ludo-canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    if (!canvas.__ludoEventsBound) {
      canvas.__ludoEventsBound = true;
      // Click / Touch listener on canvas to select movable tokens
      canvas.addEventListener("click", handleCanvasClick);
      canvas.addEventListener("touchstart", (e) => {
        if (e.touches && e.touches[0]) {
          const rect = canvas.getBoundingClientRect();
          const x = e.touches[0].clientX - rect.left;
          const y = e.touches[0].clientY - rect.top;
          handleTokenSelectionAt(x * (canvas.width / rect.width), y * (canvas.height / rect.height));
        }
      }, { passive: true });
    }

    startRenderLoop();
  }

  function startRenderLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    function loop() {
      pulseAngle += 0.06;
      drawLudoBoard();
      animFrameId = requestAnimationFrame(loop);
    }
    loop();
  }

  function drawLudoBoard() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, LUDO_CANVAS_SIZE, LUDO_CANVAS_SIZE);

    // 1. Background
    ctx.fillStyle = "#0F172A"; // Modern Dark Slate
    ctx.fillRect(0, 0, LUDO_CANVAS_SIZE, LUDO_CANVAS_SIZE);

    // 2. Draw 4 Corner Yards
    drawYard(0, 0, "red");
    drawYard(9, 0, "green");
    drawYard(0, 9, "blue");
    drawYard(9, 9, "yellow");

    // 3. Draw Track Grid (Center Cross: columns 6,7,8 & rows 6,7,8)
    for (let c = 0; c < 15; c++) {
      for (let r = 0; r < 15; r++) {
        // Skip corner yards and center goal
        if ((c < 6 && r < 6) || (c > 8 && r < 6) || (c < 6 && r > 8) || (c > 8 && r > 8)) continue;
        if (c >= 6 && c <= 8 && r >= 6 && r <= 8) continue; // Center handled separately

        const x = c * CELL_SIZE;
        const y = r * CELL_SIZE;

        // Base cell
        ctx.fillStyle = "#1E293B";
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

        // Colored Home Columns
        if (r === 7 && c >= 1 && c <= 5) {
          ctx.fillStyle = COLOR_PALETTES.red.base;
          ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        } else if (c === 7 && r >= 1 && r <= 5) {
          ctx.fillStyle = COLOR_PALETTES.green.base;
          ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        } else if (r === 7 && c >= 9 && c <= 13) {
          ctx.fillStyle = COLOR_PALETTES.yellow.base;
          ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        } else if (c === 7 && r >= 9 && r <= 13) {
          ctx.fillStyle = COLOR_PALETTES.blue.base;
          ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        }

        // Starting Squares Colors
        if (c === 1 && r === 6) drawStartCell(x, y, "red");
        if (c === 8 && r === 1) drawStartCell(x, y, "green");
        if (c === 13 && r === 8) drawStartCell(x, y, "yellow");
        if (c === 6 && r === 13) drawStartCell(x, y, "blue");
      }
    }

    // 4. Draw Safe Star Icons
    SAFE_STARS.forEach((idx) => {
      const coord = TRACK_COORDS[idx];
      if (coord) {
        drawStar(coord.c * CELL_SIZE + CELL_SIZE / 2, coord.r * CELL_SIZE + CELL_SIZE / 2, 7, "#FCD34D");
      }
    });

    // 5. Draw Center Goal (Triangles)
    drawCenterTriangles();

    // 6. Draw Player Tokens
    drawAllTokens();
  }

  function drawYard(col, row, colorKey) {
    const pal = COLOR_PALETTES[colorKey];
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;
    const size = 6 * CELL_SIZE;

    const isColorActive = currentGame && currentGame.players && currentGame.players.some(p => p.color === colorKey);
    const isMe = currentGame && currentGame.myColor === colorKey;

    ctx.save();
    if (currentGame && !isColorActive) {
      // Dim inactive player quadrant for visual clarity
      ctx.globalAlpha = 0.25;
    }

    // Outer box
    ctx.fillStyle = pal.base;
    ctx.fillRect(x, y, size, size);

    // Inner White Box
    ctx.fillStyle = "#FFFFFF";
    const pad = CELL_SIZE * 0.9;
    ctx.fillRect(x + pad, y + pad, size - pad * 2, size - pad * 2);

    // 4 Token Yard Circles
    const slots = YARD_SLOTS[colorKey];
    slots.forEach((s) => {
      const cx = s.c * CELL_SIZE;
      const cy = s.r * CELL_SIZE;
      ctx.beginPath();
      ctx.arc(cx, cy, CELL_SIZE * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = pal.dark;
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // If this is MY quadrant, draw a prominent golden "YOU" badge in the center!
    if (isMe) {
      const centerX = x + size / 2;
      const centerY = y + size / 2;
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      const badgeW = 64;
      const badgeH = 22;
      if (ctx.roundRect) {
        ctx.roundRect(centerX - badgeW / 2, centerY - badgeH / 2, badgeW, badgeH, 11);
      } else {
        ctx.rect(centerX - badgeW / 2, centerY - badgeH / 2, badgeW, badgeH);
      }
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⭐ YOU", centerX, centerY);
      ctx.restore();
    }

    ctx.restore();
  }

  function drawStartCell(x, y, colorKey) {
    ctx.fillStyle = COLOR_PALETTES[colorKey].base;
    ctx.fillRect(x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4);
    // Draw arrow pointing along direction
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawStar(cx, cy, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(
        cx + radius * Math.cos(((18 + i * 72) * Math.PI) / 180),
        cy - radius * Math.sin(((18 + i * 72) * Math.PI) / 180)
      );
      ctx.lineTo(
        cx + (radius / 2) * Math.cos(((54 + i * 72) * Math.PI) / 180),
        cy - (radius / 2) * Math.sin(((54 + i * 72) * Math.PI) / 180)
      );
    }
    ctx.closePath();
    ctx.fill();
  }

  function drawCenterTriangles() {
    const cx = 7.5 * CELL_SIZE;
    const cy = 7.5 * CELL_SIZE;
    const left = 6 * CELL_SIZE;
    const right = 9 * CELL_SIZE;
    const top = 6 * CELL_SIZE;
    const bottom = 9 * CELL_SIZE;

    // Red (Left)
    ctx.fillStyle = COLOR_PALETTES.red.base;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(cx, cy);
    ctx.lineTo(left, bottom);
    ctx.closePath();
    ctx.fill();

    // Green (Top)
    ctx.fillStyle = COLOR_PALETTES.green.base;
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(cx, cy);
    ctx.lineTo(right, top);
    ctx.closePath();
    ctx.fill();

    // Yellow (Right)
    ctx.fillStyle = COLOR_PALETTES.yellow.base;
    ctx.beginPath();
    ctx.moveTo(right, top);
    ctx.lineTo(cx, cy);
    ctx.lineTo(right, bottom);
    ctx.closePath();
    ctx.fill();

    // Blue (Bottom)
    ctx.fillStyle = COLOR_PALETTES.blue.base;
    ctx.beginPath();
    ctx.moveTo(left, bottom);
    ctx.lineTo(cx, cy);
    ctx.lineTo(right, bottom);
    ctx.closePath();
    ctx.fill();
  }

  function drawAllTokens() {
    if (!currentGame || !Array.isArray(currentGame.players)) return;

    currentGame.players.forEach((player) => {
      if (player.isSilent) return;
      const pal = COLOR_PALETTES[player.color];
      const isMyPlayer = currentGame.myColor === player.color;
      const isTurn = currentGame.activeColor === player.color;

      player.tokens.forEach((step, tIdx) => {
        const { x, y } = getTokenCoordinates(player.color, step, tIdx);
        const isMovable = isMyPlayer && isTurn && Array.isArray(currentGame.movableTokens) && currentGame.movableTokens.includes(tIdx);

        // Movable Token Neon Pulsing Glow & Bouncing Target Arrow
        if (isMovable) {
          const pulse = (Math.sin(pulseAngle) + 1) / 2; // 0 to 1
          ctx.save();

          // Inner gold glow ring
          ctx.beginPath();
          ctx.arc(x, y, 17 + pulse * 4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(251, 191, 36, ${0.7 + pulse * 0.3})`;
          ctx.lineWidth = 3.5;
          ctx.stroke();

          // Outer radiating wave ring
          ctx.beginPath();
          ctx.arc(x, y, 22 + pulse * 7, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(250, 204, 21, ${(1 - pulse) * 0.7})`;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Bouncing indicator arrow above token
          const arrowBounce = Math.sin(pulseAngle * 2.5) * 4;
          ctx.fillStyle = "#FBBF24";
          ctx.font = "bold 13px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("▼", x, y - 20 + arrowBounce);

          ctx.restore();
        }

        // Draw 3D-Styled Token Chip
        drawSingleToken(x, y, pal, isMovable);
      });
    });
  }

  function getTokenCoordinates(color, step, tokenIndex) {
    // 1. In Yard
    if (step === -1) {
      const slot = YARD_SLOTS[color][tokenIndex];
      return { x: slot.c * CELL_SIZE, y: slot.r * CELL_SIZE };
    }
    // 2. Goal (Home)
    if (step >= 56) {
      const offsets = [
        { dx: -12, dy: -12 },
        { dx: 12, dy: -12 },
        { dx: -12, dy: 12 },
        { dx: 12, dy: 12 }
      ];
      const off = offsets[tokenIndex] || { dx: 0, dy: 0 };
      return {
        x: (GOAL_COORDS.c + 0.5) * CELL_SIZE + off.dx,
        y: (GOAL_COORDS.r + 0.5) * CELL_SIZE + off.dy
      };
    }
    // 3. In Private Home Column (51 to 55)
    if (step >= 51 && step <= 55) {
      const colCoord = HOME_COLUMNS[color][step - 51];
      return { x: (colCoord.c + 0.5) * CELL_SIZE, y: (colCoord.r + 0.5) * CELL_SIZE };
    }
    // 4. On Global Track (0 to 50)
    const offset = { red: 0, green: 13, yellow: 26, blue: 39 }[color] || 0;
    const globalIdx = (step + offset) % 52;
    const trackCoord = TRACK_COORDS[globalIdx];
    return { x: (trackCoord.c + 0.5) * CELL_SIZE, y: (trackCoord.r + 0.5) * CELL_SIZE };
  }

  function drawSingleToken(cx, cy, pal, isHighlighted) {
    ctx.save();
    // Drop Shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    // Outer Circle (Dark border)
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = pal.border;
    ctx.fill();

    // Body Gradient
    const grad = ctx.createRadialGradient(cx - 3, cy - 3, 2, cx, cy, 11);
    grad.addColorStop(0, pal.light);
    grad.addColorStop(0.6, pal.base);
    grad.addColorStop(1, pal.dark);

    ctx.shadowColor = "transparent";
    ctx.beginPath();
    ctx.arc(cx, cy, 10.5, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Center Pip
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    ctx.restore();
  }

  // ==========================================
  // Interactive Token Selection
  // ==========================================

  function handleCanvasClick(e) {
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    handleTokenSelectionAt(x, y);
  }

  function handleTokenSelectionAt(clickX, clickY) {
    if (!currentGame || !currentGame.isMyTurn) return;
    if (currentGame.dice === null) {
      if (typeof v2ShowToast === "function") v2ShowToast("🎲 Roll the dice first!");
      return;
    }
    if (!Array.isArray(currentGame.movableTokens) || currentGame.movableTokens.length === 0) return;

    const myPlayer = currentGame.players.find(p => p.color === currentGame.myColor);
    if (!myPlayer) return;

    // Check which movable token was clicked
    let selectedToken = null;
    let minDist = 38; // Generous touch/click tolerance radius (38px)

    currentGame.movableTokens.forEach((tIdx) => {
      const step = myPlayer.tokens[tIdx];
      const { x, y } = getTokenCoordinates(myPlayer.color, step, tIdx);
      const dist = Math.hypot(clickX - x, clickY - y);
      if (dist < minDist) {
        minDist = dist;
        selectedToken = tIdx;
      }
    });

    // If exactly 1 movable token and player clicked canvas, auto-select it even if slightly off target
    if (selectedToken === null && currentGame.movableTokens.length === 1) {
      selectedToken = currentGame.movableTokens[0];
    }

    if (selectedToken !== null) {
      console.log(`🎯 [Ludo] Selected Token Index: ${selectedToken}`);
      playLudoChime("hop");
      if (window.socket && window.socket.connected) {
        window.socket.emit("ludo_move_token", { tokenIndex: selectedToken });
      }
    }
  }

  // ==========================================
  // Dice Roll & Controls
  // ==========================================

  window.rollLudoDice = function () {
    if (!currentGame || !currentGame.isMyTurn) {
      if (typeof v2ShowToast === "function") v2ShowToast("⏳ Please wait for your turn!");
      return;
    }
    if (currentGame.dice !== null) {
      if (Array.isArray(currentGame.movableTokens) && currentGame.movableTokens.length === 1) {
        if (window.socket && window.socket.connected) {
          window.socket.emit("ludo_move_token", { tokenIndex: currentGame.movableTokens[0] });
        }
        return;
      }
      if (typeof v2ShowToast === "function") v2ShowToast("👆 Select one of your highlighted tokens to move!");
      return;
    }
    if (isDiceRollingAnimationActive) {
      return;
    }

    playLudoChime("roll");

    if (window.socket && window.socket.connected) {
      window.socket.emit("ludo_roll_dice", { gameId: currentGame.gameId });
    }
  };

  // Realistic Physical Dice Face Generator (3x3 Grid Dots)
  function renderRealisticDiceFace(val) {
    const safeVal = Math.max(1, Math.min(6, parseInt(val, 10) || 1));
    const pipsConfig = {
      1: ["pip-center"],
      2: ["pip-tl", "pip-br"],
      3: ["pip-tl", "pip-center", "pip-br"],
      4: ["pip-tl", "pip-tr", "pip-bl", "pip-br"],
      5: ["pip-tl", "pip-tr", "pip-center", "pip-bl", "pip-br"],
      6: ["pip-tl", "pip-tr", "pip-ml", "pip-mr", "pip-bl", "pip-br"]
    };
    const pips = pipsConfig[safeVal] || pipsConfig[1];
    const isOne = (safeVal === 1);
    return `
      <div class="v2-real-dice-face face-${safeVal} ${isOne ? 'is-one' : ''}">
        ${pips.map(p => `<span class="dice-pip ${p}"></span>`).join("")}
      </div>
    `;
  }

  function displayDiceValue(val) {
    const diceDisplay = document.getElementById("v2-ludo-dice-display");
    if (!diceDisplay) return;
    diceDisplay.innerHTML = renderRealisticDiceFace(val);
    diceDisplay.setAttribute("data-face", val);
  }

  // Realistic Physical 3D Center Dice Roll (Flies from action bar to center, rolls ~1.8s, flies back)
  let isDiceRollingAnimationActive = false;

  function animateCenterDiceRoll(val, colorKey, onComplete) {
    const popup = document.getElementById("v2-ludo-center-dice-popup");
    const dockDiceBtn = document.getElementById("v2-ludo-dice-btn");
    if (!popup) {
      if (typeof onComplete === "function") onComplete();
      return;
    }

    isDiceRollingAnimationActive = true;
    if (dockDiceBtn) dockDiceBtn.classList.add("rolling-flight");

    popup.classList.remove("hidden", "flying-back", "pop-out");
    popup.classList.add("flying-in");

    let count = 0;
    const maxTumbleCount = 20; // 20 * 85ms ≈ 1.7 seconds of suspenseful tumbling
    const interval = setInterval(() => {
      const randomFace = Math.floor(Math.random() * 6) + 1;
      const rotX = Math.floor(Math.random() * 60) - 30;
      const rotY = Math.floor(Math.random() * 60) - 30;
      const rotZ = Math.floor(Math.random() * 40) - 20;

      popup.innerHTML = `
        <div class="v2-real-3d-center-dice ${colorKey}" style="transform: rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg);">
          ${renderRealisticDiceFace(randomFace)}
        </div>
      `;
      count++;

      if (count >= maxTumbleCount) {
        clearInterval(interval);

        // 1. Settle on the actual rolled value!
        popup.innerHTML = `
          <div class="v2-real-3d-center-dice ${colorKey} settled">
            ${renderRealisticDiceFace(val)}
          </div>
        `;
        playLudoChime("settle");

        // 2. Fly back to the action bar dock after 450ms display
        setTimeout(() => {
          popup.classList.add("flying-back");

          setTimeout(() => {
            popup.classList.add("hidden");
            popup.classList.remove("flying-in", "flying-back");
            if (dockDiceBtn) dockDiceBtn.classList.remove("rolling-flight");
            displayDiceValue(val);
            isDiceRollingAnimationActive = false;

            // 3. Callback (e.g. check for Need a 6) ONLY AFTER flight is done!
            if (typeof onComplete === "function") {
              onComplete();
            }
          }, 350);
        }, 550);
      }
    }, 85);
  }

  // Lock / Need a 6 Visual Animation Overlay
  function showNeedSixAnimation() {
    const lockNotify = document.getElementById("v2-ludo-lock-notify");
    if (!lockNotify) return;

    lockNotify.classList.remove("hidden", "pop-out");
    lockNotify.classList.add("shake-anim");
    lockNotify.innerHTML = `
      <div class="v2-ludo-lock-card">
        <span class="lock-icon">🔒</span>
        <div class="lock-text">
          <strong>Need 6 to Unlock!</strong>
          <small>Roll a 6 to bring token out ⚅</small>
        </div>
      </div>
    `;

    setTimeout(() => {
      lockNotify.classList.add("pop-out");
      setTimeout(() => {
        lockNotify.classList.add("hidden");
        lockNotify.classList.remove("pop-out", "shake-anim");
      }, 300);
    }, 1500);
  }

  // ==========================================
  // WebRTC Audio Mesh (P2P Live Voice)
  // ==========================================

  async function initLudoAudioMesh() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        localAudioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });
        isMicMuted = false;
        updateMicButtonUI();
        setupAudioVisualizer(localAudioStream, "self");

        // Initiate P2P WebRTC calls with all other game peers
        // Tie-breaker: Lexicographically smaller socket ID initiates to prevent offer/answer glare collisions
        if (currentGame && Array.isArray(currentGame.players)) {
          currentGame.players.forEach((p) => {
            if (p.socketId !== window.socket?.id && !p.isSilent) {
              const shouldInitiate = String(window.socket?.id || "") < String(p.socketId);
              createLudoPeerConnection(p.socketId, shouldInitiate);
            }
          });
        }
      }
    } catch (err) {
      console.warn("⚠️ [Ludo Voice] Mic permission optional/denied:", err.message);
      isMicMuted = true;
      updateMicButtonUI();
    }
  }

  function createLudoPeerConnection(targetSocketId, isInitiator = false) {
    if (peerConnections.has(targetSocketId)) return peerConnections.get(targetSocketId);

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });

    if (localAudioStream) {
      localAudioStream.getAudioTracks().forEach((track) => pc.addTrack(track, localAudioStream));
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const remoteAudio = new Audio();
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.autoplay = true;
        remoteAudio.play().catch(() => {});
        setupAudioVisualizer(event.streams[0], targetSocketId);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && window.socket) {
        window.socket.emit("ludo_signal", {
          targetId: targetSocketId,
          signal: { candidate: event.candidate }
        });
      }
    };

    if (isInitiator) {
      pc.createOffer().then((offer) => {
        return pc.setLocalDescription(offer);
      }).then(() => {
        if (window.socket) {
          window.socket.emit("ludo_signal", {
            targetId: targetSocketId,
            signal: { sdp: pc.localDescription }
          });
        }
      }).catch(console.error);
    }

    peerConnections.set(targetSocketId, pc);
    return pc;
  }

  async function handleLudoSignal(data) {
    const { senderId, signal } = data;
    let pc = peerConnections.get(senderId);
    if (!pc) {
      pc = createLudoPeerConnection(senderId, false);
    }

    if (signal.sdp) {
      try {
        if (signal.sdp.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (window.socket) {
            window.socket.emit("ludo_signal", {
              targetId: senderId,
              signal: { sdp: answer }
            });
          }
        } else if (signal.sdp.type === "answer") {
          if (pc.signalingState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          } else {
            console.warn("⚠️ [Ludo Voice] Answer ignored; PC signaling state:", pc.signalingState);
          }
        }
      } catch (err) {
        console.warn("⚠️ [Ludo Voice] Signal handling notice:", err.message);
      }
    } else if (signal.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
      } catch (e) {}
    }
  }

  function setupAudioVisualizer(stream, id) {
    try {
      const actx = getAudioCtx();
      if (!actx) return;
      const src = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      function checkVolume() {
        if (!currentGame) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;

        // Find corresponding player card
        let targetColor = null;
        if (id === "self") {
          targetColor = currentGame.myColor;
        } else {
          const p = currentGame.players.find(x => x.socketId === id);
          if (p) targetColor = p.color;
        }

        if (targetColor) {
          const card = document.getElementById(`v2-ludo-p-${targetColor}`);
          if (card) {
            if (avg > 18) {
              card.classList.add("speaking");
            } else {
              card.classList.remove("speaking");
            }
          }
        }
        requestAnimationFrame(checkVolume);
      }
      checkVolume();
    } catch (e) {}
  }

  window.toggleLudoMic = function () {
    if (!localAudioStream) {
      initLudoAudioMesh();
      return;
    }
    isMicMuted = !isMicMuted;
    localAudioStream.getAudioTracks().forEach(t => { t.enabled = !isMicMuted; });
    updateMicButtonUI();
    if (typeof v2ShowToast === "function") {
      v2ShowToast(isMicMuted ? "🔇 Microphone Muted" : "🎙️ Microphone Unmuted");
    }
  };

  function updateMicButtonUI() {
    const btn = document.getElementById("v2-ludo-mic-btn");
    if (!btn) return;
    if (isMicMuted) {
      btn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
      btn.classList.add("muted");
    } else {
      btn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
      btn.classList.remove("muted");
    }
  }

  // ==========================================
  // In-Game Floating Reactions
  // ==========================================

  window.sendLudoReaction = function (emoji) {
    if (!currentGame || !window.socket) return;
    window.socket.emit("ludo_reaction", { emoji });
    triggerEmojiRain(emoji);
  };

  // Falling Emoji Rain effect across the board
  function triggerEmojiRain(emoji) {
    const layer = document.getElementById("v2-ludo-emoji-layer");
    if (!layer) return;

    const count = 16;
    for (let i = 0; i < count; i++) {
      const span = document.createElement("span");
      span.className = "v2-ludo-rain-emoji";
      span.textContent = emoji;

      const randomX = Math.floor(Math.random() * 88) + 6; // 6% to 94%
      const randomDelay = Math.random() * 0.45;
      const randomDuration = 1.1 + Math.random() * 0.5;
      const randomRotation = Math.floor(Math.random() * 50) - 25;
      const randomSize = 1.3 + Math.random() * 0.5;

      span.style.left = `${randomX}%`;
      span.style.animationDelay = `${randomDelay}s`;
      span.style.animationDuration = `${randomDuration}s`;
      span.style.transform = `rotate(${randomRotation}deg)`;
      span.style.fontSize = `${randomSize}rem`;

      layer.appendChild(span);

      setTimeout(() => {
        if (span.parentNode) span.remove();
      }, (randomDuration + randomDelay + 0.2) * 1000);
    }
  }

  // ==========================================
  // Minimize & Dock Management
  // ==========================================

  window.minimizeLudoGame = function () {
    const stage = document.getElementById("v2-ludo-stage");
    const dock = document.getElementById("v2-ludo-floating-dock");
    const groupStage = document.getElementById("v2-group-chat-stage");

    if (stage) stage.classList.add("hidden");
    if (groupStage) groupStage.classList.remove("hidden");
    if (dock) {
      dock.classList.remove("hidden");
      const dockTitle = dock.querySelector(".v2-dock-title");
      if (dockTitle) dockTitle.textContent = "Ludo Game";
    }
    if (typeof v2ShowToast === "function") {
      v2ShowToast("💬 In Group Lounge. Voice audio is LIVE! Tap floating dice anytime to return to Ludo.", 4000);
    }
  };

  window.expandLudoGame = function () {
    const stage = document.getElementById("v2-ludo-stage");
    const dock = document.getElementById("v2-ludo-floating-dock");
    const groupStage = document.getElementById("v2-group-chat-stage");

    if (dock) dock.classList.add("hidden");
    if (groupStage) groupStage.classList.add("hidden");
    if (stage) stage.classList.remove("hidden");
  };

  window.confirmLeaveLudoGame = function () {
    if (confirm("Are you sure you want to leave the Ludo game?")) {
      if (window.socket && window.socket.connected) {
        window.socket.emit("ludo_leave_game");
      }
      exitLudoToLounge();
    }
  };

  window.exitLudoToLounge = function () {
    teardownLudoGame();
    const stage = document.getElementById("v2-ludo-stage");
    const dock = document.getElementById("v2-ludo-floating-dock");
    const groupStage = document.getElementById("v2-group-chat-stage");

    if (stage) stage.classList.add("hidden");
    if (dock) dock.classList.add("hidden");
    if (groupStage) groupStage.classList.remove("hidden");
    if (typeof window.ensureInputFieldsVisibility === "function") {
      window.ensureInputFieldsVisibility();
    }
    if (typeof window.scrollGroupFeedToBottom === "function") {
      window.scrollGroupFeedToBottom(false);
    }
  };

  function teardownLudoGame() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (timerInterval) clearInterval(timerInterval);
    if (localAudioStream) {
      localAudioStream.getTracks().forEach(t => t.stop());
      localAudioStream = null;
    }
    peerConnections.forEach(pc => { try { pc.close(); } catch (e) {} });
    peerConnections.clear();
    currentGame = null;
  }

  // ==========================================
  // Socket.io Game Lifecycle Listeners
  // ==========================================

  function bindLudoSocketEvents() {
    if (!window.socket) return;

    window.socket.on("ludo_game_start", (data) => {
      console.log("🚀 [Ludo] Game Start Event received:", data);
      const myId = window.socket.id;
      const myPlayer = data.players.find(p => p.socketId === myId);

      currentGame = {
        gameId: data.gameId,
        mode: data.mode,
        players: data.players,
        myColor: myPlayer ? myPlayer.color : "red",
        activeColor: data.activeColor,
        isMyTurn: myPlayer ? myPlayer.color === data.activeColor : false,
        dice: null,
        movableTokens: []
      };

      // Hide group stage, show Ludo stage
      const groupStage = document.getElementById("v2-group-chat-stage");
      const ludoStage = document.getElementById("v2-ludo-stage");
      const dock = document.getElementById("v2-ludo-floating-dock");
      const victoryOverlay = document.getElementById("v2-ludo-victory-overlay");

      if (groupStage) groupStage.classList.add("hidden");
      if (victoryOverlay) victoryOverlay.classList.add("hidden");
      if (dock) dock.classList.add("hidden");
      if (ludoStage) ludoStage.classList.remove("hidden");

      const titleEl = document.getElementById("v2-ludo-title");
      if (titleEl) {
        titleEl.textContent = "Ludo";
      }

      // Setup UI Player Cards
      updatePlayerCardsUI();
      updateTurnStatusUI(data.activeColor, data.turnTimeoutSec || 60);

      // Initialize Canvas & Default Dice Display (5)
      initLudoCanvas();
      displayDiceValue(5);

      // Initialize Optional Voice Mesh
      initLudoAudioMesh();

      playLudoChime("win");
      if (typeof v2ShowToast === "function") {
        v2ShowToast(`🎲 Ludo Started! You are ${currentGame.myColor.toUpperCase()}`, 3500);
      }
    });

    window.socket.on("ludo_turn_change", (data) => {
      if (!currentGame) return;
      currentGame.activeColor = data.activeColor;
      currentGame.isMyTurn = (currentGame.myColor === data.activeColor);
      currentGame.dice = null;
      currentGame.movableTokens = [];

      updateTurnStatusUI(data.activeColor, data.turnTimeoutSec || 60);

      const announceEl = document.getElementById("v2-ludo-dice-announce");
      if (announceEl) {
        announceEl.classList.remove("hidden");
        if (currentGame.isMyTurn) {
          announceEl.innerHTML = `<span class="val-turn">🟢</span> <strong>Your Turn! Roll Dice (60s).</strong>`;
        } else {
          const activeP = currentGame.players.find(p => p.color === data.activeColor);
          const pName = activeP ? activeP.nickname : data.activeColor.toUpperCase();
          announceEl.innerHTML = `<span class="val-turn">⏳</span> <strong>${escapeHtml(pName)}'s turn to roll...</strong>`;
        }
      }

      if (currentGame.isMyTurn) {
        if (navigator.vibrate) { try { navigator.vibrate([100, 50, 100]); } catch (e) {} }
        if (typeof v2ShowToast === "function") v2ShowToast("🎲 Your Turn! Roll the dice.");
        // If dock is active, pulse it
        const dock = document.getElementById("v2-ludo-floating-dock");
        if (dock && !dock.classList.contains("hidden")) {
          dock.classList.add("your-turn");
          const dockStatus = document.getElementById("v2-dock-status");
          if (dockStatus) dockStatus.textContent = "YOUR TURN! 🎲";
        }
      } else {
        const dock = document.getElementById("v2-ludo-floating-dock");
        if (dock) {
          dock.classList.remove("your-turn");
          const dockStatus = document.getElementById("v2-dock-status");
          if (dockStatus) dockStatus.textContent = `${data.activeColor.toUpperCase()}'s turn`;
        }
      }
    });

    window.socket.on("ludo_dice_rolled", (data) => {
      if (!currentGame) return;

      const announceEl = document.getElementById("v2-ludo-dice-announce");
      const roller = currentGame.players.find(p => p.color === data.color);
      const rollerName = roller ? roller.nickname : data.color.toUpperCase();
      const isMyRoll = (currentGame.myColor === data.color);

      if (isMyRoll) {
        currentGame.dice = data.dice;
        currentGame.movableTokens = data.movableTokens || [];
      }

      // Center-board realistic 3D rolling dice animation for ~1.8s, then glides back to dock
      animateCenterDiceRoll(data.dice, data.color, () => {
        // Callback executes AFTER the dice finishes rolling and returns to the action bar:
        if (isMyRoll) {
          if (announceEl) {
            announceEl.classList.remove("hidden");
            if (currentGame.movableTokens.length === 0) {
              announceEl.innerHTML = `<span class="val-dice">🎲 ${data.dice}</span> <strong>Rolled ${data.dice}!</strong> Need 6 to unlock 🔒`;
            } else if (currentGame.movableTokens.length === 1) {
              announceEl.innerHTML = `<span class="val-dice">🎲 ${data.dice}</span> <strong>Rolled ${data.dice}!</strong> Moving token... ⚡`;
              // Single token moves automatically
              setTimeout(() => {
                if (currentGame && currentGame.isMyTurn && currentGame.dice !== null) {
                  window.socket.emit("ludo_move_token", { tokenIndex: currentGame.movableTokens[0] });
                }
              }, 400);
            } else {
              announceEl.innerHTML = `<span class="val-dice">🎲 ${data.dice}</span> <strong>Rolled ${data.dice}!</strong> Tap highlighted token to move ✨`;
            }
          }
          // Only show Need a 6 warning NOW (never during rolling!)
          if (currentGame.movableTokens.length === 0) {
            showNeedSixAnimation();
          }
        } else {
          if (announceEl) {
            announceEl.classList.remove("hidden");
            announceEl.innerHTML = `<span class="val-dice">🎲 ${data.dice}</span> <strong>${escapeHtml(rollerName)} rolled ${data.dice}!</strong>`;
          }
        }
      });
    });

    window.socket.on("ludo_turn_missed", (data) => {
      if (!currentGame) return;
      const announceEl = document.getElementById("v2-ludo-dice-announce");
      if (announceEl) {
        announceEl.classList.remove("hidden");
        announceEl.innerHTML = `<span class="val-strike">⚠️</span> <strong>${escapeHtml(data.nickname || data.color)} missed turn! (Strike ${data.missedTurns}/${data.maxMisses})</strong>`;
      }
      if (typeof v2ShowToast === "function") {
        v2ShowToast(`⚠️ ${data.nickname || data.color} missed turn! Strike ${data.missedTurns}/${data.maxMisses}`);
      }
    });

    window.socket.on("ludo_token_moved", (data) => {
      if (!currentGame) return;
      const player = currentGame.players.find(p => p.color === data.color);
      if (player) {
        player.tokens[data.tokenIndex] = data.newPos;
      }

      if (data.capturedToken) {
        playLudoChime("cut");
        const cutPlayer = currentGame.players.find(p => p.color === data.capturedToken.color);
        if (cutPlayer) {
          cutPlayer.tokens[data.capturedToken.tokenIndex] = -1;
        }
        if (typeof v2ShowToast === "function") {
          v2ShowToast(`⚔️ ${data.color.toUpperCase()} cut ${data.capturedToken.color.toUpperCase()}'s token!`);
        }
      } else if (data.newPos === 56) {
        playLudoChime("home");
        if (typeof v2ShowToast === "function") {
          v2ShowToast(`🎉 ${data.color.toUpperCase()} reached Home!`);
        }
      } else {
        playLudoChime("hop");
      }

      updatePlayerCardsUI();
    });

    window.socket.on("ludo_game_over", (data) => {
      if (!currentGame) return;
      playLudoChime("win");

      const victoryOverlay = document.getElementById("v2-ludo-victory-overlay");
      const winnerTitle = document.getElementById("v2-ludo-winner-title");
      const winnerSub = document.getElementById("v2-ludo-winner-subtitle");

      if (winnerTitle) {
        winnerTitle.textContent = (data.winner === currentGame.myColor) ? "You Won!" : `${data.winnerName} Won!`;
      }
      if (winnerSub) {
        winnerSub.textContent = data.reason === "forfeit"
          ? `${data.leaverName || "Opponent"} left the game. Victory by forfeit!`
          : `Match completed! Fantastic battle!`;
      }
      if (victoryOverlay) victoryOverlay.classList.remove("hidden");
    });

    window.socket.on("ludo_player_silent", (data) => {
      if (!currentGame) return;
      const p = currentGame.players.find(x => x.color === data.color);
      if (p) p.isSilent = true;
      updatePlayerCardsUI();
      if (typeof v2ShowToast === "function") {
        v2ShowToast(`🔇 ${data.nickname} (${data.color.toUpperCase()}) left. Tokens set to silent.`);
      }
    });

    window.socket.on("ludo_signal", (data) => {
      handleLudoSignal(data);
    });

    window.socket.on("ludo_reaction", (data) => {
      triggerEmojiRain(data.emoji);
    });
  }

  function updatePlayerCardsUI() {
    if (!currentGame) return;

    ["red", "green", "yellow", "blue"].forEach((col) => {
      const card = document.getElementById(`v2-ludo-p-${col}`);
      const nameEl = document.getElementById(`v2-ludo-name-${col}`);
      const scoreEl = document.getElementById(`v2-ludo-score-${col}`);

      const player = currentGame.players.find(p => p.color === col);
      if (player && card) {
        card.style.display = "flex";
        const isMe = (col === currentGame.myColor);
        if (nameEl) {
          nameEl.innerHTML = `${escapeHtml(player.nickname || col)}${isMe ? ' <span class="v2-you-badge-chip">YOU</span>' : ''}`;
        }
        if (scoreEl) {
          const homeCount = player.tokens.filter(pos => pos === 56).length;
          scoreEl.textContent = player.isSilent ? "Silent" : `${homeCount}/4 Home`;
        }
        if (player.isSilent) {
          card.classList.add("silent");
        } else {
          card.classList.remove("silent");
        }
      } else if (card) {
        // Hide unused colors in 2P mode (Green and Blue are hidden)
        card.style.display = "none";
      }
    });
  }

  function updateTurnStatusUI(activeColor, sec) {
    const turnText = document.getElementById("v2-ludo-turn-text");
    const diceBtn = document.getElementById("v2-ludo-dice-btn");

    if (turnText) {
      if (currentGame.isMyTurn) {
        turnText.innerHTML = `<span style="color: #FBBF24; font-weight: 700;">🟢 YOUR TURN!</span>`;
      } else {
        turnText.innerHTML = `<span style="color: #94A3B8;">${activeColor.toUpperCase()}'s turn</span>`;
      }
    }

    if (diceBtn) {
      diceBtn.disabled = !currentGame.isMyTurn;
      if (currentGame.isMyTurn) {
        diceBtn.classList.add("turn-ready");
        diceBtn.style.opacity = "1";
        diceBtn.style.cursor = "pointer";
      } else {
        diceBtn.classList.remove("turn-ready");
        diceBtn.style.opacity = "0.45";
        diceBtn.style.cursor = "not-allowed";
      }
    }

    // 60-second timer bar countdown
    turnSecondsLeft = sec;
    const timerFill = document.getElementById("v2-ludo-timer-fill");
    if (timerInterval) clearInterval(timerInterval);

    if (timerFill) {
      timerFill.style.width = "100%";
      timerFill.style.backgroundColor = COLOR_PALETTES[activeColor]?.base || "#3B82F6";
    }

    const startMs = Date.now();
    const totalMs = sec * 1000;
    timerInterval = setInterval(() => {
      const elapsed = Date.now() - startMs;
      const pct = Math.max(0, 100 - (elapsed / totalMs) * 100);
      if (timerFill) timerFill.style.width = `${pct}%`;
      if (elapsed >= totalMs) {
        clearInterval(timerInterval);
      }
    }, 100);
  }

  // Trigger Ludo Challenge from Attachment Drawer (Unified Up to 4 Players)
  window.triggerLudoInvite = function () {
    if (typeof closeV2CallDrawer === "function") closeV2CallDrawer();
    if (window.socket && window.socket.connected) {
      window.socket.emit("post_ludo_invite", { mode: "4p" });
      if (typeof v2ShowToast === "function") {
        v2ShowToast("🎲 Posted Ludo Game Challenge to Group! (Waiting for players)");
      }
    } else {
      if (typeof v2ShowToast === "function") v2ShowToast("⚠️ Connecting to chat server...");
    }
  };

  // Join Ludo Challenge from Group Card
  window.joinLudoChallenge = function (inviteId) {
    if (!inviteId) return;
    if (window.socket && window.socket.connected) {
      window.socket.emit("join_ludo_invite", { inviteId });
    }
  };

  // Initialize socket bindings when socket is ready
  if (window.socket) {
    bindLudoSocketEvents();
  } else {
    window.addEventListener("DOMContentLoaded", () => {
      setTimeout(bindLudoSocketEvents, 500);
    });
  }
})();

