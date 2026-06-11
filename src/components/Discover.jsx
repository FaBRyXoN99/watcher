import React, { useState, useEffect, useRef } from 'react';
import { MOCK_MEDIA } from '../mockData';
import { CogIcon } from './icons/CogIcon';
import { SearchIcon } from './icons/SearchIcon';
import { EyeIcon } from './icons/EyeIcon';
import { BookmarkPlusIcon } from './icons/BookmarkPlusIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

// ─── TMDB helpers ─────────────────────────────────────────────────────────────
const TMDB_IMG = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : '';

async function tmdbFetch(endpoint, token) {
  const res = await fetch(`https://api.themoviedb.org/3${endpoint}`, {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

function mapTmdbItem(item) {
  const isMovie = item.media_type === 'movie' || item.title !== undefined;
  return {
    id: `${isMovie ? 'movie' : 'tv'}-${item.id}`,
    tmdbId: item.id,
    title: item.title || item.name,
    type: isMovie ? 'movie' : 'tv',
    year: (item.release_date || item.first_air_date || '').split('-')[0],
    imdbRating: item.vote_average ? item.vote_average.toFixed(1) : '0.0',
    description: item.overview || '',
    poster: TMDB_IMG(item.poster_path, 'w342'),
    backdrop: TMDB_IMG(item.backdrop_path, 'original'),
    genres: []
  };
}

// ─── Platform mini-icon for cards ─────────────────────────────────────────────
const CARD_PLATFORMS = [
  { value: 'apple',      color: '#1c1c1e', text: '#fff', abbr: 'A+',  emoji: null },
  { value: 'cinema',     color: '#b5192e', text: '#fff', abbr: null,  emoji: '🎬' },
  { value: 'crunchyroll',color: '#F47521', text: '#fff', abbr: 'CR',  emoji: null },
  { value: 'disney',     color: '#0063e5', text: '#fff', abbr: 'D+',  emoji: null },
  { value: 'netflix',    color: '#e50914', text: '#fff', abbr: 'N',   emoji: null },
  { value: 'other',      color: '#3a3a3c', text: '#fff', abbr: null,  emoji: '💿' },
  { value: 'prime',      color: '#00a8e0', text: '#fff', abbr: 'PV',  emoji: null },
  { value: 'unofficial', color: '#2c2c2e', text: '#aaa', abbr: null,  emoji: '🏴‍☠️' },
];

function CardPlatformDot({ value }) {
  const p = CARD_PLATFORMS.find(x => x.value === value) || CARD_PLATFORMS[5];
  return (
    <div style={{
      width: 18, height: 18,
      borderRadius: 5,
      background: p.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: p.emoji ? '10px' : '7px',
      fontWeight: 800,
      color: p.text,
      flexShrink: 0,
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {p.emoji || p.abbr}
    </div>
  );
}

// ─── Card Action Overlay Helper ──────────────────────────────────────────────
function CardActionsOverlay({ item, watchlist, trackedItems, onAddToWatchlist, onRemoveFromWatchlist, onSelectMedia }) {
  const loggedInfo = trackedItems?.find(i => i.id === item.id);
  const isLogged = !!loggedInfo;
  const inWatchlist = watchlist?.some(i => i.id === item.id);

  const handleWatchlistClick = (e) => {
    e.stopPropagation();
    if (inWatchlist) onRemoveFromWatchlist(item.id);
    else onAddToWatchlist(item);
  };

  const handleEyeClick = (e) => {
    e.stopPropagation();
    onSelectMedia(item);
  };

  return (
    <div className="card-actions-overlay">
      {/* If logged → show rating/platform/date bar at bottom of card */}
      {isLogged ? (
        <div className="card-watched-bar" onClick={handleEyeClick} title="Modifica log">
          <span className="cwb-stars">{'★'.repeat(Math.floor(loggedInfo.rating))}{loggedInfo.rating % 1 >= 0.5 ? '½' : ''}</span>
          <CardPlatformDot value={loggedInfo.platform} />
          {loggedInfo.watchDate && (
            <span className="cwb-date">
              {new Date(loggedInfo.watchDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
            </span>
          )}
          <svg className="cwb-edit" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
      ) : (
        /* Not logged → show the standard + and eye buttons */
        <>
          <button
            type="button"
            onClick={handleWatchlistClick}
            className={`card-action-btn ${inWatchlist ? 'active-watchlist' : ''}`}
            title={inWatchlist ? 'Rimuovi dalla Watchlist' : 'Aggiungi alla Watchlist'}
          >
            {inWatchlist ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <BookmarkPlusIcon size={16} />
            )}
          </button>
          <button
            type="button"
            onClick={handleEyeClick}
            className="card-action-btn"
            title="Segna come visto"
          >
            <EyeIcon size={16} />
          </button>
        </>
      )}
    </div>
  );
}

// ─── Fallback data ────────────────────────────────────────────────────────────
const FALLBACK_CINEMA = [
  { id: 'm-1', tmdbId: 508442, title: 'Soul', type: 'movie', year: '2020', imdbRating: '8.0', poster: 'https://image.tmdb.org/t/p/w342/hm58PHo18663gV2NyO95ZgY5g2y.jpg', backdrop: 'https://image.tmdb.org/t/p/original/kf456ZqeC45jznmrzw2nB16n43K.jpg', description: 'Un musicista jazz che ha perso la passione per la musica.', genres: ['Animazione'] },
  { id: 'm-2', tmdbId: 438631, title: 'Dune', type: 'movie', year: '2021', imdbRating: '8.0', poster: 'https://image.tmdb.org/t/p/w342/d5N051zLi7tT57W0W2ZCX6mE1Vz.jpg', backdrop: 'https://image.tmdb.org/t/p/original/jyeUNS6t3j9d6P4w6CqW6qZk8F0.jpg', description: 'Il viaggio mitico di Paul Atreides.', genres: ['Fantascienza'] },
  { id: 'm-3', tmdbId: 76600, title: "Avatar: La Via dell'Acqua", type: 'movie', year: '2022', imdbRating: '7.6', poster: 'https://image.tmdb.org/t/p/w342/t6HI23TTV5wZ7mC025ZO6GZJEZg.jpg', backdrop: 'https://image.tmdb.org/t/p/original/s16XfvZ3H8r3w2cVKczIL35dOnN.jpg', description: "Jake Sully vive una nuova avventura su Pandora.", genres: ['Fantascienza'] }
];
const FALLBACK_UPCOMING = [
  { id: 's-1', tmdbId: 66732, title: 'Stranger Things', type: 'tv', year: '2016', imdbRating: '8.7', poster: 'https://image.tmdb.org/t/p/w342/49WJ21rrlUp7JU35iL67M87wZ7u.jpg', backdrop: 'https://image.tmdb.org/t/p/original/56v2AfA62e5ty6g2zZ76uiTT2O2.jpg', description: 'Misteri soprannaturali in una piccola città.', genres: ['Horror'] },
  { id: 's-2', tmdbId: 82856, title: 'The Mandalorian', type: 'tv', year: '2019', imdbRating: '8.7', poster: 'https://image.tmdb.org/t/p/w342/e1T2Jb54oMvVEe286G4J6t4aD12.jpg', backdrop: 'https://image.tmdb.org/t/p/original/o73wR1ZzT4525jTtw4aD1mE54b8.jpg', description: 'Avventure di un cacciatore di taglie nella galassia.', genres: ['Sci-Fi'] }
];
const FALLBACK_ANIM = [
  { id: 'm-4', tmdbId: 508943, title: 'Luca', type: 'movie', year: '2021', imdbRating: '7.5', poster: 'https://image.tmdb.org/t/p/w342/jTsw4L2PMJy74phsiZv91k94mFn.jpg', backdrop: 'https://image.tmdb.org/t/p/original/6200HJZsw457ILDOjA26R1EVq4W.jpg', description: "Un giovane ragazzo vive un'estate indimenticabile.", genres: ['Animazione'] },
  { id: 'm-5', tmdbId: 508947, title: 'Turning Red', type: 'movie', year: '2022', imdbRating: '7.0', poster: 'https://image.tmdb.org/t/p/w342/f89U1wLrjfeFRPmZONeeCdTKHdQ.jpg', backdrop: 'https://image.tmdb.org/t/p/original/f89U1wLrjfeFRPmZONeeCdTKHdQ.jpg', description: 'Mei Lee affronta l\'adolescenza in modo inaspettato.', genres: ['Animazione'] }
];

// ─── Random Picker Card ───────────────────────────────────────────────────────
function RandomPickerCard({ streamingMovies, streamingTv, onSelect, tmdbToken, loading }) {
  const [movieIdx, setMovieIdx] = useState(0);
  const [tvIdx, setTvIdx] = useState(0);

  const rigenera = () => {
    if (streamingMovies.length > 1) setMovieIdx(i => (i + Math.floor(Math.random() * (streamingMovies.length - 1)) + 1) % streamingMovies.length);
    if (streamingTv.length > 1)    setTvIdx(i => (i + Math.floor(Math.random() * (streamingTv.length - 1)) + 1) % streamingTv.length);
  };

  const movie = streamingMovies[movieIdx];
  const series = streamingTv[tvIdx];

  const PosterHalf = ({ item, label, icon }) => (
    <div
      onClick={() => item && onSelect(item)}
      style={{
        flex: 1, position: 'relative', overflow: 'hidden', cursor: item ? 'pointer' : 'default',
        minHeight: 180
      }}
    >
      {/* Background poster */}
      {item?.backdrop || item?.poster ? (
        <img
          src={item.backdrop || item.poster}
          alt={item?.title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.45)' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'var(--bg-input)' }}/>
      )}
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.2) 100%)' }}/>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, padding: '16px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {/* Top label */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', borderRadius: '20px', padding: '4px 10px', width: 'fit-content', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-grey)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
          {icon} {label}
        </div>

        {/* Item info */}
        {loading ? (
          <div style={{ color: 'var(--text-grey)', fontSize: '0.85rem' }}>Caricamento…</div>
        ) : item ? (
          <div>
            {/* Poster thumbnail + title */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
              {item.poster && (
                <img
                  src={item.poster}
                  alt={item.title}
                  style={{ width: 52, borderRadius: '8px', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px', lineHeight: 1.2 }}>{item.title}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {item.year && <span style={{ fontSize: '0.72rem', color: 'var(--text-grey)' }}>{item.year}</span>}
                  {item.imdbRating !== '0.0' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-orange)', fontWeight: 600 }}>★ {item.imdbRating}</span>
                  )}
                  {item.genres?.[0] && (
                    <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.12)', borderRadius: '8px', padding: '1px 7px' }}>{item.genres[0]}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--text-grey)', fontSize: '0.82rem' }}>
            {tmdbToken ? 'Nessun titolo trovato' : 'Aggiungi token TMDB per titoli reali'}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      background: 'var(--bg-deep)', border: '1px solid var(--border-light)',
      borderRadius: 'var(--border-radius-lg)', overflow: 'hidden', marginBottom: '24px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>🎲</span>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Cosa guardare stasera?</span>
        </div>
        <button
          onClick={rigenera}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(44,242,255,0.1)', border: '1px solid rgba(44,242,255,0.3)',
            color: 'var(--accent-cyan)', borderRadius: '20px', padding: '6px 14px',
            fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition-smooth)'
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(44,242,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(44,242,255,0.1)'; }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          Rigenera
        </button>
      </div>

      {/* Two-panel body */}
      <div style={{ display: 'flex', minHeight: 180 }}>
        <PosterHalf item={movie} label="Film" icon="🎬" />
        {/* Divider */}
        <div style={{ width: '1px', background: 'var(--border-light)', flexShrink: 0 }}/>
        <PosterHalf item={series} label="Serie TV" icon="📺" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Discover({ 
  onSelectMedia, 
  tmdbToken, 
  showNotification,
  watchlist,
  trackedItems,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onNavigateToSettings
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const arrowTrendingMoviesRef = useRef(null);
  const arrowTrendingTvRef = useRef(null);
  const arrowTopRatedMoviesRef = useRef(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Home sections
  const [trendingMovies, setTrendingMovies] = useState(FALLBACK_CINEMA);
  const [trendingTv, setTrendingTv]         = useState(FALLBACK_UPCOMING);
  const [topRatedMovies, setTopRatedMovies] = useState(FALLBACK_ANIM);
  const [homeLoading, setHomeLoading]       = useState(false);

  // Pools for details fetches
  const [streamingMovies, setStreamingMovies] = useState(FALLBACK_CINEMA);
  const [streamingTv, setStreamingTv]         = useState(FALLBACK_UPCOMING);

  // ─── Load TMDB home data ──────────────────────────────────────────────────
  useEffect(() => {
    if (!tmdbToken) return;
    const load = async () => {
      setHomeLoading(true);
      try {
        const [trendMov, trendTv, topRated] = await Promise.allSettled([
          tmdbFetch('/trending/movie/week?language=it-IT', tmdbToken),
          tmdbFetch('/trending/tv/week?language=it-IT', tmdbToken),
          tmdbFetch('/movie/top_rated?language=it-IT&page=1&region=IT', tmdbToken)
        ]);

        if (trendMov.status === 'fulfilled') {
          const items = (trendMov.value.results || []).slice(0, 8).map(i => ({ ...mapTmdbItem({ ...i, media_type: 'movie' }), type: 'movie' }));
          if (items.length > 0) {
            setTrendingMovies(items);
            setStreamingMovies(items);
          }
        }

        if (trendTv.status === 'fulfilled') {
          const items = (trendTv.value.results || []).slice(0, 8).map(i => ({ ...mapTmdbItem(i), type: 'tv' }));
          if (items.length > 0) {
            setTrendingTv(items);
            setStreamingTv(items);
          }
        }

        if (topRated.status === 'fulfilled') {
          const items = (topRated.value.results || []).slice(0, 8).map(i => ({ ...mapTmdbItem({ ...i, media_type: 'movie' }), type: 'movie' }));
          if (items.length > 0) setTopRatedMovies(items);
        }

      } catch (err) {
        console.warn('Errore home TMDB:', err);
      } finally {
        setHomeLoading(false);
      }
    };
    load();
  }, [tmdbToken]);

  // ─── Search ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) { setResults([]); return; }
    const t = setTimeout(() => handleSearch(), 500);
    return () => clearTimeout(t);
  }, [searchQuery, tmdbToken]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (!tmdbToken) {
      const q = searchQuery.toLowerCase();
      setResults(MOCK_MEDIA.filter(i => i.title.toLowerCase().includes(q) || i.genres?.some(g => g.toLowerCase().includes(q))));
      return;
    }
    setLoading(true);
    try {
      const data = await tmdbFetch(`/search/multi?query=${encodeURIComponent(searchQuery)}&language=it-IT&page=1&include_adult=false`, tmdbToken);
      setResults((data.results || []).filter(i => i.media_type === 'movie' || i.media_type === 'tv').map(i => ({ ...mapTmdbItem(i), type: i.media_type })));
    } catch {
      showNotification('Errore di connessione a TMDB.', 'error');
      setResults(MOCK_MEDIA.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase())));
    } finally {
      setLoading(false);
    }
  };

  // ─── Enrich media on click ────────────────────────────────────────────────
  const handleMediaClick = async (mediaItem) => {
    if (!mediaItem.tmdbId || !tmdbToken) {
      onSelectMedia(MOCK_MEDIA.find(m => m.id === mediaItem.id) || mediaItem);
      return;
    }
    setLoading(true);
    try {
      const typePath = mediaItem.type === 'movie' ? 'movie' : 'tv';
      const [creditsRes, providersRes, detailsRes] = await Promise.allSettled([
        tmdbFetch(`/${typePath}/${mediaItem.tmdbId}/credits?language=it-IT`, tmdbToken),
        tmdbFetch(`/${typePath}/${mediaItem.tmdbId}/watch/providers`, tmdbToken),
        tmdbFetch(`/${typePath}/${mediaItem.tmdbId}?language=it-IT`, tmdbToken)
      ]);

      const castList = creditsRes.status === 'fulfilled'
        ? (creditsRes.value.cast || []).slice(0, 8).map(m => ({ name: m.name, character: m.character, avatar: TMDB_IMG(m.profile_path, 'w185') }))
        : [];

      let providersData = { flatrate: [], rent: [], buy: [], free: [], ads: [] };
      if (providersRes.status === 'fulfilled') {
        const reg = providersRes.value.results?.IT || {};
        const mp = arr => (arr || []).map(p => ({ name: p.provider_name, logo: TMDB_IMG(p.logo_path, 'original'), id: p.provider_id }));
        providersData = { flatrate: mp(reg.flatrate), rent: mp(reg.rent), buy: mp(reg.buy), free: mp(reg.free), ads: mp(reg.ads), link: reg.link || '' };
      }

      let duration = '', genres = [], seasons = [];
      if (detailsRes.status === 'fulfilled') {
        const d = detailsRes.value;
        genres = (d.genres || []).map(g => g.name);
        if (mediaItem.type === 'movie' && d.runtime) {
          duration = `${Math.floor(d.runtime / 60)}h ${d.runtime % 60}m`;
        } else if (mediaItem.type === 'tv') {
          const ns = d.number_of_seasons || 1;
          duration = `${ns} Stagion${ns > 1 ? 'i' : 'e'}`;
          seasons = Array.from({ length: ns }, (_, i) => ({ number: i + 1, name: `Stagione ${i + 1}` }));
        }
      }

      onSelectMedia({ ...mediaItem, cast: castList, providers: providersData, duration: duration || 'N/D', genres: genres.length > 0 ? genres : mediaItem.genres || ['Generico'], seasons });
    } catch {
      showNotification('Errore nel caricamento dettagli.', 'error');
      onSelectMedia(mediaItem);
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '10px', position: 'relative' }}>
        <button 
          onClick={onNavigateToSettings} 
          style={{ 
            background: 'var(--bg-deep)', 
            border: '1px solid var(--border-light)', 
            borderRadius: '50%', 
            width: '42px', 
            height: '42px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer', 
            color: 'var(--text-white)',
            transition: 'var(--transition-smooth)',
            flexShrink: 0
          }}
          title="Impostazioni"
        >
          <CogIcon size={20} />
        </button>
        
        <h1 style={{ 
          position: 'absolute', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          fontSize: '1.35rem', 
          fontWeight: 700, 
          margin: 0, 
          letterSpacing: '-0.3px', 
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 1
        }}>Watcher</h1>
        
        <div className={`search-capsule ${isSearchFocused || searchQuery ? 'active' : ''}`}
          style={{ 
            height: '42px', 
            borderRadius: '21px', 
            padding: '0 12px',
            maxWidth: (isSearchFocused || searchQuery) ? '240px' : '110px',
            flex: (isSearchFocused || searchQuery) ? '1' : '0 0 auto',
            transition: 'var(--transition-smooth)',
            marginLeft: 'auto',
            zIndex: 2
          }}>
          <SearchIcon size={16} style={{ flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Cerca..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={{ fontSize: '0.85rem', background: 'none', border: 'none', outline: 'none', color: 'var(--text-white)', width: '100%' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', color: 'var(--text-grey)', cursor: 'pointer', padding: '0 2px', fontSize: '0.9rem', flexShrink: 0 }}>✕</button>
          )}
        </div>
      </div>

      {/* Loading */}
      {(loading || homeLoading) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0 20px', color: 'var(--accent-cyan)', fontSize: '0.88rem' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          Caricamento da TMDB…
        </div>
      )}

      {/* Search results */}
      {searchQuery.trim() !== '' ? (
        <div>
          <h2 className="section-title">Risultati della ricerca</h2>
          {results.length > 0 ? (
            <div className="media-grid" style={{ marginTop: '16px' }}>
              {results.map(item => (
                <div className="media-card" key={item.id} onClick={() => handleMediaClick(item)}>
                  <div className="card-image-container">
                    {item.poster
                      ? <img src={item.poster} alt={item.title} className="card-image" onError={e => { e.target.style.opacity = '0.2'; }}/>
                      : <div className="card-image" style={{ background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎬</div>
                    }
                    <CardActionsOverlay 
                      item={item}
                      watchlist={watchlist}
                      trackedItems={trackedItems}
                      onAddToWatchlist={onAddToWatchlist}
                      onRemoveFromWatchlist={onRemoveFromWatchlist}
                      onSelectMedia={handleMediaClick}
                    />
                    <div className="rating-pill"><span>★ {item.imdbRating}</span></div>
                  </div>
                  <div className="card-info">
                    <div className="card-title" title={item.title}>{item.title}</div>
                    <div className="card-meta">
                      <span>{item.type === 'movie' ? 'Film' : 'Serie TV'}</span>
                      <span>{item.year}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && <p style={{ color: 'var(--text-grey)', padding: '20px 0' }}>Nessun risultato trovato.</p>
          )}
        </div>
      ) : (
        /* Home content */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 🎲 Cosa guardare stasera? */}
          <RandomPickerCard
            streamingMovies={streamingMovies}
            streamingTv={streamingTv}
            onSelect={handleMediaClick}
            tmdbToken={tmdbToken}
            loading={homeLoading}
          />

          {/* Trending Movies */}
          {trendingMovies.length > 0 && (
            <div className="slider-section">
              <h2 
                className="section-title" 
                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', fontSize: '1.15rem', fontWeight: 600, marginBottom: '14px' }}
                onMouseEnter={() => arrowTrendingMoviesRef.current?.startAnimation()}
                onMouseLeave={() => arrowTrendingMoviesRef.current?.stopAnimation()}
              >
                Trending Movies
                <ArrowRightIcon ref={arrowTrendingMoviesRef} size={18} style={{ marginLeft: '6px', color: 'var(--text-grey)' }} />
              </h2>
              <div className="slider-container">
                {trendingMovies.map(item => (
                  <div key={item.id} className="poster-slider-card" onClick={() => handleMediaClick(item)}>
                    <div className="poster-slider-img-wrapper">
                      {item.poster
                        ? <img src={item.poster} alt={item.title} onError={e => { e.target.style.opacity = '0.2'; }}/>
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎬</div>
                      }
                      <CardActionsOverlay 
                        item={item}
                        watchlist={watchlist}
                        trackedItems={trackedItems}
                        onAddToWatchlist={onAddToWatchlist}
                        onRemoveFromWatchlist={onRemoveFromWatchlist}
                        onSelectMedia={handleMediaClick}
                      />
                    </div>
                    <div className="poster-card-title">{item.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending TV Shows */}
          {trendingTv.length > 0 && (
            <div className="slider-section">
              <h2 
                className="section-title" 
                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', fontSize: '1.15rem', fontWeight: 600, marginBottom: '14px' }}
                onMouseEnter={() => arrowTrendingTvRef.current?.startAnimation()}
                onMouseLeave={() => arrowTrendingTvRef.current?.stopAnimation()}
              >
                Trending TV Shows
                <ArrowRightIcon ref={arrowTrendingTvRef} size={18} style={{ marginLeft: '6px', color: 'var(--text-grey)' }} />
              </h2>
              <div className="slider-container">
                {trendingTv.map(item => (
                  <div key={item.id} className="poster-slider-card" onClick={() => handleMediaClick(item)}>
                    <div className="poster-slider-img-wrapper">
                      {item.poster
                        ? <img src={item.poster} alt={item.title} onError={e => { e.target.style.opacity = '0.2'; }}/>
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>📺</div>
                      }
                      <CardActionsOverlay 
                        item={item}
                        watchlist={watchlist}
                        trackedItems={trackedItems}
                        onAddToWatchlist={onAddToWatchlist}
                        onRemoveFromWatchlist={onRemoveFromWatchlist}
                        onSelectMedia={handleMediaClick}
                      />
                    </div>
                    <div className="poster-card-title">{item.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Rated Movies */}
          {topRatedMovies.length > 0 && (
            <div className="slider-section">
              <h2 
                className="section-title" 
                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', fontSize: '1.15rem', fontWeight: 600, marginBottom: '14px' }}
                onMouseEnter={() => arrowTopRatedMoviesRef.current?.startAnimation()}
                onMouseLeave={() => arrowTopRatedMoviesRef.current?.stopAnimation()}
              >
                Top Rated Movies
                <ArrowRightIcon ref={arrowTopRatedMoviesRef} size={18} style={{ marginLeft: '6px', color: 'var(--text-grey)' }} />
              </h2>
              <div className="slider-container">
                {topRatedMovies.map(item => (
                  <div key={item.id} className="poster-slider-card" onClick={() => handleMediaClick(item)}>
                    <div className="poster-slider-img-wrapper">
                      {item.poster
                        ? <img src={item.poster} alt={item.title} onError={e => { e.target.style.opacity = '0.2'; }}/>
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎬</div>
                      }
                      <CardActionsOverlay 
                        item={item}
                        watchlist={watchlist}
                        trackedItems={trackedItems}
                        onAddToWatchlist={onAddToWatchlist}
                        onRemoveFromWatchlist={onRemoveFromWatchlist}
                        onSelectMedia={handleMediaClick}
                      />
                    </div>
                    <div className="poster-card-title">{item.title}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
