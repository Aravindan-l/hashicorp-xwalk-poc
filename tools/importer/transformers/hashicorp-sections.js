/* eslint-disable */
/* global WebImporter */

/**
 * Section breaks and section styles for imported HashiCorp pages, from payload.template.sections.
 * beforeTransform: an <hr> before every section but the first, plus a hidden marker at the
 * start of each section (parsers may replace a whole source section with a block, so the
 * section element itself cannot carry the marker).
 * afterTransform: a Section Metadata block at the end of each styled section; markers removed.
 */
const MARKER = 'data-import-section';

export default function transform(hookName, element, payload) {
  const { document, template } = payload;
  const sections = template?.sections || [];

  if (hookName === 'beforeTransform') {
    // Resolve every section first: inserting markers must not change what later selectors match.
    const targets = sections.map((section) => {
      const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
      return selectors.map((s) => element.querySelector(s)).find(Boolean) || null;
    });
    targets.forEach((target, i) => {
      if (!target) return;
      const marker = document.createElement('div');
      marker.setAttribute(MARKER, sections[i].id);
      marker.hidden = true;
      target.before(marker);
      if (i > 0) marker.before(document.createElement('hr'));
    });
  }

  if (hookName === 'afterTransform') {
    const markers = [...element.querySelectorAll(`[${MARKER}]`)];
    markers.forEach((marker, i) => {
      const section = sections.find((s) => s.id === marker.getAttribute(MARKER));
      if (section?.style) {
        const metadata = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        const next = markers[i + 1];
        const boundary = next?.previousElementSibling?.tagName === 'HR' ? next.previousElementSibling : next;
        if (boundary) boundary.before(metadata);
        else marker.parentElement.append(metadata);
      }
    });
    markers.forEach((marker) => marker.remove());
  }
}
