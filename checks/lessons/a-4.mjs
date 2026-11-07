// Script Claude Code with `claude -p` (Advanced, lesson 4). The Learner
// commits scripts/review-staged.sh, which pipes the staged diff into one
// `claude -p` call that asks for JSON, runs in dontAsk mode, pre-approves
// only Read, Grep and Glob, restricts the tools to those three with
// --tools, turns hooks off with --settings '{"disableAllHooks": true}',
// starts no MCP server with --strict-mcp-config and caps its turns (a
// tool --allowedTools doesn't name still runs when a project rule approves
// it, and a project's Stop hook can send the run back to work); saves the
// JSON to the path in
// its first argument, or .practice/a-4-result.json without one; prints the
// review; and exits non-zero when the run fails or nothing is staged. The
// check runs the committed script with a stand-in for `claude`, so it
// spends no usage, and reads the result of one real run the Learner saved.
// Seeing a run stop at the turn cap is self-checked. The Advanced capstone
// reuses these items with its own result file.
import { randomBytes } from 'node:crypto';
import { join, posix } from 'node:path';
import { parseClaudeArgs, ruleList } from '../claude-args.mjs';
import { committedMode, missingJq } from '../hooks.mjs';
import { notRun, runStubbed, stderrTail, STUB_SESSION, TIME_LIMIT } from '../stub-claude.mjs';
import { pl } from '../../learn/lib/copy.mjs';

export const title = 'Скрипты с Claude Code: `claude -p`';

export const SCRIPT = 'scripts/review-staged.sh';
export const RESULT = '.practice/a-4-result.json';
export const CAP_MAX = 10;

const JQ = 'Скрипту нужен `jq`, но он не установлен. Установите его и снова запустите проверку.';
const OUT = 'review.json';
const READ_ONLY = /^(Read|Grep|Glob)(\(.*\))?$/s;
const TOOL_NAME = /^(?:[A-Z]\w*|mcp__\S+|\*)(\(.*\))?$/s;

const and = (list) => (list.length > 1 ? `${list.slice(0, -1).join(', ')} и ${list.at(-1)}` : list[0]);
const code = (text) => `\`${text}\``;
const quoted = (text) => (text.length > 120 ? `${text.slice(0, 120)}...` : text).replace(/\s+/g, ' ').trim();

// What the scratch repository holds, and what the stand-in answers, in each
// run: a review of a staged change; the same without an argument, in a
// repository without `.practice/`, as a fresh copy is; `claude`
// exiting non-zero with an error on stderr and no JSON, as it does for a
// flag it can't read; JSON that says the run failed while `claude` exits 0;
// and nothing staged. The two failures test the script's two exit rules
// apart. Every run but the last has a staged change, and every run a change
// that isn't staged.
const SCENARIOS = {
  review: { stage: true, args: (out) => [join(out, OUT)], reply: (m) => ({ subtype: 'success', is_error: false, result: m.review, num_turns: 1 }) },
  noArgument: { stage: true, practice: false, args: () => [], reply: (m) => ({ subtype: 'success', is_error: false, result: m.review, num_turns: 1 }) },
  failed: { stage: true, args: (out) => [join(out, OUT)], reply: () => null, stderr: 'error: the stand-in for claude failed before the run', exit: 1 },
  isError: { stage: true, args: (out) => [join(out, OUT)], reply: () => ({ subtype: 'success', is_error: true, result: 'The stand-in reports a failed run.', num_turns: 1 }) },
  nothingStaged: { stage: false, args: (out) => [join(out, OUT)], reply: (m) => ({ subtype: 'success', is_error: false, result: m.review, num_turns: 1 }) },
};

// The most stand-in runs one script gets in one check: one a scenario, kept
// for the items that share it (scenario).
export const STUB_RUNS = Object.keys(SCENARIOS).length;

const README = '# Scratch repository for the practice check\n';
const SOURCE = 'export const answer = 42;\n';

function plan(name) {
  const id = randomBytes(6).toString('hex');
  // No marker holds another, so each shows on its own.
  const m = { staged: `change-in-the-index-${id}`, unstaged: `change-not-added-${id}`, review: `STUB-REVIEW-${id}` };
  const s = SCENARIOS[name];
  return {
    markers: m,
    options: {
      args: s.args,
      commit: { 'README.md': README, 'src/example.js': SOURCE },
      stage: s.stage ? { 'src/example.js': `${SOURCE}// ${m.staged}\n` } : {},
      change: { 'README.md': `${README}\n${m.unstaged}\n` },
      reply: s.reply(m) && { type: 'result', session_id: STUB_SESSION, total_cost_usd: 0, permission_denials: [], ...s.reply(m) },
      stderr: s.stderr,
      exit: s.exit ?? 0,
      practice: s.practice ?? true,
    },
  };
}

// Each repository's runs, by script and scenario, so the items share them.
const cache = new WeakMap();

function scenario(repo, script, name) {
  if (!cache.has(repo)) cache.set(repo, new Map());
  const runs = cache.get(repo);
  const key = `${script}\n${name}`;
  if (!runs.has(key)) {
    const { markers, options } = plan(name);
    const run = runStubbed(repo, script, options);
    const parsed = (run.calls ?? []).map((c) => ({ ...c, args: parseClaudeArgs(c.argv) }));
    run.markers = markers;
    run.print = parsed.filter((c) => c.args.print);
    // Calls without -p, apart from `claude --version` and `claude --help`.
    run.stray = parsed.filter((c) => !c.args.print && !c.args.flags.version && !c.args.flags.help);
    runs.set(key, run);
  }
  return runs.get(key);
}

function pending(repo, script) {
  try {
    repo.git('diff', '--quiet', 'HEAD', '--', script);
    return '';
  } catch {
    return ` В вашей копии ${code(script)} есть незакоммиченные изменения: если они это исправляют, закоммитьте их.`;
  }
}

// A run's exit code, or the signal that ended it.
const exitOf = (run) => run.status ?? run.signal;

const timedOut = `всё ещё работал через ${TIME_LIMIT / 1000} ${pl(TIME_LIMIT / 1000, 'секунду', 'секунды', 'секунд')}, поэтому проверка его остановила`;

// How a run ended, for a hint.
function ended(run) {
  if (run.timedOut) return `Он ${timedOut}.`;
  if (missingJq(run)) return JQ;
  const tail = stderrTail(run);
  return `Он завершился с кодом ${exitOf(run)}${tail ? `: ${tail}` : '.'}`;
}

// The turn cap the script passes, or CAP_MAX when the check can't tell.
function capOf(repo, script) {
  const value = scenario(repo, script, 'review').print?.[0]?.args.flags.maxTurns;
  return /^\d+$/.test(value ?? '') && Number(value) >= 1 ? Number(value) : CAP_MAX;
}

const squash = (flag) => flag.split('=')[0].replace(/^-+/, '').replace(/[-_]/g, '').toLowerCase();

// What's wrong with the arguments of one `claude -p` call, as sentences;
// none when nothing is.
export function callHints(argv) {
  const args = parseClaudeArgs(argv);
  const problems = [];
  // An option Claude Code doesn't know, written like one the call needs.
  const spelling = (flag) => {
    const typo = args.unknown.find((u) => squash(u) === squash(flag));
    return typo ? ` Claude Code не знает ${code(typo.split('=')[0])}, поэтому завершается с ошибкой ещё до начала запуска: напишите ${code(flag)}.` : '';
  };
  const example = 'как в `claude -p "<prompt>" --output-format json ...`';
  if (!args.promptFirst) {
    problems.push(args.next === undefined
      ? `После \`-p\` ничего нет. Напишите промпт сразу после него, ${example}.`
      : `Сразу после \`-p\` стоит ${code(args.next)}. Напишите промпт сразу после \`-p\`, ${example}.`);
  } else if (!args.prompt.trim()) {
    problems.push('Промпт после `-p` пуст. Напишите там, что Claude должен сделать с диффом.');
  }

  const { outputFormat, permissionMode, allowedTools, maxTurns, dangerouslySkipPermissions } = args.flags;
  if (outputFormat === undefined) problems.push(`Он не запрашивает JSON: добавьте \`--output-format json\`.${spelling('--output-format')}`);
  else if (outputFormat === null) problems.push('`--output-format` без формата после него: напишите `--output-format json`.');
  else if (outputFormat !== 'json') problems.push(`Он запрашивает \`--output-format ${outputFormat}\`: используйте \`json\`, чтобы скрипт мог сохранить результат и прочитать его.`);

  if (permissionMode === undefined) problems.push(`Он не задаёт режим разрешений: добавьте \`--permission-mode dontAsk\`, чтобы отклонялся каждый вызов, который запросил бы разрешение.${spelling('--permission-mode')}`);
  else if (permissionMode === null) problems.push('`--permission-mode` без режима после него: напишите `--permission-mode dontAsk`.');
  else if (permissionMode.toLowerCase() === 'dontask' && permissionMode !== 'dontAsk') problems.push(`Пишите \`dontAsk\` так, как его пишет Claude Code, а не ${code(permissionMode)}.`);
  else if (permissionMode !== 'dontAsk') problems.push(`Он работает в режиме ${code(permissionMode)}: используйте \`--permission-mode dontAsk\`, чтобы отклонялся каждый вызов, который запросил бы разрешение.`);
  if (dangerouslySkipPermissions) problems.push('Уберите `--dangerously-skip-permissions`: это то же самое, что `--permission-mode bypassPermissions`.');

  // A value with a word that can't be a tool name, such as a prompt written
  // after the list, is reported by that word alone.
  const values = allowedTools ?? [];
  const words = values.flatMap((v) => ruleList([v]).filter((e) => !TOOL_NAME.test(e)));
  const entries = ruleList(values.filter((v) => ruleList([v]).every((e) => TOOL_NAME.test(e))));
  const others = [...new Set(entries.filter((e) => !READ_ONLY.test(e)))];
  if (allowedTools === undefined) problems.push(`Он не одобряет заранее ни одного инструмента: добавьте \`--allowedTools "Read,Grep,Glob"\`.${spelling('--allowedTools')}`);
  else if (!ruleList(values).length) problems.push('`--allowedTools` не перечисляет ни одного инструмента: напишите `--allowedTools "Read,Grep,Glob"`.');
  if (words.length) {
    const [word] = words;
    problems.push(/^(read|grep|glob)$/i.test(word)
      ? `Пишите ${code(word[0].toUpperCase() + word.slice(1).toLowerCase())} так, как Claude Code пишет имя инструмента, а не ${code(word)}.`
      : `${code(word)} — не инструмент только для чтения: после \`--allowedTools\` перечислите только \`Read\`, \`Grep\` и \`Glob\`, а промпт напишите сразу после \`-p\`.`);
  }
  if (others.length) {
    const shown = others.slice(0, 3).map(code);
    problems.push(`\`--allowedTools\` перечисляет ${and(shown)}${others.length > 3 ? ` и ещё ${others.length - 3}` : ''}, а это не \`Read\`, \`Grep\` или \`Glob\`. Claude получает дифф через stdin, поэтому перечислите только эти три.`);
  }

  // `--tools` keeps exactly the three, so no rule can approve another
  // built-in tool, such as Bash for the project's test command.
  const { tools } = args.flags;
  const toolValues = (Array.isArray(tools) ? tools : [tools]).filter((v) => v !== null && v !== undefined);
  if (tools === undefined) problems.push(`Он не ограничивает инструменты: добавьте \`--tools "Read,Grep,Glob"\`, чтобы Claude не мог использовать Bash, Edit или Write, даже если их разрешает одно из ваших правил.${spelling('--tools')}`);
  else if (!toolValues.length) problems.push('`--tools` без инструментов после него: напишите `--tools "Read,Grep,Glob"`.');
  else {
    const listed = ruleList(toolValues);
    const kept = [...new Set(listed.filter((t) => !/^(Read|Grep|Glob)$/.test(t)))];
    const missing = ['Read', 'Grep', 'Glob'].filter((t) => !listed.includes(t));
    if (kept.length) problems.push(`\`--tools\` оставляет доступными ${and(kept.slice(0, 3).map(code))}${kept.length > 3 ? ` и ещё ${kept.length - 3}` : ''}: перечислите там только \`Read\`, \`Grep\` и \`Glob\`.`);
    else if (missing.length) problems.push(`\`--tools\` не включает ${and(missing.map(code))}: перечислите там \`Read\`, \`Grep\` и \`Glob\`, как в \`--tools "Read,Grep,Glob"\`.`);
  }

  // Hooks off for the run: a project's hooks run in a `-p` session, and a
  // Stop hook can send the reviewer back to work.
  const { settings } = args.flags;
  const hooksOff = '`--settings \'{"disableAllHooks": true}\'`';
  if (settings === undefined) problems.push(`Он не отключает hooks: добавьте ${hooksOff}, чтобы hooks проекта не могли выполняться во время ревью.${spelling('--settings')}`);
  else if (settings === null || !settings.trim()) problems.push(`\`--settings\` без значения после него: напишите ${hooksOff}.`);
  else {
    let value;
    try {
      value = JSON.parse(settings);
    } catch {
      value = undefined;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) problems.push(`\`--settings\` получает ${code(quoted(settings))}, а это не встроенный JSON: напишите ${hooksOff}.`);
    else if (value.disableAllHooks !== true) problems.push(`JSON в \`--settings\` не задаёт \`"disableAllHooks": true\`, поэтому hooks проекта всё ещё выполняются: добавьте его, как в ${hooksOff}.`);
  }

  // No MCP server but the ones the call passes: a `-p` run connects the
  // project's `.mcp.json` servers without asking.
  if (!args.flags.strictMcpConfig) problems.push(`Он не исключает MCP-серверы проекта: добавьте \`--strict-mcp-config\`, чтобы запуск не поднимал серверов, которые вы не передали через \`--mcp-config\`.${spelling('--strict-mcp-config')}`);

  if (maxTurns === undefined) problems.push(`Он не ограничивает число ходов: добавьте \`--max-turns\` с числом от 1 до ${CAP_MAX}.${spelling('--max-turns')}`);
  else if (maxTurns === null) problems.push(`\`--max-turns\` без числа после него: напишите число от 1 до ${CAP_MAX}.`);
  else if (!/^\d+$/.test(maxTurns)) problems.push(`\`--max-turns ${maxTurns}\` — не целое число: нужно целое от 1 до ${CAP_MAX}.`);
  else if (Number(maxTurns) < 1 || Number(maxTurns) > CAP_MAX) problems.push(`\`--max-turns ${maxTurns}\` ${Number(maxTurns) < 1 ? 'меньше 1' : `больше ${CAP_MAX}`}: используйте число от 1 до ${CAP_MAX}.`);
  return problems;
}

// `guide` is where the page describes the script.
export function committedScript(script, guide = 'разделе «Ваша очередь» урока') {
  return {
    text: `${code(script)} закоммичен и исполняем`,
    check(repo) {
      const mode = committedMode(repo, script);
      if (mode === null) return repo.exists(script) ? `${code(script)} не закоммичен. Выполните \`git add ${script}\` и закоммитьте.` : `Файла ${code(script)} нет. Напишите его так, как описано в ${guide}, затем закоммитьте.`;
      if (mode === '100755') return true;
      if (mode === '100644') return `${code(script)} не исполняемый. Выполните \`chmod +x ${script}\`, затем \`git add ${script}\` и закоммитьте. В Windows выполните \`git update-index --chmod=+x ${script}\` и закоммитьте.`;
      return `${code(script)} закоммичен как ${mode === '120000' ? 'символическая ссылка' : 'что-то, кроме файла'}. Закоммитьте сам файл скрипта и сделайте его исполняемым.`;
    },
  };
}

export function scriptCall(script) {
  return {
    text: `его \`claude -p\` просит JSON в режиме \`dontAsk\`, разрешает только \`Read\`, \`Grep\` и \`Glob\`, без hooks и MCP, не больше ${CAP_MAX} ходов, а промпт стоит сразу после \`-p\``,
    check(repo) {
      const run = scenario(repo, script, 'review');
      const skipped = notRun(run, script);
      if (skipped) return skipped;
      if (!run.print.length) {
        const why = run.stray.length
          ? `запустил \`claude\` без \`-p\` (или \`--print\`), а это начинает интерактивную сессию. Добавьте \`-p\` и сразу после него промпт.`
          : `ни разу не запустил \`claude -p\`, поэтому проверка не увидела его флагов. ${ended(run)}`;
        return `С подготовленным изменением ${code(script)} ${why}${pending(repo, script)}`;
      }
      const problems = [...new Set(run.print.flatMap((c) => callHints(c.argv)))];
      return problems.length ? `${problems.join(' ')}${pending(repo, script)}` : true;
    },
  };
}

const isStubJson = (text) => {
  try {
    return JSON.parse(text)?.session_id === STUB_SESSION;
  } catch {
    return false;
  }
};

// The review of a staged change, in a run that finished: one call, the staged
// diff on its stdin and nothing else, exit 0, the review printed and the JSON
// saved where the first argument says.
function reviewProblems(run, fallback) {
  const m = run.markers;
  if (!run.print.length) return [`С подготовленным изменением скрипт ни разу не запустил \`claude -p\`. ${ended(run)}`];
  const problems = [];
  if (run.print.length > 1) problems.push(`С одним подготовленным изменением он запустил \`claude -p\` ${run.print.length} ${pl(run.print.length, 'раз', 'раза', 'раз')}. Запускайте его один раз, передавая весь staged-дифф через stdin.`);
  if (run.stray.length) problems.push('Кроме того, он запустил `claude` без `-p`, а это начинает интерактивную сессию. Оставьте только вызов `claude -p`.');
  const [call] = run.print;
  if (!call.stdin.includes(m.staged)) {
    problems.push(call.argv.some((a) => a.includes(m.staged))
      ? 'Он вставляет дифф в промпт. Вместо этого передайте его через конвейер: `git diff --cached | claude -p "<prompt>" ...`.'
      : 'То, что он передал в `claude -p`, не содержит подготовленного изменения. Передайте через конвейер staged-дифф: `git diff --cached | claude -p "<prompt>" ...`.');
  } else if (call.stdin.includes(m.unstaged)) {
    problems.push('Дифф, который он передал в `claude -p`, содержит и неподготовленное изменение. Передавайте `git diff --cached`, где есть только подготовленное.');
  }
  if (run.status !== 0) problems.push(`С подготовленным изменением и успешным запуском он завершился с кодом ${exitOf(run)}${stderrTail(run) ? ` (${stderrTail(run)})` : ''}. Завершайтесь с кодом 0, когда ревью прошло успешно.`);
  if (!run.stdout.includes(m.review)) problems.push('Он не напечатал ревью. Печатайте `result` из JSON, как это делает `jq -r \'.result\'`.');
  const saved = run.saved[`out/${OUT}`];
  const save = `Сохраняйте вывод \`claude -p\` по пути из первого аргумента или в ${code(fallback)}, если аргумента нет: \`out="\${1:-${fallback}}"\`, затем \`> "$out"\`.`;
  if (saved === undefined) problems.push(run.saved[fallback] !== undefined ? `Он сохранил JSON в ${code(fallback)}, хотя первый аргумент указывал другой путь. Используйте аргумент, когда он есть: \`out="\${1:-${fallback}}"\`.` : `Он не сохранил JSON по пути из первого аргумента. ${save}`);
  else if (!isStubJson(saved)) problems.push('Файл по пути из первого аргумента — не тот JSON, который напечатал `claude -p`. Сохраняйте этот вывод без изменений.');
  return problems;
}

function defaultProblems(run, fallback) {
  if (run.timedOut) return [`При запуске без аргумента он ${timedOut}.`];
  const saved = run.saved[fallback];
  if (saved === undefined) {
    const folder = posix.dirname(fallback);
    if (run.stderr.includes(fallback) && /No such file or directory/.test(run.stderr)) return [`При запуске без аргумента в свежей копии, где ${code(`${folder}/`)} ещё нет, он не смог записать ${code(fallback)}. Сначала создайте папку, как это делает \`mkdir -p "$(dirname "$out")"\`.`];
    const how = run.status !== 0 ? ` (он завершился с кодом ${exitOf(run)}${stderrTail(run) ? `: ${stderrTail(run)}` : ''})` : '';
    return [`При запуске без аргумента он не сохранил JSON в ${code(fallback)}${how}. Используйте этот путь, когда аргумента нет: \`out="\${1:-${fallback}}"\`.`];
  }
  return isStubJson(saved) ? [] : [`При запуске без аргумента он сохранил в ${code(fallback)} не тот JSON, который напечатал \`claude -p\`.`];
}

function failureProblems(failed, isError) {
  const problems = [];
  if (failed.timedOut) problems.push(`Когда \`claude -p\` завершается с ненулевым кодом, он ${timedOut}. Тоже завершайтесь с ненулевым кодом, не дожидаясь и не повторяя попытку.`);
  else if (failed.status === 0) problems.push('Когда `claude -p` завершается с ненулевым кодом и не печатает JSON, как бывает с флагом, который он не может прочитать, скрипт завершился с кодом 0. Завершайтесь с ненулевым кодом всякий раз, когда так завершается `claude -p`.');
  if (isError.timedOut) problems.push(`Когда JSON сообщает \`"is_error": true\`, он ${timedOut}.`);
  else if (isError.status === 0) problems.push('Когда JSON сообщает `"is_error": true`, а `claude -p` завершается с кодом 0, скрипт завершился с кодом 0. Завершайтесь с ненулевым кодом всякий раз, когда `is_error` равно `true`: проверяйте `jq -r \'.is_error\'`.');
  return problems;
}

function emptyProblems(run) {
  if (run.timedOut) return [`Когда ничего не подготовлено, он ${timedOut}.`];
  const problems = [];
  if (run.print.length) problems.push('Когда ничего не подготовлено, он всё равно запустил `claude -p`. Сначала проверьте, есть ли подготовленное изменение, как это делает `git diff --cached --quiet`, и остановитесь до вызова Claude.');
  if (run.status === 0) problems.push('Когда ничего не подготовлено, он завершился с кодом 0. Завершайтесь с ненулевым кодом, чтобы то, что его запускает, видело, что ревью не было.');
  if (!`${run.stdout}${run.stderr}`.trim()) problems.push('Когда ничего не подготовлено, он ничего не напечатал. Сообщите, что ничего не подготовлено.');
  return problems;
}

// `fallback` is where the script saves the JSON without an argument: the
// lesson's path, which the capstone's script keeps.
export function scriptBehavior(script, fallback = RESULT) {
  return {
    text: 'он передаёт staged-дифф через конвейер, сохраняет JSON туда, куда указывает аргумент, печатает результат, завершается с ненулевым кодом при сбое запуска и не вызывает Claude, когда ничего не подготовлено',
    check(repo) {
      const review = scenario(repo, script, 'review');
      const skipped = notRun(review, script);
      if (skipped) return skipped;
      if (missingJq(review)) return JQ;
      // A script that hangs on a staged change would hang in every run.
      if (review.timedOut) return `С подготовленным изменением ${code(script)} ${timedOut}.${pending(repo, script)}`;
      const [noArgument, failed, isError, nothingStaged] = ['noArgument', 'failed', 'isError', 'nothingStaged'].map((n) => scenario(repo, script, n));
      if ([noArgument, failed, isError, nothingStaged].some(missingJq)) return JQ;
      const problems = [...reviewProblems(review, fallback), ...defaultProblems(noArgument, fallback), ...failureProblems(failed, isError), ...emptyProblems(nothingStaged)];
      if (!problems.length) return true;
      const more = problems.length > 3 ? ` И ещё ${problems.length - 3} ${pl(problems.length - 3, 'замечание', 'замечания', 'замечаний')}: исправьте эти и снова запустите проверку.` : '';
      return `${problems.slice(0, 3).join(' ')}${more}${pending(repo, script)}`;
    },
  };
}

// A real run the Learner saved. Its turn count may be one above the cap:
// the cap counts only the turns that use tools, and `num_turns` counts the
// final answer too (How the agent loop works). The lesson's dry-run confirms
// the bound.
export function savedRun(result, script) {
  const run = `подготовьте изменение и запустите \`${script}${result === RESULT ? '' : ` ${result}`}\``;
  const again = `Затем снова ${run}.`;
  return {
    text: `${code(result)} содержит запуск, который завершился успешно в пределах вашего ограничения`,
    local: true,
    check(repo) {
      const text = repo.read(result);
      if (text === null || !text.trim()) return `Файла ${code(result)} пока нет: ${run} — он сохранит туда JSON.`;
      let value;
      try {
        value = JSON.parse(text);
      } catch {
        return `${code(result)} — не JSON. Сохраните туда вывод \`claude -p --output-format json\` без изменений. ${again}`;
      }
      if (value?.type !== 'result') return `${code(result)} — не результат запуска \`claude -p\` с \`--output-format json\`. ${again}`;
      if (value.session_id === STUB_SESSION) return `${code(result)} содержит ответ подставной замены из проверки, а не настоящий запуск: ваш скрипт сохранил его туда, пока проверка его запускала. Сохраняйте JSON только туда, куда указывает первый аргумент скрипта. ${again}`;
      if (value.subtype !== 'success') return `Запуск в ${code(result)} остановился раньше времени (${code(String(value.subtype))}) и не содержит ревью.${value.subtype === 'error_max_turns' ? ` Поднимите предел, но не выше ${CAP_MAX}, сузьте промпт или проверьте флаги.` : ''} ${again}`;
      if (value.is_error !== false) return `Запуск в ${code(result)} завершился сбоем${typeof value.result === 'string' && value.result.trim() ? `: «${quoted(value.result)}»` : ''}. Исправьте то, о чём он сообщает. ${again}`;
      if (typeof value.result !== 'string' || !value.result.trim()) return `Запуск в ${code(result)} не содержит ревью в \`result\`. ${again}`;
      if (typeof value.session_id !== 'string' || !value.session_id) return `В запуске в ${code(result)} нет \`session_id\`, значит, это не тот JSON, который сохраняет \`claude -p\`. ${again}`;
      const cap = capOf(repo, script);
      if (!Number.isInteger(value.num_turns) || value.num_turns < 1) return `В запуске в ${code(result)} нет числа ходов в \`num_turns\`, значит, это не тот JSON, который сохраняет \`claude -p\`. ${again}`;
      if (value.num_turns > cap + 1) return `Запуск в ${code(result)} занял ${value.num_turns} ${pl(value.num_turns, 'ход', 'хода', 'ходов')} — больше, чем позволяет \`--max-turns ${cap}\`, значит, он шёл с более высоким пределом. ${again}`;
      return true;
    },
  };
}

export const items = [committedScript(SCRIPT), scriptCall(SCRIPT), scriptBehavior(SCRIPT), savedRun(RESULT, SCRIPT)];
