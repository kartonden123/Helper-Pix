const { app, BrowserWindow, globalShortcut, screen, Tray, Menu, nativeImage, dialog, ipcMain, Notification, desktopCapturer, net } = require('electron');
const gfetch = globalThis.fetch;
const fetch = (u, i) => (app.isReady() ? net.fetch(u, i) : gfetch(u, i));   // через сетевой стек Chromium: системный прокси и VPN работают
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const auth = require('./auth');
// Защита IPC: команды принимаются только от страниц самого приложения (file://), а не от чужого содержимого
{
  const trusted = (e) => { try { return /^file:\/\//.test(e.senderFrame.url); } catch (_) { return false; } };
  const _handle = ipcMain.handle.bind(ipcMain), _on = ipcMain.on.bind(ipcMain);
  ipcMain.handle = (ch, fn) => _handle(ch, (e, ...a) => (trusted(e) ? fn(e, ...a) : { error: 'forbidden' }));
  ipcMain.on = (ch, fn) => _on(ch, (e, ...a) => { if (trusted(e)) fn(e, ...a); else if (ch === 'ls-load') e.returnValue = {}; });
}

const APP_NAME = 'Helper Pix';
const STATS_URL = 'https://polix-helper-stats.kartonden123.workers.dev';   // сервер статистики (Cloudflare Worker)
const OPACITY = 1;             // полная непрозрачность окна: фон сайта не просвечивает
const WIDTH = 940;
const HEIGHT_RATIO = 0.75;
const SIDE = 'right';          // 'right' или 'top'
const TOGGLE_KEY = 'Alt+Q';
let STARTED_HIDDEN = process.argv.includes('--hidden');   // запуск вместе с Windows: сидим в трее, меню открывается по Alt+Q
const DEBUG = false;           // true: лог и DevTools

const PREFS_FILE = path.join(app.getPath('userData'), 'ui-prefs.json');
const readPrefs = () => { try { return JSON.parse(fs.readFileSync(PREFS_FILE, 'utf8')); } catch (e) { return {}; } };
// размытие фона (Ультра): при открытии меню делаем снимок экрана, он размывается и подкладывается только под плашки
let win = null;
const winWidth = () => Math.min(1300, Math.max(700, +readPrefs().width || WIDTH));
let hotKeys = [readPrefs().hotkey || 'Alt+Q', 'Control+Alt+Q'];
let regKeys = () => {};
let tray = null;
let visible = true;
let quitting = false;
let updateState = 'Обновления: не проверялись';
let lastUpdate = null;
let declinedVersion = null;
let autoInstall = false;   // «Обновить» из меню: скачать и сразу установить с перезапуском, как в Discord
function installNow() { quitting = true; try { autoUpdater.quitAndInstall(true, true); } catch (e) { log('install error ' + e.message); quitting = false; } }   // тихая установка + запуск после неё
function startDownload() {
  autoInstall = true;
  const v = (lastUpdate && lastUpdate.version) || '';
  pushUpdate({ type: 'downloading', version: v, percent: 0 });
  autoUpdater.downloadUpdate().catch(e => { log('download error ' + e.message); pushUpdate({ type: 'available', version: v }); });
}
function pushUpdate(s) { lastUpdate = s; if (win && !win.isDestroyed()) win.webContents.send('update-state', s); }

app.setAppUserModelId('dev.majestic.catalog.overlay');
// уведомление: своё маленькое окно поверх игры (системные уведомления Windows глушатся в полноэкранных играх и режиме «Не беспокоить»)
// настройки: позиция (br/tr/bl/tl), длительность, звук, какие виды показывать, цвет рамки = цвет темы
const toasts = [];
const TOAST_ICON = { update: '⬇', role: '🛡', premium: '⭐', ban: '⛔', announce: '📢', chat: '💬', info: '🔔' };
function layoutToasts() {
  const p = readPrefs(); const pos = p.toastPos || 'br';
  const wa = screen.getPrimaryDisplay().workArea; const W = 388, H = 120, step = H - 28 + 12;
  toasts.forEach((tw, i) => {
    if (tw.isDestroyed()) return;
    const x = pos[1] === 'l' ? wa.x + 14 : wa.x + wa.width - W - 14;
    const y = pos[0] === 't' ? wa.y + 6 + step * i : wa.y + wa.height - step * (i + 1) - 6;
    tw.setBounds({ x, y, width: W, height: H });
  });
}
function showToast(title, body, kind) {
  try {
    const p = readPrefs();
    if (p.notif && p.notif[kind || 'info'] === false) return;
    const acc = /^#[0-9a-f]{6}$/i.test(p.accent || '') ? p.accent : '#ff4d6d';
    const W = 388, H = 120;
    const tw = new BrowserWindow({ width: W, height: H, x: 0, y: 0, frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true, focusable: false, show: false, resizable: true, hasShadow: false, backgroundColor: '#00000000', webPreferences: { contextIsolation: true } });
    const esc = (s) => String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const left = (p.toastPos || 'br')[1] === 'l';
    const sound = p.toastSound ? `<script>try{const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.frequency.value=880;g.gain.value=.06;o.connect(g);g.connect(a.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+.25);o.stop(a.currentTime+.26)}catch(e){}</script>` : '';
    const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent;overflow:hidden;font:13px "Segoe UI",system-ui,sans-serif;color:#fff;user-select:none;cursor:pointer}
.c{margin:14px;height:${H - 28}px;box-sizing:border-box;display:flex;gap:12px;align-items:center;padding:0 16px;border-radius:16px;background:linear-gradient(180deg,#221f27,#16141a);border:1px solid ${acc};box-shadow:0 3px 10px rgba(0,0,0,.45);animation:in .35s cubic-bezier(.2,.9,.3,1.1) both}
i{font-style:normal;font-size:26px}b{display:block;font-size:14px;margin-bottom:2px}span{color:#cfc8d3;font-size:12px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
@keyframes in{from{opacity:0;transform:translateX(${left ? -40 : 40}px)}to{opacity:1;transform:none}}</style>
<div class="c" onclick="document.title='click'"><i>${TOAST_ICON[kind] || TOAST_ICON.info}</i><div><b>${esc(title)}</b><span>${esc(body)}</span></div></div>${sound}`;
    tw.setAlwaysOnTop(true, 'screen-saver');
    tw.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    tw.once('ready-to-show', () => tw.showInactive());
    tw.webContents.on('page-title-updated', (_e, t) => { if (t === 'click') { showWin(); if (!tw.isDestroyed()) tw.close(); } });
    toasts.push(tw); layoutToasts();
    tw.on('closed', () => { const i = toasts.indexOf(tw); if (i >= 0) toasts.splice(i, 1); layoutToasts(); });
    setTimeout(() => { if (!tw.isDestroyed()) tw.close(); }, Math.min(20, Math.max(3, +p.toastSec || 8)) * 1000);
  } catch (e) { log('toast error ' + e.message); }
}
function notify(title, body, kind) {
  showToast(title, body, kind);
  if (win && !win.isDestroyed()) win.webContents.send('notice', { title, body, kind: kind || 'info', silent: true });
}
ipcMain.handle('notify-test', () => { showToast('Проверка уведомлений', 'Если вы видите это окно, уведомления работают.', 'info'); return true; });let notifiedUpdate = null;
// один экземпляр: второй запуск просто показывает окно
if (!app.requestSingleInstanceLock()) { app.quit(); }
app.on('second-instance', () => showWin());

const LOG = path.join(app.getPath('userData'), 'overlay.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(LOG, line); } catch (e) {}
}

function placeWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  if (SIDE === 'top') {
    const w = Math.round(workArea.width * 0.6), h = 150;
    return { x: workArea.x + Math.round((workArea.width - w) / 2), y: workArea.y + 12, width: w, height: h };
  }
  const h = Math.round(workArea.height * HEIGHT_RATIO), w = winWidth();
  return {
    x: workArea.x + Math.round((workArea.width - w) / 2),
    y: workArea.y + Math.round(workArea.height * 0.12),
    width: w, height: 160
  };
}

function createWindow() {
  win = new BrowserWindow({
    ...placeWindow(),
    show: false,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    icon: path.join(__dirname, 'tray.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      backgroundThrottling: false   // скрытое окно не «засыпает», поэтому открывается без задержки
    }
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setOpacity(OPACITY);
  loadContent();

  // окно не открывает чужие страницы и никуда не уходит с файлов приложения
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => { if (!/^file:\/\//.test(url)) e.preventDefault(); });
  win.webContents.session.setPermissionRequestHandler((_wc, perm, cb) => cb(['media', 'display-capture', 'clipboard-sanitized-write'].includes(perm)));
  win.webContents.on('did-fail-load', (_e, code, desc) => log(`did-fail-load ${code} ${desc}`));
  win.once('ready-to-show', () => { if (STARTED_HIDDEN && auth.get().ok) { visible = false; updateTrayMenu(); } else { win.show(); visible = true; } });
  if (DEBUG) win.webContents.openDevTools({ mode: 'detach' });

  // закрытие окна = скрыть в трей, а не выход
  win.on('close', (e) => {
    if (!quitting) { e.preventDefault(); hideWin(); }
  });
  win.on('blur', () => { if (readPrefs().autohide && win && !win.isDestroyed() && win.isVisible() && !quitting) setTimeout(() => { if (win && !win.isDestroyed() && !win.isFocused()) hideWin(); }, 150); });
  win.on('moved', () => { if (win && !win.isDestroyed()) snapInfo().then((i) => { if (i && win && !win.isDestroyed()) win.webContents.send('ov-bounds', i); }); });
  win.on('closed', () => { win = null; });
}

function loadContent() {
  if (!win) return;
  win.loadFile(path.join(__dirname, auth.get().ok ? 'index.html' : 'login.html'));
}

const snapAllowed = () => !!(auth.get().ok && (auth.get().admin || me.tier === 'ultra'));
const snapOn = () => !!readPrefs().snap && snapAllowed();
// Живое размытие: само меню получает видеопоток экрана (как демонстрация экрана) и рисует его под плашками на GPU.
// Окно хелпера исключено из захвата (защита содержимого), поэтому оно не размывает само себя.
let screenIds = {};
async function snapInfo() {
  if (!win || win.isDestroyed()) return null;
  const b = win.getBounds();
  const d = screen.getDisplayNearestPoint({ x: b.x + 40, y: b.y + 40 });
  if (!screenIds[d.id]) {
    // перечисление экранов у Windows медленное (около 2 секунд), поэтому делаем один раз и запоминаем
    const srcs = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1, height: 1 }, fetchWindowIcons: false });
    const src = srcs.find((s) => String(s.display_id) === String(d.id)) || srcs[0];
    screenIds[d.id] = src && src.id;
  }
  return { id: screenIds[d.id] || null, b, disp: d.bounds };
}
function applyProtection() { try { if (win && !win.isDestroyed()) win.setContentProtection(snapOn()); } catch (e) {} }
function showWin() {
  if (!win) createWindow();
  const was = win.isVisible();
  win.setAlwaysOnTop(true, 'screen-saver');
  // окно показываем невидимым: меню сначала сбрасывает состояние и подгоняет размер, потом плавно проявляется (без «прыжка» старого кадра)
  if (!was) win.setOpacity(0);
  applyProtection();
  win.show(); win.focus(); win.webContents.focus(); visible = true;
  win.webContents.send('ov-show');
  if (!was) setTimeout(() => { if (win && !win.isDestroyed()) win.setOpacity(1); }, 50);
  updateTrayMenu();
}
function hideWin() {
  if (win) win.hide();
  visible = false;
  updateTrayMenu();
}function toggle() {
  const shown = !!(win && win.isVisible());
  log(`toggle: was ${shown ? 'visible' : 'hidden'}`);
  shown ? hideWin() : showWin();
}

function quitApp() {
  quitting = true;
  if (tray) { tray.destroy(); tray = null; }
  app.quit();
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'tray.png'));
  tray = new Tray(icon);
  tray.setToolTip(APP_NAME);
  tray.on('click', toggle);
  tray.on('double-click', showWin);
  updateTrayMenu();
}


// ---------- автообновление ----------
function setupUpdater() {
  if (!app.isPackaged) { updateState = 'Обновления: режим разработки'; return; }
  autoUpdater.autoDownload = false;   // сначала спрашиваем пользователя
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('checking-for-update', () => { updateState = 'Проверка обновлений…'; updateTrayMenu(); });
  autoUpdater.on('update-available', (i) => {
    updateState = `Доступна версия ${i.version}`;
    updateTrayMenu();
    if (declinedVersion === i.version) { pushUpdate({ type: 'none', version: i.version, later: true, avail: true }); return; }
    pushUpdate({ type: 'available', version: i.version });
    if (notifiedUpdate !== i.version) { notifiedUpdate = i.version; notify('Доступно обновление', 'Helper Pix ' + i.version + ' готов к скачиванию. Откройте меню (Alt+Q).', 'update'); }
  });
  autoUpdater.on('update-not-available', () => { updateState = 'Установлена последняя версия'; updateTrayMenu(); });
  autoUpdater.on('download-progress', (p) => { updateState = `Скачивание: ${Math.round(p.percent)}%`; pushUpdate({ type: 'downloading', version: (lastUpdate && lastUpdate.version) || '', percent: p.percent }); updateTrayMenu(); });
  autoUpdater.on('update-downloaded', (i) => {
    updateState = 'Версия ' + i.version + ' готова';
    updateTrayMenu();
    if (autoInstall) { pushUpdate({ type: 'installing', version: i.version }); showWin(); setTimeout(installNow, 1200); return; }
    pushUpdate({ type: 'ready', version: i.version });
  });  autoUpdater.on('error', (e) => { updateState = 'Ошибка обновления'; log('updater error ' + e.message); updateTrayMenu(); });
  checkUpdates();
  setInterval(checkUpdates, 10 * 60 * 1000);
  setInterval(watchRelease, 45 * 1000);
}
// как только GitHub отдаёт новый latest.yml (сборка готова), сразу запрашиваем обновление
let remoteSeen = null, latestSeen = '';
// версия отстаёт на 2 и больше по среднему числу (3.0.x при актуальной 3.2.0) или по первому числу: функции блокируются до обновления
const isOutdated = () => { if (!app.isPackaged || !latestSeen) return false; const c = vnum(app.getVersion()), l = vnum(latestSeen); return l[0] > c[0] || (l[0] === c[0] && l[1] - c[1] >= 2); };
const vnum = (v) => String(v).split('.').map((x) => parseInt(x, 10) || 0);
const newer = (a, b) => { const x = vnum(a), y = vnum(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
async function watchRelease() {
  if (!app.isPackaged) return;
  try {
    const r = await fetch('https://github.com/kartonden123/Helper-Pix/releases/latest/download/latest.yml', { headers: { 'Cache-Control': 'no-cache' } });
    if (!r.ok) return;
    const m = /^version:\s*([\d.]+)/m.exec(await r.text());
    if (m) latestSeen = m[1];
    if (m && m[1] !== remoteSeen) { remoteSeen = m[1]; if (newer(m[1], app.getVersion())) checkUpdates(); }
  } catch (e) {}
}
// релиз уже опубликован, а установщик ещё собирается: файла latest.yml пока нет (404), это не ошибка, пробуем снова
const isBuilding = (e) => /latest\.yml|404/.test(String((e && e.message) || e));
let buildRetry = 0;
function checkUpdates() {
  if (!app.isPackaged) return;
  autoUpdater.checkForUpdates().then(() => { buildRetry = 0; }).catch(e => {
    log('check error ' + String(e.message).split(String.fromCharCode(10))[0]);
    if (isBuilding(e) && buildRetry < 40) { buildRetry++; setTimeout(checkUpdates, 45000); }
  });
}

function updateTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: visible ? 'Скрыть' : 'Показать', click: toggle },
    { label: 'Горячая клавиша: ' + hotKeys[0], enabled: false },
    { label: updateState, enabled: false },
    ...(lastUpdate && lastUpdate.later && lastUpdate.avail ? [{ label: 'Скачать обновление ' + lastUpdate.version, click: () => startDownload() }] : []),
    ...(lastUpdate && lastUpdate.later && !lastUpdate.avail ? [{ label: 'Установить обновление ' + lastUpdate.version, click: () => installNow() }] : []),
    { label: 'Проверить обновления', click: checkUpdates },
    { type: 'separator' },
    { label: 'Выйти из Discord', click: () => { auth.logout(); loadContent(); showWin(); } },
    { label: 'Выйти полностью', click: quitApp }
  ]));
}

ipcMain.on('ov-resize', (_e, h) => {
  if (!win || !(h > 0)) return;
  const max = Math.round(screen.getPrimaryDisplay().workArea.height * 0.9);
  const [w] = win.getContentSize();
  win.setContentSize(w, Math.min(Math.max(Math.round(h), 80), max));
});
ipcMain.on('ov-hide', () => hideWin());
// онлайн игровых серверов Majestic (публичный адрес, ключ не нужен): кэш на 45 секунд, оповещение о техработах на Las Vegas
let srvCache = { at: 0, servers: [] }, srvBusy = null, lvTech = null;
async function loadServers(force) {
  if (!force && Date.now() - srvCache.at < 45000) return srvCache;
  if (srvBusy) return srvBusy;
  srvBusy = (async () => {
    try {
      const r = await fetch('https://api.majestic-files.com/meta/servers', { signal: AbortSignal.timeout(12000) });
      const j = await r.json();
      const arr = ((j && j.result && j.result.servers) || []).filter((s) => s.project === 'majestic' && s.region === 'ru').map((s) => ({ id: s.id, name: s.name, players: +s.players || 0, queue: +s.queuedPlayers || 0, tech: !!s.techWorks, up: s.status !== false }));
      if (arr.length) {
        srvCache = { at: Date.now(), servers: arr };
        const lv = arr.find((s) => s.id === 'ru9');
        if (lv) { if (lvTech !== null && lvTech !== lv.tech) notify(lv.tech ? 'Las Vegas: технические работы' : 'Las Vegas снова доступен', lv.tech ? 'Сервер временно недоступен.' : 'Можно заходить в игру.', 'announce'); lvTech = lv.tech; }
      }
    } catch (e) { log('servers error ' + e.message); }
    srvBusy = null; return srvCache;
  })();
  return srvBusy;
}
const protect = require('./protect');
ipcMain.handle('protect-status', () => protect.status(win));
ipcMain.handle('server-online', (_e, force) => loadServers(!!force));
setInterval(() => { if (auth.get().ok) loadServers(true); }, 120000);
// копия настроек интерфейса (ph_*): localStorage Chromium пишет на диск с задержкой и может потерять запись при выходе
const LS_FILE = path.join(app.getPath('userData'), 'ls-mirror.json');
let lsMem = {}; try { lsMem = JSON.parse(fs.readFileSync(LS_FILE, 'utf8')) || {}; } catch (e) {}
let lsTimer = null;
const lsFlush = () => { clearTimeout(lsTimer); lsTimer = null; try { fs.writeFileSync(LS_FILE, JSON.stringify(lsMem)); } catch (e) {} };
ipcMain.on('ls-set', (_e, k, v) => {
  if (typeof k !== 'string' || !/^ph_[A-Za-z0-9_]+$/.test(k)) return;
  if (v === null) delete lsMem[k]; else if (k in lsMem || Object.keys(lsMem).length < 400) lsMem[k] = String(v).slice(0, 300000);
  if (!lsTimer) lsTimer = setTimeout(lsFlush, 300);
});
ipcMain.on('ls-load', (e) => { e.returnValue = lsMem; });
app.on('before-quit', lsFlush);
ipcMain.on('ov-ready', () => { if (win && !win.isDestroyed()) win.setOpacity(1); });
// ИИ-помощник: запрос идёт на сервер статистики, там проверяются Discord-аккаунт и дневной лимит
ipcMain.handle('ai-ask', async (_e, question, context, opts) => {
  opts = opts && typeof opts === 'object' ? opts : {};
  const t = auth.token();
  if (!t || !auth.get().ok) return { error: 'auth', message: 'Войдите через Discord, чтобы пользоваться ИИ.' };
  try {
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 45000);
    const r = await sfetch(STATS_URL + '/ai', { method: 'POST', signal: ctl.signal, headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ question, context, mode: opts.mode, history: Array.isArray(opts.history) ? opts.history.slice(-3) : [] }) });
    clearTimeout(to);
    return await r.json();
  } catch (e) { log('ai error ' + e.message); return { error: 'net', message: 'Нет связи с сервером ИИ. Вопрос не списан.' }; }
});
ipcMain.handle('ai-left', async () => {
  const t = auth.token(); if (!t || !auth.get().ok) return null;
  try { const r = await sfetch(STATS_URL + '/ai/left', { headers: { Authorization: 'Bearer ' + t } }); return await r.json(); } catch (e) { return null; }
});
ipcMain.handle('update-state', () => lastUpdate);
// ручная проверка из настроек
ipcMain.handle('update-check', async () => {
  if (!app.isPackaged) return { state: 'dev', current: app.getVersion() };
  declinedVersion = null;
  try {
    const r = await autoUpdater.checkForUpdates();
    const v = r && r.updateInfo && r.updateInfo.version;
    if (v && v !== app.getVersion() && (!lastUpdate || lastUpdate.type === 'none' || !lastUpdate.type)) pushUpdate({ type: 'available', version: v });
    const cur = lastUpdate && lastUpdate.type && lastUpdate.type !== 'none' ? lastUpdate : null;
    return cur ? { state: cur.type, version: cur.version, current: app.getVersion() } : { state: 'latest', current: app.getVersion() };
  } catch (e) { return { state: isBuilding(e) ? 'building' : 'error', current: app.getVersion() }; }
});
ipcMain.on('update-action', (_e, a) => {
  const u = lastUpdate || {};
  if (a === 'download' && (u.type === 'available' || u.avail)) startDownload();
  else if (a === 'install' && u.type === 'ready') { pushUpdate({ type: 'installing', version: u.version }); setTimeout(installNow, 600); }
  else if (a === 'later') {
    if (u.type === 'available') { declinedVersion = u.version; pushUpdate({ type: 'none', version: u.version, later: true, avail: true }); }
    else if (u.type === 'ready') pushUpdate({ type: 'none', version: u.version, later: true });
    updateTrayMenu();
  }
});
// автозапуск с Windows (по умолчанию включён при первом запуске) и размытие фона (Ультра Премиум)
const AUTOSTART_FLAG = () => path.join(app.getPath('userData'), 'autostart-init');
function setAutostart(on) { if (!app.isPackaged) return; try { app.setLoginItemSettings({ openAtLogin: !!on, args: ['--hidden'] }); } catch (e) { log('autostart error ' + e.message); } }
// На Windows getLoginItemSettings сравнивает аргументы запуска: без тех же args всегда false
const autostartState = () => { try { return !!app.getLoginItemSettings({ args: ['--hidden'] }).openAtLogin; } catch (e) { return false; } };
ipcMain.handle('autostart-get', () => (app.isPackaged ? autostartState() : false));
ipcMain.handle('autostart-set', (_e, on) => { setAutostart(on); return app.isPackaged ? autostartState() : false; });
// снимок экрана для режима покера (только Администратор и роль ДПВ); файл остаётся у пользователя на компьютере
ipcMain.handle('poker-shot', async () => {
  if (!(auth.get().admin || (me.roles || []).includes('dpv'))) return { error: 'forbidden' };
  try {
    const wasVisible = !!(win && win.isVisible());
    if (wasVisible) win.setOpacity(0);
    await new Promise(r => setTimeout(r, 200));
    const d = screen.getPrimaryDisplay(); const sf = d.scaleFactor || 1;
    const srcs = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: Math.round(d.size.width * sf), height: Math.round(d.size.height * sf) } });
    if (wasVisible) win.setOpacity(1);
    const img = srcs[0] && srcs[0].thumbnail; if (!img || img.isEmpty()) return { error: 'empty' };
    const dir = path.join(app.getPath('userData'), 'poker-shots'); fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'shot-' + Date.now() + '.png'); fs.writeFileSync(file, img.toPNG());
    return { path: file };
  } catch (e) { if (win) win.setOpacity(1); log('shot error ' + e.message); return { error: 'fail' }; }
});
ipcMain.on('ov-blur', (_e, on) => {
  if (!snapAllowed()) return;   // только Ультра Премиум
  try { fs.writeFileSync(PREFS_FILE, JSON.stringify({ ...readPrefs(), snap: !!on })); } catch (e) {}
  applyProtection();
  if (win && !win.isDestroyed()) win.webContents.send('snap-changed', !!on);
});
ipcMain.handle('snap-info', () => snapInfo());
// настройки, которые применяет основной процесс
const PREF_KEYS = ['hotkey', 'width', 'toastPos', 'toastSec', 'toastSound', 'notif', 'accent'];
ipcMain.handle('set-pref', (_e, key, value) => {
  if (!PREF_KEYS.includes(key)) return { ok: false };
  if (key === 'hotkey') {
    const acc = String(value || '');
    if (!/^(Alt|Control|Shift|CommandOrControl)(\+(Alt|Control|Shift))?\+([A-Z0-9`]|F([1-9]|1[0-2])|Space)$|^F([1-9]|1[0-2])$/.test(acc)) return { ok: false, error: 'Недопустимая клавиша' };
    hotKeys.forEach((k) => { try { globalShortcut.unregister(k); } catch (e) {} });
    let ok = false; try { ok = globalShortcut.register(acc, toggle); } catch (e) {}
    if (!ok) { hotKeys = [readPrefs().hotkey || 'Alt+Q', 'Control+Alt+Q']; regKeys(); return { ok: false, error: 'Эту комбинацию уже заняла другая программа' }; }
    hotKeys = [acc, 'Control+Alt+Q']; regKeys(); updateTrayMenu();
  }
  if (key === 'width') {
    value = Math.min(1300, Math.max(700, +value || WIDTH));
    if (win && !win.isDestroyed()) { const b = win.getBounds(); win.setBounds({ x: Math.round(b.x + (b.width - value) / 2), y: b.y, width: value, height: b.height }); }
  }
  try { fs.writeFileSync(PREFS_FILE, JSON.stringify({ ...readPrefs(), [key]: value })); } catch (e) {}
  return { ok: true, value };
});
ipcMain.on('open-url', (_e, u) => { if (/^https:\/\/(github\.com\/kartonden123\/|docs\.google\.com\/forms\/d\/e\/|discord\.gg\/2C2zUgv3VC$|yoomoney\.ru\/checkout\/)/.test(String(u))) require('electron').shell.openExternal(String(u)); });ipcMain.handle('ui-prefs', () => { const p = readPrefs(); return { snap: snapOn(), autohide: !!p.autohide, hotkey: hotKeys[0], width: winWidth(), toastPos: p.toastPos || 'br', toastSec: +p.toastSec || 8, toastSound: !!p.toastSound, notif: p.notif || {} }; });
ipcMain.on('ov-autohide', (_e, on) => { try { fs.writeFileSync(PREFS_FILE, JSON.stringify({ ...readPrefs(), autohide: !!on })); } catch (e) {} });
ipcMain.on('ov-opacity', (_e, v) => { if (win && v >= 0.3 && v <= 1) win.setOpacity(v); });
ipcMain.on('ov-position', (_e, side) => {
  if (!win) return;
  const wa = screen.getPrimaryDisplay().workArea; const b = win.getBounds();
  const x = side === 'left' ? wa.x + 12 : side === 'right' ? wa.x + wa.width - b.width - 12 : wa.x + Math.round((wa.width - b.width) / 2);
  win.setPosition(x, b.y);
  snapInfo().then((i) => { if (i && win && !win.isDestroyed()) win.webContents.send('ov-bounds', i); });
});
// Premium: статус приходит с сервера (у автора всегда включён), последний ответ хранится на случай отсутствия сети
const PREMIUM_FILE = () => path.join(app.getPath('userData'), 'premium.json');
let me = { roles: [], premium: false, tier: '', role: '', banned: false, announce: null };
try { me = { ...me, ...JSON.parse(fs.readFileSync(PREMIUM_FILE(), 'utf8')) }; } catch (e) {}
let meKnown = (() => { try { const j = JSON.parse(fs.readFileSync(PREMIUM_FILE(), 'utf8')); return Array.isArray(j.roles) && j.tier !== undefined; } catch (e) { return false; } })();
const RN_RU = { owner: 'Администратор', admin: 'Зам. Администратор', jr: 'Мл. Администратор', smod: 'Ст. Модератор', mod: 'Модератор' };
const SPECIAL_RU = [['dpv', 'ДПВ', 'Открыты дополнительные возможности (в том числе кнопка ♠).'], ['tester', 'Тестер', 'Выдан Premium и ранний доступ к новым функциям.'], ['curator', 'Куратор', 'Роль отображается в списке «В сети».'], ['helper', 'Хелпер', 'Роль отображается в списке «В сети».'], ['media', 'Медиа', 'Роль отображается в списке «В сети».'], ['partner', 'Партнёр', 'Выдан Premium.'], ['vip', 'VIP', 'Выдан Premium.'], ['dev', 'Разработчик', 'Выдан Premium.'], ['legend', 'Легенда', 'Выдан Premium.'], ['event', 'Ивент-мейкер', 'Роль отображается в списке «В сети».'], ['support', 'Поддержка', 'Роль отображается в списке «В сети».']];
function diffMe(a, b, isOwner) {
  if (isOwner) { if (b.announce && (!a.announce || a.announce.id !== b.announce.id)) { /* свои объявления не показываем */ } return; }
  if (a.role !== b.role) {
    if (b.role) notify('Вам назначена роль', RN_RU[b.role] || b.role, 'role');
    else notify('Роль снята', 'Вы больше не ' + (RN_RU[a.role] || 'сотрудник').toLowerCase(), 'role');
  }
  if (a.tier !== b.tier && !a.role && !b.role) {
    if (b.tier === 'ultra') notify('Вам выдан Ультра Премиум', 'Открыты все функции: размытие фона, свой цвет, ИИ 100 вопросов в день.', 'premium');
    else if (b.tier === 'premium') notify(a.tier === 'ultra' ? 'Ультра Премиум снят' : 'Вам выдан Premium', a.tier === 'ultra' ? 'Остался обычный Premium.' : 'Открыты калькулятор дела, избранное, заметки, таймеры и настройки.', 'premium');
    else notify(a.tier === 'ultra' ? 'Ультра Премиум снят' : 'Premium снят', 'Дополнительные функции отключены.', 'premium');
  }
  for (const [k, name, perk] of SPECIAL_RU) {
    const ap = (a.roles || []).includes(k), bp = (b.roles || []).includes(k);
    if (!ap && bp) notify('Вам выдана роль «' + name + '»', perk, 'role');
    if (ap && !bp) notify('Роль «' + name + '» снята', 'Связанные возможности отключены.', 'role');
  }
  if (!a.banned && b.banned) notify('Доступ ограничен', 'Администратор заблокировал вам доступ к хелперу.', 'ban');
  if (a.banned && !b.banned) notify('Доступ восстановлен', 'Блокировка снята.', 'ban');
  if (b.announce && b.announce.text && (!a.announce || a.announce.id !== b.announce.id)) notify('Объявление', b.announce.text, 'announce');
}
let lastPushAt = 0;
async function refreshMe() {
  const t = auth.token();
  if (!t || !auth.get().ok) { if (!auth.get().ok) me = { roles: [], premium: false, tier: '', role: '', banned: false, announce: null }; return; }
  try {
    const r = await sfetch(STATS_URL + '/me', { headers: { Authorization: 'Bearer ' + t } });
    if (r.ok) {
      const d = await r.json();
      if (Date.now() - lastPushAt < 90000) return;   // свежие данные из мгновенного канала важнее задержанного ответа KV
      const nm = { roles: d.roles || [], premium: !!d.premium, tier: d.tier || (d.premium ? 'premium' : ''), premSource: d.premSource || '', premUntil: d.premUntil || 0, role: d.role || '', banned: !!d.banned, announce: d.announce || null };
      if (meKnown) diffMe(me, nm, !!d.admin);
      meKnown = true; me = nm;
      try { fs.writeFileSync(PREMIUM_FILE(), JSON.stringify(me)); } catch (e) {}
    }
  } catch (e) { log('me error ' + e.message); }
}
function applyPatch(p) {
  lastPushAt = Date.now();
  const nm = { ...me, ...p };
  if (p.announce === undefined) nm.announce = me.announce;
  const owner = !!auth.get().admin;
  if (meKnown) diffMe(me, nm, owner);
  me = nm; meKnown = true;
  try { fs.writeFileSync(PREMIUM_FILE(), JSON.stringify(me)); } catch (e) {}
  if (win && !win.isDestroyed()) win.webContents.send('me-changed');
}
// ---------- мгновенный канал: чат и уведомления (WebSocket) ----------
let ws = null, wsTimer = null, wsDelay = 3000, wsPing = null, chatHist = [];
function wsSend(o) { try { if (ws && ws.readyState === 1) { ws.send(JSON.stringify(o)); return true; } } catch (e) {} return false; }
function connectWs() {
  clearTimeout(wsTimer);
  const t = auth.token();
  if (!t || !auth.get().ok || (ws && ws.readyState <= 1)) return;
  let WS; try { WS = require('ws'); } catch (e) { log('ws missing'); return; }
  try {
    ws = new WS(STATS_URL.replace(/^http/, 'ws') + '/ws', { headers: { Authorization: 'Bearer ' + t } });
  } catch (e) { wsTimer = setTimeout(connectWs, wsDelay); return; }
  ws.on('open', () => { wsDelay = 3000; clearInterval(wsPing); wsPing = setInterval(() => wsSend({ t: 'ping' }), 40000); log('ws open'); });
  ws.on('message', (d) => {
    let m; try { m = JSON.parse(String(d)); } catch (e) { return; }
    const myId = auth.get().user && auth.get().user.id;
    if (m.t === 'hist') { chatHist = m.m || []; if (win && !win.isDestroyed()) win.webContents.send('chat', { t: 'hist', m: chatHist }); }
    else if (m.t === 'chat') {
      chatHist.push(m.m); if (chatHist.length > 100) chatHist.shift();
      if (win && !win.isDestroyed()) win.webContents.send('chat', m);
      if (m.m.uid !== myId && !(win && win.isVisible())) showToast(m.m.name, m.m.text, 'chat');
    }
    else if (m.t === 'del') { chatHist = chatHist.filter((x) => x.id !== m.id); if (win && !win.isDestroyed()) win.webContents.send('chat', m); }
    else if (m.t === 'user' && m.id === myId) applyPatch({ role: m.role || '', roles: m.roles || [], tier: m.tier || '', premium: !!m.premium, premSource: m.premSource || '', premUntil: m.premUntil || 0, banned: !!m.banned });
    else if (m.t === 'announce') applyPatch({ announce: m.a || null });
    else if (m.t === 'err' && win && !win.isDestroyed()) win.webContents.send('chat', m);
  });
  const again = () => { clearInterval(wsPing); ws = null; wsTimer = setTimeout(connectWs, wsDelay); wsDelay = Math.min(60000, wsDelay * 2); };
  ws.on('close', again);
  ws.on('error', (e) => { log('ws error ' + e.message); if (/401/.test(e.message)) tokenRefresh(); });
}
ipcMain.handle('chat-hist', () => chatHist);
ipcMain.handle('chat-send', (_e, text) => wsSend({ t: 'chat', text: String(text || '').slice(0, 300) }));
ipcMain.handle('chat-del', (_e, id) => wsSend({ t: 'del', id: String(id) }));
ipcMain.on('app-version', (e) => { e.returnValue = app.getVersion(); });
let viewAs = ''; try { viewAs = fs.readFileSync(path.join(app.getPath('userData'), 'viewas'), 'utf8').trim(); } catch (e) {}
ipcMain.handle('viewas-set', (_e, v) => { if (!auth.get().admin) return ''; viewAs = ['user', 'premium', 'ultra'].includes(v) ? v : ''; try { fs.writeFileSync(path.join(app.getPath('userData'), 'viewas'), viewAs); } catch (e) {} if (win && !win.isDestroyed()) win.webContents.send('me-changed'); return viewAs; });
ipcMain.handle('auth-state', async (_e, fast) => {
  if (!fast) await refreshMe();
  const s = auth.get();
  if (isOutdated()) return { ...s, outdated: true, latest: latestSeen, current: app.getVersion(), role: '', roles: [], staff: false, premium: false, tier: '', announce: null };
  const va = s.ok && s.admin ? viewAs : '';   // режим «смотреть как»: только внешний вид для Администратора, права на сервере не меняются
  if (va) {
    const tr = va === 'ultra' ? 'ultra' : va === 'premium' ? 'premium' : '';
    return { ...s, admin: false, realAdmin: true, viewAs: va, role: '', roles: [], staff: false, premium: !!tr, tier: tr, banned: false, premSource: '', premUntil: 0, announce: me.announce };
  }
  const role = s.ok ? (s.admin ? 'owner' : me.role) : '';
  return { ...s, realAdmin: !!(s.ok && s.admin), viewAs: '', role, roles: s.ok ? (s.admin ? ['owner'] : (me.roles || [])) : [], staff: !!role, premium: !!(s.ok && (role || me.premium)), tier: !s.ok ? '' : (s.admin ? 'ultra' : (me.tier || (role || me.premium ? 'premium' : ''))), banned: !!(s.ok && me.banned && !s.admin), premSource: s.ok ? (me.premSource || '') : '', premUntil: s.ok ? (me.premUntil || 0) : 0, announce: s.ok ? me.announce : null };
});
// панель персонала и список «В сети»: права проверяет сервер
ipcMain.handle('staff-api', async (_e, method, apiPath, body) => {
  const t = auth.token();
  if (!t || !auth.get().ok) return { error: 'Войдите через Discord' };
  if (!/^\/(staff\/[a-z]+|pay\/[a-z]+|online)(\?id=\d{5,25})?$/.test(apiPath)) return { error: 'bad path' };
  try {
    const r = await sfetch(STATS_URL + apiPath, { method: method === 'POST' ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body || {}) : undefined });
    const d = await r.json();
    if (!r.ok && !d.error) d.error = 'Ошибка ' + r.status;
    if (d.error === 'bad token') d.error = 'Сессия Discord обновляется, повторите через пару секунд';
    if (d.error === 'discord busy') d.error = 'Discord сейчас перегружен, повторите позже';
    return d;
  } catch (e) { return { error: 'Нет связи с сервером' }; }
});ipcMain.handle('admin-premium', async (_e, id, on) => {
  const t = auth.token();
  if (!t || !auth.get().admin) return { error: 'forbidden' };
  try {
    const r = await sfetch(STATS_URL + '/admin/premium', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, on: !!on }) });
    return await r.json();
  } catch (e) { return { error: 'Нет связи с сервером' }; }
});
// статистика: сообщаем серверу, что человек пользуется хелпером
async function ping() {
  const t = auth.token();
  if (!t || !auth.get().ok || false) return;
  try {
    await sfetch(STATS_URL + '/ping', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ version: app.getVersion() }) });
  } catch (e) { log('ping error ' + e.message); }
}
// админ-панель: сервер сам проверяет, что это ваш Discord ID
ipcMain.handle('admin-users', async () => {
  const t = auth.token();
  if (!t || !auth.get().admin) return { error: 'forbidden' };
  try {
    const r = await sfetch(STATS_URL + '/admin/users', { headers: { Authorization: 'Bearer ' + t } });
    return await r.json();
  } catch (e) { return { error: 'Нет связи с сервером статистики' }; }
});
ipcMain.handle('auth-login', async () => {
  const s = await auth.login();
  log('auth login: ' + s.ok + ' ' + (s.reason || ''));
  if (s.ok) { loadContent(); ping(); }
  showWin();
  return s;
});
// ---------- токен Discord: обновляем сами, как только сервер сказал «401» ----------
let refreshing = null, lastRefresh = 0;
function tokenRefresh(force) {
  if (refreshing) return refreshing;
  if (!force && Date.now() - lastRefresh < 20000) return Promise.resolve(auth.get());
  lastRefresh = Date.now();
  const was = auth.get().ok;
  refreshing = auth.recheck().then((s) => {
    log('auth refresh: ' + s.ok + ' token:' + !!auth.token() + ' ' + (s.reason || ''));
    if (was !== s.ok) { loadContent(); if (!s.ok) showWin(); }
    if (s.ok && auth.token()) connectWs();
    return s;
  }).catch((e) => { log('auth refresh error ' + e.message); return auth.get(); }).finally(() => { refreshing = null; });
  return refreshing;
}
// запрос к серверу хелпера: при 401 (токен устарел) обновляем токен и повторяем один раз
async function sfetch(url, init = {}) {
  let r = await fetch(url, init);
  if (r.status === 401 && init.headers && init.headers.Authorization) {
    await tokenRefresh(Date.now() - lastRefresh > 5000);
    const t = auth.token(); if (!t) return r;
    r = await fetch(url, { ...init, headers: { ...init.headers, Authorization: 'Bearer ' + t } });
  }
  return r;
}
async function recheckAuth() {
  const was = auth.get().ok;
  const s = await auth.recheck();
  log('auth recheck: ' + s.ok + ' ' + (s.reason || ''));
  if (s.ok) ping();
  if (was !== s.ok) { loadContent(); if (!s.ok) showWin(); }
}

app.whenReady().then(async () => {
  await auth.recheck();
  createWindow();
  setInterval(recheckAuth, 3 * 60 * 60 * 1000);
  ping();
  setInterval(ping, 20 * 60 * 1000);
  setTimeout(refreshMe, 20000);
  // после сна или потери сети: токен мог устареть, обновляем; в режиме «без связи» пробуем получить токен раз в минуту
  setInterval(() => { if (auth.get().ok && !auth.token()) tokenRefresh(true); }, 60000);
  try { require('electron').powerMonitor.on('resume', () => setTimeout(() => { tokenRefresh(true); checkUpdates(); }, 6000)); } catch (e) {}
  connectWs(); setInterval(connectWs, 15000);
  setInterval(refreshMe, 3 * 60 * 1000);
  createTray();
  if (app.isPackaged && !fs.existsSync(AUTOSTART_FLAG())) { setAutostart(true); try { fs.writeFileSync(AUTOSTART_FLAG(), '1'); } catch (e) {} }
  setupUpdater();
  regKeys = () => [...new Set(hotKeys)].forEach(k => {
    if (globalShortcut.isRegistered(k)) return;
    const ok = globalShortcut.register(k, toggle);
    if (ok) log(`shortcut ${k}: true`);
  });
  regKeys();
  log(`shortcut ${TOGGLE_KEY}: ${globalShortcut.isRegistered(TOGGLE_KEY)}`);
  // если клавишу держала другая программа, пробуем снова
  setInterval(regKeys, 5000);
  app.on('activate', showWin);
}).catch(e => log('start error ' + e.stack));

app.on('before-quit', () => { quitting = true; });
app.on('will-quit', () => globalShortcut.unregisterAll());
// не выходим, когда все окна скрыты: приложение живёт в трее
app.on('window-all-closed', () => { /* остаёмся в трее */ });
