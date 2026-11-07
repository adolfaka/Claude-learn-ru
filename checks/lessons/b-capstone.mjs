// The Beginner capstone: fix the bug in capstone/beginner-bug.md from plan to
// commit. It checks the parts of the Beginner Exit statements B2, B3 and B5
// that a script can see in files and git: the plan came before any edit, the
// commit stays inside the plan and carries a test that fails without the fix,
// and the tool does what the bug report asks. The rest, B1, B4 and the
// new-session half of B5 included, is self-assessed on the capstone page.
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { NPM_TEST_LIMIT, testRunError, testsPass, nothingUncommitted } from './b-3.mjs';
import { isTestFile, planPaths, statusPaths } from '../paths.mjs';

export const title = 'Итоговый проект начального уровня';

const lines = (text) => (text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const SAVE_COMMIT = '`git rev-parse HEAD > .practice/capstone-commit.txt`';
const AMEND = `выполните \`git commit --amend\` и снова ${SAVE_COMMIT}`;
// A test committed after its fix: the saved commit holds no fix to test.
const ONLY_TESTS = `Коммит меняет только тесты. Объедините его с исправлением перед ним, если ещё не отправляли их, или дополните его исправлением через \`git commit --amend\`. Затем снова выполните ${SAVE_COMMIT}.`;

// The commit the Learner saved and the files it changes, or what to fix.
function savedCommit(repo) {
  const sha = lines(repo.read('.practice/capstone-commit.txt'))[0];
  if (!sha) return { error: `Закоммитив исправление, выполните ${SAVE_COMMIT}.` };
  try {
    return { sha, files: repo.git('show', '--name-only', '--format=', sha).split('\n').filter(Boolean) };
  } catch {
    return { error: `В \`.practice/capstone-commit.txt\` указан ${sha}, но это не коммит этого репозитория.` };
  }
}

const git = (cwd, ...args) => spawnSync('git', ['-c', 'advice.detachedHead=false', ...args], { cwd, encoding: 'utf8' });

// Runs `npm test` on the saved commit with every file it changes, except its
// tests, put back as it was in the commit before it. In a scratch clone, so
// the Learner's working tree and branches stay as they are.
function testsWithoutFix(repo, sha, files) {
  const dir = mkdtempSync(join(tmpdir(), 'capstone-before-fix-'));
  try {
    if (git(tmpdir(), 'clone', '--quiet', '--shared', '--no-checkout', repo.dir, dir).status !== 0) return { error: 'Проверка не смогла скопировать этот репозиторий, чтобы запустить тесты без исправления.' };
    if (git(dir, 'checkout', '--quiet', sha).status !== 0) return { error: `Проверка не смогла переключиться на ${sha}, чтобы запустить тесты без исправления.` };
    if (git(dir, 'rev-parse', '--verify', '--quiet', `${sha}^`).status !== 0) return { error: `${sha} — первый коммит в этом репозитории, поэтому кода до исправления, на котором можно запустить тесты, нет.` };
    for (const file of files.filter((f) => !isTestFile(f))) {
      const before = git(dir, 'cat-file', '-e', `${sha}^:${file}`).status === 0;
      if (before) git(dir, 'checkout', '--quiet', `${sha}^`, '--', file);
      else rmSync(join(dir, file), { force: true });
    }
    const run = spawnSync('npm', ['test', '--silent'], { cwd: dir, encoding: 'utf8', shell: process.platform === 'win32', timeout: NPM_TEST_LIMIT });
    const error = testRunError(run, { requireFailure: true });
    return error ? { error } : { passed: run.status === 0 };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export const items = [
  {
    text: '`.practice/capstone-before.txt`, сохранённый, пока план был на экране, не содержит изменённых файлов',
    local: true,
    check(repo) {
      const before = repo.read('.practice/capstone-before.txt');
      if (before === null) return 'Пока план на экране, выполните `git status --porcelain > .practice/capstone-before.txt`.';
      const changed = statusPaths(before);
      return changed.length ? `Файлы изменились ещё до того, как вы одобрили план: ${changed.join(', ')}. Закоммитьте их или отложите в stash, затем снова сохраните снимок в plan mode.` : true;
    },
  },
  {
    text: 'коммит из `.practice/capstone-commit.txt` меняет только файлы, перечисленные в `.practice/capstone-plan.txt`, включая тест',
    local: true,
    check(repo) {
      const plan = planPaths(repo.read('.practice/capstone-plan.txt'), repo.dir);
      if (!plan.size) return 'Перед одобрением сохраните в `.practice/capstone-plan.txt` файлы, которые изменит план, по одному в строке.';
      const { files, error } = savedCommit(repo);
      if (error) return error;
      const extra = files.filter((f) => !plan.has(f));
      if (extra.length) return `Коммит меняет файлы, которых не было в плане: ${extra.join(', ')}. Если план их называл, добавьте их в \`.practice/capstone-plan.txt\`; если нет, уберите их из коммита. Снова сохраните SHA (шаг 8 задания).`;
      if (!files.some(isTestFile)) return `Коммит не меняет ни одного тестового файла. Тест должен быть в том же коммите, что и исправление: попросите Claude добавить его, затем ${AMEND}.`;
      return files.every(isTestFile) ? ONLY_TESTS : true;
    },
  },
  {
    text: 'тест из коммита падает без исправления: если остальные изменённые коммитом файлы вернуть к прежнему виду, `npm test` падает',
    local: true,
    check(repo) {
      const { sha, files, error } = savedCommit(repo);
      if (error) return error;
      if (!files.some(isTestFile)) return `Коммит не меняет ни одного тестового файла, поэтому без исправления запускать нечего. Попросите Claude добавить тест в коммит с исправлением, затем ${AMEND}.`;
      if (files.every(isTestFile)) return ONLY_TESTS;
      const result = testsWithoutFix(repo, sha, files);
      if (result.error) return result.error;
      return result.passed ? `Без исправления \`npm test\` всё равно проходит, значит, новый тест не ловит ошибку. Добавьте регрессионный тест, который падает на старом коде, дополните коммит с исправлением и снова выполните ${SAVE_COMMIT}.` : true;
    },
  },
  {
    text: 'ошибка из отчёта исправлена: отсутствующая папка в `linkcheck.json` заставляет инструмент завершиться с кодом 2 и назвать папку',
    check(repo) {
      const dir = mkdtempSync(join(tmpdir(), 'linkcheck-'));
      try {
        writeFileSync(join(dir, 'linkcheck.json'), '{ "files": ["docs"] }\n');
        const run = spawnSync(process.execPath, [join(repo.dir, 'src', 'cli.js'), dir], { encoding: 'utf8', timeout: 30_000 });
        if (run.status !== 2) return `Инструмент завершился с кодом ${run.status}, а не 2. Перечитайте capstone/beginner-bug.md.`;
        // The scratch folder's own path may hold any word, so it doesn't count.
        const said = `${run.stderr}\n${run.stdout}`.split(dir).join('');
        return /\bdocs\b/.test(said) ? true : `Инструмент завершается с кодом 2, но его ошибка не называет отсутствующую папку \`docs\`. Исправьте это в рамках плана, дополните коммит и снова выполните ${SAVE_COMMIT}.`;
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  },
  testsPass,
  {
    text: 'закоммиченный CLAUDE.md называет команду тестов, `npm test`',
    check(repo) {
      for (const path of ['CLAUDE.md', '.claude/CLAUDE.md']) {
        try {
          return repo.git('show', `HEAD:${path}`).includes('npm test') ? true : 'Закоммиченный CLAUDE.md не упоминает `npm test`. Добавьте команду тестов и закоммитьте.';
        } catch { /* not committed at this path */ }
      }
      return 'Закоммиченного CLAUDE.md нет. Выполните `/init` в сессии, проверьте файл и закоммитьте его.';
    },
  },
  nothingUncommitted,
];
