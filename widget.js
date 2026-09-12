/**
 * Umeia webchat widget — floating chat bubble embeddable on any website.
 *
 * Embed with:
 *   <script src="https://webchat.umeia.io/widget.js" data-tenant="TENANT_SLUG" async></script>
 *
 * Optional data-attributes on the same <script> tag:
 *   data-api-base    umeiacore base URL (default: https://umeia.space)
 *   data-color       accent color, any valid CSS color (default: #6c3ce0)
 *   data-position    "bottom-right" | "bottom-left" (default: bottom-right)
 *   data-title       header name (default: "Umeia Team")
 *   data-subtitle    small line under the header name (default: "En línea")
 *   data-greeting    bold greeting line in the header (default: "¡Hola! 👋")
 *   data-description line under the greeting (default: "¿En qué te puedo ayudar hoy?")
 *
 * Talks to umeiacore's webchat channel: POST {api-base}/webhook/webchat/message
 * (see core/webhook/webchat.py). No build step, no dependencies.
 */
(function () {
  "use strict";

  var scriptTag = document.currentScript;
  if (!scriptTag) return;

  var TENANT_ID = scriptTag.getAttribute("data-tenant");
  if (!TENANT_ID) {
    console.error("[umeia-widget] Missing required data-tenant attribute.");
    return;
  }

  var API_BASE = (scriptTag.getAttribute("data-api-base") || "https://umeia.space").replace(/\/$/, "");
  var ACCENT_COLOR = scriptTag.getAttribute("data-color") || "#6c3ce0";
  var POSITION = scriptTag.getAttribute("data-position") === "bottom-left" ? "left" : "right";
  var TITLE = scriptTag.getAttribute("data-title") || "Umeia Team";
  var SUBTITLE = scriptTag.getAttribute("data-subtitle") || "En línea";
  var GREETING = scriptTag.getAttribute("data-greeting") || "¡Hola! 👋";
  var DESCRIPTION = scriptTag.getAttribute("data-description") || "¿En qué te puedo ayudar hoy?";

  // Umeia "U" mark (from umeia-projects/umeia-client-insights public/umeia-icon.png),
  // inlined so the widget stays a single dependency-free file.
  var LOGO_SRC = "data:image/jpeg;base64,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";

  // Real team headshots (root of the umeia-widget project folder), resized
  // to 80x80 and re-encoded at moderate JPEG quality so the widget stays a
  // single self-contained file without bloating it.
  var TEAM_AVATAR_1 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/2wBDAQoKCg0MDRoPDxo3JR8lNzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzf/wAARCABQAFADASIAAhEBAxEB/8QAGwAAAQUBAQAAAAAAAAAAAAAABAABAgUGAwf/xAAyEAABBAECAwYFAgcAAAAAAAABAAIDEQQhMQUScQYTIkFRYQcUIzKBJJFCUqGxweHw/8QAGAEAAwEBAAAAAAAAAAAAAAAAAAECBAP/xAAcEQEBAQADAQEBAAAAAAAAAAAAARECAxIhUUH/2gAMAwEAAhEDEQA/APY0kydBHSTJpRcUg1HhO2+yA8n7c/ELiMXEn4/Z6YtxoTymZsYIe4b6nyCE4R8TeOxuac4Y+TEAA5piLX9bFWtLwE8OhxoeG88RyI4+eWJzfFZ1cdRrqn4lwXg3E8XJlx3Qukijc890dQQLv+mqzXsv42Tp443ODlxZ2HDlY7w+KZge0g3uEQsh8LsZ2P2VY9xeWzzySsDj/CaH+Fr1ol2MlmXCSSSTJzCSZOgHCciwR6ikwToDCfPcNx+NOJAM8ej3tZq32JV1h4+JFjSyQRxkZN/ab570VN2kjdjcZkdh48eQ0VI9jZeRzXncG9CDVozs7HPky99LGzGx4nlwZG6wD12vpoFl831jdecvDWowsf5bFZDYJaNaFD/vJEKDJGvFg/hTWmTJjFbbdpJJJJk5J1FK0BK63Q8mQTYj0HqV0mP0n9EJpy9QmGS+Ulyu0Wc9z9Ji0fsP9rT4sfLBHEAAyPSgNDqh4sP9fLkWKe0AD0Pn/YKwaANBsFPHjlt/V8+WySfxKN1O90Yx1hV4cO/az8oyF2pHuqsQ7pJJJBwSTJIBpT9J3RBXTQPZF5B+g/ogWG2ghOFUmHX3XQbdVxZ9x6Ih2nKqogcnlzmO9Y6H7o2B1uKrswlksDga8RafyEVjOt46JULIbJ1Fh09lJSYW09qNpWgIZD+WF3nYpV2I4uhI/leQn7SuLeBZpaSCI7sbjUKt7MzSTcOe+aUvd3pALt6oInOb5V4vn0tmbnoipR9Ox5INh8Rs+SMBuL8KqiAM0tc6Np2LgiMUODiT7gGkDlOAkaCNiqGKTu+PZMmPlZBBkIHNKTp6VtSns7Jwn116+q9lyN/DYjAO4U0NgGR2M18pBc4kihVBEo3fqLMuP//Z";
  var TEAM_AVATAR_2 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAkGBwgHBgkIBwgKCgkLDRYPDQwMDRsUFRAWIB0iIiAdHx8kKDQsJCYxJx8fLT0tMTU3Ojo6Iys/RD84QzQ5Ojf/2wBDAQoKCg0MDRoPDxo3JR8lNzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzc3Nzf/wAARCABQAFADASIAAhEBAxEB/8QAHAAAAgIDAQEAAAAAAAAAAAAAAwcBBAIFBggA/8QAMhAAAQMDAgQDBgYDAAAAAAAAAQACAwQFESExBgcSURRBcRMiYYGRwSQyM1KhsUJE0f/EABkBAAMBAQEAAAAAAAAAAAAAAAIDBAUBAP/EACIRAAICAgIBBQEAAAAAAAAAAAABAgMRIQQSMSIyYXGBQf/aAAwDAQACEQMRAD8AZZCxLUYhYkK9MnK7moMpawZcQB3KtkLXXV3TE84zhpOO+iOKTZxvAprzxXxPxDcJ4+F45YqKJ/S18LB1PAO7nHbPZW+FuI+I4b3T2rieI9NVkRTPYA4OxkDLdDnC3XCtPUW2z22lhpmlj25lJaeoEnJ8xjGexWuvcs092gnETWQ01bGQcEu0eAdc/bZY8uTNWp/zJpx4ydbe8nZyBAk3VqYYJVV+605LBEDJUZUlYoTh3JCxIRCFiQiQAFwWtrmh5cDsQj3q6UVoo3VVxqWQQt06nnc9gNyfgEpuJ+axke+Lh+lwNvEVI1Poz/v0TFKMdsFpvwMRjsU/s2HPRIQ7G7R3+K08ULqqulie4uj8Q2QEtwSAMk+mgC57gvjKju7WU1xqfB3TOA92PZz57Z0B+B+S6GKspbVeJWXKqDH1PSyKR7QxhOp6c7An47rIahK2MJaWTVhZJVtrejcTDdU5NFdlVGXdas0QIEVCkqEB470oUzulpI3RiqVXKI43SPIDGAuJPkBqiissS2Izmhd33HiCoiL8w0h9jGM6Aj8x+Z/pcA/dba7zGoqZ5XHJfI55+Zz91qu65ZtnKvGQT1nVV9ZVRsjqaqeZjPytkkLgPTKxePNBO6mkslEWNLlHeq2qFZbaqd8sMETZIes5LNcEA9tRp5Lv5dSlTyefi/VjP3Uh/h7U1ZDqnQfoR5+QRUL4lRkd0Rw7uR2NFrbrSx1tvqaacvEcsZa4sdg49VecclVa04ppSP2FMWkIxliqunLGN+X0l0czTQTxZH1BH9JW1EXh6maLqD/ZPc3qbs4g4yvQXEVwbQ26plJwIoXP+gXnlri9xe47nqcs/jWzsk+z8FvJqhWl1QOTTTsgHdWHDPqUB+hTpCYjB5R22o8fUXTMfhxE6Ejq94uJBGnbQpkyuwuE5aVIgpaaAf7MUrj6sfp/BK7WZ6GqfaP6xlker/EDkegmU5USOQjlHlnEhkkqvWH8O/0RigVX6LlTL2slj7kLTmbLI211ePdBYRodwUnv8Md04OZ/SLNUuDjqz7hJ0HDVlcLXb7NHmbcfognVBcclFeekY8zuglVSZNEYHBEnQbGR5vqIz8wSmBK5K7hCciOgc0/oVw6h8HafdMeSQg4U9DwpL5ZTYs9X8EucM6lYF4Qy7KjKdkXhH//Z";
  var TEAM_AVATAR_3 = "data:image/jpeg;base64,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";

  // Quick-reply shortcuts shown above the conversation — each just sends its
  // own label as if the visitor typed it, so it rides the same intent
  // classification as everything else (no separate code path to keep in sync).
  var QUICK_REPLIES = [
    { icon: "chat", label: "¿Qué es Umeia?" },
    { icon: "calendar", label: "Quiero agendar una reunión" },
    { icon: "price", label: "¿Cuánto cuesta?" }
  ];

  // How far the quick-replies card tucks up behind the header's bottom edge
  // (cosmetic — lets its rounded top corners peek into the header rather
  // than sitting as a flat sibling). Content inside the card (both the full
  // list and the collapsed pill) is offset down by this same amount so it
  // never lands in the zone hidden behind the header — see QR_HEADER_OVERLAP
  // usages in the CSS and QR_COLLAPSED_HEIGHT below.
  var QR_HEADER_OVERLAP = 34;

  var QR_ICONS = {
    chat: '<path d="M4 4h16a1 1 0 011 1v11a1 1 0 01-1 1H8l-4 4V6a2 2 0 012-2z"/>',
    calendar: '<path d="M7 2v2H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zm-2 6h14v11H5V8z"/>',
    price: '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15.5v1h-2v-1.1c-1.4-.3-2.5-1.2-2.6-2.7h1.7c.1.8.7 1.4 1.9 1.4 1.3 0 2-.6 2-1.4 0-.8-.6-1.2-2.1-1.6-2-.5-3.3-1.2-3.3-2.9 0-1.4 1.1-2.4 2.5-2.7V6.5h2v1c1.3.3 2.2 1.2 2.3 2.5h-1.7c-.1-.7-.6-1.3-1.7-1.3-1.2 0-1.8.5-1.8 1.2 0 .7.6 1 2 1.4 2.1.5 3.4 1.3 3.4 3.1 0 1.5-1.2 2.5-2.6 2.8z"/>'
  };

  // Faint "nucleus" rings behind the header, concentrated on the right
  // side (matching the reference) instead of spread across the whole
  // banner — decorative only.
  var HEADER_PATTERN_SVG =
    '<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">' +
    '<g fill="none" stroke="#ffffff">' +
    '<circle cx="330" cy="70" r="18" opacity="0.12"/>' +
    '<circle cx="330" cy="70" r="42" opacity="0.09"/>' +
    '<circle cx="330" cy="70" r="68" opacity="0.06"/>' +
    '<circle cx="330" cy="70" r="94" opacity="0.04"/>' +
    '<line x1="330" y1="70" x2="380" y2="30" opacity="0.15"/>' +
    '<line x1="330" y1="70" x2="365" y2="130" opacity="0.15"/>' +
    "</g>" +
    '<g fill="#ffffff">' +
    '<circle cx="330" cy="70" r="3" opacity="0.4"/>' +
    '<circle cx="380" cy="30" r="2" opacity="0.35"/>' +
    '<circle cx="365" cy="130" r="2" opacity="0.35"/>' +
    "</g>" +
    "</svg>";

  var STORAGE_PREFIX = "umeia_widget_" + TENANT_ID + "_";
  var CONVERSATION_KEY = STORAGE_PREFIX + "conversation_id";
  var TRANSCRIPT_KEY = STORAGE_PREFIX + "transcript";

  function getConversationId() {
    var id = localStorage.getItem(CONVERSATION_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      localStorage.setItem(CONVERSATION_KEY, id);
    }
    return id;
  }

  function loadTranscript() {
    try {
      var raw = localStorage.getItem(TRANSCRIPT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTranscript(transcript) {
    try {
      // Keep it bounded — this is just for reload continuity, not an archive.
      localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(transcript.slice(-50)));
    } catch (e) {
      /* localStorage full or unavailable — degrade silently */
    }
  }

  function formatTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  var css = [
    ":host, .umeia-root { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }",
    ".umeia-root * { box-sizing: border-box; }",

    // Floating button — the outer glow is a blurred, pulsing halo sitting
    // behind the button (negative z-index), plus a small "online" dot on
    // the button itself so the closed state still reads as active.
    ".umeia-bubble-wrap { position: fixed; bottom: 20px; " + POSITION + ": 20px; z-index: 2147483000; width: 60px; height: 60px; }",
    ".umeia-bubble-glow {",
    "  position: absolute; inset: -18px; border-radius: 50%; z-index: 0;",
    "  background: radial-gradient(circle, color-mix(in srgb, " + ACCENT_COLOR + " 70%, transparent) 0%, transparent 72%);",
    "  filter: blur(10px); animation: umeia-pulse 2.6s ease-in-out infinite;",
    "}",
    "@keyframes umeia-pulse { 0%, 100% { opacity: .65; transform: scale(1); } 50% { opacity: 1; transform: scale(1.16); } }",
    ".umeia-bubble {",
    "  position: absolute; inset: 0; z-index: 1; border-radius: 50%; border: none; cursor: pointer; padding: 0; overflow: hidden;",
    "  background: " + ACCENT_COLOR + "; box-shadow: 0 4px 16px rgba(0,0,0,0.3); transition: transform .15s ease;",
    "}",
    ".umeia-bubble:hover { transform: scale(1.06); }",
    ".umeia-bubble img { width: 100%; height: 100%; object-fit: cover; }",
    ".umeia-bubble-dot {",
    "  position: absolute; right: 1px; bottom: 1px; width: 15px; height: 15px; z-index: 2;",
    "  border-radius: 50%; background: #2ecc71; border: 3px solid #fff;",
    "}",

    ".umeia-panel {",
    "  position: fixed; bottom: 92px; " + POSITION + ": 20px; z-index: 2147483000;",
    "  width: 380px; max-width: calc(100vw - 40px); height: 640px; max-height: calc(100vh - 100px);",
    "  background: #fff; border-radius: 20px; box-shadow: 0 12px 40px rgba(20,10,50,0.25);",
    "  display: none; flex-direction: column; overflow: hidden;",
    "  transform-origin: bottom " + POSITION + ";",
    "}",
    // Keyframes (not a transition) so the reveal plays even though display
    // just flipped from none to flex in the same frame — transitions can't
    // animate out of display:none, animations can.
    "@keyframes umeia-panel-in {",
    "  from { opacity: 0; transform: translateY(18px) scale(.94); }",
    "  to { opacity: 1; transform: translateY(0) scale(1); }",
    "}",
    ".umeia-panel.umeia-open {",
    "  display: flex; animation: umeia-panel-in .32s cubic-bezier(0.16, 1, 0.3, 1) both;",
    "}",
    "@media (prefers-reduced-motion: reduce) {",
    "  .umeia-panel.umeia-open { animation: none; }",
    "}",

    // On phones the floating card doesn't work — mount as a fullscreen
    // sheet instead, like every mobile chat widget does, and hide the
    // bubble underneath it so there's no floating leftover behind the sheet.
    "@media (max-width: 480px) {",
    "  @keyframes umeia-panel-in-mobile {",
    "    from { opacity: 0; transform: translateY(28px) scale(1); }",
    "    to { opacity: 1; transform: translateY(0) scale(1); }",
    "  }",
    "  .umeia-panel.umeia-open { animation: umeia-panel-in-mobile .32s cubic-bezier(0.16, 1, 0.3, 1) both; }",
    "  .umeia-panel {",
    "    inset: 0; bottom: 0; right: 0; left: 0; top: 0;",
    "    width: 100%; max-width: 100%;",
    // dvh tracks the browser's dynamic toolbar; JS (syncMobileViewportHeight)
    // additionally pins this to visualViewport.height so the on-screen
    // keyboard doesn't leave the input row hidden below the fold.
    "    height: 100vh; max-height: 100vh;",
    "    height: 100dvh; max-height: 100dvh;",
    "    border-radius: 0;",
    "  }",
    "  .umeia-root.umeia-panel-open .umeia-bubble-wrap { display: none; }",
    "}",

    // Header — dark gradient, holds identity row + a persistent greeting.
    ".umeia-header {",
    // Explicit z-index (not just position:relative) so this whole header —
    // including the kebab dropdown menu inside it — paints above
    // .umeia-quickreplies, which has its own z-index:1 and a negative
    // top-margin that pulls it up into the header's box. Without this, the
    // header defaulted to the stacking-context equivalent of z-index:0 and
    // the quickreplies card silently intercepted clicks on the lower half
    // of the kebab menu (it was visible, just not the actual click target).
    "  position: relative; z-index: 2; overflow: hidden;",
    "  background: linear-gradient(155deg, #140b28 0%, color-mix(in srgb, " + ACCENT_COLOR + " 55%, #140b28 45%) 130%);",
    "  color: #fff; padding: 14px 16px 46px; flex-shrink: 0;",
    "}",
    ".umeia-header-pattern { position: absolute; inset: 0; z-index: 0; pointer-events: none; }",
    ".umeia-header-pattern svg { width: 100%; height: 100%; display: block; }",
    ".umeia-header-top { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 8px; }",
    ".umeia-header-left { display: flex; align-items: center; gap: 10px; min-width: 0; }",
    ".umeia-header-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }",
    ".umeia-avatar-wrap { position: relative; width: 36px; height: 36px; flex-shrink: 0; }",
    ".umeia-avatar-wrap img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; display: block; }",
    ".umeia-header-name { font-weight: 700; font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".umeia-header-subtitle { font-size: 12px; color: rgba(255,255,255,.75); margin-top: 1px; display: flex; align-items: center; gap: 5px; }",
    ".umeia-header-subtitle::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #2ecc71; display: inline-block; }",
    // Decorative "team is online" cluster — no real teammates behind this
    // single-bot setup, so it's just three tinted circles, matching the
    // reference's look without pretending there are staff accounts.
    ".umeia-team-cluster { display: flex; align-items: center; }",
    ".umeia-team-avatar {",
    "  width: 26px; height: 26px; border-radius: 50%; margin-left: -10px;",
    "  border: 2px solid color-mix(in srgb, " + ACCENT_COLOR + " 55%, #140b28 45%);",
    "  background-size: cover; background-position: center;",
    "}",
    ".umeia-team-avatar:first-child { margin-left: 0; }",
    ".umeia-kebab-wrap { position: relative; flex-shrink: 0; }",
    ".umeia-kebab {",
    "  background: transparent; border: none; color: rgba(255,255,255,.85); font-size: 16px; cursor: pointer;",
    "  line-height: 1; width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; letter-spacing: 1px;",
    "}",
    ".umeia-kebab:hover { background: rgba(255,255,255,.15); }",
    ".umeia-kebab-menu {",
    "  display: none; position: absolute; top: 28px; " + POSITION + ": 0; z-index: 5;",
    "  background: #fff; border-radius: 12px; box-shadow: 0 8px 28px rgba(20,10,50,.22); padding: 6px; min-width: 190px;",
    "}",
    ".umeia-kebab-menu.umeia-open { display: block; }",
    ".umeia-kebab-menu button {",
    "  display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 10px; border: none; background: none;",
    "  border-radius: 8px; font-size: 13px; color: #2a2440; cursor: pointer; text-align: left; font-family: inherit;",
    "}",
    ".umeia-kebab-menu button:hover { background: #f4f2fa; }",
    ".umeia-close {",
    "  background: rgba(255,255,255,.12); border: none; color: #fff; font-size: 18px; cursor: pointer;",
    "  line-height: 1; width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;",
    "}",
    ".umeia-close:hover { background: rgba(255,255,255,.22); }",
    ".umeia-greeting { position: relative; z-index: 1; margin-top: 14px; }",
    ".umeia-greeting-title { font-size: 18px; font-weight: 700; }",
    ".umeia-greeting-sub { font-size: 13px; color: rgba(255,255,255,.8); margin-top: 3px; }",

    ".umeia-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; background: #f7f6fb; }",

    // Quick-reply card — pulled up over the header's bottom edge so it
    // reads as a floating panel rather than just another list in the feed.
    // Its height is driven frame-by-frame from messages scrollTop (see
    // updateQrCollapse), not a CSS transition, so it scrubs with the drag
    // instead of animating on a delay.
    ".umeia-quickreplies {",
    "  background: #fff; border-radius: 18px; box-shadow: 0 10px 30px rgba(20,10,50,0.18);",
    "  flex-shrink: 0; position: relative; z-index: 1; margin: -" + QR_HEADER_OVERLAP + "px 14px 0; overflow: hidden;",
    "}",
    // Both the full list and the collapsed pill start their actual content
    // QR_HEADER_OVERLAP below the card's own top edge — i.e. right at the
    // header's bottom edge, not inside the -34px zone that's tucked behind
    // it (see .umeia-quickreplies above). Without this, the "Preguntas
    // frecuentes" label and — worse — the entire collapsed "Agendar demo"
    // pill (whose content is vertically centered in a card as short as
    // QR_COLLAPSED_HEIGHT) rendered underneath the opaque header and were
    // invisible/unclickable.
    ".umeia-qr-full { padding: " + QR_HEADER_OVERLAP + "px 12px 12px; }",
    ".umeia-qr-collapsed {",
    "  position: absolute; top: " + QR_HEADER_OVERLAP + "px; left: 0; right: 0; bottom: 0;",
    "  display: flex; align-items: center; gap: 10px; padding: 0 14px;",
    "  opacity: 0; cursor: pointer;",
    "}",
    ".umeia-qr-collapsed-icon {",
    "  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;",
    "  background: color-mix(in srgb, " + ACCENT_COLOR + " 14%, white); display: flex; align-items: center; justify-content: center;",
    "}",
    ".umeia-qr-collapsed-icon svg { width: 13px; height: 13px; fill: " + ACCENT_COLOR + "; }",
    ".umeia-qr-collapsed-label { flex: 1; font-size: 13px; font-weight: 600; color: #201f26; }",
    ".umeia-qr-title { font-size: 12px; font-weight: 700; color: #9a98a5; padding: 4px 6px 10px; }",
    ".umeia-qr-item {",
    "  width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px; border: none;",
    "  background: #f4f2fa; border-radius: 12px; cursor: pointer; text-align: left; font-family: inherit;",
    "  margin-bottom: 8px; transition: background .15s ease;",
    "}",
    ".umeia-qr-item:last-child { margin-bottom: 0; }",
    ".umeia-qr-item:hover { background: color-mix(in srgb, " + ACCENT_COLOR + " 10%, #f4f2fa); }",
    ".umeia-qr-icon {",
    "  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;",
    "  background: #fff; display: flex; align-items: center; justify-content: center;",
    "}",
    ".umeia-qr-icon svg { width: 15px; height: 15px; fill: " + ACCENT_COLOR + "; }",
    ".umeia-qr-label { flex: 1; font-size: 13px; color: #201f26; }",
    ".umeia-qr-chevron { color: #c3c1cc; font-size: 16px; }",

    ".umeia-date-divider { text-align: center; font-size: 11.5px; color: #a9a7b3; flex-shrink: 0; }",

    ".umeia-row { display: flex; gap: 8px; align-items: flex-end; }",
    ".umeia-row-user { justify-content: flex-end; }",
    ".umeia-row-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }",
    ".umeia-msg-col { display: flex; flex-direction: column; max-width: 78%; }",
    ".umeia-row-user .umeia-msg-col { align-items: flex-end; }",
    ".umeia-msg { padding: 9px 13px; border-radius: 16px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; word-wrap: break-word; }",
    ".umeia-msg.umeia-bot { background: #fff; color: #201f26; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(20,10,50,0.08); }",
    ".umeia-msg.umeia-user { background: " + ACCENT_COLOR + "; color: #fff; border-bottom-right-radius: 4px; }",
    ".umeia-caption { font-size: 11px; color: #a09eab; margin-top: 4px; padding: 0 4px; display: flex; align-items: center; gap: 3px; }",
    ".umeia-check { color: " + ACCENT_COLOR + "; }",
    ".umeia-error-row { align-self: center; }",
    ".umeia-msg.umeia-error { background: #fde8e8; color: #a41c1c; border-radius: 12px; }",
    ".umeia-typing { align-self: flex-start; font-size: 13px; color: #9a98a5; padding: 2px 8px 2px 32px; }",

    ".umeia-inputrow { display: flex; align-items: flex-end; gap: 8px; padding: 10px 12px; background: #fff; border-top: 1px solid #efedf5; flex-shrink: 0; }",
    ".umeia-pill {",
    "  flex: 1; display: flex; flex-direction: column; background: #f4f2fa; border-radius: 18px;",
    "  padding: 8px 14px; border: 1px solid transparent; transition: border-color .15s ease; min-width: 0;",
    "}",
    ".umeia-pill:focus-within { border-color: " + ACCENT_COLOR + "; }",
    ".umeia-pill input {",
    "  border: none; background: transparent; padding: 2px 0; font-size: 14px; outline: none; width: 100%;",
    "}",
    ".umeia-pill-icons { display: flex; align-items: center; gap: 12px; margin-top: 4px; position: relative; }",
    ".umeia-icon-btn {",
    "  background: transparent; border: none; padding: 0; cursor: pointer; color: #9a98a5;",
    "  display: flex; align-items: center; justify-content: center; width: 18px; height: 18px;",
    "}",
    ".umeia-icon-btn:hover { color: " + ACCENT_COLOR + "; }",
    ".umeia-icon-btn svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }",
    // Emoji popover — anchored above the icon row since the input sits at
    // the bottom of the panel.
    ".umeia-emoji-picker {",
    "  position: absolute; bottom: 100%; left: -6px; margin-bottom: 8px; width: 216px;",
    "  background: #fff; border-radius: 14px; box-shadow: 0 8px 26px rgba(20,10,50,0.22);",
    "  padding: 8px; display: none; grid-template-columns: repeat(6, 1fr); gap: 2px; max-height: 168px; overflow-y: auto; z-index: 5;",
    "}",
    ".umeia-emoji-picker.umeia-open { display: grid; }",
    ".umeia-emoji-picker button {",
    "  background: transparent; border: none; cursor: pointer; font-size: 19px; line-height: 1;",
    "  padding: 5px 0; border-radius: 8px;",
    "}",
    ".umeia-emoji-picker button:hover { background: #f4f2fa; }",
    ".umeia-attach-chip {",
    "  display: none; align-items: center; gap: 6px; font-size: 12px; color: #6c6a76;",
    "  background: #f4f2fa; border-radius: 999px; padding: 4px 8px 4px 10px; margin-top: 4px; max-width: 100%;",
    "}",
    ".umeia-attach-chip.umeia-open { display: inline-flex; }",
    ".umeia-attach-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }",
    ".umeia-attach-chip button {",
    "  background: transparent; border: none; cursor: pointer; color: #9a98a5; font-size: 14px; line-height: 1; padding: 0;",
    "}",
    ".umeia-send {",
    "  width: 38px; height: 38px; border-radius: 50%; border: none; cursor: pointer; flex-shrink: 0;",
    "  background: " + ACCENT_COLOR + "; display: flex; align-items: center; justify-content: center;",
    "  transition: transform .1s ease, opacity .15s ease;",
    "}",
    ".umeia-send:hover:not(:disabled) { transform: scale(1.05); }",
    ".umeia-send:disabled { opacity: 0.5; cursor: default; }",
    ".umeia-send svg { width: 15px; height: 15px; fill: #fff; margin-left: -1px; }",

    ".umeia-footer { text-align: center; font-size: 11px; color: #b3b1bd; padding: 6px 0 10px; background: #fff; flex-shrink: 0; }",
    ".umeia-footer a { color: #b3b1bd; }"
  ].join("\n");

  var host = document.createElement("div");
  host.id = "umeia-widget-host";
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: "open" });

  var style = document.createElement("style");
  style.textContent = css;
  shadow.appendChild(style);

  var root = document.createElement("div");
  root.className = "umeia-root";
  shadow.appendChild(root);

  var bubbleWrap = document.createElement("div");
  bubbleWrap.className = "umeia-bubble-wrap";
  bubbleWrap.innerHTML =
    '<div class="umeia-bubble-glow"></div>' +
    '<button class="umeia-bubble" aria-label="Abrir chat"><img src="' + LOGO_SRC + '" alt="" /></button>' +
    '<span class="umeia-bubble-dot"></span>';
  root.appendChild(bubbleWrap);
  var bubble = bubbleWrap.querySelector(".umeia-bubble");

  function quickReplyHtml() {
    return QUICK_REPLIES.map(function (qr, idx) {
      return (
        '<button class="umeia-qr-item" data-qr-index="' + idx + '">' +
        '  <span class="umeia-qr-icon"><svg viewBox="0 0 24 24">' + (QR_ICONS[qr.icon] || QR_ICONS.chat) + "</svg></span>" +
        '  <span class="umeia-qr-label">' + qr.label + "</span>" +
        '  <span class="umeia-qr-chevron">›</span>' +
        "</button>"
      );
    }).join("");
  }

  var EMOJI_LIST = [
    "😀", "😂", "🙂", "😍", "😅", "😊", "🤔", "😢",
    "👍", "🙏", "👋", "🙌", "💪", "🤝", "🎉", "🔥",
    "❤️", "✅", "❌", "⭐", "💡", "📅", "💬", "📎"
  ];

  function emojiPickerHtml() {
    return EMOJI_LIST.map(function (e) {
      return '<button type="button" data-emoji="' + e + '">' + e + "</button>";
    }).join("");
  }

  var panel = document.createElement("div");
  panel.className = "umeia-panel";
  panel.innerHTML =
    '<div class="umeia-header">' +
    '  <div class="umeia-header-pattern">' + HEADER_PATTERN_SVG + "</div>" +
    '  <div class="umeia-header-top">' +
    '    <div class="umeia-header-left">' +
    '      <div class="umeia-avatar-wrap">' +
    '        <img src="' + LOGO_SRC + '" alt="" />' +
    "      </div>" +
    '      <div class="umeia-header-text">' +
    '        <div class="umeia-header-name">' + TITLE + "</div>" +
    '        <div class="umeia-header-subtitle">' + SUBTITLE + "</div>" +
    "      </div>" +
    "    </div>" +
    '    <div class="umeia-header-right">' +
    '      <div class="umeia-team-cluster">' +
    '        <span class="umeia-team-avatar" style="background-image:url(' + TEAM_AVATAR_1 + ')"></span>' +
    '        <span class="umeia-team-avatar" style="background-image:url(' + TEAM_AVATAR_2 + ')"></span>' +
    '        <span class="umeia-team-avatar" style="background-image:url(' + TEAM_AVATAR_3 + ')"></span>' +
    "      </div>" +
    '      <div class="umeia-kebab-wrap">' +
    '        <button class="umeia-kebab" aria-label="Opciones">⋮</button>' +
    '        <div class="umeia-kebab-menu">' +
    '          <button class="umeia-reset-btn" type="button">🔄 Reiniciar conversación</button>' +
    "        </div>" +
    "      </div>" +
    '      <button class="umeia-close" aria-label="Cerrar chat">×</button>' +
    "    </div>" +
    "  </div>" +
    '  <div class="umeia-greeting">' +
    '    <div class="umeia-greeting-title">' + GREETING + "</div>" +
    '    <div class="umeia-greeting-sub">' + DESCRIPTION + "</div>" +
    "  </div>" +
    "</div>" +
    '<div class="umeia-quickreplies">' +
    '  <div class="umeia-qr-full">' +
    '    <div class="umeia-qr-title">Preguntas frecuentes</div>' +
    quickReplyHtml() +
    "  </div>" +
    '  <div class="umeia-qr-collapsed">' +
    '    <span class="umeia-qr-collapsed-icon"><svg viewBox="0 0 24 24">' + QR_ICONS.calendar + "</svg></span>" +
    '    <span class="umeia-qr-collapsed-label">Agendar demo</span>' +
    '    <span class="umeia-qr-chevron">›</span>' +
    "  </div>" +
    "</div>" +
    '<div class="umeia-messages">' +
    '  <div class="umeia-date-divider">Hoy</div>' +
    "</div>" +
    '<div class="umeia-inputrow">' +
    '  <div class="umeia-pill">' +
    '    <input type="text" placeholder="Escribí tu mensaje..." />' +
    '    <div class="umeia-attach-chip">' +
    "      <span></span>" +
    '      <button type="button" aria-label="Quitar archivo">×</button>' +
    "    </div>" +
    '    <div class="umeia-pill-icons">' +
    '      <button class="umeia-emoji-btn umeia-icon-btn" type="button" aria-label="Emojis">' +
    '        <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.5 10.5h.01M15.5 10.5h.01"/><path d="M8 14.5c1 1.2 2.4 1.8 4 1.8s3-.6 4-1.8"/></svg>' +
    "      </button>" +
    '      <div class="umeia-emoji-picker">' + emojiPickerHtml() + "</div>" +
    '      <button class="umeia-attach-btn umeia-icon-btn" type="button" aria-label="Adjuntar archivo">' +
    '        <svg viewBox="0 0 24 24"><path d="M16.5 6.5l-7.6 7.6a3 3 0 104.24 4.24l7.07-7.07a5 5 0 10-7.07-7.07L5.5 12.5a7 7 0 109.9 9.9"/></svg>' +
    "      </button>" +
    '      <input type="file" class="umeia-file-input" style="display:none" />' +
    "    </div>" +
    "  </div>" +
    '  <button class="umeia-send" aria-label="Enviar">' +
    '    <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>' +
    "  </button>" +
    "</div>" +
    '<div class="umeia-footer">Powered by <a href="https://umeia.io" target="_blank" rel="noopener">Umeia</a></div>';
  root.appendChild(panel);

  var messagesEl = panel.querySelector(".umeia-messages");
  var inputEl = panel.querySelector("input");
  var sendBtn = panel.querySelector(".umeia-send");
  var closeBtn = panel.querySelector(".umeia-close");
  var qrCard = panel.querySelector(".umeia-quickreplies");
  var qrFull = panel.querySelector(".umeia-qr-full");
  var qrCollapsed = panel.querySelector(".umeia-qr-collapsed");
  var emojiBtn = panel.querySelector(".umeia-emoji-btn");
  var emojiPicker = panel.querySelector(".umeia-emoji-picker");
  var attachBtn = panel.querySelector(".umeia-attach-btn");
  var fileInput = panel.querySelector(".umeia-file-input");
  var attachChip = panel.querySelector(".umeia-attach-chip");
  var kebabBtn = panel.querySelector(".umeia-kebab");
  var kebabMenu = panel.querySelector(".umeia-kebab-menu");
  var resetBtn = panel.querySelector(".umeia-reset-btn");

  var transcript = loadTranscript();
  var conversationId = getConversationId();
  var sending = false;

  // Collapses the FAQ card into a slim pill as the visitor scrolls the
  // conversation, so the suggestions don't keep eating vertical space once
  // there's an actual chat to read. Height/opacity are set directly from
  // scrollTop on every scroll event (no CSS transition) so the collapse
  // tracks the drag 1:1 instead of animating on a delay.
  var QR_COLLAPSE_RANGE = 70;
  // 52px of actual visible pill below the header, plus the QR_HEADER_OVERLAP
  // hidden behind it — without the +QR_HEADER_OVERLAP, the collapsed pill's
  // centered icon/label landed entirely inside the hidden zone (invisible
  // and unclickable, just showing a sliver of white behind the header).
  var QR_COLLAPSED_HEIGHT = 52 + QR_HEADER_OVERLAP;
  var qrNaturalHeight = 0;

  // The two layers fade on non-overlapping slices of the same scroll
  // progress (full: 0 -> QR_FADE_SPLIT, collapsed: QR_FADE_SPLIT -> 1)
  // instead of crossfading simultaneously, so the collapsed label doesn't
  // start appearing until the full list is almost entirely tucked away.
  var QR_FADE_SPLIT = 0.7;

  // qrCard sits above messagesEl in the flex column, so resizing it changes
  // messagesEl's own available height — which can clamp messagesEl's
  // scrollTop, firing another "scroll" event that recomputes this same
  // height again. With very little content (right after the very first
  // message, exactly where scrollHeight sits close to clientHeight) that
  // becomes a real feedback loop: a visible 1-2px up/down jitter. The
  // deadband below breaks it by skipping re-applications that wouldn't
  // move the needle anyway.
  var QR_HEIGHT_DEADBAND = 0.5;
  var lastAppliedQrHeight = null;

  function updateQrCollapse() {
    var progress = Math.max(0, Math.min(1, messagesEl.scrollTop / QR_COLLAPSE_RANGE));
    var height = qrNaturalHeight + (QR_COLLAPSED_HEIGHT - qrNaturalHeight) * progress;
    if (lastAppliedQrHeight !== null && Math.abs(height - lastAppliedQrHeight) < QR_HEIGHT_DEADBAND) return;
    lastAppliedQrHeight = height;
    var fullOpacity = Math.max(0, Math.min(1, 1 - progress / QR_FADE_SPLIT));
    var collapsedOpacity = Math.max(0, Math.min(1, (progress - QR_FADE_SPLIT) / (1 - QR_FADE_SPLIT)));
    qrCard.style.height = height + "px";
    qrFull.style.opacity = String(fullOpacity);
    qrCollapsed.style.opacity = String(collapsedOpacity);
    qrCollapsed.style.pointerEvents = collapsedOpacity > 0.5 ? "auto" : "none";
  }

  messagesEl.addEventListener("scroll", updateQrCollapse, { passive: true });
  qrCollapsed.addEventListener("click", function () {
    var demoReply = QUICK_REPLIES[1] ? QUICK_REPLIES[1].label : "Quiero agendar una reunión";
    pushMessage("user", demoReply);
    sendToServer(demoReply);
  });

  function renderMessage(role, text, ts) {
    if (role === "error") {
      var errRow = document.createElement("div");
      errRow.className = "umeia-row umeia-error-row";
      var errBubble = document.createElement("div");
      errBubble.className = "umeia-msg umeia-error";
      errBubble.textContent = text;
      errRow.appendChild(errBubble);
      messagesEl.appendChild(errRow);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return errRow;
    }

    var row = document.createElement("div");
    row.className = "umeia-row" + (role === "user" ? " umeia-row-user" : "");

    if (role === "bot") {
      var avatar = document.createElement("img");
      avatar.className = "umeia-row-avatar";
      avatar.src = LOGO_SRC;
      avatar.alt = "";
      row.appendChild(avatar);
    }

    var col = document.createElement("div");
    col.className = "umeia-msg-col";

    var bubbleEl = document.createElement("div");
    bubbleEl.className = "umeia-msg umeia-" + role;
    bubbleEl.textContent = text;
    col.appendChild(bubbleEl);

    var caption = document.createElement("div");
    caption.className = "umeia-caption";
    if (role === "bot") {
      caption.textContent = TITLE + " · " + formatTime(ts || Date.now());
    } else {
      caption.innerHTML = formatTime(ts || Date.now()) + ' <span class="umeia-check">✓</span>';
    }
    col.appendChild(caption);

    row.appendChild(col);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return row;
  }

  function renderAll() {
    // The date divider is a permanent fixture, not part of the replayed
    // transcript — everything else gets rebuilt.
    var children = Array.prototype.slice.call(messagesEl.children);
    children.forEach(function (child) {
      if (!child.classList.contains("umeia-date-divider")) {
        child.remove();
      }
    });
    transcript.forEach(function (m) {
      renderMessage(m.role, m.text, m.ts);
    });
  }

  // Synthesized two-tone "ding" (no external asset — keeps this file
  // dependency-free) played whenever a bot reply actually arrives live.
  // Deliberately NOT called from renderAll()'s replay of cached transcript
  // on page load/reset, only from pushMessage's "bot" branch below, so
  // reopening the widget doesn't make noise for old messages.
  var audioCtx = null;
  function playNotificationSound() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var now = audioCtx.currentTime;
      [[880, now, 0.09], [1318.5, now + 0.09, 0.11]].forEach(function (tone) {
        var freq = tone[0], start = tone[1], dur = tone[2];
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      });
    } catch (e) { /* audio unavailable — never block the actual message */ }
  }

  function pushMessage(role, text) {
    var ts = Date.now();
    transcript.push({ role: role, text: text, ts: ts });
    saveTranscript(transcript);
    renderMessage(role, text, ts);
    if (role === "bot") playNotificationSound();
  }

  function setSending(value) {
    sending = value;
    sendBtn.disabled = value;
    inputEl.disabled = value;
  }

  function sendToServer(text, attachmentUrl) {
    setSending(true);
    var typingEl = document.createElement("div");
    typingEl.className = "umeia-typing";
    typingEl.textContent = "Escribiendo...";
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    var url = API_BASE + "/webhook/webchat/message?tenant_id=" + encodeURIComponent(TENANT_ID);
    var body = {
      tenant_id: TENANT_ID,
      conversation_id: conversationId,
      message: text
    };
    if (attachmentUrl) body.attachment_url = attachmentUrl;

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        typingEl.remove();
        if (data.conversation_id) {
          conversationId = data.conversation_id;
          localStorage.setItem(CONVERSATION_KEY, conversationId);
        }
        if (data.reply) {
          pushMessage("bot", data.reply);
        }
      })
      .catch(function (err) {
        typingEl.remove();
        console.error("[umeia-widget] request failed:", err);
        renderMessage("error", "No pudimos enviar tu mensaje. Probá de nuevo en un momento.");
      })
      .finally(function () {
        setSending(false);
        inputEl.focus();
      });
  }

  var pendingAttachmentFile = null;

  function updateAttachChip() {
    if (pendingAttachmentFile) {
      attachChip.querySelector("span").textContent = pendingAttachmentFile.name;
      attachChip.classList.add("umeia-open");
    } else {
      attachChip.classList.remove("umeia-open");
    }
  }

  // Uploads to umeiacore's webchat upload endpoint (multipart/form-data),
  // which stores the file in Supabase Storage and hands back a public URL —
  // that URL becomes `attachment_url` on the next /message call, the same
  // context key the collect_files menu nodes already read for WhatsApp
  // attachments (core/webhook/webchat.py + core/menu/navigator.py).
  function uploadAttachment(file) {
    var url = API_BASE + "/webhook/webchat/upload";
    var form = new FormData();
    form.append("tenant_id", TENANT_ID);
    form.append("conversation_id", conversationId);
    form.append("file", file);
    return fetch(url, { method: "POST", body: form }).then(function (res) {
      if (!res.ok) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          throw new Error(body.detail || "HTTP " + res.status);
        });
      }
      return res.json();
    });
  }

  function handleSend() {
    var text = inputEl.value.trim();
    var file = pendingAttachmentFile;
    if (file) {
      text = (text ? text + " " : "") + "📎 " + file.name;
    }
    if (!text || sending) return;
    inputEl.value = "";
    pendingAttachmentFile = null;
    updateAttachChip();
    pushMessage("user", text);

    if (!file) {
      sendToServer(text);
      return;
    }

    setSending(true);
    uploadAttachment(file)
      .then(function (data) {
        sendToServer(text, data.attachment_url);
      })
      .catch(function (err) {
        console.error("[umeia-widget] attachment upload failed:", err);
        renderMessage("error", "No pudimos subir el archivo. Probá de nuevo o seguí sin adjuntarlo.");
        setSending(false);
        inputEl.focus();
      });
  }

  sendBtn.addEventListener("click", handleSend);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") handleSend();
  });

  emojiBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    emojiPicker.classList.toggle("umeia-open");
  });
  emojiPicker.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-emoji]");
    if (!btn) return;
    var emoji = btn.getAttribute("data-emoji");
    var start = inputEl.selectionStart != null ? inputEl.selectionStart : inputEl.value.length;
    var end = inputEl.selectionEnd != null ? inputEl.selectionEnd : inputEl.value.length;
    inputEl.value = inputEl.value.slice(0, start) + emoji + inputEl.value.slice(end);
    var newPos = start + emoji.length;
    inputEl.focus();
    inputEl.setSelectionRange(newPos, newPos);
  });
  document.addEventListener("click", function (e) {
    var path = e.composedPath ? e.composedPath() : [];
    if (path.indexOf(emojiPicker) === -1 && path.indexOf(emojiBtn) === -1) {
      emojiPicker.classList.remove("umeia-open");
    }
    if (path.indexOf(kebabMenu) === -1 && path.indexOf(kebabBtn) === -1) {
      kebabMenu.classList.remove("umeia-open");
    }
  });

  kebabBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    kebabMenu.classList.toggle("umeia-open");
  });

  // Starts a brand-new conversation_id server-side and wipes this browser's
  // cached transcript/id — the only way to escape a stuck menu-flow state
  // (e.g. mid-form) or a long history that was confusing the LLM classifier
  // on later messages, short of clearing localStorage by hand.
  resetBtn.addEventListener("click", function () {
    kebabMenu.classList.remove("umeia-open");
    try {
      localStorage.removeItem(CONVERSATION_KEY);
      localStorage.removeItem(TRANSCRIPT_KEY);
    } catch (e) { /* localStorage unavailable — in-memory reset still helps */ }
    conversationId = getConversationId();
    transcript = [];
    messagesEl.scrollTop = 0;
    renderAll();
    updateQrCollapse();
    maybeGreet();
  });

  attachBtn.addEventListener("click", function () {
    fileInput.click();
  });
  var ALLOWED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
  var MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

  fileInput.addEventListener("change", function () {
    var file = fileInput.files && fileInput.files[0];
    if (file) {
      if (ALLOWED_ATTACHMENT_TYPES.indexOf(file.type) === -1) {
        renderMessage("error", "Ese tipo de archivo no está permitido. Subí una foto o un PDF.");
      } else if (file.size > MAX_ATTACHMENT_BYTES) {
        renderMessage("error", "El archivo es demasiado grande (máximo 10 MB).");
      } else {
        pendingAttachmentFile = file;
        updateAttachChip();
      }
    }
    fileInput.value = "";
  });
  attachChip.querySelector("button").addEventListener("click", function () {
    pendingAttachmentFile = null;
    updateAttachChip();
  });

  panel.querySelectorAll(".umeia-qr-item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var idx = Number(btn.getAttribute("data-qr-index"));
      var qr = QUICK_REPLIES[idx];
      if (!qr) return;
      pushMessage("user", qr.label);
      sendToServer(qr.label);
    });
  });

  // On phones, pin the panel to the actual visible area (visualViewport),
  // not just 100dvh — dvh doesn't reliably shrink for the on-screen
  // keyboard across browsers, and without this the input row ends up
  // hidden behind the keyboard.
  var MOBILE_MEDIA = window.matchMedia ? window.matchMedia("(max-width: 480px)") : null;

  function isMobileLayout() {
    return !!(MOBILE_MEDIA && MOBILE_MEDIA.matches);
  }

  function syncMobileViewportHeight() {
    if (!isMobileLayout()) {
      panel.style.height = "";
      return;
    }
    var vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    panel.style.height = vh + "px";
  }

  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", syncMobileViewportHeight);
  }
  window.addEventListener("resize", syncMobileViewportHeight);

  // Silently sends "hola" (no visible user bubble — sendToServer only
  // renders the reply) so the tenant's own configured greeting shows up as
  // a real first message, instead of only the static header text. Safe to
  // call any time transcript is empty (first-ever open, or right after a
  // reset) — a non-empty transcript means this already happened.
  function maybeGreet() {
    if (transcript.length === 0) sendToServer("hola");
  }

  var opened = false;
  function openPanel() {
    panel.classList.add("umeia-open");
    root.classList.add("umeia-panel-open");
    opened = true;
    maybeGreet();
    // offsetHeight only resolves once the panel is actually laid out
    // (display:none ancestors report 0), so measure on open, not at init.
    qrNaturalHeight = qrFull.offsetHeight;
    lastAppliedQrHeight = null;
    updateQrCollapse();
    syncMobileViewportHeight();
    if (isMobileLayout()) {
      // Stop the page behind the fullscreen sheet from scrolling once the
      // keyboard opens — otherwise the whole layout jumps around.
      document.body.style.overflow = "hidden";
    }
    // Deliberately not auto-focusing the input: on mobile that pops the
    // keyboard immediately, shrinking the chat before the visitor even
    // sees it. Let them tap in when they're ready to type.
  }

  function closePanel() {
    panel.classList.remove("umeia-open");
    root.classList.remove("umeia-panel-open");
    opened = false;
    panel.style.height = "";
    document.body.style.overflow = "";
  }

  bubble.addEventListener("click", function () {
    if (opened) closePanel();
    else openPanel();
  });
  closeBtn.addEventListener("click", closePanel);

  renderAll();
})();
