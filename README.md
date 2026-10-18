# My DU Web Unlock

Browser extension (Manifest V3, Chrome + Firefox) that unlocks web access to
[My DU](https://my-du.astanait.edu.kz) — the Digital University portal by Astana IT University.

## Problem

The portal's backend rejects login requests coming from a desktop browser:

```json
POST /api/auth/external-login
{ "token": "...", "device_info": { "platform": "web", "device_id": null }, ... }

403 {"message":"Access to this page via web version is restricted. Please use the mobile application","code":1004}
```

The SPA is designed for the React Native WebView: it probes `window.ReactNativeWebView`
and routes all native interaction ("get user info", "navigate", "back", "open link"…)
through `postMessage` to the mobile shell — none of that exists in a desktop browser.

## What the extension does

1. **Emulates the mobile app environment** — defines `window.ReactNativeWebView`
   before the site's scripts run (`document_start`, injected into the page world).
2. **Rewrites outgoing request bodies**: `device_info.platform: "web" → "android"`
   and fills a stable `device_id` (persisted in `localStorage`) on every fetch/XHR
   that contains `device_info` → login passes (200 instead of 403).
3. **Implements the native bridge in JS**: answers `{id, method, payload}` bridge calls
   (`navigate`, `navigatePush`, `goBack`, `reloadApp`, `openLink`, `openExternalSystem`,
   `logout`, `getAppVersion`, `getUserInfo`, `setHeaderTitle`, …) so menu buttons,
   back navigation, external links and logout actually work in the browser.

## Install

**Chrome / Chromium / Brave / Edge**
1. `chrome://extensions` → enable **Developer mode**
2. **Load unpacked** → select this folder

**Firefox** (regular builds require signed xpi; this works in temporary or dev/nightly builds)
1. `about:debugging#/runtime/this-firefox` → **Load Temporary Add-on…** → `manifest.json`

## Files

| File         | Runs in      | Purpose                                              |
|--------------|--------------|------------------------------------------------------|
| `manifest.json` | —         | MV3 manifest, content script registration            |
| `bridge.js`  | isolated     | Injects `main.js` into the page world at document_start |
| `main.js`    | page (main)  | Fake `ReactNativeWebView` + XHR/fetch body rewrite + bridge handlers |
