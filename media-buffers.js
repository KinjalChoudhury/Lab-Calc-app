/*
  media-buffers.js
  ----------------------------------------------------------------------------
  Renders the Library > "Media / Buffers" section from MEDIA_BUFFERS_DATA
  (media-buffers-data.js). It builds the two collapsible subsections
  ("Media", "Buffers") inside the existing #media-buffers container using the
  app's existing .subsection / .subsection-list classes, and lays out each
  recipe card using dedicated .recipe-card-* classes defined in styles.css.

  Each recipe card shows, per the agreed format:
    - Name, followed by ", pH <value>" in italics when a pH applies
    - Composition: each component with its molar mass (when applicable) and
      the amount required for the recipe's stated basis (100 mL)
*/

function renderMediaBuffers() {
  const root = document.querySelector('#media-buffers');
  if (!root || typeof MEDIA_BUFFERS_DATA === 'undefined') return;

  const groups = [
    { key: 'media', title: 'Media', color: '#c9f3b4' },
    { key: 'buffers', title: 'Buffers', color: '#bae3ff' }
  ];

  groups.forEach(group => {
    const entries = MEDIA_BUFFERS_DATA.filter(e => e.category === group.key);

    const section = document.createElement('div');
    section.className = 'subsection';
    section.style.setProperty('--subsection-color', group.color);
    section.innerHTML = `<button>${group.title}<span>${entries.length} recipes +</span></button><div class="subsection-list recipe-list"></div>`;
    section.querySelector('button').onclick = () => section.classList.toggle('open');

    // .recipe-list (styles.css) switches the shared .subsection-list from its
    // default multi-column small-card grid to a single full-width column,
    // sized for recipe cards rather than the small amino-acid-style cards
    // elsewhere in the library.
    const list = section.querySelector('.subsection-list');

    // Alphabetical by name, but a leading multiplier prefix like "6x", "10x",
    // "2xYT" is ignored for sorting purposes — comparison starts at the next
    // word (so "10x TBS" sorts under T, "6x DNA Loading..." sorts under D,
    // "2xYT Medium" sorts under Y).
    function sortKey(name) {
      return name.replace(/^\d+x\s*/i, '').trim();
    }
    entries
      .slice()
      .sort((a, b) => sortKey(a.name).localeCompare(sortKey(b.name)))
      .forEach(entry => list.appendChild(buildRecipeCard(entry)));

    root.appendChild(section);
  });
}

function buildRecipeCard(entry) {
  const card = document.createElement('article');
  card.className = 'recipe-card';

  // ---- Composition column: name + composition ----
  const left = document.createElement('div');
  left.className = 'recipe-card-body';

  const nameEl = document.createElement('b');
  nameEl.className = 'recipe-card-name';
  nameEl.appendChild(document.createTextNode(entry.name));
  if (entry.ph) {
    nameEl.appendChild(document.createTextNode(', '));
    const phEl = document.createElement('i');
    phEl.textContent = `pH ${entry.ph}`;
    nameEl.appendChild(phEl);
  }
  left.appendChild(nameEl);

  const basisEl = document.createElement('div');
  basisEl.textContent = `Basis: ${entry.basis}`;
  basisEl.className = 'recipe-card-basis';
  left.appendChild(basisEl);

  const table = document.createElement('div');
  table.className = 'recipe-card-table';
  entry.components.forEach(comp => {
    const row = document.createElement('div');
    row.className = 'recipe-card-row';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = comp.molarMass ? `${comp.name} (${comp.molarMass})` : comp.name;
    const amountSpan = document.createElement('b');
    amountSpan.textContent = comp.amount;
    amountSpan.className = 'recipe-card-amount';
    row.appendChild(nameSpan);
    row.appendChild(amountSpan);
    table.appendChild(row);
  });
  left.appendChild(table);

  if (entry.notes) {
    const notesEl = document.createElement('div');
    notesEl.textContent = entry.notes;
    notesEl.className = 'recipe-card-notes';
    left.appendChild(notesEl);
  }

  const sourceEl = document.createElement('div');
  sourceEl.className = 'recipe-card-source';
  sourceEl.textContent = entry.source === 'MediaDive'
    ? `Source: DSMZ MediaDive #${entry.sourceId}`
    : 'Source: standard reference formulation';
  left.appendChild(sourceEl);

  card.appendChild(left);

  return card;
}
