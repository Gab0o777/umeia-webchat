# umeia-widget

Floating chat-bubble widget, embeddable on any website, that talks to a
tenant's bot on [umeiacore](../umeiacore) over its `webchat` channel
(`core/webhook/webchat.py`). Plain JS/CSS, no build step, no dependencies —
`widget.js` is deployed as a single static file.

## Embed snippet

```html
<script
  src="https://webchat.umeia.io/widget.js"
  data-tenant="TENANT_SLUG"
  async
></script>
```

Replace `TENANT_SLUG` with that client's tenant id (matching a
`tenant_configs/<slug>.json` in umeiacore — e.g. `infoumeiaio` for the
umeia.io/EspressoDevs demo tenant). Everything else in the snippet is the
same for every client; only `data-tenant` (and optionally the cosmetic
attributes below) changes per site.

Optional attributes on the same tag:

| Attribute | Default | Description |
|---|---|---|
| `data-api-base` | `https://umeia.space` | umeiacore base URL |
| `data-color` | `#6c3ce0` | accent color |
| `data-position` | `bottom-right` | `bottom-right` \| `bottom-left` |
| `data-title` | `Umeia Team` | chat panel header title |
| `data-subtitle` | `En línea` | small line under the header title |
| `data-greeting` | `¡Hola! 👋` | bold greeting line in the header |
| `data-description` | `¿En qué te puedo ayudar hoy?` | line under the greeting |
| `data-bubble-icon` | `logo` | `logo` (Umeia mark) \| `chat` (plain speech-bubble glyph, for tenants that don't want Umeia's own branding on their site) |
| `data-qr-title` | `Preguntas frecuentes` | label above the opening quick-reply buttons |
| `data-quick-replies` | Umeia's own FAQ buttons | JSON array of `{icon, label}` replacing the default buttons — see below |
| `data-demo-label` | `Agendar demo` | label for the pill the quick-replies card collapses into on scroll |
| `data-demo-icon` | `calendar` | icon key (see `data-quick-replies` below) for that pill |
| `data-demo-reply` | same as `data-demo-label` | message sent when that pill is clicked |
| `data-hide-first-reply` | unset | `"true"` silently sends the "hola" auto-greet without showing its reply anywhere — see below |

### `data-hide-first-reply`

By default, the bot's actual "hola" auto-greet reply shows up as the first
message bubble above the quick-reply buttons — which, combined with
`data-quick-replies` mirroring a tenant's own menu, can read as saying the
same thing (the tenant's full welcome text + "¿en qué situación estás?") right
above a set of buttons that already say the same options. It's cluttered.

Setting `data-hide-first-reply="true"` still sends that "hola" (the tenant's
menu still needs it to set its server-side state to "root"), but discards the
reply instead of rendering it — no message bubble, and the header stays on
whatever `data-greeting`/`data-description` are set to. Pair it with a short,
static `data-greeting` (see `adultos2000.html`'s embed of `gremio`: just
*"¡Hola! Soy el asistente virtual de Fundación El Futbolista."*, no
`data-description`) so the panel reads as one clean screen: short greeting,
quick-reply buttons, empty message list until the visitor picks one — instead
of the full welcome text twice. That "already greeted" state is tracked
separately from the transcript (`localStorage`, namespaced per tenant) so a
reload doesn't re-send "hola".

### `data-quick-replies`

Replaces the default "¿Qué es Umeia? / Quiero agendar una reunión / ¿Cuánto
cuesta?" buttons shown when the panel first opens. Clicking one sends its
`label` as if the visitor had typed it, so for a tenant whose `menu.json` root
node has its own options (see `tenant_configs/gremio.json`), setting `label`
to match an option's label exactly routes straight into it instead of relying
on any keyword/intent matching — `core/menu/navigator.py`'s
`_match_option_single` matches on exact (accent/case-insensitive) label text.

`icon` is one of `chat` \| `calendar` \| `price` \| `pencil` \| `check` \|
`info` (falls back to `chat` if omitted/unknown). Example, from
`adultos2000.html`'s embed of the `gremio` tenant — mirroring that tenant's
own WhatsApp menu root options one-for-one:

```html
<script
  src="https://webchat.umeia.io/widget.js"
  data-tenant="gremio"
  data-bubble-icon="chat"
  data-qr-title="¿En qué situación estás?"
  data-quick-replies='[
    {"icon":"pencil","label":"Quiero inscribirme"},
    {"icon":"check","label":"Ya estoy inscripto/a"},
    {"icon":"info","label":"Quiero conocer la propuesta"},
    {"icon":"chat","label":"Tengo otra consulta"}
  ]'
  data-demo-label="Conocer propuesta"
  data-demo-reply="Quiero conocer la propuesta"
  data-demo-icon="info"
  data-hide-first-reply="true"
  async
></script>
```

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

Static hosting on Vercel (project `umeia-webchat`), connected to this
repo's GitHub remote for auto-deploy — every push to `main` deploys to
production automatically, no manual `vercel deploy --prod` needed.

`vercel.json` here is intentionally minimal — no framework, just serves the
files in this directory as-is, plus a redirect from `/` to `/test.html`
(the domain has no other homepage). Custom domain: `webchat.umeia.io`
(CNAME to the project-specific `*.vercel-dns-*.com` value Vercel shows
under Project → Domains — do not reuse another project's CNAME value).
