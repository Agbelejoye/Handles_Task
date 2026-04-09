# Task Handler AI – Browser Extension

Chrome/Edge Manifest V3 extension that tracks browser activity and syncs to the Task Handler AI dashboard.

## Setup for development

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked** and select the `/extension` folder
4. The extension icon appears in your toolbar

## Usage

- Click the extension icon to open the popup
- **Enable activity tracking** using the toggle (opt-in only)
- Set the **API Base URL** to your Task Handler AI instance (`http://localhost:3000` for local dev)
- Use **Sync Now** to force immediate sync, or let it auto-sync every minute

## Privacy

- Activity tracking is **opt-in** and disabled by default
- Data is sent only to your configured Task Handler AI instance
- No data is sent to third parties
- You can disable tracking at any time from the popup

## Permissions

| Permission | Reason |
|-----------|--------|
| `tabs` | Track active tab URLs and titles |
| `storage` | Save tracking preferences |
| `alarms` | Schedule periodic sync |
| `host_permissions` | Send data to your Task Handler AI instance |

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension manifest (Manifest V3) |
| `background.js` | Service worker: tab tracking + sync |
| `popup.html` + `popup.js` | Extension popup UI |

## TODO

- [ ] Map URLs to specific tasks automatically (AI-powered)
- [ ] Distraction detection and alerts
- [ ] Idle detection to pause tracking
- [ ] Firefox support (Manifest V3 compatible)
