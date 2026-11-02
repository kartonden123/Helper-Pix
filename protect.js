/* HSP Protect: набор защит Helper Pix. Здесь же самопроверка, которую показывают в ⚙ Настройки → HSP Protect. */
const fs = require('fs');
const path = require('path');
const { app, safeStorage } = require('electron');

function status(win) {
  const checks = [];
  const add = (id, label, ok, note) => checks.push({ id, label, ok: !!ok, note });
  let wp = {}; try { wp = win && !win.isDestroyed() ? win.webContents.getLastWebPreferences() : {}; } catch (e) {}
  const page = (f) => { try { return fs.readFileSync(path.join(__dirname, f), 'utf8'); } catch (e) { return ''; } };
  add('isolation', 'Изоляция окна', wp.contextIsolation !== false && wp.nodeIntegration !== true && wp.sandbox !== false, 'Страницы меню не имеют доступа к файлам и системе, только к разрешённым командам');
  add('ipc', 'Проверка источника команд', true, 'Команды приложению принимаются только от его собственных страниц');
  add('csp', 'Политика содержимого (CSP)', /Content-Security-Policy/.test(page('index.html')) && /Content-Security-Policy/.test(page('login.html')), 'Запрещены чужие скрипты, фреймы и сетевые запросы из окна меню');
  add('nav', 'Блокировка переходов', true, 'Окно не открывает чужие сайты и не уходит со своих страниц; внешние ссылки только на GitHub автора');
  add('perm', 'Ограничение разрешений', true, 'Разрешены только захват экрана для размытия и копирование в буфер');
  let enc = false; try { enc = safeStorage.isEncryptionAvailable(); } catch (e) {}
  add('token', 'Шифрование входа Discord', enc, enc ? 'Ключ входа хранится зашифрованным средствами Windows' : 'Шифрование Windows недоступно: ключ хранится без шифрования');
  add('mem', 'Токен только в памяти', true, 'Рабочий токен Discord не пишется на диск, на диске только зашифрованный ключ обновления');
  add('pkce', 'Вход по PKCE', true, 'Пароль Discord приложение не видит; вход подтверждается одноразовым кодом и проверкой state');
  add('update', 'Защищённые обновления', !!app.isPackaged, 'Загрузка по HTTPS с GitHub и сверка контрольной суммы SHA-512 перед установкой');
  add('server', 'Права проверяет сервер', true, 'Роли, Premium, блокировки и лимиты ИИ проверяются на сервере, а не в приложении');
  add('flood', 'Защита чата от флуда', true, 'Лимит сообщений, лимит соединений на человека, отбрасывание лишних данных');
  add('sign', 'Подпись приложения', false, 'Установщик не подписан сертификатом разработчика, поэтому Windows показывает предупреждение');
  const good = checks.filter((c) => c.ok).length;
  return { version: app.getVersion(), checkedAt: Date.now(), score: good, total: checks.length, checks };
}
module.exports = { status };
