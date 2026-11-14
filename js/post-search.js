'use strict';

const searchPage = document.querySelector('.post-search-page');
const searchForm = searchPage.querySelector('form');
const queryField = searchForm.elements.q;
const status = searchPage.querySelector('.post-search-status');
const results = searchPage.querySelector('.post-search-results');
const root = new URL(searchPage.dataset.root, window.location.origin);
let request;
let searchVersion = 0;

function normalize(value) {
  return value.normalize('NFKC').toLowerCase();
}

function postIndex() {
  if (!request) {
    request = fetch(searchPage.dataset.index).then(response => {
      if (!response.ok) throw new Error('Index unavailable');
      return response.json();
    }).catch(error => {
      request = null;
      throw error;
    });
  }
  return request;
}

function resultItem(post) {
  const item = document.createElement('li');
  const link = document.createElement('a');
  link.href = new URL(post.path, root);
  link.textContent = post.title;
  const meta = document.createElement('small');
  meta.textContent = [post.date, ...post.terms].join(' · ');
  const summary = document.createElement('p');
  summary.textContent = post.summary;
  item.append(link, meta, summary);
  return item;
}

async function search(query) {
  const version = ++searchVersion;
  results.replaceChildren();
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!words.length) {
    status.textContent = 'Enter a title, tag, or keyword.';
    return;
  }
  status.textContent = 'Searching…';
  try {
    const posts = await postIndex();
    if (version !== searchVersion) return;
    const matches = [];
    for (const post of posts) {
      const title = normalize(post.title);
      const terms = normalize(post.terms.join(' '));
      const body = normalize(post.summary + ' ' + post.body);
      if (!words.every(word => title.includes(word) || terms.includes(word) || body.includes(word))) continue;
      const score = words.reduce((sum, word) => sum + (title.includes(word) ? 4 : terms.includes(word) ? 2 : 1), 0);
      matches.push({post, score});
    }
    matches.sort((a, b) => b.score - a.score);
    status.textContent = matches.length ? matches.length + (matches.length === 1 ? ' post found' : ' posts found') : 'No posts match your search.';
    results.append(...matches.map(match => resultItem(match.post)));
  } catch {
    if (version === searchVersion) status.textContent = 'Search is unavailable right now. Try again in a moment.';
  }
}

function fromUrl() {
  queryField.value = new URLSearchParams(location.search).get('q') || '';
  search(queryField.value);
}

searchForm.addEventListener('submit', event => {
  event.preventDefault();
  const url = new URL(location.href);
  url.searchParams.set('q', queryField.value.trim());
  history.pushState(null, '', url);
  search(queryField.value);
});
window.addEventListener('popstate', fromUrl);
fromUrl();
