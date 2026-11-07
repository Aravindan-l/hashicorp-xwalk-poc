import { decorateIcons, getMetadata } from '../../scripts/aem.js';
import { decorateIconTokens, resolveSitePath } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

/*
 * Header fragment (/fragments/header) layout, all authored as default content:
 * - first section: logo image and a link to the home page
 * - middle sections: one per top-level item. A heading starts a menu: its list holds the
 *   menu links ("link + description"; a nested list makes a group), paragraphs after the
 *   list are a promo box. A section with just a link is a plain top-level link.
 * - last section: a list of action links; <em> makes a secondary button, <strong> a primary.
 * Icons are :name: tokens that resolve to /icons/name.svg.
 */

const isDesktop = window.matchMedia('(min-width: 1120px)');
const CLOSE_DELAY = 150;

function el(tag, className, ...children) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  node.append(...children.filter(Boolean));
  return node;
}

/** A fresh link with the source link's target and text, without button decoration. */
function plainLink(a, className = '') {
  const link = el('a', className);
  link.href = a.href;
  if (a.target) link.target = a.target;
  return link;
}

/**
 * Reads one menu entry: its link, icon, title and description. A nested list is a group.
 * @param {Element} li List item from the fragment
 */
function buildMenuItem(li) {
  const sub = li.querySelector(':scope > ul');
  const own = li.cloneNode(true);
  own.querySelector(':scope > ul')?.remove();
  const source = own.querySelector('a');
  const icon = own.querySelector('.icon');
  const title = source?.textContent.trim() || '';
  source?.remove();
  icon?.remove();
  const description = own.textContent.replace(/\s+/g, ' ').trim();

  const link = source ? plainLink(source, 'nav-item-link') : el('span', 'nav-item-link');
  const text = el('span', 'nav-item-text', el('span', 'nav-item-title', title));
  if (description) text.append(el('span', 'nav-item-description', description));
  link.append(...[icon, text].filter(Boolean));

  const item = el('li', 'nav-item', link);
  if (description) item.classList.add('nav-item-described');
  if (sub) {
    item.classList.add('nav-item-group');
    item.append(el('ul', 'nav-item-sublist', ...[...sub.children].map(buildMenuItem)));
  }
  return item;
}

/** Paragraphs after the menu list: title link with icon, text, and a call to action. */
function buildPromo(paragraphs) {
  if (!paragraphs.length) return null;
  const promo = el('div', 'nav-promo');
  const body = el('div', 'nav-promo-body');
  paragraphs.forEach((p, i) => {
    const a = p.querySelector('a');
    const icons = [...p.querySelectorAll('.icon')];
    if (a && i === paragraphs.length - 1 && i > 0) {
      const cta = plainLink(a, 'nav-promo-cta');
      cta.append(a.textContent.trim(), ...icons);
      promo.append(cta);
    } else if (a) {
      const title = plainLink(a, 'nav-promo-title');
      title.append(a.textContent.trim());
      body.append(el('p', 'nav-promo-heading', ...icons, title));
    } else {
      body.append(el('p', 'nav-promo-text', p.textContent.trim()));
    }
  });
  promo.prepend(body);
  return promo;
}

function setOpen(li, open) {
  li.classList.toggle('is-open', open);
  li.querySelector(':scope > .nav-trigger')?.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function closeAll(nav, except = null) {
  nav.querySelectorAll('.nav-menu.is-open').forEach((li) => { if (li !== except) setOpen(li, false); });
}

/** One top-level entry: a menu (heading + list) or a plain link. */
function buildTopLevel(section, index, nav) {
  const content = section.querySelector('.default-content-wrapper') || section;
  const heading = content.querySelector('h2, h3');
  if (!heading) {
    const a = content.querySelector('a');
    if (!a) return null;
    const link = plainLink(a, 'nav-top-link');
    link.textContent = a.textContent.trim();
    return el('li', 'nav-top', link);
  }

  const label = heading.textContent.trim();
  const id = `nav-panel-${index}`;
  const trigger = el('button', 'nav-trigger', el('span', 'nav-trigger-label', label));
  trigger.type = 'button';
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', id);

  const list = content.querySelector(':scope > ul');
  const items = list ? [...list.children].map(buildMenuItem) : [];
  const menu = el('ul', 'nav-list', ...items);
  if (items.some((i) => i.classList.contains('nav-item-group'))) menu.classList.add('nav-list-groups');
  else if (items.some((i) => i.classList.contains('nav-item-described'))) menu.classList.add('nav-list-described');
  else if (items.length > 8) menu.classList.add('nav-list-columns');

  const after = list ? [...content.children].slice([...content.children].indexOf(list) + 1) : [];
  const promo = buildPromo(after.filter((n) => n.tagName === 'P'));

  const back = el('button', 'nav-back', label);
  back.type = 'button';
  const panel = el('div', 'nav-panel', back, menu, promo);
  panel.id = id;

  const li = el('li', 'nav-top nav-menu', trigger, panel);
  let closeTimer;
  li.addEventListener('mouseenter', () => {
    if (!isDesktop.matches) return;
    clearTimeout(closeTimer);
    closeAll(nav, li);
    setOpen(li, true);
  });
  li.addEventListener('mouseleave', () => {
    if (!isDesktop.matches) return;
    closeTimer = setTimeout(() => setOpen(li, false), CLOSE_DELAY);
  });
  trigger.addEventListener('click', () => {
    const open = !li.classList.contains('is-open');
    closeAll(nav, li);
    setOpen(li, open);
    if (!isDesktop.matches) nav.classList.toggle('is-drilled', open);
  });
  back.addEventListener('click', () => {
    setOpen(li, false);
    nav.classList.remove('is-drilled');
    trigger.focus();
  });
  return li;
}

function buildBrand(section) {
  const picture = section.querySelector('picture');
  const a = section.querySelector('a');
  const link = a ? plainLink(a, 'nav-brand-link') : el('a', 'nav-brand-link');
  if (!a) link.href = '/';
  const label = a?.textContent.trim();
  if (label) link.setAttribute('aria-label', `${label} home`);
  link.append(picture || label || '');
  return el('div', 'nav-brand', link);
}

function buildTools(section) {
  const items = [...section.querySelectorAll('li')].map((li) => {
    const a = li.querySelector('a');
    if (!a) return null;
    const variant = (li.querySelector('strong') && 'primary') || (li.querySelector('em') && 'secondary') || 'text';
    const link = plainLink(a, `nav-tool nav-tool-${variant}`);
    link.append(...li.querySelectorAll('.icon'), a.textContent.trim());
    return el('li', '', link);
  });
  return el('ul', 'nav-tools', ...items);
}

function toggleDrawer(nav, open = !nav.classList.contains('is-open')) {
  nav.classList.toggle('is-open', open);
  if (!open) {
    nav.classList.remove('is-drilled');
    closeAll(nav);
  }
  const button = nav.querySelector('.nav-hamburger');
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
  button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
}

/**
 * Loads the header fragment and builds the navigation.
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : resolveSitePath('/fragments/header');
  const fragment = await loadFragment(navPath);
  block.textContent = '';
  if (!fragment) return;

  decorateIconTokens(fragment);
  decorateIcons(fragment);
  const sections = [...fragment.querySelectorAll(':scope > .section')];
  if (sections.length < 2) return;
  const [brandSection, ...rest] = sections;
  const toolsSection = rest.pop();

  const nav = el('nav', 'nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');

  const topLevel = el('ul', 'nav-sections');
  rest.forEach((section, i) => {
    const item = buildTopLevel(section, i + 1, nav);
    if (item) topLevel.append(item);
  });

  const hamburger = el('button', 'nav-hamburger', el('span', 'nav-hamburger-icon'));
  hamburger.type = 'button';
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.addEventListener('click', () => toggleDrawer(nav));

  const drawer = el('div', 'nav-drawer', topLevel, buildTools(toolsSection));
  nav.append(buildBrand(brandSection), drawer, hamburger);
  toggleDrawer(nav, false);

  nav.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = nav.querySelector('.nav-menu.is-open');
    if (open) {
      setOpen(open, false);
      nav.classList.remove('is-drilled');
      open.querySelector('.nav-trigger').focus();
    } else if (nav.classList.contains('is-open')) {
      toggleDrawer(nav, false);
      hamburger.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (isDesktop.matches && !nav.contains(e.target)) closeAll(nav);
  });
  nav.addEventListener('focusout', (e) => {
    if (isDesktop.matches && !nav.contains(e.relatedTarget)) closeAll(nav);
  });
  isDesktop.addEventListener('change', () => toggleDrawer(nav, false));

  block.append(el('div', 'nav-wrapper', nav));
}
