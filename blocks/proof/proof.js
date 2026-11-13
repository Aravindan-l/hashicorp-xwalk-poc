/*
 * Proof block: sends an order amount to a servlet on AEM Publish and shows the Java-calculated
 * result. No discount rules live here: the browser only checks that the input is a well-formed
 * amount, then displays what the server returns.
 *
 * Two response types are supported:
 *  - text/html (server-side rendered fragment, e.g. /bin/hashicorp/discount): inserted after
 *    passing a strict allowlist (only basic text/list/table tags, only the class attribute);
 *  - application/json (the aem-proof discount.calculate.json servlet): rendered with textContent.
 */
import { getMetadata } from '../../scripts/aem.js';

const DEFAULT_ENDPOINT = '/bin/hashicorp/discount';
const FPL_DEV_PUBLISH = 'https://publish-p147323-e1509959.adobeaemcloud.com';
const LOCAL_SDK_PUBLISH = 'http://localhost:4503';
const TIMEOUT_MS = 10000;
const AMOUNT_FORMAT = /^\d{1,10}(\.\d{1,2})?$/;
const ALLOWED_TAGS = new Set([
  'DIV', 'SPAN', 'P', 'STRONG', 'EM', 'B', 'I', 'BR', 'H2', 'H3', 'H4', 'DL', 'DT', 'DD', 'UL', 'OL', 'LI',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
]);
const DROPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'TEMPLATE', 'NOSCRIPT', 'SVG', 'MATH']);

/**
 * Picks the AEM Publish host for the current environment.
 * 1. Page metadata "proof-api-base" (set per page or via bulk metadata) wins.
 * 2. Local development (localhost) calls the local AEM SDK publish instance.
 * 3. aem.page / aem.live preview and live call the FPL DEV publish tier.
 * 4. Anything else calls the same origin: AEM Author when the page is open in Universal Editor
 *    (the servlet runs there too), or the production domain, whose CDN must route the servlet
 *    path to AEM Publish.
 */
export function resolveApiBase(hostname = window.location.hostname) {
  const override = getMetadata('proof-api-base');
  if (override) return override.replace(/\/+$/, '');
  if (hostname === 'localhost' || hostname === '127.0.0.1') return LOCAL_SDK_PUBLISH;
  if (/\.aem\.(page|live)$/.test(hostname)) return FPL_DEV_PUBLISH;
  return '';
}

function cellText(row) {
  return row ? row.textContent.trim() : '';
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Rebuilds server HTML from an inert parsed document, keeping only allowlisted tags and the
 * class attribute. Scripts, event handlers, links, images and styles never reach the page.
 */
export function sanitizeFragment(html) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const copy = (source, target) => {
    source.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        target.append(document.createTextNode(node.textContent));
      } else if (node.nodeType === Node.ELEMENT_NODE && !DROPPED_TAGS.has(node.tagName)) {
        if (ALLOWED_TAGS.has(node.tagName)) {
          const clean = document.createElement(node.tagName.toLowerCase());
          const cls = node.getAttribute('class');
          if (cls) clean.className = cls;
          copy(node, clean);
          target.append(clean);
        } else {
          copy(node, target); // unknown wrapper: keep its text, drop the tag
        }
      }
    });
  };
  const fragment = document.createDocumentFragment();
  copy(parsed.body, fragment);
  return fragment;
}

function formatAmount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function jsonResult(data) {
  const list = el('dl', 'proof-result');
  [
    ['Order amount', formatAmount(data.orderAmount)],
    ['Discount', `${Number(data.discountPercentage)}%`],
    ['Discount amount', formatAmount(data.discountAmount)],
    ['Final amount', formatAmount(data.finalAmount)],
  ].forEach(([label, value]) => {
    list.append(el('dt', '', label), el('dd', '', value));
  });
  return [el('p', 'proof-message', data.message), list];
}

function showError(output, message) {
  output.replaceChildren(el('p', 'proof-error', message));
}

/** Calls the servlet and returns the nodes to display; throws an Error with a readable message. */
async function callApi(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'text/html, application/json;q=0.9' },
      // same-origin: in Universal Editor the page runs on AEM Author, so the author login
      // cookie is sent and the servlet answers there; cross-site calls (aem.page -> Publish)
      // stay cookieless
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
    });
    const type = response.headers.get('content-type') || '';

    if (type.includes('application/json')) {
      let body = null;
      try {
        body = await response.json();
      } catch (e) {
        body = null;
      }
      if (!response.ok || !body || body.success !== true) {
        throw new Error(body && typeof body.error === 'string' ? body.error : `The API answered with status ${response.status}.`);
      }
      return { nodes: jsonResult(body), ok: true };
    }

    if (type.includes('text/html')) {
      const fragment = sanitizeFragment(await response.text());
      if (!fragment.textContent.trim()) throw new Error(`The API answered with status ${response.status} and no content.`);
      // 4xx/5xx fragments carry the server's own error message; show them as an error state
      return { nodes: [fragment], ok: response.ok };
    }

    throw new Error(`The API answered with status ${response.status} and an unexpected content type.`);
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('The API did not answer in time. Please try again.');
    if (e instanceof TypeError) throw new Error('The discount API could not be reached (network or CORS). Check that AEM Publish is running and allows this site.');
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

export default function decorate(block) {
  const [titleRow, textRow, endpointRow] = [...block.children];
  const title = cellText(titleRow) || 'Discount calculator';
  const intro = textRow ? textRow.querySelector(':scope > div') || textRow : null;
  const endpoint = cellText(endpointRow) || DEFAULT_ENDPOINT;
  const apiUrl = `${resolveApiBase()}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const heading = el('h2', 'proof-title', title);
  const form = el('form', 'proof-form');
  form.noValidate = true;
  const inputId = `proof-amount-${Math.random().toString(36).slice(2, 8)}`;
  const label = el('label', '', 'Order amount');
  label.htmlFor = inputId;
  const input = el('input', 'proof-input');
  Object.assign(input, {
    id: inputId, name: 'amount', type: 'text', inputMode: 'decimal', autocomplete: 'off', placeholder: 'e.g. 6000',
  });
  const button = el('button', 'button proof-button', 'Calculate discount');
  button.type = 'submit';
  form.append(label, input, button);

  const output = el('div', 'proof-output');
  output.setAttribute('aria-live', 'polite');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const raw = input.value.trim();
    // Format check only; tiers, rounding and limits are decided by the Java service.
    if (!AMOUNT_FORMAT.test(raw)) {
      input.setAttribute('aria-invalid', 'true');
      showError(output, 'Enter an amount using digits only, with up to two decimals (for example 6000 or 1234.56).');
      return;
    }
    input.removeAttribute('aria-invalid');
    button.disabled = true;
    block.classList.add('loading');
    output.classList.remove('proof-output-error');
    output.replaceChildren(el('p', 'proof-loading', 'Calculating on AEM Publish…'));
    try {
      const { nodes, ok } = await callApi(`${apiUrl}?amount=${encodeURIComponent(raw)}`);
      output.classList.toggle('proof-output-error', !ok);
      output.replaceChildren(
        ...nodes,
        el('p', 'proof-source', ok ? 'Calculated by Java on AEM Publish.' : 'Rejected by Java on AEM Publish.'),
      );
    } catch (e) {
      showError(output, e.message);
    } finally {
      button.disabled = false;
      block.classList.remove('loading');
    }
  });

  const children = [heading];
  if (intro && intro.textContent.trim()) {
    intro.classList.add('proof-intro');
    children.push(intro);
  }
  children.push(form, output);
  block.replaceChildren(...children);
}
