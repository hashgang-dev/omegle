---
name: omegle-e2e-testing
description: >-
  Automated Playwright E2E browser testing and Socket.io load testing workflow for the Omegle clone app.
  Use whenever the user requests frontend E2E testing, browser interaction verification, WebRTC stream checks, or load testing.
---

# Omegle E2E & Load Testing Workflow

This skill defines the standard automated testing procedure for the Omegle clone application (Frontend: `http://localhost:8000`, Backend: `http://localhost:5000`).

---

## 1. Prerequisites & Environment Check

Before running tests, ensure local servers are running:
- **Backend Socket Server**: `http://localhost:5000/omegle`
- **Frontend App Server**: `http://localhost:8000/index.html`

If servers are down, start them:
- Backend: `cd /home/hashgang/Workspace/myleader/backend && npm start`
- Frontend: `cd /home/hashgang/Workspace/omegle && python3 -m http.server 8000`

---

## 2. Test Suites Overview & Execution

### A. Unified Master E2E Verification Suite
- **Script Location**: `/home/hashgang/Workspace/omegle/master_e2e_test_suite.js`
- **Scope**: 50 automated tests spanning 5 phases:
  - Phase 1: Socket signaling, trace codes (`HGXXXXXX`), MongoDB audit retrieval, report disconnects, 24h block enforcement.
  - Phase 2: Group chat protocol, nickname customization, timeless rolling message buffer (<=30), quoted replies, emoji reactions, 25-cap dynamic room sharding, dual-track invite matching, double-accept race locks, zombie card cleanups.
  - Phase 3 & 4: Playwright browser UI permutations (18+ gate, group chat onboarding, brand name animation, call drawer transitions, search radar shortcut).
  - Phase 5: Deep edge cases (repeat calls, anti-spam external link blocks, offline inviter fallback).
- **Execution Command**:
  ```bash
  cd /home/hashgang/Workspace/omegle && node master_e2e_test_suite.js
  ```

### B. Mobile & Desktop Playwright UI Suite
- **Script Location**: `/home/hashgang/Workspace/omegle/test_mobile_ui.js`
- **Scope**:
  - Mobile viewport (390x844) & Desktop (1400x900) UI assertions.
  - 18+ age gate dismissal, brand logo 38-40px full-height rendering, `#GANG` <-> `HashGANG` brand title animation.
  - Input pill with attachment-style thunder button and auto-growing textarea.
  - Redesigned slide-up call drawer (In-Group & Outside Secret Link sections, 6 tiles with full text visibility).
  - Secret 1-on-1 share modal with mode switcher (video/audio/text).
  - Disconnected state with "Back to Group Chat" transition.
  - Anti-spam external URL blocking toast.
  - Generates artifacts/screenshots in brain directory.
- **Execution Command**:
  ```bash
  cd /home/hashgang/Workspace/omegle && node test_mobile_ui.js
  ```

### C. Direct Invite Lifecycle & Repeat Connection Suite
- **Script Location**: `/home/hashgang/Workspace/omegle/test_direct_invite_lifecycle.js`
- **Scope**: Direct 1-on-1 private link creation, join handshake, WebRTC/socket message exchange, immediate repeat call without cooldown blocks, and invalid/expired code fallback.
- **Execution Command**:
  ```bash
  cd /home/hashgang/Workspace/omegle && node test_direct_invite_lifecycle.js
  ```

### D. Group <-> 1-on-1 Infinite Loop Suite
- **Script Location**: `/home/hashgang/Workspace/omegle/test_group_infinite_loop.js`
- **Scope**: Seamless switching between Public Lounge and private 1v1 video/audio/text calls across multiple loops without cooldown locks.
- **Execution Command**:
  ```bash
  cd /home/hashgang/Workspace/omegle && node test_group_infinite_loop.js
  ```

### E. 100k User Scale & Scenario Matrix Simulation
- **Script Location**: `/home/hashgang/Workspace/omegle/simulate_100k_matrix.js`
- **Scope**: 350 simulated sockets across multi-wave churn, 8 ISPs (Jio, Airtel, Vi, BSNL, Comcast, BT, Du, Telstra), 7 device combinations, 25-cap room overflow to Room #2, double-accept race lock prevention, anti-spam rate limiter, memory leak monitoring.
- **Execution Command**:
  ```bash
  cd /home/hashgang/Workspace/omegle && node simulate_100k_matrix.js
  ```

### F. High-Concurrency Socket.IO Backend Load Testing
- **Script Location**: `/home/hashgang/Workspace/myleader/backend/test_omegle_load.js`
- **Scope**: 500+ concurrent sockets ramp-up, message broadcast bursts, 25-cap room allocation, event loop lag monitoring (<30ms), connect/matchmaking latency percentiles (p50, p95, p99).
- **Execution Command**:
  ```bash
  cd /home/hashgang/Workspace/myleader/backend && node test_omegle_load.js 500
  ```

### G. 1-on-1 In-Call Mode Upgrade Suite
- **Script Location**: `/home/hashgang/Workspace/omegle/test_in_call_upgrade.js`
- **Scope**: In-call upgrade signaling (Text -> Video/Audio), prompt delivery to peer, accept/decline flows, staying connected without disconnect.
- **Execution Command**:
  ```bash
  cd /home/hashgang/Workspace/omegle && node test_in_call_upgrade.js
  ```

### H. Group Call Invite Replacement & Concurrency Race Suite
- **Script Location**: `/home/hashgang/Workspace/omegle/test_invite_replacement_and_concurrency.js`
- **Scope**: Sequential mode invite posting (video -> voice -> text) with automatic cancellation of superseded invites, broadcast of `call_invite_cancelled` to the group, atomic lock when Stranger 1 accepts, and blocking Stranger 2 with `call_invite_error`.
- **Execution Command**:
  ```bash
  cd /home/hashgang/Workspace/omegle && node test_invite_replacement_and_concurrency.js
  ```

### I. In-Feed Pacing & Message Rate Limiting Suite
- **Script Location**: `/home/hashgang/Workspace/omegle/test_in_feed_pacing.js`
- **Scope**: Natural 1 msg/sec rate limiter check, 12-message broadcast cadence, feed message injection verification.
- **Execution Command**:
  ```bash
  cd /home/hashgang/Workspace/omegle && node test_in_feed_pacing.js
  ```



