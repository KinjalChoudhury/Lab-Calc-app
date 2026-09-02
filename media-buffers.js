/*
  media-buffers.js
  ----------------------------------------------------------------------------
  Renders the Library > "Media / Buffers" section from MEDIA_BUFFERS_DATA
  (media-buffers-data.js). No HTML or CSS files are touched by this file —
  it builds the two collapsible subsections ("Media", "Buffers") inside the
  existing #media-buffers container using the app's existing .subsection /
  .subsection-list classes, and lays out each recipe card with inline styles
  built from the app's existing CSS custom properties (var(--ink) etc.) so it
  matches the app's visual language without adding new stylesheet rules.

  Each recipe card shows, per the agreed format:
    - Name
    - Composition: each component with its molar mass (when applicable) and
      the amount required for the recipe's stated basis (100 mL)
    - A right-hand box with the target/final pH, only when one applies
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
    section.innerHTML = `<button>${group.title}<span>${entries.length} recipes +</span></button><div class="subsection-list"></div>`;
    section.querySelector('button').onclick = () => section.classList.toggle('open');

    // The shared .subsection-list is a multi-column card grid sized for
    // small cards elsewhere in the library (amino acids etc.); a recipe
    // card needs a single, full-width column instead. Only grid-template-
    // columns/gap are set inline — `display` is deliberately left alone so
    // the existing CSS (.subsection.open .subsection-list { display:grid })
    // still controls show/hide when the category is expanded/collapsed.
    const list = section.querySelector('.subsection-list');
    list.style.gridTemplateColumns = '1fr';
    list.style.gap = '10px';

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
  card.style.cssText = [
    'display: grid',
    'grid-template-columns: 1fr auto',
    'gap: 12px',
    'align-items: start',
    'padding: 12px',
    'border: 1.5px solid var(--ink)',
    'border-radius: 6px',
    'background: #fff'
  ].join(';');

  // ---- Left column: name + composition ----
  const left = document.createElement('div');
  left.style.cssText = 'min-width: 0;';

  const nameEl = document.createElement('b');
  nameEl.textContent = entry.name;
  nameEl.style.cssText = 'display: block; font-size: 13px; margin-bottom: 3px;';
  left.appendChild(nameEl);

  const basisEl = document.createElement('div');
  basisEl.textContent = `Basis: ${entry.basis}`;
  basisEl.style.cssText = 'font-size: 10px; color: var(--muted); margin-bottom: 8px;';
  left.appendChild(basisEl);

  const table = document.createElement('div');
  table.style.cssText = 'display: grid; gap: 4px;';
  entry.components.forEach(comp => {
    const row = document.createElement('div');
    row.style.cssText = [
      'display: grid',
      'grid-template-columns: 1fr auto',
      'gap: 8px',
      'font-size: 11px',
      'padding: 3px 0',
      'border-bottom: 1px solid var(--line)'
    ].join(';');
    const nameSpan = document.createElement('span');
    nameSpan.textContent = comp.molarMass ? `${comp.name} (${comp.molarMass})` : comp.name;
    const amountSpan = document.createElement('b');
    amountSpan.textContent = comp.amount;
    amountSpan.style.cssText = 'white-space: nowrap; text-align: right;';
    row.appendChild(nameSpan);
    row.appendChild(amountSpan);
    table.appendChild(row);
  });
  left.appendChild(table);

  if (entry.notes) {
    const notesEl = document.createElement('div');
    notesEl.textContent = entry.notes;
    notesEl.style.cssText = 'font-size: 10px; color: var(--muted); margin-top: 8px; line-height: 1.5;';
    left.appendChild(notesEl);
  }

  const sourceEl = document.createElement('div');
  sourceEl.style.cssText = 'font-size: 9px; color: var(--muted); margin-top: 6px; text-transform: uppercase; letter-spacing: .04em;';
  sourceEl.textContent = entry.source === 'MediaDive'
    ? `Source: DSMZ MediaDive #${entry.sourceId}`
    : 'Source: standard reference formulation';
  left.appendChild(sourceEl);

  card.appendChild(left);

  // ---- Right column: pH box (only when a pH applies) ----
  if (entry.ph) {
    const phBox = document.createElement('div');
    phBox.style.cssText = [
      'display: grid',
      'justify-items: center',
      'align-content: center',
      'gap: 2px',
      'min-width: 64px',
      'padding: 10px 8px',
      'border: 1.5px solid var(--ink)',
      'border-radius: 6px',
      'background: var(--paper)',
      'text-align: center'
    ].join(';');
    const phLabel = document.createElement('span');
    phLabel.textContent = 'pH';
    phLabel.style.cssText = 'font-size: 9px; color: var(--muted); text-transform: uppercase; letter-spacing: .05em;';
    const phValue = document.createElement('b');
    phValue.textContent = entry.ph;
    phValue.style.cssText = 'font-size: 15px;';
    phBox.appendChild(phLabel);
    phBox.appendChild(phValue);
    card.appendChild(phBox);
  } else {
    // Keep the two-column grid consistent even when there's no pH box, so
    // cards without a pH don't stretch the composition column wider than
    // cards that have one.
    const spacer = document.createElement('div');
    spacer.style.cssText = 'min-width: 64px;';
    card.appendChild(spacer);
  }

  return card;
}
