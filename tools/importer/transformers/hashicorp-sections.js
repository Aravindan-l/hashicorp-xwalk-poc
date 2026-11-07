/* eslint-disable */
/* global WebImporter */

/**
 * Section breaks for HashiCorp blog articles, from payload.template.sections:
 * an <hr> before every section but the first. None of the sections are styled.
 */
export default function transform(hookName, element, payload) {
  if (hookName !== 'beforeTransform') return;
  const { document, template } = payload;
  const sections = template?.sections || [];

  [...sections].slice(1).reverse().forEach((section) => {
    const selectors = Array.isArray(section.selector) ? section.selector : [section.selector];
    const target = selectors.map((s) => element.querySelector(s)).find(Boolean);
    if (target) target.before(document.createElement('hr'));
  });
}
