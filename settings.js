/* Настройки: разделы слева, переключатели справа. Часть применяется в окне, часть в основном процессе (горячая клавиша, ширина, уведомления). */
(function () {
  const S = window.PH, X = window.PHX;
  if (!S || !X) return;
  const $ = (s) => document.querySelector(s);
  const { LS } = X;
  const ov = window.overlay || {};
  const root = document.documentElement;
  const FONTS = { segoe: '"Segoe UI",Inter,system-ui,sans-serif', inter: 'Inter,"Segoe UI",system-ui,sans-serif', system: 'system-ui,-apple-system,"Segoe UI",sans-serif', mono: '"Cascadia Mono",Consolas,"Courier New",monospace' };
  const NEWS = [
    ['2.8.2', 'Онлайн теперь внутри строки меню'],
    ['2.8.1', 'HSP Protect: защита приложения и сервера, самопроверка в настройках'],
    ['2.8.0', 'Онлайн Las Vegas и всех серверов, 10 новых особых ролей, уставы FIB, Weazel, прокуратуры, настройки не теряются'],
    ['2.7.0', 'Новые настройки (около 40), исправлена ошибка «bad token», список слева больше не висит поверх других экранов'],
    ['2.6.2', 'Меню открывается там, где его свернули'],
    ['2.6.0', 'Новая памятка, обновление в один клик'],
    ['2.5.x', 'Живое размытие, иконки, инструменты'],
    ['2.4.x', 'Чат, мгновенные уведомления'],
    ['2.3.0', 'Режим покера, несколько ролей, роль ДПВ']
  ];

  /* ---------- применение настроек вида и поведения ---------- */
  function applyUI() {
    root.classList.toggle('nohint', !LS.get('ph_hint', true));
    root.classList.toggle('compact', !!LS.get('ph_compact', false));
    root.classList.toggle('noanim', !LS.get('ph_anim', true));
    root.classList.toggle('noai', !LS.get('ph_aiRow', true));
    root.classList.toggle('nohl', !LS.get('ph_hl', true));
    root.classList.toggle('noqb', !LS.get('ph_quickBtns', true));
    root.style.setProperty('--rad', LS.get('ph_radius', 22) + 'px');
    root.style.setProperty('--font', FONTS[LS.get('ph_font', 'segoe')] || FONTS.segoe);
    document.body.style.zoom = String(LS.get('ph_zoom', 100) / 100);
    window.PH_LIMIT = LS.get('ph_limit', 40);
    window.PH_SEARCHALL = !!LS.get('ph_searchAll', false);
    window.PH_ESCHIDE = LS.get('ph_escHide', true) !== false;
    window.PH_OPENHOME = !!LS.get('ph_openHome', false);
  }
  const accentNow = () => getComputedStyle(root).getPropertyValue('--accent').trim();
  const syncAccent = () => { if (ov.setPref) ov.setPref('accent', accentNow()); };

  const css = document.createElement('style');
  css.textContent = `
  body{font-family:var(--font,"Segoe UI",Inter,system-ui,sans-serif)!important}
  .bar{border-radius:var(--rad,22px)!important}.panel{border-radius:calc(var(--rad,22px) - 2px)!important}
  .nohint .tab{display:none}.nohint #ui{padding-top:14px!important}
  .compact .bar{padding:7px 9px 7px 12px!important}.compact .row{padding:6px 10px!important}.compact .det{padding:12px 14px!important}.compact .snip{padding:6px 10px!important}.compact #q{font-size:16px!important}
  .noanim *,.noanim *::before,.noanim *::after{animation:none!important;transition:none!important}
  .noai .aiq,.noai [data-ai]{display:none!important}
  .nohl mark{background:none!important;color:inherit!important}
  .noqb .qb{display:none!important}
  .st-wrap{display:grid;grid-template-columns:168px 1fr;gap:16px;align-items:start}
  .st-nav{display:flex;flex-direction:column;gap:3px;position:sticky;top:0}
  .st-nav button{display:flex;align-items:center;gap:8px;text-align:left;background:none;border:0;color:#bdb6c2;padding:8px 12px;border-radius:11px;font:inherit;font-size:13px;cursor:pointer;transition:.15s}
  .st-nav button:hover{background:rgba(255,255,255,.06);color:#fff}
  .st-nav button.on{background:rgba(var(--acc-rgb),.2);color:#fff}
  .st-body{min-width:0}
  .st-h{font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin:4px 0 6px;font-weight:700}
  .st-card{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:16px;padding:2px 14px;margin-bottom:12px}
  .st-row{display:flex;align-items:center;gap:14px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.06)}
  .st-row:last-child{border-bottom:0}
  .st-row .l{flex:1;min-width:0}.st-row .l b{display:block;font-size:13.5px;font-weight:600}.st-row .l small{display:block;color:var(--muted);font-size:12px;margin-top:1px}
  .st-row.locked .l b,.st-row.locked .l small{opacity:.6}
  .st-lock{font-size:10.5px;color:#ffd36b;background:rgba(255,196,60,.14);border-radius:6px;padding:1px 6px;margin-left:6px;font-weight:600}
  .tg{position:relative;width:42px;height:24px;flex:none}
  .tg input{opacity:0;position:absolute;inset:0;margin:0;cursor:pointer;z-index:1}
  .tg i{position:absolute;inset:0;border-radius:999px;background:rgba(255,255,255,.14);transition:.2s;pointer-events:none}
  .tg i::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.4)}
  .tg input:checked+i{background:var(--accent)}.tg input:checked+i::after{transform:translateX(18px)}
  .tg input:disabled{cursor:not-allowed}.tg input:disabled+i{opacity:.4}
  .sg{display:flex;background:rgba(255,255,255,.06);border-radius:11px;padding:3px;gap:2px;flex-wrap:wrap;justify-content:flex-end}
  .sg button{background:none;border:0;color:#bdb6c2;padding:5px 11px;border-radius:8px;font:inherit;font-size:12px;cursor:pointer;white-space:nowrap}
  .sg button:hover{color:#fff}.sg button.on{background:rgba(var(--acc-rgb),.32);color:#fff}.sg button:disabled{opacity:.4;cursor:not-allowed}
  .st-rg{display:flex;align-items:center;gap:10px;min-width:210px}.st-rg input{flex:1}.st-rg b{min-width:44px;text-align:right;font-size:12.5px}
  .st-btn{background:rgba(255,255,255,.08);border:1px solid var(--line);color:#eee;border-radius:10px;padding:6px 12px;font:inherit;font-size:12.5px;cursor:pointer;white-space:nowrap}
  .st-btn:hover{border-color:rgba(var(--acc-rgb),.6)}.st-btn.warn{color:#ff9d9d;border-color:rgba(255,100,100,.35)}.st-btn.on{background:rgba(var(--acc-rgb),.25)}
  .st-msg{font-size:12px;color:#8ee6a8;min-height:16px;margin:2px 0 8px}
  .st-keys{display:grid;grid-template-columns:auto 1fr;gap:6px 14px;font-size:13px;padding:10px 0}.st-keys kbd{background:rgba(255,255,255,.1);border-radius:6px;padding:1px 7px;font:12px Consolas,monospace;color:#fff;white-space:nowrap}
  .st-news div{display:grid;grid-template-columns:52px 1fr;gap:10px;padding:6px 0;font-size:12.5px;border-bottom:1px solid rgba(255,255,255,.05)}.st-news b{color:var(--accent)}
  @media (max-width:760px){.st-wrap{grid-template-columns:1fr}.st-nav{flex-direction:row;flex-wrap:wrap;position:static}}
  `;
  document.head.appendChild(css);

  /* ---------- конструктор строк ---------- */
  const row = (title, desc, ctrl, lock) => `<div class="st-row${lock ? ' locked' : ''}"><div class="l"><b>${title}${lock ? `<span class="st-lock">${lock}</span>` : ''}</b>${desc ? `<small>${desc}</small>` : ''}</div>${ctrl}</div>`;
  const tg = (k, on, dis) => `<label class="tg"><input type="checkbox" data-tg="${k}"${on ? ' checked' : ''}${dis ? ' disabled' : ''}><i></i></label>`;
  const sg = (k, opts, cur, dis) => `<div class="sg" data-sg="${k}">${opts.map(([v, l]) => `<button data-v="${v}"${String(v) === String(cur) ? ' class="on"' : ''}${dis ? ' disabled' : ''}>${l}</button>`).join('')}</div>`;
  const rg = (k, min, max, step, val, unit, dis) => `<div class="st-rg"><input class="rng" type="range" data-rg="${k}" min="${min}" max="${max}" step="${step}" value="${val}"${dis ? ' disabled' : ''}><b data-rv="${k}">${val}${unit}</b></div>`;
  const btn = (id, label, cls) => `<button class="st-btn${cls ? ' ' + cls : ''}" id="${id}">${label}</button>`;
  const card = (h, rows) => `<div class="st-h">${h}</div><div class="st-card">${rows}</div>`;
  const P = '⭐ Premium', U = '💎 Ультра';

  let main = {};   // настройки основного процесса
  const SECTIONS = [['gen', '⚙', 'Общие'], ['look', '🎨', 'Внешний вид'], ['search', '🔎', 'Поиск'], ['online', '🌐', 'Онлайн'], ['notif', '🔔', 'Уведомления'], ['protect', '🛡', 'HSP Protect'], ['keys', '⌨', 'Клавиши'], ['data', '💾', 'Данные'], ['about', 'ℹ', 'О программе']];
  let cur = 'gen';

  function section(id) {
    const prem = !!S.premium, ultra = !!S.ultra;
    if (id === 'gen') return card('Запуск и поведение',
      row('Автозапуск с Windows', 'Хелпер стартует вместе с ПК и ждёт в трее', tg('autostart', false)) +
      row('Скрывать при клике мимо меню', 'Удобно в игре: кликнул в игру, и меню спряталось', tg('autohide', LS.get('ph_autohide', false))) +
      row('Esc на главной скрывает меню', 'Иначе меню закрывается только горячей клавишей', tg('escHide', LS.get('ph_escHide', true) !== false)) +
      row('Всегда открывать на главной', 'Иначе меню открывается там, где его свернули', tg('openHome', LS.get('ph_openHome', false))) +
      row('Вкладка по умолчанию', '', sg('startTab', [['law', 'Законы'], ['rules', 'Правила']], LS.get('ph_startTab', 'law')))) +
      card('Интерфейс',
      row('Подсказка над меню', '«Alt+Q — показать / скрыть»', tg('hint', LS.get('ph_hint', true))) +
      row('Быстрые кнопки в результатах', '☆ в избранное и ＋ в дело прямо в списке', tg('quickBtns', LS.get('ph_quickBtns', true))));
    if (id === 'look') return card('Цвет и стекло',
      row('Тема', '', sg('theme', Object.keys(X.THEMES).map((k) => [k, X.THEMES[k][2]]), LS.get('ph_accOn', false) && ultra ? '' : LS.get('ph_theme', 'scarlet'), !prem), prem ? '' : P) +
      row('Свой цвет', 'Любой цвет вместо темы', `<input type="color" id="stAcc" value="${esc(LS.get('ph_acc', '#ff4d6d'))}" ${ultra ? '' : 'disabled'} style="width:44px;height:28px;border:0;background:none;cursor:pointer">` + tg('accOn', LS.get('ph_accOn', false), !ultra), ultra ? '' : U) +
      row('Прозрачность фона', 'Текст остаётся чётким', rg('op', 25, 100, 5, LS.get('ph_op', 100), '%', !prem), prem ? '' : P) +
      row('Размытие фона', 'Живое стекло под плашками', tg('snap', LS.get('ph_snap', false), !ultra), ultra ? '' : U) +
      row('Неоновая рамка', 'Светящийся контур в цвет темы', tg('neon', LS.get('ph_neon', false), !ultra), ultra ? '' : U)) +
      card('Размеры и шрифт',
      row('Размер текста', '', rg('zoom', 80, 140, 5, LS.get('ph_zoom', 100), '%')) +
      row('Скругление углов', '', rg('radius', 8, 28, 2, LS.get('ph_radius', 22), 'px')) +
      row('Шрифт', '', sg('font', [['segoe', 'Segoe UI'], ['inter', 'Inter'], ['system', 'Системный'], ['mono', 'Моно']], LS.get('ph_font', 'segoe'))) +
      row('Ширина окна', '', sg('width', [[760, 'Узкое'], [880, 'Среднее'], [940, 'Обычное'], [1100, 'Широкое']], main.width || 940)) +
      row('Положение окна', '', sg('pos', [['left', '◀ Слева'], ['center', 'По центру'], ['right', 'Справа ▶']], LS.get('ph_pos', 'center'), !prem), prem ? '' : P) +
      row('Компактный режим', 'Меньше отступов, больше строк на экране', tg('compact', LS.get('ph_compact', false))) +
      row('Анимации', 'Выключите, если компьютер слабый', tg('anim', LS.get('ph_anim', true))));
    if (id === 'search') return card('Результаты',
      row('Сколько статей показывать', '', sg('limit', [[20, '20'], [40, '40'], [80, '80']], LS.get('ph_limit', 40))) +
      row('Искать сразу в обеих вкладках', 'Пункты правил видны и во вкладке «Законы», и наоборот', tg('searchAll', LS.get('ph_searchAll', false))) +
      row('Подсветка совпадений', '', tg('hl', LS.get('ph_hl', true))) +
      row('Строка «Спросить ИИ» в поиске', 'Появляется при запросе из нескольких слов', tg('aiRow', LS.get('ph_aiRow', true)))) +
      card('История', row('История запросов', 'Последние запросы на главном экране', btn('stClrQ', 'Очистить', 'warn')));
    if (id === 'online') return card('Онлайн серверов',
      row('Плашка вверху меню', 'Сколько игроков на вашем сервере', tg('lvPill', LS.get('ph_lvPill', true) !== false)) +
      row('Мой сервер', 'Его онлайн показывается в плашке', sg('lvSrv', [['ru9', 'Las Vegas'], ['ru1', 'New York'], ['ru7', 'Los Angeles'], ['ru12', 'Boston'], ['ru19', 'Memphis']], LS.get('ph_lvSrv', 'ru9'))) +
      row('Как часто обновлять', 'Данные берутся с majestic-rp.ru', sg('lvSec', [[30, '30 с'], [60, '1 мин'], [120, '2 мин'], [300, '5 мин']], LS.get('ph_lvSec', 60))) +
      row('Все серверы', 'Список, график, выбор своего сервера', btn('stSrv', '🌐 Открыть'))) +
      '<div class="st-msg" style="color:var(--muted)">Данные об онлайне получены с majestic-rp.ru. О техработах на Las Vegas хелпер сообщит уведомлением.</div>';
    if (id === 'protect') return '<div id="hspBox"><p class="t">Проверяю защиту…</p></div>';
    if (id === 'notif') {
      const n = main.notif || {};
      const kinds = [['update', 'Новая версия'], ['role', 'Смена роли'], ['premium', 'Premium и Ультра'], ['ban', 'Блокировка'], ['announce', 'Объявления'], ['chat', 'Сообщения в чате']];
      return card('Что показывать', kinds.map(([k, l]) => row(l, '', tg('n_' + k, n[k] !== false))).join('')) +
        card('Как показывать',
        row('Где', '', sg('toastPos', [['br', '↘ Справа снизу'], ['tr', '↗ Справа сверху'], ['bl', '↙ Слева снизу'], ['tl', '↖ Слева сверху']], main.toastPos || 'br')) +
        row('Сколько держать', '', sg('toastSec', [[5, '5 с'], [8, '8 с'], [12, '12 с'], [20, '20 с']], main.toastSec || 8)) +
        row('Звук', 'Короткий сигнал при уведомлении', tg('toastSound', !!main.toastSound)) +
        row('Проверка', 'Показать пробное уведомление', btn('stNt', '🔔 Проверить')));
    }
    if (id === 'keys') return card('Открыть и скрыть меню',
      row('Горячая клавиша', 'Ctrl+Alt+Q работает всегда как запасная', sg('hotkey', [['Alt+Q', 'Alt+Q'], ['Alt+W', 'Alt+W'], ['Alt+E', 'Alt+E'], ['Alt+X', 'Alt+X'], ['Alt+`', 'Alt+`'], ['F2', 'F2'], ['F8', 'F8'], ['Control+Space', 'Ctrl+Space']], main.hotkey || 'Alt+Q'))) +
      `<div class="st-msg" id="stKeyMsg"></div>` +
      card('Все сочетания', `<div class="st-keys">
        <kbd>Esc</kbd><span>Назад; на главной скрыть меню</span><kbd>↑ ↓</kbd><span>Выбор статьи, в режиме «список слева» листание</span>
        <kbd>Enter</kbd><span>Открыть статью</span><kbd>Ctrl+1…9</kbd><span>Открыть результат по номеру (Premium)</span>
        <kbd>Ctrl+D</kbd><span>В избранное (Premium)</span><kbd>Ctrl+B</kbd><span>В дело (Premium)</span>
        <kbd>Ctrl+I</kbd><span>Спросить ИИ</span><kbd>Alt+P</kbd><span>Режим покера (ДПВ)</span><kbd>Ctrl+Alt+Q</kbd><span>Показать или скрыть меню (запасная)</span></div>`);
    if (id === 'data') return card('Перенос', row('Экспорт и импорт', 'Избранное, дело, заметки, шаблоны и настройки одной строкой', btn('stBak', '💾 Открыть', ''), prem ? '' : P)) +
      card('Очистка (нажмите дважды)',
      row('Избранное', '', btn('stC_ph_fav', 'Очистить', 'warn')) + row('Недавние статьи', '', btn('stC_ph_hist', 'Очистить', 'warn')) +
      row('Дело', '', btn('stC_ph_case', 'Очистить', 'warn')) + row('Заметки к статьям', '', btn('stC_ph_notes', 'Очистить', 'warn')) +
      row('Блокнот', '', btn('stC_ph_pad', 'Очистить', 'warn')) + row('Таймеры', '', btn('stC_ph_timers', 'Очистить', 'warn'))) +
      card('Сброс', row('Сбросить внешний вид и поведение', 'Тема, размеры, шрифт, переключатели. Избранное и заметки не трогаются', btn('stReset', 'Сбросить', 'warn')));
    if (id === 'about') {
      const ver = ov.version || '';
      const tierName = S.admin ? 'Главный Администратор' : S.ultra ? 'Ультра Премиум' : S.premium ? 'Premium' : 'Обычный доступ';
      return `<div class="about" style="margin-bottom:12px"><img src="logo.png" alt=""><div><b>Polix Helper <span style="color:var(--accent)">by KATO</span></b><small>Версия ${esc(ver)} · ${esc(tierName)}</small></div></div>` +
        card('Обновления', row('Проверить обновления', '<span id="updRes">Новые версии приходят сами через 45 секунд после выхода</span>', btn('updChk', '🔄 Проверить')) +
        row('Все версии и изменения', 'Страница релизов на GitHub', btn('stGh', 'Открыть'))) +
        `<div class="st-h">Что нового</div><div class="st-card st-news">${NEWS.map(([v, t]) => `<div><b>${esc(v)}</b><span>${esc(t)}</span></div>`).join('')}</div>`;
    }
    return '';
  }

  /* ---------- обработчики ---------- */
  const set = (k, v) => { LS.set(k, v); applyUI(); };
  const TG = {
    autostart: (on) => ov.autostartSet && ov.autostartSet(on),
    autohide: (on) => { LS.set('ph_autohide', on); if (ov.setAutohide) ov.setAutohide(on); },
    escHide: (on) => set('ph_escHide', on), openHome: (on) => set('ph_openHome', on), hint: (on) => set('ph_hint', on),
    lvPill: (on) => { LS.set('ph_lvPill', on); if (window.PHX_online) window.PHX_online.pill(); },
    quickBtns: (on) => set('ph_quickBtns', on), compact: (on) => set('ph_compact', on), anim: (on) => set('ph_anim', on),
    searchAll: (on) => { set('ph_searchAll', on); }, hl: (on) => set('ph_hl', on), aiRow: (on) => set('ph_aiRow', on),
    accOn: (on) => { LS.set('ph_accOn', on); X.applyTheme(); syncAccent(); draw(); },
    snap: (on) => { LS.set('ph_snap', on); if (ov.setBlur) ov.setBlur(on); },
    neon: (on) => { LS.set('ph_neon', on); if (window.PHX_applyLook) window.PHX_applyLook(); },
    toastSound: (on) => { main.toastSound = on; ov.setPref && ov.setPref('toastSound', on); }
  };
  const SG = {
    startTab: (v) => { LS.set('ph_startTab', v); },
    lvSrv: (v) => { LS.set('ph_lvSrv', v); if (window.PHX_online) window.PHX_online.pill(); },
    lvSec: (v) => { LS.set('ph_lvSec', +v); if (window.PHX_online) window.PHX_online.schedule(); },
    theme: (v) => { LS.set('ph_theme', v); LS.set('ph_accOn', false); X.applyTheme(v); syncAccent(); draw(); },
    font: (v) => set('ph_font', v), limit: (v) => set('ph_limit', +v),
    width: (v) => { main.width = +v; ov.setPref && ov.setPref('width', +v); },
    pos: (v) => { LS.set('ph_pos', v); ov.setPosition && ov.setPosition(v); },
    toastPos: (v) => { main.toastPos = v; ov.setPref && ov.setPref('toastPos', v); },
    toastSec: (v) => { main.toastSec = +v; ov.setPref && ov.setPref('toastSec', +v); },
    hotkey: async (v) => {
      const m = $('#stKeyMsg'); if (!ov.setPref) return;
      const r = await ov.setPref('hotkey', v);
      if (r && r.ok) { main.hotkey = v; m.style.color = '#8ee6a8'; m.textContent = 'Готово: меню теперь открывается по ' + v.replace('Control', 'Ctrl'); const h = $('#tabhint'); if (h) h.innerHTML = esc(v.replace('Control', 'Ctrl')) + ' — показать / скрыть · <b>Esc</b> — назад'; }
      else { draw(); const m2 = $('#stKeyMsg'); if (m2) { m2.style.color = '#ff9d9d'; m2.textContent = (r && r.error) || 'Не удалось назначить клавишу'; } }
    }
  };
  const RG = {
    zoom: (v) => set('ph_zoom', +v), radius: (v) => set('ph_radius', +v),
    op: (v) => { LS.set('ph_op', +v); if (window.PHX_applyLook) window.PHX_applyLook(); }
  };

  function bind(box) {
    box.querySelectorAll('[data-tg]').forEach((el) => (el.onchange = () => {
      const k = el.dataset.tg;
      if (k.startsWith('n_')) { const n = { ...(main.notif || {}) }; n[k.slice(2)] = el.checked; main.notif = n; if (ov.setPref) ov.setPref('notif', n); return; }
      if (TG[k]) TG[k](el.checked);
    }));
    box.querySelectorAll('[data-sg] button').forEach((b) => (b.onclick = () => {
      const k = b.parentElement.dataset.sg; if (b.disabled) return;
      b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      if (SG[k]) SG[k](b.dataset.v);
    }));
    box.querySelectorAll('[data-rg]').forEach((el) => (el.oninput = () => { const k = el.dataset.rg; const v = box.querySelector(`[data-rv="${k}"]`); if (v) v.textContent = el.value + (k === 'radius' ? 'px' : '%'); if (RG[k]) RG[k](el.value); }));
    const acc = box.querySelector('#stAcc'); if (acc) acc.oninput = () => { LS.set('ph_acc', acc.value); if (LS.get('ph_accOn', false)) { X.applyTheme(); syncAccent(); } };
    const at = box.querySelector('[data-tg="autostart"]'); if (at && ov.autostartGet) ov.autostartGet().then((on) => { at.checked = !!on; });
    const clrQ = box.querySelector('#stClrQ'); if (clrQ) clrQ.onclick = () => { LS.set('ph_q', []); clrQ.textContent = '✔ Очищено'; };
    const hb = box.querySelector('#hspBox');
    if (hb) {
      const paint = async () => {
        hb.innerHTML = '<p class="t">Проверяю защиту…</p>';
        const r = ov.protectStatus ? await ov.protectStatus() : null;
        if (!r || !r.checks) { hb.innerHTML = '<p class="t">Проверка недоступна в этой версии.</p>'; return; }
        const pct = Math.round(r.score / r.total * 100);
        hb.innerHTML = `<div class="about" style="margin-bottom:12px"><div style="font-size:34px">🛡</div><div><b>HSP Protect <span style="color:var(--accent)">${r.score} из ${r.total}</span></b><small>Защита Polix Helper · версия ${esc(r.version)} · проверено ${new Date(r.checkedAt).toLocaleTimeString('ru-RU')}</small></div></div>
          <div class="st-card" style="padding:0 14px"><div class="st-row" style="padding:9px 0"><div class="l"><b>Уровень защиты</b></div><div style="flex:1;max-width:220px;height:8px;border-radius:8px;background:rgba(255,255,255,.1);overflow:hidden"><i style="display:block;height:100%;width:${pct}%;background:${pct >= 90 ? '#3ddc84' : pct >= 70 ? '#ffc43c' : '#ff6b6b'}"></i></div><b>${pct}%</b></div></div>
          <div class="st-card">${r.checks.map((c) => row((c.ok ? '✅ ' : '⚠ ') + esc(c.label), esc(c.note), '')).join('')}</div>
          <div class="actions"><button class="abtn on" id="hspRe">🔄 Проверить ещё раз</button></div>
          <div class="st-msg" style="color:var(--muted)">Приложение не собирает ваши запросы и не отправляет ничего, кроме Discord ID, имени, версии и времени захода (см. README).</div>`;
        hb.querySelector('#hspRe').onclick = paint;
      };
      paint();
    }
    const ss = box.querySelector('#stSrv'); if (ss) ss.onclick = () => window.PHX_online && window.PHX_online.openServers();
    const nt = box.querySelector('#stNt'); if (nt) nt.onclick = () => ov.notifyTest && ov.notifyTest();
    const bk = box.querySelector('#stBak'); if (bk) bk.onclick = () => { if (window.PHX_tools && window.PHX_tools.openBackup) window.PHX_tools.openBackup(); };
    box.querySelectorAll('[id^="stC_"]').forEach((b) => (b.onclick = () => {
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Точно?'; setTimeout(() => { if (b.isConnected && b.dataset.sure === '1') { b.dataset.sure = ''; b.textContent = 'Очистить'; } }, 3000); return; }
      const k = b.id.slice(4); localStorage.removeItem(k); b.dataset.sure = ''; b.textContent = '✔ Очищено';
      if (k === 'ph_case' && X.updateCaseBadge) X.updateCaseBadge();
    }));
    const rs = box.querySelector('#stReset'); if (rs) rs.onclick = () => {
      if (rs.dataset.sure !== '1') { rs.dataset.sure = '1'; rs.textContent = 'Точно сбросить?'; return; }
      ['ph_theme', 'ph_acc', 'ph_accOn', 'ph_zoom', 'ph_op', 'ph_pos', 'ph_neon', 'ph_hint', 'ph_compact', 'ph_anim', 'ph_radius', 'ph_font', 'ph_limit', 'ph_searchAll', 'ph_aiRow', 'ph_hl', 'ph_quickBtns', 'ph_startTab', 'ph_escHide', 'ph_openHome'].forEach((k) => localStorage.removeItem(k));
      location.reload();
    };
    const gh = box.querySelector('#stGh'); if (gh) gh.onclick = () => ov.openUrl && ov.openUrl('https://github.com/kartonden123/Helper-Polix/releases');
    const uc = box.querySelector('#updChk'); if (uc) uc.onclick = async () => {
      const r = $('#updRes'); uc.disabled = true; r.textContent = 'Проверяю…';
      const res = ov.checkUpdate ? await ov.checkUpdate() : { state: 'error' };
      uc.disabled = false;
      const M = { latest: '✅ У вас последняя версия ' + (res.current || ''), available: '⬇ Вышла версия ' + res.version + ': нажмите «Обновить» в карточке вверху меню', downloading: '⬇ Обновляю до ' + res.version + '…', installing: '🔄 Устанавливаю, хелпер перезапустится', ready: '✅ Версия ' + res.version + ' скачана: нажмите «Перезапустить» вверху', dev: 'Режим разработки: проверка недоступна', error: '⚠ Не удалось проверить. Проверьте интернет.' };
      r.textContent = M[res.state] || M.error;
    };
  }

  function draw() {
    const box = $('#stBody'); if (!box) return;
    box.innerHTML = section(cur); bind(box);
    document.querySelectorAll('.st-nav button').forEach((b) => b.classList.toggle('on', b.dataset.s === cur));
  }
  async function openSettings(sec) {
    if (typeof sec === 'string') cur = sec;
    view = 'memo'; panel.classList.add('on');
    list.innerHTML = backBtn() + `<div class="det"><h2>⚙ Настройки</h2><div class="st-wrap"><div class="st-nav">${SECTIONS.map(([id, ic, n]) => `<button data-s="${id}"${id === cur ? ' class="on"' : ''}><span>${ic}</span>${n}</button>`).join('')}</div><div class="st-body" id="stBody"></div></div></div>`;
    $('#bk').onclick = goBack; $('#cnt').textContent = '';
    list.querySelectorAll('.st-nav button').forEach((b) => (b.onclick = () => { cur = b.dataset.s; draw(); }));
    try { if (ov.uiPrefs) main = (await ov.uiPrefs()) || {}; } catch (e) {}
    draw();
  }

  applyUI();
  const st = LS.get('ph_startTab', 'law');
  if (st !== 'law' && typeof setDoc === 'function' && view === 'home') { setDoc(st); if (!q.value.trim()) render(); }
  const sb = $('#setBtn'); if (sb) { sb.onclick = () => openSettings(); sb.title = 'Настройки'; }
  if (ov.uiPrefs) ov.uiPrefs().then((p) => { main = p || {}; const h = $('#tabhint'); if (h && main.hotkey && main.hotkey !== 'Alt+Q') h.innerHTML = esc(main.hotkey.replace('Control', 'Ctrl')) + ' — показать / скрыть · <b>Esc</b> — назад'; }).catch(() => {});
  setTimeout(syncAccent, 1500);
  window.PHX_settings = { openSettings, applyUI };
})();
