# Copyright line as an App Builder action (demo)

Authors write only `{copyright}` in the footer. The footer block replaces it with the text
returned by this App Builder web action, which decides the year in the **company time zone**.
On 1 January the footer changes by itself: no republish, no code release.

```
Browser ──(page from Edge Delivery, footer contains {copyright})
   │  footer.js: shows a fallback at once ("© <browser year> HashiCorp"), then
   └─ fetch GET https://<namespace>.adobeioruntime.net/api/v1/web/hashicorp-site/copyright
         └─ App Builder action → {"year":2027,"text":"© 2027 HashiCorp, an IBM Company"}
```

## Files
| File | Purpose |
|---|---|
| `actions/copyright/index.js` | The action. `buildCopyright(now, settings)` is the pure logic; `main` is the I/O Runtime entry point (200 JSON, or 500 on bad configuration). |
| `app.config.yaml` | App Builder manifest: public web action `hashicorp-site/copyright`, Node.js 22, settings as inputs. |
| `test/copyright.test.js` | 9 tests (Node's built-in test runner, no dependencies). |
| `dev-server.js` | Local stand-in for I/O Runtime on port 9080. `FAKE_NOW=...` starts its clock at any moment (New Year demo). Not deployed. |

Site side (main repository): `blocks/footer/footer.js` (placeholder, call, fallback) and
`footer.css` (`.footer-copyright`). The footer fragment contains `<p>{copyright}</p>` under the legal links.

## Settings (inputs in app.config.yaml)
| Input | Default | Meaning |
|---|---|---|
| `OWNER` | `HashiCorp, an IBM Company` | Text after the year. **To confirm with legal**: hashicorp.com shows no copyright line today, so there is no live wording to copy. |
| `TIME_ZONE` | `America/Los_Angeles` | Whose midnight starts the new year. **To confirm.** |
| `START_YEAR` | empty | Set e.g. `2013` to show `© 2013–2027 …`. |

## Behaviour
- Year in `TIME_ZONE`: at 21:00 on 31 Dec in California it is already 2027 in UTC, but the line still says 2026.
- `Cache-Control: public, max-age=N`: one hour, but never past the next New Year (N counts down
  to midnight), so caches can't keep last year's text.
- Bad configuration returns 500 with `no-store`; the footer keeps its fallback.
- Footer never waits for the call (5 s timeout), never shows `{copyright}`, and sends no cookies.
- I/O Runtime web actions answer CORS for any origin, which is fine for this public, read-only text.

## Run and test locally
```bash
npm test                                              # 9 tests
node dev-server.js                                    # real clock
FAKE_NOW=2026-12-31T23:59:45-08:00 node dev-server.js # watch it turn 2027 after 15 s
```
The local site (`aem up`) calls `http://localhost:9080/...` automatically.

## Deploy (needs App Builder on your Adobe organisation)
1. In the Adobe Developer Console, create an App Builder project and a workspace (e.g. Stage).
2. `aio login`, then in this folder `aio app use` (pick the project and workspace).
3. `aio app deploy` and note the action URL:
   `https://<namespace>.adobeioruntime.net/api/v1/web/hashicorp-site/copyright`
4. Check it: `curl -i <that URL>` gives 200, the JSON and the `Cache-Control` header.
5. Put the URL in `COPYRIGHT_API` in `blocks/footer/footer.js` (or in the page metadata
   `copyright-api`), and push. Until then the live footer uses the browser-year fallback.
6. Author `{copyright}` in the footer fragment in AEM.
