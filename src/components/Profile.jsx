import React, { useState, useRef, useEffect } from 'react';
import Settings from './Settings';
import { StatsScrollCards } from './MyList';
import { PenToolIcon } from './icons/PenToolIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CogIcon } from './icons/CogIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import SearchAndAddModal from './SearchAndAddModal';

// ─── Icon helpers ─────────────────────────────────────────────────────────────
const IconPencil = () => (
  <PenToolIcon size={17} />
);
const IconGear = () => (
  <CogIcon size={17} />
);
const IconArrow = () => (
  <ArrowRightIcon size={18} />
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconCamera = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

// ─── Stats sub-page ───────────────────────────────────────────────────────────
function StatsPage({ trackedItems, onBack }) {
  const movies = trackedItems.filter(i => i.type === 'movie');
  const series = trackedItems.filter(i => i.type === 'tv');

  const avgMovieRuntime = 105; // minutes — TMDB avg estimate
  const totalMovieMin = movies.length * avgMovieRuntime;
  const movieHours = Math.floor(totalMovieMin / 60);
  const movieMins = totalMovieMin % 60;

  const avgEpisodesPerSeries = 12;
  const avgEpisodeMin = 45;
  const totalEpisodes = series.length * avgEpisodesPerSeries;
  const totalSeriesMin = totalEpisodes * avgEpisodeMin;
  const seriesHours = Math.floor(totalSeriesMin / 60);
  const seriesMins = totalSeriesMin % 60;

  const totalMin = totalMovieMin + totalSeriesMin;
  const totalHours = Math.floor(totalMin / 60);

  const avgRating = trackedItems.length > 0
    ? (trackedItems.reduce((a, i) => a + i.rating, 0) / trackedItems.length).toFixed(1)
    : '0.0';

  const topPlatform = (() => {
    const counts = {};
    trackedItems.forEach(i => { counts[i.platform] = (counts[i.platform] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  })();

  const statRows = [
    { icon: '🎬', label: 'Film visti', value: movies.length },
    { icon: '⏱️', label: 'Tempo film', value: `${movieHours}h ${movieMins}m` },
    { icon: '📺', label: 'Serie viste', value: series.length },
    { icon: '🎞️', label: 'Episodi stimati', value: totalEpisodes },
    { icon: '⌛', label: 'Tempo serie', value: `${seriesHours}h ${seriesMins}m` },
    { icon: '🕰️', label: 'Totale tempo visione', value: `${totalHours}h` },
    { icon: '⭐', label: 'Voto medio', value: `${avgRating} / 5.0` },
    { icon: '🏆', label: 'Piattaforma preferita', value: topPlatform }
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button
          onClick={onBack}
          style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-white)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Statistiche dettagliate</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {statRows.map((row, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--bg-deep)', border: '1px solid var(--border-light)',
            borderRadius: 'var(--border-radius-md)', padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.4rem' }}>{row.icon}</span>
              <span style={{ color: 'var(--text-grey)', fontSize: '0.95rem' }}>{row.label}</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-white)' }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Genre breakdown */}
      {trackedItems.length > 0 && (() => {
        const genreCounts = {};
        trackedItems.forEach(i => (i.genres || []).forEach(g => { genreCounts[g] = (genreCounts[g] || 0) + 1; }));
        const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const max = topGenres[0]?.[1] || 1;
        if (topGenres.length === 0) return null;
        return (
          <div style={{ marginTop: '28px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>Generi preferiti</h2>
            {topGenres.map(([genre, count], i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.85rem' }}>
                  <span>{genre}</span>
                  <span style={{ color: 'var(--text-grey)' }}>{count}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--bg-deep)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(count / max) * 100}%`,
                    background: `linear-gradient(90deg, var(--accent-cyan), var(--accent-blue))`,
                    borderRadius: '3px',
                    transition: 'width 0.6s ease'
                  }}/>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// Image compression helper to stay within localStorage limits
function compressAndSetImage(file, callback) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_WIDTH = 400; // Profile images don't need to be huge
      const MAX_HEIGHT = 400;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      callback(dataUrl);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

// ─── Edit profile modal ───────────────────────────────────────────────────────
function EditProfileModal({ profile, onSave, onClose }) {
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar);
  const [bannerUrl, setBannerUrl] = useState(profile.banner);

  const handleSave = (e) => {
    e.preventDefault();
    onSave({ name, username, avatar: avatarUrl, banner: bannerUrl });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div className="modal-body" style={{ marginTop: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '22px', borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '10px' }}>
            Modifica Profilo
          </h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Nome completo</label>
              <input className="custom-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="es. Mario Rossi"/>
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="custom-input" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="es. @mario"/>
            </div>
            <div className="form-group">
              <label className="form-label">Immagine profilo (Avatar)</label>
              <input className="custom-input" type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://... o carica da dispositivo"/>
              <div className="profile-upload-btn-container">
                <label className="file-upload-label">
                  <IconCamera /> Carica da telefono/PC
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        compressAndSetImage(file, setAvatarUrl);
                      }
                    }}
                  />
                </label>
                {avatarUrl && avatarUrl.startsWith('data:') && (
                  <button type="button" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid rgba(255,3,0,0.3)', color: 'var(--accent-red)' }} onClick={() => setAvatarUrl('')}>Rimuovi</button>
                )}
              </div>
              {avatarUrl && (
                <img src={avatarUrl} alt="preview" style={{ width: 60, height: 60, borderRadius: '50%', marginTop: 8, objectFit: 'cover', border: '2px solid var(--accent-cyan)' }} onError={e => { e.target.style.display = 'none'; }}/>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Sfondo della Card (Copertina)</label>
              <input className="custom-input" type="text" value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} placeholder="https://... o carica da dispositivo"/>
              <div className="profile-upload-btn-container">
                <label className="file-upload-label">
                  <IconCamera /> Carica da telefono/PC
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        compressAndSetImage(file, setBannerUrl);
                      }
                    }}
                  />
                </label>
                {bannerUrl && bannerUrl.startsWith('data:') && (
                  <button type="button" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid rgba(255,3,0,0.3)', color: 'var(--accent-red)' }} onClick={() => setBannerUrl('')}>Rimuovi</button>
                )}
              </div>
              {bannerUrl && (
                <img src={bannerUrl} alt="banner preview" style={{ width: '100%', height: 80, borderRadius: 10, marginTop: 8, objectFit: 'cover', border: '1px solid var(--border-light)' }} onError={e => { e.target.style.display = 'none'; }}/>
              )}
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 4 }}>Salva modifiche</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Create custom list modal ─────────────────────────────────────────────────
function CreateListModal({ onSave, onClose }) {
  const [listName, setListName] = useState('');
  const [listDesc, setListDesc] = useState('');
  const [emoji, setEmoji] = useState('📋');

  const handleSave = (e) => {
    e.preventDefault();
    if (!listName.trim()) return;
    onSave({ id: `list-${Date.now()}`, name: listName, desc: listDesc, emoji, items: [] });
    onClose();
  };

  const EMOJIS = ['📋', '🎬', '❤️', '⭐', '🔥', '🎭', '🌍', '👻', '🤩', '🎵', '🏆', '🎮'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div className="modal-body" style={{ marginTop: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '22px', borderLeft: '3px solid var(--accent-green)', paddingLeft: '10px' }}>
            Crea Lista Personalizzata
          </h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Emoji lista</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setEmoji(e)}
                    style={{
                      width: 38, height: 38, borderRadius: 8, fontSize: '1.2rem',
                      border: emoji === e ? '2px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                      background: emoji === e ? 'rgba(44,242,255,0.1)' : 'var(--bg-input)',
                      cursor: 'pointer', transition: 'var(--transition-smooth)'
                    }}
                  >{e}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Nome lista</label>
              <input className="custom-input" type="text" value={listName} onChange={e => setListName(e.target.value)} placeholder="es. Film da guardare con amici" required/>
            </div>
            <div className="form-group">
              <label className="form-label">Descrizione (opzionale)</label>
              <input className="custom-input" type="text" value={listDesc} onChange={e => setListDesc(e.target.value)} placeholder="Breve descrizione..."/>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 4 }}>Crea Lista</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Edit custom list modal ───────────────────────────────────────────────────
function EditListModal({ collection, onSave, onClose }) {
  const [listName, setListName] = useState(collection.name);
  const [listDesc, setListDesc] = useState(collection.desc || '');
  const [emoji, setEmoji] = useState(collection.emoji || '📋');

  const handleSave = (e) => {
    e.preventDefault();
    if (!listName.trim()) return;
    onSave({ ...collection, name: listName, desc: listDesc, emoji });
  };

  const EMOJIS = ['📋', '🎬', '❤️', '⭐', '🔥', '🎭', '🌍', '👻', '🤩', '🎵', '🏆', '🎮'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div className="modal-body" style={{ marginTop: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '22px', borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '10px' }}>
            Modifica Lista
          </h2>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Emoji lista</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setEmoji(e)}
                    style={{
                      width: 38, height: 38, borderRadius: 8, fontSize: '1.2rem',
                      border: emoji === e ? '2px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                      background: emoji === e ? 'rgba(44,242,255,0.1)' : 'var(--bg-input)',
                      cursor: 'pointer', transition: 'var(--transition-smooth)'
                    }}
                  >{e}</button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Nome lista</label>
              <input className="custom-input" type="text" value={listName} onChange={e => setListName(e.target.value)} placeholder="es. Film da guardare con amici" required/>
            </div>
            <div className="form-group">
              <label className="form-label">Descrizione (opzionale)</label>
              <input className="custom-input" type="text" value={listDesc} onChange={e => setListDesc(e.target.value)} placeholder="Breve descrizione..."/>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 4 }}>Salva Modifiche</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Collection Details sub-page ──────────────────────────────────────────────
function CollectionDetailsPage({ collection, onBack, onSelectCard, tmdbToken, showNotification, onUpdateCollection, onDeleteCollection }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const penIconRef = useRef(null);
  const plusIconRef = useRef(null);

  const handleAddMedia = (item) => {
    // Check if already in list
    if (collection.items.some(i => i.id === item.id)) {
      showNotification(`"${item.title}" è già in questa lista.`, 'error');
      return;
    }
    const updated = { ...collection, items: [...collection.items, item] };
    onUpdateCollection(updated);
    showNotification(`"${item.title}" aggiunto alla lista!`, 'success');
    setShowAddModal(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Vuoi davvero eliminare la lista "${collection.name}"?`)) {
      onDeleteCollection(collection.id);
      onBack();
    }
  };

  const handleShareText = async () => {
    setIsSharing(true);
    let text = `${collection.emoji} ${collection.name}\n${collection.desc ? collection.desc + '\n' : ''}\n`;
    
    for (let i = 0; i < collection.items.length; i++) {
      const item = collection.items[i];
      let director = "Regista N/D";
      if (tmdbToken && item.tmdbId) {
        try {
          const type = item.type === 'movie' ? 'movie' : 'tv';
          const res = await fetch(`https://api.themoviedb.org/3/${type}/${item.tmdbId}/credits`, {
            headers: { Authorization: `Bearer ${tmdbToken}` }
          });
          if (res.ok) {
            const data = await res.json();
            const d = data.crew.find(c => c.job === 'Director');
            if (d) director = d.name;
          }
        } catch(e){}
      }
      text += `- ${item.title} (${director}, ${item.year || 'N/D'})\n`;
    }

    try {
      await navigator.clipboard.writeText(text);
      showNotification("Lista copiata negli appunti come testo!", "success");
    } catch(e) {
      showNotification("Errore durante la copia.", "error");
    }
    setIsSharing(false);
    setShowMenu(false);
  };

  const handleShareLink = async () => {
    try {
      const smallColl = {
        id: `imported-${Date.now()}`,
        name: collection.name,
        desc: collection.desc,
        emoji: collection.emoji,
        items: collection.items.map(i => ({
          id: i.id, tmdbId: i.tmdbId, title: i.title, type: i.type, year: i.year, 
          imdbRating: i.imdbRating, poster: i.poster, backdrop: i.backdrop
        }))
      };
      
      const jsonStr = JSON.stringify(smallColl);
      const b64 = btoa(encodeURIComponent(jsonStr));
      const url = `${window.location.origin}${window.location.pathname}?importCollection=${b64}`;
      await navigator.clipboard.writeText(url);
      showNotification("Link copiato negli appunti! Condividilo con i tuoi amici.", "success");
    } catch (e) {
      showNotification("Errore nella generazione del link.", "error");
    }
    setShowMenu(false);
  };

  if (!collection) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack}
            style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-light)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-white)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            <span style={{ marginRight: '10px' }}>{collection.emoji || '📋'}</span>
            {collection.name}
          </h1>
        </div>

        {/* Action Menu */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* Plus Add Button */}
          <button 
            onClick={() => setShowAddModal(true)}
            onMouseEnter={() => plusIconRef.current?.startAnimation()}
            onMouseLeave={() => plusIconRef.current?.stopAnimation()}
            style={{ 
              background: 'var(--bg-deep)', 
              border: '1px solid var(--border-light)', 
              borderRadius: '50%', width: '40px', height: '40px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', color: 'var(--text-white)',
              transition: 'var(--transition-smooth)'
            }}
          >
            <PlusIcon ref={plusIconRef} size={20} />
          </button>

          <div style={{ position: 'relative' }}>
            <button 
            onClick={() => setShowMenu(!showMenu)}
            onMouseEnter={() => penIconRef.current?.startAnimation()}
            onMouseLeave={() => penIconRef.current?.stopAnimation()}
            style={{ 
              background: showMenu ? 'rgba(44,242,255,0.1)' : 'var(--bg-deep)', 
              border: `1px solid ${showMenu ? 'var(--accent-cyan)' : 'var(--border-light)'}`, 
              borderRadius: '50%', width: '40px', height: '40px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', color: showMenu ? 'var(--accent-cyan)' : 'var(--text-white)',
              transition: 'var(--transition-smooth)'
            }}
          >
            <PenToolIcon ref={penIconRef} size={20} />
          </button>
          
          {showMenu && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 80,
              background: 'var(--bg-deep)', border: '1px solid var(--border-light)',
              borderRadius: 'var(--border-radius-md)', padding: '8px', minWidth: '220px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <button onClick={() => { setShowMenu(false); setShowEditModal(true); }}
                style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: 'var(--text-white)', padding: '10px 14px', textAlign: 'left', fontSize: '0.88rem', cursor: 'pointer' }}>
                ✏️ Modifica info lista
              </button>
              <button onClick={handleShareText} disabled={isSharing}
                style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: 'var(--text-white)', padding: '10px 14px', textAlign: 'left', fontSize: '0.88rem', cursor: 'pointer', opacity: isSharing ? 0.5 : 1 }}>
                📋 {isSharing ? 'Recupero info...' : 'Condividi come Testo'}
              </button>
              <button onClick={handleShareLink}
                style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: 'var(--text-white)', padding: '10px 14px', textAlign: 'left', fontSize: '0.88rem', cursor: 'pointer' }}>
                🔗 Condividi come Link per l'app
              </button>
              <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />
              <button onClick={handleDelete}
                style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: 'var(--accent-red)', padding: '10px 14px', textAlign: 'left', fontSize: '0.88rem', cursor: 'pointer' }}>
                🗑️ Elimina lista
              </button>
            </div>
          )}
        </div>
        </div>
      </div>

      {collection.items && collection.items.length > 0 ? (
        <div className="media-grid">
          {collection.items.map(item => (
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
          <p style={{ fontSize: '2rem', marginBottom: '12px' }}>{collection.emoji || '📋'}</p>
          <p>La collezione è vuota.</p>
        </div>
      )}

      {showEditModal && (
        <EditListModal 
          collection={collection}
          onSave={(updated) => { onUpdateCollection(updated); setShowEditModal(false); }}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showAddModal && (
        <SearchAndAddModal
          tmdbToken={tmdbToken}
          onClose={() => setShowAddModal(false)}
          onAddMedia={handleAddMedia}
        />
      )}
    </div>
  );
}

// ─── Main Profile component ───────────────────────────────────────────────────
export default function Profile({
  profile,
  onSaveProfile,
  onSwitchProfile,
  trackedItems,
  onSelectCard,
  collections,
  onSaveCollections,
  tmdbToken,
  onSaveToken,
  themeColor,
  onSaveThemeColor,
  onImportData,
  onResetData,
  showNotification,
  statsConfig,
  onSaveStatsConfig,
  initialSubPage,
  onClearSubPage,
  onExportAll,
  onImportAll,
  googleClientId,
  onSaveGoogleClientId,
  googleAccessToken,
  onSetGoogleAccessToken,
  requestGoogleToken,
  googleSyncStatus,
  lastGoogleSync,
  onSaveToGoogleDrive,
  onLoadFromGoogleDrive
}) {
  // Sub-page state: null = home profile, 'stats' = full stats, 'settings' = settings
  const [subPage, setSubPage] = useState(initialSubPage || null);
  const [activeCollectionId, setActiveCollectionId] = useState(null);

  useEffect(() => {
    if (initialSubPage !== undefined) {
      setSubPage(initialSubPage);
    }
  }, [initialSubPage]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateListModal, setShowCreateListModal] = useState(false);

  // Quick stats
  const movies = trackedItems.filter(i => i.type === 'movie');
  const series = trackedItems.filter(i => i.type === 'tv');
  const avgRating = trackedItems.length > 0
    ? (trackedItems.reduce((a, i) => a + i.rating, 0) / trackedItems.length).toFixed(1)
    : '0.0';
  const totalMovieMin = movies.length * 105;
  const totalEpisodesEst = series.length * 12;
  const totalSeriesMin = totalEpisodesEst * 45;

  const fmtTime = (min) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const quickStats = [
    { label: 'Film visti', value: movies.length, icon: '🎬' },
    { label: 'Tempo film', value: fmtTime(totalMovieMin), icon: '⏱️' },
    { label: 'Serie viste', value: series.length, icon: '📺' },
    { label: 'Episodi stimati', value: totalEpisodesEst, icon: '🎞️' },
    { label: 'Tempo serie', value: fmtTime(totalSeriesMin), icon: '⌛' }
  ];

  const handleSaveProfile = (data) => {
    onSaveProfile(data);
    showNotification('Profilo aggiornato!', 'success');
  };

  const handleCreateList = (list) => {
    const updatedCollections = [list, ...(collections || [])];
    onSaveCollections(updatedCollections);
    showNotification(`Lista "${list.name}" creata!`, 'success');
  };

  // ── Full stats page ────────────────────────────────────────────────────────
  if (subPage === 'stats') {
    return <StatsPage trackedItems={trackedItems} onBack={() => setSubPage(null)} />;
  }

  // ── Settings page ──────────────────────────────────────────────────────────
  if (subPage === 'settings') {
    return (
      <div>
        <Settings
          onBack={() => { setSubPage(null); onClearSubPage?.(); }}
          profile={profile}
          onSaveProfile={onSaveProfile}
          tmdbToken={tmdbToken}
          onSaveToken={onSaveToken}
          themeColor={themeColor}
          onSaveThemeColor={onSaveThemeColor}
          trackedItems={trackedItems}
          onImportData={onImportData}
          onResetData={onResetData}
          showNotification={showNotification}
          statsConfig={statsConfig}
          onSaveStatsConfig={onSaveStatsConfig}
          onExportAll={onExportAll}
          onImportAll={onImportAll}
          googleClientId={googleClientId}
          onSaveGoogleClientId={onSaveGoogleClientId}
          googleAccessToken={googleAccessToken}
          onSetGoogleAccessToken={onSetGoogleAccessToken}
          requestGoogleToken={requestGoogleToken}
          googleSyncStatus={googleSyncStatus}
          lastGoogleSync={lastGoogleSync}
          onSaveToGoogleDrive={onSaveToGoogleDrive}
          onLoadFromGoogleDrive={onLoadFromGoogleDrive}
          onSwitchProfile={onSwitchProfile}
        />
      </div>
    );
  }

  // ── Collection details page ────────────────────────────────────────────────
  if (subPage === 'collection_details') {
    const col = collections?.find(c => c.id === activeCollectionId);
    return (
      <CollectionDetailsPage 
        collection={col} 
        onBack={() => { setSubPage(null); setActiveCollectionId(null); }} 
        onSelectCard={onSelectCard} 
        tmdbToken={tmdbToken}
        showNotification={showNotification}
        onDeleteCollection={(id) => onSaveCollections((collections || []).filter(c => c.id !== id))}
        onUpdateCollection={(updated) => onSaveCollections((collections || []).map(c => c.id === updated.id ? updated : c))}
      />
    );
  }

  // ── Main profile view ──────────────────────────────────────────────────────
  return (
    <div className="profile-view">

      {/* ── Profile Card ─────────────────────────────────────── */}
      <div className="profile-header-card" style={{ position: 'relative', overflow: 'hidden', padding: 0, flexDirection: 'column', alignItems: 'stretch' }}>

        {/* 1. Background Image Layer spanning the entire card */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: profile.banner
            ? `url(${profile.banner}) center/cover no-repeat`
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* 2. Blur and Darkening Gradient Overlay to ensure text readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // Starts lighter at the top banner area, becomes dark and blends with var(--bg-deep) below 110px
          background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.2) 0%, rgba(15, 23, 42, 0.75) 110px, var(--bg-deep) 100%)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 1,
          pointerEvents: 'none'
        }} />

        {/* Banner area space holder with controls */}
        <div style={{
          height: 110,
          background: 'transparent',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Pencil + Gear buttons top-right of card */}
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '8px', zIndex: 2 }}>
            <button
              id="profile-edit-btn"
              onClick={() => setShowEditModal(true)}
              title="Modifica profilo"
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--text-white)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'var(--transition-smooth)'
              }}
            >
              <IconPencil />
            </button>
            <button
              id="profile-settings-btn"
              onClick={() => setSubPage('settings')}
              title="Impostazioni e backup"
              style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'var(--text-white)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'var(--transition-smooth)'
              }}
            >
              <IconGear />
            </button>
          </div>
        </div>

        {/* Avatar + info (relative and above background layers) */}
        <div style={{ padding: '0 24px 24px 24px', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '-44px', marginBottom: '14px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                border: '4px solid var(--bg-dark)', background: 'var(--bg-deep)',
                overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
              }}>
                <img src={profile.avatar} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <span style={{
                position: 'absolute', bottom: 2, right: 2,
                background: 'var(--accent-cyan)', borderRadius: '50%',
                width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--bg-dark)'
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg-dark)" strokeWidth="4">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </span>
            </div>
          </div>

          {/* Name */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '2px' }}>{profile.name}</h2>
              {profile.isGoogleLinked && (
                <span title={`Collegato a Google: ${profile.googleEmail}`} style={{ display: 'inline-flex', background: '#fff', borderRadius: '50%', padding: '4px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h4.02c2.35-2.16 3.7-5.34 3.7-8.75z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.02-3.13c-1.12.75-2.55 1.19-3.94 1.19-3.03 0-5.6-2.05-6.51-4.82H1.36v3.23C3.34 21.6 7.4 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.49 14.33c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18v-3.23H1.36C.49 8.5 0 10.19 0 12s.49 3.5 1.36 5.18l4.13-3.23z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.4 0 3.34 2.4 1.36 6.37l4.13 3.23c.91-2.77 3.48-4.85 6.51-4.85z"/>
                  </svg>
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-grey)' }}>
              {profile.isGoogleLinked ? `Google: ${profile.googleEmail}` : profile.username}
            </span>
          </div>

          {/* Quick stat mini-row */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{trackedItems.length}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-grey)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visti</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-light)', paddingLeft: '18px' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-orange)' }}>★ {avgRating}</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-grey)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Media</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-light)', paddingLeft: '18px' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{movies.length}F / {series.length}S</span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-grey)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipologia</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Statistiche quick card ────────────────────────────── */}
      <div style={{
        background: 'var(--bg-deep)', border: '1px solid var(--border-light)',
        borderRadius: 'var(--border-radius-lg)', overflow: 'hidden'
      }}>
        {/* Header row */}
        <button
          id="stats-expand-btn"
          onClick={() => setSubPage('stats')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', background: 'none', border: 'none',
            borderBottom: '1px solid var(--border-light)', cursor: 'pointer',
            color: 'var(--text-white)'
          }}
        >
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>Statistiche</span>
          <span style={{ color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}>
            Tutte <IconArrow />
          </span>
        </button>

        {/* Stat cards — horizontal scroll strip */}
        <div style={{ padding: '14px 16px 6px 16px' }}>
          <StatsScrollCards trackedItems={trackedItems} statsConfig={statsConfig} />
        </div>
      </div>

      {/* ── Liste personalizzate ──────────────────────────────── */}
      <div style={{
        background: 'var(--bg-deep)', border: '1px solid var(--border-light)',
        borderRadius: 'var(--border-radius-lg)', overflow: 'hidden'
      }}>
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid var(--border-light)'
        }}>
          <span style={{ fontWeight: 600, fontSize: '1rem' }}>Liste personalizzate</span>
          <button
            id="create-list-btn"
            onClick={() => setShowCreateListModal(true)}
            title="Crea nuova lista"
            style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(44,242,255,0.12)',
              border: '1px solid rgba(44,242,255,0.3)',
              color: 'var(--accent-cyan)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'var(--transition-smooth)'
            }}
          >
            <IconPlus />
          </button>
        </div>

        {/* Lists */}
        {(!collections || collections.length === 0) ? (
          <div style={{ padding: '28px', textAlign: 'center', color: 'var(--text-grey)' }}>
            <p style={{ marginBottom: '8px', fontSize: '1.5rem' }}>📋</p>
            <p style={{ fontSize: '0.9rem' }}>Nessuna lista creata. Premi + per iniziare.</p>
          </div>
        ) : (
          collections.map((list, i) => (
            <div key={list.id} 
              onClick={() => { setActiveCollectionId(list.id); setSubPage('collection_details'); }}
              style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '14px 20px',
              borderBottom: i < collections.length - 1 ? '1px solid var(--border-light)' : 'none',
              cursor: 'pointer', transition: 'var(--transition-smooth)'
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 'var(--border-radius-sm)',
                background: 'var(--bg-input)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.3rem', flexShrink: 0
              }}>
                {list.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '2px' }}>{list.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-grey)' }}>
                  {list.desc || `${list.items.length} elementi`}
                </div>
              </div>
              <span style={{ color: 'var(--text-grey)', flexShrink: 0 }}>
                <IconArrow />
              </span>
            </div>
          ))
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────── */}
      {showEditModal && (
        <EditProfileModal
          profile={profile}
          onSave={handleSaveProfile}
          onClose={() => setShowEditModal(false)}
        />
      )}
      {showCreateListModal && (
        <CreateListModal
          onSave={handleCreateList}
          onClose={() => setShowCreateListModal(false)}
        />
      )}
    </div>
  );
}
