import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Logo wall: an optional title row, then one row per logo (image, optional link).
 * Logos scroll as a marquee; inside a "logo-grid" section they sit in a static grid.
 * @param {Element} block The logo-wall block element
 */
export default function decorate(block) {
  const rows = [...block.children];
  const titleRow = rows[0] && !rows[0].querySelector('picture') ? rows.shift() : null;

  const list = document.createElement('ul');
  list.className = 'logo-wall-list';
  rows.forEach((row) => {
    const img = row.querySelector('img');
    if (!img) return;
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    const picture = createOptimizedPicture(img.src, img.alt, false, [{ width: '400' }]);
    moveInstrumentation(img, picture.querySelector('img'));
    const href = row.querySelector('a')?.href;
    if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.append(picture);
      li.append(a);
    } else {
      li.append(picture);
    }
    list.append(li);
  });

  block.textContent = '';
  const title = titleRow?.textContent.trim();
  if (title) {
    const p = document.createElement('p');
    p.className = 'logo-wall-title';
    p.textContent = title;
    moveInstrumentation(titleRow.firstElementChild || titleRow, p);
    block.append(p);
  }

  // The marquee repeats the list once so the loop has no gap.
  // The copy is hidden from assistive technology and keyboard focus.
  const track = document.createElement('div');
  track.className = 'logo-wall-track';
  const copy = list.cloneNode(true);
  copy.setAttribute('aria-hidden', 'true');
  copy.classList.add('logo-wall-copy');
  copy.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
  track.append(list, copy);
  block.append(track);
}
