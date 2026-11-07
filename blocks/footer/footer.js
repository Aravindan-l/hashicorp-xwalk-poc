import { decorateIcons, getMetadata } from '../../scripts/aem.js';
import { decorateIconTokens, resolveSitePath } from '../../scripts/scripts.js';
import { loadFragment } from '../fragment/fragment.js';

/*
 * Footer fragment (/fragments/footer) layout, all authored as default content:
 * 1 logo image, 2 link columns (a heading followed by its list, repeated),
 * 3 legal links, 4 social links (:icon: + link; the link text becomes the accessible name).
 */

const SECTION_CLASSES = ['footer-brand', 'footer-links', 'footer-legal', 'footer-social'];

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

  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Footer');
  nav.append(footer);
  block.append(nav);
}
