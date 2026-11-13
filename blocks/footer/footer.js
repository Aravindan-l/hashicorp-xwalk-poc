import { decorateIcons, getMetadata } from '../../scripts/aem.js';
import { decorateIconTokens, resolveSitePath } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

/*
 * Footer fragment (/fragments/footer) layout, all authored as default content:
 * 1 logo image, 2 link columns (a heading followed by its list, repeated),
 * 3 legal links, 4 social links (:icon: + link; the link text becomes the accessible name).
 */

const SECTION_CLASSES = ['footer-brand', 'footer-links', 'footer-legal', 'footer-social'];

/*
 * Copyright line: authors write only {copyright}; the text comes from the App Builder
 * "copyright" action, which decides the year in the company time zone.
 * Set COPYRIGHT_API to the deployed action URL, or override it with the "copyright-api" metadata.
 */
const COPYRIGHT_TOKEN = '{copyright}';
const COPYRIGHT_API = '';
const LOCAL_COPYRIGHT_API = 'http://localhost:9080/api/v1/web/hashicorp-site/copyright';
const COPYRIGHT_FALLBACK_OWNER = 'HashiCorp';

function copyrightApi() {
  const meta = getMetadata('copyright-api');
  if (meta) return meta;
  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '127.0.0.1') return LOCAL_COPYRIGHT_API;
  return COPYRIGHT_API;
}

/**
 * Replaces {copyright} at once with a browser-side fallback (so the token is never visible and the
 * footer never waits), then with the action's text when it answers.
 */
function fillCopyright(root) {
  const holders = [...root.querySelectorAll('p, li, span')]
    .filter((node) => node.childElementCount === 0 && node.textContent.includes(COPYRIGHT_TOKEN));
  if (!holders.length) return;
  holders.forEach((node) => {
    node.classList.add('footer-copyright');
    node.dataset.template = node.textContent;
  });
  const show = (text) => holders.forEach((node) => {
    node.textContent = node.dataset.template.replace(COPYRIGHT_TOKEN, text);
  });
  show(`© ${new Date().getFullYear()} ${COPYRIGHT_FALLBACK_OWNER}`);

  const api = copyrightApi();
  if (!api) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  fetch(api, { credentials: 'omit', signal: controller.signal })
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (data && typeof data.text === 'string' && data.text.trim()) show(data.text.trim());
    })
    .catch(() => { /* keep the fallback */ })
    .finally(() => clearTimeout(timer));
}

/** Pairs each heading with the list that follows it. */
function buildColumns(container) {
  const columns = document.createElement('div');
  columns.className = 'footer-columns';
  [...container.querySelectorAll(':scope > h2, :scope > h3')].forEach((heading) => {
    const column = document.createElement('div');
    column.className = 'footer-column';
    const list = heading.nextElementSibling?.tagName === 'UL' ? heading.nextElementSibling : null;
    column.append(heading, ...(list ? [list] : []));
    if (list) list.setAttribute('aria-label', heading.textContent.trim());
    columns.append(column);
  });
  container.replaceChildren(columns);
}

/** Social links show only their icon; the text stays as a visually hidden label. */
function buildSocial(container) {
  container.querySelectorAll('li').forEach((li) => {
    const a = li.querySelector('a');
    if (!a) return;
    const label = document.createElement('span');
    label.className = 'footer-social-label';
    label.textContent = a.textContent.trim();
    a.replaceChildren(...li.querySelectorAll('.icon'), label);
    li.replaceChildren(a);
  });
}

/**
 * Loads the footer fragment and lays it out.
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : resolveSitePath('/fragments/footer');
  const fragment = await loadFragment(footerPath);
  block.textContent = '';
  if (!fragment) return;

  decorateIconTokens(fragment);
  decorateIcons(fragment);
  const footer = document.createElement('div');
  footer.className = 'footer-inner';
  [...fragment.querySelectorAll(':scope > .section')].forEach((section, i) => {
    section.classList.add(SECTION_CLASSES[i] || 'footer-extra');
    const content = section.querySelector('.default-content-wrapper') || section;
    content.querySelectorAll('.button').forEach((a) => a.classList.remove('button'));
    content.querySelectorAll('.button-container').forEach((p) => p.classList.remove('button-container'));
    if (i === 1) buildColumns(content);
    if (i === 3) buildSocial(content);
    footer.append(section);
  });
  fillCopyright(footer);

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Footer');
  nav.append(footer);
  block.append(nav);
}
