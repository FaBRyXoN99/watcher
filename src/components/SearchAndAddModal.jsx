import React, { useState, useEffect, useRef } from 'react';

export default function SearchAndAddModal({ tmdbToken, onClose, onAddMedia }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    if (!query.trim() || !tmdbToken) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&language=it-IT&page=1`, {
          headers: { Authorization: `Bearer ${tmdbToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Filter out people, we only want movies and tv shows
          const filtered = (data.results || []).filter(i => i.media_type === 'movie' || i.media_type === 'tv');
          
          const processed = filtered.map(item => ({
            id: `${item.media_type}-${item.id}`,
            tmdbId: item.id,
            title: item.title || item.name,
            type: item.media_type,
            year: (item.release_date || item.first_air_date || '').split('-')[0],
            imdbRating: item.vote_average ? item.vote_average.toFixed(1) : null,
            poster: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            description: item.overview,
            popularity: item.popularity || 0
          }));
          
          setResults(processed);
        }
      } catch (err) {
        console.error("Errore ricerca TMDB", err);
      }
      setLoading(false);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(searchTimeoutRef.current);
  }, [query, tmdbToken]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 100 }}>
      <div className="modal-content" style={{ maxWidth: '500px', height: '80vh', display: 'flex', flexDirection: 'column', padding: '24px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        
        <div style={{ marginTop: '12px', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '20px', borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '10px' }}>
            Aggiungi alla lista
          </h2>
          {!tmdbToken && (
            <div style={{ padding: '12px', background: 'rgba(255,165,0,0.1)', color: 'var(--accent-orange)', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
              ⚠️ È necessario inserire il Token TMDB nelle Impostazioni per poter cercare.
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-grey)' }}>🔍</span>
            <input 
              className="custom-input" 
              type="text" 
              placeholder="Cerca film o serie tv..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
              disabled={!tmdbToken}
              autoFocus
            />
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', marginTop: '16px', paddingRight: '4px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-grey)' }}>Ricerca in corso...</div>
          ) : results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.map(item => (
                <div 
                  key={item.id}
                  onClick={() => onAddMedia(item)}
                  style={{ 
                    display: 'flex', gap: '12px', padding: '10px', 
                    background: 'var(--bg-input)', borderRadius: '12px',
                    cursor: 'pointer', transition: 'var(--transition-smooth)',
                    border: '1px solid transparent'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(44,242,255,0.1)'; e.currentTarget.style.borderColor = 'var(--accent-cyan)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-input)'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <img 
                    src={item.poster || 'https://via.placeholder.com/100x150?text=No+Poster'} 
                    alt={item.title}
                    style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '6px' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-grey)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ background: 'var(--bg-dark)', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.type === 'movie' ? '🎬 Film' : '📺 Serie TV'}
                      </span>
                      {item.year && <span>{item.year}</span>}
                      {item.imdbRating && <span>★ {item.imdbRating}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-grey)' }}>Nessun risultato trovato per "{query}"</div>
          ) : (
             <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-grey)', fontSize: '0.9rem' }}>
                Cerca un titolo per aggiungerlo alla tua lista
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
