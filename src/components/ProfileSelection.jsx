import React, { useState } from 'react';

const PREDEFINED_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Fred&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=d1f4ff',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Buster&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=ffdfb4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=d6ffb7'
];

// Image compression helper
function compressImage(file, callback) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_WIDTH = 300;
      const MAX_HEIGHT = 300;

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
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
      callback(dataUrl);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

export default function ProfileSelection({ 
  profiles, 
  onSelectProfile, 
  onCreateProfile,
  onDeleteProfile
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isManageMode, setIsManageMode] = useState(false);
  
  // Create profile form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PREDEFINED_AVATARS[0]);
  const [customAvatar, setCustomAvatar] = useState('');



  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalAvatar = customAvatar || selectedAvatar;
    const finalUsername = username.trim() ? (username.startsWith('@') ? username : `@${username}`) : `@${name.toLowerCase().replace(/\\s+/g, '')}`;

    onCreateProfile({
      id: `prof-${Date.now()}`,
      name: name.trim(),
      username: finalUsername,
      avatar: finalAvatar,
      banner: ''
    });

    // Reset fields
    setName('');
    setUsername('');
    setSelectedAvatar(PREDEFINED_AVATARS[0]);
    setCustomAvatar('');
    setShowCreateModal(false);
  };

  const handleCustomAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      compressImage(file, (base64) => {
        setCustomAvatar(base64);
      });
    }
  };

  return (
    <div className="profile-selection-screen">
      <h1 className="profile-selection-title">Chi sta guardando?</h1>

      <div className="profile-selection-grid">
        {profiles.map((p) => (
          <div key={p.id} className="profile-item-container" onClick={() => !isManageMode && onSelectProfile(p)}>
            {isManageMode && (
              <button 
                type="button" 
                className="profile-delete-overlay"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteProfile(p.id);
                }}
                title="Elimina questo profilo"
              >
                <svg viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
            <div className="profile-avatar-bubble" style={{ position: 'relative' }}>
              <img src={p.avatar} alt={p.name} />
            </div>
            <span className="profile-name-label">{p.name}</span>
          </div>
        ))}

        {profiles.length < 5 && (
          <div className="profile-item-container" onClick={() => setShowCreateModal(true)}>
            <div className="profile-avatar-bubble add-btn">
              +
            </div>
            <span className="profile-name-label">Aggiungi profilo</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <button 
          className={`btn-manage-profiles ${isManageMode ? 'active' : ''}`}
          onClick={() => setIsManageMode(!isManageMode)}
        >
          {isManageMode ? 'Fatto' : 'Gestisci profili'}
        </button>
      </div>

      {/* Profile Creation Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className="modal-body" style={{ marginTop: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '22px', borderLeft: '3px solid var(--accent-cyan)', paddingLeft: '10px' }}>
                Crea Nuovo Profilo
              </h2>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nome Profilo</label>
                  <input 
                    className="custom-input" 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="es. Mario, Laura" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Username (opzionale)</label>
                  <input 
                    className="custom-input" 
                    type="text" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="es. @mario_rossi" 
                  />
                </div>

                {/* Avatar Selection */}
                <div className="form-group">
                  <label className="form-label">Scegli un Avatar</label>
                  <div className="predefined-avatars-row">
                    {PREDEFINED_AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        className={`predefined-avatar-btn ${selectedAvatar === av && !customAvatar ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedAvatar(av);
                          setCustomAvatar('');
                        }}
                      >
                        <img src={av} alt="avatar option" />
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-grey)', marginBottom: '8px' }}>Oppure carica un'immagine dal telefono:</div>
                    <label className="file-upload-label" style={{ display: 'inline-flex', width: 'auto' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', marginRight: '6px' }}>
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      Carica foto
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={handleCustomAvatarUpload}
                      />
                    </label>
                    
                    {customAvatar && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <img 
                          src={customAvatar} 
                          alt="custom avatar preview" 
                          style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-cyan)' }} 
                        />
                        <button 
                          type="button" 
                          className="btn-outline" 
                          style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid rgba(255,3,0,0.3)', color: 'var(--accent-red)', flex: 'none' }}
                          onClick={() => setCustomAvatar('')}
                        >
                          Rimuovi
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>Crea Profilo</button>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
