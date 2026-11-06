# HashGANG Chat (#GANG Chat - Anonymous Stranger Video, Voice & Ludo Chat)

HashGANG Chat (`http://localhost:8000/` / `https://chat.hashgang.com`) is a high-scale, zero-infrastructure-cost, decentralized, anonymous stranger video, voice, text, and real-time multiplayer board game platform powered by WebRTC P2P mesh streaming, real-time WebAudio DSP, and single-server Node.js signaling (`/omegle`).

---

## 🚀 Versioning & Cache Control (Current Build: v351)

- **Service Worker (`sw.js`)**: `CACHE_NAME = 'hashgang-v351'`.
- **Client Build Anchor**: `const APP_CLIENT_VERSION = "v351"` in `app.js`.
- **Deployment Auto-Refresh**: Sockets exchange `deployId` on restart. Idle tabs automatically invalidate caches and reload without disrupting active 1v1 calls.
- **Cache Strategy**: Network-First for HTML/JS application bundles and Cache-First for static audio/media assets.

---

## 🎮 Multiplayer Ludo Board Game & P2P Audio Mesh Engine

- **Real-Time 2D Canvas Engine (`ludo_game.js`)**: High-performance 60 FPS board rendering with safe star squares, token jump kinematics, and cutting mechanics.
- **Unified 4P Lobby**: 60-second countdown invite cards, slot assignment indicators (`red`, `green`, `yellow`, `blue`), host early start (`start_ludo_game_now`), and 4/4 auto-launch.
- **Relaxed Pace**: 60-second turn timeout per move with 3-strike forfeit protection.
- **Web Audio Preloading**: Pre-decoded `assets/dice-roll.mp3` memory buffer for 0ms latency audio playback.
- **3D Animated Physical Rolling Dice**: Default face 5 with 5 dots, center-board gliding and 3D rotational perspective animation.
- **Multi-Party WebRTC Voice Mesh**: $0 server bandwidth multi-peer audio mesh with tie-breaker glare prevention (`socket.id < peerSocketId`).
- **Floating Minimized Dock (`v2-ludo-floating-dock`)**: Minimize to lounge while voice audio remains live, expandable with 1 click.
- **Timeless Winner Cards**: Single trophy (🏆) display with external reply and emoji reactions.

---

## 🔒 Security, Privacy & Performance Architecture

1. **3-Layer Permission Security Guard**:
   - **Layer 1 (Pre-Queue Guard)**: `validateMediaPermissions()` enforces live camera/mic before joining matchmaking queue.
   - **Layer 2 (Runtime Track Monitor)**: Real-time `track.onended` listeners trigger immediate call cleanup if camera permission is revoked mid-session.
   - **Layer 3 (Browser Permission Observer)**: Subscribes to `navigator.permissions.query({ name: 'camera' })` for instant state detection.
2. **WebRTC Signaling Authorization**:
   - Backend `omegleMatchmaker.js` enforces active pair validation (`activePairs.get(socket.id) === data.targetId`) to block signaling spoofing attacks.
3. **Queue Rate Limiter & Memory Compaction**:
   - Per-socket 400ms join throttle guard + 5-minute periodic memory compaction for `recentMatches` map.
4. **Global NAT Traversal (STUN + TURN Relays)**:
   - Google, Cloudflare, Twilio STUN + Metered OpenRelay TURN for 100% connectivity on 4G/5G mobile CGNAT (Jio, Airtel, Vodafone) and strict firewalls.
5. **Adaptive Multi-Device Media Constraints**:
   - Adaptive fallback hierarchy (720p HD ➔ 480p SD ➔ Basic fallback) for budget Android phones and slow data.
6. **Focus Loss & Privacy Shield**:
   - Remote video instantly blurs with `backdrop-filter: blur(40px)` when the user switches tabs or minimizes window.

---

## 🚀 Local Development Commands

### 1. Run Local Server (Port 8000)

```bash
python3 -m http.server 8000
```

### 2. Kill Port 8000 (If Already in Use)

```bash
fuser -k 8000/tcp 2>/dev/null
```

---

## 🧪 Comprehensive Automated Testing Harness

```bash
# 1. Master E2E Test Suite (11 Phases, 109 Automated Tests)
node /home/hashgang/Workspace/omegle/master_e2e_test_suite.js

# 2. Standalone Browser Playwright Mobile Suite for Ludo
node /home/hashgang/.gemini/antigravity/brain/bd6c5e22-7e3d-41f2-881e-6f3dd0a8bd74/scratch/comprehensive_ludo_e2e_test.js

# 3. 100,000 User Multi-ISP & Device Scale Simulation
node /home/hashgang/Workspace/omegle/simulate_100k_matrix.js

# 4. 500-Socket High-Concurrency Load Test
NODE_PATH=/home/hashgang/Workspace/omegle/node_modules node /home/hashgang/Workspace/myleader/backend/test_omegle_load.js 500

# 5. Global Search Engine IndexNow Automation
python3 /home/hashgang/Workspace/omegle/submit_indexnow.py
```

---

## 🛑 Production Deployment Pre-Flight Checklist

Before launching to live production (`https://chat.hashgang.com`):

1. **`ads.js` Backend URL**:
   - Change `BACKEND_API_BASE` in [`ads.js`](file:///home/hashgang/Workspace/omegle/ads.js) from `http://localhost:5000/api/v1/strangerchat` to live production domain (e.g. `https://api.hashgang.com/api/v1/strangerchat`).
2. **HTTPS / SSL Requirement**:
   - Ensure domain is served strictly over HTTPS (`https://chat.hashgang.com`) so browser WebRTC `getUserMedia` camera & mic permissions function seamlessly.
3. **Ad Network Keys**:
   - Update production zone keys & scripts in [`ad_mediation_config.js`](file:///home/hashgang/Workspace/omegle/ad_mediation_config.js) (Adsterra, PropellerAds, Monetag).
4. **Dedicated TURN Server Setup**:
   - Replace or supplement free OpenRelay STUN/TURN servers in [`app.js`](file:///home/hashgang/Workspace/omegle/app.js) with dedicated self-hosted Coturn or commercial TURN service (Metered.ca / Twilio) for high 4G/5G mobile CGNAT volume.
