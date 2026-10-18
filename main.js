// Runs in the PAGE JS context (main world), at document_start —
// earlier than any site script. Requires us to preserve: no globals the site could clash with.
(function () {
  "use strict";

  // 2) Stable fake device_id (the device is remembered between sessions)
  var DID_KEY = "mydu_unlock_device_id";
  var did = null;
  try { did = localStorage.getItem(DID_KEY); } catch (e) {}
  if (!did) {
    did = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : "d-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    try { localStorage.setItem(DID_KEY, did); } catch (e2) {}
  }

  // 3) Rewrite device_info in outgoing JSON: platform: web -> android, substitute device_id
  function fixBody(body) {
    if (typeof body !== "string" || body.length < 12) return body;
    if (body.indexOf("device_info") === -1) return body;
    try {
      var j = JSON.parse(body);
      if (j && j.device_info && typeof j.device_info.platform !== "undefined") {
        if (j.device_info.platform === "web") j.device_info.platform = "android";
        if (!j.device_info.device_id) j.device_info.device_id = did;
        return JSON.stringify(j);
      }
    } catch (e) {}
    return body;
  }

  // XMLHttpRequest (axios goes through it by default — it was the one returning 403)
  var oSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    try { body = fixBody(body); } catch (e) {}
    return oSend.call(this, body);
  };

  // fetch
  var oFetch = window.fetch;
  window.fetch = function () {
    var args = Array.prototype.slice.call(arguments);
    if (args.length >= 2 && typeof args[1].body === "string") {
      try { args[1] = Object.assign({}, args[1], { body: fixBody(args[1].body) }); } catch (e) {}
    }
    return oFetch.apply(window, args);
  };

  // ---------------------------------------------------------------------------
  // 4) Fake native side of the RN WebView bridge.
  // The site posts {id, method, payload} (ReactNativeWebView.postMessage),
  // and expects a response via window message event: {id, result} (JSON string).
  // Previously the fake bridge swallowed messages — buttons didn't work.
  // Now we honestly execute navigate/back/reload/openLink, etc.
  // ---------------------------------------------------------------------------

  var APP_ID = "9.9.9"; // truthy version — update checks openLink (apprequests sd("openLink")) consider null a reason for 'needUpdateApp'

  function respond(id, result) {
    // The app's handler: AR(o.data) — data must be a JSON STRING {id, result}
    window.dispatchEvent(new MessageEvent("message", {
      data: JSON.stringify({ id: id, result: result }),
    }));
  }

  function navTo(path) {
    if (!path) { location.assign("/mobile/menu"); return; }
    if (path[0] === "/") { location.assign(path); }       // relative to origin
    else if (/^https?:/i.test(path)) { window.open(path, "_blank"); }
    else { location.assign("/" + String(path).replace(/^\/+/, "")); }
  }

  function handle(method, payload) {
    switch (method) {
      case "navigate":
      case "navigatePush":
        navTo(payload && payload.path);
        break;
      case "goBack":
        if (history.length > 1) history.back();
        else location.assign("/mobile/menu");
        break;
      case "reloadApp":
        location.reload();
        break;
      case "setHeaderTitle":
        if (payload != null) document.title = String(payload);
        break;
      case "openLink":
      case "openExternalSystem": {
        var u = payload && (payload.url || payload.link || payload);
        if (typeof u === "string" && u) {
          if (/^https?:/i.test(u)) window.open(u, "_blank");
          else navTo(u);
        }
        break;
      }
      case "logout":
        try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
        location.assign("/login");
        break;
      case "getAppVersion":
        return APP_ID;
      case "getUserInfo":
        return {}; // user info is taken from the API; the bridge is unused
      case "openCamera":
      case "scanQr":
      case "uploadFile":
      case "uploadImage":
      case "openFile":
      case "shareFile":
      case "openSecuritySettings":
      case "tokensChanged":
      case "updateNotificationCount":
      case "setTheme":
      case "changeLanguage":
        return null; // native-only features are disabled — but without hanging promises
      default:
        return null;
    }
  }

  var rnwv = {
    postMessage: function (raw) {
      try {
        var m = JSON.parse(raw);
        if (m && typeof m.id === "string" && m.method) {
          var result = handle(m.method, m.payload);
          // asynchronously (so that the app's listener registration (listen) has time)
          window.dispatchEvent(new MessageEvent("message", {
            data: JSON.stringify({ id: m.id, result: result }),
          }));
        }
      } catch (e) {
        console.error("[MyDU-unlock] bridge parse error:", e);
      }
    },
  };
  try {
    Object.defineProperty(window, "ReactNativeWebView", {
      value: Object.freeze(rnwv),
      configurable: false,
      writable: false,
    });
  } catch (e) {
    try { window.ReactNativeWebView = rnwv; } catch (e2) {}
  }
})();
