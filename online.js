/* Онлайн серверов Majestic: плашка Las Vegas вверху меню и экран со всеми серверами. Данные получены с majestic-rp.ru. */
(function () {
  const S = window.PH, X = window.PHX, ov = window.overlay;
  if (!S || !X || !ov || !ov.serverOnline) return;
  const { LS } = X;
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  let data = { servers: [] }, timer = null;

  const css = document.createElement('style');
  css.textContent = `
  .lvpill{flex:none;display:flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;font-size:12px;font-weight:600;color:#dcd6e0;background:rgba(255,255,255,.07);border:1px solid var(--line);cursor:pointer;transition:.15s;white-space:nowrap;-webkit-app-region:no-drag}
  .lvpill .lvq,.lvpill .lvn{display:none}
  @media (min-width:1000px){.lvpill .lvn{display:inline}.lvpill .lvq{display:inline}}
  .lvpill:hover{border-color:rgba(var(--acc-rgb),.7);color:#fff}
  .lvpill i{width:7px;height:7px;border-radius:50%;background:#3ddc84;box-shadow:0 0 6px #3ddc84}
  .lvpill.down i{background:#ff6b6b;box-shadow:0 0 6px #ff6b6b}.lvpill.tech i{background:#ffc43c;box-shadow:0 0 6px #ffc43c}
  .nolv .lvpill{display:none}
  .srv{display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:center;padding:9px 12px;border-radius:12px;margin:3px 0;background:rgba(255,255,255,.04);border:1px solid transparent}
  .srv.me{border-color:rgba(var(--acc-rgb),.6);background:rgba(var(--acc-rgb),.1)}
  .srv b{font-weight:600}.srv small{color:var(--muted)}
  .srv .bar2{height:5px;border-radius:5px;background:rgba(255,255,255,.08);margin-top:5px;overflow:hidden}.srv .bar2 i{display:block;height:100%;background:var(--accent);border-radius:5px}
  .srv .n{font-variant-numeric:tabular-nums;font-weight:700;min-width:54px;text-align:right}
  .srv button{background:none;border:0;font-size:16px;cursor:pointer;color:#888}.srv button.on{color:#ffc43c}
  .spark{display:block;width:100%;height:70px;margin:6px 0 2px}
  `;
  document.head.appendChild(css);

  const fav = () => LS.get('ph_lvSrv', 'ru9');
  const me = () => data.servers.find((s) => s.id === fav());
  const hist = () => LS.get('ph_lvHist', []);

  function remember(s) {
    if (!s) return;
    const h = hist(), now = Date.now();
    if (h.length && now - h[h.length - 1][0] < 50000) return;
    h.push([now, s.players]); while (h.length > 90) h.shift();
    LS.set('ph_lvHist', h);
  }

  function pill() {
    const bar = $('#bar'); if (!bar) return;
    let p = $('#lvPill');
    if (!p) {
      p = document.createElement('div'); p.id = 'lvPill'; p.className = 'lvpill'; p.title = 'Онлайн серверов'; p.onclick = () => openServers();
      const first = bar.querySelector('.ib'); bar.insertBefore(p, first || null);   // внутри строки меню, перед кнопками
    }
    const s = me();
    document.documentElement.classList.toggle('nolv', LS.get('ph_lvPill', true) === false);
    if (!s) { p.className = 'lvpill down'; p.innerHTML = '<i></i>Онлайн: нет данных'; return; }
    p.className = 'lvpill' + (s.tech ? ' tech' : s.up ? '' : ' down');
    p.title = s.name + ': ' + fmt(s.players) + ' игроков' + (s.queue ? ', очередь ' + s.queue : '') + (s.tech ? ', технические работы' : '') + '. Нажмите, чтобы открыть все серверы';
    p.innerHTML = `<i></i><span class="lvn">${s.name}:&nbsp;</span>${fmt(s.players)}<span class="lvq">${s.queue ? ' · очередь ' + s.queue : ''}${s.tech ? ' · техработы' : ''}</span>`;
  }

  function spark() {
    const h = hist(); if (h.length < 2) return '<p class="t" style="margin:4px 0">График появится после нескольких обновлений.</p>';
    const W = 600, H = 70, v = h.map((x) => x[1]), lo = Math.min(...v), hi = Math.max(...v), r = Math.max(1, hi - lo);
    const pts = h.map((x, i) => (i / (h.length - 1) * W).toFixed(1) + ',' + (H - 6 - (x[1] - lo) / r * (H - 14)).toFixed(1)).join(' ');
    return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2" vector-effect="non-scaling-stroke"/></svg><small style="color:var(--muted)">за последние ${h.length} обновл.: минимум ${fmt(lo)}, максимум ${fmt(hi)}</small>`;
  }

  async function openServers(sortBy) {
    view = 'memo'; panel.classList.add('on');
    const sort = sortBy || LS.get('ph_lvSort', 'players');
    list.innerHTML = backBtn() + `<div class="det"><h2>🌐 Онлайн серверов</h2><p class="t" id="lvSum">Загрузка…</p><div id="lvGraph"></div>
      <div class="actions"><button class="abtn${sort === 'players' ? ' on' : ''}" data-s="players">По онлайну</button><button class="abtn${sort === 'name' ? ' on' : ''}" data-s="name">По названию</button><button class="abtn${sort === 'queue' ? ' on' : ''}" data-s="queue">По очереди</button><button class="abtn" id="lvRef">🔄 Обновить</button></div>
      <div id="lvList"></div><p class="t" style="margin-top:10px;font-size:11.5px">Данные получены с majestic-rp.ru. ★ — выбрать свой сервер для плашки вверху.</p></div>`;
    $('#bk').onclick = goBack; $('#cnt').textContent = '';
    list.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { LS.set('ph_lvSort', b.dataset.s); openServers(b.dataset.s); }));
    $('#lvRef').onclick = async () => { $('#lvRef').disabled = true; data = (await ov.serverOnline(true)) || data; draw(); };
    function draw() {
      const arr = data.servers.slice(); if (!arr.length) { $('#lvSum').textContent = 'Нет данных. Проверьте интернет.'; $('#lvList').innerHTML = ''; return; }
      arr.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'queue' ? b.queue - a.queue || b.players - a.players : b.players - a.players);
      const total = arr.reduce((n, s) => n + s.players, 0), mx = Math.max(...arr.map((s) => s.players), 1), cur = me();
      $('#lvSum').innerHTML = `Всего в игре: <b>${fmt(total)}</b> · серверов: ${arr.length}${cur ? ` · ${esc(cur.name)}: <b>${fmt(cur.players)}</b>${cur.queue ? ', очередь ' + cur.queue : ''}` : ''} · обновлено ${new Date(data.at || Date.now()).toLocaleTimeString('ru-RU')}`;
      $('#lvGraph').innerHTML = spark();
      $('#lvList').innerHTML = arr.map((s) => `<div class="srv${s.id === fav() ? ' me' : ''}"><div><b>${esc(s.name)}</b>${s.tech ? ' <small>· техработы</small>' : s.up ? '' : ' <small>· недоступен</small>'}${s.queue ? ` <small>· очередь ${s.queue}</small>` : ''}<div class="bar2"><i style="width:${Math.round(s.players / mx * 100)}%"></i></div></div><span class="n">${fmt(s.players)}</span><button data-f="${s.id}" class="${s.id === fav() ? 'on' : ''}" title="Мой сервер">${s.id === fav() ? '★' : '☆'}</button></div>`).join('');
      list.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => { LS.set('ph_lvSrv', b.dataset.f); pill(); draw(); }));
    }
    draw();
    data = (await ov.serverOnline()) || data; remember(me()); pill(); if ($('#lvList')) draw();
  }

  async function poll(force) {
    try { data = (await ov.serverOnline(force)) || data; remember(me()); pill(); } catch (e) {}
  }
  function schedule() {
    clearInterval(timer);
    timer = setInterval(() => { if (document.visibilityState !== 'hidden') poll(); }, Math.max(30, LS.get('ph_lvSec', 60)) * 1000);
  }
  pill(); poll(); schedule();
  if (ov.onShow) ov.onShow(() => poll());
  window.PHX_online = { openServers, poll, schedule, pill };
})();
