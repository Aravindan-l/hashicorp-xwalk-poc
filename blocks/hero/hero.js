/**
 * Hero: background image with centred text. Anything authored before the main heading
 * (a short announcement and its link) is grouped as a callout above it.
 * @param {Element} block The hero block element
 */
export default function decorate(block) {
  const heading = block.querySelector('h1, h2');
  if (!heading) return;
  const before = [];
  let node = heading.previousElementSibling;
  while (node) {
    before.unshift(node);
    node = node.previousElementSibling;
  }
  if (!before.length) return;
  const callout = document.createElement('div');
  callout.className = 'hero-callout';
  callout.append(...before);
  heading.before(callout);
}
