# Proof of concept: Java business logic on AEM Publish, consumed by Edge Delivery

An Edge Delivery page (`/proof`) sends an order amount to a Sling servlet on AEM Publish. An OSGi
service (`DiscountService`) applies the discount rules in Java (BigDecimal), the servlet returns
JSON, and the `proof` block displays it. **No discount rule exists in JavaScript.** The browser
only checks that the input looks like an amount.

| Order amount           | Discount |
|------------------------|----------|
| below 1,000            | 0%       |
| 1,000 to 4,999.99      | 5%       |
| 5,000 to 9,999.99      | 10%      |
| 10,000 and above       | 15%      |

## 1. Architecture

```
 Browser (visitor)                         Adobe CDN / Fastly            AEM as a Cloud Service (FPL DEV p147323-e1509959)
 ───────────────────                       ──────────────────            ─────────────────────────────────────────────────
 main--hashicorp-xwalk-poc--aravindan-l
   .aem.page/proof
   │ 1. HTML/JS/CSS (static) ─────────────► Edge Delivery CDN
   │                                       (blocks/proof/proof.js)
   │
   │ 2. GET https://publish-p147323-e1509959.adobeaemcloud.com
   │      /content/hashicorp-poc-api/discount.calculate.json?amount=6000
   │      Origin: https://main--hashicorp-xwalk-poc--aravindan-l.aem.page
   └──────────────────────────────────────► AEM CDN ───► Dispatcher ───────► AEM Publish
                                            (no-store:    filters /0300:      ├─ Granite CORS policy (config.publish)
                                             not cached)  allow GET only       │    adds Access-Control-Allow-Origin
                                                          this path,           ├─ Sling resolves /content/hashicorp-poc-api/discount
                                                          selector, ext.       │    sling:resourceType = hashicorp-poc/components/discount-api
                                                          rules /0300:         ├─ ProofServlet (selector calculate, ext json, GET)
                                                          never cache          │    validates "amount", calls ↓
                                                                               └─ DiscountService (OSGi) → DiscountServiceImpl
   3. JSON ◄─────────────────────────────────────────────────────────────────────  {"success":true,"orderAmount":6000,
   4. proof.js renders it with textContent                                         "discountPercentage":10,"discountAmount":600,
                                                                                   "finalAmount":5400,"message":"..."}
```

### What runs where

| Where | What | Files |
|---|---|---|
| **AEM Publish (Java, OSGi)** | Input validation (required, numeric, ≥ 0, ≤ 2 decimals, ≤ 1,000,000,000), discount tiers, BigDecimal rounding (HALF_UP), message text, JSON response, cache headers | `core/…/DiscountServiceImpl.java`, `core/…/ProofServlet.java` |
| **AEM Publish (repository)** | The resource the servlet is bound to, and the CORS policy | `ui.content/…/hashicorp-poc-api/.content.xml`, `ui.apps/…/discount-api`, `ui.config/…/CORSPolicyImpl~*.cfg.json` |
| **Dispatcher** | Lets only this GET through, passes the `Origin` header, never caches the result | `dispatcher/src/conf.dispatcher.d/{filters,clientheaders,cache}` |
| **Edge Delivery (browser)** | Page content, form, format check (digits and up to 2 decimals), `fetch()`, loading and error states, rendering of the returned values | `blocks/proof/proof.js`, `proof.css`, `_proof.json`, page `/proof` |

The browser format check is only for a friendlier message. The servlet re-validates everything,
so calling the API directly with a bad value still returns `400` (tested).

## 2. Files and what each one does

### Java bundle — `core/`
| File | Purpose |
|---|---|
| `pom.xml`, `bnd.bnd` | Builds the OSGi bundle `com.hashicorp.poc.core` with the bnd-maven-plugin (AEM archetype style). Exports only the service API package; the Jackson import range is relaxed to `[2.12,3)` so the bundle resolves on any current AEMaaCS release. |
| `services/DiscountService.java` | Service interface: `DiscountResult calculate(BigDecimal orderAmount)`. |
| `services/DiscountResult.java` | Immutable DTO: orderAmount, discountPercentage, discountAmount, finalAmount, message. |
| `services/package-info.java` | Semantic version `1.0.0` of the exported API package. |
| `services/impl/DiscountServiceImpl.java` | `@Component(service = DiscountService.class)`. Tier lookup, `amount × pct / 100` at scale 2 with HALF_UP, final = amount − discount. |
| `servlets/ProofServlet.java` | `SlingSafeMethodsServlet` registered by **resource type** (`hashicorp-poc/components/discount-api`, selector `calculate`, extension `json`, GET). Parses `amount`, returns 200 / 400 / 500 JSON, sets `Cache-Control: no-store, private`, `Vary: Origin`, `X-Content-Type-Options: nosniff`. |
| `src/test/…/DiscountServiceImplTest.java` | 21 tests: every tier boundary, the 6000 example, rounding, invalid input. |
| `src/test/…/ProofServletTest.java` | 12 tests with AEM Mocks: JSON shape, plain numbers, headers, 400 for missing/invalid/out-of-range, 500 when the service fails. |

### Packages
| Module | Package type | Installs |
|---|---|---|
| `ui.apps` | application | `/apps/hashicorp-poc/components/discount-api` (hidden `cq:Component`; the resource type the servlet binds to). |
| `ui.config` | container | `/apps/hashicorp-poc/osgiconfig/config.publish/…CORSPolicyImpl~hashicorp-poc-discount.cfg.json` — allows `https://*--hashicorp-xwalk-poc--aravindan-l.aem.page/.live`, GET only, this path only, no credentials. `config.publish.dev/…-local.cfg.json` additionally allows `http://localhost:3000` on DEV only. |
| `ui.content` | content | `/content/hashicorp-poc-api/discount` (`sling:resourceType = hashicorp-poc/components/discount-api`). Mode `merge`, so a redeploy never overwrites changes made on the instance. |

### Dispatcher — `dispatcher/src/conf.dispatcher.d/`
Snippets to **merge into the existing project's** Dispatcher files (they keep `$include` of the defaults):
- `filters/filters.any` — rule `/0300` allows only `GET /content/hashicorp-poc-api/discount.calculate.json`. Everything else under that path stays denied by the default deny-all.
- `clientheaders/clientheaders.any` — forwards `Origin` (and preflight headers) to AEM so the CORS policy can answer.
- `cache/rules.any` — rule `/0300` never caches `/content/hashicorp-poc-api/*`.

### Edge Delivery (main repository)
| File | Purpose |
|---|---|
| `blocks/proof/proof.js` | Builds the form, checks the input format, calls the API with `fetch()` (GET, `credentials: 'omit'`, 10 s timeout), shows a loading state, renders the result with `textContent` only (no `innerHTML` with API data), and shows clear errors for 400/500, network/CORS failures and timeouts. |
| `blocks/proof/proof.css` | Card styling using the site's colour variables. |
| `blocks/proof/_proof.json` | Universal Editor model: Title, Introduction, API path. Added to the section filter (`models/_section.json`) and merged into `component-*.json`. |
| page `/proof` | Heading, explanation and the Proof block. |

**API host per environment** (`resolveApiBase()` in `proof.js`):
1. Page metadata `proof-api-base` if set (lets you point one page somewhere else without code).
2. `localhost` → `http://localhost:4503` (local AEM SDK publish).
3. `*.aem.page` / `*.aem.live` → `https://publish-p147323-e1509959.adobeaemcloud.com` (FPL DEV).
4. Any other host (the future production domain) → same origin; see section 6.

### Local test harness — `local-harness/LocalPublishHarness.java` (never deployed)
Runs the **compiled `ProofServlet` and `DiscountServiceImpl`** behind the JDK's built-in HTTP server
on port 4503, for when no AEM SDK is available. It adapts the HTTP request to a Sling request and
lets the servlet's own `doGet` answer, so no logic is duplicated. It mimics the dev CORS policy.

## 3. Build and unit tests

Requirements: JDK 21 (AEMaaCS supports 11, 17 and 21), Maven 3.9+.

```bash
cd aem-proof
mvn clean package         # builds core jar + 3 packages, runs the 33 unit tests
```
Output:
- `core/target/hashicorp-poc.core-1.0.0-SNAPSHOT.jar`
- `ui.apps/target/hashicorp-poc.ui.apps-1.0.0-SNAPSHOT.zip`
- `ui.config/target/hashicorp-poc.ui.config-1.0.0-SNAPSHOT.zip`
- `ui.content/target/hashicorp-poc.ui.content-1.0.0-SNAPSHOT.zip`

Status in this workspace: **build succeeds, 33/33 tests pass** (JDK 21.0.x, Maven 3.9).

## 4. Local setup with the AEM SDK

1. Download the AEM SDK from the Software Distribution portal and start a publish instance:
   `java -jar aem-publish-p4503.jar` (rename the quickstart jar so it starts as publish on 4503).
2. Install the bundle and packages (Package Manager at `http://localhost:4503/crx/packmgr`, or Felix
   console `http://localhost:4503/system/console/bundles` for the jar). In a real project this is
   `mvn clean install -PautoInstallSinglePackagePublish` from the `all` module.
3. Check the bundle is **Active** and `com.hashicorp.poc.core.servlets.ProofServlet` and
   `DiscountServiceImpl` are **active** in `/system/console/components`.
4. Test: `curl "http://localhost:4503/content/hashicorp-poc-api/discount.calculate.json?amount=6000"`
5. Run the Edge Delivery site locally (`aem up`) and open `http://localhost:3000/proof`.

> **To verify (assumption):** the `localhost:3000` CORS rule is in `config.publish.dev`. The local
> SDK only applies it if started with the `dev` run mode (e.g. `-r publish,dev`). Otherwise copy
> that file into `config.publish` locally, or test the API with curl first.

Without the SDK, use the harness (after `mvn package`):
```bash
java -cp "core/target/classes:<aem-sdk-api.jar>:<jackson-core, -databind, -annotations jars>:<slf4j-api.jar>" \
  local-harness/LocalPublishHarness.java
```

## 5. Deploying to AEM as a Cloud Service (Cloud Manager)

The Edge Delivery repository (`aravindan-l/hashicorp-xwalk-poc`) holds **front-end code only**.
Java must go through the program's **Cloud Manager Git repository** (the AEM project with
`core`, `ui.apps`, `ui.config`, `ui.content`, `all`, `dispatcher`).

1. Copy `core/src`, `ui.apps/src`, `ui.config/src`, `ui.content/src` into the matching modules of
   that project (or add them as new modules with these POMs).
2. Embed them in the existing **`all`** module (`filevault-package-maven-plugin` `<embeddeds>`):
   - `hashicorp-poc.core` → `/apps/hashicorp-poc-packages/application/install`
   - `hashicorp-poc.ui.apps`, `hashicorp-poc.ui.config` → `/apps/hashicorp-poc-packages/application/install`
   - `hashicorp-poc.ui.content` → `/apps/hashicorp-poc-packages/content/install`
3. Merge the three Dispatcher snippets into the project's `dispatcher/src/conf.dispatcher.d/` files
   and validate locally with the Dispatcher SDK (`bin/validate.sh src`).
4. Commit, run the **non-production (DEV) pipeline**, and wait for "Deploy to Dev" to succeed.
5. Publish content: `ui.content` installs on Author and Publish; the `/content/hashicorp-poc-api`
   node arrives on Publish through the package, no replication needed. Confirm in CRXDE/Repository
   Browser on Publish.

## 6. Verification checklist (do not assume it works until each step passes)

| # | Check | Expected |
|---|---|---|
| 1 | Developer Console → OSGi bundles on Publish | `com.hashicorp.poc.core` **Active** |
| 2 | Developer Console → components | `ProofServlet`, `DiscountServiceImpl` **active** (not "unsatisfied") |
| 3 | `curl -i "https://publish-p147323-e1509959.adobeaemcloud.com/content/hashicorp-poc-api/discount.calculate.json?amount=6000"` | `200`, JSON with `discountPercentage: 10`, `Cache-Control: no-store, private` |
| 4 | Same with `?amount=abc` | `400` with `{"success":false,"error":"…"}` |
| 5 | `curl -i …/discount.json` and `…/discount.infinity.json` | `404` (blocked by Dispatcher: no repository dump) |
| 6 | `curl -i -X POST …/discount.calculate.json?amount=1` | `403`/`404` (GET only) |
| 7 | `curl -i -H "Origin: https://main--hashicorp-xwalk-poc--aravindan-l.aem.page" "…?amount=6000"` | `Access-Control-Allow-Origin: https://main--hashicorp-xwalk-poc--aravindan-l.aem.page` |
| 8 | Same with `-H "Origin: https://evil.example"` | **no** `Access-Control-Allow-Origin` header |
| 9 | Call twice, check `Age` / `X-Cache` headers | not served from cache |
| 10 | Open `https://main--hashicorp-xwalk-poc--aravindan-l.aem.page/proof`, enter 6000 | Shows 10%, 600.00, 5,400.00 |

If 3 fails with 404: the bundle or `/content/hashicorp-poc-api/discount` is missing, or the Dispatcher
filter wasn't deployed. If 10 fails but 3 and 7 pass: check the browser console for a CORS message.

**Postman:** `GET {{publish}}/content/hashicorp-poc-api/discount.calculate.json?amount=6000`, add a
header `Origin` to test CORS. **DevTools:** Network tab → the `discount.calculate.json` request →
check status, response JSON and the `access-control-allow-origin` response header.

The request is a CORS "simple request" (GET, only `Accept`), so browsers send no preflight `OPTIONS`.

## 7. Production notes

- **Production domain:** add it to `alloworiginregexp` in `config.publish`, **or** (preferred) route
  `/content/hashicorp-poc-api/*` from the production CDN to AEM Publish (CDN origin selector in
  `cdn.yaml`) so the call is same-origin and needs no CORS. `proof.js` already uses the same origin
  for unknown hosts.
- **Publish host:** the block points aem.page/aem.live at FPL DEV publish. For stage/prod either set
  page metadata `proof-api-base` or change `FPL_DEV_PUBLISH` in `proof.js`.
- No credentials or cookies are sent (`credentials: 'omit'`, `supportscredentials: false`); the API
  is public and read-only, so nothing secret should ever be added to it.
- The upper limit of 1,000,000,000 and the 10 s client timeout keep abuse cheap; add a CDN rate
  limit (`cdn.yaml` traffic filter) before exposing anything similar publicly.
