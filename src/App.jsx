import React, { useState, useEffect, useRef } from 'react';
import Discover from './components/Discover';
import Watchlist from './components/Watchlist';
import MyList from './components/MyList';
import Profile from './components/Profile';
import DetailsModal from './components/DetailsModal';
import ProfileSelection from './components/ProfileSelection';
import { syncSaveProfileData, syncLoadProfileData } from './googleDriveHelper';
import { HomeIcon } from './components/icons/HomeIcon';
import { TimerIcon } from './components/icons/TimerIcon';
import { ClapIcon } from './components/icons/ClapIcon';
import { UserIcon } from './components/icons/UserIcon';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [trackedItems, setTrackedItems] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [tmdbToken, setTmdbToken] = useState('');
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [notification, setNotification] = useState(null);
  const [profileSubPage, setProfileSubPage] = useState(null);
  const [googleClientId, setGoogleClientId] = useState(localStorage.getItem('watcher_google_client_id') || '');
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [googleSyncStatus, setGoogleSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'success' | 'error'
  const [lastGoogleSync, setLastGoogleSync] = useState('');
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
        const defaultItems = [
          {
            id: "m-1",
            tmdbId: 508442,
            title: "Soul",
            type: "movie",
            poster: "https://image.tmdb.org/t/p/w342/hm58PHo18663gV2NyO95ZgY5g2y.jpg",
            backdrop: "https://image.tmdb.org/t/p/original/kf456ZqeC45jznmrzw2nB16n43K.jpg",
            rating: 4.5,
            platform: "cinema",
            watchDate: new Date().toISOString().split('T')[0],
            notes: "Spettacolo pomeridiano, animazione e colonna sonora capolavoro!"
          },
          {
            id: "s-1",
            tmdbId: 66732,
            title: "Stranger Things",
            type: "tv",
            poster: "https://image.tmdb.org/t/p/w342/49WJ21rrlUp7JU35iL67M87wZ7u.jpg",
            backdrop: "https://image.tmdb.org/t/p/original/56v2AfA62e5ty6g2zZ76uiTT2O2.jpg",
            rating: 5.0,
            platform: "netflix",
            watchDate: new Date().toISOString().split('T')[0],
            notes: "Completata la quarta stagione, finale fantastico."
          }
        ];
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
        const defaultWatchlist = [
          {
            id: "m-2",
            tmdbId: 438631,
            title: "Dune",
            type: "movie",
            year: "2021",
            imdbRating: "8.0",
            poster: "https://image.tmdb.org/t/p/w342/d5N051zLi7tT57W0W2ZCX6mE1Vz.jpg",
            backdrop: "https://image.tmdb.org/t/p/original/jyeUNS6t3j9d6P4w6CqW6qZk8F0.jpg"
          },
          {
            id: "s-2",
            tmdbId: 82856,
            title: "The Mandalorian",
            type: "tv",
            year: "2019",
            imdbRating: "8.7",
            poster: "https://image.tmdb.org/t/p/w342/e1T2Jb54oMvVEe286G4J6t4aD12.jpg",
            backdrop: "https://image.tmdb.org/t/p/original/o73wR1ZzT4525jTtw4aD1mE54b8.jpg"
          }
        ];
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
    const itemToRemove = watchlist.find(w => w.id === id);
    const newWatchlist = watchlist.filter(w => w.id !== id);
    saveWatchlist(newWatchlist);
    if (itemToRemove) {
      showNotification(`"${itemToRemove.title}" rimosso dalla Watchlist.`, "success");
    }
  };

  // Log or Update an item in the tracker (watched Collection)
  const handleSaveLog = (logData) => {
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
    setSelectedMedia(null); // close details modal
  };

  // Remove item from the tracker
  const handleRemoveLog = (id) => {
    const itemToRemove = trackedItems.find(i => i.id === id);
    const newItems = trackedItems.filter(i => i.id !== id);
    saveTrackedItems(newItems);
    setSelectedMedia(null); // close details modal
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
          tmdb_token: tmdbToken
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
        tmdb_token: tmdbToken
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
    setTrackedItems([]);
    setWatchlist([]);
    setTmdbToken('');
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
          tmdb_token: localStorage.getItem(`watcher_profile_${pId}_tmdb_token`) || ''
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

  // If no profile selected, display profile picker
  if (!activeProfile) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        {notification && (
          <div className={`notification-banner ${notification.type}`}>
            {notification.type === 'success' ? '✓' : '⚠'} {notification.message}
          </div>
        )}
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
      </div>
    );
  }

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
        <div className="nav-logo">Watcher</div>
        
        <div className="nav-items-container">
          {/* HOME TAB */}
          <button 
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
            onMouseEnter={() => homeIconRef.current?.startAnimation()}
            onMouseLeave={() => homeIconRef.current?.stopAnimation()}
          >
            <HomeIcon ref={homeIconRef} size={22} />
            <span>Home</span>
          </button>

          {/* WATCHLIST TAB */}
          <button 
            className={`nav-item ${activeTab === 'watchlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('watchlist')}
            onMouseEnter={() => timerIconRef.current?.startAnimation()}
            onMouseLeave={() => timerIconRef.current?.stopAnimation()}
          >
            <TimerIcon ref={timerIconRef} size={22} />
            <span>Watchlist</span>
          </button>

          {/* COLLECTION TAB */}
          <button 
            className={`nav-item ${activeTab === 'collection' ? 'active' : ''}`}
            onClick={() => setActiveTab('collection')}
            onMouseEnter={() => clapIconRef.current?.startAnimation()}
            onMouseLeave={() => clapIconRef.current?.stopAnimation()}
          >
            <ClapIcon ref={clapIconRef} size={22} />
            <span>Collection</span>
          </button>

          {/* PROFILE/PROFIL TAB */}
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            onMouseEnter={() => userIconRef.current?.startAnimation()}
            onMouseLeave={() => userIconRef.current?.stopAnimation()}
          >
            <UserIcon ref={userIconRef} size={22} />
            <span>Profilo</span>
          </button>
        </div>
      </nav>

      {/* Main content viewport */}
      <main className="main-content">
        {activeTab === 'home' && (
          <Discover 
            onSelectMedia={(item) => setSelectedMedia(item)} 
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
          />
        )}

        {activeTab === 'watchlist' && (
          <Watchlist 
            watchlist={watchlist} 
            onSelectCard={(item) => setSelectedMedia(item)} 
            onNavigateToHome={() => setActiveTab('home')} 
          />
        )}

        {activeTab === 'collection' && (
          <MyList 
            trackedItems={trackedItems} 
            onSelectCard={(item) => setSelectedMedia(item)} 
          />
        )}

        {activeTab === 'profile' && (
          <Profile 
            profile={activeProfile}
            onSaveProfile={handleSaveProfile}
            onSwitchProfile={handleSwitchProfile}
            trackedItems={trackedItems} 
            onSelectCard={(item) => setSelectedMedia(item)} 
            tmdbToken={tmdbToken}
            onSaveToken={handleSaveToken}
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
          onSelectMedia={setSelectedMedia}
          tmdbToken={tmdbToken}
        />
      )}
    </div>
  );
}
