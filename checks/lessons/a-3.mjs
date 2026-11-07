// Run and save a dynamic workflow (Advanced, lesson 3). In the Worked
// example the Learner migrates one folder in a single session gated by a
// `/goal` condition, saving the old form's `git grep -E` pattern in
// .practice/a-3-pattern.txt; the history then shows a folder where the
// pattern matched before and matches nothing at HEAD. In Your turn they have
// Claude write an audit workflow whose findings a second agent checks, save
// the run from /workflows as a project command in .claude/workflows/, have
// it read a folder from `args`, commit it and run it on a second folder.
// What each run found and what the Learner read in the script before
// approving it, the lesson self-checks: the check reads no report Claude
// wrote. The Advanced capstone reuses the script item with its own options.
import { posix } from 'node:path';
import { findWorkflows, readWorkflow, STAGES, tokenize } from '../workflow-script.mjs';

export const title = 'Запуск и сохранение динамического workflow';

const PATTERN = '.practice/a-3-pattern.txt';

const and = (list) => (list.length > 1 ? `${list.slice(0, -1).join(', ')} и ${list.at(-1)}` : list[0]);
const code = (text) => `\`${text}\``;
const shell = (path) => (/\s/.test(path) ? `"${path}"` : path);
const SAVE = 'Когда запуск workflow завершится, выполните `/workflows`, выберите запуск, нажмите `s`, оставьте расположение проекта, `.claude/workflows/`, и нажмите `Enter`. Затем закоммитьте сохранённый файл `.js`.';

// Where a misplaced script should go: a .js file directly in the
// .claude/workflows/ folder it sits under.
function placed(path) {
  const at = path.lastIndexOf('.claude/workflows/') + '.claude/workflows/'.length;
  return `${path.slice(0, at)}${posix.basename(path).replace(/\.[^.]+$/, '')}.js`;
}

function scriptHint({ path, result, changed }) {
  const p = code(path);
  const hint = {
    first: () => `${p} не начинается с \`export const meta\`${result.found ? `: его код начинается с ${code(result.found)}` : ''}. Claude Code нужен \`export const meta = { ... }\` первой инструкцией скрипта. Перенесите его наверх (комментарии могут остаться над ним) и закоммитьте.`,
    literal: () => `Строка ${result.line} в ${p}: \`meta\` содержит ${result.what}. Если в \`meta\` есть что-то кроме литеральных значений, Claude Code убирает \`/<name>\` из автодополнения. Запишите значения явно и закоммитьте.`,
    fields: () => `В \`meta\` в ${p} ${result.missing.length > 1 ? 'нужны' : 'нужна'} ${result.missing.map((f) => `непустая строка \`${f}\``).join(' и ')}. Добавьте ${result.missing.length > 1 ? 'их' : 'её'} и закоммитьте.`,
    compile: () => `${p} не компилируется${result.line ? ` (строка ${result.line})` : ''}: ${result.message}. Исправьте его сами или попросите Claude и закоммитьте.`,
    args: () => {
      const why = result.declared
        ? `Строка ${result.declared} в ${p} объявляет собственную переменную \`args\`, она скрывает входные данные workflow.`
        : result.mentioned
          ? `${p} упоминает \`args\` только в комментарии, строке или имени свойства, поэтому не читает входные данные.`
          : `${p} нигде не читает \`args\`, поэтому не может получить папку на вход.`;
      return `${why} Выполните \`/workflow-authoring\`, попросите Claude брать папку из \`args\`, затем \`/reload-skills\` и закоммитьте.`;
    },
    agent: () => `${p} нигде не вызывает \`agent()\`, поэтому не запускает ни одного субагента. Попросите Claude снова написать workflow для этой задачи, сохраните запуск из \`/workflows\` и закоммитьте.`,
    check: () => `${p} вызывает \`agent()\` только один раз, поэтому второй агент ничего не проверяет. Выполните \`/workflow-authoring\`, попросите Claude поручить второму агенту проверять каждую находку, и закоммитьте.`,
  }[result.problem]();
  const pending = changed ? ` В вашей копии ${p} есть незакоммиченные изменения: если они это исправляют, закоммитьте их.` : '';
  return `${hint}${pending}`;
}

function uncommittedHint({ path, rule }) {
  if (!rule) return `${code(path)} не закоммичен. Выполните \`git add ${shell(path)}\` и закоммитьте.`;
  return `${code(path)} не закоммичен, а строка ${rule.line} в ${code(rule.source)}, ${code(rule.pattern)}, его игнорирует. Выполните \`git add -f ${shell(path)}\` и закоммитьте.`;
}

// The places a script calls `agent(...)`: the name read as a value and
// called, not a method, a declaration or a word in a comment or a string.
function agentCalls(text) {
  const tokens = tokenize(text.replace(/^\uFEFF/, ''));
  return tokens.filter((t, k) => t.type === 'name' && t.value === 'agent' && tokens[k + 1]?.value === '('
    && !['.', '?.'].includes(tokens[k - 1]?.value) && !['function', 'async', 'const', 'let', 'var'].includes(tokens[k - 1]?.value)).length;
}

// The stage a script got to, past readWorkflow's: `check` comes after them.
const RANKS = [...STAGES, 'check'];

// One script read the way the item wants it: readWorkflow's result, or a
// `check` problem when `needCheck` asks for a second agent() call.
function readScript(text, options) {
  const result = readWorkflow(text, options);
  if (result.ok && options.needCheck && agentCalls(text) < 2) return { problem: 'check' };
  return result;
}

// The script item. Options as readWorkflow takes them: `needArgs`, the script
// reads its input from `args`; `needAgentCall`, it starts subagents; and
// `needCheck`, it calls `agent()` at least twice, so a second agent can check
// what the first finds.
export function savedWorkflow(options = {}) {
  const needs = [options.needArgs && 'читает входные данные из `args`', options.needCheck ? 'вызывает `agent()` как минимум дважды' : options.needAgentCall && 'запускает субагентов через `agent()`'].filter(Boolean);
  return {
    text: `закоммиченный скрипт в \`.claude/workflows/\` первой инструкцией содержит литеральный \`export const meta\` с \`name\` и \`description\`${needs.length ? `; скрипт ${and(needs)}` : ''}`,
    check(repo) {
      const { scripts, misplaced, uncommitted } = findWorkflows(repo);
      const results = scripts.map((s) => ({ ...s, result: readScript(s.text, options) }));
      if (results.some((r) => r.result.ok)) return true;
      if (results.length) {
        const rank = (r) => RANKS.indexOf(r.result.problem);
        const other = uncommitted.length ? ` Кроме того, ${uncommittedHint(uncommitted[0])}` : '';
        return `${scriptHint(results.reduce((best, r) => (rank(r) > rank(best) ? r : best)))}${other}`;
      }
      if (misplaced.length) {
        const [path] = misplaced;
        return `${code(path)} лежит в \`.claude/workflows/\`, но проверка читает только \`.js\`-файлы прямо в этой папке, куда их сохраняет \`/workflows\`. Перенесите его в ${code(placed(path))} и закоммитьте.`;
      }
      if (uncommitted.length) return uncommittedHint(uncommitted[0]);
      return `Нет ни одного скрипта workflow в \`.claude/workflows/\`. ${SAVE}`;
    },
  };
}

// The pattern's first non-blank line, without the backticks or quotes a
// Learner may have kept around it.
function readPattern(repo) {
  const text = repo.read(PATTERN);
  if (text === null) return { missing: true };
  const line = text.split(/\r?\n/).find((l) => l.trim())?.trim() ?? '';
  const quoted = line.match(/^(`|'|")(.+)\1$/);
  return { pattern: quoted ? quoted[2] : line };
}

// Whether `git grep -E` finds the pattern in `folder` at the trees `revs`, or
// in the working tree's tracked files when `revs` is empty: true, false, or
// git's own error for a pattern it can't read.
function grep(repo, pattern, folder, revs = []) {
  try {
    repo.gitLocal('grep', '-q', '-E', '-e', pattern, ...revs, '--', folder);
    return true;
  } catch (error) {
    if (error.status === 1) return false;
    return { error: `${error.stderr ?? error.message}`.trim().split('\n')[0] };
  }
}

// The recent commits whose trees the check searches for the old form.
function recentCommits(repo) {
  try {
    return repo.gitLocal('rev-list', '--max-count=60', 'HEAD').split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// The practice copy's course code, which is not the Learner's migration.
const COURSE = new Set(['learn', 'checks', 'capstone']);

// The folders where the pattern matched in a recent commit, each the folder
// that held a matching file ('.' for the repository's root), leaving out the
// course's own folders.
function matchedFolders(repo, pattern, revs) {
  if (!revs.length) return [];
  let out = '';
  try {
    out = repo.gitLocal('grep', '-l', '-E', '-e', pattern, ...revs, '--');
  } catch (error) {
    if (error.status !== 1) throw error;
  }
  const folders = new Set();
  for (const line of out.split('\n').filter(Boolean)) {
    const path = line.slice(line.indexOf(':') + 1);
    if (COURSE.has(path.split('/')[0])) continue;
    folders.add(posix.dirname(path));
  }
  return [...folders].sort();
}

export const migratedFolder = {
  text: `шаблон \`git grep -E\` из \`${PATTERN}\` находил совпадения в папке в более раннем коммите и ничего не находит в этой папке в \`HEAD\``,
  local: true,
  check(repo) {
    const { missing, pattern } = readPattern(repo);
    if (missing) return `Файла ${code(PATTERN)} нет. Сохраните в нём одной строкой шаблон \`git grep -E\`, который находит старую форму, например \`import\\.meta\\.url\`.`;
    if (!pattern) return `${code(PATTERN)} пуст. Сохраните в нём одной строкой шаблон \`git grep -E\`, который находит старую форму.`;
    const shown = code(pattern);
    const now = grep(repo, pattern, '.', ['HEAD']);
    if (now?.error) return `git не может использовать шаблон из ${code(PATTERN)}, ${shown}: ${now.error}. Проверьте: \`git grep -n -E '<pattern>' -- <folder>\`.`;
    const folders = matchedFolders(repo, pattern, recentCommits(repo));
    if (!folders.length) return `${shown} не находит ничего в недавних коммитах этого репозитория, поэтому проверка не видит миграции. Проверьте шаблон на коммите до миграции: \`git grep -n -E '<pattern>' <commit> -- <folder>\`.`;
    if (folders.some((folder) => grep(repo, pattern, folder, ['HEAD']) === false)) return true;
    const where = (folder) => (folder === '.' ? 'вашем репозитории' : `папке ${code(`${folder}/`)}`);
    const clean = folders.find((folder) => grep(repo, pattern, folder) === false);
    if (clean) return `В рабочем дереве в ${where(clean)} миграция уже сделана, но в \`HEAD\` ${shown} там всё ещё находит совпадения. Просмотрите изменения и закоммитьте их.`;
    const named = folders.slice(0, 3).map(where);
    const more = folders.length > 3 ? ` и ещё ${folders.length - 3}` : '';
    return `В \`HEAD\` ${shown} всё ещё находит совпадения в ${and(named)}${more} — в каждой папке, где они когда-либо были: \`git grep -n -E '${pattern}'\` покажет их. Снова задайте цель для переводимой папки и закоммитьте.`;
  },
};

export const items = [savedWorkflow({ needArgs: true, needAgentCall: true, needCheck: true }), migratedFolder];
