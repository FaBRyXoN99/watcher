export const updateAppIcon = (iconUrl) => {
  if (!iconUrl) return;

  const actualUrl = iconUrl.startsWith('data:') 
    ? iconUrl 
    : `${import.meta.env.BASE_URL}${iconUrl.startsWith('/') ? iconUrl.slice(1) : iconUrl}`;

  // Update favicon
  let favicon = document.querySelector('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    document.head.appendChild(favicon);
  }
  favicon.href = actualUrl;

  // Update apple-touch-icon
  let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (!appleIcon) {
    appleIcon = document.createElement('link');
    appleIcon.rel = 'apple-touch-icon';
    document.head.appendChild(appleIcon);
  }
  appleIcon.href = actualUrl;

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
        src: actualUrl,
        sizes: "192x192 512x512",
        type: actualUrl.startsWith('data:image/svg+xml') ? 'image/svg+xml' : (actualUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png'),
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

export const initAppIcon = () => {
  const customIcon = localStorage.getItem('watcher_app_icon_global');
  if (customIcon) {
    updateAppIcon(customIcon);
  } else {
    // Default fallback
    updateAppIcon('logo.svg');
  }
};
