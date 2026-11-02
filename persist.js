/* Каждая запись ph_* в localStorage дублируется в файл основного процесса, чтобы настройки не терялись. */
(function () {
  const ov = window.overlay; if (!ov || !ov.lsSet) return;
  const P = Storage.prototype, set = P.setItem, rem = P.removeItem;
  P.setItem = function (k, v) { set.call(this, k, v); if (this === localStorage && /^ph_/.test(k)) ov.lsSet(String(k), String(v)); };
  P.removeItem = function (k) { rem.call(this, k); if (this === localStorage && /^ph_/.test(k)) ov.lsSet(String(k), null); };
})();
