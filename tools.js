/* Инструменты: шаблоны фраз, чек-листы, блокнот, калькулятор в поиске, случайная статья, экспорт/импорт, копирование пункта с источником */
(function () {
  const S = window.PH, X = window.PHX;
  if (!S || !X) return;
  const $ = (s) => document.querySelector(s);
  const { LS } = X;
  const prem = (t, h) => { if (!S.premium) { X.gate(t, h); return false; } return true; };

  const css = document.createElement('style');
  css.textContent = `
  .tl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-top:6px}
  .tl-card{background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:16px;padding:14px;cursor:pointer;text-align:left;color:inherit;font:inherit;transition:.18s}
  .tl-card:hover{border-color:rgba(var(--acc-rgb),.6);transform:translateY(-2px);background:rgba(var(--acc-rgb),.08)}
  .tl-card b{display:block;font-size:14px;margin-bottom:3px}.tl-card span{color:var(--muted);font-size:12px}
  .tpl{display:flex;gap:8px;align-items:flex-start;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05);margin-bottom:6px;cursor:pointer}
  .tpl:hover{background:rgba(var(--acc-rgb),.1)}.tpl div{flex:1}.tpl b{font-size:13px}.tpl p{margin:2px 0 0;font-size:12.5px;color:#cfc8d3;white-space:pre-wrap}
  .tpl button{background:none;border:0;color:var(--muted);cursor:pointer;font-size:14px}.tpl button:hover{color:#ff8a8a}
  .chk{display:flex;gap:10px;align-items:center;padding:8px 12px;border-radius:10px;background:rgba(255,255,255,.05);margin-bottom:5px;cursor:pointer}
  .chk i{width:18px;height:18px;border-radius:6px;border:1.5px solid var(--muted);display:grid;place-items:center;font-style:normal;font-size:12px;color:transparent;flex:none}
  .chk.on{opacity:.65;text-decoration:line-through}.chk.on i{background:var(--accent);border-color:var(--accent);color:#fff}
  .pad{width:100%;min-height:210px;resize:vertical;background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:12px;color:#fff;padding:10px 12px;font:inherit;outline:none;user-select:text}
  .calc-card{margin:8px 6px;padding:12px 16px;border-radius:14px;background:rgba(var(--acc-rgb),.14);border:1px solid rgba(var(--acc-rgb),.4);display:flex;justify-content:space-between;align-items:center;cursor:pointer}
  .calc-card b{font-size:22px}.calc-card small{color:var(--muted)}
  `;
  document.head.appendChild(css);

  const open = (title, body) => {
    view = 'memo'; panel.classList.add('on');
    list.innerHTML = backBtn() + `<div class="det"><h2>${title}</h2>${body}</div>`;
    $('#bk').onclick = () => { openTools(); view = 'memo'; };
    $('#cnt').textContent = '';
  };

  /* ---------- 1. Шаблоны фраз ---------- */
  const TPL = [
    ['Права при задержании', 'Вы задержаны. Вы имеете право хранить молчание. Всё, что вы скажете, может быть использовано против вас в суде. Вы имеете право на адвоката. Если вы не можете его оплатить, он будет предоставлен вам государством. Вам понятны ваши права?'],
    ['Представление', 'Здравствуйте, я сотрудник правоохранительных органов штата San Andreas. Прошу предъявить документы, удостоверяющие личность.'],
    ['Требование остановиться', 'Говорит полиция штата San Andreas! Немедленно остановите транспортное средство и заглушите двигатель!'],
    ['Предупреждение перед применением оружия', 'Стоять! Полиция! Бросьте оружие и лягте на землю, руки за голову! В случае неповиновения будет применена сила.'],
    ['Причина задержания', 'Вы задержаны по подозрению в совершении преступления, предусмотренного статьёй ___ Уголовного кодекса штата San Andreas.'],
    ['Личный досмотр', 'Для вашей безопасности и в рамках закона я проведу личный досмотр. Прошу не препятствовать.'],
    ['Передача в КПЗ', 'Вы доставлены в изолятор временного содержания. Все ваши личные вещи будут изъяты и возвращены после освобождения.']
  ];
  const customTpl = () => LS.get('ph_tpl', []);
  function openTemplates() {
    const all = [...TPL.map((t, i) => ({ t: t[0], x: t[1], i, own: false })), ...customTpl().map((t, i) => ({ t: t[0], x: t[1], i, own: true }))];
    open('📋 Шаблоны фраз', `<p class="t">Нажмите на шаблон, чтобы скопировать. Подправьте под себя и свои правила.</p>
      ${all.map((a) => `<div class="tpl" data-x="${esc(a.x)}"><div><b>${esc(a.t)}</b><p>${esc(a.x)}</p></div>${a.own ? `<button data-del="${a.i}" title="Удалить">✕</button>` : ''}</div>`).join('')}
      <div class="actions" style="margin-top:12px"><button class="abtn on" id="tplAdd">＋ Свой шаблон (Premium)</button></div><div id="tplForm"></div>`);
    list.querySelectorAll('.tpl').forEach((el) => (el.onclick = (e) => { if (e.target.dataset.del !== undefined) return; X.copy(el.dataset.x, null); el.style.borderColor = 'var(--accent)'; el.querySelector('b').textContent += ' ✔ скопировано'; }));
    list.querySelectorAll('[data-del]').forEach((b) => (b.onclick = (e) => { e.stopPropagation(); const c = customTpl(); c.splice(+b.dataset.del, 1); LS.set('ph_tpl', c); openTemplates(); }));
    $('#tplAdd').onclick = () => {
      if (!prem('Свои шаблоны', 'Создавайте свои фразы и копируйте их в один клик.')) return;
      $('#tplForm').innerHTML = '<input class="fld" id="tplT" placeholder="Название" maxlength="60"><textarea class="pad" id="tplX" style="min-height:90px" placeholder="Текст"></textarea><div class="actions" style="margin-top:8px"><button class="abtn on" id="tplSave">Сохранить</button></div>';
      ['tplT', 'tplX'].forEach((id) => $('#' + id).addEventListener('keydown', (e) => e.stopPropagation()));
      $('#tplSave').onclick = () => { const t = $('#tplT').value.trim(), x = $('#tplX').value.trim(); if (!t || !x) return; const c = customTpl(); c.push([t, x]); LS.set('ph_tpl', c); openTemplates(); };
    };
  }

  /* ---------- 2. Чек-листы ---------- */
  const CHK = {
    'Задержание': ['Представиться и назвать причину', 'Зачитать права', 'Надеть наручники', 'Провести личный досмотр', 'Изъять запрещённое', 'Доставить в участок', 'Составить рапорт'],
    'Обыск': ['Объяснить основание обыска', 'Проверить карманы и рюкзак', 'Проверить транспорт', 'Оформить изъятое', 'Передать вещдоки'],
    'Остановка транспорта': ['Включить сирену и остановить', 'Представиться', 'Проверить документы', 'Проверить базу', 'Назначить штраф или задержать']
  };
  function openChecklists(name) {
    name = name || Object.keys(CHK)[0];
    const st = LS.get('ph_chk', {}); const cur = st[name] || [];
    open('✅ Чек-листы', `<div class="stab">${Object.keys(CHK).map((k) => `<button class="abtn${k === name ? ' on' : ''}" data-l="${esc(k)}">${esc(k)}</button>`).join('')}</div>
      ${CHK[name].map((t, i) => `<div class="chk${cur[i] ? ' on' : ''}" data-i="${i}"><i>✔</i><span>${esc(t)}</span></div>`).join('')}
      <div class="actions" style="margin-top:10px"><button class="abtn" id="chkRst">Сбросить</button></div>`);
    list.querySelectorAll('[data-l]').forEach((b) => (b.onclick = () => { openChecklists(b.dataset.l); }));
    list.querySelectorAll('.chk').forEach((el) => (el.onclick = () => { const s = LS.get('ph_chk', {}); s[name] = s[name] || []; s[name][+el.dataset.i] = !s[name][+el.dataset.i]; LS.set('ph_chk', s); el.classList.toggle('on', !!s[name][+el.dataset.i]); }));
    $('#chkRst').onclick = () => { const s = LS.get('ph_chk', {}); s[name] = []; LS.set('ph_chk', s); openChecklists(name); };
  }

  /* ---------- 3. Блокнот ---------- */
  function openPad() {
    if (!prem('Блокнот', 'Быстрые заметки, которые сохраняются сами.')) return;
    open('📝 Блокнот', `<textarea class="pad" id="padT" placeholder="Номера, имена, детали дела…" maxlength="6000">${esc(LS.get('ph_pad', ''))}</textarea><div class="actions" style="margin-top:8px"><button class="abtn" id="padCp">📋 Копировать</button><button class="abtn" id="padClr">Очистить</button></div>`);
    const t = $('#padT'); t.addEventListener('keydown', (e) => e.stopPropagation()); t.addEventListener('input', () => LS.set('ph_pad', t.value)); t.focus();
    $('#padCp').onclick = () => X.copy(t.value, $('#padCp')); $('#padClr').onclick = () => { t.value = ''; LS.set('ph_pad', ''); };
  }

  /* ---------- 5. Случайная статья ---------- */
  function randomArt() { const a = ITEMS[(Math.random() * ITEMS.length) | 0]; if (a) openArt(a); }

  /* ---------- 6. Экспорт / импорт ---------- */
  function exportData() { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith('ph_') && k !== 'ph_ann_seen' && k !== 'ph_snap') o[k] = localStorage.getItem(k); } return JSON.stringify(o); }
  function openBackup() {
    if (!prem('Экспорт и импорт', 'Перенос избранного, дел, заметок и настроек на другой компьютер.')) return;
    open('💾 Экспорт и импорт', `<p class="t">Копирует избранное, дело, заметки, шаблоны, блокнот и настройки одной строкой. Вставьте её на другом компьютере.</p>
      <div class="actions"><button class="abtn on" id="bkEx">📋 Скопировать мои данные</button></div>
      <textarea class="pad" id="bkIn" style="min-height:90px" placeholder="Вставьте сюда строку с данными"></textarea><div class="actions" style="margin-top:8px"><button class="abtn" id="bkIm">⬇ Загрузить данные</button></div><div class="stmsg" id="bkMsg"></div>`);
    $('#bkIn').addEventListener('keydown', (e) => e.stopPropagation());
    $('#bkEx').onclick = () => X.copy(exportData(), $('#bkEx'));
    $('#bkIm').onclick = () => { try { const o = JSON.parse($('#bkIn').value); let n = 0; for (const k of Object.keys(o)) if (/^ph_[a-zA-Z_]+$/.test(k) && k !== 'ph_snap') { localStorage.setItem(k, String(o[k])); n++; } $('#bkMsg').textContent = 'Загружено записей: ' + n + '. Перезагружаю…'; setTimeout(() => location.reload(), 700); } catch (e) { $('#bkMsg').textContent = 'Не похоже на данные хелпера.'; $('#bkMsg').style.color = '#ff9d9d'; } };
  }

  /* ---------- центр инструментов ---------- */
  // срок давности по АК 4.4: 7 дней с момента правонарушения
  function openLimit() {
    view = 'memo'; panel.classList.add('on');
    const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    list.innerHTML = backBtn() + `<div class="det"><h2>⏳ Срок давности</h2><p class="t">Административное правонарушение: через 7 дней человека уже нельзя привлечь (АК 4.4). Укажите, когда оно было.</p>
      <input class="fld" id="lmD" type="datetime-local" value="${now}" style="max-width:260px"><div class="note" id="lmR" style="margin-top:12px"></div></div>`;
    $('#bk').onclick = goBack; $('#cnt').textContent = '';
    const calc = () => {
      const t = new Date($('#lmD').value).getTime(); if (!t) return; const end = t + 7 * 86400000, left = end - Date.now();
      const d = Math.floor(left / 86400000), h = Math.floor(left % 86400000 / 3600000), m = Math.floor(left % 3600000 / 60000);
      $('#lmR').innerHTML = left > 0 ? `Осталось: <b>${d} дн. ${h} ч. ${m} мин.</b><br>Привлечь можно до ${new Date(end).toLocaleString('ru-RU')}.` : `<b style="color:#ff9d9d">Срок истёк</b> ${new Date(end).toLocaleString('ru-RU')}. Привлечение невозможно.`;
    };
    $('#lmD').addEventListener('keydown', (e) => e.stopPropagation()); $('#lmD').oninput = calc; calc();
  }
  // личная статистика: сколько раз искали и открывали статьи (хранится только на этом ПК)
  function openStats() {
    view = 'memo'; panel.classList.add('on');
    const fav = (LS.get('ph_fav', []) || []).length, cs = (LS.get('ph_case', []) || []).length, hs = (LS.get('ph_hist', []) || []).length, tp = (LS.get('ph_tpl', []) || []).length;
    const st = LS.get('ph_stats', { open: 0, search: 0 });
    list.innerHTML = backBtn() + `<div class="det"><h2>📊 Моя статистика</h2><div class="stats"><div><small>Избранное</small><b>${fav}</b></div><div><small>В деле</small><b>${cs}</b></div><div><small>Недавних</small><b>${hs}</b></div><div><small>Шаблонов</small><b>${tp}</b></div></div>
      <p class="t" style="margin-top:12px">Открыто статей: <b>${st.open || 0}</b> · поисков: <b>${st.search || 0}</b>. Данные хранятся только на вашем компьютере.</p></div>`;
    $('#bk').onclick = goBack; $('#cnt').textContent = '';
  }
  const FORMS = [
    ['💡 Предложить улучшение', 'https://docs.google.com/forms/d/e/1FAIpQLSdoZQpmD-9wx0NxMwbYjN6p4ukFYR4gdobYlUE155-L-kALrA/viewform'],
    ['🐞 Сообщить об ошибке', 'https://docs.google.com/forms/d/e/1FAIpQLSc0-Q_ehH2HtBHLg0nlwLVkVNb6smSl2CEYVe8GGug4ipd5mg/viewform'],
    ['🎭 Заявка на роль', 'https://docs.google.com/forms/d/e/1FAIpQLSdu2YeRYsJCTDCZ0N7Ca496gTUaBp-0WVRXH2l1yN8Ro2rNsw/viewform'],
    ['⚠️ Подать жалобу', 'https://docs.google.com/forms/d/e/1FAIpQLSc0omutljDnuSLBSrLf-hpcVB7SpRxOuPAGOju3bFNZscmvJQ/viewform'],
    ['💬 Сервер Helper Pix в Discord', 'https://discord.gg/2C2zUgv3VC']];
  function openForms() {
    view = 'memo'; panel.classList.add('on');
    list.innerHTML = backBtn() + '<div class="det"><h2>📨 Связь и формы</h2><p class="t">Заявки попадают персоналу Helper Pix в Discord, там их одобряют или отклоняют с причиной.</p>' + FORMS.map((f, i) => '<button class="tl-card" data-f="' + i + '" style="margin:6px 0;width:100%"><b>' + f[0] + '</b></button>').join('') + '</div>';
    $('#bk').onclick = goBack; $('#cnt').textContent = '';
    list.querySelectorAll('[data-f]').forEach((b) => (b.onclick = () => window.overlay && window.overlay.openUrl && window.overlay.openUrl(FORMS[+b.dataset.f][1])));
  }
  function openClock() {
    view = 'memo'; panel.classList.add('on');
    list.innerHTML = backBtn() + `<div class="det"><h2>🕒 Часы</h2><div id="clk" style="font-size:15px;line-height:2"></div><p class="t">«Ночь» по административному кодексу: с 22:00 до 08:00 (громкая музыка и крики запрещены).</p></div>`;
    $('#bk').onclick = goBack; $('#cnt').textContent = '';
    const row = (n, tz) => { const t = new Date().toLocaleTimeString('ru-RU', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit' }); return `<div>${n}: <b style="font-variant-numeric:tabular-nums">${t}</b></div>`; };
    const tick = () => {
      const el = $('#clk'); if (!el) return clearInterval(id);
      const h = +new Date().toLocaleTimeString('ru-RU', { timeZone: 'Europe/Moscow', hour: '2-digit', hour12: false });
      el.innerHTML = row('Москва', 'Europe/Moscow') + row('Киев', 'Europe/Kyiv') + row('Екатеринбург', 'Asia/Yekaterinburg') + row('UTC', 'UTC') + `<div style="margin-top:8px">Сейчас по Москве: <b>${h >= 22 || h < 8 ? '🌙 ночь, тишина обязательна' : '☀ день'}</b></div>`;
    };
    const id = setInterval(tick, 1000); tick();
  }
  function openTools() {
    view = 'memo'; panel.classList.add('on');
    list.innerHTML = backBtn() + `<div class="det"><h2>🧰 Инструменты</h2><p class="t">Всё, что нужно под рукой во время игры.</p><div class="tl-grid">
      <button class="tl-card" data-t="tpl"><b>📋 Шаблоны фраз</b><span>Права, представление, требования: копия в один клик</span></button>
      <button class="tl-card" data-t="chk"><b>✅ Чек-листы</b><span>Задержание, обыск, остановка транспорта</span></button>
      <button class="tl-card" data-t="pad"><b>📝 Блокнот</b><span>Заметки, которые сохраняются сами (Premium)</span></button>
      <button class="tl-card" data-t="rnd"><b>🎲 Случайная статья</b><span>Повторить и проверить себя</span></button>
      <button class="tl-card" data-t="calc"><b>🧮 Калькулятор</b><span>Введите в поиске пример, например 15000*3</span></button>
      <button class="tl-card" data-t="bak"><b>💾 Экспорт и импорт</b><span>Перенос данных на другой ПК (Premium)</span></button>
      <button class="tl-card" data-t="srv"><b>🌐 Онлайн серверов</b><span>Las Vegas и остальные: игроки, очередь, график</span></button>
      <button class="tl-card" data-t="lim"><b>⏳ Срок давности</b><span>Сколько осталось привлечь по АК (7 дней)</span></button>
      <button class="tl-card" data-t="stat"><b>📊 Моя статистика</b><span>Избранное, дела, открытые статьи</span></button>
      <button class="tl-card" data-t="pct"><b>％ Проценты</b><span>Процент от числа, изменение в процентах</span></button>
      <button class="tl-card" data-t="cnt"><b>🔢 Счётчики</b><span>Задержания, штрафы, рапорты за смену</span></button>
      <button class="tl-card" data-t="sw"><b>⏱ Секундомер и таймер</b><span>Круги и обратный отсчёт со звуком</span></button>
      <button class="tl-card" data-t="num"><b>🧮 Числа и текст</b><span>Сумма чисел, счётчик слов, регистр</span></button>
      <button class="tl-card" data-t="rand"><b>🎲 Жребий</b><span>Монета, кубик, случайный вариант</span></button>
      <button class="tl-card" data-t="frm"><b>📨 Связь и формы</b><span>Предложения, ошибки, роли, жалобы, Discord</span></button>
      <button class="tl-card" data-t="bug"><b>🐞 Сообщить об ошибке</b><span>Открыть страницу обращений на GitHub</span></button>
      <button class="tl-card" data-t="clk"><b>🕒 Часы</b><span>Московское время, UTC и ночь по закону (22:00–08:00)</span></button>
    </div></div>`;
    $('#bk').onclick = goBack; $('#cnt').textContent = '';
    list.querySelectorAll('.tl-card').forEach((b) => (b.onclick = () => ({ tpl: openTemplates, chk: () => openChecklists(), pad: openPad, rnd: randomArt, bak: openBackup, srv: () => window.PHX_online && window.PHX_online.openServers(), clk: openClock, lim: openLimit, stat: openStats, frm: openForms, pct: () => window.PHX_tools2.pct(), cnt: () => window.PHX_tools2.counter(), sw: () => window.PHX_tools2.stopwatch(), num: () => window.PHX_tools2.numbers(), rand: () => window.PHX_tools2.random(), bug: () => window.overlay && window.overlay.openUrl && window.overlay.openUrl('https://github.com/kartonden123/Helper-Pix/issues/new'), calc: () => { q.value = '15000*3'; view = 'home'; render(); q.focus(); } }[b.dataset.t]())));
  }

  /* ---------- 4. Калькулятор прямо в поиске ---------- */
  function evalExpr(s) {
    const t = s.replace(/^=/, '').replace(/\$/g, '').replace(/,/g, '.').replace(/(\d)\s+(\d)/g, '$1$2').trim();
    if (!/[+\-*/]/.test(t.replace(/^-/, '')) || !/^[\d+\-*/().%\s]+$/.test(t) || /^[\d.]+$/.test(t)) return null;
    try { const v = Function('"use strict";return (' + t.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)') + ')')(); return isFinite(v) ? v : null; } catch (e) { return null; }
  }
  const fmtN = (n) => (Math.round(n * 100) / 100).toLocaleString('ru-RU');
  const _r = render;
  render = function () {
    _r.apply(this, arguments);
    if (view !== 'home') return;
    const v = evalExpr(q.value);
    if (v === null) return;
    list.insertAdjacentHTML('afterbegin', `<div class="calc-card" id="calcCard"><div><small>${esc(q.value.replace(/^=/, ''))} =</small><br><b>${fmtN(v)}</b></div><small>клик: копировать</small></div>`);
    $('#calcCard').onclick = (e) => { e.stopPropagation(); X.copy(String(Math.round(v * 100) / 100), null); $('#calcCard small:last-child').textContent = '✔ скопировано'; };
  };
  // случайная статья на главном экране
  const _r2 = render;
  render = function () {
    _r2.apply(this, arguments);
    if (view !== 'home' || q.value.trim()) return;
    const chips = list.querySelector('.chips');
    if (chips && !chips.querySelector('[data-rnd]')) {
      chips.insertAdjacentHTML('beforeend', '<span class="chip" data-rnd="1">🎲 Случайная статья</span><span class="chip" data-tools="1">🧰 Инструменты</span>');
      chips.querySelector('[data-rnd]').onclick = (ev) => { ev.stopPropagation(); randomArt(); };
      chips.querySelector('[data-tools]').onclick = (ev) => { ev.stopPropagation(); openTools(); };
    }
  };

  /* ---------- 8. Копирование пункта с источником ---------- */
  const _os = openSnip;
  openSnip = function (e) {
    _os.apply(this, arguments);
    const det = list.querySelector('.det'); if (!det || !e) return;
    det.insertAdjacentHTML('beforeend', '<div class="actions" style="margin-top:14px"><button class="abtn" id="snC">📋 Копировать с источником</button><button class="abtn" id="snD">💬 Для Discord</button></div>');
    const txt = e.p.trim();
    $('#snC').onclick = () => X.copy(e.d.name + ': ' + txt, $('#snC'));
    $('#snD').onclick = () => X.copy('**' + e.d.name + '**\n> ' + txt.replace(/\n/g, '\n> '), $('#snD'));
  };

  /* ---------- кнопка в панели ---------- */
  const imm = $('#immBtn');
  if (imm && !$('#toolsBtn')) { imm.insertAdjacentHTML('beforebegin', '<button class="ib" id="toolsBtn" title="Инструменты">🧰</button>'); $('#toolsBtn').onclick = openTools; }
  window.PHX_tools = { openTools, openBackup, openTemplates, openChecklists, openPad };
})();
