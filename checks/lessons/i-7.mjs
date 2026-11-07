// Connect a tool with MCP (Intermediate, lesson 7). The Learner shares Chrome
// DevTools MCP at project scope in a committed .mcp.json, pinned to one
// version with the server's three outbound data flows turned off, and saves
// a repaired local demo and a PNG capture taken after the repair. The real MCP console observation
// remains a session self-check.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const title = 'Подключаем инструмент через MCP';

const SHOT = '.practice/i-7-page.png';
const DEMO = '.practice/demo.html';
const DEMO_RUNNER = fileURLToPath(new URL('./i-7-demo.mjs', import.meta.url));
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function server(value) {
  const servers = value?.mcpServers ?? {};
  return Object.values(servers).find((s) => (s?.args ?? []).some((a) => /^chrome-devtools-mcp(@|$)/.test(String(a))));
}

const off = (args, name) => args.includes(`--no-${name}`) || args.includes(`--${name}=false`);

export const items = [
  {
    text: 'закоммиченный `.mcp.json` запускает chrome-devtools-mcp точной версии, со статистикой использования, обращениями к CrUX и проверкой обновлений выключенными',
    check(repo) {
      let text;
      try {
        text = repo.git('show', 'HEAD:.mcp.json');
      } catch {
        return repo.exists('.mcp.json') ? '.mcp.json не закоммичен. Выполните `git add .mcp.json` и закоммитьте: через него коллеги получают серверы уровня проекта.' : 'В корне репозитория нет .mcp.json. Сохраните туда заготовку из раздела «Ваша очередь» урока.';
      }
      let value;
      try {
        value = JSON.parse(text);
      } catch (error) {
        return `Закоммиченный .mcp.json — некорректный JSON: ${error.message}`;
      }
      const s = server(value);
      if (!s) return 'Ни один сервер в .mcp.json не запускает chrome-devtools-mcp. Добавьте его в `mcpServers`, как в уроке.';
      const args = (s.args ?? []).map(String);
      const pkg = args.find((a) => a.startsWith('chrome-devtools-mcp'));
      if (!/^chrome-devtools-mcp@\d+\.\d+\.\d+$/.test(pkg)) return `Версия \`${pkg}\` не закреплена. Укажите точную версию, например \`chrome-devtools-mcp@1.10.1\`, чтобы каждый коллега запускал тот код, который вы проверили.`;
      if (!off(args, 'usage-statistics')) return 'Статистика использования всё ещё включена. Добавьте `--no-usage-statistics` в args.';
      if (!off(args, 'performance-crux')) return 'Трассировки производительности всё ещё могут отправлять URL в CrUX API Google. Добавьте `--no-performance-crux` в args.';
      if (!String(s.env?.CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS ?? '').trim()) return 'Проверка обновлений всё ещё включена. Задайте `CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS` равным `"1"` в `env` сервера.';
      return true;
    },
  },
  {
    text: '`.practice/i-7-page.png` содержит PNG-изображение исправленной страницы',
    local: true,
    check(repo) {
      const path = join(repo.dir, SHOT);
      if (!existsSync(path)) return `Файла ${SHOT} нет. Попросите Claude открыть страницу инструментами chrome-devtools и сохранить скриншот в ${SHOT}.`;
      if (!readFileSync(path).subarray(0, 8).equals(PNG_SIGNATURE)) return `${SHOT} — не PNG-изображение. Попросите Claude снова сохранить скриншот, в формате PNG.`;
      // The capture shows the repaired page only if it was saved after the
      // demo's last change.
      const demo = join(repo.dir, DEMO);
      return !existsSync(demo) || statSync(path).mtimeMs >= statSync(demo).mtimeMs ? true : `${SHOT} старше вашего последнего изменения в ${DEMO}. Снимите страницу снова, уже после исправления.`;
    },
  },
  {
    text: 'скрипт демо показывает `2 links ready` без ошибки скрипта',
    local: true,
    check(repo) {
      const html = repo.read(DEMO);
      if (html === null) return `Файла ${DEMO} нет. Сохраните сломанную страницу из разбора на примере, затем найдите и исправьте ошибку с помощью MCP.`;
      const result = spawnSync(process.execPath, ['--max-old-space-size=32', DEMO_RUNNER], {
        input: html, encoding: 'utf8', timeout: 1500, maxBuffer: 16384, env: {},
      });
      let observed;
      try { observed = JSON.parse(result.stdout); } catch { observed = null; }
      if (result.error || result.status !== 0 || !observed || observed.error || observed.errors?.length) return 'Скрипт демо падает. Прочитайте ошибку через MCP, затем исправьте её причину в .practice/demo.html.';
      return observed.counts?.[0] === '2 links ready' && observed.counts?.[1] === '3 links ready' ? true : 'Счётчик демо не следует за ссылками страницы. Сохраните подсчёт и исправьте элемент, который он обновляет.';
    },
  },
];
