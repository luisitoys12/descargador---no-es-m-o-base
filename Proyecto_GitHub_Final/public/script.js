document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_API_BASE = window.__KUS_API_BASE__ || window.location.origin;
    const STORAGE_KEY_SETTINGS = 'downloader_settings';
    const STORAGE_KEY_HISTORY = 'downloader_history';

    const appRoot = document.getElementById('appRoot');
    const authOverlay = document.getElementById('authOverlay');
    const accessCodeInput = document.getElementById('accessCodeInput');
    const accessCodeBtn = document.getElementById('accessCodeBtn');
    const authMessage = document.getElementById('authMessage');
    const authApiBaseInput = document.getElementById('authApiBaseInput');
    const authSaveApiBaseBtn = document.getElementById('authSaveApiBaseBtn');

    const downloadBtn = document.getElementById('downloadBtn');
    const folderBtn = document.getElementById('folderBtn');
    const folderPathText = document.getElementById('folderPathText');
    const autoDetectToggle = document.getElementById('autoDetectToggle');
    const statusMessage = document.getElementById('statusMessage');
    const urlInput = document.getElementById('urlInput');
    const openFolderBtn = document.getElementById('openFolderBtn');
    const formatSpans = document.querySelectorAll('.pill-switch span');

    const infoPreview = document.getElementById('infoPreview');
    const infoTitle = document.getElementById('infoTitle');
    const infoCount = document.getElementById('infoCount');
    const confirmAddBtn = document.getElementById('confirmAddBtn');
    const cancelPreviewBtn = document.getElementById('cancelPreviewBtn');

    const queueListDiv = document.getElementById('queueList');
    const historyListDiv = document.getElementById('historyList');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const cancelAllBtn = document.getElementById('cancelAllBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const tabs = document.querySelectorAll('.tab');


    const apiBaseInput = document.getElementById('apiBaseInput');
    const saveApiBaseBtn = document.getElementById('saveApiBaseBtn');

    function normalizeApiBase(rawBase) {
        const cleaned = (rawBase || '').trim();
        if (!cleaned) return window.location.origin;

        try {
            const url = new URL(cleaned);
            return url.origin;
        } catch (error) {
            return null;
        }
    }

    function isGitHubPagesHost() {
        return window.location.hostname.endsWith('github.io');
    }

    function getApiBase() {
        return settings.apiBase || window.location.origin;
    }

    function setApiBase(rawBase) {
        const normalized = normalizeApiBase(rawBase);
        if (!normalized) return false;

        settings.apiBase = normalized;
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
        if (apiBaseInput) apiBaseInput.value = normalized;
        if (authApiBaseInput) authApiBaseInput.value = normalized;
        return true;
    }

    function buildApiUrl(endpoint) {
        return `${getApiBase()}${endpoint}`;
    }

    let selectedDownloadPath = null;
    let selectedFormat = 'mp3';
    let isProcessingPreview = false;
    let lastClipboardText = '';
    let currentPreviewData = null;
    let eventSource = null;
    let history = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY)) || [];
    let settings = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTINGS)) || {
        path: null,
        format: 'mp3',
        autoDetect: true,
        accessCode: '',
        apiBase: DEFAULT_API_BASE
    };

    setApiBase(settings.apiBase || DEFAULT_API_BASE);

    function saveSettings() {
        settings.path = selectedDownloadPath;
        settings.format = selectedFormat;
        settings.autoDetect = autoDetectToggle.checked;
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    }

    function getAccessCode() {
        return settings.accessCode || '';
    }

    async function apiFetch(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            'x-access-code': getAccessCode(),
            ...(options.headers || {})
        };

        const response = await fetch(buildApiUrl(endpoint), {
            ...options,
            headers
        });

        if (response.status === 401) {
            lockApp('Código inválido. Vuelve a iniciar sesión.');
            throw new Error('UNAUTHORIZED');
        }

        return response;
    }

    function lockApp(message = 'Solo personal autorizado.') {
        appRoot.classList.add('locked');
        authOverlay.classList.remove('hidden');
        authMessage.textContent = message;
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
    }

    function unlockApp() {
        appRoot.classList.remove('locked');
        authOverlay.classList.add('hidden');
        connectSSE();
    }

    async function validateAccessCode() {
        const code = accessCodeInput.value.trim();
        if (!code) {
            authMessage.textContent = 'Ingresa un código.';
            return;
        }

        if (isGitHubPagesHost() && getApiBase() === window.location.origin) {
            authMessage.textContent = 'En GitHub Pages debes configurar primero la URL del backend.';
            return;
        }

        try {
            const response = await fetch(buildApiUrl('/api/access/validate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accessCode: code })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    authMessage.textContent = 'Código incorrecto.';
                } else {
                    authMessage.textContent = 'Backend respondió con error. Verifica la URL backend y que el servidor esté activo.';
                }
                return;
            }

            settings.accessCode = code;
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
            unlockApp();
        } catch (error) {
            authMessage.textContent = 'No se pudo conectar al backend. Revisa la URL backend.';
        }
    }

    function truncatePath(filePath) {
        if (!filePath) return 'Descargas';
        if (filePath.length > 40) return `...${filePath.slice(-36)}`;
        return filePath;
    }

    function showStatus(msg, type) {
        statusMessage.textContent = msg;
        statusMessage.className = `status-bar ${type}`;
        statusMessage.classList.remove('hidden');
    }

    function closePreview() {
        infoPreview.classList.add('hidden');
        isProcessingPreview = false;
        currentPreviewData = null;
    }

    function renderHistory() {
        historyListDiv.innerHTML = '';
        if (!history.length) {
            historyListDiv.innerHTML = `<div class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><p>Sin historial</p></div>`;
            return;
        }

        [...history].reverse().forEach(item => {
            const div = document.createElement('div');
            div.className = 'queue-item completed';
            div.innerHTML = `
                <div class="queue-header">
                    <span class="queue-title" title="${item.path || ''}">${item.title}</span>
                    <span class="queue-status completed">${item.format.toUpperCase()}</span>
                </div>
                <div class="meta-row">${new Date(item.date).toLocaleString()}</div>
            `;
            historyListDiv.appendChild(div);
        });
    }

    function addToHistory(job) {
        history.push({
            id: job.jobId,
            title: job.title,
            format: job.format,
            path: job.path,
            date: Date.now()
        });
        if (history.length > 50) history.shift();
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
        if (!historyListDiv.classList.contains('hidden')) renderHistory();
    }

    function createItem(job, type) {
        const div = document.createElement('div');
        div.className = `queue-item ${type}`;
        div.id = `job-${job.id}`;
        const progress = Math.round(job.progress || 0);

        div.innerHTML = `
            <div class="queue-header">
                <span class="queue-title" title="${job.title || ''}">${job.title || 'Procesando...'}</span>
                <span class="queue-status ${job.status}">${job.status === 'downloading' ? `${progress}%` : job.status}</span>
            </div>
            ${type === 'active' ? `<div class="progress-container"><div class="progress-bar" style="width:${progress}%"></div></div>` : ''}
        `;
        return div;
    }

    function updateProgress({ jobId, progress }) {
        const el = document.getElementById(`job-${jobId}`);
        if (!el) return;

        const bar = el.querySelector('.progress-bar');
        const stat = el.querySelector('.queue-status');
        if (bar) bar.style.width = `${progress}%`;
        if (stat) stat.textContent = `${Math.round(progress)}%`;
    }

    function renderQueue(state) {
        const { active, waiting, isPaused } = state;
        const all = [...active, ...waiting];

        if (!all.length) {
            queueListDiv.innerHTML = `<div class="empty-state"><i class="fa-solid fa-music"></i><p>Listo para descargar</p></div>`;
        } else {
            queueListDiv.innerHTML = '';
            active.forEach(job => queueListDiv.appendChild(createItem(job, 'active')));
            waiting.forEach(job => queueListDiv.appendChild(createItem(job, 'waiting')));
        }

        pauseBtn.classList.toggle('hidden', isPaused);
        resumeBtn.classList.toggle('hidden', !isPaused);
    }

    function connectSSE() {
        if (eventSource || !getAccessCode()) return;

        eventSource = new EventSource(`${buildApiUrl('/api/events')}?accessCode=${encodeURIComponent(getAccessCode())}`);
        eventSource.addEventListener('queueUpdate', (e) => renderQueue(JSON.parse(e.data)));
        eventSource.addEventListener('progress', (e) => updateProgress(JSON.parse(e.data)));
        eventSource.addEventListener('jobCompleted', (e) => addToHistory(JSON.parse(e.data)));
        eventSource.addEventListener('jobError', (e) => {
            const data = JSON.parse(e.data);
            showStatus(`Error: ${data.title || ''}`, 'error');
            alert(`❌ ${data.error}`);
        });

        eventSource.onerror = () => {
            eventSource.close();
            eventSource = null;
            setTimeout(connectSSE, 2500);
        };
    }

    async function fetchInfo(url) {
        isProcessingPreview = true;
        showStatus('Analizando enlace...', 'info');

        try {
            const response = await apiFetch('/api/info', {
                method: 'POST',
                body: JSON.stringify({ url, accessCode: getAccessCode() })
            });

            if (!response.ok) throw new Error('INVALID_LINK');

            const data = await response.json();
            currentPreviewData = data;
            infoPreview.classList.remove('hidden');
            infoTitle.textContent = data.title;
            infoCount.textContent = data.isPlaylist
                ? `Playlist (${data.videoCount} elementos)`
                : 'Elemento individual';
            statusMessage.classList.add('hidden');
        } catch (error) {
            showStatus('No se pudo analizar el enlace', 'error');
            isProcessingPreview = false;
        }
    }

    async function addToQueue() {
        if (!currentPreviewData) return;

        const items = currentPreviewData.entries.map(entry => ({
            title: entry.title,
            url: entry.url
        }));

        try {
            const response = await apiFetch('/api/queue/add', {
                method: 'POST',
                body: JSON.stringify({
                    accessCode: getAccessCode(),
                    items,
                    downloadPath: selectedDownloadPath,
                    playlistTitle: currentPreviewData.isPlaylist ? currentPreviewData.title : null,
                    format: selectedFormat
                })
            });

            if (!response.ok) throw new Error('QUEUE_ERROR');

            const result = await response.json();
            showStatus(`Añadido: ${result.count} descarga(s)`, 'success');
            setTimeout(() => statusMessage.classList.add('hidden'), 3000);
        } catch (error) {
            showStatus('Error al agregar a la cola', 'error');
        }
    }

    async function sendAction(action) {
        await apiFetch('/api/queue/action', {
            method: 'POST',
            body: JSON.stringify({ action, accessCode: getAccessCode() })
        });
    }

    downloadBtn.addEventListener('click', async () => {
        const inputValue = urlInput.value.trim();
        if (inputValue) {
            fetchInfo(inputValue);
            return;
        }

        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                showStatus('Ingresa o copia un enlace', 'error');
                return;
            }
            urlInput.value = text.trim();
            fetchInfo(text.trim());
            lastClipboardText = text;
        } catch {
            showStatus('No se pudo leer el portapapeles', 'error');
        }
    });

    confirmAddBtn.addEventListener('click', async () => {
        await addToQueue();
        closePreview();
    });

    cancelPreviewBtn.addEventListener('click', () => {
        closePreview();
        urlInput.value = '';
    });

    folderBtn.addEventListener('click', async () => {
        try {
            const response = await apiFetch('/api/choose-directory', {
                method: 'GET',
                headers: { 'x-access-code': getAccessCode() }
            });
            const data = await response.json();
            if (!response.ok) {
                showStatus(data.error || 'No se pudo seleccionar carpeta', 'error');
                return;
            }

            if (data.path) {
                selectedDownloadPath = data.path;
                folderPathText.textContent = truncatePath(data.path);
                saveSettings();
            }
        } catch {
            showStatus('No se pudo seleccionar carpeta', 'error');
        }
    });

    openFolderBtn.addEventListener('click', async (event) => {
        event.stopPropagation();
        try {
            const response = await apiFetch('/api/open-folder', {
                method: 'POST',
                body: JSON.stringify({ path: selectedDownloadPath, accessCode: getAccessCode() })
            });
            if (!response.ok) {
                const data = await response.json();
                showStatus(data.error || 'No se pudo abrir la carpeta', 'error');
            }
        } catch {
            showStatus('No se pudo abrir la carpeta', 'error');
        }
    });

    pauseBtn.addEventListener('click', () => sendAction('pause'));
    resumeBtn.addEventListener('click', () => sendAction('resume'));
    cancelAllBtn.addEventListener('click', () => {
        if (confirm('¿Cancelar toda la cola?')) sendAction('cancel_all');
    });

    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('¿Borrar historial?')) {
            history = [];
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
            renderHistory();
        }
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const mode = tab.getAttribute('data-tab');
            const queueMode = mode === 'queue';

            queueListDiv.classList.toggle('hidden', !queueMode);
            historyListDiv.classList.toggle('hidden', queueMode);
            pauseBtn.classList.toggle('hidden', !queueMode);
            resumeBtn.classList.toggle('hidden', !queueMode || resumeBtn.classList.contains('hidden'));
            cancelAllBtn.classList.toggle('hidden', !queueMode);
            clearHistoryBtn.classList.toggle('hidden', queueMode);

            if (!queueMode) renderHistory();
        });
    });

    autoDetectToggle.addEventListener('change', saveSettings);

    formatSpans.forEach(span => {
        span.addEventListener('click', () => {
            formatSpans.forEach(s => s.classList.remove('active'));
            span.classList.add('active');
            selectedFormat = span.dataset.format;
            saveSettings();
        });
    });

    if (navigator.clipboard) {
        setInterval(async () => {
            if (!autoDetectToggle.checked || isProcessingPreview || appRoot.classList.contains('locked')) return;

            try {
                const text = await navigator.clipboard.readText();
                if (text && text !== lastClipboardText) {
                    lastClipboardText = text;
                    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
                    if (ytRegex.test(text.trim())) {
                        urlInput.value = text.trim();
                        fetchInfo(text.trim());
                    }
                }
            } catch {
                // Silent clipboard errors.
            }
        }, 1500);
    }

    if (settings.path) {
        selectedDownloadPath = settings.path;
        folderPathText.textContent = truncatePath(settings.path);
    }

    selectedFormat = settings.format || 'mp3';
    formatSpans.forEach(span => {
        span.classList.toggle('active', span.dataset.format === selectedFormat);
    });
    autoDetectToggle.checked = settings.autoDetect !== false;
    if (apiBaseInput) apiBaseInput.value = getApiBase();
    if (authApiBaseInput) authApiBaseInput.value = getApiBase();

    function applyBackendFromInput(inputElement) {
        const ok = setApiBase(inputElement.value);
        if (!ok) {
            authMessage.textContent = 'URL de backend inválida.';
            showStatus('URL de backend inválida.', 'error');
            return;
        }

        authMessage.textContent = `Backend configurado: ${getApiBase()}`;
        showStatus(`Backend configurado: ${getApiBase()}`, 'success');
        if (eventSource) {
            eventSource.close();
            eventSource = null;
        }
        connectSSE();
    }

    if (authSaveApiBaseBtn) {
        authSaveApiBaseBtn.addEventListener('click', () => applyBackendFromInput(authApiBaseInput));
    }

    if (saveApiBaseBtn) {
        saveApiBaseBtn.addEventListener('click', () => applyBackendFromInput(apiBaseInput));
    }

    accessCodeBtn.addEventListener('click', validateAccessCode);
    accessCodeInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') validateAccessCode();
    });

    if (settings.accessCode) {
        accessCodeInput.value = settings.accessCode;
        validateAccessCode();
    } else {
        lockApp();
    }
});
