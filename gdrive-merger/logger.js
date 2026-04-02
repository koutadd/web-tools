/**
 * シンプルなロガー
 * ログレベル: DEBUG < INFO < WARN < ERROR
 * LOG_LEVEL 環境変数で制御（デフォルト: INFO）
 */

const LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
const currentLevel = LEVELS[(process.env.LOG_LEVEL || 'INFO').toUpperCase()] ?? LEVELS.INFO;

function format(level, msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  return `[${ts}] [${level.padEnd(5)}] ${msg}`;
}

export const log = {
  debug: (msg) => {
    if (currentLevel <= LEVELS.DEBUG) console.debug(format('DEBUG', msg));
  },
  info: (msg) => {
    if (currentLevel <= LEVELS.INFO) console.log(format('INFO ', msg));
  },
  warn: (msg) => {
    if (currentLevel <= LEVELS.WARN) console.warn(format('WARN ', msg));
  },
  error: (msg) => {
    if (currentLevel <= LEVELS.ERROR) console.error(format('ERROR', msg));
  },
};
