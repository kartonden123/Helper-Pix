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
  const PLAN_ORDER = ['week', 'month', 'forever'];
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
      const plans = PLAN_ORDER.map((k) => { const p = d.plans[k]; return '<button class="tl-card pm-plan' + (sel === k ? ' sel' : '') + '" data-p="' + k + '" style="text-align:center;flex:1;min-width:110px"><b style="font-size:20px">' + p.price + ' ₽</b><span>' + p.n + '</span></button>'; }).join('');
      let order = '';
      window.__pmUsdt = null;
      if (o && o.status === 'new' && o.method === 'usdt' && o.usdt) { window.__pmUsdt = o.code; order = '<div class="note" style="margin-top:12px;line-height:1.8"><b>Заказ ' + eh(o.code) + '</b>: ' + eh(d.plans[o.plan].n) + ' (' + o.price + ' ₽)<br>Отправьте ровно <b>' + eh(o.usdt.amount) + ' USDT</b> в сети <b>TRON (TRC-20)</b> на адрес:<br><code style="user-select:text;word-break:break-all">' + eh(o.usdt.addr) + '</code><br><small>Сумма должна совпасть до последнего знака, по ней система находит ваш платёж. Premium включится сам через 1–3 минуты после подтверждения сети.</small></div><div class="actions"><button class="abtn" id="pmCopyA">📋 Адрес</button><button class="abtn" id="pmCopyS">📋 Сумма</button><button class="abtn on" id="pmCheck">Проверить оплату</button></div>'; }
      else if (o && o.status === 'new' && d.auto && o.url) order = '<div class="note" style="margin-top:12px;line-height:1.7"><b>Заказ ' + eh(o.code) + '</b>: ' + eh(d.plans[o.plan].n) + ', <b>' + o.price + ' ₽</b><br>Оплатить можно через СБП, картой Мир, Visa или Mastercard. После оплаты Premium включится сам.</div><div class="actions"><button class="abtn on" id="pmPay">Перейти к оплате</button><button class="abtn" id="pmCheck">Проверить оплату</button></div>';
      else if (o && o.status === 'new') order = '<div class="note" style="margin-top:12px;line-height:1.7"><b>Заказ ' + eh(o.code) + '</b>: ' + eh(d.plans[o.plan].n) + ', <b>' + o.price + ' ₽</b><br>1. Переведите <b>' + o.price + ' ₽</b> на карту <b>' + eh(d.card) + '</b>' + (d.holder ? ' (' + eh(d.holder) + ')' : '') + '<br>2. В комментарии к переводу укажите код <b>' + eh(o.code) + '</b><br>3. Нажмите «Я оплатил». Персонал проверит перевод и выдаст Premium.</div><div class="actions"><button class="abtn" id="pmCopy">📋 Копировать карту</button><button class="abtn on" id="pmClaim">Я оплатил</button></div>';
      else if (o && o.status === 'claimed') order = '<div class="note" style="margin-top:12px">⏳ Заказ <b>' + eh(o.code) + '</b> ждёт проверки персоналом. Обычно это недолго. Premium появится сам.</div>';
      else if (o && o.status === 'rejected') order = '<div class="note" style="margin-top:12px;border-color:rgba(255,100,100,.5)">❌ Оплата заказа ' + eh(o.code) + ' отклонена' + (o.reason ? ': ' + eh(o.reason) : '') + '</div>';
      else if (o && o.status === 'paid') order = '<div class="note" style="margin-top:12px;border-color:rgba(61,220,132,.5)">✅ Оплата подтверждена, спасибо!</div>';
      const canBuy = d.enabled && !(o && (o.status === 'claimed' || (o.status === 'new' && !d.auto)));
      $('.det').innerHTML = '<h2>⭐ Premium</h2><p class="t">Ваш статус: ' + premLine(d.premium) + '</p>'
        + '<p class="t">Premium даёт ИИ-помощника и расширенные возможности. Выберите срок:</p><div style="display:flex;gap:8px;flex-wrap:wrap">' + plans + '</div>'
        + (d.enabled ? (canBuy ? '<div class="actions">' + (d.auto || d.card ? '<button class="abtn on" id="pmBuy">' + (d.auto ? 'Оплатить ' : 'Перевод на карту ') + d.plans[sel].price + ' ₽</button>' : '') + (d.usdt ? '<button class="abtn' + (d.auto || d.card ? '' : ' on') + '" id="pmBuyU">💲 USDT (авто)</button>' : '') + '</div>' : '') : '<p class="t">Приём оплаты пока не включён администратором.</p>')
        + order
        + (hist.length ? '<h3 style="margin:16px 0 6px">История</h3>' + hist.map((h) => '<div class="urow" style="grid-template-columns:1fr auto"><span>' + eh(h.text) + '</span><small>' + new Date(h.t).toLocaleDateString('ru-RU') + '</small></div>').join('') : '');
      $('#bk') && ($('#bk').onclick = () => { clearInterval(timer); goBack(); });
      document.querySelectorAll('.pm-plan').forEach((b) => (b.onclick = () => { sel = b.dataset.p; draw(); }));
      const bu = $('#pmBuyU'); if (bu) bu.onclick = async () => { if (busy) return; busy = true; const r = await api('POST', '/pay/order', { plan: sel, method: 'usdt' }); busy = false; if (r && r.error) alert(r.error); draw(); };
      const ca = $('#pmCopyA'); if (ca) ca.onclick = () => X.copy(o.usdt.addr, ca);
      const cs = $('#pmCopyS'); if (cs) cs.onclick = () => X.copy(o.usdt.amount, cs);
      const buy = $('#pmBuy'); if (buy) buy.onclick = async () => { if (busy) return; busy = true; const r = await api('POST', '/pay/order', { plan: sel, method: 'card' }); busy = false; if (r && r.error) alert(r.error); else if (r && r.order && r.order.url && window.overlay.openUrl) window.overlay.openUrl(r.order.url); draw(); };
      const py = $('#pmPay'); if (py) py.onclick = () => window.overlay.openUrl && window.overlay.openUrl(o.url);
      const ck = $('#pmCheck'); if (ck) ck.onclick = async () => { if (busy) return; busy = true; await api('POST', '/pay/check', { code: o.code }); busy = false; draw(); };
      const cp = $('#pmCopy'); if (cp) cp.onclick = () => X.copy(String(d.card).replace(/\s/g, ''), cp);
      const cl = $('#pmClaim'); if (cl) cl.onclick = async () => { if (busy) return; busy = true; const r = await api('POST', '/pay/claim', { code: o.code }); busy = false; if (r && r.error) alert(r.error); draw(); };
    };
    await draw();
    timer = setInterval(async () => { if (!$('.det') || !/Premium/.test(($('.det h2') || {}).textContent || '')) return clearInterval(timer); if (window.__pmUsdt) await api('POST', '/pay/check', { code: window.__pmUsdt }); draw(); }, 20000);
  }

  window.PHX_tools2 = { premium, pct, counter, stopwatch, numbers, random };
})();
