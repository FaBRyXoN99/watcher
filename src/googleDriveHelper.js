// googleDriveHelper.js - Google Identity Services & Google Drive API Integration

// Helper to query the Google Drive API for a file
async function searchBackupFile(accessToken, fileName) {
  const q = encodeURIComponent(`name = '${fileName}' and trashed = false`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Errore nella ricerca su Google Drive: ${response.statusText} (${errorText})`);
  }

  const result = await response.json();
  if (result.files && result.files.length > 0) {
    return result.files[0].id;
  }
  return null;
}

// Helper to download media from a Google Drive file id
async function loadBackupFromDrive(accessToken, fileId) {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Errore nel download da Google Drive: ${response.statusText} (${errorText})`);
  }

  return response.json();
}

// Helper to create or update file content in Google Drive
async function saveBackupToDrive(accessToken, fileName, fileId, jsonData) {
  const dataString = JSON.stringify(jsonData, null, 2);

  if (fileId) {
    // Update existing file (PATCH)
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: dataString,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Errore nel salvataggio su Google Drive (update): ${response.statusText} (${errorText})`);
    }
    return await response.json();
  } else {
    // Create new file (POST multipart)
    const boundary = 'boundary_watcher_app_sync';
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
    };

    const body = [
      `\r\n--${boundary}\r\n`,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      `\r\n--${boundary}\r\n`,
      'Content-Type: application/json\r\n\r\n',
      dataString,
      `\r\n--${boundary}--\r\n`
    ].join('');

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': body.length.toString(),
        },
        body: body,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Errore nel salvataggio su Google Drive (create): ${response.statusText} (${errorText})`);
    }
    return await response.json();
  }
}

// Fetch Google User Info using current access token
export async function fetchGoogleUserInfo(accessToken) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Errore nel caricamento del profilo Google: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Unified Save function: Saves current profile's watcher data to Google Drive.
 * Uses real Drive API if credentials are provided, falls back to Sandbox simulation.
 */
export async function syncSaveProfileData(clientId, accessToken, profile, data) {
  if (!clientId || !accessToken) {
    // Sandbox mock mode
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockCloudKey = `watcher_gdrive_mock_backup_${profile.id}`;
        localStorage.setItem(mockCloudKey, JSON.stringify(data));
        // Save sync time metadata
        const metadataKey = `watcher_gdrive_mock_backup_metadata_${profile.id}`;
        localStorage.setItem(metadataKey, JSON.stringify({ lastSync: new Date().toISOString() }));
        resolve({ success: true, mode: 'sandbox', lastSync: new Date().toISOString() });
      }, 1500); // 1.5s visual loader simulation
    });
  }

  // Real Google API mode
  try {
    const fileName = `watcher_backup_${profile.id}.json`;
    const fileId = await searchBackupFile(accessToken, fileName);
    await saveBackupToDrive(accessToken, fileName, fileId, data);
    return { success: true, mode: 'real', lastSync: new Date().toISOString() };
  } catch (error) {
    console.error("Google Drive Save Error:", error);
    throw error;
  }
}

/**
 * Unified Load function: Loads current profile's watcher data from Google Drive.
 * Uses real Drive API if credentials are provided, falls back to Sandbox simulation.
 */
export async function syncLoadProfileData(clientId, accessToken, profile) {
  if (!clientId || !accessToken) {
    // Sandbox mock mode
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const mockCloudKey = `watcher_gdrive_mock_backup_${profile.id}`;
        const stored = localStorage.getItem(mockCloudKey);
        if (stored) {
          resolve({ data: JSON.parse(stored), mode: 'sandbox' });
        } else {
          reject(new Error("Nessun backup trovato su Google Drive (Sandbox) per questo profilo. Fai prima un'esportazione."));
        }
      }, 1500);
    });
  }

  // Real Google API mode
  try {
    const fileName = `watcher_backup_${profile.id}.json`;
    const fileId = await searchBackupFile(accessToken, fileName);
    if (!fileId) {
      throw new Error(`Nessun backup trovato su Google Drive per il profilo "${profile.name}". Salva prima i dati.`);
    }
    const data = await loadBackupFromDrive(accessToken, fileId);
    return { data, mode: 'real' };
  } catch (error) {
    console.error("Google Drive Load Error:", error);
    throw error;
  }
}
