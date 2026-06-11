import React, { useState } from 'react';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

const SORT_OPTIONS = [
  { value: 'recent',  label: 'Aggiunti di recente' },
  { value: 'az',      label: 'Nome A→Z' },
  { value: 'za',      label: 'Nome Z→A' },
  { value: 'rating',  label: 'Voto IMDb' },
  { value: 'year',    label: 'Anno di uscita' }
];

function FilterSortWatchlistPanel({ sort, setSort, filterGenre, setFilterGenre, allGenres }) {
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
          Ordinamento
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
      {allGenres.length > 0 && (
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowFilter(s => !s); setShowSort(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: showFilter || filterGenre ? 'rgba(44,242,255,0.1)' : 'var(--bg-input)',
              border: `1px solid ${showFilter || filterGenre ? 'var(--accent-cyan)' : 'var(--border-light)'}`,
              color: showFilter || filterGenre ? 'var(--accent-cyan)' : 'var(--text-grey)',
              padding: '8px 14px', borderRadius: '20px',
              fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
              transition: 'var(--transition-smooth)', position: 'relative'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filtri {filterGenre && <span style={{ background: 'var(--accent-cyan)', color: 'var(--bg-dark)', borderRadius: '50%', width: 16, height: 16, fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>!</span>}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {showFilter && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 80,
              background: 'var(--bg-deep)', border: '1px solid var(--border-light)',
              borderRadius: 'var(--border-radius-md)', padding: '14px', minWidth: '240px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-grey)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '7px' }}>Genere</div>
                <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border-light)', color: 'var(--text-white)', padding: '7px 10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <option value="">Tutti i generi</option>
                  {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              {filterGenre && (
                <button onClick={() => setFilterGenre('')}
                  style={{ marginTop: '8px', background: 'rgba(255,3,0,0.1)', border: '1px solid rgba(255,3,0,0.3)', color: 'var(--accent-red)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', width: '100%' }}>
                  Rimuovi filtri
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FullWatchlistPage({ items, type, onBack, onSelectCard }) {
  const [sort, setSort] = useState('recent');
  const [filterGenre, setFilterGenre] = useState('');

  const allGenres = [...new Set(items.flatMap(i => i.genres || []))].filter(Boolean).sort();

  const processed = [...items]
    .filter(i => {
      if (filterGenre && !(i.genres || []).includes(filterGenre)) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'az')     return a.title.localeCompare(b.title);
      if (sort === 'za')     return b.title.localeCompare(a.title);
      if (sort === 'rating') return parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0);
      if (sort === 'year')   return parseInt(b.year || 0) - parseInt(a.year || 0);
      return 0; // 'recent' (maintain default order)
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
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{typeLabel} in Watchlist ({processed.length})</h2>
        </div>
        <FilterSortWatchlistPanel
          sort={sort} setSort={setSort}
          filterGenre={filterGenre} setFilterGenre={setFilterGenre}
          allGenres={allGenres}
        />
      </div>

      {processed.length > 0 ? (
        <div className="media-grid">
          {processed.map(item => (
            <div className="media-card" key={item.id} onClick={() => onSelectCard(item)}>
              <div className="card-image-container">
                <img 
                  src={item.poster || 'https://via.placeholder.com/500x750?text=No+Poster'} 
                  alt={item.title} 
                  className="card-image"
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster'; }}
                />
                <div className="rating-pill" style={{ color: 'var(--text-white)' }}>
                  <span>★ {item.imdbRating || 'N/D'}</span>
                </div>
              </div>
              <div className="card-info">
                <div className="card-title" title={item.title}>{item.title}</div>
                <div className="card-meta">
                  <span>{item.type === 'movie' ? 'Film' : 'Serie TV'}</span>
                  {item.year && <span>{item.year}</span>}
                </div>
              </div>
            </div>
          ))}
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

function WatchlistSection({ items, type, onSelectCard, onSeeAll }) {
  const typeLabel = type === 'movie' ? '🎬 Film da guardare' : '📺 Serie TV da guardare';
  const preview = items.slice(0, 5);

  if (items.length === 0) {
    return (
      <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-lg)', padding: '28px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p style={{ fontSize: '2rem', marginBottom: '8px' }}>{type === 'movie' ? '🎬' : '📺'}</p>
        <p style={{ fontSize: '0.9rem' }}>Nessun{type === 'movie' ? ' film' : 'a serie TV'} nella watchlist.</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{typeLabel} <span style={{ color: 'var(--text-grey)', fontWeight: 400 }}>({items.length})</span></span>
        <button onClick={onSeeAll}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
          Vedi tutti
          <ArrowRightIcon size={16} />
        </button>
      </div>

      {/* Horizontal poster scroll */}
      <div style={{ padding: '16px 16px 20px 16px' }}>
        <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', padding: '4px 0' }}>
          {preview.map(item => (
            <div key={item.id} className="poster-slider-card" onClick={() => onSelectCard(item)}>
              {/* Poster */}
              <div className="poster-slider-img-wrapper">
                <img 
                  src={item.poster || 'https://via.placeholder.com/500x750?text=No+Poster'} 
                  alt={item.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster'; }}
                />
                {/* Rating badge */}
                <div style={{
                  position: 'absolute', bottom: 6, right: 6,
                  background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
                  borderRadius: '10px', padding: '2px 7px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-orange)'
                }}>
                  ★ {item.imdbRating || 'N/D'}
                </div>
              </div>
              {/* Title */}
              <div className="poster-card-title" title={item.title}>{item.title}</div>
              <div className="poster-card-year">{item.year}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Watchlist({ watchlist, onSelectCard, onNavigateToHome }) {
  const [page, setPage] = useState('overview');

  const movies = watchlist.filter(i => i.type === 'movie');
  const series = watchlist.filter(i => i.type === 'tv');

  if (page === 'movies') {
    return <FullWatchlistPage items={movies} type="movie" onBack={() => setPage('overview')} onSelectCard={onSelectCard} />;
  }
  if (page === 'tv') {
    return <FullWatchlistPage items={series} type="tv" onBack={() => setPage('overview')} onSelectCard={onSelectCard} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 className="gradient-text-title">
          La tua <span>Watchlist</span>
        </h1>
        <p className="subtitle-desc">I film e le serie TV che hai salvato da guardare.</p>
      </div>

      {watchlist.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Film section */}
          <WatchlistSection items={movies} type="movie" onSelectCard={onSelectCard} onSeeAll={() => setPage('movies')} />

          {/* Serie TV section */}
          <WatchlistSection items={series} type="tv" onSelectCard={onSelectCard} onSeeAll={() => setPage('tv')} />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-grey)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <h3>La tua Watchlist è vuota</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '6px', marginBottom: '20px' }}>
            Non hai ancora aggiunto film o serie TV da guardare.
          </p>
          <button className="btn-primary" style={{ width: 'auto', display: 'inline-flex', padding: '10px 24px' }} onClick={onNavigateToHome}>
            Scopri Nuovi Titoli
          </button>
        </div>
      )}
    </div>
  );
}
