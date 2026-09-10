# umeia-widget

Floating chat-bubble widget, embeddable on any website, that talks to a
tenant's bot on [umeiacore](../umeiacore) over its `webchat` channel
(`core/webhook/webchat.py`). Plain JS/CSS, no build step, no dependencies —
`widget.js` is deployed as a single static file.

## Embed snippet

```html
<script
  src="https://widget.umeia.io/widget.js"
  data-tenant="infoumeiaio"
  async
></script>
```

Optional attributes on the same tag:

| Attribute | Default | Description |
|---|---|---|
| `data-api-base` | `https://umeia.space` | umeiacore base URL |
| `data-color` | `#6c3ce0` | accent color |
| `data-position` | `bottom-right` | `bottom-right` \| `bottom-left` |
| `data-title` | `Umeia` | chat panel header title |

Each tenant must have a matching `webhook_mapping.webchat.allowed_origins`
entry in its `tenant_configs/*.json` (umeiacore) listing the exact origin(s)
the widget will be embedded on — the backend rejects any other `Origin`.

## How it works

- Generates a `conversation_id` (`crypto.randomUUID()`) on first open and
  persists it in `localStorage` (namespaced per tenant), so a returning
  visitor keeps their conversation.
- Also caches the visible transcript in `localStorage` (last 50 messages)
  purely for reload continuity — umeiacore is still the source of truth for
  the actual conversation/flow state.
- Renders inside a Shadow DOM so the widget's styles can't leak into (or be
  broken by) the host page's CSS.
- On first-ever open, silently sends `"hola"` to trigger the bot's own
  greeting instead of showing an empty panel.
- Every message is a `POST {api-base}/webhook/webchat/message?tenant_id=...`
  with `{tenant_id, conversation_id, message}`, rendering the `reply` field
  from the JSON response.

## Local testing

1. Run umeiacore locally: `cd ../umeiacore && uvicorn main:app --reload`.
2. Serve this folder so the page's origin matches what's allow-listed for
   `infoumeiaio` in `tenant_configs/infoumeiaio.json`:
   ```
   python3 -m http.server 5500
   ```
3. Open `http://localhost:5500/test.html` and click the bubble.

(Opening `test.html` directly via `file://` also works — Chrome sends
`Origin: null` for `file://` pages, which is already in `infoumeiaio`'s
`allowed_origins` for convenience, but the dev server is closer to how it'll
actually run on a real site.)

## Deploy

Static hosting (Vercel, matching `umeia-slackbot`'s deploy pattern):

```
vercel deploy --prod
```

`vercel.json` here is intentionally minimal — no framework, just serves the
files in this directory as-is. Point `widget.umeia.io` at the deployment,
and update each tenant's embed snippet / `data-api-base` once umeiacore's
real public URL is known.
