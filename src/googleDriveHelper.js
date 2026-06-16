// src/googleDriveHelper.js

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let initPromise = null;

const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${src}"]`);
        if (existing) {
            if (existing.getAttribute('data-loaded') === 'true') return resolve();
            existing.addEventListener('load', resolve);
            existing.addEventListener('error', reject);
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
            script.setAttribute('data-loaded', 'true');
            resolve();
        };
        script.onerror = reject;
        document.body.appendChild(script);
    });
};

export const getClientId = () => {
    return localStorage.getItem('watcher_gdrive_client_id') || '691138838101-d043hu3bkjuj5cu629pm9r6fpkh09hgs.apps.googleusercontent.com';
};

export const initGoogleDrive = () => {
    console.log('initGoogleDrive called, initPromise:', !!initPromise);
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
        try {
            console.log('Loading scripts...');
            await Promise.all([
                loadScript('https://apis.google.com/js/api.js'),
                loadScript('https://accounts.google.com/gsi/client')
            ]);
            console.log('Scripts loaded. Loading gapi client...');

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('gapi.load timed out')), 10000);
                window.gapi.load('client', {
                    callback: () => {
                        clearTimeout(timeout);
                        resolve();
                    },
                    onerror: () => {
                        clearTimeout(timeout);
                        reject(new Error('Failed to load gapi client'));
                    }
                });
            });
            console.log('gapi client loaded. Initializing with discoveryDocs...');
            await window.gapi.client.init({
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
            });
            console.log('gapi client initialized.');
            gapiInited = true;

            console.log('Initializing token client...');
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: getClientId(),
                scope: SCOPES,
                callback: '', // defined at request time
            });
            gisInited = true;
            console.log('Google Drive API Initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Google Drive:', error);
            initPromise = null;
            return false;
        }
    })();
    
    return initPromise;
};

export const restoreSession = async () => {
    if (!gapiInited || !gisInited) await initGoogleDrive();
    const stored = localStorage.getItem('watcher_gdrive_token');
    if (stored) {
        try {
            const token = JSON.parse(stored);
            if (!token.expires_at || Date.now() > (token.expires_at - 300000)) {
                console.warn('Google Drive token expired, clearing session.');
                localStorage.removeItem('watcher_gdrive_token');
                return false;
            }
            window.gapi.client.setToken(token);
            return true;
        } catch (e) {
            console.error('Invalid stored token', e);
            localStorage.removeItem('watcher_gdrive_token');
        }
    }
    return false;
};

const getToken = () => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) return reject('Google Auth not initialized');

        const currentToken = window.gapi.client.getToken();
        if (currentToken && currentToken.access_token) {
            if (currentToken.expires_at && Date.now() < (currentToken.expires_at - 300000)) {
                return resolve(currentToken);
            }
        }

        tokenClient.callback = (resp) => {
            if (resp.error) return reject(resp);
            resp.expires_at = Date.now() + (resp.expires_in * 1000);
            window.gapi.client.setToken(resp);
            localStorage.setItem('watcher_gdrive_token', JSON.stringify(resp));
            resolve(resp);
        };
        tokenClient.requestAccessToken({ prompt: currentToken ? '' : 'consent' });
    });
};

export const signIn = () => {
    console.log('signIn() called. gapiInited:', gapiInited, 'gisInited:', gisInited);
    
    const execLogin = (resolve, reject) => {
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: getClientId(),
                scope: SCOPES,
                callback: '',
            });
            gisInited = true;
        }

        if (!tokenClient) {
            console.error('tokenClient is null!');
            return reject(new Error('Google Auth not initialized'));
        }
        
        console.log('Setting tokenClient callback...');
        tokenClient.callback = (resp) => {
            console.log('tokenClient callback triggered!', resp);
            if (resp.error) return reject(resp);
            resp.expires_at = Date.now() + (resp.expires_in * 1000);
            window.gapi.client.setToken(resp);
            localStorage.setItem('watcher_gdrive_token', JSON.stringify(resp));
            resolve(true);
        };
        
        try {
            console.log('Calling tokenClient.requestAccessToken()...');
            tokenClient.requestAccessToken({ prompt: 'consent' });
            console.log('tokenClient.requestAccessToken() call finished (synchronous part).');
        } catch (e) {
            console.error('Error in requestAccessToken:', e);
            reject(e);
        }
    };

    if (!gapiInited || !gisInited) {
        console.log('Awaiting initGoogleDrive()...');
        return initGoogleDrive().then(() => {
            console.log('initGoogleDrive() completed.');
            return new Promise(execLogin);
        });
    } else {
        return new Promise(execLogin);
    }
};

export const signOut = () => {
    const token = window.gapi.client.getToken();
    if (token !== null) {
        window.google.accounts.oauth2.revoke(token.access_token, () => {});
        window.gapi.client.setToken('');
        localStorage.removeItem('watcher_gdrive_token');
    }
};

const findFile = async (filename) => {
    const query = `name = '${filename}' and trashed = false`;
    const response = await window.gapi.client.drive.files.list({
        q: query,
        fields: 'files(id, name, modifiedTime)',
        spaces: 'drive',
    });
    return response.result.files[0] || null;
};

const uploadFile = async (name, content, mimeType, fileId = null) => {
    const metadata = {
        name: name,
        mimeType: mimeType,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', content);

    const accessToken = window.gapi.client.getToken().access_token;
    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';

    if (fileId) {
        url = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`;
        method = 'PATCH';
    }

    const response = await fetch(url, {
        method: method,
        headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
        body: form,
    });
    return await response.json();
};

const downloadFile = async (fileId) => {
    const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media',
    });
    return response.result;
};

export const checkCloudBackupNewer = async (profileId) => {
    if (!window.gapi.client.getToken()) return { hasCloudBackup: false, isNewer: false };
    
    try {
        const filename = `watcher_backup_${profileId}.json`;
        const file = await findFile(filename);
        if (!file) return { hasCloudBackup: false, isNewer: false };
        
        const cloudTime = new Date(file.modifiedTime).getTime();
        
        let localTime = 0;
        const storedSyncMeta = localStorage.getItem(`watcher_profile_${profileId}_gdrive_sync_meta`);
        if (storedSyncMeta) {
            localTime = new Date(JSON.parse(storedSyncMeta).lastSync).getTime();
        }
        
        const isNewer = cloudTime > (localTime + 60000) || localTime === 0; 
        
        return {
            hasCloudBackup: true,
            isNewer,
            cloudDate: new Date(cloudTime).toLocaleString()
        };
    } catch (e) {
        console.error('Error checking cloud backup time', e);
        return { hasCloudBackup: false, isNewer: false };
    }
};

export const syncDataToCloud = async (profileId, trackedItems, watchlist) => {
    if (!window.gapi || !window.gapi.client || !window.gapi.client.getToken()) await getToken();

    const backupData = {
        trackedItems,
        watchlist,
        exportDate: new Date().toISOString()
    };

    const filename = `watcher_backup_${profileId}.json`;
    const dbFile = await findFile(filename);
    const dbFileId = dbFile ? dbFile.id : null;

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    await uploadFile(filename, blob, 'application/json', dbFileId);
    
    const syncTime = new Date().toISOString();
    localStorage.setItem(`watcher_profile_${profileId}_gdrive_sync_meta`, JSON.stringify({ lastSync: syncTime }));
    
    return syncTime;
};

export const fetchFromCloud = async (profileId) => {
    if (!window.gapi || !window.gapi.client || !window.gapi.client.getToken()) await getToken();

    const filename = `watcher_backup_${profileId}.json`;
    const file = await findFile(filename);
    if (file) {
        return await downloadFile(file.id);
    }
    return null;
};

// Debounce helper for auto-sync
let debounceTimer;
export const autoSyncToCloud = async (profileId, trackedItems, watchlist) => {
    const isAutoSync = localStorage.getItem(`watcher_profile_${profileId}_autosync`) !== 'false';
    if (!isAutoSync) return;

    const hasToken = gapiInited && window.gapi && window.gapi.client && window.gapi.client.getToken && window.gapi.client.getToken();
    if (!hasToken) return;

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        syncDataToCloud(profileId, trackedItems, watchlist)
            .then(() => console.log('Auto-sync completato'))
            .catch(err => console.error('Auto-sync fallito:', err));
    }, 5000); // 5 second debounce
};
