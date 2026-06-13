import React, { useRef, useState, useEffect } from 'react';

// Robust CSV state machine parser that handles quotes and escapes
function parseCSV(text) {
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
    } else if (char === ',' && !inQuotes) {
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
  googleClientId,
  onSaveGoogleClientId,
  googleAccessToken,
  onSetGoogleAccessToken,
  requestGoogleToken,
  googleSyncStatus,
  lastGoogleSync,
  onSaveToGoogleDrive,
  onLoadFromGoogleDrive,
  onSwitchProfile,
  onBack
}) {
  const [clientIdInput, setClientIdInput] = useState(googleClientId);

  useEffect(() => {
    setClientIdInput(googleClientId);
  }, [googleClientId]);
  const fileInputRef = useRef(null);
  const tvTimeHistoryInputRef = useRef(null);
  const tvTimeWatchlistInputRef = useRef(null);

  const [showGoogleLinkModal, setShowGoogleLinkModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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

  const handleLinkGoogleSelect = (acc) => {
    onSaveProfile({
      isGoogleLinked: true,
      googleEmail: acc.email,
      avatar: acc.avatar
    });
    setShowGoogleLinkModal(false);
    showNotification("Profilo collegato a Google!", "success");
  };

  const handleLinkGoogleCustomSubmit = (e) => {
    e.preventDefault();
    const nameVal = e.target.googleName.value.trim();
    const emailVal = e.target.googleEmail.value.trim();
    if (!nameVal || !emailVal) return;
    
    handleLinkGoogleSelect({
      name: nameVal,
      email: emailVal,
      avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(nameVal)}&backgroundColor=b6e3f4`
    });
  };

  const handleUnlinkGoogle = () => {
    onSaveProfile({
      isGoogleLinked: false,
      googleEmail: null
    });
    showNotification("Profilo scollegato da Google.", "success");
  };

  const handleTvTimeImport = (e, target) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = parseCSV(text);
        if (rows.length < 2) {
          showNotification("Il file CSV è vuoto o non ha abbastanza righe.", "error");
          return;
        }

        const headers = rows[0].map(h => h.toLowerCase().trim().replace(/['"_\s-]/g, ''));
        
        // Find indices of relevant headers
        const titleIndex = rows[0].findIndex(h => {
          const clean = h.toLowerCase().trim().replace(/['"_\s-]/g, '');
          return ['showname', 'showtitle', 'title', 'tvshowname', 'movietitle', 'name'].includes(clean);
        });
        const dateIndex = rows[0].findIndex(h => {
          const clean = h.toLowerCase().trim().replace(/['"_\s-]/g, '');
          return ['updatedat', 'date', 'datewatched', 'watchedat', 'createdat', 'timestamp'].includes(clean);
        });

        if (titleIndex === -1) {
          showNotification("Impossibile trovare la colonna del titolo (es. 'show_name', 'title') nel CSV.", "error");
          return;
        }

        const dataRows = rows.slice(1).filter(r => r.length > titleIndex && r[titleIndex].trim() !== "");

        if (target === 'tracked') {
          // Group by title to count episodes (for seen_episodes.csv)
          const showGroups = {};
          dataRows.forEach(row => {
            const title = row[titleIndex].trim();
            const dateVal = dateIndex !== -1 && row[dateIndex] ? row[dateIndex].trim() : '';
            
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

          const importedItems = Object.entries(showGroups).map(([title, info]) => {
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

          if (importedItems.length === 0) {
            showNotification("Nessun elemento valido trovato da importare.", "error");
            return;
          }

          onImportData(importedItems, 'tracked');
          showNotification(`Importati con successo ${importedItems.length} show da TV Time!`, "success");
        } else {
          // watchlist (followed_shows.csv)
          const importedItems = dataRows.map(row => {
            const title = row[titleIndex].trim();
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

          if (uniqueItems.length === 0) {
            showNotification("Nessun elemento valido trovato da importare.", "error");
            return;
          }

          onImportData(uniqueItems, 'watchlist');
          showNotification(`Importati con successo ${uniqueItems.length} show nella watchlist!`, "success");
        }
      } catch (err) {
        showNotification("Errore durante il parsing del file CSV.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
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
          <button type="submit" className="btn-primary" style={{ width: 'auto', alignSelf: 'flex-start', padding: '10px 24px' }}>
            Salva Token
          </button>
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
        <h2>Icona dell'App (PWA)</h2>
        <p className="settings-description">
          Carica un'immagine per cambiare l'icona del sito. Questa sarà l'icona utilizzata quando aggiungi Watcher alla schermata Home del tuo telefono! L'impostazione è globale per questo dispositivo.
        </p>
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            '/logo.svg',
            ...(JSON.parse(localStorage.getItem('watcher_custom_icons') || '[]'))
          ].map((iconSrc, idx) => {
            const currentIcon = localStorage.getItem('watcher_app_icon_global') || '/logo.svg';
            const isActive = currentIcon === iconSrc;
            return (
              <div 
                key={idx}
                onClick={() => {
                  localStorage.setItem('watcher_app_icon_global', iconSrc);
                  import('../iconHelper.js').then(m => m.updateAppIcon(iconSrc)).catch(()=>{});
                  window.dispatchEvent(new Event('storage'));
                  showNotification('Icona impostata con successo!', 'success');
                }}
                style={{
                  width: 60, height: 60, borderRadius: '16px', overflow: 'hidden',
                  background: 'var(--bg-input)', border: isActive ? '3px solid var(--accent-cyan)' : '2px solid var(--border-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative'
                }}
                title="Seleziona Icona"
              >
                <img 
                  src={iconSrc} 
                  alt={`Icona ${idx}`} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = '/logo.svg'; }}
                />
                {idx > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const customIcons = JSON.parse(localStorage.getItem('watcher_custom_icons') || '[]');
                      const newIcons = customIcons.filter(ic => ic !== iconSrc);
                      localStorage.setItem('watcher_custom_icons', JSON.stringify(newIcons));
                      if (isActive) {
                        localStorage.setItem('watcher_app_icon_global', '/logo.svg');
                        import('../iconHelper.js').then(m => m.updateAppIcon('/logo.svg')).catch(()=>{});
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
              className="btn-outline"
              onClick={() => document.getElementById('appIconUpload').click()}
              style={{ width: 60, height: 60, borderRadius: '16px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}
              title="Carica Nuova Icona"
            >
              +
            </button>
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
          Formati consigliati: PNG quadrato o SVG. Max 5 icone personalizzate.
        </p>
      </div>

      {/* Google Link Panel */}
      <div className="settings-section">
        <h2>Account Collegati</h2>
        <p className="settings-description">
          Collega il tuo profilo ad un account Google per abilitare il login rapido.
        </p>
        
        {profile && profile.isGoogleLinked ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(66, 133, 244, 0.1)', border: '1px solid rgba(66, 133, 244, 0.25)', borderRadius: '12px', padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#fff', borderRadius: '50%', padding: '6px', display: 'flex' }}>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h4.02c2.35-2.16 3.7-5.34 3.7-8.75z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.02-3.13c-1.12.75-2.55 1.19-3.94 1.19-3.03 0-5.6-2.05-6.51-4.82H1.36v3.23C3.34 21.6 7.4 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.49 14.33c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18v-3.23H1.36C.49 8.5 0 10.19 0 12s.49 3.5 1.36 5.18l4.13-3.23z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.4 0 3.34 2.4 1.36 6.37l4.13 3.23c.91-2.77 3.48-4.85 6.51-4.85z"/>
                </svg>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-white)' }}>Collegato con Google</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-grey)' }}>{profile.googleEmail}</span>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-outline" 
              style={{ flex: 'none', padding: '8px 16px', fontSize: '0.8rem', border: '1px solid rgba(255,3,0,0.3)', color: 'var(--accent-red)' }}
              onClick={handleUnlinkGoogle}
            >
              Scollega
            </button>
          </div>
        ) : (
          <button 
            type="button" 
            className="btn-outline"
            onClick={() => {
              if (googleClientId) {
                requestGoogleToken(async (token) => {
                  try {
                    const { fetchGoogleUserInfo } = await import('../googleDriveHelper');
                    const userinfo = await fetchGoogleUserInfo(token);
                    handleLinkGoogleSelect({
                      name: userinfo.name,
                      email: userinfo.email,
                      avatar: userinfo.picture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(userinfo.name)}&backgroundColor=b6e3f4`
                    });
                  } catch (err) {
                    showNotification("Impossibile collegare l'account Google.", "error");
                  }
                });
              } else {
                setShowGoogleLinkModal(true);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              background: '#fff',
              color: '#1f1f1f',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h4.02c2.35-2.16 3.7-5.34 3.7-8.75z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.02-3.13c-1.12.75-2.55 1.19-3.94 1.19-3.03 0-5.6-2.05-6.51-4.82H1.36v3.23C3.34 21.6 7.4 24 12 24z"/>
              <path fill="#FBBC05" d="M5.49 14.33c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18v-3.23H1.36C.49 8.5 0 10.19 0 12s.49 3.5 1.36 5.18l4.13-3.23z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.4 0 3.34 2.4 1.36 6.37l4.13 3.23c.91-2.77 3.48-4.85 6.51-4.85z"/>
            </svg>
            Collega Account Google
          </button>
        )}

        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>Configurazione Google OAuth Client ID</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-grey)', marginBottom: '12px', lineHeight: 1.4 }}>
            Inserisci il tuo <strong>Google OAuth Client ID</strong> per autenticarti con il tuo vero account Google e salvare i dati su Google Drive. 
            Se lasciato vuoto, l'applicazione userà la modalità <strong>Sandbox simulata</strong>.
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <input
              type="text"
              className="custom-input"
              style={{ fontSize: '0.85rem', padding: '10px 14px' }}
              placeholder="es. xxxxxxxx.apps.googleusercontent.com"
              value={clientIdInput}
              onChange={(e) => setClientIdInput(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              style={{ width: 'auto', padding: '0 20px', fontSize: '0.85rem', flexShrink: 0 }}
              onClick={() => {
                onSaveGoogleClientId(clientIdInput.trim());
                showNotification("Google Client ID aggiornato!", "success");
              }}
            >
              Salva
            </button>
          </div>

          <button
            type="button"
            className="btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.75rem', width: 'auto', display: 'inline-flex', alignSelf: 'flex-start' }}
            onClick={() => setShowGuide(!showGuide)}
          >
            {showGuide ? 'Nascondi Guida di Configurazione' : 'Mostra Guida di Configurazione'}
          </button>

          {showGuide && (
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
              <strong style={{ color: 'var(--text-white)', display: 'block', marginBottom: '6px' }}>Come ottenere un Client ID Google:</strong>
              <ol style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Accedi alla <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)' }}>Google Cloud Console</a>.</li>
                <li>Crea un nuovo progetto per la tua istanza.</li>
                <li>Configura la <strong>Schermata consenso OAuth</strong> (seleziona tipo <em>Esterno</em>, e aggiungi lo scope <code>.../auth/drive.file</code> per salvare i dati su Drive).</li>
                <li>Vai su <strong>Credenziali</strong> &gt; <strong>Crea credenziali</strong> &gt; <strong>ID client OAuth</strong>.</li>
                <li>Seleziona <strong>Applicazione web</strong> come tipo di applicazione.</li>
                <li>Aggiungi alle <strong>Origini JavaScript autorizzate</strong>:
                  <ul style={{ paddingLeft: '14px', margin: '4px 0', listStyleType: 'disc', color: 'var(--text-white)' }}>
                    <li><code>http://localhost:5173</code> (per test locali)</li>
                    <li><code>https://&lt;tuo-username&gt;.github.io</code> (per GitHub Pages)</li>
                  </ul>
                </li>
                <li>Copia l'ID client generato e incollalo qui sopra, quindi clicca su Salva.</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Google Drive Sincronizzazione */}
      {profile && profile.isGoogleLinked && (
        <div className="settings-section">
          <h2>Sincronizzazione Google Drive</h2>
          <p className="settings-description">
            Salva ed effettua il ripristino dei dati del tuo profilo direttamente sul tuo account Google Drive personale.
            I dati verranno salvati in un file chiamato <code>watcher_backup_{profile.id}.json</code>.
          </p>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-grey)', display: 'block' }}>Stato Sincronizzazione:</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-white)' }}>
                  {googleSyncStatus === 'syncing' ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-cyan)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                      Sincronizzazione in corso...
                    </span>
                  ) : googleClientId ? (
                    <span style={{ color: 'var(--accent-green)' }}>Collegato a Google Drive (Reale)</span>
                  ) : (
                    <span style={{ color: 'var(--accent-orange)' }}>Attivo in modalità Sandbox (Locale)</span>
                  )}
                </span>
              </div>
              {lastGoogleSync && (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-grey)' }}>Ultimo salvataggio:</span>
                  <span style={{ fontSize: '0.8rem', display: 'block', fontWeight: 500 }}>
                    {new Date(lastGoogleSync).toLocaleString('it-IT')}
                  </span>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                className="btn-outline"
                disabled={googleSyncStatus === 'syncing'}
                onClick={() => onSaveToGoogleDrive()}
                style={{
                  background: 'rgba(62, 238, 252, 0.1)',
                  borderColor: 'rgba(62, 238, 252, 0.3)',
                  color: 'var(--accent-green)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Salva su Drive
              </button>
              
              <button
                type="button"
                className="btn-outline"
                disabled={googleSyncStatus === 'syncing'}
                onClick={() => {
                  if (window.confirm("Sei sicuro di voler caricare i dati da Google Drive? Questo sovrascriverà la tua lista locale attuale per questo profilo.")) {
                    onLoadFromGoogleDrive();
                  }
                }}
                style={{
                  background: 'rgba(44, 242, 255, 0.1)',
                  borderColor: 'rgba(44, 242, 255, 0.3)',
                  color: 'var(--accent-cyan)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 14 12 19 7 14" />
                  <line x1="12" y1="19" x2="12" y2="5" />
                </svg>
                Ripristina da Drive
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Google Link Modal */}
      {showGoogleLinkModal && (
        <div className="modal-overlay" onClick={() => setShowGoogleLinkModal(false)}>
          <div className="modal-content" style={{ maxWidth: '400px', padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '30px 24px', textAlign: 'center', position: 'relative' }}>
              
              <button className="modal-close-btn" style={{ top: '15px', right: '15px' }} onClick={() => setShowGoogleLinkModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              <div style={{ marginBottom: '24px' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" style={{ marginBottom: '12px' }}>
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.48 3.77v3.13h4.02c2.35-2.16 3.7-5.34 3.7-8.75z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.02-3.13c-1.12.75-2.55 1.19-3.94 1.19-3.03 0-5.6-2.05-6.51-4.82H1.36v3.23C3.34 21.6 7.4 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.49 14.33c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18v-3.23H1.36C.49 8.5 0 10.19 0 12s.49 3.5 1.36 5.18l4.13-3.23z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.24 0 12 0 7.4 0 3.34 2.4 1.36 6.37l4.13 3.23c.91-2.77 3.48-4.85 6.51-4.85z"/>
                </svg>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-white)', margin: '0 0 6px 0' }}>Scegli un account</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-grey)', margin: 0 }}>per collegarlo al tuo profilo</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', marginBottom: '20px' }}>
                {[
                  { name: 'Mario Rossi', email: 'mario.rossi@gmail.com', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Fred&backgroundColor=b6e3f4' },
                  { name: 'Laura Bianchi', email: 'laura.bianchi@gmail.com', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=ffdfb4' },
                  { name: 'Giovanni Verde', email: 'giovanni.verde@gmail.com', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=d6ffb7' }
                ].map(acc => (
                  <button 
                    key={acc.email}
                    type="button"
                    onClick={() => handleLinkGoogleSelect(acc)}
                    className="google-account-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-light)',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      color: 'var(--text-white)'
                    }}
                  >
                    <img src={acc.avatar} alt={acc.name} style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#fff' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{acc.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-grey)' }}>{acc.email}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', textAlign: 'left' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-grey)', display: 'block', marginBottom: '8px' }}>Oppure usa un altro account:</span>
                <form onSubmit={handleLinkGoogleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Nome Completo (es. Luca Neri)" 
                    className="custom-input" 
                    style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                    required 
                    name="googleName"
                  />
                  <input 
                    type="email" 
                    placeholder="Indirizzo Email" 
                    className="custom-input" 
                    style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                    required 
                    name="googleEmail"
                  />
                  <button type="submit" className="btn-primary" style={{ padding: '10px', fontSize: '0.85rem' }}>
                    Collega
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TV Time Import Panel */}
      <div className="settings-section">
        <h2>Importa da TV Time (CSV)</h2>
        <p className="settings-description">
          Carica i file CSV esportati da TV Time per migrare i tuoi dati. 
          Puoi importare la cronologia degli episodi visti (`seen_episodes.csv`) o gli show che segui (`followed_shows.csv`).
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
            accept=".csv"
            onChange={(e) => handleTvTimeImport(e, 'tracked')}
          />

          <input 
            type="file" 
            ref={tvTimeWatchlistInputRef} 
            style={{ display: 'none' }} 
            accept=".csv"
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
