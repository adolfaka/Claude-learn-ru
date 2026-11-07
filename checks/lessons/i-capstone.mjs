// The Intermediate capstone: get the practice repository ready for a new
// teammate, as capstone/intermediate-brief.md asks. The brief states needs,
// not mechanisms, so the check verifies outcomes and accepts any sound way to
// reach them: samples/ is protected by a committed Edit deny rule or by a
// PreToolUse hook that fails closed. It checks what each Intermediate Exit
// statement leaves in files and git, and the delegation log of the review the
// bug fix gets; picking a model and effort, and seeing each piece work in a
// session, are self-assessed on the capstone page.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { frontmatter } from '../frontmatter.mjs';
import { committedMode, editWriteScripts, missingJq, runCommitted } from '../hooks.mjs';
import { items as memory } from './i-2.mjs';
import { items as scopes } from './i-4.mjs';
import { items as mcp } from './i-7.mjs';
import { items as plugins } from './i-8.mjs';
import { testsPass, nothingUncommitted } from './b-3.mjs';

export const title = 'Итоговый проект среднего уровня';

// Tools that only read code, as lesson 6 narrows them.
const READ_ONLY = new Set(['Read', 'Grep', 'Glob', 'LSP']);
const list = (value) => (Array.isArray(value) ? value : String(value ?? '').split(',')).map((t) => t.trim()).filter(Boolean);

function committedFiles(repo, dir, suffix) {
  try {
    return repo.git('ls-tree', '-r', '--name-only', 'HEAD', '--', dir).split('\n').filter((f) => f.endsWith(suffix));
  } catch {
    return [];
  }
}

function committedFile(repo, path) {
  try {
    return frontmatter(repo.git('show', `HEAD:${path}`));
  } catch {
    return null;
  }
}

const words = (text) => String(text ?? '').split(/\s+/).filter((w) => w && w !== 'TODO').length;

// The brief's skill runs the link checker: `npm run linkcheck` or src/cli.js.
const LINKCHECK = /npm run linkcheck|src\/cli\.js/;

const skill = {
  text: 'закоммиченный skill проекта запускает проверку ссылок, вызывается по имени и может загружаться сам',
  check(repo) {
    const ok = committedFiles(repo, '.claude/skills', '/SKILL.md').some((path) => {
      const file = committedFile(repo, path);
      const f = file?.fields;
      return f && LINKCHECK.test(file.body) && words(f.description) >= 8 && String(f['disable-model-invocation']) !== 'true' && String(f['user-invocable']) !== 'false';
    });
    return ok ? true : 'Закоммитьте skill в `.claude/skills/<name>/SKILL.md`, текст которого запускает проверку ссылок (`npm run linkcheck -- <folder>`), с описанием того, что он делает и когда его использовать, и без `disable-model-invocation: true` (урок 1).';
  },
};

// The names of the committed subagents that review changes with tools that
// only read code.
function reviewers(repo) {
  return committedFiles(repo, '.claude/agents', '.md').flatMap((path) => {
    const f = committedFile(repo, path)?.fields;
    const tools = list(f?.tools);
    return f?.name && /review/i.test(`${f.name} ${f.description}`) && words(f.description) >= 5 && tools.length && tools.every((t) => READ_ONLY.has(t)) ? [String(f.name)] : [];
  });
}

const reviewer = {
  text: 'закоммиченный субагент-ревьюер, у которого есть только инструменты для чтения кода',
  check(repo) {
    return reviewers(repo).length ? true : 'Закоммитьте ревьюера в `.claude/agents/`: субагента, в имени или описании которого сказано, что он проверяет изменения, со списком `tools` только из инструментов для чтения кода, например `Read, Grep, Glob`, как в уроке 6.';
  },
};

// The review the bug fix gets, logged by the capstone's copy of lesson 6's
// SubagentStart hook.
const delegated = {
  text: '`.practice/i-capstone-agents.txt` показывает, что Claude передал работу закоммиченному ревьюеру',
  local: true,
  check(repo) {
    const log = repo.read('.practice/i-capstone-agents.txt');
    if (log === null) return 'Журнала делегирования нет. Запустите сессию командой `claude --settings .practice/i-capstone-hook.json` (файл hook из итогового проекта) и поручите своему ревьюеру проверить исправление.';
    const ran = log.split(/\r?\n/).map((l) => l.trim());
    return reviewers(repo).some((name) => ran.includes(name)) ? true : 'В журнале нет ни одного закоммиченного ревьюера. В сессии, запущенной с файлом hook, попросите Claude поручить своему ревьюеру проверить исправление.';
  },
};

function committedSettings(repo) {
  try {
    return JSON.parse(repo.git('show', 'HEAD:.claude/settings.json'));
  } catch {
    return null;
  }
}

// A deny rule for Claude's file-editing tools on the samples/ folder, written
// as lesson 4 writes rules: relative, anchored at the settings source, or at
// any depth.
const SAMPLES_DENY = /^Edit\((?:\.\/|\/|\*\*\/)?samples\/(?:\*\*)?\)$/;

const hook = {
  text: 'инструменты Claude для правки файлов не могут менять `samples/`, но могут править остальное: закоммиченное правило deny для `Edit` или hook `PreToolUse`, который при сбое блокирует правку',
  check(repo) {
    const settings = committedSettings(repo);
    if ((settings?.permissions?.deny ?? []).some((rule) => SAMPLES_DENY.test(rule))) return true;
    const scripts = editWriteScripts(settings).filter((s) => committedMode(repo, s) === '100755');
    if (!scripts.length) return 'Не пускайте Claude в samples/: закоммитьте правило deny для `Edit`, например `Edit(./samples/**)`, в `.claude/settings.json`, как в уроке 4, или исполняемый hook `PreToolUse` для `Edit|Write`, как в уроке 5.';
    const samples = scripts.map((s) => runCommitted(repo, s, 'samples/guide.md'));
    const source = scripts.flatMap((s) => [runCommitted(repo, s, 'src/cli.js'), runCommitted(repo, s, 'src/samples.js')]);
    if ([...samples, ...source].some(missingJq)) return 'Hook нужен `jq`, а он не установлен. Установите его и запустите проверку снова.';
    const blocking = scripts.filter((_, i) => samples[i]?.status === 2);
    if (!blocking.length) return 'Ни один hook Edit|Write не завершается с кодом 2 для `samples/guide.md`, поэтому Claude всё ещё может править samples/.';
    if (!source.every((r) => r?.status === 0)) return 'Hook Edit|Write блокирует ещё и `src/cli.js` или `src/samples.js`: блокируйте только папку samples/.';
    // The same scripts, counting only the hook entries that fail closed.
    const groups = settings.hooks.PreToolUse.map((g) => ({ ...g, hooks: (g?.hooks ?? []).filter((h) => h?.onFailure === 'block') }));
    const closed = editWriteScripts({ hooks: { PreToolUse: groups } });
    return blocking.some((s) => closed.includes(s)) ? true : 'Добавьте `"onFailure": "block"` в hook, который защищает samples/, как в уроке 5, чтобы hook, который не смог запуститься, блокировал правку, а не пропускал её.';
  },
};

// The brief puts the sandbox in the team's committed settings.
const sandbox = {
  text: 'закоммиченный `.claude/settings.json` включает песочницу, а `.claude/settings.local.json` не попадает в git',
  check(repo) {
    if (repo.git('ls-files', '--', '.claude/settings.local.json')) return '.claude/settings.local.json закоммичен, но в нём ваши личные настройки. Выполните `git rm --cached .claude/settings.local.json`, закоммитьте и добавьте файл в `.gitignore`.';
    return committedSettings(repo)?.sandbox?.enabled === true ? true : 'Закоммиченный .claude/settings.json не включает песочницу. Добавьте в него `"sandbox": {"enabled": true}` и закоммитьте: `/sandbox` сохраняет настройку в ваш локальный файл, которого у коллег нет.';
  },
};

// Run the committed CLI in a disposable local copy. A working-tree-only fix
// must not satisfy the handoff that the teammate receives from git.
const bugFix = {
  text: 'закоммиченный CLI сообщает о неверных percent-последовательностях как о битых ссылках и по-прежнему находит корректно закодированные пути',
  check(repo) {
    let sources;
    try {
      const paths = repo.gitLocal('ls-tree', '-r', '--name-only', 'HEAD', '--', 'src').split('\n').filter(path => path.endsWith('.js'));
      if (!paths.includes('src/cli.js')) throw new Error('missing CLI');
      sources = paths.map(path => [path, repo.gitLocal('show', `HEAD:${path}`)]);
    } catch {
      return 'Закоммитьте исходный код CLI с исправлением неверных percent-последовательностей. См. capstone/intermediate-bug.md.';
    }
    const dir = mkdtempSync(join(tmpdir(), 'intermediate-bug-'));
    try {
      writeFileSync(join(dir, 'package.json'), '{"type":"module"}\n');
      for (const [path, text] of sources) {
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), text);
      }
      const fixture = join(dir, 'fixture');
      mkdirSync(fixture);
      writeFileSync(join(fixture, 'existing file.md'), '# Existing\n');
      const cases = [
        { markdown: '[bad](bad%.md)\n[valid](existing%20file.md)\n[bad UTF-8](bad%E0.md)\n[later](missing.md)\n', status: 1, targets: ['bad%.md', 'bad%E0.md', 'missing.md'] },
        { markdown: '[valid](existing%20file.md)\n', status: 0, targets: [] },
      ];
      for (const example of cases) {
        writeFileSync(join(fixture, 'guide.md'), example.markdown);
        const run = spawnSync(process.execPath, [join(dir, 'src', 'cli.js'), fixture], { cwd: dir, encoding: 'utf8', timeout: 5_000, maxBuffer: 128 * 1024 });
        if (run.error) return `Закоммиченный CLI не смог отработать (${run.error.code}). Исправьте случай с неверной percent-последовательностью так, чтобы программа не зависала.`;
        const report = run.stdout.split(/\r?\n/).filter(line => line.includes(': broken link to '));
        if (run.status !== example.status || run.stderr.trim() || report.length !== example.targets.length ||
          !example.targets.every(target => report.some(line => line.endsWith(`: broken link to ${target}`)))) {
          return 'Закоммиченный CLI неправильно обрабатывает ссылки с неверными percent-последовательностями или корректно закодированные пути. Перечитайте capstone/intermediate-bug.md.';
        }
      }
      return true;
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  },
};

// An item reused from a lesson sends the learner back to that lesson's page
// when its file is missing or lacks what the lesson adds; here the capstone
// asks for it. Each swap is a [from, to] pair of message text. The wrapper
// shows the reused check's source, so the tests that read a check's code
// (its ways to fail, and whether it starts a process) still read that check.
function asCapstone(item, ...swaps) {
  const check = (repo) => {
    const outcome = item.check(repo);
    return typeof outcome === 'string' ? swaps.reduce((text, [from, to]) => text.replace(from, to), outcome) : outcome;
  };
  check.toString = () => item.check.toString();
  return { ...item, check };
}

const pinnedServer = asCapstone(mcp[0],
  ['Сохраните туда заготовку из раздела «Ваша очередь» урока.', 'Напишите туда тот, о котором просит итоговый проект, как в уроке 7.'],
  ['Добавьте его в `mcpServers`, как в уроке.', 'Добавьте его в `mcpServers`, как в уроке 7.']);
const setupPlugin = asCapstone(plugins[0], ['Добавьте запись `enabledPlugins` из урока и закоммитьте.', 'Добавьте запись `enabledPlugins`, о которой просит итоговый проект, и закоммитьте, как в уроке 8.']);
const teamRules = asCapstone(scopes[0], ['Сохраните туда заготовку файла из раздела «Ваша очередь».', 'Напишите туда настройки команды, о которых просит итоговый проект, как в уроке 4.']);
const imports = asCapstone(memory[0], ['Закоммитьте тот, который вы приводите в порядок в этом уроке.', 'Закоммитьте тот, о котором просит итоговый проект, как в уроке 2.']);

// The items that start a process keep their places, 1, 9 and 11, which the
// app's list of slow items names.
export const items = [skill, hook, reviewer, pinnedServer, setupPlugin, teamRules, sandbox, imports, memory[1], testsPass, nothingUncommitted, bugFix, delegated, scopes[2]];
