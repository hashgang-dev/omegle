# HashGANG Chat (#GANG Chat - Anonymous Stranger Video Chat)

HashGANG Chat (`http://localhost:8000/`) is a high-scale, zero-cost, decentralized, anonymous stranger video chat platform powered by WebRTC P2P streaming, 3-layer permission security, and single-server Node.js signaling (`/omegle`).

---

## 🚀 Versioning & Cache Control (Current Build: v58)

- **Service Worker (`sw.js`)**: `CACHE_NAME = 'hashgang-chat-v58'`.
- **Cache Busting**: Incrementing `CACHE_NAME` in `sw.js` automatically invalidates stale assets on all clients and PWA installations upon next load.
- **PWA Shell**: Network-First strategy for HTML/JS and Cache-First for static media assets.

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
   - Google, Cloudflare, Twilio STUN + Metered OpenRelay TURN (`turn:openrelay.metered.ca`) for 100% connectivity on 4G/5G mobile CGNAT (Jio, Airtel, Vodafone) and strict firewalls.
5. **Adaptive Multi-Device Media Constraints**:
   - Adaptive fallback hierarchy (720p HD ➔ 480p SD ➔ Basic fallback) for budget Android phones and slow data.
6. **Universal PWA & Mobile Unblock Card**:
   - Generic wording: `Camera & Microphone Access Blocked` ➔ `Open Site / App Settings`.

---

## 🚀 Local Development Commands

### 1. Simulated Videos Manifest Update

When adding or removing video files in `assets/simulated_videos/`, run:

```bash
python3 update_video_manifest.py
```

### 2. Run Local Server (Port 8000)

```bash
python3 -m http.server 8000
```

### 3. Kill Port 8000 (If Already in Use)

```bash
fuser -k 8000/tcp 2>/dev/null
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
   - Replace or supplement free OpenRelay STUN/TURN servers in [`app.js`](file:///home/hashgang/Workspace/omegle/app.js) with a dedicated self-hosted Coturn or commercial TURN service (Metered.ca / Twilio) for high 4G/5G mobile CGNAT volume.

---

## 📌 Pending Functionalities & Roadmap Items

| Feature / Task                             | Priority | Description                                                                                                                           |
| :----------------------------------------- | :------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **Central Abuse & Report Backend**         | High     | Extend client `reportAndBlockStranger()` to send reported Peer IDs & IP hashes to backend API for global banning & moderation logs.   |
| **Self-Hosted PeerJS Signaling Server**    | High     | Migrate from public cloud PeerJS (`0.peerjs.com`) to a custom Node.js `peerjs-server` instance for zero rate-limiting and 99.99% SLA. |
| **Text Chat Moderation / Bad Word Filter** | Medium   | Implement client-side and server-side profanity regex filtering for text chat.                                                        |
| **Interest & Topic Tags Matching**         | Medium   | Allow users to specify interest tags (e.g., #Gaming, #Music, #Coding) for targeted stranger matchmaking.                              |
| **AI Automated Video Moderation**          | Low      | Integrate lightweight client-side AI (`@vladmandic/face-api` or `nsfwjs`) to automatically flag or hide inappropriate video streams.  |

---

## 🧪 Testing Scenarios & Test Suite

For complete step-by-step test cases across Onboarding, Matchmaking, Cross-Device, and Chat controls, refer to [`testing_scenarios.md`](file:///home/hashgang/.gemini/antigravity-ide/brain/88c3aee2-3da3-41f3-bd45-a95650c49390/testing_scenarios.md).
