// Load main.js into the page's JS context (document_start, before the site's scripts).
// This classic injection technique works on both Chrome and Firefox.
(function () {
  const s = document.createElement("script");
  s.src = (typeof browser !== "undefined" ? browser : chrome).runtime.getURL("main.js");
  s.type = "text/javascript";
  document.documentElement.appendChild(s);
})();
