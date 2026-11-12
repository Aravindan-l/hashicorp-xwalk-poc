/*
 * Proof block: sends an order amount to the AEM Publish discount servlet and shows the
 * Java-calculated result. No discount rules live here: the browser only checks that the input
 * is a well-formed amount, then displays what the server returns.
 */
import { getMetadata } from '../../scripts/aem.js';

const DEFAULT_ENDPOINT = '/content/hashicorp-poc-api/discount.calculate.json';
const FPL_DEV_PUBLISH = 'https://publish-p147323-e1509959.adobeaemcloud.com';
const LOCAL_SDK_PUBLISH = 'http://localhost:4503';
const TIMEOUT_MS = 10000;
const AMOUNT_FORMAT = /^\d{1,10}(\.\d{1,2})?$/;

/**
 * Picks the AEM Publish host for the current environment.
 * 1. Page metadata "proof-api-base" (set per page or via bulk metadata) wins.
 * 2. Local development (localhost) calls the local AEM SDK publish instance.
 * 3. aem.page / aem.live preview and live call the FPL DEV publish tier.
 * 4. Anything else (the production domain) calls the same origin; the CDN must route
 *    /content/hashicorp-poc-api/* to AEM Publish.
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

function formatAmount(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showResult(output, data) {
  const list = el('dl', 'proof-result');
  [
    ['Order amount', formatAmount(data.orderAmount)],
    ['Discount', `${Number(data.discountPercentage)}%`],
    ['Discount amount', formatAmount(data.discountAmount)],
    ['Final amount', formatAmount(data.finalAmount)],
  ].forEach(([label, value]) => {
    list.append(el('dt', '', label), el('dd', '', value));
  });
  output.replaceChildren(
    el('p', 'proof-message', data.message),
    list,
    el('p', 'proof-source', 'Calculated by the DiscountService OSGi component on AEM Publish.'),
  );
}

function showError(output, message) {
  output.replaceChildren(el('p', 'proof-error', message));
}

async function callApi(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal,
    });
    let body = null;
    try {
      body = await response.json();
    } catch (e) {
      body = null;
    }
    if (!response.ok || !body || body.success !== true) {
      const reason = body && typeof body.error === 'string' ? body.error : `The API answered with status ${response.status}.`;
      throw new Error(reason);
    }
    return body;
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
    output.replaceChildren(el('p', 'proof-loading', 'Calculating on AEM Publish…'));
    try {
      const data = await callApi(`${apiUrl}?amount=${encodeURIComponent(raw)}`);
      showResult(output, data);
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
