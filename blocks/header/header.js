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

// Pages on these templates also get a section bar below the header (page metadata
// "subnav" can point any page at a fragment instead).
const SUBNAV_BY_TEMPLATE = {
  'blog-article': '/fragments/blog-nav',
  'blog-listing': '/fragments/blog-nav',
};

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
  // a <picture> on Edge Delivery; a plain <img> in content that has not been through the pipeline
  const picture = section.querySelector('picture, img');
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
 * A search box from a section holding one link to the results page whose query parameter is
 * empty (https://…/blog/all?q=): the link text is the placeholder, the empty parameter takes
 * the query. Returns null when the section is not a search.
 * @param {Element} content Section content
 */
function buildSearch(content) {
  const a = content.querySelector('a');
  if (!a || content.querySelector('h2')) return null;
  const url = new URL(a.href);
  const name = [...url.searchParams.entries()].find(([, value]) => value === '')?.[0];
  if (!name) return null;

  const form = el('form', 'subnav-search');
  form.setAttribute('role', 'search');
  form.method = 'get';
  form.action = `${url.origin}${url.pathname}`;
  url.searchParams.forEach((value, key) => {
    if (key === name) return;
    const hidden = el('input');
    hidden.type = 'hidden';
    hidden.name = key;
    hidden.value = value;
    form.append(hidden);
  });
  const label = a.textContent.trim();
  const input = el('input', 'subnav-search-input');
  input.type = 'search';
  input.name = name;
  input.placeholder = label;
  input.setAttribute('aria-label', label);
  const button = el('button', 'subnav-search-button', el('span', 'icon icon-search'));
  button.type = 'submit';
  button.setAttribute('aria-label', label);
  form.append(input, button);
  decorateIcons(form);
  return form;
}

/*
 * Section bar fragment (e.g. /fragments/blog-nav), default content:
 * 1 logo image and its link, 2 a list of links, then one section per dropdown
 * (h2 label, then an h3 + list for each group of links), and optionally a search section
 * (see buildSearch).
 */
async function buildSubnav() {
  const meta = getMetadata('subnav');
  const fallback = SUBNAV_BY_TEMPLATE[getMetadata('template')];
  let path = null;
  if (meta) path = new URL(meta, window.location).pathname;
  else if (fallback) path = resolveSitePath(fallback);
  if (!path) return null;
  const fragment = await loadFragment(path);
  if (!fragment) return null;
  decorateIconTokens(fragment);
  decorateIcons(fragment);
  const [brandSection, linksSection, ...menuSections] = [...fragment.querySelectorAll(':scope > .section')];
  if (!brandSection) return null;

  const bar = el('nav', 'subnav');
  bar.setAttribute('aria-label', brandSection.querySelector('a')?.textContent.trim() || 'Section');
  const brand = buildBrand(brandSection);
  brand.className = 'subnav-brand';

  const items = el('div', 'subnav-items');
  if (linksSection) {
    const links = el('ul', 'subnav-links', ...[...linksSection.querySelectorAll('li a')].map((a) => {
      const link = plainLink(a);
      link.textContent = a.textContent.trim();
      return el('li', '', link);
    }));
    items.append(links);
  }
  menuSections.forEach((section, i) => {
    const content = section.querySelector('.default-content-wrapper') || section;
    const search = buildSearch(content);
    if (search) {
      items.append(search);
      return;
    }
    const label = content.querySelector('h2')?.textContent.trim();
    if (!label) return;
    const trigger = el('button', 'subnav-trigger', label);
    trigger.type = 'button';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `subnav-panel-${i + 1}`);
    const groups = [...content.querySelectorAll(':scope > h3')].map((h3) => {
      const list = h3.nextElementSibling?.tagName === 'UL' ? h3.nextElementSibling : null;
      const ul = el('ul', 'subnav-group-list', ...(list ? [...list.children].map((li) => {
        const a = li.querySelector('a');
        if (!a) return null;
        const link = plainLink(a);
        link.append(...li.querySelectorAll('.icon'), a.textContent.trim());
        return el('li', '', link);
      }) : []));
      return el('div', 'subnav-group', el('p', 'subnav-group-title', h3.textContent.trim()), ul);
    });
    const panel = el('div', 'subnav-panel', ...groups);
    panel.id = `subnav-panel-${i + 1}`;
    const menu = el('div', 'subnav-menu', trigger, panel);
    trigger.addEventListener('click', () => {
      const open = !menu.classList.contains('is-open');
      bar.querySelectorAll('.subnav-menu.is-open').forEach((m) => {
        m.classList.remove('is-open');
        m.querySelector('.subnav-trigger').setAttribute('aria-expanded', 'false');
      });
      menu.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    items.append(menu);
  });

  const toggle = el('button', 'subnav-toggle', 'Menu');
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => {
    const open = !bar.classList.contains('is-open');
    bar.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  bar.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    bar.classList.remove('is-open');
    bar.querySelectorAll('.subnav-menu.is-open').forEach((m) => m.classList.remove('is-open'));
  });
  document.addEventListener('click', (e) => {
    if (!bar.contains(e.target)) bar.querySelectorAll('.subnav-menu.is-open').forEach((m) => m.classList.remove('is-open'));
  });
  bar.append(brand, toggle, items);
  return bar;
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

  // The section bar sits after the header element so it can stick to the top on scroll.
  const subnav = await buildSubnav();
  if (subnav) block.closest('header')?.after(el('div', 'subnav-wrapper', subnav));
}
