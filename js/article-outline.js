'use strict';

const reader = document.querySelector('[data-article-reader]');
const article = reader.querySelector('.article-entry');
const rail = reader.querySelector('.article-reader-side');
const outline = reader.querySelector('.article-outline');
const dialog = reader.querySelector('.article-outline-dialog');
const trigger = reader.querySelector('.outline-trigger');
const collapse = outline.querySelector('.outline-collapse');
const close = outline.querySelector('.outline-close');
const outlineContent = outline.querySelector('.article-outline-content');
const headings = outline.querySelector('.outline-headings');
const wide = window.matchMedia('(min-width: 1260px)');
const sectionLinks = [];
let collapsed = false;
let scheduled = false;
let currentLink;

function anchor(node, id) {
  if (!node.id) {
    let candidate = id;
    for (let i = 2; document.getElementById(candidate); i++) candidate = id + '-' + i;
    node.id = candidate;
  }
  node.classList.add('reader-anchor');
  return '#' + encodeURIComponent(node.id);
}

function item(list, target, id, text) {
  const li = document.createElement('li');
  const link = document.createElement('a');
  link.href = anchor(target, id);
  link.textContent = text;
  li.append(link);
  list.append(li);
  return link;
}

const levels = [{ level: 0, list: headings }];
for (const [index, heading] of Array.from(article.querySelectorAll('h1,h2,h3,h4,h5,h6')).entries()) {
  const label = heading.textContent.trim();
  if (!label) continue;
  const level = Number(heading.tagName[1]);
  while (levels.length > 1 && levels.at(-1).level >= level) levels.pop();
  const parent = levels.at(-1);
  const link = item(parent.child || parent.list, heading, 'section-' + (index + 1), label);
  sectionLinks.push({ heading, link });
  const child = document.createElement('ol');
  link.after(child);
  levels.push({ level, child });
}
for (const empty of headings.querySelectorAll('ol:empty')) empty.remove();
headings.parentElement.hidden = !sectionLinks.length;

const figuresSection = outline.querySelector('[data-outline-media="figures"]');
const figures = article.querySelectorAll('img');
for (const [index, original] of Array.from(figures).entries()) {
  const target = original.closest('figure') || original;
  const label = target.querySelector('figcaption')?.textContent.trim() || original.alt.trim();
  const number = 'Figure ' + (index + 1);
  const link = item(figuresSection.querySelector('ol'), target, 'figure-' + (index + 1), label ? number + ' · ' + label : number);
  const thumbnail = document.createElement('img');
  thumbnail.src = original.currentSrc || original.src;
  thumbnail.alt = '';
  thumbnail.loading = 'lazy';
  thumbnail.decoding = 'async';
  link.prepend(thumbnail);
}
figuresSection.hidden = !figures.length;

const tablesSection = outline.querySelector('[data-outline-media="tables"]');
const tables = Array.from(article.querySelectorAll('table')).filter(table => !table.closest('.highlight'));
for (const [index, table] of tables.entries()) {
  const title = table.caption?.textContent.trim()
    || Array.from(table.rows[0]?.cells || []).slice(0, 3).map(cell => cell.textContent.trim()).filter(Boolean).join(' · ');
  const wrapper = document.createElement('div');
  wrapper.className = 'reader-table-scroll';
  table.before(wrapper);
  wrapper.append(table);
  const number = 'Table ' + (index + 1);
  const link = item(tablesSection.querySelector('ol'), table, 'table-' + (index + 1), title ? number + ' · ' + title : number);
  const preview = document.createElement('span');
  preview.className = 'outline-table-preview';
  preview.setAttribute('aria-hidden', 'true');
  for (const row of Array.from(table.rows).slice(0, 3)) {
    const miniRow = document.createElement('span');
    for (const cell of Array.from(row.cells).slice(0, 3)) {
      const miniCell = document.createElement('span');
      miniCell.textContent = cell.textContent.trim();
      miniRow.append(miniCell);
    }
    preview.append(miniRow);
  }
  link.prepend(preview);
}
tablesSection.hidden = !tables.length;

const jumpBar = outline.querySelector('.outline-jump');
if (figures.length || tables.length) {
  const groups = [
    ['Sections', headings.parentElement],
    ['Figures', figuresSection],
    ['Tables', tablesSection]
  ];
  for (const [label, section] of groups) {
    if (section.hidden) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      const offset = section.getBoundingClientRect().top - outlineContent.getBoundingClientRect().top;
      outlineContent.scrollTop += offset - 8;
      section.querySelector('a')?.focus({ preventScroll: true });
    });
    jumpBar.append(button);
  }
}

function updateMode() {
  if (wide.matches) {
    if (dialog.open) dialog.close();
    rail.append(outline);
  } else {
    dialog.append(outline);
  }
  reader.classList.toggle('reader-with-outline', wide.matches);
  reader.classList.toggle('reader-outline-collapsed', collapsed);
  rail.hidden = !wide.matches;
  trigger.hidden = wide.matches;
  outlineContent.hidden = wide.matches && collapsed;
  jumpBar.hidden = !jumpBar.childElementCount || outlineContent.hidden;
  collapse.setAttribute('aria-expanded', String(!collapsed));
  collapse.setAttribute('aria-label', collapsed ? 'Expand article navigation' : 'Collapse article navigation');
}

function updateCurrent() {
  scheduled = false;
  let next;
  for (const { heading, link } of sectionLinks) {
    if (!heading.getClientRects().length) continue;
    if (heading.getBoundingClientRect().top <= 130) next = link;
    else break;
  }
  if (next === currentLink) return;
  currentLink?.removeAttribute('aria-current');
  next?.setAttribute('aria-current', 'location');
  currentLink = next;
}

function scheduleCurrent() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(updateCurrent);
}

function openTarget(target) {
  for (let node = target.parentElement; node && node !== article; node = node.parentElement) {
    if (node.tagName === 'DETAILS') node.open = true;
  }
}

function goToHash() {
  try {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!target || !article.contains(target)) return;
    openTarget(target);
    if (target.classList.contains('reader-anchor')) target.scrollIntoView();
  } catch {
    // An invalid URL fragment has no matching article section.
  }
}

if (sectionLinks.length || figures.length || tables.length) {
  collapse.addEventListener('click', () => {
    collapsed = !collapsed;
    updateMode();
  });
  trigger.addEventListener('click', () => {
    dialog.showModal();
    trigger.setAttribute('aria-expanded', 'true');
    close.focus();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => trigger.setAttribute('aria-expanded', 'false'));
  outline.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    openTarget(target);
    if (dialog.open) dialog.close();
    requestAnimationFrame(() => {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
  wide.addEventListener('change', updateMode);
  window.addEventListener('scroll', scheduleCurrent, { passive: true });
  window.addEventListener('resize', scheduleCurrent);
  window.addEventListener('hashchange', goToHash);
  updateMode();
  if (location.hash) goToHash();
  scheduleCurrent();
}
