export const updateAppIcon = (iconUrl) => {
  if (!iconUrl) return;

  const actualUrl = iconUrl.startsWith('data:') 
    ? iconUrl 
    : `${import.meta.env.BASE_URL}${iconUrl.startsWith('/') ? iconUrl.slice(1) : iconUrl}`;

  const applyIconUrls = (pngUrl, rawUrl) => {
    // Update favicon
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    favicon.href = rawUrl;

    // Update apple-touch-icon (MUST be PNG for iOS)
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleIcon) {
      appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      document.head.appendChild(appleIcon);
    }
    // Aggiungo timestamp per bypassare la cache aggressiva di iOS
    appleIcon.href = pngUrl.startsWith('data:') ? pngUrl : `${pngUrl}?v=${Date.now()}`;

    // Generate dynamic Manifest
    const manifest = {
      name: "Watcher",
      short_name: "Watcher",
      start_url: ".",
      display: "standalone",
      background_color: "#0a0a0a",
      theme_color: localStorage.getItem('watcher_profiles') ? "#0a0a0a" : "#8a14ff",
      icons: [
        {
          src: pngUrl,
          sizes: "192x192 512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);

    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    } else {
      if (manifestLink.href.startsWith('blob:')) {
        URL.revokeObjectURL(manifestLink.href);
      }
    }
    manifestLink.href = manifestUrl;
  };

  if (actualUrl.endsWith('.svg') || actualUrl.startsWith('data:image/svg')) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 512, 512);
      const pngDataUrl = canvas.toDataURL('image/png');
      try { localStorage.setItem('watcher_app_icon_png_cache', pngDataUrl); } catch(e){}
      applyIconUrls(pngDataUrl, actualUrl);
    };
    img.onerror = () => {
      // Fallback
      applyIconUrls(actualUrl, actualUrl);
    };
    img.src = actualUrl;
  } else {
    try { localStorage.removeItem('watcher_app_icon_png_cache'); } catch(e){}
    applyIconUrls(actualUrl, actualUrl);
  }
};

export const initAppIcon = () => {
  const customIcon = localStorage.getItem('watcher_app_icon_global');
  if (customIcon) {
    updateAppIcon(customIcon);
  } else {
    // Default fallback
    updateAppIcon('logo.svg');
  }
};
