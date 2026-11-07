// Enforce a rule with a hook (Intermediate, lesson 5). The Learner registers
// the hooks guide's protect-files script as a PreToolUse hook for Edit and
// Write that fails closed ("onFailure": "block"), then writes a Stop hook, the
// test gate, that sends Claude back to work while the tests fail and lets it
// stop once they pass, or after one retry (stop_hook_active). The check runs
// the committed gate with the JSON a Stop event sends and a stand-in for the
// test command. On Stop, an exit 2 with nothing on stdout and stderr that says
// a file is missing is a non-blocking error (hooks reference, "Exit code
// output"), so the check also fails the tests with a missing-file error and
// wants the gate to keep that off its stderr, or print to stdout. Seeing the
// gate send Claude back in a session is self-checked.
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { committedMode, editWriteScripts, missingJq } from '../hooks.mjs';

export const title = 'Закрепляем правило с помощью hook';

const HOOK = '.claude/hooks/protect-files.sh';
const GATE = '.claude/hooks/test-gate.sh';
const SETTINGS = '.claude/settings.json';

// Test commands a gate may run by name. The check puts a stand-in for each on
// the PATH, so the gate's run passes or fails as each case needs. A stand-in
// prints to stdout, as most test runners do, so a reason on stderr is the
// gate's own; with `missingFile`, it fails with a missing-file error on
// stderr and nothing on stdout, as a test that reads a missing fixture may.
const TEST_COMMANDS = ['npm', 'npx', 'pnpm', 'yarn', 'bun', 'node', 'deno', 'pytest', 'python', 'python3', 'tox', 'uv', 'poetry', 'go', 'cargo', 'make', 'mvn', 'gradle', 'bundle', 'rake', 'rspec', 'dotnet', 'mix'];

function committedSettings(repo) {
  let text;
  try {
    text = repo.git('show', `HEAD:${SETTINGS}`);
  } catch {
    return { missing: true };
  }
  try {
    return { value: JSON.parse(text) };
  } catch (error) {
    return { error: error.message };
  }
}

function committedText(repo, path) {
  try {
    return repo.git('show', `HEAD:${path}`);
  } catch {
    return null;
  }
}

// Runs the committed gate once, as Claude Code would when Claude finishes
// responding, with the stand-in test commands passing or failing. Returns
// spawnSync's result and whether the gate ran a test command, or null when
// HEAD lacks the gate.
function runGateScript(repo, { testsPass, retried, missingFile = false }) {
  const text = committedText(repo, GATE);
  if (text === null) return null;
  const dir = mkdtempSync(join(tmpdir(), 'gate-'));
  try {
    const bin = join(dir, 'bin');
    const ran = join(dir, 'ran');
    mkdirSync(bin);
    for (const name of TEST_COMMANDS) {
      const output = missingFile ? 'echo "Error: ENOENT: no such file or directory, open \'test/fixture.md\'" >&2' : 'echo "a stand-in test run"';
      writeFileSync(join(bin, name), `#!/bin/sh\necho "$0" >> '${ran}'\n${output}\nexit ${testsPass ? 0 : 1}\n`);
      chmodSync(join(bin, name), 0o755);
    }
    const file = join(dir, 'test-gate.sh');
    writeFileSync(file, text);
    chmodSync(file, 0o755);
    const run = spawnSync('bash', [file], {
      cwd: repo.dir,
      env: { ...process.env, PATH: `${bin}${delimiter}${process.env.PATH}`, CLAUDE_PROJECT_DIR: repo.dir },
      input: JSON.stringify({ hook_event_name: 'Stop', stop_hook_active: retried, last_assistant_message: 'Done.' }),
      encoding: 'utf8',
      timeout: 20_000,
      maxBuffer: 1024 * 1024,
    });
    return { ...run, ranTests: existsSync(ran) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export const items = [
  {
    text: '`.claude/hooks/protect-files.sh` и `.claude/hooks/test-gate.sh` закоммичены и исполняемые',
    check(repo) {
      for (const path of [HOOK, GATE]) {
        const mode = committedMode(repo, path);
        if (mode === null) return repo.exists(path) ? `${path} не закоммичен. Выполните \`git add ${path}\` и закоммитьте.` : `Файла ${path} нет. Сохраните его, как показано в уроке, затем закоммитьте.`;
        if (mode !== '100755') return `${path} не исполняемый. Выполните \`chmod +x ${path}\`, затем добавьте его в индекс и закоммитьте.`;
      }
      return true;
    },
  },
  {
    text: 'закоммиченный `.claude/settings.json` запускает protect-files.sh как hook `PreToolUse` для Edit и Write с `"onFailure": "block"`',
    check(repo) {
      const { missing, error, value } = committedSettings(repo);
      if (missing) return `Закоммиченного ${SETTINGS} нет. Добавьте блок hooks из урока и закоммитьте его.`;
      if (error) return `Закоммиченный ${SETTINGS} — некорректный JSON: ${error}`;
      if (!editWriteScripts(value).includes(HOOK)) return `${SETTINGS} не запускает protect-files.sh как hook PreToolUse для Edit и Write. Используйте \`"matcher": "Edit|Write"\`.`;
      // The same scripts, counting only the hook entries that fail closed.
      const groups = value.hooks.PreToolUse.map((g) => ({ ...g, hooks: (g?.hooks ?? []).filter((h) => h?.onFailure === 'block') }));
      return editWriteScripts({ hooks: { PreToolUse: groups } }).includes(HOOK) ? true : 'Добавьте `"onFailure": "block"` в hook protect-files.sh, чтобы hook, который не смог запуститься или упал, блокировал правку, а не пропускал её.';
    },
  },
  {
    text: 'закоммиченный заслон тестов завершается с кодом 2 и причиной, пока тесты падают, и с кодом 0, когда они проходят или после одной повторной попытки',
    check(repo) {
      const failing = runGateScript(repo, { testsPass: false, retried: false });
      if (failing === null) return `Закоммитьте ${GATE}: проверка запускает закоммиченный заслон — тот, который получат ваши коллеги.`;
      if (failing.error) return `Заслон не удалось запустить: ${failing.error.message}`;
      if (missingJq(failing)) return 'Заслону нужен `jq`, а он не установлен. Установите его и запустите проверку снова.';
      if (!failing.ranTests) return 'Заслон не запустил ни одной команды тестов, которую проверка может подменить. Запускайте команду тестов по имени, например `npm test` или `pytest`.';
      if (failing.status !== 2) return `Пока тесты падают, заслон завершается с кодом ${failing.status}, и Claude всё равно останавливается. Завершайтесь с кодом 2, если команда тестов упала.`;
      if (!failing.stderr.trim()) return 'Заслон блокирует без причины в stderr. Выводите причину в stderr, чтобы Claude знал, что исправить.';
      const passing = runGateScript(repo, { testsPass: true, retried: false });
      if (passing.status !== 0) return `Когда тесты проходят, заслон завершается с кодом ${passing.status}. В этом случае завершайтесь с кодом 0, чтобы Claude мог остановиться.`;
      const retried = runGateScript(repo, { testsPass: false, retried: true });
      if (retried.status !== 0) return 'При `stop_hook_active`, равном true, заслон всё равно блокирует. В этом случае завершайтесь с кодом 0, чтобы сбой, который Claude не может исправить, не держал его в работе.';
      const missing = runGateScript(repo, { testsPass: false, retried: false, missingFile: true });
      if (missing.status !== 2) return `Пока тесты падают, заслон завершается с кодом ${missing.status}, и Claude всё равно останавливается. Завершайтесь с кодом 2, если команда тестов упала.`;
      if (!missing.stdout.trim() && /no such file or directory/i.test(missing.stderr)) return 'Ошибка падающего теста об отсутствующем файле попадает в stderr заслона, а в stdout пусто, поэтому Claude всё же может остановиться. Запускайте `npm test 2>&1` и выводите в stderr только свою причину.';
      return true;
    },
  },
  {
    text: 'закоммиченный `.claude/settings.json` запускает test-gate.sh как hook `Stop`',
    check(repo) {
      const { missing, error, value } = committedSettings(repo);
      if (missing) return `Закоммиченного ${SETTINGS} нет. Добавьте hook Stop из урока и закоммитьте его.`;
      if (error) return `Закоммиченный ${SETTINGS} — некорректный JSON: ${error}`;
      // A Stop hook takes no matcher: read its groups as matching every tool.
      const stop = Array.isArray(value?.hooks?.Stop) ? value.hooks.Stop.map((g) => ({ ...g, matcher: '' })) : [];
      return editWriteScripts({ hooks: { PreToolUse: stop } }).includes(GATE) ? true : `${SETTINGS} не запускает test-gate.sh как hook \`Stop\`. Добавьте его в \`hooks.Stop\`, как показано в уроке.`;
    },
  },
];
