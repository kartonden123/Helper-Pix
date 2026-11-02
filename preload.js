const { contextBridge, ipcRenderer } = require('electron');
// restore UI settings from the main-process copy before page scripts run
try {
  const m = ipcRenderer.sendSync('ls-load') || {};
  for (const k of Object.keys(m)) if (localStorage.getItem(k) !== m[k]) localStorage.setItem(k, m[k]);
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^ph_/.test(k) && !(k in m)) ipcRenderer.send('ls-set', k, localStorage.getItem(k)); }
} catch (e) {}
contextBridge.exposeInMainWorld('overlay', {
  version: '3.0.1',
  lsSet: (k, v) => ipcRenderer.send('ls-set', k, v),
  protectStatus: () => ipcRenderer.invoke('protect-status'),
  serverOnline: (force) => ipcRenderer.invoke('server-online', !!force),
  setAutohide: (on) => ipcRenderer.send('ov-autohide', !!on),
  setPref: (k, v) => ipcRenderer.invoke('set-pref', k, v),
  openUrl: (u) => ipcRenderer.send('open-url', u),
  uiPrefs: () => ipcRenderer.invoke('ui-prefs'),
  snapInfo: () => ipcRenderer.invoke('snap-info'),
  onSnapChanged: (cb) => ipcRenderer.on('snap-changed', (_e, on) => cb(on)),
  onBounds: (cb) => ipcRenderer.on('ov-bounds', (_e, b) => cb(b)),
  notifyTest: () => ipcRenderer.invoke('notify-test'),
  onMeChanged: (cb) => ipcRenderer.on('me-changed', () => cb()),
  chatHist: () => ipcRenderer.invoke('chat-hist'),
  chatSend: (t) => ipcRenderer.invoke('chat-send', t),
  chatDel: (id) => ipcRenderer.invoke('chat-del', id),
  onChat: (cb) => ipcRenderer.on('chat', (_e, m) => cb(m)),
  pokerShot: () => ipcRenderer.invoke('poker-shot'),
  ready: () => ipcRenderer.send('ov-ready'),
  viewAsSet: (v) => ipcRenderer.invoke('viewas-set', String(v || '')),
  autostartGet: () => ipcRenderer.invoke('autostart-get'),
  autostartSet: (on) => ipcRenderer.invoke('autostart-set', !!on),
  setBlur: (on) => ipcRenderer.send('ov-blur', !!on),
  checkUpdate: () => ipcRenderer.invoke('update-check'),
  onNotice: (cb) => ipcRenderer.on('notice', (_e, n) => cb(n)),
  ignore: (v) => ipcRenderer.send('ov-ignore', !!v),
  hide: () => ipcRenderer.send('ov-hide'),
  resize: (h) => ipcRenderer.send('ov-resize', h),
  setOpacity: (v) => ipcRenderer.send('ov-opacity', v),
  setPosition: (s) => ipcRenderer.send('ov-position', s),
  onShow: (cb) => ipcRenderer.on('ov-show', () => cb()),
  login: () => ipcRenderer.invoke('auth-login'),
  authState: (fast) => ipcRenderer.invoke('auth-state', !!fast),
  onUpdate: (cb) => ipcRenderer.on('update-state', (_e, s) => cb(s)),
  updateState: () => ipcRenderer.invoke('update-state'),
  updateAction: (a) => ipcRenderer.send('update-action', a),
  aiAsk: (q, c, o) => ipcRenderer.invoke('ai-ask', q, c, o),
  aiLeft: () => ipcRenderer.invoke('ai-left'),
  staffApi: (method, p, body) => ipcRenderer.invoke('staff-api', method, p, body),
  adminUsers: () => ipcRenderer.invoke('admin-users'),
  adminPremium: (id, on) => ipcRenderer.invoke('admin-premium', id, on)
});
