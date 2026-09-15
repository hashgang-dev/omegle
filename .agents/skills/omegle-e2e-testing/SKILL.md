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

## 2. Playwright Frontend E2E Testing

### Script Location
- `/home/hashgang/Workspace/omegle/test_frontend_e2e.js`

### Key Configuration
- Launch Chromium with fake media flags:
  ```javascript
  args: [
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--no-sandbox'
  ]
  ```
- Grant camera and microphone permissions automatically (`permissions: ['camera', 'microphone']`).
- Simulate User A and User B concurrently in isolated contexts.

### Execution Command
```bash
cd /home/hashgang/Workspace/omegle
node test_frontend_e2e.js
```

### Verification Criteria
1. **Matchmaking**: Both User A and User B receive `matched` Socket.io events.
2. **WebRTC P2P Streams**: `remoteVideo.srcObject` is non-null and contains active video tracks.
3. **Simulation Guard**: `playSimulatedStrangerVideo` does NOT overwrite real remote streams.
4. **Skip Action**: Clicking "Next Stranger" resets peer state and re-enters the queue without rapid-join throttling.
5. **Screenshots**: Screenshots saved to `e2e_match_success_userA.png`, `e2e_match_success_userB.png`, `e2e_skip_success_userA.png`.

---

## 3. Socket.io Backend Load Testing

### Script Location
- `/home/hashgang/Workspace/myleader/backend/test_omegle_load.js`

### Execution Command
```bash
cd /home/hashgang/Workspace/myleader/backend
node test_omegle_load.js
```

### Verification Criteria
- Simulate 50–200 concurrent socket instances.
- Track success match count vs errors (aim for 0 rate-limit blocks and 0 unhandled exceptions).
