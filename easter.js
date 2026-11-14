/* Пасхалка: три быстрых нажатия на логотип в настройках → разбивается, вспышка, осколки, подпись.
   Отключается переключателем «Анимации» (ph_anim) в разделе «Внешний вид».
   Ничего не грузит из сети: картинка логотипа уже на экране, звук берётся из sounds/. */
(function () {
  if (window.PHX_easter) return;

  const TITLE = 'KATO';              // что появляется в финале
  const NEED = 3;                    // сколько нажатий
  const WINDOW_MS = 900;             // за какое время

  let taps = [], busy = false;

  function reduce() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (e) { return false; }
  }

  function animOn() {
    // если пользователь выключил анимации в настройках — пасхалка молчит
    try {
      if (window.PHX && window.PHX.LS) {
        const v = window.PHX.LS.get('ph_anim', true);
        if (v === false || v === 'false') return false;
      }
    } catch (e) {}
    return !reduce();
  }

  /* Звук синтезируем кодом — как уже делает программа в других местах (tools2.js, main.js).
     Так не нужно тащить wav-файл в сборку и не бывает битых ссылок. */
  function playSound() {
    try {
      const c = new (window.AudioContext || window.webkitAudioContext)();
      const now = c.currentTime;

      /* «стекло»: короткий звонкий удар с обертонами */
      const hit = c.createOscillator();
      const hitG = c.createGain();
      hit.type = 'triangle';
      hit.frequency.setValueAtTime(1320, now);
      hit.frequency.exponentialRampToValueAtTime(360, now + 0.42);
      hitG.gain.setValueAtTime(0.0001, now);
      hitG.gain.exponentialRampToValueAtTime(0.16, now + 0.006);
      hitG.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      hit.connect(hitG); hitG.connect(c.destination);
      hit.start(now); hit.stop(now + 0.46);

      /* высокий «посыл» — блеск стекла */
      const ping = c.createOscillator();
      const pingG = c.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(2637, now + 0.02);
      pingG.gain.setValueAtTime(0.0001, now + 0.02);
      pingG.gain.exponentialRampToValueAtTime(0.05, now + 0.03);
      pingG.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      ping.connect(pingG); pingG.connect(c.destination);
      ping.start(now + 0.02); ping.stop(now + 0.52);

      /* мягкий «гром» на уборке */
      const low = c.createOscillator();
      const lowG = c.createGain();
      low.type = 'sine';
      low.frequency.setValueAtTime(110, now);
      low.frequency.exponentialRampToValueAtTime(55, now + 0.3);
      lowG.gain.setValueAtTime(0.12, now);
      lowG.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
      low.connect(lowG); lowG.connect(c.destination);
      low.start(now); low.stop(now + 0.33);

      setTimeout(() => { try { c.close(); } catch (e) {} }, 1200);
    } catch (e) {}
  }

  /* --- сцена --- */
  function stage() {
    const w = document.createElement('div');
    w.id = 'phEaster';
    w.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99999',
      'pointer-events:none', 'overflow:hidden',
      'display:block'
    ].join(';');
    return w;
  }

  /* осколок: треугольник, падает вниз с вращением */
  function shard(cx, cy, size, hue) {
    const s = document.createElement('i');
    const ang = Math.random() * Math.PI * 2;
    const dist = 90 + Math.random() * 260;
    const dx = Math.cos(ang) * dist;
    const dy = Math.sin(ang) * dist * 0.75 - 40;
    const rot = (Math.random() * 720 - 360);
    const ms = 900 + Math.random() * 700;
    s.style.cssText = [
      'position:absolute',
      'left:' + cx + 'px', 'top:' + cy + 'px',
      'width:' + size + 'px', 'height:' + size + 'px',
      'background:linear-gradient(135deg, rgba(255,255,255,.95), rgba(255,77,109,.85))',
      'box-shadow:0 0 10px rgba(255,77,109,.55)',
      'clip-path:polygon(50% 0,100% 100%,0 100%)',
      'opacity:1',
      'will-change:transform,opacity',
      'transition:transform ' + ms + 'ms cubic-bezier(.22,.7,.3,1), opacity ' + ms + 'ms ease-in'
    ].join(';');
    return { el: s, tf: 'translate(-50%,-50%) translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg)', ms: ms };
  }

  function run(anchor) {
    if (busy) return;
    busy = true;

    const r = anchor.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;

    const w = stage();
    document.body.appendChild(w);

    /* 1. трещины на самом логотипе */
    anchor.style.transition = 'transform 220ms ease, filter 220ms ease';
    anchor.style.filter = 'brightness(1.6) drop-shadow(0 0 14px rgba(255,77,109,.9))';
    anchor.style.transform = 'scale(1.12)';

    /* 2. вспышка */
    const flash = document.createElement('i');
    flash.style.cssText = [
      'position:absolute', 'inset:0',
      'background:radial-gradient(circle at ' + cx + 'px ' + cy + 'px, rgba(255,255,255,.95), rgba(255,255,255,0) 55%)',
      'opacity:0', 'transition:opacity 120ms ease-in'
    ].join(';');
    w.appendChild(flash);
    requestAnimationFrame(() => { flash.style.opacity = '1'; });

    setTimeout(() => { flash.style.transition = 'opacity 380ms ease-out'; flash.style.opacity = '0'; }, 130);

    /* 3. осколки */
    const list = [];
    const N = 34;
    for (let i = 0; i < N; i++) {
      const size = 7 + Math.random() * 16;
      const sh = shard(cx, cy, size, i);
      w.appendChild(sh.el);
      list.push(sh);
    }
    requestAnimationFrame(() => {
      list.forEach((sh) => {
        sh.el.style.transform = sh.tf;
        sh.el.style.opacity = '0';
      });
    });

    playSound();

    /* 4. подпись */
    setTimeout(() => {
      const t = document.createElement('div');
      t.style.cssText = [
        'position:absolute', 'left:50%', 'top:44%',
        'transform:translate(-50%,-50%) scale(.7)',
        'font:800 clamp(38px,10vw,68px)/1 "Segoe UI",Inter,system-ui,sans-serif',
        'letter-spacing:.22em', 'padding-left:.22em',
        'color:#fff', 'white-space:nowrap',
        'text-shadow:0 0 18px rgba(255,77,109,.95),0 0 46px rgba(255,77,109,.6),0 3px 0 rgba(0,0,0,.35)',
        'opacity:0',
        'transition:opacity 320ms ease-out, transform 420ms cubic-bezier(.2,.8,.3,1)'
      ].join(';');
      t.textContent = TITLE;
      w.appendChild(t);
      requestAnimationFrame(() => {
        t.style.opacity = '1';
        t.style.transform = 'translate(-50%,-50%) scale(1)';
      });

      /* блеск, пробегающий по буквам */
      const shine = document.createElement('div');
      shine.style.cssText = [
        'position:absolute', 'left:50%', 'top:44%',
        'transform:translate(-50%,-50%)',
        'font:800 clamp(38px,10vw,68px)/1 "Segoe UI",Inter,system-ui,sans-serif',
        'letter-spacing:.22em', 'padding-left:.22em',
        'background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.95) 50%,transparent 70%)',
        'background-size:250% 100%',
        '-webkit-background-clip:text', 'background-clip:text',
        'color:transparent', 'white-space:nowrap',
        'opacity:.9'
      ].join(';');
      shine.textContent = TITLE;
      w.appendChild(shine);
      try {
        shine.animate(
          [{ backgroundPosition: '180% 0' }, { backgroundPosition: '-80% 0' }],
          { duration: 900, easing: 'ease-in-out' }
        );
      } catch (e) {
        /* старый Chromium без анимаций по background-position — просто проявим */
        shine.style.opacity = '.55';
      }

      setTimeout(() => {
        t.style.transition = 'opacity 400ms ease-in, transform 400ms ease-in';
        t.style.opacity = '0';
        t.style.transform = 'translate(-50%,-50%) scale(1.06)';
        shine.style.transition = 'opacity 400ms ease-in';
        shine.style.opacity = '0';
      }, 1000);
    }, 380);

    /* 5. уборка */
    setTimeout(() => {
      anchor.style.filter = '';
      anchor.style.transform = '';
      w.style.transition = 'opacity 300ms ease-in';
      w.style.opacity = '0';
      setTimeout(() => { w.remove(); busy = false; }, 320);
    }, 2100);
  }

  /* --- перехват нажатий на логотип --- */
  function hook() {
    const logo = document.querySelector('#stBody .about img, #stBody img[src="logo.png"]');
    if (!logo) return;
    if (logo.dataset.phEgg === '1') return;
    logo.dataset.phEgg = '1';
    logo.style.cursor = 'pointer';
    logo.style.userSelect = 'none';
    logo.style.webkitUserDrag = 'none';
    logo.draggable = false;
    logo.title = '';

    /* драг картинки съедал бы быстрые нажатия — глушим */
    logo.addEventListener('dragstart', (e) => e.preventDefault());
    /* двойной клик выделяет картинку — тоже мешает счётчику */
    logo.addEventListener('mousedown', (e) => e.preventDefault());

    logo.addEventListener('click', () => {
      if (busy) return;
      if (!animOn()) return;

      const now = Date.now();
      /* окно отсчитывается от последнего нажатия, а не от первого */
      if (taps.length && now - taps[taps.length - 1] > WINDOW_MS) taps = [];
      taps.push(now);

      /* счётчик виден сразу: 1 — «щелчок», 2 — «щелчок + свечение», 3 — сцена */
      const n = taps.length;
      logo.style.filter = n >= 2
        ? 'brightness(1.35) drop-shadow(0 0 12px rgba(255,77,109,.75))'
        : '';
      setTimeout(() => { if (!busy) logo.style.filter = ''; }, 260);

      if (n >= NEED) {
        taps = [];
        logo.style.filter = '';
        run(logo);
      } else {
        /* лёгкий отклик: подпрыгивает тем сильнее, чем ближе к разгадке */
        const k = 1 + n * 0.06;
        logo.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(' + k + ')' }, { transform: 'scale(1)' }],
          { duration: 180, easing: 'ease-out' }
        );
      }
    });
  }

  /* логотип появляется перерисовкой настроек — следим за DOM */
  const mo = new MutationObserver(() => hook());
  try { mo.observe(document.body, { childList: true, subtree: true }); } catch (e) {}

  /* настройки могут открыться до готовности DOM — пробуем ещё раз по горячим точкам */
  [120, 500, 1200, 2500].forEach((t) => setTimeout(hook, t));
  document.addEventListener('click', () => setTimeout(hook, 60), true);

  window.PHX_easter = { run, hook };
  setTimeout(hook, 800);
})();
