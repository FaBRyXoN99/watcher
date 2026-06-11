import React, { useState, useEffect, useRef } from 'react';
import { BookmarkPlusIcon } from './icons/BookmarkPlusIcon';
import { EyeIcon } from './icons/EyeIcon';

// ── Platform registry ─────────────────────────────────────────────────────────
export const PLATFORMS = [
  { value: 'apple',      label: 'Apple TV+',      color: '#1c1c1e', text: '#fff', abbr: 'A+',  emoji: null },
  { value: 'cinema',     label: 'Cinema',          color: '#b5192e', text: '#fff', abbr: null,  emoji: '🎬' },
  { value: 'crunchyroll',label: 'Crunchyroll',     color: '#F47521', text: '#fff', abbr: 'CR',  emoji: null },
  { value: 'disney',     label: 'Disney+',         color: '#0063e5', text: '#fff', abbr: 'D+',  emoji: null },
  { value: 'netflix',    label: 'Netflix',         color: '#e50914', text: '#fff', abbr: 'N',   emoji: null },
  { value: 'other',      label: 'Fisico / Altro',  color: '#3a3a3c', text: '#fff', abbr: null,  emoji: '💿' },
  { value: 'prime',      label: 'Prime Video',     color: '#00a8e0', text: '#fff', abbr: 'PV',  emoji: null },
  { value: 'unofficial', label: 'Non Ufficiale',   color: '#2c2c2e', text: '#aaa', abbr: null,  emoji: '🏴‍☠️' },
];

function PlatformIcon({ value, size = 36 }) {
  const p = PLATFORMS.find(x => x.value === value) || PLATFORMS[5];
  return (
    <div style={{
      width: size, height: size, borderRadius: '10px', background: p.color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      fontSize: p.emoji ? (size * 0.45) + 'px' : (size * 0.32) + 'px',
      fontWeight: 800, color: p.text, letterSpacing: '-0.5px',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {p.emoji || p.abbr}
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatLongDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch { return dateStr; }
}

// ── Info row inside the "Informazioni" card ───────────────────────────────────
function InfoRow({ icon, value, label, noBorder }) {
  if (!value) return null;
  return (
    <div className="info-row" style={{ borderBottom: noBorder ? 'none' : undefined }}>
      <div className="info-row-icon">{icon}</div>
      <div className="info-row-text">
        <span className="info-row-value">{value}</span>
        <span className="info-row-label">{label}</span>
      </div>
    </div>
  );
}

// SVG icons used in the info card
const IconMic = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);
const IconFilm = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
    <line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/>
    <line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/>
    <line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/>
    <line x1="17" y1="7" x2="22" y2="7"/>
  </svg>
);
const IconMusic = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconPin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const IconStar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconPlay = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="white" stroke="none">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);

// ── Log Popup ─────────────────────────────────────────────────────────────────
function LogPopup({ item, loggedInfo, onSave, onRemove, onClose }) {
  const [rating, setRating] = useState(loggedInfo?.rating ?? 4.0);
  const [hoverRating, setHoverRating] = useState(null);
  const [platform, setPlatform] = useState(loggedInfo?.platform ?? 'netflix');
  const [watchDate, setWatchDate] = useState(
    loggedInfo?.watchDate ?? new Date().toISOString().split('T')[0]
  );

  const activeRating = hoverRating !== null ? hoverRating : rating;
  const getStarClass = (index, cur) => {
    if (cur >= index) return 'star-interactive filled';
    if (cur === index - 0.5) return 'star-interactive half-filled';
    return 'star-interactive';
  };

  const handleSave = () => {
    onSave({ id: item.id, title: item.title, type: item.type, poster: item.poster, backdrop: item.backdrop, tmdbId: item.tmdbId, year: item.year, genres: item.genres, duration: item.duration, rating, platform, watchDate, notes: '' });
    onClose();
  };

  return (
    <div className="lp-overlay" onClick={onClose}>
      <div className="lp-card" onClick={e => e.stopPropagation()}>
        <div className="lp-header">
          <span className="lp-title">{loggedInfo ? 'Modifica Log' : 'Segna come Visto'}</span>
          <button className="lp-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="lp-section">
          <div className="lp-label">Il tuo voto</div>
          <div className="lp-stars">
            {[1,2,3,4,5].map(index => (
              <span key={index} style={{ position: 'relative', display: 'inline-block', fontSize: '2.4rem', userSelect: 'none' }}>
                <span style={{ position:'absolute', left:0, top:0, width:'50%', height:'100%', zIndex:10, cursor:'pointer' }}
                  onClick={() => setRating(index-0.5)} onMouseEnter={() => setHoverRating(index-0.5)} onMouseLeave={() => setHoverRating(null)}/>
                <span style={{ position:'absolute', right:0, top:0, width:'50%', height:'100%', zIndex:10, cursor:'pointer' }}
                  onClick={() => setRating(index)} onMouseEnter={() => setHoverRating(index)} onMouseLeave={() => setHoverRating(null)}/>
                <span className={getStarClass(index, activeRating)}>★</span>
              </span>
            ))}
            <span className="lp-rating-val">{activeRating.toFixed(1)}</span>
          </div>
        </div>
        <div className="lp-section">
          <div className="lp-label">Piattaforma</div>
          <div className="lp-platforms">
            {PLATFORMS.map(p => (
              <button key={p.value} className={`lp-platform-btn ${platform === p.value ? 'lp-platform-active' : ''}`}
                onClick={() => setPlatform(p.value)} title={p.label}>
                <PlatformIcon value={p.value} size={44}/>
                <span className="lp-platform-name">{p.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="lp-section">
          <div className="lp-label">Data di visione</div>
          <input type="date" className="lp-date-input" value={watchDate} onChange={e => setWatchDate(e.target.value)}/>
        </div>
        <div className="lp-actions">
          <button className="lp-save-btn" onClick={handleSave}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
            {loggedInfo ? 'Aggiorna' : 'Salva'}
          </button>
          {loggedInfo && (
            <button className="lp-remove-btn" onClick={() => { onRemove(item.id); onClose(); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Rimuovi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TMDB mapper for similar items ─────────────────────────────────────────────
function mapSimilar(raw, type) {
  return {
    id: `${type}-${raw.id}`,
    tmdbId: raw.id,
    title: raw.title || raw.name || '—',
    type,
    year: (raw.release_date || raw.first_air_date || '').split('-')[0],
    imdbRating: raw.vote_average ? raw.vote_average.toFixed(1) : '0.0',
    description: raw.overview || '',
    poster: raw.poster_path ? `https://image.tmdb.org/t/p/w342${raw.poster_path}` : '',
    backdrop: raw.backdrop_path ? `https://image.tmdb.org/t/p/original${raw.backdrop_path}` : '',
    genres: [],
  };
}

// ── Main DetailsModal ─────────────────────────────────────────────────────────
export default function DetailsModal({
  item, onClose, onSave, onRemove, loggedInfo,
  inWatchlist, onAddToWatchlist, onRemoveFromWatchlist,
  onSelectMedia, tmdbToken
}) {
  const [showLogPopup, setShowLogPopup] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(1);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const [seasonsList, setSeasonsList] = useState([]);
  const [episodesList, setEpisodesList] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  // Confirmpopups
  const [pendingEpisodeAction, setPendingEpisodeAction] = useState(null); // { seasonNum, epNum }
  const [pendingSeasonAction, setPendingSeasonAction] = useState(null); // { targetSeasonNum, onlySwitch }

  // Dynamic data
  const [dynamicProviders, setDynamicProviders] = useState(item?.providers ?? null);
  const [dynamicCast, setDynamicCast] = useState(item?.cast ?? null);
  const [trailer, setTrailer] = useState(null);
  const [movieInfo, setMovieInfo] = useState(null); // { director, studio, composer, releaseDate, country, tmdbRating }
  const [similarItems, setSimilarItems] = useState([]);

  const getFallbackSeasons = () => {
    let count = 3;
    if (item?.duration?.includes('Stagion')) {
      count = parseInt(item.duration.replace(/\D/g, '')) || 3;
    }
    return Array.from({ length: count }, (_, i) => ({
      season_number: i + 1,
      name: `Stagione ${i + 1}`,
      episode_count: 8,
    }));
  };

  useEffect(() => {
    setDynamicProviders(item?.providers ?? null);
    setDynamicCast(item?.cast ?? null);
    setTrailer(null);
    setMovieInfo(null);
    setSimilarItems([]);
    setDescExpanded(false);
    setShowLogPopup(false);
    setSelectedSeasonNumber(1);
    setSeasonsList(getFallbackSeasons());
  }, [item]);

  useEffect(() => {
    if (!tmdbToken || !item?.tmdbId) return;
    let mounted = true;

    const fetchAll = async () => {
      try {
        const type = item.type === 'movie' ? 'movie' : 'tv';
        const H = { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' };
        const get = url => fetch(url, { headers: H }).then(r => r.ok ? r.json() : null).catch(() => null);

        const [providersData, creditsData, detailsData, videosData, similarData] = await Promise.all([
          !item.providers ? get(`https://api.themoviedb.org/3/${type}/${item.tmdbId}/watch/providers`) : Promise.resolve(null),
          !item.cast      ? get(`https://api.themoviedb.org/3/${type}/${item.tmdbId}/credits?language=it-IT`) : Promise.resolve(null),
          get(`https://api.themoviedb.org/3/${type}/${item.tmdbId}?language=it-IT`),
          get(`https://api.themoviedb.org/3/${type}/${item.tmdbId}/videos?language=it-IT`),
          get(`https://api.themoviedb.org/3/${type}/${item.tmdbId}/similar?language=it-IT&page=1`),
        ]);

        if (!mounted) return;

        // Providers
        if (providersData) {
          const reg = providersData.results?.IT || {};
          const mp = arr => (arr || []).map(p => ({ name: p.provider_name, logo: p.logo_path ? `https://image.tmdb.org/t/p/original${p.logo_path}` : '❓' }));
          setDynamicProviders({ flatrate: mp(reg.flatrate), rent: mp(reg.rent), buy: mp(reg.buy), free: mp(reg.free), ads: mp(reg.ads), link: reg.link || '' });
        }

        // Cast + crew
        if (creditsData) {
          setDynamicCast((creditsData.cast || []).slice(0, 12).map(c => ({
            name: c.name, character: c.character,
            avatar: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : ''
          })));
          const crew = creditsData.crew || [];
          const director = crew.find(c => c.job === 'Director')?.name || crew.find(c => c.department === 'Directing')?.name;
          const composer = crew.find(c => c.job === 'Original Music Composer')?.name || crew.find(c => c.department === 'Sound')?.name;
          setMovieInfo(prev => ({ ...prev, director, composer }));
        }

        // Full details
        if (detailsData) {
          const studios = (detailsData.production_companies || []).map(c => c.name).join(', ');
          const countries = (detailsData.production_countries || detailsData.origin_country || [])
            .map(c => typeof c === 'string' ? c : c.name).join(', ');
          setMovieInfo(prev => ({
            ...prev,
            studio: studios || null,
            releaseDate: detailsData.release_date || detailsData.first_air_date || null,
            country: countries || null,
            tmdbRating: detailsData.vote_average ? detailsData.vote_average.toFixed(1) : null,
            runtime: detailsData.runtime || null,
          }));

          if (item.type === 'tv' && detailsData.seasons && detailsData.seasons.length > 0) {
            const regularSeasons = detailsData.seasons.filter(s => s.season_number > 0);
            setSeasonsList(regularSeasons);
          }
        }

        // Trailer: prefer Italian, then English, find first YouTube Official Trailer
        if (videosData?.results) {
          const vids = videosData.results;
          const pick = vids.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
            || vids.find(v => v.site === 'YouTube' && v.type === 'Trailer')
            || vids.find(v => v.site === 'YouTube');
          if (pick) setTrailer({ key: pick.key, name: pick.name });
        }

        // Similar
        if (similarData?.results) {
          const items = (similarData.results || []).filter(r => r.poster_path).slice(0, 10).map(r => mapSimilar(r, item.type));
          setSimilarItems(items);
        }

      } catch (err) { console.error('DetailsModal fetch error:', err); }
    };

    fetchAll();
    return () => { mounted = false; };
  }, [item, tmdbToken]);

  // Load episodes of the selected season
  useEffect(() => {
    if (item.type !== 'tv') return;

    const generateMockEpisodes = (seasonNum) => {
      const sDetail = seasonsList.find(s => s.season_number === seasonNum);
      const epCount = sDetail ? sDetail.episode_count : 8;

      return Array.from({ length: epCount }, (_, i) => ({
        id: `mock-${item.id}-${seasonNum}-${i + 1}`,
        name: `Episodio ${i + 1}`,
        episode_number: i + 1,
        still_path: null,
        runtime: 45,
        season_number: seasonNum
      }));
    };

    if (!tmdbToken || !item.tmdbId) {
      setEpisodesList(generateMockEpisodes(selectedSeasonNumber));
      return;
    }

    let mounted = true;
    const fetchEpisodes = async () => {
      setLoadingEpisodes(true);
      try {
        const H = { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' };
        const res = await fetch(
          `https://api.themoviedb.org/3/tv/${item.tmdbId}/season/${selectedSeasonNumber}?language=it-IT`,
          { headers: H }
        );
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.episodes) {
            setEpisodesList(data.episodes.map(ep => ({
              id: ep.id,
              name: ep.name || `Episodio ${ep.episode_number}`,
              episode_number: ep.episode_number,
              still_path: ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : null,
              runtime: ep.runtime || 45,
              season_number: selectedSeasonNumber
            })));
          }
        } else {
          if (mounted) setEpisodesList(generateMockEpisodes(selectedSeasonNumber));
        }
      } catch (err) {
        console.error("Error fetching episodes:", err);
        if (mounted) setEpisodesList(generateMockEpisodes(selectedSeasonNumber));
      } finally {
        if (mounted) setLoadingEpisodes(false);
      }
    };

    fetchEpisodes();
    return () => { mounted = false; };
  }, [item.id, item.tmdbId, selectedSeasonNumber, tmdbToken, seasonsList]);

  // Episode & Season watched logic helpers
  const isSeasonFullyWatched = (seasonNum) => {
    const sDetail = seasonsList.find(s => s.season_number === seasonNum);
    if (!sDetail) return false;
    const watched = loggedInfo?.watchedEpisodes?.[seasonNum] || [];
    return watched.length >= sDetail.episode_count;
  };

  const markSeasonAsWatched = (seasonNum, currentWatchedMap = null) => {
    const currentWatched = currentWatchedMap ? { ...currentWatchedMap } : { ...(loggedInfo?.watchedEpisodes || {}) };
    const sDetail = seasonsList.find(s => s.season_number === seasonNum);
    const epCount = sDetail ? sDetail.episode_count : 8;

    currentWatched[seasonNum] = Array.from({ length: epCount }, (_, i) => i + 1);
    saveWatchedState(currentWatched);
  };

  const saveWatchedState = (watchedEpisodesMap) => {
    const logData = {
      id: item.id,
      title: item.title,
      type: item.type,
      poster: item.poster,
      backdrop: item.backdrop,
      tmdbId: item.tmdbId,
      year: item.year,
      genres: item.genres,
      duration: item.duration,
      rating: loggedInfo?.rating ?? 4.0,
      platform: loggedInfo?.platform ?? 'netflix',
      watchDate: loggedInfo?.watchDate ?? new Date().toISOString().split('T')[0],
      notes: loggedInfo?.notes ?? '',
      watchedEpisodes: watchedEpisodesMap
    };
    onSave(logData);
  };

  const handleSeasonSelect = (targetSeasonNum) => {
    setIsSeasonDropdownOpen(false);
    setSelectedSeasonNumber(targetSeasonNum);
  };

  const handleToggleSeasonWatched = (seasonNum) => {
    const isFully = isSeasonFullyWatched(seasonNum);

    if (isFully) {
      const currentWatched = { ...(loggedInfo?.watchedEpisodes || {}) };
      currentWatched[seasonNum] = [];
      saveWatchedState(currentWatched);
    } else {
      let hasUnwatchedPrevious = false;
      for (let s = 1; s < seasonNum; s++) {
        if (!isSeasonFullyWatched(s)) {
          hasUnwatchedPrevious = true;
          break;
        }
      }

      if (hasUnwatchedPrevious) {
        setPendingSeasonAction({ targetSeasonNum: seasonNum, onlySwitch: false });
      } else {
        markSeasonAsWatched(seasonNum);
      }
    }
  };

  const confirmSeasonAction = (confirmed) => {
    if (!pendingSeasonAction) return;
    const { targetSeasonNum, onlySwitch } = pendingSeasonAction;

    const currentWatched = { ...(loggedInfo?.watchedEpisodes || {}) };
    if (confirmed) {
      for (let s = 1; s < targetSeasonNum; s++) {
        const sDetail = seasonsList.find(x => x.season_number === s);
        const epCount = sDetail ? sDetail.episode_count : 8;
        currentWatched[s] = Array.from({ length: epCount }, (_, i) => i + 1);
      }

      if (onlySwitch) {
        setSelectedSeasonNumber(targetSeasonNum);
        saveWatchedState(currentWatched);
      } else {
        const targetDetail = seasonsList.find(x => x.season_number === targetSeasonNum);
        const epCount = targetDetail ? targetDetail.episode_count : 8;
        currentWatched[targetSeasonNum] = Array.from({ length: epCount }, (_, i) => i + 1);
        setSelectedSeasonNumber(targetSeasonNum);
        saveWatchedState(currentWatched);
      }
    } else {
      if (onlySwitch) {
        setSelectedSeasonNumber(targetSeasonNum);
      } else {
        const targetDetail = seasonsList.find(x => x.season_number === targetSeasonNum);
        const epCount = targetDetail ? targetDetail.episode_count : 8;
        currentWatched[targetSeasonNum] = Array.from({ length: epCount }, (_, i) => i + 1);
        saveWatchedState(currentWatched);
      }
    }
    setPendingSeasonAction(null);
  };

  const handleEpisodeClick = (seasonNum, epNum) => {
    const watchedEpisodes = loggedInfo?.watchedEpisodes || {};
    const isCurrentlyWatched = watchedEpisodes[seasonNum]?.includes(epNum) ?? false;

    if (isCurrentlyWatched) {
      const currentWatched = { ...watchedEpisodes };
      currentWatched[seasonNum] = (currentWatched[seasonNum] || []).filter(ep => ep !== epNum);
      saveWatchedState(currentWatched);
    } else {
      let hasUnwatchedPrevious = false;
      for (let ep = 1; ep < epNum; ep++) {
        if (!(watchedEpisodes[seasonNum] || []).includes(ep)) {
          hasUnwatchedPrevious = true;
          break;
        }
      }

      if (hasUnwatchedPrevious) {
        setPendingEpisodeAction({ seasonNum, epNum });
      } else {
        const currentWatched = { ...watchedEpisodes };
        if (!currentWatched[seasonNum]) currentWatched[seasonNum] = [];
        currentWatched[seasonNum] = [...currentWatched[seasonNum], epNum].sort((a, b) => a - b);
        saveWatchedState(currentWatched);
      }
    }
  };

  const confirmEpisodeAction = (confirmed) => {
    if (!pendingEpisodeAction) return;
    const { seasonNum, epNum } = pendingEpisodeAction;

    const currentWatched = { ...(loggedInfo?.watchedEpisodes || {}) };
    if (!currentWatched[seasonNum]) {
      currentWatched[seasonNum] = [];
    }

    const updated = new Set(currentWatched[seasonNum]);
    if (confirmed) {
      for (let ep = 1; ep <= epNum; ep++) {
        updated.add(ep);
      }
    } else {
      updated.add(epNum);
    }
    currentWatched[seasonNum] = Array.from(updated).sort((a, b) => a - b);

    saveWatchedState(currentWatched);
    setPendingEpisodeAction(null);
  };

  if (!item) return null;

  // Providers
  const streamProviders = [...(dynamicProviders?.flatrate || []), ...(dynamicProviders?.ads || []), ...(dynamicProviders?.free || [])];
  const rentProviders = [...(dynamicProviders?.rent || []), ...(dynamicProviders?.buy || [])];

  // Genre
  const genreStr = item.genres?.length > 0 ? (Array.isArray(item.genres) ? item.genres[0] : item.genres) : (item.type === 'movie' ? 'Film' : 'Serie TV');

  // Description
  const DESC_LIMIT = 160;
  const desc = item.description || '';
  const isTruncated = desc.length > DESC_LIMIT;
  const displayedDesc = (!isTruncated || descExpanded) ? desc : desc.slice(0, DESC_LIMIT) + '…';



  // Info rows data
  const infoRows = [
    movieInfo?.director   && { icon: <IconMic/>,      value: movieInfo.director,   label: 'Regista'            },
    movieInfo?.studio     && { icon: <IconFilm/>,     value: movieInfo.studio,     label: 'Studio'             },
    movieInfo?.composer   && { icon: <IconMusic/>,    value: movieInfo.composer,   label: 'Compositore'        },
    movieInfo?.releaseDate && { icon: <IconCalendar/>, value: formatLongDate(movieInfo.releaseDate), label: 'Data di uscita' },
    movieInfo?.country    && { icon: <IconGlobe/>,    value: movieInfo.country,    label: 'Paese di origine'   },
    movieInfo?.tmdbRating && { icon: <IconStar/>,     value: movieInfo.tmdbRating, label: 'Valutazione TMDB'   },
  ].filter(Boolean);

  return (
    <>
      <div className="dm-overlay" onClick={onClose}>
        <div className="dm-sheet" onClick={e => e.stopPropagation()}>

          {/* ── HERO ── */}
          <div className="dm-hero">
            {(item.backdrop || item.poster) && (
              <img src={item.backdrop || item.poster} alt={item.title} className="dm-hero-img"/>
            )}
            <div className="dm-hero-gradient"/>
            <button className="dm-back-btn" onClick={onClose} aria-label="Indietro">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <div className="dm-hero-meta">
              <h1 className="dm-title">{item.title}</h1>
              <p className="dm-subtitle">
                {item.year}{item.duration && ` · ${item.duration}`}{genreStr && ` · ${genreStr}`}
              </p>
            </div>
          </div>

          {/* ── BODY ── */}
          <div className="dm-body">

            {/* Action buttons */}
            <div className="dm-actions-row">
              {inWatchlist ? (
                <button className="dm-add-btn dm-add-btn-active" onClick={() => onRemoveFromWatchlist(item.id)}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                  Aggiunto
                </button>
              ) : (
                <button className="dm-add-btn" onClick={() => onAddToWatchlist(item)}>
                  <BookmarkPlusIcon size={15} />
                  Aggiungi
                </button>
              )}
              <button className={`dm-eye-btn ${loggedInfo ? 'dm-eye-btn-active' : ''}`}
                onClick={() => setShowLogPopup(true)} title={loggedInfo ? 'Visto · modifica' : 'Segna come visto'}>
                <EyeIcon size={18} />
              </button>
            </div>

            {/* Watched info bar */}
            {loggedInfo && (
              <button className="dm-watched-bar" onClick={() => setShowLogPopup(true)} title="Modifica log">
                <span className="dm-wb-stars">
                  {'★'.repeat(Math.floor(loggedInfo.rating))}{loggedInfo.rating % 1 >= 0.5 ? '½' : ''}
                  <span className="dm-wb-rating-num">{loggedInfo.rating.toFixed(1)}</span>
                </span>
                <span className="dm-wb-divider"/>
                <PlatformIcon value={loggedInfo.platform} size={26}/>
                <span className="dm-wb-platform-name">{PLATFORMS.find(p => p.value === loggedInfo.platform)?.label || loggedInfo.platform}</span>
                <span className="dm-wb-divider"/>
                <span className="dm-wb-date">{formatDate(loggedInfo.watchDate)}</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: 'auto', opacity: 0.5 }}>
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            )}

            {/* Description */}
            {desc && (
              <section className="dm-section">
                <p className="dm-description">{displayedDesc}</p>
                {isTruncated && (
                  <button className="dm-show-more-btn" onClick={() => setDescExpanded(x => !x)}>
                    {descExpanded ? 'Mostra meno' : 'Mostra altro'}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      {descExpanded ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                    </svg>
                  </button>
                )}
              </section>
            )}

            {/* TV Stagioni ed Episodi */}
            {item.type === 'tv' && seasonsList.length > 0 && (
              <section className="dm-section">
                <div className="dm-season-header-row">
                  <h2 className="dm-section-title" style={{ margin: 0 }}>Stagioni</h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div className="dm-season-select-wrapper">
                      <button type="button" className="dm-season-dropdown-btn" onClick={() => setIsSeasonDropdownOpen(!isSeasonDropdownOpen)}>
                        {seasonsList.find(s => s.season_number === selectedSeasonNumber)?.name || `Stagione ${selectedSeasonNumber}`}
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px', marginLeft: '4px' }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </button>
                      {isSeasonDropdownOpen && (
                        <div className="dropdown-menu" style={{ right: 0, left: 'auto' }}>
                          {seasonsList.map(s => {
                            const isSel = selectedSeasonNumber === s.season_number;
                            return (
                              <button key={s.season_number} type="button" className={`dropdown-item ${isSel ? 'active' : ''}`}
                                onClick={() => handleSeasonSelect(s.season_number)}>
                                {s.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      className={`dm-season-watched-btn ${isSeasonFullyWatched(selectedSeasonNumber) ? 'active' : ''}`}
                      onClick={() => handleToggleSeasonWatched(selectedSeasonNumber)}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '6px' }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Visto
                    </button>
                  </div>
                </div>

                {loadingEpisodes ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0', color: 'var(--text-grey)', fontSize: '0.9rem' }}>
                    Caricamento episodi...
                  </div>
                ) : (
                  <div className="tv-episodes-grid">
                    {episodesList.map(ep => {
                      const watched = loggedInfo?.watchedEpisodes?.[selectedSeasonNumber]?.includes(ep.episode_number) ?? false;
                      const fallbackImg = item.backdrop || item.poster || '';
                      return (
                        <div key={ep.id} className="tv-episode-card" onClick={() => handleEpisodeClick(selectedSeasonNumber, ep.episode_number)}>
                          <div className="tv-episode-thumb-wrapper">
                            <img
                              src={ep.still_path || fallbackImg}
                              alt={ep.name}
                              className="tv-episode-thumb"
                              onError={e => { e.target.src = fallbackImg; }}
                            />
                            <button
                              type="button"
                              className={`tv-episode-checkbox-overlay ${watched ? 'watched' : 'unwatched'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEpisodeClick(selectedSeasonNumber, ep.episode_number);
                              }}
                              aria-label={watched ? 'Segna come non visto' : 'Segna come visto'}
                            >
                              {watched ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                              )}
                            </button>
                          </div>
                          <div className="tv-episode-info">
                            <h4 className="tv-episode-title">{ep.name}</h4>
                            <span className="tv-episode-meta">
                              Episodio {ep.episode_number} · {ep.runtime}m
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* Dove guardare */}
            {dynamicProviders && (streamProviders.length > 0 || rentProviders.length > 0) && (
              <section className="dm-section">
                <div className="dm-section-header">
                  <h2 className="dm-section-title" style={{ margin: 0 }}>Dove guardare</h2>
                  <a href={dynamicProviders.link || 'https://www.justwatch.com'} target="_blank" rel="noopener noreferrer" className="dm-justwatch-badge">
                    Fornito da <strong>JustWatch</strong>
                  </a>
                </div>
                {streamProviders.length > 0 && (
                  <div className="dm-providers-row">
                    {streamProviders.map((p, i) => (
                      <div className="dm-provider-chip" key={i}>
                        {p.logo.startsWith('http') ? <img src={p.logo} alt={p.name} className="dm-provider-logo"/> : <span style={{ fontSize: '1.1rem' }}>{p.logo}</span>}
                        <span>{p.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                {rentProviders.length > 0 && (
                  <>
                    <p className="dm-providers-label">Noleggio / Acquisto</p>
                    <div className="dm-providers-row">
                      {rentProviders.map((p, i) => (
                        <div className="dm-provider-chip" key={i}>
                          {p.logo.startsWith('http') ? <img src={p.logo} alt={p.name} className="dm-provider-logo"/> : <span style={{ fontSize: '1.1rem' }}>{p.logo}</span>}
                          <span>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}

            {/* Cast e produzione */}
            {dynamicCast && dynamicCast.length > 0 && (
              <section className="dm-section">
                <h2 className="dm-section-title">Cast e produzione</h2>
                <div className="dm-cast-row">
                  {dynamicCast.map((actor, i) => (
                    <div className="dm-cast-card" key={i}>
                      {actor.avatar
                        ? <img src={actor.avatar} alt={actor.name} className="dm-cast-avatar"
                            onError={e => { e.target.style.display='none'; if(e.target.nextSibling) e.target.nextSibling.style.display='flex'; }}/>
                        : null}
                      <div className="dm-cast-avatar-fallback" style={{ display: actor.avatar ? 'none' : 'flex' }}>
                        {actor.name.charAt(0)}
                      </div>
                      <span className="dm-cast-name">{actor.name}</span>
                      {actor.character && <span className="dm-cast-char">{actor.character}</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── TRAILER ── */}
            {trailer && (
              <section className="dm-section">
                <h2 className="dm-section-title">Trailer</h2>
                <a
                  href={`https://www.youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="trailer-card"
                >
                  <img
                    src={`https://img.youtube.com/vi/${trailer.key}/mqdefault.jpg`}
                    alt={trailer.name}
                    className="trailer-thumb"
                    onError={e => { e.target.src = `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`; }}
                  />
                  <div className="trailer-play-overlay">
                    <div className="trailer-play-btn"><IconPlay/></div>
                  </div>
                </a>
                <p className="trailer-label">
                  {trailer.name || 'Official Trailer'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 6, verticalAlign: 'middle', opacity: 0.5 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </p>
              </section>
            )}

            {/* ── INFORMAZIONI ── */}
            {infoRows.length > 0 && (
              <section className="dm-section">
                <h2 className="dm-section-title">Informazioni</h2>
                <div className="info-card">
                  {infoRows.map((row, i) => (
                    <InfoRow key={i} icon={row.icon} value={row.value} label={row.label} noBorder={i === infoRows.length - 1}/>
                  ))}
                </div>
              </section>
            )}

            {/* ── CORRELATI ── */}
            {similarItems.length > 0 && (
              <section className="dm-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h2 className="dm-section-title" style={{ margin: 0 }}>Correlati</h2>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-grey)' }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
                <div className="similar-row">
                  {similarItems.map(sim => (
                    <div key={sim.id} className="similar-card" onClick={() => onSelectMedia && onSelectMedia(sim)}>
                      {sim.poster
                        ? <img src={sim.poster} alt={sim.title} className="similar-poster"
                            onError={e => { e.target.style.background='#222'; e.target.style.display='flex'; }}/>
                        : <div className="similar-poster similar-poster-fallback">{sim.title.charAt(0)}</div>
                      }
                      <span className="similar-title">{sim.title}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div style={{ height: '40px' }}/>
          </div>
        </div>
      </div>

      {/* Log Popup */}
      {showLogPopup && (
        <LogPopup item={item} loggedInfo={loggedInfo} onSave={onSave} onRemove={onRemove} onClose={() => setShowLogPopup(false)}/>
      )}

      {/* Popups di conferma per Episodi e Stagioni */}
      {pendingEpisodeAction && (
        <div className="confirm-overlay" onClick={() => setPendingEpisodeAction(null)}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            <h3 className="confirm-title">Segna precedenti come visti?</h3>
            <p className="confirm-desc">
              Vuoi segnare come visti anche tutti gli episodi precedenti di questa stagione?
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn-primary" onClick={() => confirmEpisodeAction(true)}>
                Sì, segna precedenti
              </button>
              <button className="confirm-btn-secondary" onClick={() => confirmEpisodeAction(false)}>
                No, solo questo
              </button>
              <button className="confirm-btn-cancel" onClick={() => setPendingEpisodeAction(null)}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingSeasonAction && (
        <div className="confirm-overlay" onClick={() => setPendingSeasonAction(null)}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            <h3 className="confirm-title">Segna stagioni precedenti come viste?</h3>
            <p className="confirm-desc">
              Vuoi segnare come viste anche tutte le stagioni precedenti e i relativi episodi?
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn-primary" onClick={() => confirmSeasonAction(true)}>
                Sì, segna precedenti
              </button>
              <button className="confirm-btn-secondary" onClick={() => confirmSeasonAction(false)}>
                No, solo questa
              </button>
              <button className="confirm-btn-cancel" onClick={() => setPendingSeasonAction(null)}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
