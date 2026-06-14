import React, { useState, useRef } from 'react';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLATFORM_LABELS = {
  cinema:     { label: 'Cinema',         emoji: '🎥', color: 'rgba(255,3,0,0.15)',     border: '#ff0300' },
  unofficial: { label: 'Non Ufficiale',  emoji: '🏴‍☠️', color: 'rgba(138,20,255,0.15)', border: '#8a14ff' },
  netflix:    { label: 'Netflix',         emoji: '🍿', color: 'rgba(229,9,20,0.15)',    border: '#e50914' },
  prime:      { label: 'Prime Video',     emoji: '🔵', color: 'rgba(0,168,225,0.15)',   border: '#00a8e1' },
  disney:     { label: 'Disney+',         emoji: '✨', color: 'rgba(18,107,185,0.15)',  border: '#126bb9' },
  apple:      { label: 'Apple TV+',       emoji: '🍏', color: 'rgba(255,255,255,0.08)', border: '#fff' },
  crunchyroll:{ label: 'Crunchyroll',     emoji: '🟠', color: 'rgba(244,117,33,0.15)', border: '#f47521' },
  other:      { label: 'Altro/Fisico',    emoji: '💿', color: 'rgba(255,255,255,0.05)', border: '#89898f' }
};

const SORT_OPTIONS = [
  { value: 'recent',    label: 'Più recente' },
  { value: 'oldest',   label: 'Meno recente' },
  { value: 'az',       label: 'Nome A→Z' },
  { value: 'za',       label: 'Nome Z→A' },
  { value: 'rating',   label: 'Per voto' }
];

const ALL_PLATFORMS = Object.entries(PLATFORM_LABELS).map(([k, v]) => ({ value: k, label: `${v.emoji} ${v.label}` }));
const RATING_OPTIONS = [
  { value: '', label: 'Tutti i voti' },
  { value: '5', label: '★★★★★ (5.0)' },
  { value: '4', label: '★★★★ (4.0+)' },
  { value: '3', label: '★★★ (3.0+)' },
  { value: '2', label: '★★ (2.0+)' }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

const renderStars = (rating) => {
  return [1, 2, 3, 4, 5].map(i => {
    if (rating >= i) return <span key={i} style={{ color: 'var(--accent-orange)' }}>★</span>;
    if (rating === i - 0.5) return (
      <span key={i} style={{ position: 'relative', display: 'inline-block', color: 'var(--text-muted)' }}>
        <span style={{ position: 'absolute', left: 0, overflow: 'hidden', width: '50%', color: 'var(--accent-orange)' }}>★</span>★
      </span>
    );
    return <span key={i} style={{ color: 'var(--text-muted)' }}>★</span>;
  });
};

const getPlatStyle = (k) => PLATFORM_LABELS[k] || { label: k, emoji: '🎬', color: 'rgba(255,255,255,0.05)', border: '#89898f' };

// ─── Stat cards horizontal scroll (used by Profile too via prop) ──────────────
export function StatsScrollCards({ trackedItems, statsConfig }) {
  const movies = trackedItems.filter(i => i.type === 'movie');
  const series = trackedItems.filter(i => i.type === 'tv');
  const totalItems = trackedItems.length;
  const avgRating = totalItems > 0
    ? (trackedItems.reduce((a, i) => a + i.rating, 0) / totalItems).toFixed(1)
    : '0.0';

  // Favorite platform
  const platCounts = {};
  trackedItems.forEach(i => { platCounts[i.platform] = (platCounts[i.platform] || 0) + 1; });
  const favPlatKey = Object.entries(platCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const favPlat = favPlatKey ? getPlatStyle(favPlatKey) : null;

  // Movie time (avg 105 min/film)
  const movieHours = Math.floor((movies.length * 105) / 60);
  const movieMins  = (movies.length * 105) % 60;
  // Series time (avg 12 ep × 45 min)
  const seriesEp   = series.length * 12;
  const seriesHours = Math.floor((seriesEp * 45) / 60);

  const allCards = {
    totalItems:        { id: 'totalItems',        value: totalItems,                      label: 'Visti Totali',      accent: 'var(--accent-cyan)',    icon: '🎬' },
    avgRating:         { id: 'avgRating',         value: `★ ${avgRating}`,                label: 'Voto Medio',        accent: 'var(--accent-orange)',  icon: '⭐' },
    favPlat:           { id: 'favPlat',           value: favPlat ? `${favPlat.emoji} ${favPlat.label}` : '—', label: 'Servizio Preferito', accent: 'var(--accent-purple)', icon: null },
    moviesCount:       { id: 'moviesCount',       value: `🎬 ${movies.length}`,           label: 'Film Visti',        accent: 'var(--text-white)',     icon: null },
    tvCount:           { id: 'tvCount',           value: `📺 ${series.length}`,           label: 'Serie Viste',       accent: 'var(--text-white)',     icon: null },
    movieTime:         { id: 'movieTime',         value: `${movieHours}h ${movieMins}m`,  label: 'Tempo Film',        accent: 'var(--accent-cyan)',    icon: '⏱️' },
    estimatedEpisodes: { id: 'estimatedEpisodes', value: seriesEp,                         label: 'Episodi Stimati',   accent: 'var(--accent-green)',   icon: '🎞️' },
    tvTime:            { id: 'tvTime',            value: `${seriesHours}h`,               label: 'Tempo Serie',       accent: 'var(--accent-cyan)',    icon: '⌛' }
  };

  // Se non c'è config (backward compatibility), mostrali tutti in ordine
  const defaultConfig = [
    { id: 'totalItems', visible: true }, { id: 'avgRating', visible: true },
    { id: 'favPlat', visible: true }, { id: 'moviesCount', visible: true },
    { id: 'tvCount', visible: true }, { id: 'movieTime', visible: true },
    { id: 'estimatedEpisodes', visible: true }, { id: 'tvTime', visible: true }
  ];
  const configToUse = statsConfig || defaultConfig;

  const cardsToRender = configToUse
    .filter(c => c.visible && allCards[c.id])
    .map(c => allCards[c.id]);

  if (cardsToRender.length === 0) return null;

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      overflowX: 'auto',
      padding: '4px 0 14px 0',
      scrollbarWidth: 'none',
      WebkitOverflowScrolling: 'touch'
    }}>
      {cardsToRender.map((card, i) => (
        <div key={card.id || i} style={{
          minWidth: '150px',
          background: 'var(--bg-deep)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--border-radius-md)',
          padding: '18px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0
        }}>
          <div style={{
            fontSize: card.value.toString().length > 6 ? '1.1rem' : '1.5rem',
            fontWeight: 700,
            color: card.accent,
            textAlign: 'center',
            lineHeight: 1.2
          }}>
            {card.value}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-grey)', textTransform: 'uppercase', letterSpacing: '0.8px', textAlign: 'center' }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Filter / Sort dropdown panel ────────────────────────────────────────────
function FilterSortPanel({ sort, setSort, filterPlatform, setFilterPlatform, filterRating, setFilterRating, filterGenre, setFilterGenre, allGenres }) {
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Sort button */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => { setShowSort(s => !s); setShowFilter(false); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: showSort ? 'rgba(44,242,255,0.1)' : 'var(--bg-input)',
            border: `1px solid ${showSort ? 'var(--accent-cyan)' : 'var(--border-light)'}`,
            color: showSort ? 'var(--accent-cyan)' : 'var(--text-grey)',
            padding: '8px 14px', borderRadius: '20px',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Visualizzazione
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {showSort && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 80,
            background: 'var(--bg-deep)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--border-radius-md)', padding: '8px', minWidth: '190px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            {SORT_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => { setSort(opt.value); setShowSort(false); }}
                style={{
                  display: 'block', width: '100%', background: sort === opt.value ? 'rgba(44,242,255,0.1)' : 'none',
                  border: 'none', color: sort === opt.value ? 'var(--accent-cyan)' : 'var(--text-grey)',
                  padding: '10px 14px', textAlign: 'left', fontSize: '0.88rem', fontWeight: sort === opt.value ? 600 : 400,
                  borderRadius: 'var(--border-radius-sm)', cursor: 'pointer'
                }}
              >{opt.label}</button>
            ))}
          </div>
        )}
      </div>

      {/* Filter button */}
      <div style={{ position: 'relative' }}>
        {(() => {
          const active = filterPlatform || filterRating || filterGenre;
          return (
            <button
              onClick={() => { setShowFilter(s => !s); setShowSort(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '7px',
                background: showFilter || active ? 'rgba(44,242,255,0.1)' : 'var(--bg-input)',
                border: `1px solid ${showFilter || active ? 'var(--accent-cyan)' : 'var(--border-light)'}`,
                color: showFilter || active ? 'var(--accent-cyan)' : 'var(--text-grey)',
                padding: '8px 14px', borderRadius: '20px',
                fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                transition: 'var(--transition-smooth)', position: 'relative'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filtri {active && <span style={{ background: 'var(--accent-cyan)', color: 'var(--bg-dark)', borderRadius: '50%', width: 16, height: 16, fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>!</span>}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          );
        })()}
        {showFilter && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 80,
            background: 'var(--bg-deep)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--border-radius-md)', padding: '14px', minWidth: '240px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-grey)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '7px' }}>Piattaforma</div>
              <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'var(--text-white)', padding: '7px 10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <option value="">Tutte le piattaforme</option>
                {ALL_PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-grey)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '7px' }}>Voto minimo</div>
              <select value={filterRating} onChange={e => setFilterRating(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'var(--text-white)', padding: '7px 10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                {RATING_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            {allGenres.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-grey)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '7px' }}>Genere</div>
                <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'var(--text-white)', padding: '7px 10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <option value="">Tutti i generi</option>
                  {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}
            {(filterPlatform || filterRating || filterGenre) && (
              <button onClick={() => { setFilterPlatform(''); setFilterRating(''); setFilterGenre(''); }}
                style={{ marginTop: '8px', background: 'rgba(255,3,0,0.1)', border: '1px solid rgba(255,3,0,0.3)', color: 'var(--accent-red)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', width: '100%' }}>
                Rimuovi filtri
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Full list sub-page ───────────────────────────────────────────────────────
function FullListPage({ items, type, onBack, onSelectCard }) {
  const [sort, setSort] = useState('recent');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [filterGenre, setFilterGenre] = useState('');

  const allGenres = [...new Set(items.flatMap(i => i.genres || []))].filter(Boolean).sort();

  const processed = [...items]
    .filter(i => {
      if (filterPlatform && i.platform !== filterPlatform) return false;
      if (filterRating && i.rating < parseFloat(filterRating)) return false;
      if (filterGenre && !(i.genres || []).includes(filterGenre)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'az')     return a.title.localeCompare(b.title);
      if (sort === 'za')     return b.title.localeCompare(a.title);
      if (sort === 'rating') return b.rating - a.rating;
      if (sort === 'oldest') return new Date(a.watchDate) - new Date(b.watchDate);
      return new Date(b.watchDate) - new Date(a.watchDate); // 'recent'
    });

  const typeLabel = type === 'movie' ? 'Film' : 'Serie TV';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack}
            style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-white)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{typeLabel} ({processed.length})</h2>
        </div>
        <FilterSortPanel
          sort={sort} setSort={setSort}
          filterPlatform={filterPlatform} setFilterPlatform={setFilterPlatform}
          filterRating={filterRating} setFilterRating={setFilterRating}
          filterGenre={filterGenre} setFilterGenre={setFilterGenre}
          allGenres={allGenres}
        />
      </div>

      {processed.length > 0 ? (
        <div className="media-grid">
          {processed.map(item => {
            const ps = getPlatStyle(item.platform);
            return (
              <div className="media-card tracked-card" key={item.id} onClick={() => onSelectCard(item)}>
                <div className="card-image-container">
                  {item.poster
                    ? <img src={item.poster} alt={item.title} className="card-image" onError={e => { e.target.style.opacity = '0.2'; }}/>
                    : <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-input)', fontSize: '2.5rem' }}>{type === 'movie' ? '🎬' : '📺'}</div>
                  }
                  <div className="rating-pill"><span>★ {item.rating.toFixed(1)}</span></div>
                </div>
                <div className="card-info">
                  <div className="card-title" title={item.title}>{item.title}</div>
                  <div className="tracked-rating-bar">{renderStars(item.rating)}</div>
                  <div className="card-meta"><span>{fmtDate(item.watchDate)}</span></div>
                  <div className="provider-mini-badge" style={{ backgroundColor: ps.color, borderColor: ps.border, borderWidth: 1, borderStyle: 'solid' }}>
                    <span className="provider-mini-emoji">{ps.emoji}</span>
                    <span>{ps.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</p>
          <p>Nessun elemento corrisponde ai filtri selezionati.</p>
        </div>
      )}
    </div>
  );
}

// ─── Section with preview slider + "see all" arrow ───────────────────────────
function MediaSection({ items, type, onSelectCard, onSeeAll }) {
  const typeLabel = type === 'movie' ? '🎬 Film' : '📺 Serie TV';
  const preview = [...items]
    .sort((a, b) => new Date(b.watchDate) - new Date(a.watchDate))
    .slice(0, 5);

  if (items.length === 0) {
    return (
      <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-lg)', padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '2rem', marginBottom: '6px' }}>{type === 'movie' ? '🎬' : '📺'}</p>
        <p style={{ fontSize: '0.9rem' }}>Nessun{type === 'movie' ? ' film' : 'a serie TV'} nella collezione.</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{typeLabel} <span style={{ color: 'var(--text-grey)', fontWeight: 400 }}>({items.length})</span></span>
        <button onClick={onSeeAll}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          Vedi tutti
          <ArrowRightIcon size={16} />
        </button>
      </div>

      {/* Horizontal poster scroll */}
      <div style={{ padding: '12px 12px 16px 12px' }}>
        <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', padding: '4px 0' }}>
          {preview.map(item => {
            const ps = getPlatStyle(item.platform);
            return (
              <div key={item.id} className="poster-slider-card" onClick={() => onSelectCard(item)}>
                {/* Poster */}
                <div className="poster-slider-img-wrapper">
                  {item.poster
                    ? <img src={item.poster} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.opacity = '0.2'; }}/>
                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2rem' }}>{type === 'movie' ? '🎬' : '📺'}</div>
                  }
                  {/* Rating badge */}
                  <div style={{
                    position: 'absolute', bottom: 6, right: 6,
                    background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
                    borderRadius: '10px', padding: '2px 7px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-orange)'
                  }}>
                    ★ {item.rating.toFixed(1)}
                  </div>
                  {/* Platform badge */}
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    background: ps.color, border: `1px solid ${ps.border}`,
                    borderRadius: '8px', padding: '2px 6px', fontSize: '0.65rem', fontWeight: 600,
                    color: 'var(--text-white)', backdropFilter: 'blur(4px)'
                  }}>
                    {ps.emoji}
                  </div>
                </div>
                {/* Title */}
                <div className="poster-card-title" title={item.title}>{item.title}</div>
                <div className="poster-card-year">{fmtDate(item.watchDate)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MyList({ trackedItems, onSelectCard }) {
  // 'overview' | 'movies' | 'tv'
  const [page, setPage] = useState('overview');

  const movies = trackedItems.filter(i => i.type === 'movie');
  const series = trackedItems.filter(i => i.type === 'tv');

  if (page === 'movies') {
    return <FullListPage items={movies} type="movie" onBack={() => setPage('overview')} onSelectCard={onSelectCard} />;
  }
  if (page === 'tv') {
    return <FullListPage items={series} type="tv" onBack={() => setPage('overview')} onSelectCard={onSelectCard} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Title */}
      <div>
        <h1 className="gradient-text-title">La tua <span>Collezione</span></h1>
        <p className="subtitle-desc" style={{ marginBottom: 0 }}>Tieni traccia di tutto ciò che hai guardato, quando e come.</p>
      </div>

      {/* Film section */}
      <MediaSection items={movies} type="movie" onSelectCard={onSelectCard} onSeeAll={() => setPage('movies')} />

      {/* Serie TV section */}
      <MediaSection items={series} type="tv" onSelectCard={onSelectCard} onSeeAll={() => setPage('tv')} />
    </div>
  );
}
