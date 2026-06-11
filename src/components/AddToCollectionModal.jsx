import { useState } from 'react';

export default function AddToCollectionModal({ item, collections, onSaveCollections, onClose, showNotification }) {
  const [newCollectionName, setNewCollectionName] = useState('');

  const handleToggleCollection = (colId) => {
    const updated = collections.map(col => {
      if (col.id === colId) {
        const exists = col.items.some(i => i.id === item.id);
        if (exists) {
          showNotification(`Rimosso da "${col.name}"`, 'success');
          return {
            ...col,
            items: col.items.filter(i => i.id !== item.id)
          };
        } else {
          showNotification(`Aggiunto a "${col.name}"`, 'success');
          return {
            ...col,
            items: [...col.items, item]
          };
        }
      }
      return col;
    });
    onSaveCollections(updated);
  };

  const handleCreateCollection = (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    if (collections.some(c => c.name.toLowerCase() === newCollectionName.trim().toLowerCase())) {
      showNotification('Una collezione con questo nome esiste già!', 'error');
      return;
    }

    const newCol = {
      id: `col-${Date.now()}`,
      name: newCollectionName.trim(),
      items: [item]
    };

    onSaveCollections([...collections, newCol]);
    setNewCollectionName('');
    showNotification(`Collezione "${newCol.name}" creata e film aggiunto!`, 'success');
  };

  return (
    <div className="lp-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="lp-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="lp-header">
          <span className="lp-title">Aggiungi a una Collezione</span>
          <button className="lp-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="lp-section" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            {item.poster ? (
              <img src={item.poster} alt={item.title} style={{ width: '45px', borderRadius: '6px' }} />
            ) : (
              <div style={{ width: '45px', height: '68px', borderRadius: '6px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎬</div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.title}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-grey)' }}>
                {item.year} · {item.type === 'movie' ? 'Film' : 'Serie TV'}
              </div>
            </div>
          </div>
        </div>

        <div className="lp-section" style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
          <div className="lp-label" style={{ marginBottom: '10px' }}>Le tue collezioni</div>
          {collections.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '10px 0', textAlign: 'center' }}>
              Non hai ancora creato nessuna collezione.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {collections.map(col => {
                const inCol = col.items.some(i => i.id === item.id);
                return (
                  <button
                    key={col.id}
                    onClick={() => handleToggleCollection(col.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      background: inCol ? 'rgba(62, 238, 252, 0.1)' : 'var(--bg-input)',
                      border: `1.5px solid ${inCol ? 'var(--accent-green)' : 'var(--border-light)'}`,
                      borderRadius: '10px',
                      padding: '10px 14px',
                      color: 'var(--text-white)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'var(--transition-smooth)',
                      textAlign: 'left'
                    }}
                  >
                    <span>{col.name}</span>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      border: `1.5px solid ${inCol ? 'var(--accent-green)' : 'var(--text-grey)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: inCol ? 'var(--accent-green)' : 'transparent',
                      color: 'var(--bg-dark)',
                      fontSize: '10px',
                      fontWeight: 'bold'
                    }}>
                      {inCol && '✓'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <form onSubmit={handleCreateCollection} className="lp-section" style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
          <div className="lp-label" style={{ marginBottom: '8px' }}>Nuova collezione</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="lp-date-input"
              style={{
                margin: 0,
                padding: '8px 12px',
                fontSize: '0.85rem',
                flex: 1,
                border: '1.5px solid var(--border-light)',
                borderRadius: '10px',
                background: 'var(--bg-input)',
                color: 'var(--text-white)',
                outline: 'none'
              }}
              placeholder="Nome della collezione..."
              value={newCollectionName}
              onChange={e => setNewCollectionName(e.target.value)}
            />
            <button
              type="submit"
              style={{
                background: 'var(--text-white)',
                color: 'var(--bg-dark)',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Crea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
