/**
 * Captivly Chat Widget Loader
 *
 * Usage: Add this script to your site with a data-business-id attribute:
 * <script src="https://app.captivly.ai/widget-loader.js" data-business-id="YOUR_ID"></script>
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var businessId = script.getAttribute("data-business-id");
  var position = script.getAttribute("data-position") || "bottom-right";
  var color = script.getAttribute("data-color") || "#18181b";
  var baseUrl = script.src.replace("/widget-loader.js", "");

  if (!businessId) {
    console.error("Captivly: data-business-id attribute is required");
    return;
  }

  // Create toggle button
  var btn = document.createElement("button");
  btn.id = "captivly-toggle";
  btn.setAttribute("aria-label", "Open chat");
  btn.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
  btn.style.cssText =
    "position:fixed;bottom:20px;" +
    (position === "bottom-left" ? "left:20px;" : "right:20px;") +
    "z-index:99999;width:56px;height:56px;border-radius:50%;border:none;background:" + color + ";color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.15);transition:transform .2s;";

  btn.addEventListener("mouseenter", function () {
    btn.style.transform = "scale(1.1)";
  });
  btn.addEventListener("mouseleave", function () {
    btn.style.transform = "scale(1)";
  });

  // Create iframe container
  var container = document.createElement("div");
  container.id = "captivly-container";
  container.style.cssText =
    "position:fixed;bottom:88px;" +
    (position === "bottom-left" ? "left:20px;" : "right:20px;") +
    "z-index:99998;width:380px;height:520px;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.18);display:none;";

  var iframe = document.createElement("iframe");
  iframe.src = baseUrl + "/widget/" + businessId;
  iframe.style.cssText = "width:100%;height:100%;border:none;";
  iframe.setAttribute("title", "Chat widget");
  container.appendChild(iframe);

  document.body.appendChild(btn);
  document.body.appendChild(container);

  var open = false;
  btn.addEventListener("click", function () {
    open = !open;
    container.style.display = open ? "block" : "none";
    btn.innerHTML = open
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
    btn.setAttribute("aria-label", open ? "Close chat" : "Open chat");
  });
})();
