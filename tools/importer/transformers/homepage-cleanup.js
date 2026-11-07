/* eslint-disable */
/* global WebImporter */

/**
 * Cleanup for the HashiCorp homepage (template "homepage").
 * beforeTransform: drops site chrome (header, footer, newsletter, dialogs, scripts) and the
 * source's own tab UI (the panels captured into [data-import-tabpanels] are kept), and tags
 * the sections that stay as default content.
 * afterTransform: rewrites those sections as clean default content: eyebrow, heading, text,
 * and calls to action (de-duplicated; light buttons <strong>, blue buttons plain, arrow links <em>).
 */

const TAG = 'data-homepage-section';
const DEFAULT_CONTENT_SECTIONS = {
  callout: "main > div:has([class*='base_callout'])",
  intro: "main > div:has([class*='style_modularEyebrow'])",
  centered: "main > div:has([class*='style_heading'][class*='style_center'])",
  resources: "main > div:has([data-import-tabpanel] > ul)",
  cta: "main > div[class*='faint']",
};

function clean(text) {
  return (text || '').replace(/[​-‏⁠﻿]/g, '').replace(/\s+/g, ' ').trim();
}

function absolute(href) {
  try { return new URL(href, 'https://www.hashicorp.com').href; } catch (e) { return href; }
}

function el(document, tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function linkParagraph(document, a) {
  const link = el(document, 'a', clean(a.textContent));
  link.href = absolute(a.getAttribute('href'));
  let wrapper = null;
  if (/standalone-link/.test(a.className)) wrapper = 'em';
  else if (!/color-primary/.test(a.className)) wrapper = 'strong';
  const p = el(document, 'p');
  if (wrapper) {
    const w = el(document, wrapper);
    w.append(link);
    p.append(w);
  } else {
    p.append(link);
  }
  return p;
}

function ctas(document, scope) {
  const seen = new Set();
  return [...scope.querySelectorAll('a[class*="button__"], a[class*="standalone-link"]')]
    .filter((a) => !/style_(mobile|tablet)/.test(a.className) && !a.closest('[class*="mobileCtas"]'))
    .filter((a) => {
      const key = `${clean(a.textContent)}|${a.getAttribute('href')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((a) => linkParagraph(document, a));
}

function introNodes(document, scope) {
  const nodes = [];
  const eyebrow = scope.querySelector('[class*="eyebrowWrapper"], [class*="modularEyebrow"]')
    || scope.querySelector('[class*="eyebrow-headline"] > span:first-child');
  if (eyebrow && clean(eyebrow.textContent)) nodes.push(el(document, 'p', clean(eyebrow.textContent)));
  const h = scope.querySelector('h2');
  if (h) nodes.push(el(document, 'h2', clean(h.textContent)));
  const body = [...scope.querySelectorAll('[class*="style_body"] p')];
  const paras = body.length ? body : [...scope.querySelectorAll('[class*="style_body"], [class*="styles_root"]:not(h2)')]
    .filter((n) => !n.querySelector('h2, [class*="style_body"]') && clean(n.textContent) && !n.closest('h2'));
  paras.forEach((p) => nodes.push(el(document, 'p', clean(p.textContent))));
  return nodes;
}

function callout(document, section) {
  const nodes = [];
  const title = section.querySelector('[class*="titleText"]');
  if (title) {
    const p = el(document, 'p');
    p.append(el(document, 'strong', clean(title.textContent)));
    nodes.push(p);
  }
  const desc = section.querySelector('[class*="description"]');
  if (desc) nodes.push(el(document, 'p', clean(desc.textContent)));
  return [...nodes, ...ctas(document, section)];
}

export default function transform(hookName, element, payload) {
  if (payload.template?.name !== 'homepage') return;
  const { document } = payload;

  if (hookName === 'beforeTransform') {
    element.querySelectorAll('header, footer, script, style, noscript, iframe, link, aside, [role="dialog"]').forEach((n) => n.remove());
    element.querySelectorAll('a[href="#main"]').forEach((n) => n.remove());
    const main = element.querySelector('main');
    if (main) {
      [...main.children].forEach((child) => {
        if (!clean(child.textContent) && !child.querySelector('img')) child.remove();
      });
    }
    Object.entries(DEFAULT_CONTENT_SECTIONS).forEach(([name, selector]) => {
      element.querySelector(selector)?.setAttribute(TAG, name);
    });
    // The resources section keeps only its captured panels; the source tab UI goes.
    const resources = element.querySelector(`[${TAG}="resources"]`);
    resources?.querySelectorAll('[role="tablist"], [role="tabpanel"]').forEach((n) => n.remove());
  }

  if (hookName === 'afterTransform') {
    element.querySelectorAll(`[${TAG}]`).forEach((section) => {
      const name = section.getAttribute(TAG);
      let nodes;
      if (name === 'callout') {
        nodes = callout(document, section);
      } else if (name === 'resources') {
        const panels = [...section.querySelectorAll('[data-import-tabpanels] > *')];
        nodes = [...introNodes(document, section), ...panels];
      } else {
        nodes = [...introNodes(document, section), ...ctas(document, section)];
      }
      section.replaceChildren(...nodes);
      section.removeAttribute(TAG);
    });
  }
}
