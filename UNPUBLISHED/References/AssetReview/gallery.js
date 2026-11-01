'use strict';
const byId = id => document.getElementById(id);
const all = window.SPRITES;
const pageSize = 96;
let filtered = all, page = 0, current = 0;
const number = entry => '#' + String(entry.id).padStart(4, '0');
function fitImage(img, entry, maxWidth, maxHeight) {
  const scale = Math.min(maxWidth / entry.width, maxHeight / entry.height);
  const factor = scale >= 1 ? Math.max(1, Math.floor(scale)) : scale;
  img.style.width = `${Math.round(entry.width * factor)}px`;
}
function render() {
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  page = Math.min(page, pages - 1);
  const fragment = document.createDocumentFragment();
  filtered.slice(page * pageSize, (page + 1) * pageSize).forEach((entry, i) => {
    const card = document.createElement('button'); card.className = 'card';
    card.setAttribute('aria-label', `${number(entry)} ${entry.name}, ${entry.width} by ${entry.height} pixels`);
    const art = document.createElement('span'); art.className = 'art';
    const img = document.createElement('img'); img.src = entry.file; img.alt = entry.name; img.loading = 'lazy';
    fitImage(img, entry, 185, 135); art.append(img);
    const info = document.createElement('span'); info.className = 'info';
    const id = document.createElement('span'); id.className = 'id'; id.textContent = number(entry);
    const name = document.createElement('strong'); name.className = 'name'; name.textContent = entry.name;
    const dims = document.createElement('span'); dims.className = 'dims'; dims.textContent = `${entry.width} × ${entry.height} px`;
    info.append(id, name, dims); card.append(art, info);
    card.addEventListener('click', () => openSprite(page * pageSize + i)); fragment.append(card);
  });
  byId('gallery').replaceChildren(fragment);
  byId('count').textContent = `${filtered.length.toLocaleString()} of ${all.length.toLocaleString()} sprites${filtered.length ? ` · Showing ${page * pageSize + 1}–${Math.min((page + 1) * pageSize, filtered.length)}` : ' · Try another search'}`;
  byId('pageLabel').textContent = `Page ${page + 1} of ${pages}`;
  byId('previous').disabled = page === 0; byId('next').disabled = page >= pages - 1;
}
function filter() {
  const query = byId('search').value.toLowerCase().trim();
  filtered = all.filter(entry => `${number(entry)} ${entry.id} ${entry.name} ${entry.file} ${entry.source}`.toLowerCase().includes(query));
  const mode = byId('sort').value;
  filtered.sort((a,b) => mode === 'name' ? a.name.localeCompare(b.name, undefined, {numeric:true}) : mode === 'size' ? b.width*b.height - a.width*a.height : a.id-b.id);
  page = 0; render();
}
function openSprite(index) {
  current = index; const entry = filtered[current];
  byId('detailId').textContent = number(entry); byId('detailName').textContent = entry.name;
  byId('detailImage').src = entry.file; byId('detailImage').alt = entry.name;
  fitImage(byId('detailImage'), entry, Math.min(window.innerWidth - 80, 840), 340);
  byId('detailMeta').textContent = `${entry.width} × ${entry.height} px · ${entry.source}`;
  byId('detailPath').textContent = entry.file; byId('original').href = entry.file;
  byId('copyStatus').textContent = '';
  byId('previousSprite').disabled = current === 0; byId('nextSprite').disabled = current === filtered.length - 1;
  if (!byId('detail').open) byId('detail').showModal();
}
byId('search').addEventListener('input', filter); byId('sort').addEventListener('change', filter);
byId('reset').addEventListener('click', () => {byId('search').value = ''; byId('sort').value = 'id'; filter();});
function turnPage(delta) {page += delta; render(); window.scrollTo({top:0});}
byId('previous').addEventListener('click', () => turnPage(-1)); byId('next').addEventListener('click', () => turnPage(1));
byId('close').addEventListener('click', () => byId('detail').close());
byId('previousSprite').addEventListener('click', () => openSprite(current - 1));
byId('nextSprite').addEventListener('click', () => openSprite(current + 1));
byId('detail').addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' && current > 0) {event.preventDefault(); openSprite(current - 1);}
  if (event.key === 'ArrowRight' && current < filtered.length - 1) {event.preventDefault(); openSprite(current + 1);}
});
byId('copy').addEventListener('click', async () => {
  const entry = filtered[current]; const reference = `${number(entry)} ${entry.name} — ${entry.file}`;
  try {await navigator.clipboard.writeText(reference); byId('copyStatus').textContent = 'Reference copied';}
  catch {window.prompt('Copy this sprite reference:', reference);}
});
byId('search').value = new URLSearchParams(window.location.search).get('q') || '';
filter();
