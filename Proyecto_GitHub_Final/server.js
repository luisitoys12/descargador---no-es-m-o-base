const express = require('express');
const cors = require('cors');
const path = require('path');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const ACCESS_CODE = process.env.ACCESS_CODE || 'estacionkusmedios';

function normalizeAccessCode(value) {
    return String(value || '').trim().toLowerCase();
}

const NORMALIZED_ACCESS_CODE = normalizeAccessCode(ACCESS_CODE);
const IS_WEB_RUNTIME = process.env.APP_RUNTIME === 'web' || process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const isPackaged = process.pkg || /app\.asar/.test(__dirname);
const downloadsDir = path.join(os.homedir(), 'Downloads', 'YoutubeDownloads');
if (!fs.existsSync(downloadsDir)) {
    try {
        fs.mkdirSync(downloadsDir, { recursive: true });
    } catch (e) {
        console.error('Failed to create downloads dir:', e);
    }
}

let binDir;
if (isPackaged && process.resourcesPath) {
    binDir = path.join(process.resourcesPath, 'bin');
} else {
    binDir = path.join(__dirname, 'bin');
}

const ytDlpPath = process.platform === 'win32'
    ? path.join(binDir, 'yt-dlp.exe')
    : path.join(binDir, 'yt-dlp');

function resolveYtDlpCommand() {
    if (fs.existsSync(ytDlpPath)) return ytDlpPath;
    return 'yt-dlp';
}

let clients = [];

function isAuthorizedRequest(req) {
    const headerCode = req.headers['x-access-code'];
    const bodyCode = req.body && req.body.accessCode;
    const queryCode = req.query && req.query.accessCode;

    return [headerCode, bodyCode, queryCode].some((candidate) =>
        normalizeAccessCode(candidate) === NORMALIZED_ACCESS_CODE
    );
}

function requireAccessCode(req, res, next) {
    if (!isAuthorizedRequest(req)) {
        return res.status(401).json({
            error: 'Código de acceso inválido',
            code: 'INVALID_ACCESS_CODE'
        });
    }
    return next();
}

app.post('/api/access/validate', (req, res) => {
    const { accessCode } = req.body || {};
    if (normalizeAccessCode(accessCode) === NORMALIZED_ACCESS_CODE) {
        return res.json({ success: true, message: 'Acceso concedido' });
    }
    return res.status(401).json({ success: false, error: 'Código incorrecto' });
});

app.get('/api/events', requireAccessCode, (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    clients.push(newClient);

    sendEventToClient(newClient, 'queueUpdate', queueManager.getCheckState());

    req.on('close', () => {
        clients = clients.filter(c => c.id !== clientId);
    });
});

function broadcast(type, data) {
    clients.forEach(client => sendEventToClient(client, type, data));
}

function sendEventToClient(client, type, data) {
    client.res.write(`event: ${type}\n`);
    client.res.write(`data: ${JSON.stringify(data)}\n\n`);
}

class QueueManager {
    constructor(concurrency = 10) {
        this.queue = [];
        this.activeJobs = [];
        this.concurrency = concurrency;
        this.isPaused = false;
        this.activeProcesses = {};
    }

    addBulk(items) {
        items.forEach(item => {
            this.queue.push({
                id: crypto.randomUUID(),
                ...item,
                status: 'waiting',
                progress: 0,
                addedAt: Date.now()
            });
        });
        broadcast('queueUpdate', this.getCheckState());
        this.processQueue();
    }

    pause() {
        this.isPaused = true;
        broadcast('queueUpdate', this.getCheckState());
    }

    resume() {
        this.isPaused = false;
        this.processQueue();
        broadcast('queueUpdate', this.getCheckState());
    }

    cancelAll() {
        this.isPaused = true;
        this.queue = [];

        this.activeJobs.forEach(job => {
            const proc = this.activeProcesses[job.id];
            if (proc) {
                try {
                    proc.kill();
                } catch (e) {
                    console.error('Error killing process', e);
                }
            }
        });

        this.activeJobs = [];
        this.activeProcesses = {};
        broadcast('queueUpdate', this.getCheckState());

        setTimeout(() => {
            this.isPaused = false;
            broadcast('queueUpdate', this.getCheckState());
        }, 1000);
    }

    getCheckState() {
        return {
            active: this.activeJobs,
            waiting: this.queue,
            isPaused: this.isPaused
        };
    }

    processQueue() {
        if (this.isPaused) return;
        if (this.activeJobs.length >= this.concurrency) return;
        if (this.queue.length === 0) return;

        const job = this.queue.shift();
        this.activeJobs.push(job);
        job.status = 'downloading';

        broadcast('queueUpdate', this.getCheckState());
        this.startDownload(job);
        this.processQueue();
    }

    startDownload(job) {
        const { url, title, downloadPath, playlistTitle, format } = job;
        let targetDir = downloadPath || downloadsDir;

        if (!targetDir || targetDir.trim() === '') {
            targetDir = downloadsDir;
        }

        if (!fs.existsSync(targetDir)) {
            try {
                fs.mkdirSync(targetDir, { recursive: true });
            } catch (e) {
                console.error('Failed to create target dir:', e);
            }
        }

        const outputTemplate = playlistTitle
            ? path.join(targetDir, playlistTitle, '%(title)s.%(ext)s')
            : path.join(targetDir, '%(title)s.%(ext)s');

        const args = [
            '--add-metadata',
            '-o', outputTemplate,
            '--ffmpeg-location', binDir,
            '--js-runtimes', 'node',
            '--newline',
            '--no-warnings',
            '--force-ipv4'
        ];

        if (format === 'mp4') {
            args.push('-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
            args.push('--merge-output-format', 'mp4');
        } else {
            args.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
        }

        args.push(url);

        const command = resolveYtDlpCommand();
        const child = spawn(command, args);
        this.activeProcesses[job.id] = child;

        child.stdout.on('data', (data) => {
            const str = data.toString();
            const match = str.match(/\[download\]\s+(\d+\.\d+)%/);
            if (match) {
                const percentage = parseFloat(match[1]);
                if (percentage > job.progress) {
                    job.progress = percentage;
                    broadcast('progress', { jobId: job.id, progress: percentage });
                }
            }
        });

        child.stderr.on('data', (data) => {
            const errStr = data.toString();
            if (!job.errorLog) job.errorLog = '';
            job.errorLog += errStr;
        });

        child.on('error', (err) => {
            delete this.activeProcesses[job.id];
            this.activeJobs = this.activeJobs.filter(j => j.id !== job.id);

            broadcast('jobError', {
                jobId: job.id,
                error: `No se pudo iniciar la descarga. ${err.message}`,
                title: job.title
            });

            broadcast('queueUpdate', this.getCheckState());
            this.processQueue();
        });

        child.on('close', (code) => {
            if (!this.activeProcesses[job.id]) return;

            delete this.activeProcesses[job.id];
            this.activeJobs = this.activeJobs.filter(j => j.id !== job.id);

            if (code === 0) {
                job.status = 'completed';
                job.progress = 100;
                broadcast('jobCompleted', {
                    jobId: job.id,
                    status: 'completed',
                    title: job.title || 'Desconocido',
                    format: job.format || 'mp3',
                    path: job.downloadPath || downloadsDir
                });
            } else {
                broadcast('jobError', {
                    jobId: job.id,
                    error: job.errorLog || `El proceso terminó con código ${code}`,
                    title: job.title
                });
            }

            broadcast('queueUpdate', this.getCheckState());
            this.processQueue();
        });
    }
}

const queueManager = new QueueManager(10);

app.get('/api/choose-directory', requireAccessCode, (req, res) => {
    if (IS_WEB_RUNTIME || process.platform !== 'win32') {
        return res.status(400).json({
            error: 'Folder picker no disponible en entorno web. Usa la ruta por defecto del servidor.',
            code: 'FOLDER_PICKER_UNAVAILABLE'
        });
    }

    const psScript = path.join(binDir, 'select_folder.ps1');
    const child = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psScript]);
    let stdout = '';
    child.stdout.on('data', d => {
        stdout += d.toString();
    });
    child.on('close', () => {
        const selectedPath = stdout.trim();
        res.json({ path: selectedPath || null });
    });
});

app.post('/api/open-folder', requireAccessCode, (req, res) => {
    if (IS_WEB_RUNTIME || process.platform !== 'win32') {
        return res.status(400).json({
            error: 'Abrir carpeta no disponible en entorno web.',
            code: 'OPEN_FOLDER_UNAVAILABLE'
        });
    }

    const { path: folderPath } = req.body;
    const target = folderPath || downloadsDir;
    exec(`start "" "${target}"`, (err) => {
        if (err) console.error('Failed to open folder:', err);
    });
    return res.json({ success: true });
});

app.post('/api/info', requireAccessCode, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL required' });

    const command = resolveYtDlpCommand();
    const args = [
        '--dump-single-json',
        '--flat-playlist',
        '--js-runtimes', 'node',
        '--no-warnings',
        '--force-ipv4',
        url
    ];

    let output = '';
    const child = spawn(command, args);

    child.stdout.on('data', (chunk) => {
        output += chunk.toString();
    });

    child.on('close', (code) => {
        if (code !== 0) return res.status(500).json({ error: 'Failed to fetch info' });

        try {
            const data = JSON.parse(output);
            const isPlaylist = data._type === 'playlist';

            const result = {
                title: data.title,
                isPlaylist,
                videoCount: isPlaylist ? data.entries.length : 1,
                entries: []
            };

            if (isPlaylist) {
                result.entries = data.entries.map(e => ({
                    id: e.id,
                    title: e.title,
                    url: e.url || `https://www.youtube.com/watch?v=${e.id}`
                }));
            } else {
                result.entries = [{
                    id: data.id,
                    title: data.title,
                    url: data.webpage_url || url
                }];
            }

            return res.json(result);
        } catch (e) {
            return res.status(500).json({ error: 'Failed to parse metadata' });
        }
    });
});

app.post('/api/queue/add', requireAccessCode, (req, res) => {
    const { items, downloadPath, playlistTitle } = req.body;

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Items array required' });
    }

    queueManager.addBulk(items.map(i => ({
        ...i,
        downloadPath,
        playlistTitle,
        format: req.body.format || 'mp3'
    })));

    return res.json({ success: true, count: items.length });
});

app.post('/api/queue/action', requireAccessCode, (req, res) => {
    const { action } = req.body;

    if (action === 'pause') queueManager.pause();
    if (action === 'resume') queueManager.resume();
    if (action === 'cancel_all') queueManager.cancelAll();

    return res.json({ success: true, state: queueManager.getCheckState() });
});

const server = app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.log(`Port ${PORT} is already in use. Assuming server is running from previous instance.`);
    } else {
        console.error('Server error:', e);
    }
});
