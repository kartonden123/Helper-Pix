/* Дополнительные инструменты: проценты, счётчики, секундомер и таймер, числа и текст, жребий. Всё считается на этом компьютере. */
(function () {
  const X = window.PHX;
  if (!X) return;
  const $ = (s) => document.querySelector(s);
  const { LS } = X;
  const eh = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shell = (title, html) => {
    view = 'memo'; panel.classList.add('on');
    list.innerHTML = backBtn() + '<div class="det"><h2>' + title + '</h2>' + html + '</div>';
    $('#bk').onclick = goBack; $('#cnt').textContent = '';
  };
  const stop = (sel) => { const e = $(sel); if (e) e.addEventListener('keydown', (ev) => ev.stopPropagation()); };
  const rnd = (n) => Math.floor(Math.random() * n);
  const fmt = (n) => (isFinite(n) ? Math.round(n * 100) / 100 : '—').toLocaleString('ru-RU');

  function pct() {
    shell('％ Калькулятор процентов', '<div style="display:flex;gap:10px;flex-wrap:wrap"><label style="font-size:12px">Число<br><input class="fld" id="pcA" type="number" value="1000" style="width:130px"></label><label style="font-size:12px">Процент<br><input class="fld" id="pcP" type="number" value="15" style="width:110px"></label><label style="font-size:12px">Второе число<br><input class="fld" id="pcB" type="number" value="1150" style="width:130px"></label></div><div class="note" id="pcR" style="margin-top:12px;line-height:1.9"></div>');
    const calc = () => {
      const a = +$('#pcA').value, p = +$('#pcP').value, b = +$('#pcB').value;
      $('#pcR').innerHTML = p + '% от ' + a + ' = <b>' + fmt(a * p / 100) + '</b><br>' + a + ' + ' + p + '% = <b>' + fmt(a * (1 + p / 100)) + '</b><br>' + a + ' − ' + p + '% = <b>' + fmt(a * (1 - p / 100)) + '</b><br>' + a + ' это <b>' + fmt(a / b * 100) + '%</b> от ' + b + '<br>Изменение с ' + a + ' до ' + b + ': <b>' + fmt((b - a) / a * 100) + '%</b>';
    };
    ['#pcA', '#pcP', '#pcB'].forEach((s) => { stop(s); $(s).oninput = calc; });
    calc();
  }

  function counter() {
    const key = 'ph_cnt', D = Object.assign({ a: 0, b: 0, c: 0, an: 'Задержания', bn: 'Штрафы', cn: 'Рапорты' }, LS.get(key, {}));
    shell('🔢 Счётчики', '<p class="t">Нажимайте + во время смены. Значения хранятся на этом ПК.</p><div id="cnB"></div><div class="actions"><button class="abtn" id="cnR">Сбросить всё</button></div>');
    const draw = () => {
      $('#cnB').innerHTML = ['a', 'b', 'c'].map((k) => '<div class="urow" style="grid-template-columns:1fr auto auto auto"><span>' + eh(D[k + 'n']) + '</span><button class="mini" data-k="' + k + '" data-d="-1">−</button><b style="min-width:40px;text-align:center;font-size:18px">' + D[k] + '</b><button class="mini on" data-k="' + k + '" data-d="1">+</button></div>').join('');
      $('#cnB').querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => { D[b.dataset.k] = Math.max(0, D[b.dataset.k] + +b.dataset.d); LS.set(key, D); draw(); }));
    };
    $('#cnR').onclick = () => { D.a = D.b = D.c = 0; LS.set(key, D); draw(); };
    draw();
  }

  function stopwatch() {
    shell('⏱ Секундомер и таймер', '<div id="swT" style="font-size:38px;font-weight:800;font-variant-numeric:tabular-nums;margin:6px 0">00:00.0</div><div class="actions"><button class="abtn on" id="swS">Старт</button><button class="abtn" id="swL">Круг</button><button class="abtn" id="swR">Сброс</button></div><div id="swLaps" class="t" style="font-size:12.5px"></div><h3 style="margin:16px 0 6px">Таймер</h3><div class="actions"><input class="fld" id="tmM" type="number" min="1" value="5" style="width:90px"><span style="align-self:center">мин</span><button class="abtn on" id="tmS">Запустить</button></div><div class="note" id="tmR" style="margin-top:8px"></div>');
    let t0 = 0, acc = 0, run = false, laps = [], end = 0;
    const iv = setInterval(() => {
      if (!$('#swT')) return clearInterval(iv);
      const ms = acc + (run ? Date.now() - t0 : 0);
      $('#swT').textContent = String(Math.floor(ms / 60000)).padStart(2, '0') + ':' + String(Math.floor(ms / 1000) % 60).padStart(2, '0') + '.' + (Math.floor(ms / 100) % 10);
      if (end) {
        const left = end - Date.now();
        if (left <= 0) {
          $('#tmR').innerHTML = '<b style="color:#ffd36b">Время вышло!</b>'; end = 0;
          try { const c = new AudioContext(), o = c.createOscillator(); o.connect(c.destination); o.frequency.value = 880; o.start(); setTimeout(() => o.stop(), 500); } catch (e) {}
        } else $('#tmR').textContent = 'Осталось ' + Math.floor(left / 60000) + ':' + String(Math.floor(left / 1000) % 60).padStart(2, '0');
      }
    }, 100);
    $('#swS').onclick = () => { if (run) { acc += Date.now() - t0; run = false; $('#swS').textContent = 'Старт'; } else { t0 = Date.now(); run = true; $('#swS').textContent = 'Пауза'; } };
    $('#swL').onclick = () => { if (!run) return; laps.unshift($('#swT').textContent); $('#swLaps').innerHTML = laps.map((l, i) => 'Круг ' + (laps.length - i) + ': <b>' + l + '</b>').join('<br>'); };
    $('#swR').onclick = () => { acc = 0; run = false; laps = []; $('#swS').textContent = 'Старт'; $('#swLaps').innerHTML = ''; };
    stop('#tmM');
    $('#tmS').onclick = () => { end = Date.now() + Math.max(1, +$('#tmM').value || 1) * 60000; };
  }

  function numbers() {
    shell('🧮 Числа и текст', '<textarea class="ai-box" id="nmT" placeholder="Вставьте текст или числа"></textarea><div class="note" id="nmR" style="margin-top:10px;line-height:1.9"></div><div class="actions"><button class="abtn" id="nmU">ВЕРХНИЙ</button><button class="abtn" id="nmL">нижний</button><button class="abtn" id="nmC">Копировать</button></div>');
    const ta = $('#nmT'); stop('#nmT');
    const calc = () => {
      const v = ta.value, nums = (v.match(/-?\d+(?:[.,]\d+)?/g) || []).map((x) => +x.replace(',', '.')), sum = nums.reduce((a, b) => a + b, 0);
      $('#nmR').innerHTML = 'Символов: <b>' + v.length + '</b>, слов: <b>' + (v.trim() ? v.trim().split(/\s+/).length : 0) + '</b>, строк: <b>' + (v ? v.split('\n').length : 0) + '</b><br>Чисел: <b>' + nums.length + '</b>, сумма: <b>' + fmt(sum) + '</b>' + (nums.length ? ', среднее: <b>' + fmt(sum / nums.length) + '</b>' : '');
    };
    ta.oninput = calc; calc();
    $('#nmU').onclick = () => { ta.value = ta.value.toUpperCase(); calc(); };
    $('#nmL').onclick = () => { ta.value = ta.value.toLowerCase(); calc(); };
    $('#nmC').onclick = () => X.copy(ta.value, $('#nmC'));
  }

  function random() {
    shell('🎲 Жребий', '<div class="actions"><button class="abtn on" id="rdC">Монета</button><button class="abtn" id="rdD">Кубик</button><input class="fld" id="rdN" type="number" value="100" style="width:90px"><button class="abtn" id="rdR">Число 1…N</button></div><div class="note" id="rdO" style="margin-top:12px;font-size:20px"></div><h3 style="margin:16px 0 6px">Выбрать из списка</h3><textarea class="ai-box" id="rdL" placeholder="По одному варианту в строке"></textarea><div class="actions"><button class="abtn" id="rdP">Выбрать случайный</button></div>');
    const out = (h) => ($('#rdO').innerHTML = h);
    stop('#rdN'); stop('#rdL');
    $('#rdC').onclick = () => out(rnd(2) ? '🪙 Орёл' : '🪙 Решка');
    $('#rdD').onclick = () => out('🎲 ' + (rnd(6) + 1));
    $('#rdR').onclick = () => out('🔢 ' + (rnd(Math.max(1, +$('#rdN').value || 1)) + 1));
    $('#rdP').onclick = () => { const a = $('#rdL').value.split('\n').map((x) => x.trim()).filter(Boolean); out(a.length ? '👉 ' + eh(a[rnd(a.length)]) : 'Добавьте варианты'); };
  }


  // ---------- Покупка Premium ----------
  const PLAN_ORDER = ['week', 'month', 'forever'], ULTRA_ORDER = ['uweek', 'umonth', 'uforever'];
  const dateRu = (ms) => new Date(ms).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const SRC = { paid: ['куплен', '#ffc43c'], granted: ['выдан персоналом', '#7cf0c9'], role: ['даёт роль', '#c48bff'] };
  function premLine(p) {
    if (!p || !p.source) return '<span style="color:var(--muted)">Premium не активен</span>';
    const [t, c] = SRC[p.source] || ['', '#ccc'];
    const until = p.source === 'paid' ? (p.until ? ', действует до <b>' + dateRu(p.until) + '</b>' : ', <b>навсегда</b>') : '';
    return '<span class="rbadge" style="--c:' + c + '"><i class="rdot"></i>' + (p.tier === 'ultra' ? '💎 Ультра Премиум' : '⭐ Premium') + ' · ' + t + '</span>' + until;
  }
  async function premium() {
    shell('⭐ Premium', '<p class="t">Загрузка…</p>');
    const api = window.overlay && window.overlay.staffApi; if (!api) return;
    let busy = false, sel = 'month', timer = null;
    const draw = async () => {
      const d = await api('GET', '/pay/info'); const box = $('#pmBox'); if (!box && !$('.det')) return;
      if (!d || d.error) { $('.det').innerHTML = '<h2>⭐ Premium</h2><p class="t">' + eh((d && d.error) || 'Ошибка') + '</p>'; return; }
      const o = d.order, hist = (d.history || []).slice(0, 8);
      const isU = sel[0] === 'u', tk = isU ? ULTRA_ORDER : PLAN_ORDER, per = { week: 'в неделю', month: 'в месяц', forever: 'один раз' };
      const mk = (k) => { const p = d.plans[k], base = k.replace(/^u/, ''); const best = base === 'forever'; return '<button class="pm-plan' + (sel === k ? ' sel' : '') + '" data-p="' + k + '">' + (best ? '<i class="pm-tag">Выгодно</i>' : '') + '<span class="pm-n">' + p.n + '</span><b class="pm-p">' + p.price + '<small> ₽</small></b><span class="pm-s">' + per[base] + '</span></button>'; };
      const plans = '<div class="pm-tabs"><button class="pm-tab' + (!isU ? ' on' : '') + '" data-t="premium">⭐ Premium</button><button class="pm-tab' + (isU ? ' on' : '') + '" data-t="ultra">💎 Ультра Премиум</button></div>'
        + '<ul class="pm-perks">' + (isU ? '<li>Всё из Premium</li><li>Больше вопросов ИИ-помощнику каждый день</li><li>Приоритет в новых функциях</li>' : '<li>ИИ-помощник</li><li>Расширенные возможности и инструменты</li><li>Особый значок в списках</li>') + '</ul>'
        + '<div class="pm-grid">' + tk.map(mk).join('') + '</div>';
      const pn = (k) => (d.plans[k] && d.plans[k].tier === 'ultra' ? 'Ультра ' : 'Premium ') + (d.plans[k] ? d.plans[k].n : '');
      let order = '';
      if (o && o.status === 'new' && d.auto && o.url) order = '<div class="note" style="margin-top:12px;line-height:1.7"><b>Заказ ' + eh(o.code) + '</b>: ' + eh(pn(o.plan)) + ', <b>' + o.price + ' ₽</b><br>Оплатить можно через СБП, картой Мир, Visa или Mastercard. После оплаты Premium включится сам.</div><div class="actions"><button class="abtn on" id="pmPay">Перейти к оплате</button><button class="abtn" id="pmCheck">Проверить оплату</button></div>';
      else if (o && o.status === 'new') order = '<div class="note" style="margin-top:12px;line-height:1.7"><b>Заказ ' + eh(o.code) + '</b>: ' + eh(pn(o.plan)) + ', <b>' + o.price + ' ₽</b><br>1. Переведите <b>' + o.price + ' ₽</b> на карту <b>' + eh(d.card) + '</b>' + (d.holder ? ' (' + eh(d.holder) + ')' : '') + '<br>2. В комментарии к переводу укажите код <b>' + eh(o.code) + '</b><br>3. Нажмите «Я оплатил». Персонал проверит перевод и выдаст Premium.</div><div class="actions"><button class="abtn" id="pmCopy">📋 Копировать карту</button><button class="abtn on" id="pmClaim">Я оплатил</button></div>';
      else if (o && o.status === 'claimed') order = '<div class="note" style="margin-top:12px">⏳ Заказ <b>' + eh(o.code) + '</b> ждёт проверки персоналом. Обычно это недолго. Premium появится сам.</div>';
      else if (o && o.status === 'rejected') order = '<div class="note" style="margin-top:12px;border-color:rgba(255,100,100,.5)">❌ Оплата заказа ' + eh(o.code) + ' отклонена' + (o.reason ? ': ' + eh(o.reason) : '') + '</div>';
      else if (o && o.status === 'paid' && d.premium && d.premium.source === 'paid') order = '<div class="note" style="margin-top:12px;border-color:rgba(61,220,132,.5)">✅ Оплата подтверждена, спасибо!</div>';
      const canBuy = d.enabled && !(o && (o.status === 'claimed' || (o.status === 'new' && !d.auto)));
      const cur = d.plans[sel], buyLbl = (d.auto ? 'Оплатить ' : 'Перевести ') + cur.price + ' ₽';
      const css = '<style>.pm-wrap{width:100%;padding-top:10px}.pm-wrap h2{margin:0 0 14px;line-height:1.3}.pm-stat{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:12px 14px;border-radius:14px;background:linear-gradient(135deg,rgba(255,196,60,.14),rgba(196,139,255,.12));border:1px solid rgba(255,196,60,.3);margin-bottom:16px;font-size:13px}.pm-tabs{display:flex;gap:6px;padding:4px;border-radius:12px;background:rgba(255,255,255,.05);margin-bottom:12px}.pm-tab{flex:1;padding:10px;border:0;border-radius:9px;background:transparent;color:var(--muted);font-weight:700;cursor:pointer;font-size:13px}.pm-tab.on{background:var(--accent);color:#fff}.pm-perks{margin:0 0 14px;padding:0;list-style:none;display:grid;gap:5px;font-size:13px;color:var(--muted)}.pm-perks li:before{content:"✓";color:#3ddc84;margin-right:8px;font-weight:700}.pm-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.pm-plan{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:18px 8px 14px;border-radius:14px;background:rgba(255,255,255,.04);border:2px solid transparent;color:inherit;cursor:pointer;transition:.15s}.pm-plan:hover{background:rgba(255,255,255,.08)}.pm-plan.sel{border-color:var(--accent);background:rgba(255,255,255,.1);transform:translateY(-2px)}.pm-n{font-size:12px;color:var(--muted)}.pm-p{font-size:26px;line-height:1.2}.pm-p small{font-size:14px;font-weight:600}.pm-s{font-size:11px;color:var(--muted)}.pm-tag{position:absolute;top:-8px;padding:1px 9px;border-radius:99px;background:#ffc43c;color:#222;font-size:10px;font-style:normal;font-weight:700;font-family:inherit;letter-spacing:.3px;text-transform:uppercase;line-height:1.5}.pm-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.05)}.pm-bar b{font-size:14px}.pm-bar small{display:block;color:var(--muted);font-size:12px}.pm-go{padding:12px 22px;border:0;border-radius:12px;background:var(--accent);color:#fff;font-weight:800;font-size:14px;cursor:pointer;white-space:nowrap}.pm-go:hover{filter:brightness(1.12)}.pm-hist{display:grid;gap:6px;margin-top:6px}.pm-hist div{display:flex;justify-content:space-between;gap:10px;padding:9px 12px;border-radius:10px;background:rgba(255,255,255,.04);font-size:12px}.pm-hist small{color:var(--muted);white-space:nowrap}@media(max-width:520px){.pm-grid{grid-template-columns:1fr}}</style>';
      $('.det').innerHTML = css + '<div class="pm-wrap"><h2>⭐ Premium</h2><div class="pm-stat"><span>Ваш статус:</span>' + premLine(d.premium) + '</div>'
        + plans
        + (d.enabled ? (canBuy ? '<div class="pm-bar"><div><b>' + (isU ? '💎 Ультра' : '⭐ Premium') + ' · ' + cur.n + '</b><small>' + (d.auto ? 'СБП, карты Мир, Visa, Mastercard' : 'Перевод на карту, подтверждает персонал') + '</small></div><button class="pm-go" id="pmBuy">' + buyLbl + '</button></div>' : '') : '<div class="pm-bar"><small>Приём оплаты пока не включён администратором.</small></div>')
        + order
        + (hist.length ? '<h3 style="margin:20px 0 6px">История</h3><div class="pm-hist">' + hist.map((h) => '<div><span>' + eh(h.text) + '</span><small>' + new Date(h.t).toLocaleDateString('ru-RU') + '</small></div>').join('') + '</div>' : '') + '</div>';
      $('#bk') && ($('#bk').onclick = () => { clearInterval(timer); goBack(); });
      document.querySelectorAll('.pm-tab').forEach((b) => (b.onclick = () => { sel = b.dataset.t === 'ultra' ? 'umonth' : 'month'; draw(); }));
      document.querySelectorAll('.pm-plan').forEach((b) => (b.onclick = () => { sel = b.dataset.p; draw(); }));
      const buy = $('#pmBuy'); if (buy) buy.onclick = async () => { if (busy) return; busy = true; const r = await api('POST', '/pay/order', { plan: sel }); busy = false; if (r && r.error) alert(r.error); else if (r && r.order && r.order.url && window.overlay.openUrl) window.overlay.openUrl(r.order.url); draw(); };
      const py = $('#pmPay'); if (py) py.onclick = () => window.overlay.openUrl && window.overlay.openUrl(o.url);
      const ck = $('#pmCheck'); if (ck) ck.onclick = async () => { if (busy) return; busy = true; await api('POST', '/pay/check', { code: o.code }); busy = false; draw(); };
      const cp = $('#pmCopy'); if (cp) cp.onclick = () => X.copy(String(d.card).replace(/\s/g, ''), cp);
      const cl = $('#pmClaim'); if (cl) cl.onclick = async () => { if (busy) return; busy = true; const r = await api('POST', '/pay/claim', { code: o.code }); busy = false; if (r && r.error) alert(r.error); draw(); };
    };
    await draw();
    timer = setInterval(async () => { if (!$('.det') || !/Premium/.test(($('.det h2') || {}).textContent || '')) return clearInterval(timer); draw(); }, 20000);
  }

  window.PHX_tools2 = { premium, pct, counter, stopwatch, numbers, random };
})();
