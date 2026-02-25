// ============================================================
//  CINEPEDIA — main.js
//  Free TMDB API (The Movie Database) — https://www.themoviedb.org
// ============================================================

const API_KEY  = '4e44d9029b1270a757cddc766a1bcb63';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_SM   = 'https://image.tmdb.org/t/p/w500';
const IMG_LG   = 'https://image.tmdb.org/t/p/w1280';

const GENRE_MAP = {
  28:'Action', 35:'Comedy', 18:'Drama', 878:'Sci-Fi',
  27:'Horror', 10749:'Romance', 16:'Animation', 53:'Thriller',
  12:'Adventure', 80:'Crime', 99:'Documentary', 14:'Fantasy',
  36:'History', 10402:'Music', 9648:'Mystery', 10752:'War', 37:'Western'
};

// ---- State ----
let allMovies    = [];
let currentFilter = 'all';
let previousPage  = 'home';

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  buildFilmStrip();
  fetchTrending();
  fetchTopRated();
  fetchAllMovies();
});

// ============================================================
//  FILM STRIP ANIMATION
// ============================================================
function buildFilmStrip() {
  const strip = document.getElementById('film-strip');
  if (!strip) return;
  for (let r = 0; r < 20; r++) {
    const row = document.createElement('div');
    row.className = 'film-row';
    for (let c = 0; c < 8; c++) {
      const cell = document.createElement('div');
      cell.className = 'film-cell';
      row.appendChild(cell);
    }
    strip.appendChild(row);
  }
}

// ============================================================
//  API FETCHERS
// ============================================================
async function fetchTrending() {
  try {
    const res  = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
    const data = await res.json();
    renderMovies(data.results.slice(0, 5), 'trending-grid');
    const statEl = document.getElementById('stat-movies');
    if (statEl) statEl.textContent = '500K+';
  } catch (e) {
    renderFallback('trending-grid', 5);
  }
}

async function fetchTopRated() {
  try {
    const res  = await fetch(`${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=1`);
    const data = await res.json();
    renderMovies(data.results.slice(0, 5), 'toprated-grid');
  } catch (e) {
    renderFallback('toprated-grid', 5);
  }
}

async function fetchAllMovies() {
  try {
    const [p1, p2, p3] = await Promise.all([
      fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`).then(r => r.json()),
      fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=2`).then(r => r.json()),
      fetch(`${BASE_URL}/movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`).then(r => r.json()),
    ]);
    allMovies = [...(p1.results || []), ...(p2.results || []), ...(p3.results || [])];
    renderAllMovies();
  } catch (e) {
    renderFallback('all-movies-grid', 8);
  }
}

// ============================================================
//  RENDER HELPERS
// ============================================================
function getGenreName(ids) {
  if (!ids || !ids.length) return 'Unknown';
  return GENRE_MAP[ids[0]] || 'Movie';
}

function renderMovies(movies, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = movies.map(m => createMovieCard(m)).join('');
}

function renderAllMovies() {
  let list = allMovies;
  if (currentFilter !== 'all') {
    const gid = Object.entries(GENRE_MAP).find(([, v]) => v === currentFilter)?.[0];
    if (gid) list = allMovies.filter(m => m.genre_ids && m.genre_ids.includes(parseInt(gid)));
  }
  const el = document.getElementById('all-movies-grid');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem;color:var(--muted);">No movies found for this filter.</div>`;
    return;
  }
  el.innerHTML = list.map(m => createMovieCard(m)).join('');
}

function createMovieCard(m) {
  const poster = m.poster_path
    ? `${IMG_SM}${m.poster_path}`
    : `https://via.placeholder.com/300x450/111118/e8b84b?text=${encodeURIComponent(m.title || 'Movie')}`;
  const year   = m.release_date ? m.release_date.substring(0, 4) : 'N/A';
  const rating = m.vote_average ? m.vote_average.toFixed(1) : 'N/A';
  const genre  = getGenreName(m.genre_ids);
  const blurb  = m.overview ? m.overview.substring(0, 80) + '...' : 'Click to learn more';
  const delay  = (Math.random() * 0.3).toFixed(2);

  return `
    <div class="movie-card" onclick="openDetail(${m.id})" style="animation-delay:${delay}s">
      <div class="card-poster">
        <img src="${poster}" alt="${m.title}" loading="lazy"
             onerror="this.src='https://via.placeholder.com/300x450/111118/e8b84b?text=No+Poster'">
        <div class="card-rating-badge">★ ${rating}</div>
        <div class="card-genre-badge">${genre}</div>
        <div class="card-overlay">
          <div class="card-play">▶</div>
          <div style="font-size:.75rem;color:var(--muted)">${blurb}</div>
        </div>
      </div>
      <div class="card-info">
        <div class="card-title">${m.title || m.name}</div>
        <div class="card-meta">
          <span class="card-year">${year}</span>
          <span>•</span>
          <span>${genre}</span>
        </div>
      </div>
    </div>`;
}

function renderFallback(containerId, count) {
  const fallback = [
    { id:278,  title:'The Shawshank Redemption', release_date:'1994-09-23', vote_average:9.3, genre_ids:[18],     overview:'Two imprisoned men bond over years.', poster_path:null },
    { id:238,  title:'The Godfather',             release_date:'1972-03-24', vote_average:9.2, genre_ids:[18,80],  overview:'The aging patriarch transfers control of his empire.', poster_path:null },
    { id:424,  title:"Schindler's List",           release_date:'1993-12-15', vote_average:9.0, genre_ids:[18,36],  overview:'A businessman saves Jewish lives during the Holocaust.', poster_path:null },
    { id:299534,title:'Avengers: Endgame',         release_date:'2019-04-26', vote_average:8.4, genre_ids:[28,12],  overview:'After Thanos wiped out half the universe...', poster_path:null },
    { id:19404, title:'Dilwale Dulhania Le Jayenge',release_date:'1995-10-20', vote_average:8.1, genre_ids:[10749], overview:'A modern love story set in London.', poster_path:null },
    { id:496243,title:'Parasite',                   release_date:'2019-05-30', vote_average:8.5, genre_ids:[35,53],  overview:'A poor family schemes to become employed.', poster_path:null },
    { id:155,  title:'The Dark Knight',             release_date:'2008-07-18', vote_average:9.0, genre_ids:[28,80],  overview:'Batman faces the Joker, a criminal mastermind.', poster_path:null },
    { id:680,  title:'Pulp Fiction',                release_date:'1994-10-14', vote_average:8.9, genre_ids:[53,80],  overview:'The lives of criminals intertwine.', poster_path:null },
  ];
  renderMovies(fallback.slice(0, count), containerId);
}

// ============================================================
//  DETAIL PAGE
// ============================================================
async function openDetail(movieId) {
  previousPage = document.querySelector('.page.active').id.replace('page-', '');
  showPage('detail');

  // Reset UI
  document.getElementById('detail-title').textContent    = 'Loading...';
  document.getElementById('detail-overview').textContent  = '';
  document.getElementById('detail-tagline').textContent   = '';
  document.getElementById('detail-cast-grid').innerHTML   = '';
  document.getElementById('detail-info-grid').innerHTML   = '';
  document.getElementById('detail-backdrop').style.background =
    'linear-gradient(135deg,#1a0a18,#0a0f1a)';

  try {
    const [movie, credits] = await Promise.all([
      fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=en-US`).then(r => r.json()),
      fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`).then(r => r.json()),
    ]);

    // Backdrop
    if (movie.backdrop_path) {
      document.getElementById('detail-backdrop').style.background =
        `url(${IMG_LG}${movie.backdrop_path}) center/cover no-repeat`;
    }

    // Poster
    const posterEl  = document.getElementById('detail-poster-img');
    posterEl.src    = movie.poster_path
      ? `${IMG_SM}${movie.poster_path}`
      : `https://via.placeholder.com/300x450/111118/e8b84b?text=${encodeURIComponent(movie.title)}`;
    posterEl.alt    = movie.title;

    // Core info
    document.getElementById('detail-title').textContent    = movie.title;
    document.getElementById('detail-tagline').textContent  = movie.tagline || '';
    document.getElementById('detail-genre-badge').textContent =
      movie.genres && movie.genres.length ? movie.genres[0].name : 'Movie';
    document.getElementById('detail-year').textContent     = movie.release_date ? movie.release_date.substring(0,4) : 'N/A';
    document.getElementById('detail-rating').textContent   = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    document.getElementById('detail-runtime').textContent  = movie.runtime ? movie.runtime + 'm' : 'N/A';
    const vc = movie.vote_count || 0;
    document.getElementById('detail-votes').textContent    = vc > 1000 ? (vc/1000).toFixed(1)+'K' : vc;
    document.getElementById('detail-overview').textContent = movie.overview || 'No overview available.';

    // Info grid
    const infoItems = [
      { label:'Release Date',  value: movie.release_date || 'N/A' },
      { label:'Status',        value: movie.status || 'N/A' },
      { label:'Language',      value: movie.original_language ? movie.original_language.toUpperCase() : 'N/A' },
      { label:'Budget',        value: movie.budget  ? '$' + movie.budget.toLocaleString()  : 'N/A' },
      { label:'Revenue',       value: movie.revenue ? '$' + movie.revenue.toLocaleString() : 'N/A' },
      { label:'Genres',        value: movie.genres  ? movie.genres.map(g => g.name).join(', ') : 'N/A' },
      { label:'Production',    value: movie.production_companies?.length ? movie.production_companies[0].name : 'N/A' },
      { label:'Country',       value: movie.production_countries?.length ? movie.production_countries[0].name : 'N/A' },
    ];
    document.getElementById('detail-info-grid').innerHTML =
      infoItems.map(i => `
        <div class="info-item">
          <div class="info-label">${i.label}</div>
          <div class="info-value">${i.value}</div>
        </div>`).join('');

    // Cast
    const emojis = ['🧑','👩','👨','🧑‍🎤','👩‍🦰','👨‍🦱','🧑‍💼','👩‍🦳'];
    const cast   = (credits.cast || []).slice(0, 8);
    document.getElementById('detail-cast-grid').innerHTML = cast.length
      ? cast.map((c, i) => `
          <div class="cast-card">
            <div class="cast-avatar">
              ${c.profile_path
                ? `<img src="${IMG_SM}${c.profile_path}" alt="${c.name}"
                        onerror="this.parentElement.innerHTML='${emojis[i % emojis.length]}'">`
                : emojis[i % emojis.length]}
            </div>
            <div class="cast-name">${c.name}</div>
            <div class="cast-role">${c.character || ''}</div>
          </div>`).join('')
      : '<p style="color:var(--muted)">Cast information unavailable.</p>';

  } catch (err) {
    document.getElementById('detail-title').textContent   = 'Error loading movie';
    document.getElementById('detail-overview').textContent = 'Could not fetch movie details. Please check your internet connection.';
  }
}

// ============================================================
//  NAVIGATION
// ============================================================
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');

  document.querySelectorAll('nav ul li a').forEach(a => a.classList.remove('active'));
  const navEl = document.getElementById('nav-' + name);
  if (navEl) navEl.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
  showPage(previousPage || 'home');
}

// ============================================================
//  FILTERING
// ============================================================
function setFilter(genre, btn) {
  currentFilter = genre;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAllMovies();
}

function filterByGenre(genre) {
  currentFilter = genre;
  showPage('movies');
  document.querySelectorAll('.filter-btn').forEach(b => {
    const match = (genre === 'all' && b.textContent.trim() === 'All') ||
                  b.textContent.trim() === genre;
    b.classList.toggle('active', match);
  });
  renderAllMovies();
}

// ============================================================
//  SEARCH
// ============================================================
let searchTimeout;
function handleSearch(val) {
  clearTimeout(searchTimeout);
  if (!val.trim()) return;
  searchTimeout = setTimeout(async () => {
    try {
      const res  = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=${encodeURIComponent(val)}&page=1`);
      const data = await res.json();
      if (data.results && data.results.length) {
        showPage('movies');
        currentFilter = 'all';
        document.querySelectorAll('.filter-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
        const el = document.getElementById('all-movies-grid');
        el.innerHTML = data.results.slice(0, 20).map(m => createMovieCard(m)).join('');
        showToast(`Found ${data.results.length} results for "${val}"`);
      } else {
        showToast(`No movies found for "${val}"`);
      }
    } catch (e) {
      showToast('Search failed. Check your internet connection.');
    }
  }, 500);
}

// ============================================================
//  TOAST
// ============================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}
