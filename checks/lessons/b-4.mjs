// Keep a session on track (Beginner, lesson 4). The check reads the refactor
// commit and the working tree itself. Only the moments around the rewind are
// saved by the Learner: git's status after the rename attempt, and just
// after rewinding it, which shows what rewind put back and what it left. The
// rename script changes src/links.js, a file Claude never edits in this
// conversation, so rewind leaves it; rewind would also restore a command's
// change to a file Claude had already edited (Checkpointing, Bash command
// changes not tracked).
import { spawnSync } from 'node:child_process';
import { statusEntries, statusPaths } from '../paths.mjs';

export const title = 'Удержать сессию в рабочем русле';

const CHECK = 'src/check-links.js';
const LINKS = 'src/links.js';
const CLI = 'src/cli.js';
const SAVE_BEFORE = '`git status --porcelain > .practice/b-4-before-rewind.txt`';
const SAVE_AFTER = '`git status --porcelain > .practice/b-4-after-rewind.txt`';
// Your turn's files: the script changes src/links.js, and Claude updates its
// callers, src/check-links.js and test/links.test.js.
const inScope = (path) => path.startsWith('src/') || path.startsWith('test/');
// The longest the link check may run, in milliseconds.
const LINKCHECK_LIMIT = 30_000;

// The commits after the copy's first one, newest first, that change a path.
function laterCommits(repo, path) {
  let shas;
  try {
    shas = repo.gitLocal('log', '--format=%H', 'HEAD', '--', path).split('\n').filter(Boolean);
  } catch {
    return [];
  }
  const roots = new Set(repo.gitLocal('rev-list', '--max-parents=0', 'HEAD').split('\n'));
  return shas.filter((sha) => !roots.has(sha));
}

// JavaScript without its comments, so a note such as "async was tried and
// dropped" doesn't read as asynchronous code.
const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
// Whether JavaScript exports `name`.
const hasExport = (text, name) => new RegExp(`export\\s+(async\\s+)?function\\s+${name}\\b|export\\s+(const|let)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b`).test(withoutComments(text));

export const items = [
  {
    text: 'коммит после первого коммита вашей копии меняет `src/check-links.js`, который по-прежнему экспортирует синхронный `brokenLinks`',
    check(repo) {
      if (!laterCommits(repo, CHECK).length) return 'Ни один коммит после первого коммита вашей копии не меняет `src/check-links.js`. Закончите рефакторинг из шага 5 разбора на примере и закоммитьте его.';
      const text = withoutComments(repo.gitLocal('show', `HEAD:${CHECK}`));
      if (!hasExport(text, 'brokenLinks')) {
        return '`src/check-links.js` в последнем коммите не экспортирует `brokenLinks`, а `src/cli.js` его импортирует. Попросите Claude оставить экспорт (шаг 5 разбора) и закоммитьте.';
      }
      if (/\basync\b|\bawait\b|fs\/promises|\.then\(/.test(text)) {
        return '`src/check-links.js` в последнем коммите всё ещё асинхронный. Попросите Claude снова сделать `brokenLinks` синхронным, как требует шаг 5 разбора на примере, и закоммитьте.';
      }
      return true;
    },
  },
  {
    text: '`.practice/b-4-before-rewind.txt` перечисляет `src/links.js` и `src/check-links.js`',
    local: true,
    check(repo) {
      const before = repo.read('.practice/b-4-before-rewind.txt');
      if (before === null) return `Когда Claude запустит скрипт переименования и обновит вызывающий код, выполните ${SAVE_BEFORE}.`;
      const paths = statusPaths(before);
      const missing = [LINKS, CHECK].filter((p) => !paths.includes(p));
      if (!missing.length) return true;
      return `В нём нет ${missing.map((p) => `\`${p}\``).join(' и ')}. Сохраните снимок, когда скрипт переименует \`findLinks\`, а Claude обновит \`src/check-links.js\`, — до отката.`;
    },
  },
  {
    text: '`.practice/b-4-after-rewind.txt` перечисляет `src/links.js` и больше ни одного файла из `src/` или `test/`',
    local: true,
    check(repo) {
      const after = repo.read('.practice/b-4-after-rewind.txt');
      if (after === null) return `Сразу после отката через Restore code выполните ${SAVE_AFTER}.`;
      const paths = statusPaths(after).filter(inScope);
      const others = paths.filter((p) => p !== LINKS);
      if (others.length) {
        const list = others.map((p) => `\`${p}\``).join(', ');
        return `${list}: ${others.length > 1 ? 'файлы всё ещё изменены' : 'файл всё ещё изменён'}. Выберите Restore code, затем выполните ${SAVE_AFTER}. Если правку сделала команда, выполните \`git restore src test\` и повторите «Вашу очередь» с шага 2.`;
      }
      if (!paths.includes(LINKS)) return `\`src/links.js\` не изменён, значит, переименования из скрипта больше нет. Если вы восстановили его сами, повторите шаг 2. Иначе Claude уже правил этот файл: выполните \`git restore src test\`, начните новую сессию и повторите шаг 2.`;
      return true;
    },
  },
  {
    text: 'в `src/` и `test/` нет незакоммиченных изменений, `src/links.js` в вашем последнем коммите по-прежнему экспортирует `findLinks`, а `npm run linkcheck -- samples` выполняется без ошибки',
    check(repo) {
      const entries = statusEntries(repo.git('status', '--porcelain', '--', 'src', 'test')).filter((e) => inScope(e.path));
      if (entries.length) {
        const left = entries.map((e) => e.path);
        const tracked = entries.filter((e) => e.xy !== '??').map((e) => e.path);
        const why = left.includes(LINKS) ? ' Скрипт переименования изменил `src/links.js` командой, а rewind не отменяет изменение, которое команда внесла в файл, не правленный Claude.' : '';
        const fix = tracked.length ? ` Верните изменённое командой \`git restore ${tracked.join(' ')}\`.` : '';
        const extra = tracked.length < left.length ? ' Удалите ненужные новые файлы.' : '';
        return `Всё ещё изменены: ${left.join(', ')}.${why}${fix}${extra}`;
      }
      // The rename is dropped in Your turn: another tool imports findLinks by name.
      if (!hasExport(repo.gitLocal('show', `HEAD:${LINKS}`), 'findLinks')) return '`src/links.js` в вашем последнем коммите больше не экспортирует `findLinks`. Отмените отброшенное переименование командой `git revert <sha>`; найти этот коммит поможет `git log`.';
      const run = spawnSync(process.execPath, [CLI, 'samples'], { cwd: repo.dir, encoding: 'utf8', timeout: LINKCHECK_LIMIT });
      if ([0, 1].includes(run.status) && /\d+ broken link\(s\)|All relative links resolve\./.test(run.stdout)) return true;
      return '`npm run linkcheck -- samples` останавливается с ошибкой. Запустите его, прочитайте ошибку и попросите Claude исправить закоммиченный код.';
    },
  },
];
