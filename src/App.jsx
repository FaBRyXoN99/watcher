import React, { useState, useEffect, useRef } from 'react';
import Discover from './components/Discover';
import Watchlist from './components/Watchlist';
import MyList from './components/MyList';
import Profile from './components/Profile';
import DetailsModal from './components/DetailsModal';
import ProfileSelection from './components/ProfileSelection';
import AddToCollectionModal from './components/AddToCollectionModal';
import { syncSaveProfileData, syncLoadProfileData } from './googleDriveHelper';
import { HomeIcon } from './components/icons/HomeIcon';
import { TimerIcon } from './components/icons/TimerIcon';
import { ClapIcon } from './components/icons/ClapIcon';
import { UserIcon } from './components/icons/UserIcon';
import { MOCK_MEDIA } from './mockData';

const TMDB_IMG = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : '';

async function tmdbFetch(endpoint, token) {
  const res = await fetch(`https://api.themoviedb.org/3${endpoint}`, {
    headers: { Authorization: `Bearer ${token}`, accept: 'application/json' }
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json();
}

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [trackedItems, setTrackedItems] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [collections, setCollections] = useState([]);
  const [collectionModalMedia, setCollectionModalMedia] = useState(null);
  const [tmdbToken, setTmdbToken] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [notification, setNotification] = useState(null);
  const [profileSubPage, setProfileSubPage] = useState(null);
  const [googleClientId, setGoogleClientId] = useState(localStorage.getItem('watcher_google_client_id') || '');
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [googleSyncStatus, setGoogleSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'success' | 'error'
  const [lastGoogleSync, setLastGoogleSync] = useState('');
  const [themeColor, setThemeColor] = useState('#3eeefc');

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', themeColor);
  }, [themeColor]);

  const [mediaLoading, setMediaLoading] = useState(false);

  // Centralized media select & enrichment logic
  const handleSelectMedia = async (mediaItem) => {
    if (!mediaItem) return;
    
    // Offline mode: No TMDB token or TMDB ID missing
    if (!mediaItem.tmdbId || !tmdbToken) {
      const mockFound = MOCK_MEDIA.find(m => m.id === mediaItem.id);
      if (mockFound) {
        setSelectedMedia({ ...mockFound, ...mediaItem });
      } else {
        setSelectedMedia(mediaItem);
      }
      return;
    }

    setMediaLoading(true);
    try {
      const typePath = mediaItem.type === 'movie' ? 'movie' : 'tv';
      const [creditsRes, providersRes, detailsRes] = await Promise.allSettled([
        tmdbFetch(`/${typePath}/${mediaItem.tmdbId}/credits?language=it-IT`, tmdbToken),
        tmdbFetch(`/${typePath}/${mediaItem.tmdbId}/watch/providers`, tmdbToken),
        tmdbFetch(`/${typePath}/${mediaItem.tmdbId}?language=it-IT`, tmdbToken)
      ]);

      const castList = creditsRes.status === 'fulfilled' && creditsRes.value
        ? (creditsRes.value.cast || []).slice(0, 8).map(m => ({ 
            name: m.name, 
            character: m.character, 
            avatar: TMDB_IMG(m.profile_path, 'w185') 
          }))
        : [];

      let providersData = { flatrate: [], rent: [], buy: [], free: [], ads: [] };
      if (providersRes.status === 'fulfilled' && providersRes.value) {
        const reg = providersRes.value.results?.IT || {};
        const mp = arr => (arr || []).map(p => ({ 
          name: p.provider_name, 
          logo: TMDB_IMG(p.logo_path, 'original'), 
          id: p.provider_id 
        }));
        providersData = { 
          flatrate: mp(reg.flatrate), 
          rent: mp(reg.rent), 
          buy: mp(reg.buy), 
          free: mp(reg.free), 
          ads: mp(reg.ads), 
          link: reg.link || '' 
        };
      }

      let duration = '', genres = [], seasons = [], description = mediaItem.description || '';
      if (detailsRes.status === 'fulfilled' && detailsRes.value) {
        const d = detailsRes.value;
        genres = (d.genres || []).map(g => g.name);
        if (d.overview) {
          description = d.overview;
        }
        if (mediaItem.type === 'movie' && d.runtime) {
          duration = `${Math.floor(d.runtime / 60)}h ${d.runtime % 60}m`;
        } else if (mediaItem.type === 'tv') {
          const ns = d.number_of_seasons || 1;
          duration = `${ns} Stagion${ns > 1 ? 'i' : 'e'}`;
          seasons = Array.from({ length: ns }, (_, i) => ({ number: i + 1, name: `Stagione ${i + 1}` }));
        }
      }

      setSelectedMedia({ 
        ...mediaItem, 
        cast: castList.length > 0 ? castList : mediaItem.cast || [], 
        providers: providersData, 
        duration: duration || mediaItem.duration || 'N/D', 
        genres: genres.length > 0 ? genres : mediaItem.genres || ['Generico'], 
        seasons: seasons.length > 0 ? seasons : mediaItem.seasons || [],
        description: description
      });
    } catch (err) {
      console.error('Errore nel caricamento dettagli:', err);
      showNotification('Errore nel caricamento dettagli.', 'error');
      setSelectedMedia(mediaItem);
    } finally {
      setMediaLoading(false);
    }
  };
  const [statsConfig, setStatsConfig] = useState([
    { id: 'totalItems', label: 'Visti Totali', visible: true },
    { id: 'avgRating', label: 'Voto Medio', visible: true },
    { id: 'favPlat', label: 'Servizio Preferito', visible: true },
    { id: 'moviesCount', label: 'Film Visti', visible: true },
    { id: 'tvCount', label: 'Serie Viste', visible: true },
    { id: 'movieTime', label: 'Tempo Film', visible: true },
    { id: 'estimatedEpisodes', label: 'Episodi Stimati', visible: true },
    { id: 'tvTime', label: 'Tempo Serie', visible: true }
  ]);
  const attemptedEnrichments = useRef(new Set());
  const homeIconRef = useRef(null);
  const timerIconRef = useRef(null);
  const clapIconRef = useRef(null);
  const userIconRef = useRef(null);

  // Load profiles on mount
  useEffect(() => {
    const storedProfiles = localStorage.getItem('watcher_profiles');
    let loadedProfiles = [];
    if (storedProfiles) {
      loadedProfiles = JSON.parse(storedProfiles);
      setProfiles(loadedProfiles);
    }

    const storedActiveProfileId = localStorage.getItem('watcher_active_profile_id');
    if (storedActiveProfileId && loadedProfiles.length > 0) {
      const active = loadedProfiles.find(p => p.id === storedActiveProfileId);
      if (active) {
        setActiveProfile(active);
        loadProfileData(active.id);
      }
    }
  }, []);

  // Import collection from URL
  useEffect(() => {
    if (!activeProfile) return;
    
    const params = new URLSearchParams(window.location.search);
    const importData = params.get('importCollection');
    if (importData) {
      try {
        const decoded = decodeURIComponent(atob(importData));
        const newCollection = JSON.parse(decoded);
        
        // Rimuovi parametro senza ricaricare la pagina
        const url = new URL(window.location);
        url.searchParams.delete('importCollection');
        window.history.replaceState({}, document.title, url.toString());
        
        if (newCollection && newCollection.id && newCollection.name) {
          newCollection.id = `imported-${Date.now()}`;
          // Usa setTimeout per assicurarci che i dati del profilo siano stati caricati (collections state)
          setTimeout(() => {
            setCollections(prev => {
              const updated = [newCollection, ...(prev || [])];
              localStorage.setItem(`watcher_collections_${activeProfile.id}`, JSON.stringify(updated));
              return updated;
            });
            setNotification({ message: `Collezione "${newCollection.name}" importata!`, type: 'success' });
            setTimeout(() => setNotification(null), 3000);
          }, 500);
        }
      } catch (err) {
        console.error("Errore importazione collezione", err);
        setNotification({ message: "Errore nell'importazione dal link.", type: 'error' });
        setTimeout(() => setNotification(null), 3000);
      }
    }
  }, [activeProfile]);

  const loadProfileData = (profileId) => {
    // 1. Tracked items
    const storedItems = localStorage.getItem(`watcher_profile_${profileId}_tracked_items`);
    if (storedItems) {
      setTrackedItems(JSON.parse(storedItems));
    } else {
      // Check if we can migrate from old global key (backward compatibility)
      const oldGlobalItems = localStorage.getItem('watcher_tracked_items');
      if (oldGlobalItems) {
        const items = JSON.parse(oldGlobalItems);
        setTrackedItems(items);
        localStorage.setItem(`watcher_profile_${profileId}_tracked_items`, oldGlobalItems);
        localStorage.removeItem('watcher_tracked_items'); // cleanup
      } else {
        // Preload default items
        const defaultItems = [];
        setTrackedItems(defaultItems);
        localStorage.setItem(`watcher_profile_${profileId}_tracked_items`, JSON.stringify(defaultItems));
      }
    }

    // 2. Watchlist
    const storedWatchlist = localStorage.getItem(`watcher_profile_${profileId}_watchlist`);
    if (storedWatchlist) {
      setWatchlist(JSON.parse(storedWatchlist));
    } else {
      const oldGlobalWatchlist = localStorage.getItem('watcher_watchlist');
      if (oldGlobalWatchlist) {
        const wl = JSON.parse(oldGlobalWatchlist);
        setWatchlist(wl);
        localStorage.setItem(`watcher_profile_${profileId}_watchlist`, oldGlobalWatchlist);
        localStorage.removeItem('watcher_watchlist'); // cleanup
      } else {
        const defaultWatchlist = [];
        setWatchlist(defaultWatchlist);
        localStorage.setItem(`watcher_profile_${profileId}_watchlist`, JSON.stringify(defaultWatchlist));
      }
    }

    // 3. TMDB Token
    const storedToken = localStorage.getItem(`watcher_profile_${profileId}_tmdb_token`);
    if (storedToken) {
      setTmdbToken(storedToken);
    } else {
      const oldGlobalToken = localStorage.getItem('watcher_tmdb_token');
      if (oldGlobalToken) {
        setTmdbToken(oldGlobalToken);
        localStorage.setItem(`watcher_profile_${profileId}_tmdb_token`, oldGlobalToken);
        localStorage.removeItem('watcher_tmdb_token'); // cleanup
      } else {
        setTmdbToken('');
      }
    }

    // 4. Stats Config
    const storedStatsConfig = localStorage.getItem(`watcher_profile_${profileId}_stats_config`);
    if (storedStatsConfig) {
      setStatsConfig(JSON.parse(storedStatsConfig));
    } else {
      const oldGlobalStats = localStorage.getItem('watcher_stats_config');
      if (oldGlobalStats) {
        setStatsConfig(JSON.parse(oldGlobalStats));
        localStorage.setItem(`watcher_profile_${profileId}_stats_config`, oldGlobalStats);
        localStorage.removeItem('watcher_stats_config'); // cleanup
      } else {
        const defaultStats = [
          { id: 'totalItems', label: 'Visti Totali', visible: true },
          { id: 'avgRating', label: 'Voto Medio', visible: true },
          { id: 'favPlat', label: 'Servizio Preferito', visible: true },
          { id: 'moviesCount', label: 'Film Visti', visible: true },
          { id: 'tvCount', label: 'Serie Viste', visible: true },
          { id: 'movieTime', label: 'Tempo Film', visible: true },
          { id: 'estimatedEpisodes', label: 'Episodi Stimati', visible: true },
          { id: 'tvTime', label: 'Tempo Serie', visible: true }
        ];
        setStatsConfig(defaultStats);
        localStorage.setItem(`watcher_profile_${profileId}_stats_config`, JSON.stringify(defaultStats));
      }
    }

    // 5. Google Sync Meta
    const storedSyncMeta = localStorage.getItem(`watcher_profile_${profileId}_gdrive_sync_meta`);
    if (storedSyncMeta) {
      const meta = JSON.parse(storedSyncMeta);
      setLastGoogleSync(meta.lastSync || '');
    } else {
      setLastGoogleSync('');
    }

    // 6. Collections
    const storedCollections = localStorage.getItem(`watcher_profile_${profileId}_collections`);
    if (storedCollections) {
      setCollections(JSON.parse(storedCollections));
    } else {
      setCollections([]);
    }

    // 7. Theme Color
    const storedTheme = localStorage.getItem(`watcher_profile_${profileId}_theme_color`);
    if (storedTheme) {
      setThemeColor(storedTheme);
    } else {
      setThemeColor('#3eeefc');
    }
  };

  // Save tracked items to localStorage whenever they change
  const saveTrackedItems = (items) => {
    setTrackedItems(items);
    if (activeProfile) {
      localStorage.setItem(`watcher_profile_${activeProfile.id}_tracked_items`, JSON.stringify(items));
    }
  };

  // Save watchlist to localStorage
  const saveWatchlist = (items) => {
    setWatchlist(items);
    if (activeProfile) {
      localStorage.setItem(`watcher_profile_${activeProfile.id}_watchlist`, JSON.stringify(items));
    }
  };

  // Save collections to localStorage
  const saveCollections = (items) => {
    setCollections(items);
    if (activeProfile) {
      localStorage.setItem(`watcher_profile_${activeProfile.id}_collections`, JSON.stringify(items));
    }
  };

  // Save Theme Color
  const handleSaveThemeColor = (color) => {
    setThemeColor(color);
    if (activeProfile) {
      localStorage.setItem(`watcher_profile_${activeProfile.id}_theme_color`, color);
    }
  };

  // Toast / notification banner
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  // Auto dismiss notification banner
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auto-enrich items missing poster images or TMDB IDs using TMDB when token is available
  useEffect(() => {
    if (!tmdbToken || !activeProfile) return;

    const enrichMissingPosters = async (items, setter, storageKey) => {
      const itemsNeedingEnrichment = items.filter(
        i => (!i.poster || !i.tmdbId) && !attemptedEnrichments.current.has(i.id)
      );
      if (itemsNeedingEnrichment.length === 0) return;

      // Mark them as attempted immediately to avoid double calls
      itemsNeedingEnrichment.forEach(i => attemptedEnrichments.current.add(i.id));

      const enriched = [...items];
      let changed = false;

      await Promise.allSettled(
        itemsNeedingEnrichment.map(async (item) => {
          try {
            const typePath = item.type === 'movie' ? 'movie' : 'tv';
            let data = null;
            let tmdbId = item.tmdbId;

            if (!tmdbId && item.title) {
              const query = encodeURIComponent(item.title);
              const searchRes = await fetch(
                `https://api.themoviedb.org/3/search/${typePath}?query=${query}&language=it-IT`,
                { headers: { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' } }
              );
              if (searchRes.ok) {
                const searchData = await searchRes.json();
                if (searchData.results && searchData.results.length > 0) {
                  const firstResult = searchData.results[0];
                  tmdbId = firstResult.id;
                  data = firstResult;
                }
              }
            } else if (tmdbId) {
              const res = await fetch(
                `https://api.themoviedb.org/3/${typePath}/${tmdbId}?language=it-IT`,
                { headers: { Authorization: `Bearer ${tmdbToken}`, accept: 'application/json' } }
              );
              if (res.ok) {
                data = await res.json();
              }
            }

            if (data && tmdbId) {
              const idx = enriched.findIndex(i => i.id === item.id);
              if (idx !== -1) {
                const updatedItem = { ...enriched[idx] };
                if (!updatedItem.tmdbId) {
                  updatedItem.tmdbId = tmdbId;
                  changed = true;
                }
                if (data.poster_path && !updatedItem.poster) {
                  updatedItem.poster = `https://image.tmdb.org/t/p/w342${data.poster_path}`;
                  changed = true;
                }
                if (data.backdrop_path && !updatedItem.backdrop) {
                  updatedItem.backdrop = `https://image.tmdb.org/t/p/original${data.backdrop_path}`;
                  changed = true;
                }
                
                const dateStr = data.release_date || data.first_air_date || '';
                if (dateStr && !updatedItem.year) {
                  updatedItem.year = dateStr.split('-')[0];
                  changed = true;
                }

                if (data.genres && Array.isArray(data.genres) && (!updatedItem.genres || updatedItem.genres.length === 0)) {
                  updatedItem.genres = data.genres.map(g => g.name);
                  changed = true;
                }

                enriched[idx] = updatedItem;
              }
            }
          } catch (_) {}
        })
      );

      if (changed) {
        setter(enriched);
        localStorage.setItem(storageKey, JSON.stringify(enriched));
      }
    };

    enrichMissingPosters(trackedItems, setTrackedItems, `watcher_profile_${activeProfile.id}_tracked_items`);
    enrichMissingPosters(watchlist, setWatchlist, `watcher_profile_${activeProfile.id}_watchlist`);
  }, [tmdbToken, activeProfile, trackedItems, watchlist]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save TMDB Token
  const handleSaveToken = (token) => {
    setTmdbToken(token);
    if (activeProfile) {
      localStorage.setItem(`watcher_profile_${activeProfile.id}_tmdb_token`, token);
    }
  };

  // Save Stats Config
  const handleSaveStatsConfig = (newConfig) => {
    setStatsConfig(newConfig);
    if (activeProfile) {
      localStorage.setItem(`watcher_profile_${activeProfile.id}_stats_config`, JSON.stringify(newConfig));
    }
  };

  // Add item to Watchlist
  const handleAddToWatchlist = (item) => {
    if (!activeProfile) {
      showNotification("Devi accedere o creare un profilo per usare questa funzione.", "error");
      setActiveTab('profile');
      return;
    }
    if (watchlist.some(w => w.id === item.id)) {
      showNotification(`"${item.title}" è già in watchlist!`, "error");
      return;
    }
    const newWatchlist = [...watchlist, item];
    saveWatchlist(newWatchlist);
    showNotification(`"${item.title}" aggiunto alla Watchlist.`, "success");
  };

  // Remove item from Watchlist
  const handleRemoveFromWatchlist = (id) => {
    if (!activeProfile) return;
    const itemToRemove = watchlist.find(w => w.id === id);
    const newWatchlist = watchlist.filter(w => w.id !== id);
    saveWatchlist(newWatchlist);
    if (itemToRemove) {
      showNotification(`"${itemToRemove.title}" rimosso dalla Watchlist.`, "success");
    }
  };

  // Log or Update an item in the tracker (watched Collection)
  const handleSaveLog = (logData) => {
    if (!activeProfile) {
      showNotification("Devi accedere o creare un profilo per usare questa funzione.", "error");
      setActiveTab('profile');
      return;
    }
    const existingIndex = trackedItems.findIndex(i => i.id === logData.id);
    let newItems = [...trackedItems];

    if (existingIndex > -1) {
      // Update existing item
      newItems[existingIndex] = {
        ...newItems[existingIndex],
        ...logData
      };
      showNotification(`"${logData.title}" aggiornato nel tracker.`, "success");
    } else {
      // Add new item to head of the list
      newItems = [logData, ...newItems];
      showNotification(`"${logData.title}" aggiunto alla collezione dei visti!`, "success");
      
      // Auto-remove from watchlist if it was there
      if (watchlist.some(w => w.id === logData.id)) {
        const newWatchlist = watchlist.filter(w => w.id !== logData.id);
        saveWatchlist(newWatchlist);
      }
    }

    saveTrackedItems(newItems);
    // Keep modal open after saving log
  };

  // Remove item from the tracker
  const handleRemoveLog = (id) => {
    const itemToRemove = trackedItems.find(i => i.id === id);
    const newItems = trackedItems.filter(i => i.id !== id);
    saveTrackedItems(newItems);
    // Keep modal open after removing log
    if (itemToRemove) {
      showNotification(`"${itemToRemove.title}" rimosso dai visti.`, "success");
    }
  };

  // Helper to request access token via Google Identity Services
  const requestGoogleToken = (callback) => {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      showNotification("Le API di Google non sono caricate nel browser.", "error");
      return;
    }
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: 'https://www.googleapis.com/auth/drive.file email profile openid',
      callback: (response) => {
        if (response.error) {
          showNotification("Accesso Google annullato o non autorizzato.", "error");
          return;
        }
        setGoogleAccessToken(response.access_token);
        if (callback) callback(response.access_token);
      }
    });
    client.requestAccessToken();
  };

  const handleSaveToGoogleDrive = async (token = googleAccessToken) => {
    if (!googleClientId) {
      // Sandbox fallback
      setGoogleSyncStatus('syncing');
      try {
        const backupData = {
          tracked_items: trackedItems,
          watchlist: watchlist,
          stats_config: statsConfig,
          tmdb_token: tmdbToken,
          collections: collections,
          theme_color: themeColor
        };
        const res = await syncSaveProfileData('', '', activeProfile, backupData);
        setGoogleSyncStatus('idle');
        setLastGoogleSync(res.lastSync);
        localStorage.setItem(`watcher_profile_${activeProfile.id}_gdrive_sync_meta`, JSON.stringify({ lastSync: res.lastSync }));
        showNotification("Backup salvato su Google Drive (Sandbox)!", "success");
      } catch (err) {
        setGoogleSyncStatus('idle');
        showNotification("Errore nel salvataggio del backup (Sandbox).", "error");
      }
      return;
    }

    if (!token) {
      requestGoogleToken((obtainedToken) => {
        handleSaveToGoogleDrive(obtainedToken);
      });
      return;
    }

    setGoogleSyncStatus('syncing');
    try {
      const backupData = {
        tracked_items: trackedItems,
        watchlist: watchlist,
        stats_config: statsConfig,
        tmdb_token: tmdbToken,
        collections: collections,
        theme_color: themeColor
      };
      const res = await syncSaveProfileData(googleClientId, token, activeProfile, backupData);
      setGoogleSyncStatus('idle');
      setLastGoogleSync(res.lastSync);
      localStorage.setItem(`watcher_profile_${activeProfile.id}_gdrive_sync_meta`, JSON.stringify({ lastSync: res.lastSync }));
      showNotification("Backup salvato su Google Drive!", "success");
    } catch (err) {
      setGoogleSyncStatus('idle');
      setGoogleAccessToken('');
      showNotification("Errore di sincronizzazione con Google Drive. Riprova.", "error");
    }
  };

  const handleLoadFromGoogleDrive = async (token = googleAccessToken) => {
    if (!googleClientId) {
      // Sandbox fallback
      setGoogleSyncStatus('syncing');
      try {
        const res = await syncLoadProfileData('', '', activeProfile);
        setGoogleSyncStatus('idle');
        if (res.data) {
          if (res.data.tracked_items) {
            setTrackedItems(res.data.tracked_items);
            localStorage.setItem(`watcher_profile_${activeProfile.id}_tracked_items`, JSON.stringify(res.data.tracked_items));
          }
          if (res.data.watchlist) {
            setWatchlist(res.data.watchlist);
            localStorage.setItem(`watcher_profile_${activeProfile.id}_watchlist`, JSON.stringify(res.data.watchlist));
          }
          if (res.data.stats_config) {
            setStatsConfig(res.data.stats_config);
            localStorage.setItem(`watcher_profile_${activeProfile.id}_stats_config`, JSON.stringify(res.data.stats_config));
          }
          if (res.data.tmdb_token !== undefined) {
            setTmdbToken(res.data.tmdb_token);
            localStorage.setItem(`watcher_profile_${activeProfile.id}_tmdb_token`, res.data.tmdb_token);
          }
          if (res.data.collections) {
            setCollections(res.data.collections);
            localStorage.setItem(`watcher_profile_${activeProfile.id}_collections`, JSON.stringify(res.data.collections));
          }
          if (res.data.theme_color) {
            setThemeColor(res.data.theme_color);
            localStorage.setItem(`watcher_profile_${activeProfile.id}_theme_color`, res.data.theme_color);
          }
          showNotification("Backup ripristinato da Google Drive (Sandbox)!", "success");
        }
      } catch (err) {
        setGoogleSyncStatus('idle');
        showNotification(err.message, "error");
      }
      return;
    }

    if (!token) {
      requestGoogleToken((obtainedToken) => {
        handleLoadFromGoogleDrive(obtainedToken);
      });
      return;
    }

    setGoogleSyncStatus('syncing');
    try {
      const res = await syncLoadProfileData(googleClientId, token, activeProfile);
      setGoogleSyncStatus('idle');
      if (res.data) {
        if (res.data.tracked_items) {
          setTrackedItems(res.data.tracked_items);
          localStorage.setItem(`watcher_profile_${activeProfile.id}_tracked_items`, JSON.stringify(res.data.tracked_items));
        }
        if (res.data.watchlist) {
          setWatchlist(res.data.watchlist);
          localStorage.setItem(`watcher_profile_${activeProfile.id}_watchlist`, JSON.stringify(res.data.watchlist));
        }
        if (res.data.stats_config) {
          setStatsConfig(res.data.stats_config);
          localStorage.setItem(`watcher_profile_${activeProfile.id}_stats_config`, JSON.stringify(res.data.stats_config));
        }
        if (res.data.tmdb_token !== undefined) {
          setTmdbToken(res.data.tmdb_token);
          localStorage.setItem(`watcher_profile_${activeProfile.id}_tmdb_token`, res.data.tmdb_token);
        }
        if (res.data.collections) {
          setCollections(res.data.collections);
          localStorage.setItem(`watcher_profile_${activeProfile.id}_collections`, JSON.stringify(res.data.collections));
        }
        if (res.data.theme_color) {
          setThemeColor(res.data.theme_color);
          localStorage.setItem(`watcher_profile_${activeProfile.id}_theme_color`, res.data.theme_color);
        }
        showNotification("Backup caricato da Google Drive con successo!", "success");
      }
    } catch (err) {
      setGoogleSyncStatus('idle');
      setGoogleAccessToken('');
      showNotification(err.message || "Errore nel caricamento del backup da Drive.", "error");
    }
  };

  // Reset active profile data
  const handleResetData = () => {
    if (!activeProfile) return;
    localStorage.removeItem(`watcher_profile_${activeProfile.id}_tracked_items`);
    localStorage.removeItem(`watcher_profile_${activeProfile.id}_watchlist`);
    localStorage.removeItem(`watcher_profile_${activeProfile.id}_tmdb_token`);
    localStorage.removeItem(`watcher_profile_${activeProfile.id}_collections`);
    localStorage.removeItem(`watcher_profile_${activeProfile.id}_theme_color`);
    setTrackedItems([]);
    setWatchlist([]);
    setTmdbToken('');
    setCollections([]);
    setThemeColor('#3eeefc');
    showNotification("Profilo ripristinato ai valori di fabbrica.", "success");
  };

  // Import Backup Data
  const handleImportData = (importedItems, target = 'tracked') => {
    if (target === 'watchlist') {
      const filtered = importedItems.filter(item => !watchlist.some(w => w.title.toLowerCase() === item.title.toLowerCase()));
      saveWatchlist([...filtered, ...watchlist]);
    } else {
      const filtered = importedItems.filter(item => !trackedItems.some(t => t.title.toLowerCase() === item.title.toLowerCase()));
      saveTrackedItems([...filtered, ...trackedItems]);
    }
  };

  const handleExportAll = () => {
    try {
      const profilesStr = localStorage.getItem('watcher_profiles') || '[]';
      const profilesList = JSON.parse(profilesStr);
      
      const profilesData = {};
      profilesList.forEach(p => {
        const pId = p.id;
        profilesData[pId] = {
          tracked_items: JSON.parse(localStorage.getItem(`watcher_profile_${pId}_tracked_items`) || '[]'),
          watchlist: JSON.parse(localStorage.getItem(`watcher_profile_${pId}_watchlist`) || '[]'),
          stats_config: JSON.parse(localStorage.getItem(`watcher_profile_${pId}_stats_config`) || 'null'),
          tmdb_token: localStorage.getItem(`watcher_profile_${pId}_tmdb_token`) || '',
          collections: JSON.parse(localStorage.getItem(`watcher_profile_${pId}_collections`) || '[]'),
          theme_color: localStorage.getItem(`watcher_profile_${pId}_theme_color`) || '#3eeefc'
        };
      });

      return {
        type: 'watcher_backup_all',
        version: '1.0',
        profiles: profilesList,
        profilesData: profilesData
      };
    } catch (err) {
      console.error("Errore durante l'esportazione globale:", err);
      throw err;
    }
  };

  const handleImportAll = (backupData) => {
    try {
      const { profiles: newProfiles, profilesData } = backupData;
      if (!Array.isArray(newProfiles) || !profilesData) {
        showNotification("Backup non valido: dati mancanti.", "error");
        return;
      }

      // 1. Write profiles list
      localStorage.setItem('watcher_profiles', JSON.stringify(newProfiles));
      setProfiles(newProfiles);

      // 2. Write details and items for each profile
      newProfiles.forEach(p => {
        const pId = p.id;
        const data = profilesData[pId];
        if (data) {
          if (data.tracked_items) {
            localStorage.setItem(`watcher_profile_${pId}_tracked_items`, JSON.stringify(data.tracked_items));
          }
          if (data.watchlist) {
            localStorage.setItem(`watcher_profile_${pId}_watchlist`, JSON.stringify(data.watchlist));
          }
          if (data.stats_config) {
            localStorage.setItem(`watcher_profile_${pId}_stats_config`, JSON.stringify(data.stats_config));
          }
          if (data.tmdb_token !== undefined) {
            localStorage.setItem(`watcher_profile_${pId}_tmdb_token`, data.tmdb_token);
          }
          if (data.collections) {
            localStorage.setItem(`watcher_profile_${pId}_collections`, JSON.stringify(data.collections));
          }
          if (data.theme_color) {
            localStorage.setItem(`watcher_profile_${pId}_theme_color`, data.theme_color);
          }
        }
      });

      // 3. Select active profile or fallback to the first one
      if (activeProfile && newProfiles.some(p => p.id === activeProfile.id)) {
        loadProfileData(activeProfile.id);
        showNotification("Dati di tutti i profili importati con successo!", "success");
      } else if (newProfiles.length > 0) {
        handleSelectProfile(newProfiles[0]);
      } else {
        showNotification("Dati di tutti i profili importati con successo!", "success");
      }
    } catch (err) {
      console.error("Errore durante l'importazione globale:", err);
      showNotification("Errore di decodifica del backup globale.", "error");
    }
  };

  // Profile operations
  const handleSelectProfile = (profile) => {
    setActiveProfile(profile);
    localStorage.setItem('watcher_active_profile_id', profile.id);
    loadProfileData(profile.id);
    showNotification(`Accesso effettuato come ${profile.name}`, 'success');
  };

  const handleCreateProfile = (newProfile) => {
    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    localStorage.setItem('watcher_profiles', JSON.stringify(updatedProfiles));
    
    // Auto-select if first profile or if it is Google-linked
    if (updatedProfiles.length === 1 || newProfile.isGoogleLinked) {
      handleSelectProfile(newProfile);
    } else {
      showNotification(`Profilo "${newProfile.name}" creato!`, 'success');
    }
  };

  const handleDeleteProfile = (profileId) => {
    const updatedProfiles = profiles.filter(p => p.id !== profileId);
    setProfiles(updatedProfiles);
    localStorage.setItem('watcher_profiles', JSON.stringify(updatedProfiles));
    
    localStorage.removeItem(`watcher_profile_${profileId}_tracked_items`);
    localStorage.removeItem(`watcher_profile_${profileId}_watchlist`);
    localStorage.removeItem(`watcher_profile_${profileId}_tmdb_token`);
    localStorage.removeItem(`watcher_profile_${profileId}_stats_config`);
    localStorage.removeItem(`watcher_profile_${profileId}_details`);
    localStorage.removeItem(`watcher_profile_${profileId}_collections`);

    if (activeProfile && activeProfile.id === profileId) {
      setActiveProfile(null);
      localStorage.removeItem('watcher_active_profile_id');
    }
    showNotification('Profilo eliminato.', 'success');
  };

  const handleSwitchProfile = () => {
    setActiveProfile(null);
    localStorage.removeItem('watcher_active_profile_id');
    showNotification('Disconnesso', 'success');
  };

  const handleSaveProfile = (updatedProfileData) => {
    const updatedProfile = { ...activeProfile, ...updatedProfileData };
    setActiveProfile(updatedProfile);
    
    const updatedList = profiles.map(p => p.id === activeProfile.id ? updatedProfile : p);
    setProfiles(updatedList);
    localStorage.setItem('watcher_profiles', JSON.stringify(updatedList));
    localStorage.setItem(`watcher_profile_${activeProfile.id}_details`, JSON.stringify(updatedProfile));
  };

  // Default tab should probably be home.
  // ProfileSelection is moved to be rendered when activeTab === 'profile' && !activeProfile.
  
  return (
    <div className="app-container">
      {/* Toast banner notification */}
      {notification && (
        <div className={`notification-banner ${notification.type}`}>
          {notification.type === 'success' ? '✓' : '⚠'} {notification.message}
        </div>
      )}

      {/* Navigation bar sidebar for desktop / bottom for mobile */}
      <nav className="navigation-bar">
        <div className="nav-items-container">
          {/* HOME TAB */}
          <button 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
            onMouseEnter={() => homeIconRef.current?.startAnimation()}
            onMouseLeave={() => homeIconRef.current?.stopAnimation()}
          >
            <HomeIcon ref={homeIconRef} size={22} />
          </button>

          {/* WATCHLIST TAB */}
          <button 
            className={`nav-item ${activeTab === 'watchlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('watchlist')}
            onMouseEnter={() => timerIconRef.current?.startAnimation()}
            onMouseLeave={() => timerIconRef.current?.stopAnimation()}
          >
            <TimerIcon ref={timerIconRef} size={22} />
          </button>

          {/* COLLECTION TAB */}
          <button 
            className={`nav-item ${activeTab === 'collection' ? 'active' : ''}`}
            onClick={() => setActiveTab('collection')}
            onMouseEnter={() => clapIconRef.current?.startAnimation()}
            onMouseLeave={() => clapIconRef.current?.stopAnimation()}
          >
            <ClapIcon ref={clapIconRef} size={22} />
          </button>

          {/* PROFILE/PROFIL TAB */}
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            onMouseEnter={() => userIconRef.current?.startAnimation()}
            onMouseLeave={() => userIconRef.current?.stopAnimation()}
          >
            <UserIcon ref={userIconRef} size={22} />
          </button>
        </div>
      </nav>

      {/* Centralized loader spinner */}
      {mediaLoading && (
        <div className="global-loader-overlay">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="global-spinner">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Caricamento dettagli...</span>
        </div>
      )}

      {/* Main content viewport */}
      <main className="main-content">
        {activeTab === 'home' && (
          <Discover 
            onSelectMedia={handleSelectMedia} 
            tmdbToken={tmdbToken}
            showNotification={showNotification}
            watchlist={watchlist}
            trackedItems={trackedItems}
            onAddToWatchlist={handleAddToWatchlist}
            onRemoveFromWatchlist={handleRemoveFromWatchlist}
            onNavigateToSettings={() => {
              setActiveTab('profile');
              setProfileSubPage('settings');
            }}
            onOpenCollectionModal={setCollectionModalMedia}
          />
        )}

        {activeTab === 'watchlist' && (
          <Watchlist 
            watchlist={watchlist} 
            onSelectCard={handleSelectMedia} 
            onNavigateToHome={() => setActiveTab('home')} 
          />
        )}

        {activeTab === 'collection' && (
          <MyList 
            trackedItems={trackedItems}
            onSelectCard={handleSelectMedia} 
          />
        )}

        {activeTab === 'profile' && !activeProfile && (
          <ProfileSelection 
            profiles={profiles} 
            onSelectProfile={handleSelectProfile} 
            onCreateProfile={handleCreateProfile} 
            onDeleteProfile={handleDeleteProfile} 
            googleClientId={googleClientId}
            googleAccessToken={googleAccessToken}
            onSetGoogleAccessToken={setGoogleAccessToken}
            requestGoogleToken={requestGoogleToken}
            onSaveGoogleClientId={(id) => {
              setGoogleClientId(id);
              localStorage.setItem('watcher_google_client_id', id);
            }}
          />
        )}

        {activeTab === 'profile' && activeProfile && (
          <Profile 
            profile={activeProfile}
            onSaveProfile={handleSaveProfile}
            onSwitchProfile={handleSwitchProfile}
            trackedItems={trackedItems} 
            onSelectCard={handleSelectMedia} 
            collections={collections}
            onSaveCollections={saveCollections}
            tmdbToken={tmdbToken}
            onSaveToken={handleSaveToken}
            themeColor={themeColor}
            onSaveThemeColor={handleSaveThemeColor}
            onImportData={handleImportData}
            onResetData={handleResetData}
            showNotification={showNotification}
            statsConfig={statsConfig}
            onSaveStatsConfig={handleSaveStatsConfig}
            initialSubPage={profileSubPage}
            onClearSubPage={() => setProfileSubPage(null)}
            onExportAll={handleExportAll}
            onImportAll={handleImportAll}
            googleClientId={googleClientId}
            onSaveGoogleClientId={(id) => {
              setGoogleClientId(id);
              localStorage.setItem('watcher_google_client_id', id);
            }}
            googleAccessToken={googleAccessToken}
            onSetGoogleAccessToken={setGoogleAccessToken}
            requestGoogleToken={requestGoogleToken}
            googleSyncStatus={googleSyncStatus}
            lastGoogleSync={lastGoogleSync}
            onSaveToGoogleDrive={handleSaveToGoogleDrive}
            onLoadFromGoogleDrive={handleLoadFromGoogleDrive}
          />
        )}
      </main>

      {/* Details bottom sheet modal */}
      {selectedMedia && (
        <DetailsModal 
          item={selectedMedia} 
          onClose={() => setSelectedMedia(null)} 
          onSave={handleSaveLog} 
          onRemove={handleRemoveLog}
          loggedInfo={trackedItems.find(i => i.id === selectedMedia.id)}
          inWatchlist={watchlist.some(i => i.id === selectedMedia.id)}
          onAddToWatchlist={handleAddToWatchlist}
          onRemoveFromWatchlist={handleRemoveFromWatchlist}
          onSelectMedia={handleSelectMedia}
          tmdbToken={tmdbToken}
          onOpenCollectionModal={setCollectionModalMedia}
        />
      )}

      {/* Add to Collection Modal Popup */}
      {collectionModalMedia && (
        <AddToCollectionModal
          item={collectionModalMedia}
          collections={collections}
          onSaveCollections={saveCollections}
          onClose={() => setCollectionModalMedia(null)}
          showNotification={showNotification}
        />
      )}
    </div>
  );
}
