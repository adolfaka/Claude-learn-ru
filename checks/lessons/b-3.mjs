// Your first change, from request to commit (Beginner, lesson 3). The check
// gathers its own evidence: it runs the practice app's link checker on
// Markdown it writes to a temporary folder, runs the Learner's tests against
// the planted patch's flaw, and reads the last commit and the working tree.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { stripVTControlCharacters } from 'node:util';
import { isTestFile } from '../paths.mjs';

export const title = 'Первое изменение: от запроса до коммита';

// The longest `npm test` may run, in milliseconds.
export const NPM_TEST_LIMIT = 120_000;

const npmTest = (dir) => spawnSync('npm', ['test', '--silent'], { cwd: dir, encoding: 'utf8', shell: process.platform === 'win32', timeout: NPM_TEST_LIMIT });

// A shell lookup or script failure is not evidence of a failing Node test.
// Mutation checks require its TAP/spec failure summary as well as an exit.
export function testRunError(run, { requireFailure = false } = {}) {
  const completed = !run.error && !run.signal && Number.isInteger(run.status) && run.status >= 0;
  if (completed) {
    if (!requireFailure || run.status === 0) return null;
    const output = stripVTControlCharacters(`${run.stdout ?? ''}\n${run.stderr ?? ''}`);
    if (/^[ \t]*(?:#|ℹ)[ \t]+fail[ \t]+[1-9]\d*[ \t\r]*$/m.test(output)) return null;
  }
  const reason = run.error?.code || run.signal || run.error?.message
    || (completed ? `код ${run.status}, но нет результата упавшего теста Node` : 'нет кода завершения');
  return `\`npm test\` не завершился (${reason}). Исправьте запуск тестов и повторите: это ещё не доказывает, что тест падает.`;
}

// Lesson 3 runs the template's own link checker and plants its patch there, so
// it can't check another repository.
function notTemplate(repo) {
  const missing = ['src/cli.js', 'src/links.js'].filter((path) => !repo.exists(path));
  return missing.length ? `В этой папке нет ${missing.map((p) => `\`${p}\``).join(' или ')}. Урок 3 запускает проверку ссылок из шаблона и разбирает патч в нём, поэтому проходите его в своей копии шаблона.` : null;
}

// Runs the repository's link checker on a folder holding `files`, and returns
// the targets it reports as broken, by line of doc.md.
function brokenIn(repo, files) {
  const dir = mkdtempSync(join(tmpdir(), 'b3-links-'));
  try {
    for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
    const run = spawnSync(process.execPath, [join(repo.dir, 'src', 'cli.js'), dir], { encoding: 'utf8', timeout: 30_000 });
    // Node also exits with 1 when the checker crashes, so a run counts only
    // when it ends with the checker's own summary line.
    const stdout = run.stdout ?? '';
    if (![0, 1].includes(run.status) || !/^(\d+ broken link\(s\)|All relative links resolve\.)$/m.test(stdout)) {
      const lines = (run.stderr ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
      const first = lines.find((l) => /^[A-Za-z]*Error\b/.test(l)) ?? lines[0];
      return { error: `\`node src/cli.js\` упал${first ? `: ${first}` : ` (код завершения ${run.status})`}. Запустите \`npm test\`, прочитайте первый сбой и попросите Claude исправить код.` };
    }
    const broken = new Map();
    for (const m of stdout.matchAll(/^doc\.md:(\d+): broken link to (.*)$/gm)) broken.set(Number(m[1]), m[2]);
    return { broken };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// Whether the last commit holds the patch's test: the Learner committed their
// fix, so a flaw that is still there gets a more specific hint.
function patchCommitted(repo) {
  try {
    repo.gitLocal('cat-file', '-e', 'HEAD:test/external.test.js');
    return true;
  } catch {
    return false;
  }
}

// isExternal as the patch practice/b-3/protocol-relative.patch writes it.
const PLANTED = `export * from './links.checked.js';
export function isExternal(target) {
  return target.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(target);
}
`;

export const testsPass = {
  text: 'тесты проходят',
  check(repo) {
    const pkg = repo.read('package.json');
    let hasScript = false;
    try { hasScript = Boolean(pkg && JSON.parse(pkg).scripts?.test); } catch { /* not JSON */ }
    if (hasScript) {
      const run = npmTest(repo.dir);
      const error = testRunError(run);
      return error ? `\`npm test\` завершается ошибкой. ${error}` : run.status === 0 ? true : '`npm test` завершается ошибкой. Запустите его, прочитайте первый сбой и попросите Claude исправить код, а не тест.';
    }
    const saved = repo.read('.practice/b-3-tests.txt');
    const save = '`<тесты>; echo $? > .practice/b-3-tests.txt` (Windows: в конце `$LASTEXITCODE > .practice/b-3-tests.txt`)';
    if (saved === null) return `Нет скрипта \`npm test\`. Сохраните код выхода: ${save}.`;
    const code = saved.trim();
    if (code === '0') return true;
    // In PowerShell, `$?` is True or False rather than an exit code.
    if (!/^-?\d+$/.test(code)) return `В \`.practice/b-3-tests.txt\` «${code}», а не код выхода. Сохраните заново: ${save}.`;
    return `Судя по \`.practice/b-3-tests.txt\`, тесты завершились с кодом ${code}, а не 0.`;
  },
};

export const nothingUncommitted = {
  text: 'не осталось незакоммиченных изменений',
  check(repo) {
    const status = repo.git('status', '--porcelain').split('\n').filter((l) => l && !l.slice(3).startsWith('.practice/'));
    // Plain `git stash` leaves new, untracked files behind.
    return status.length ? `Эти изменения не закоммичены: ${status.map((l) => l.slice(3)).join(', ')}. Закоммитьте их или отложите командой \`git stash push --include-untracked\`.` : true;
  },
};

export const items = [
  {
    text: 'ссылки с заголовком в двойных или одинарных кавычках проверяются',
    check(repo) {
      const other = notTemplate(repo);
      if (other) return other;
      const { broken, error } = brokenIn(repo, {
        'setup.md': '# Setup\n',
        'doc.md': '[setup](setup.md "Setup guide")\n[gone](gone.md "Old page")\n[old](old.md \'Old page\')\n',
      });
      if (error) return error;
      if (broken.has(1)) return `Инструмент считает \`[setup](setup.md "Setup guide")\` битой ссылкой на \`${broken.get(1)}\`, хотя setup.md есть. Попросите Claude убрать заголовок из адреса и добавить тест.`;
      const links = { 2: ['`[gone](gone.md "Old page")`', 'gone.md'], 3: ['`[old](old.md \'Old page\')`', 'old.md'] };
      const skipped = [2, 3].filter((line) => !broken.has(line)).map((line) => links[line][0]);
      if (skipped.length) return `Инструмент пропускает ${skipped.join(' и ')}. Закончите разбор: ссылки с заголовком в кавычках любого вида проверяются, с тестом на каждую.`;
      const wrong = [2, 3].filter((line) => broken.get(line) !== links[line][1]);
      return wrong.length ? `Инструмент читает адрес ${links[wrong[0]][0]} как \`${broken.get(wrong[0])}\`, а не \`${links[wrong[0]][1]}\`. Попросите Claude не включать заголовок в адрес и добавить на это тест.` : true;
    },
  },
  {
    text: 'ссылки относительно протокола, например `//cdn.example.com/app.js`, пропускаются, а все остальные ссылки проверяются, как раньше',
    check(repo) {
      const other = notTemplate(repo);
      if (other) return other;
      const { broken, error } = brokenIn(repo, { 'doc.md': '[app](//cdn.example.com/app.js)\n[root](/missing.md)\n[page](missing.md)\n' });
      if (error) return error;
      if (broken.has(1)) return '`//cdn.example.com/app.js` всё ещё битая. Выполните `git apply practice/b-3/protocol-relative.patch` и исправьте изъян («Ваша очередь», шаг 2).';
      const links = { 2: '`[root](/missing.md)`', 3: '`[page](missing.md)`' };
      const skipped = [2, 3].filter((line) => !broken.has(line));
      if (!skipped.length) return true;
      // Before the Learner commits a fix, the hint leaves finding the flaw to them.
      if (!patchCommitted(repo)) return 'Инструмент пропускает ссылку, которую описание патча считает проверяемой: изъян на месте. Сравните описание с новой строкой и скажите Claude («Ваша очередь», шаги 1 и 3).';
      return `Ваш коммит всё ещё пропускает ${skipped.map((line) => links[line]).join(' и ')}. Сверьтесь с описанием патча, исправьте правило, добавьте тест, падающий на патче, и закоммитьте оба.`;
    },
  },
  {
    text: 'ваши тесты ловят подложенный изъян: если вернуть `isExternal` из патча, они падают',
    check(repo) {
      const other = notTemplate(repo);
      if (other) return other;
      const dir = mkdtempSync(join(tmpdir(), 'b3-planted-'));
      try {
        cpSync(repo.dir, dir, { recursive: true, filter: (src) => !/[\\/](\.git|node_modules|\.practice)$/.test(src) });
        const before = npmTest(dir);
        const beforeError = testRunError(before);
        if (beforeError || before.status !== 0) return beforeError ?? 'Тесты падают уже сейчас. Сначала добейтесь, чтобы `npm test` проходил.';
        cpSync(join(dir, 'src', 'links.js'), join(dir, 'src', 'links.checked.js'));
        writeFileSync(join(dir, 'src', 'links.js'), PLANTED);
        const mutant = npmTest(dir);
        const mutantError = testRunError(mutant, { requireFailure: true });
        if (mutantError || mutant.status !== 0) return mutantError ?? true;
        if (!patchCommitted(repo)) return 'С `isExternal` из патча тесты по-прежнему проходят: изъян они не ловят. Найдя его («Ваша очередь», шаг 1), попросите Claude о тесте, падающем на версии из патча.';
        return 'С `isExternal` из патча тесты по-прежнему проходят: ни один не падает на ссылке, которую патч пропускает зря. Добавьте тест на неё и закоммитьте.';
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    },
  },
  {
    text: 'ваш последний коммит меняет тестовый файл и хотя бы один другой файл',
    check(repo) {
      try {
        repo.git('rev-parse', '--verify', '--quiet', 'HEAD^');
      } catch {
        return 'Вашего коммита пока нет. Когда исправление и его тест будут готовы, попросите Claude закоммитить их вместе.';
      }
      // A merge's combined diff can omit files changed by only one parent.
      const files = repo.git('diff', '--name-only', 'HEAD^', 'HEAD').split('\n').filter(Boolean);
      const tests = files.filter(isTestFile);
      if (!tests.length) return `Ваш последний коммит не меняет ни одного тестового файла (${files.join(', ') || 'файлов нет'}): ни один не лежит в папке test/ и не назван по образцу links.test.js. Добавьте тест, затем выполните \`git commit --amend\`.`;
      if (tests.length === files.length) return `Ваш последний коммит меняет только тесты (${files.join(', ')}). Если изменение кода в коммите перед ним, попросите Claude объединить два коммита в один.`;
      return true;
    },
  },
  testsPass,
  nothingUncommitted,
];
