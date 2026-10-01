// ============================================================
// ГЛОБАЛЬНОЕ ОТКЛЮЧЕНИЕ ЛОГОВ В ПРОДАКШНЕ
// Подключается ПЕРВЫМ в index.html
// ============================================================

// 🎯 ПЕРЕД РЕЛИЗОМ: false
const DEBUG = false;

const log = DEBUG
  ? console.log.bind(console)
  : () => {};

const warn = DEBUG
  ? console.warn.bind(console)
  : () => {};

// 🎯 Ошибки оставляем ВСЕГДА — критично для отладки
// console.error НЕ переопределяем

window.log = log;
window.warn = warn;