// ─── State ───
let allPokemon = [];
let activeFilter = 'all';

// ─── DOM refs ───
const container = document.getElementById('container');
const loader = document.getElementById('loader');
const searchInput = document.getElementById('searchInput');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('modal');
const modalCard = document.getElementById('modalCard');
const filterBtns = document.querySelectorAll('.tf');

// ─── Fetch first 151 Pokémon (Gen 1) ───
async function fetchPokemon() {
  try {
    const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
    const data = await res.json();

    const details = await Promise.all(
      data.results.map(p => fetch(p.url).then(r => r.json()))
    );

    allPokemon = details;
    loader.style.display = 'none';
    renderCards(allPokemon);
  } catch (err) {
    loader.innerHTML = `<p style="color:#e8453c;">Couldn't load Pokémon — check your connection.</p>`;
  }
}

// ─── Render cards ───
function renderCards(list) {
  container.innerHTML = '';
  emptyState.style.display = list.length ? 'none' : 'block';

  list.forEach((poke, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${i * 30}ms`;

    const artwork =
      poke.sprites.other?.['official-artwork']?.front_default ||
      poke.sprites.front_default;

    card.innerHTML = `
      <span class="card-id">#${String(poke.id).padStart(3, '0')}</span>
      <div class="card-img-wrap">
        <img src="${artwork}" alt="${poke.name}" loading="lazy">
      </div>
      <div class="card-name">${poke.name}</div>
      <div class="card-types">
        ${poke.types.map(t =>
      `<span class="badge ${t.type.name}">${t.type.name}</span>`
    ).join('')}
      </div>
    `;

    card.addEventListener('click', () => openModal(poke));
    container.appendChild(card);
  });
}

// ─── Filtering helpers ───
function applyFilters() {
  const q = searchInput.value.toLowerCase().trim();
  let filtered = allPokemon;

  if (activeFilter !== 'all') {
    filtered = filtered.filter(p =>
      p.types.some(t => t.type.name === activeFilter)
    );
  }
  if (q) {
    filtered = filtered.filter(p =>
      p.name.includes(q) || String(p.id).padStart(3, '0').includes(q)
    );
  }
  renderCards(filtered);
}

searchInput.addEventListener('input', applyFilters);

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.type;
    applyFilters();
  });
});

// ─── Modal ───
const STAT_LABELS = {
  hp: 'HP', attack: 'ATK', defense: 'DEF',
  'special-attack': 'SpA', 'special-defense': 'SpD', speed: 'SPD'
};

const STAT_COLORS = {
  hp: '#e8453c', attack: '#f5a623', defense: '#4f91d6',
  'special-attack': '#7166e0', 'special-defense': '#66bb6a', speed: '#f5c542'
};

function openModal(poke) {
  const artwork =
    poke.sprites.other?.['official-artwork']?.front_default ||
    poke.sprites.front_default;

  const typeBadges = poke.types.map(t =>
    `<span class="badge ${t.type.name}">${t.type.name}</span>`
  ).join('');

  const statBars = poke.stats.map(s => {
    const pct = Math.min(s.base_stat / 160 * 100, 100);
    const label = STAT_LABELS[s.stat.name] || s.stat.name;
    const color = STAT_COLORS[s.stat.name] || 'var(--accent)';
    return `
      <div class="stat-row">
        <span class="stat-label">${label}</span>
        <div class="stat-bar-bg"><div class="stat-bar" style="width:0%;background:${color}" data-w="${pct}%"></div></div>
        <span class="stat-val">${s.base_stat}</span>
      </div>`;
  }).join('');

  const heightM = (poke.height / 10).toFixed(1);
  const weightKg = (poke.weight / 10).toFixed(1);

  modalCard.innerHTML = `
    <button class="close-btn" id="closeModal">&times;</button>
    <img class="modal-img" src="${artwork}" alt="${poke.name}">
    <div class="modal-name">${poke.name}</div>
    <div class="modal-id">#${String(poke.id).padStart(3, '0')}</div>
    <div class="modal-types">${typeBadges}</div>
    <div class="modal-info">
      <div><strong>${heightM} m</strong><br><span>Height</span></div>
      <div><strong>${weightKg} kg</strong><br><span>Weight</span></div>
    </div>
    <div class="modal-stats">${statBars}</div>
  `;

  modal.style.display = 'flex';
  requestAnimationFrame(() => {
    modal.classList.add('show');
    // animate stat bars
    modalCard.querySelectorAll('.stat-bar').forEach(bar => {
      requestAnimationFrame(() => { bar.style.width = bar.dataset.w; });
    });
  });

  document.getElementById('closeModal').addEventListener('click', closeModal);
}

function closeModal() {
  modal.classList.remove('show');
  setTimeout(() => { modal.style.display = 'none'; }, 260);
}

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ─── Go ───
fetchPokemon();