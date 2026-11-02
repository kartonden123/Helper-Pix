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

  window.PHX_tools2 = { pct, counter, stopwatch, numbers, random };
})();
