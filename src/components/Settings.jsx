import React, { useRef, useState, useEffect } from 'react';
import { signIn, signOut, restoreSession, checkCloudBackupNewer, syncDataToCloud, fetchFromCloud, getClientId } from '../googleDriveHelper';

// Auto-detect CSV separator (comma, semicolon, tab)
function detectSeparator(text) {
  const firstLineEnd = text.indexOf('\n');
  const firstLine = firstLineEnd !== -1 ? text.substring(0, firstLineEnd) : text;
  
  let commaCount = 0;
  let semicolonCount = 0;
  let tabCount = 0;
  let inQuotes = false;
  
  for (let i = 0; i < firstLine.length; i++) {
    const char = firstLine[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes) {
      if (char === ',') commaCount++;
      else if (char === ';') semicolonCount++;
      else if (char === '\t') tabCount++;
    }
  }
  
  if (semicolonCount > commaCount && semicolonCount > tabCount) {
    return ';';
  }
  if (tabCount > commaCount && tabCount > semicolonCount) {
    return '\t';
  }
  return ',';
}

// Robust CSV state machine parser that handles quotes, escapes, and dynamic separator
function parseCSV(text, sep = ',') {
  const lines = [];
  let row = [""];
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === sep && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
}

// Recursively traverse JSON objects to find potential show records
function extractShowsFromJSON(obj) {
  const items = [];
  const titleKeys = [
    'showname', 'showtitle', 'title', 'tvshowname', 'movietitle', 'moviename', 
    'name', 'show', 'serie', 'titolo', 'originaltitle', 'originalname'
  ];
  const dateKeys = [
    'updatedat', 'date', 'datewatched', 'watchedat', 'createdat', 'timestamp', 
    'data', 'vistoil', 'creatoil', 'followedat', 'addedat', 'lastwatched', 'watchdate'
  ];
  const skipKeys = ['profile', 'user', 'account', 'settings', 'auth', 'metadata', 'configuration', 'config'];

  function traverse(item, parentKey = '') {
    if (!item) return;

    if (Array.isArray(item)) {
      item.forEach(subItem => traverse(subItem, parentKey));
      return;
    }

    if (typeof item === 'object') {
      const cleanParentKey = parentKey.toLowerCase().replace(/['"_\s-]/g, '');
      if (skipKeys.includes(cleanParentKey)) {
        return;
      }

      let title = null;
      let date = null;

      // First check if this object itself has title/date keys
      for (const k of Object.keys(item)) {
        const cleanKey = k.toLowerCase().replace(/['"_\s-]/g, '');
        if (titleKeys.includes(cleanKey) && typeof item[k] === 'string') {
          title = item[k];
        }
        if (dateKeys.includes(cleanKey) && (typeof item[k] === 'string' || typeof item[k] === 'number')) {
          date = String(item[k]);
        }
      }

      if (title && title.trim() !== '') {
        items.push({ title: title.trim(), date });
      } else {
        // If not a matching show object, traverse its children
        for (const k of Object.keys(item)) {
          const cleanKey = k.toLowerCase().replace(/['"_\s-]/g, '');
          if (!skipKeys.includes(cleanKey)) {
            traverse(item[k], k);
          }
        }
      }
    }
  }

  traverse(obj);
  return items;
}


export default function Settings({ 
  profile,
  onSaveProfile,
  tmdbToken, 
  onSaveToken, 
  themeColor,
  onSaveThemeColor,
  trackedItems, 
  onImportData, 
  onResetData, 
  showNotification,
  statsConfig,
  onSaveStatsConfig,
  onExportAll,
  onImportAll,
  onSwitchProfile,
  onBack
}) {
  const fileInputRef = useRef(null);
  const tvTimeHistoryInputRef = useRef(null);
  const tvTimeWatchlistInputRef = useRef(null);

  const [showIconGuide, setShowIconGuide] = useState(false);

  // Google Drive states
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [autoSync, setAutoSync] = useState(() => {
    return localStorage.getItem(`watcher_profile_${profile.id}_autosync`) !== 'false';
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const restored = await restoreSession();
        if (restored) setIsGoogleConnected(true);
      } catch (e) {
        console.error('Session restore failed', e);
      }
    };
    checkSession();
  }, []);

  const handleGoogleLogin = async () => {
    console.log("Button clicked! handleGoogleLogin started");
    try {
      console.log("Calling signIn()...");
      await signIn();
      console.log("signIn() finished");
      setIsGoogleConnected(true);
      
      showNotification('Controllo backup in corso...', 'info');
      const backupInfo = await checkCloudBackupNewer(profile.id);
      
      if (backupInfo && backupInfo.hasCloudBackup && backupInfo.isNewer) {
        showNotification(`Attenzione: nel cloud è presente un backup del ${backupInfo.cloudDate}, che è più recente dei tuoi dati locali. Ti consigliamo di scaricarlo.`, 'warning');
      } else {
        showNotification('Account Google collegato correttamente!', 'success');
      }
    } catch (e) {
      console.error(e);
      showNotification('Login fallito: ' + (e.message || e), 'error');
    }
  };

  const handleGoogleLogout = async () => {
    try {
      signOut();
      setIsGoogleConnected(false);
      showNotification('Disconnesso da Google Drive.');
    } catch (e) { console.error(e); }
  };

  const handleSyncData = async (direction) => {
    if (!isGoogleConnected) return showNotification('Connettiti prima a Google Drive.', 'error');

    try {
      if (direction === 'push') {
        showNotification('Caricamento dati in corso...', 'info');
        await syncDataToCloud(profile.id, trackedItems, JSON.parse(localStorage.getItem(`watcher_profile_${profile.id}_watchlist`)));
        showNotification('Dati sincronizzati con successo su Drive!', 'success');
      } else {
        showNotification('Scaricamento dati in corso...', 'info');
        const backupData = await fetchFromCloud(profile.id);
        if (backupData) {
            onImportData(backupData.trackedItems || []);
            // Seleziona anche la watchlist se l'architettura lo permette (gestita separatamente in questa app)
            if (backupData.watchlist) {
                localStorage.setItem(`watcher_profile_${profile.id}_watchlist`, JSON.stringify(backupData.watchlist));
            }
            showNotification('Dati scaricati da Drive e importati con successo!', 'success');
        } else {
            showNotification('Nessun backup trovato su Drive per questo profilo.', 'error');
        }
      }
    } catch (e) {
      showNotification('Sync fallito: ' + e.message, 'error');
    }
  };

  const handleToggleAutoSync = (e) => {
    const val = e.target.checked;
    setAutoSync(val);
    localStorage.setItem(`watcher_profile_${profile.id}_autosync`, val);
  };

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    const token = e.target.tokenInput.value.trim();
    onSaveToken(token);
    showNotification("Impostazioni salvate con successo!", "success");
  };

  const handleExport = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trackedItems, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `watcher-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification("Backup scaricato con successo!", "success");
    } catch (err) {
      showNotification("Errore durante l'esportazione.", "error");
    }
  };

  const handleExportAllClick = () => {
    try {
      if (!onExportAll) return;
      const backup = onExportAll();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `watcher-full-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showNotification("Backup globale esportato con successo!", "success");
    } catch (err) {
      showNotification("Errore durante l'esportazione globale.", "error");
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (importedData && importedData.type === 'watcher_backup_all') {
          if (onImportAll) {
            onImportAll(importedData);
          }
        } else if (Array.isArray(importedData)) {
          // Perform basic check of properties
          const isValid = importedData.every(item => item.id && item.title && item.platform && item.rating !== undefined);
          if (isValid) {
            onImportData(importedData);
            showNotification("Backup importato con successo!", "success");
          } else {
            showNotification("Il file JSON non sembra contenere un formato valido.", "error");
          }
        } else {
          showNotification("Il backup deve contenere un array di elementi o un backup globale.", "error");
        }
      } catch (err) {
        showNotification("Errore di decodifica del file JSON.", "error");
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = null;
  };



  const handleTvTimeImport = (e, target) => {
    const file = e.target.files[0];
    if (!file) return;

    const processExtractedItems = (extracted, targetType) => {
      if (targetType === 'tracked') {
        // Group by title to count episodes (for seen_episodes.csv)
        const showGroups = {};
        extracted.forEach(item => {
          const title = item.title;
          const dateVal = item.date || '';
          
          if (!showGroups[title]) {
            showGroups[title] = {
              episodesCount: 0,
              dates: []
            };
          }
          showGroups[title].episodesCount++;
          if (dateVal) {
            showGroups[title].dates.push(dateVal);
          }
        });

        return Object.entries(showGroups).map(([title, info]) => {
          let latestDate = new Date().toISOString().split('T')[0];
          if (info.dates.length > 0) {
            try {
              const parsedDates = info.dates.map(d => new Date(d)).filter(d => !isNaN(d.getTime()));
              if (parsedDates.length > 0) {
                const maxDate = new Date(Math.max(...parsedDates));
                latestDate = maxDate.toISOString().split('T')[0];
              }
            } catch (_) {}
          }

          const safeId = `tvtime-tr-${encodeURIComponent(title.toLowerCase()).replace(/%/g, '')}-${Math.random().toString(36).substr(2, 9)}`;
          return {
            id: safeId,
            tmdbId: null,
            title: title,
            type: "tv",
            poster: "",
            backdrop: "",
            rating: 5.0,
            platform: "TV Time",
            watchDate: latestDate,
            notes: `Importato da TV Time (${info.episodesCount} episodi visti)`
          };
        });
      } else {
        // watchlist (followed_shows.csv)
        const importedItems = extracted.map(item => {
          const title = item.title;
          const safeId = `tvtime-wl-${encodeURIComponent(title.toLowerCase()).replace(/%/g, '')}-${Math.random().toString(36).substr(2, 9)}`;
          return {
            id: safeId,
            tmdbId: null,
            title: title,
            type: "tv",
            poster: "",
            backdrop: "",
            year: "",
            imdbRating: "0.0"
          };
        });

        // De-duplicate watchlist items
        const uniqueItems = [];
        const seenTitles = new Set();
        importedItems.forEach(item => {
          const cleanTitle = item.title.toLowerCase();
          if (!seenTitles.has(cleanTitle)) {
            seenTitles.add(cleanTitle);
            uniqueItems.push(item);
          }
        });
        return uniqueItems;
      }
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let text = event.target.result;
        if (text.startsWith('\ufeff')) {
          text = text.substring(1);
        }

        const trimmedText = text.trim();
        let isJson = false;
        let importedItems = [];

        if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
          try {
            const jsonObj = JSON.parse(trimmedText);
            isJson = true;
            
            const extracted = extractShowsFromJSON(jsonObj);
            if (extracted.length === 0) {
              showNotification("Nessun elemento valido trovato nel file JSON.", "error");
              return;
            }
            
            importedItems = processExtractedItems(extracted, target);
          } catch (jsonErr) {
            console.error("Failed to parse as JSON, falling back to CSV:", jsonErr);
          }
        }

        if (!isJson) {
          const separator = detectSeparator(text);
          const rows = parseCSV(text, separator);
          if (rows.length < 2) {
            showNotification("Il file CSV è vuoto o non ha abbastanza righe.", "error");
            return;
          }

          const headers = rows[0].map(h => h.toLowerCase().trim().replace(/['"_\s-]/g, ''));
          
          // Find indices of relevant headers
          const titleIndex = rows[0].findIndex(h => {
            const clean = h.toLowerCase().trim().replace(/['"_\s-]/g, '');
            return [
              'showname', 'showtitle', 'title', 'tvshowname', 'movietitle', 'moviename', 
              'name', 'show', 'serie', 'titolo', 'originaltitle', 'originalname'
            ].includes(clean);
          });
          const dateIndex = rows[0].findIndex(h => {
            const clean = h.toLowerCase().trim().replace(/['"_\s-]/g, '');
            return [
              'updatedat', 'date', 'datewatched', 'watchedat', 'createdat', 'timestamp', 
              'data', 'vistoil', 'creatoil', 'followedat', 'addedat', 'lastwatched', 'watchdate'
            ].includes(clean);
          });

          if (titleIndex === -1) {
            showNotification("Impossibile trovare la colonna del titolo (es. 'show_name', 'title') nel CSV.", "error");
            return;
          }

          const dataRows = rows.slice(1).filter(r => r.length > titleIndex && r[titleIndex].trim() !== "");
          const extracted = dataRows.map(row => {
            const title = row[titleIndex].trim();
            const dateVal = dateIndex !== -1 && row[dateIndex] ? row[dateIndex].trim() : '';
            return { title, date: dateVal };
          });

          importedItems = processExtractedItems(extracted, target);
        }

        if (importedItems.length === 0) {
          showNotification("Nessun elemento valido trovato da importare.", "error");
          return;
        }

        onImportData(importedItems, target === 'tracked' ? 'tracked' : 'watchlist');
        
        if (target === 'tracked') {
          showNotification(`Importati con successo ${importedItems.length} show da TV Time!`, "success");
        } else {
          showNotification(`Importati con successo ${importedItems.length} show nella watchlist!`, "success");
        }
      } catch (err) {
        console.error("Error importing file:", err);
        showNotification("Errore durante l'importazione del file.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', alignItems: 'center', gap: '16px', 
        position: 'sticky', top: 0, zIndex: 100,
        padding: '20px 0 10px 0', marginTop: '-20px', marginBottom: '8px',
        background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        {onBack && (
          <button onClick={onBack}
            style={{ 
              background: 'var(--bg-deep)', border: '1px solid var(--border-light)', 
              borderRadius: '50%', width: '40px', height: '40px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', color: 'var(--text-white)',
              flexShrink: 0
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}
        <h1 className="gradient-text-title" style={{ margin: 0 }}>
          Impostazioni e <span>Backup</span>
        </h1>
      </div>
      <p className="subtitle-desc">Configura le chiavi API ed esporta o importa la tua lista di visione.</p>

      {/* API Key Panel */}
      <div className="settings-section">
        <h2>Chiave API The Movie Database (TMDB)</h2>
        <p className="settings-description">
          L'inserimento di un <strong>Token di Accesso in Lettura di TMDB</strong> sblocca la ricerca live 
          e i fornitori di streaming JustWatch in tempo reale. Senza token, l'app funzionerà offline 
          utilizzando il catalogo di esempio.
        </p>
        <form onSubmit={handleTokenSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="tokenInput">TMDB Read Access Token (Bearer):</label>
            <textarea 
              id="tokenInput"
              name="tokenInput"
              className="custom-input"
              rows="3"
              placeholder="Inserisci il token di lettura bearer (inizia tipicamente con eyJ...)"
              defaultValue={tmdbToken}
              style={{ fontFamily: 'monospace', fontSize: '0.8rem', resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '10px 24px' }}>
              Salva Token
            </button>
            <button 
              type="button" 
              className="btn-outline" 
              style={{ width: 'auto', padding: '10px 24px' }}
              onClick={() => {
                const defaultKey = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIwZDQ0ZTcyMzdjMTI0OWIwYTJmZDhjN2Y3ZmFmMTNmMiIsIm5iZiI6MTc3NTk1MDYzOS43Nywic3ViIjoiNjlkYWRiMmY3MTRmOWUxNmJkNzBhMzA4Iiwic2NvcGVzIjpbImFwaV9yZWFkIl0sInZlcnNpb24iOjF9.c5Rq_7D6KrJ1EgsFwxONoo_6R6TQ-ddf-pRxGiPCZN4";
                document.getElementById('tokenInput').value = defaultKey;
                onSaveToken(defaultKey);
                showNotification("Chiave di default caricata e salvata!", "success");
              }}
            >
              Chiave di default
            </button>
          </div>
        </form>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
          * Puoi ottenere un token di accesso gratuito registrando un account su <a href="https://www.themoviedb.org/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>themoviedb.org</a>, andando in Impostazioni &gt; API e generando una chiave API per sviluppatori.
        </p>

        <div style={{
          background: 'rgba(138, 20, 255, 0.1)',
          border: '1px solid rgba(138, 20, 255, 0.25)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginTop: '14px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <span style={{ fontSize: '1.2rem', lineHeight: '1.2' }}>ℹ️</span>
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '0.85rem', color: 'var(--text-white)', fontWeight: 600 }}>Integrazione JustWatch API</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-grey)', lineHeight: '1.4' }}>
              JustWatch non fornisce chiavi API pubbliche gratuite. I dati di streaming per l'Italia sono tuttavia inclusi 
              automaticamente all'interno delle API di TMDB. Configurando il tuo Token TMDB Bearer qui sopra, abiliterai 
              automaticamente anche i canali di streaming di JustWatch per ogni film e serie TV.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Config Panel */}
      <div className="settings-section">
        <h2>Personalizzazione Statistiche Profilo</h2>
        <p className="settings-description">
          Scegli quali statistiche visualizzare nella pagina profilo e in che ordine.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          {(statsConfig || []).map((stat, index) => (
            <div key={stat.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--bg-input)', padding: '10px 16px', borderRadius: '8px',
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => {
                    const newConfig = [...statsConfig];
                    newConfig[index].visible = !newConfig[index].visible;
                    onSaveStatsConfig(newConfig);
                  }}
                  style={{
                    width: 44, padding: '4px 0', borderRadius: '20px', cursor: 'pointer',
                    background: stat.visible ? 'rgba(44,242,255,0.15)' : 'var(--bg-deep)',
                    border: `1px solid ${stat.visible ? 'var(--accent-cyan)' : 'var(--text-muted)'}`,
                    color: stat.visible ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    fontSize: '0.75rem', fontWeight: 600, transition: 'var(--transition-smooth)'
                  }}
                >
                  {stat.visible ? 'ON' : 'OFF'}
                </button>
                <span style={{ color: stat.visible ? 'var(--text-white)' : 'var(--text-grey)', fontWeight: 500, fontSize: '0.9rem' }}>
                  {stat.label}
                </span>
              </div>
              
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  disabled={index === 0}
                  onClick={() => {
                    const newConfig = [...statsConfig];
                    [newConfig[index - 1], newConfig[index]] = [newConfig[index], newConfig[index - 1]];
                    onSaveStatsConfig(newConfig);
                  }}
                  style={{
                    background: 'none', border: 'none', color: index === 0 ? 'var(--border-light)' : 'var(--text-grey)',
                    cursor: index === 0 ? 'default' : 'pointer', padding: '4px'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="18 15 12 9 6 15"/>
                  </svg>
                </button>
                <button
                  disabled={index === statsConfig.length - 1}
                  onClick={() => {
                    const newConfig = [...statsConfig];
                    [newConfig[index + 1], newConfig[index]] = [newConfig[index], newConfig[index + 1]];
                    onSaveStatsConfig(newConfig);
                  }}
                  style={{
                    background: 'none', border: 'none', color: index === statsConfig.length - 1 ? 'var(--border-light)' : 'var(--text-grey)',
                    cursor: index === statsConfig.length - 1 ? 'default' : 'pointer', padding: '4px'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Theme Color Selection Panel */}
      <div className="settings-section">
        <h2>Colore Principale (Tema)</h2>
        <p className="settings-description">
          Scegli il colore di accento principale che verrà utilizzato per i bottoni, i link e le icone attive.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
          {[
            { label: 'Celeste', value: '#3eeefc' },
            { label: 'Blu', value: '#2c71ff' },
            { label: 'Viola', value: '#8a14ff' },
            { label: 'Rosa', value: '#ff2c9c' },
            { label: 'Rosso', value: '#ff0300' },
            { label: 'Arancione', value: '#ff9f0a' },
            { label: 'Giallo', value: '#fcf403' },
            { label: 'Verde', value: '#3efc81' }
          ].map(colorOption => (
            <button
              key={colorOption.value}
              onClick={() => {
                onSaveThemeColor(colorOption.value);
                showNotification(`Colore tema impostato su ${colorOption.label}`, 'success');
              }}
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: colorOption.value,
                border: themeColor === colorOption.value ? '3px solid #fff' : '2px solid transparent',
                cursor: 'pointer',
                boxShadow: themeColor === colorOption.value ? `0 0 15px ${colorOption.value}80` : 'none',
                transition: 'var(--transition-smooth)'
              }}
              title={colorOption.label}
            />
          ))}
        </div>
      </div>

      {/* App Icon Selection Panel */}
      <div className="settings-section">
        <h2>Icona dell'App</h2>
        <p className="settings-description">
          Carica un'immagine per cambiare l'icona del sito. Questa sarà l'icona utilizzata quando aggiungi Watcher alla schermata Home del tuo telefono! L'impostazione è globale per questo dispositivo.
        </p>
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          {[
            'logo.png',
            ...Array.from({ length: 11 }, (_, i) => `${i + 1}.png`),
            ...(JSON.parse(localStorage.getItem('watcher_custom_icons') || '[]'))
          ].map((iconSrc, idx) => {
            const rawCurrent = localStorage.getItem('watcher_app_icon_global') || 'logo.png';
            const isActive = rawCurrent === iconSrc || rawCurrent === `/${iconSrc}`;
            const displaySrc = iconSrc.startsWith('data:') 
              ? iconSrc 
              : `${import.meta.env.BASE_URL}${iconSrc.startsWith('/') ? iconSrc.slice(1) : iconSrc}`;
              
            return (
              <div 
                key={idx}
                onClick={(e) => {
                  const saveVal = iconSrc.startsWith('data:') ? iconSrc : (iconSrc.startsWith('/') ? iconSrc.slice(1) : iconSrc);
                  localStorage.setItem('watcher_app_icon_global', saveVal);
                  import('../iconHelper.js').then(m => m.updateAppIcon(saveVal)).catch(()=>{});
                  
                  // Force a re-render of this node by updating a dummy attribute, or dispatching an event
                  e.currentTarget.style.border = '3px solid var(--accent-cyan)';
                  e.currentTarget.style.boxShadow = '0 0 15px var(--accent-cyan)40';
                  
                  // For a real react re-render we can just fire storage event and if App listens to it, great.
                  // But since Settings doesn't listen, we manually traverse siblings to remove border
                  if (e.currentTarget.parentNode) {
                    Array.from(e.currentTarget.parentNode.children).forEach(child => {
                      if (child !== e.currentTarget && child.tagName === 'DIV') {
                        child.style.border = '2px solid var(--border-light)';
                        child.style.boxShadow = 'none';
                      }
                    });
                  }
                  
                  window.dispatchEvent(new Event('storage'));
                  showNotification('Icona impostata con successo!', 'success');
                }}
                style={{
                  width: 60, height: 60, borderRadius: '16px', overflow: 'hidden',
                  background: 'var(--bg-input)', border: isActive ? '3px solid var(--accent-cyan)' : '2px solid var(--border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative',
                  boxShadow: isActive ? '0 0 15px var(--accent-cyan)40' : 'none'
                }}
                title="Seleziona Icona"
              >
                <img 
                  src={displaySrc} 
                  alt={`Icona ${idx}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = `${import.meta.env.BASE_URL}logo.png`; }}
                />
                {idx > 11 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const customIcons = JSON.parse(localStorage.getItem('watcher_custom_icons') || '[]');
                      const newIcons = customIcons.filter(ic => ic !== iconSrc);
                      localStorage.setItem('watcher_custom_icons', JSON.stringify(newIcons));
                      if (isActive) {
                        localStorage.setItem('watcher_app_icon_global', 'logo.png');
                        import('../iconHelper.js').then(m => m.updateAppIcon('logo.png')).catch(()=>{});
                        window.dispatchEvent(new Event('storage'));
                      }
                      window.dispatchEvent(new Event('storage'));
                    }}
                    style={{
                      position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', 
                      border: 'none', borderRadius: '50%', width: 20, height: 20, 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', cursor: 'pointer', padding: 0
                    }}
                    title="Elimina"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <input
              type="file"
              id="appIconUpload"
              accept="image/png, image/jpeg, image/svg+xml"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async (event) => {
                  const base64Icon = event.target.result;
                  const customIcons = JSON.parse(localStorage.getItem('watcher_custom_icons') || '[]');
                  if (!customIcons.includes(base64Icon)) {
                    customIcons.push(base64Icon);
                    if (customIcons.length > 5) customIcons.shift(); // Keep max 5
                    localStorage.setItem('watcher_custom_icons', JSON.stringify(customIcons));
                  }
                  localStorage.setItem('watcher_app_icon_global', base64Icon);
                  try {
                    const { updateAppIcon } = await import('../iconHelper.js');
                    updateAppIcon(base64Icon);
                  } catch(e) {}
                  showNotification('Icona aggiornata con successo! Aggiungi ora l\'app alla Home.', 'success');
                  e.target.value = null;
                  window.dispatchEvent(new Event('storage'));
                };
                reader.readAsDataURL(file);
              }}
            />
            <button 
              onClick={() => document.getElementById('appIconUpload').click()}
              style={{
                width: 60, height: 60, borderRadius: '16px', padding: 0, 
                background: 'var(--bg-input)', border: '2px dashed var(--border-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: 'var(--text-grey)', cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              title="Carica Nuova Icona"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px', marginBottom: '8px' }}>
          Formati consigliati: PNG quadrato o JPEG. Max 5 icone personalizzate.
        </p>
        <button
          type="button"
          className="btn-outline"
          style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', display: 'inline-flex', alignSelf: 'flex-start', marginTop: '8px' }}
          onClick={() => setShowIconGuide(!showIconGuide)}
        >
          {showIconGuide ? 'Nascondi guida su come cambiare icona' : 'Mostra guida su come cambiare icona'}
        </button>

        {showIconGuide && (
          <div style={{
            textAlign: 'left',
            fontSize: '0.8rem',
            color: 'var(--text-grey)',
            marginTop: '12px',
            padding: '14px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '8px',
            border: '1px dashed var(--border-light)',
            lineHeight: '1.5'
          }}>
            <strong style={{ color: 'var(--text-white)', display: 'block', marginBottom: '6px' }}>Guida per cambiare l'icona dell'applicazione:</strong>
            <p style={{ margin: '0 0 10px 0' }}>
              Per fare in modo che l'icona scelta compaia correttamente sul desktop del computer o sulla schermata Home del tuo dispositivo mobile, segui questi passaggi:
            </p>
            <ol style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>
                Scegli una delle icone proposte sopra o caricane una personalizzata usando il pulsante <strong>"+"</strong>.
              </li>
              <li>
                <strong style={{ color: 'var(--accent-cyan)' }}>Nota Importante:</strong> L'icona dell'app deve essere selezionata <strong>prima</strong> di creare il collegamento o installare l'app tramite il browser.
              </li>
              <li>
                Dopo aver selezionato la nuova icona, apri il menu del browser (i tre puntini in alto a destra) e seleziona <strong>"Installa Watcher"</strong> o <strong>"Aggiungi a schermata Home / Crea scorciatoia"</strong>.
              </li>
              <li>
                Se l'applicazione è già installata sul tuo dispositivo con una vecchia icona, per aggiornarla dovrai prima rimuovere/disinstallare la scorciatoia esistente, e poi ricrearla/reinstallarla dopo aver selezionato la nuova icona.
              </li>
            </ol>
          </div>
        )}
      </div>

      <div className="settings-section">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>☁️ Google Drive Sync</h3>

        {!isGoogleConnected ? (
          <div style={{ padding: '20px 0' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-grey)', marginBottom: '24px', lineHeight: 1.4, textAlign: 'left' }}>
              Collega il tuo account Google per sincronizzare le serie e i film aggiunti su tutti i tuoi dispositivi (salvataggio su Google Drive).
            </p>
            <div style={{ textAlign: 'center' }}>
              <button 
                onClick={handleGoogleLogin}
                style={{
                  background: '#4285F4', 
                  color: 'white', 
                  border: 'none', 
                  padding: '12px 24px', 
                  borderRadius: '12px', 
                  fontSize: '16px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z" fill="#fff"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff"/></svg>
                Connetti Google Drive
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                <span style={{ width: '10px', height: '10px', background: 'currentColor', borderRadius: '50%' }}></span>
                Account Collegato
              </div>
              <button 
                onClick={handleGoogleLogout}
                style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-white)', padding: '6px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px' }}
              >
                Disconnetti
              </button>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔄 Sincronizzazione Automatica
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-grey)' }}>
                  Carica le modifiche su Drive pochi secondi dopo ogni cambiamento.
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '24px' }}>
                <input 
                  type="checkbox" 
                  checked={autoSync} 
                  onChange={handleToggleAutoSync}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
                  backgroundColor: autoSync ? 'var(--accent-cyan)' : '#ccc', 
                  transition: '.4s', borderRadius: '24px'
                }}></span>
                <span style={{
                  position: 'absolute', height: '16px', width: '16px', left: '4px', bottom: '4px', 
                  backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                  transform: autoSync ? 'translateX(16px)' : 'translateX(0)'
                }}></span>
              </label>
            </div>

            <div>
              <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📑 Dati Watcher
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-grey)', marginBottom: '12px' }}>
                Sincronizza le serie, film, e watchlist sul cloud.
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => handleSyncData('push')} 
                  style={{ flex: 1, padding: '12px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-white)', border: '1px solid var(--border-light)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                  ⬆️ Backup su drive
                </button>
                <button 
                  onClick={() => handleSyncData('pull')} 
                  style={{ flex: 1, padding: '12px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-white)', border: '1px solid var(--border-light)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
                >
                  ⬇️ Download da Drive
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Import / Export Backup Panel */}
      <div className="settings-section">
        <h2>Gestione dei Dati (Backup JSON)</h2>
        <p className="settings-description">
          Tutti i film e le serie TV che segni come visti vengono salvati localmente sul browser.
          Per sicurezza o per trasferire i dati su un altro dispositivo, puoi esportarli in un file JSON o importarli nuovamente.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-white)' }}>Profilo Corrente ({trackedItems.length} elementi)</h4>
            <div className="settings-buttons" style={{ marginTop: 0 }}>
              <button className="btn-outline" onClick={handleExport}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Esporta Profilo
              </button>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-white)' }}>Tutti i Profili (Backup Globale)</h4>
            <div className="settings-buttons" style={{ marginTop: 0 }}>
              <button className="btn-outline" onClick={handleExportAllClick}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                Esporta Tutto (JSON)
              </button>

              <button className="btn-outline" onClick={() => fileInputRef.current?.click()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 14 12 19 7 14"></polyline>
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                </svg>
                Importa Backup (JSON)
              </button>
            </div>
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".json"
          onChange={handleImport}
        />
      </div>



      {/* TV Time Import Panel */}
      <div className="settings-section">
        <h2>Importa da TV Time (CSV / JSON)</h2>
        <p className="settings-description">
          Carica i file CSV o JSON esportati da TV Time per migrare i tuoi dati. 
          Puoi importare la cronologia degli episodi visti (`seen_episodes.csv` o JSON) o gli show che segui (`followed_shows.csv` o JSON).
        </p>
        <div className="settings-buttons">
          <button className="btn-outline" onClick={() => tvTimeHistoryInputRef.current?.click()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            Cronologia Visti
          </button>

          <button className="btn-outline" onClick={() => tvTimeWatchlistInputRef.current?.click()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}>
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            Watchlist
          </button>

          <input 
            type="file" 
            ref={tvTimeHistoryInputRef} 
            style={{ display: 'none' }} 
            accept=".csv,.json"
            onChange={(e) => handleTvTimeImport(e, 'tracked')}
          />

          <input 
            type="file" 
            ref={tvTimeWatchlistInputRef} 
            style={{ display: 'none' }} 
            accept=".csv,.json"
            onChange={(e) => handleTvTimeImport(e, 'watchlist')}
          />
        </div>
      </div>

      {/* Session / Switch Profile Panel */}
      <div className="settings-section">
        <h2>Sessione e Profilo</h2>
        <p className="settings-description">
          Disconnettiti dal profilo corrente per tornare alla schermata di selezione e passare a un altro utente.
        </p>
        <button 
          type="button"
          className="btn-outline" 
          style={{ width: 'auto', padding: '10px 24px', borderColor: 'var(--border-light)', color: 'var(--text-white)' }}
          onClick={onSwitchProfile}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
            <path d="M16 17l5-5-5-5M21 12H9M9 21H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" />
          </svg>
          Disconnetti (Cambia Profilo)
        </button>
      </div>

      {/* Dangerous Operations Panel */}
      <div className="settings-section" style={{ borderColor: 'rgba(255, 3, 0, 0.2)' }}>
        <h2 style={{ color: 'var(--accent-red)' }}>Operazioni Pericolose</h2>
        <p className="settings-description">
          Ripristina completamente l'applicazione. Questa azione eliminerà permanentemente 
          tutti gli elementi salvati nella tua lista e rimuoverà la chiave API impostata. 
          Questa operazione non può essere annullata.
        </p>
        <button 
          className="btn-primary btn-delete" 
          style={{ width: 'auto', padding: '10px 24px' }}
          onClick={() => {
            if (window.confirm("Sei sicuro di voler eliminare tutti i dati e le chiavi salvate? Questa operazione è permanente.")) {
              onResetData();
            }
          }}
        >
          Cancella Tutto
        </button>
      </div>
    </div>
  );
}
