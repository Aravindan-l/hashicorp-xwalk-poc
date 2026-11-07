import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  getMetadata,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  toClassName,
} from './aem.js';

// Page templates with their own stylesheet in /templates/<name>/<name>.css
const TEMPLATES = ['blog-article'];

// Root of this site's pages on AEM author, where Universal Editor opens them.
const AUTHOR_SITE_ROOT = '/content/hashicorp-xwalk-poc';

/**
 * Resolves a site path such as /fragments/header for where the page is running:
 * Edge Delivery serves it at the path itself, AEM author under the site root, and the
 * local preview of the content folder under /content.
 * @param {string} path Site path starting with /
 * @returns {string} The path to fetch
 */
export function resolveSitePath(path) {
  if (path.startsWith('/content/')) return path;
  const { pathname } = window.location;
  if (pathname.startsWith(`${AUTHOR_SITE_ROOT}/`)) return `${AUTHOR_SITE_ROOT}${path}`;
  if (pathname.startsWith('/content/')) return `/content${path}`;
  return path;
}

/**
 * Turns :name: tokens in text into icon spans (span.icon.icon-name), so authors can place
 * icons from /icons in rich text. Run decorateIcons afterwards to load them.
 * @param {Element} element Container to scan
 */
export function decorateIconTokens(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    if (/:[a-z][a-z0-9-]*:/.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
  }
  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/(:[a-z][a-z0-9-]*:)/).forEach((part) => {
      const m = part.match(/^:([a-z][a-z0-9-]*):$/);
      if (m) {
        const span = document.createElement('span');
        span.className = `icon icon-${m[1]}`;
        frag.append(span);
      } else if (part) {
        frag.append(part);
      }
    });
    node.replaceWith(frag);
  });
}

/**
 * Moves all the attributes from a given elmenet to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveAttributes(from, to, attributes) {
  if (!attributes) {
    // eslint-disable-next-line no-param-reassign
    attributes = [...from.attributes].map(({ nodeName }) => nodeName);
  }
  attributes.forEach((attr) => {
    const value = from.getAttribute(attr);
    if (value) {
      to?.setAttribute(attr, value);
      from.removeAttribute(attr);
    }
  });
}

/**
 * Move instrumentation attributes from a given element to another given element.
 * @param {Element} from the element to copy attributes from
 * @param {Element} to the element to copy attributes to
 */
export function moveInstrumentation(from, to) {
  moveAttributes(
    from,
    to,
    [...from.attributes]
      .map(({ nodeName }) => nodeName)
      .filter((attr) => attr.startsWith('data-aue-') || attr.startsWith('data-richtext-')),
  );
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function autolinkModals(doc) {
  doc.addEventListener('click', async (e) => {
    const origin = e.target.closest('a');
    if (origin && origin.href && origin.href.includes('/modals/')) {
      e.preventDefault();
      const { openModal } = await import(`${window.hlx.codeBasePath}/blocks/modal/modal.js`);
      openModal(origin.href);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks() {
  try {
    // TODO: add auto block, if needed
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function a11yLinks(main) {
  const links = main.querySelectorAll('a');
  links.forEach((link) => {
    let label = link.textContent;
    if (!label && link.querySelector('span.icon')) {
      const icon = link.querySelector('span.icon');
      label = icon ? icon.classList[1]?.split('-')[1] : label;
    }
    link.setAttribute('aria-label', label);
  });
}

/**
 * Decorates paragraphs containing a single link as buttons.
 * @param {Element} element container element
 */
export function decorateButtons(element) {
  element.querySelectorAll('a').forEach((a) => {
    a.title = a.title || a.textContent;
    if (a.href !== a.textContent) {
      const up = a.parentElement;
      const twoup = a.parentElement.parentElement;
      if (!a.querySelector('img')) {
        if (up.childNodes.length === 1 && (up.tagName === 'P' || up.tagName === 'DIV')) {
          a.className = 'button'; // default
          up.classList.add('button-container');
        }
        if (
          up.childNodes.length === 1
          && up.tagName === 'STRONG'
          && twoup.childNodes.length === 1
          && twoup.tagName === 'P'
        ) {
          a.className = 'button primary';
          twoup.classList.add('button-container');
        }
        if (
          up.childNodes.length === 1
          && up.tagName === 'EM'
          && twoup.childNodes.length === 1
          && twoup.tagName === 'P'
        ) {
          a.className = 'button secondary';
          twoup.classList.add('button-container');
        }
      }
    }
  });
}

let sectionTabsCount = 0;

/**
 * In a section styled "tabs", each H3 that ends a run of default content labels the block
 * that follows it; the blocks become tab panels. The headings stay in the DOM (hidden) so
 * authors keep editing them in place.
 * @param {Element} main The main element
 */
function decorateSectionTabs(main) {
  main.querySelectorAll(':scope > .section.tabs').forEach((section) => {
    const pairs = [...section.querySelectorAll(':scope > .default-content-wrapper')]
      .map((wrapper) => ({ heading: wrapper.lastElementChild, panel: wrapper.nextElementSibling }))
      .filter(({ heading, panel }) => heading?.tagName === 'H3' && panel?.matches('[class$="-wrapper"]')
        && !panel.matches('.default-content-wrapper'));
    if (pairs.length < 2) return;
    sectionTabsCount += 1;
    const tablist = document.createElement('div');
    tablist.className = 'section-tabs-list';
    tablist.setAttribute('role', 'tablist');
    const select = (index) => pairs.forEach(({ panel }, i) => {
      panel.hidden = i !== index;
      tablist.children[i].setAttribute('aria-selected', i === index ? 'true' : 'false');
    });
    pairs.forEach(({ heading, panel }, i) => {
      const id = `section-tabs-${sectionTabsCount}-${i + 1}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.id = `${id}-tab`;
      button.className = 'section-tabs-tab';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', id);
      button.textContent = heading.textContent.trim();
      button.addEventListener('click', () => select(i));
      tablist.append(button);
      heading.classList.add('section-tabs-label');
      panel.id = id;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
    });
    pairs[0].panel.before(tablist);
    select(0);
  });
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  // hopefully forward compatible button decoration
  decorateButtons(main);
  decorateIconTokens(main);
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateSectionTabs(main);
  // add aria-label to links
  a11yLinks(main);
}

/**
 * Edge Delivery turns a page's Metadata block into <meta> tags, so it never reaches main.
 * Local previews of imported .plain.html keep it in main: apply it the same way so
 * templates and metadata behave as they will once published. No-op on Edge Delivery.
 * @param {Element} main The main element
 */
function applyMetadataBlock(main) {
  const block = main?.querySelector(':scope > div > .metadata');
  if (!block) return;
  [...block.children].forEach((row) => {
    const [keyCell, valueCell] = row.children;
    const name = toClassName(keyCell?.textContent || '');
    const value = valueCell?.querySelector('img')?.getAttribute('src') || valueCell?.textContent.trim();
    if (!name || !value) return;
    if (name === 'title') document.title = value;
    const attr = name === 'title' || name === 'image' ? 'property' : 'name';
    const metaName = attr === 'property' ? `og:${name}` : name;
    let meta = document.head.querySelector(`meta[${attr}="${metaName}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attr, metaName);
      document.head.append(meta);
    }
    meta.content = value;
  });
  block.remove();
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  applyMetadataBlock(doc.querySelector('main'));
  decorateTemplateAndTheme();
  const template = getMetadata('template');
  if (TEMPLATES.includes(template)) {
    await loadCSS(`${window.hlx.codeBasePath}/templates/${template}/${template}.css`);
  }
  if (getMetadata('breadcrumbs').toLowerCase() === 'true') {
    doc.body.dataset.breadcrumbs = true;
  }
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  autolinkModals(doc);

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadHeader(doc.querySelector('header'));
  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
