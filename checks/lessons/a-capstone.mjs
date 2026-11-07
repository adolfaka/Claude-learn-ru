// The Advanced capstone: add CI review your team can share, as
// capstone/advanced-brief.md asks, in a new copy of the template. It reuses
// the Advanced lessons' items with the capstone's own files: the worktree
// listing and the review script's run, both saved under .practice/; the
// saved workflow, which must start a finding agent and a checking one; and
// the review workflow, which runs on pull requests and is read from the
// history, so the check passes before and after the teardown. The review
// script's call meets lesson 4's criteria, its tools restricted to Read,
// Grep and Glob, hooks off and no MCP server: the skill named at the start
// of its prompt runs without the Skill tool, so it still runs. Lesson 7's
// item holds the review script to a spend cap that the saved run came in
// under. The brief states problems, so the items accept any sound way to
// meet them: worktrees anywhere, brought in by merge, rebase or squash. Two
// items join the parts: the script and CI run one committed review skill,
// and a new push cancels CI's review of an older one. Choosing which review
// runs where, acting on the CI review, when the sandbox is needed and the
// cost estimates are self-assessed on the capstone page.
import { parseClaudeArgs, scriptCalls } from '../claude-args.mjs';
import { committedIgnore, ignoreHint } from '../ignore.mjs';
import { headText } from '../marketplace.mjs';
import { parseWorktrees } from '../worktrees.mjs';
import { claudeHistory, parseYaml } from '../actions.mjs';
import { ignoresWorktrees, mergedWorktrees } from './a-1.mjs';
import { savedWorkflow } from './a-3.mjs';
import { committedScript, savedRun, SCRIPT, scriptBehavior, scriptCall } from './a-4.mjs';
import { boundedWorkflow, chosenWorkflow, originRepo } from './a-5.mjs';
import { marketplaceItem, settingsItem } from './a-6.mjs';
import { testsPass, nothingUncommitted } from './b-3.mjs';

export const title = 'Итоговый проект продвинутого уровня';

export const SNAPSHOT = '.practice/a-capstone-worktrees.txt';
export const RUN = '.practice/a-capstone-run.json';
export const REVIEW = '.github/workflows/claude-review.yml';
export const CI_RUNS = '.practice/a-capstone-ci.json';
// The brief's review runs on each pull request; a workflow started by hand,
// such as lesson 5's, never stands in for it. The copy has only the
// credential's secret, saved with `gh secret set`, and no Claude GitHub App.
export const CI = {
  triggers: ['pull_request'],
  file: REVIEW,
  guide: 'части 5 `capstone/advanced-brief.md`',
  secret: 'секрет, который вы сохранили командой `gh secret set`',
  noToken: 'действие аутентифицируется как Claude GitHub App, которого итоговый проект не настраивает',
};
// Where the brief describes the review script and the team's plugin, for the
// hints of the lessons' items, which name the lessons' own sections.
const SCRIPT_GUIDE = 'части 2 `capstone/advanced-brief.md`';
const PLUGIN_GUIDE = 'части 3 `capstone/advanced-brief.md`';
const PLUGIN = {
  marketplace: `Положите в \`team-marketplace/\` marketplace с одним вашим плагином, как описано в ${PLUGIN_GUIDE}`,
  settings: `как описано в ${PLUGIN_GUIDE}`,
};

// A Claude API key or OAuth token written out, as lesson 5's check spots one
// in a workflow file. checks/ holds the checks' own made-up keys.
const KEY = 'sk-ant-[A-Za-z0-9_-]{20,}';
const OWN = ':(exclude)checks/';

const short = (sha) => sha.slice(0, 7);

// Where `commit` holds a key, each `{ path, line }`, by path. The key itself
// is never kept, so no hint can print it.
function keysAt(repo, commit) {
  let out;
  try {
    out = repo.gitLocal('grep', '--no-color', '-I', '-n', '-z', '-E', KEY, commit, '--', '.', OWN);
  } catch (error) {
    if (error.status === 1) return [];
    throw error;
  }
  return out.split('\n').filter(Boolean).map((record) => {
    const [where, line] = record.split('\0');
    return { path: where.slice(commit.length + 1), line: Number(line) };
  });
}

function headCommit(repo) {
  try {
    return repo.git('rev-parse', '--verify', '--quiet', 'HEAD^{commit}');
  } catch {
    return null;
  }
}

export const noCommittedKey = {
  text: 'ни ключ API Claude, ни токен не закоммичены ни в `HEAD`, ни в коммите, который читает пункт о рабочем процессе',
  check(repo) {
    const head = headCommit(repo);
    if (!head) return true;
    const read = chosenWorkflow(repo, CI.triggers, CI)?.file.commit;
    for (const commit of [head, read].filter((c, i, all) => c && all.indexOf(c) === i)) {
      const found = keysAt(repo, commit);
      if (!found.length) continue;
      const places = found.slice(0, 3).map((f) => `строка ${f.line} в \`${f.path}\``);
      const more = found.length > 3 ? `, и ещё ${found.length - 3}` : '';
      const where = commit === head ? 'В `HEAD`' : `В коммите ${short(commit)}, из которого проверка читает ваш рабочий процесс`;
      return `${where}, ${places.join(', ')}${more} ${found.length > 1 ? 'содержат' : 'содержит'} что-то похожее на ключ API или токен Claude. Считайте, что он утёк: удаление из файла не убирает его из истории. Сразу удалите ключ API в Claude Console (для токена от \`claude setup-token\` прочитайте предупреждение на странице итогового проекта) и храните учётные данные только в секрете репозитория.`;
    }
    return true;
  },
};

// A spend cap, as lesson 7's runs have: `--max-budget-usd` in the review
// script's committed `claude -p` call, written as an amount the check can
// read, and the saved run's estimated cost below it. The saved run's other
// fields are the run item's to report.
const AMOUNT = /^(\d+(\.\d*)?|\.\d+)$/;

export const spendCap = {
  text: `вызов \`claude -p\` в скрипте ревью ограничивает расходы флагом \`--max-budget-usd\`, а \`${RUN}\` стоил меньше этого лимита`,
  local: true,
  check(repo) {
    const text = headText(repo, SCRIPT);
    if (text === null) return `Проверка не может прочитать лимит расходов без закоммиченного \`${SCRIPT}\` (см. пункт о скрипте).`;
    const budgets = scriptCalls(text).map((argv) => parseClaudeArgs(argv)).filter((a) => a.print).map((a) => a.flags.maxBudgetUsd);
    if (!budgets.length) return `Проверка не нашла вызова \`claude -p\` в закоммиченном \`${SCRIPT}\`, поэтому не может прочитать лимит расходов.`;
    const budget = budgets.find((b) => b !== undefined);
    if (budget === undefined) return `Вызов \`claude -p\` в \`${SCRIPT}\` не задаёт лимита расходов. Добавьте \`--max-budget-usd\` с суммой в долларах США, выше стоимости одного ревью, как в скрипте урока 7, и закоммитьте.`;
    if (typeof budget !== 'string' || !budget.trim() || budget.startsWith('-')) return 'После `--max-budget-usd` нет суммы: напишите сумму в долларах США больше 0 и закоммитьте.';
    if (budget.includes('$')) return `\`--max-budget-usd ${budget}\` берёт сумму из переменной, которую проверка не может вычислить: запишите число прямо в скрипте и закоммитьте.`;
    if (!AMOUNT.test(budget) || Number(budget) <= 0) return `\`--max-budget-usd ${budget}\` — не сумма больше 0: напишите число долларов США без знака \`$\` и закоммитьте.`;
    const cap = Number(budget);
    let run;
    try {
      run = JSON.parse(repo.read(RUN) ?? '');
    } catch {
      return `Проверка не может прочитать стоимость из \`${RUN}\` (см. пункт об этом файле).`;
    }
    if (run?.subtype === 'error_max_budget_usd') return `Запуск в \`${RUN}\` остановился на вашем лимите расходов (\`error_max_budget_usd\`), значит, лимит ниже стоимости одного ревью. Поднимите \`--max-budget-usd\` в \`${SCRIPT}\`, закоммитьте и запустите ревью снова.`;
    const cost = run?.total_cost_usd;
    if (typeof cost !== 'number' || !Number.isFinite(cost) || cost < 0) return `В запуске в \`${RUN}\` нет оценки стоимости в \`total_cost_usd\`. Сохраняйте JSON, который печатает \`claude -p\`, без изменений и запустите ревью снова.`;
    if (cost >= cap) return `Ревью стоило примерно $${cost} (\`total_cost_usd\`), а ваш лимит расходов, \`--max-budget-usd ${budget}\`, не выше этой суммы. Поставьте лимит выше стоимости одного ревью, с запасом, закоммитьте \`${SCRIPT}\` и запустите ревью снова.`;
    return true;
  },
};

// Where the worktrees were: the ones the listing names inside the
// repository must be ignored by a committed rule, which hides nothing else
// of .claude/. With no listing yet, lesson 1's rule for .claude/worktrees/,
// where `claude --worktree` makes them.
export const ignoredWorktrees = {
  text: `закоммиченный \`.gitignore\` не пускает в git worktrees внутри репозитория, которые перечисляет \`${SNAPSHOT}\`, и не прячет остальное в \`.claude/\``,
  check(repo) {
    const records = parseWorktrees(repo.read(SNAPSHOT) ?? '');
    if (!records.length) return ignoresWorktrees.check(repo);
    const main = records[0].path.replace(/\/+$/, '');
    const inside = [...new Set(records.slice(1).filter((r) => !r.bare && r.path.startsWith(`${main}/`)).map((r) => r.path.slice(main.length + 1)))];
    for (const path of inside) {
      const found = committedIgnore(repo, `${path}/a-capstone-probe`);
      if (found.problem) return ignoreHint(found, `${path}/`);
    }
    const settings = committedIgnore(repo, '.claude/settings.json');
    if (settings.problem) return true;
    return `Строка ${settings.line} в \`${settings.source}\`, \`${settings.pattern}\`, игнорирует и \`.claude/settings.json\`, поэтому скрыла бы настройки, которые вы коммитите для команды. Игнорируйте только папку worktrees и закоммитьте.`;
  },
};

// The `/<name>` a prompt starts with, or null.
const skillOf = (prompt) => (typeof prompt === 'string' ? prompt.trim().match(/^\/([\w:.-]+)/)?.[1] ?? null : null);

// The script and CI run one review: both prompts start with the same
// `/<name>`, a skill committed in .claude/skills/<name>/SKILL.md, which a
// CI checkout loads, unlike a plugin from the repository's marketplace.
export const sameReview = {
  text: 'промпт `claude -p` в скрипте ревью и `prompt` рабочего процесса CI запускают один и тот же skill, закоммиченный в `.claude/skills/`',
  check(repo) {
    const text = headText(repo, SCRIPT);
    if (text === null) return `Проверка не может сравнить ревью без закоммиченного \`${SCRIPT}\` (см. пункт о скрипте).`;
    const prompts = scriptCalls(text).map((argv) => parseClaudeArgs(argv)).filter((a) => a.print).map((a) => a.prompt);
    if (!prompts.length) return `Проверка не нашла вызова \`claude -p\` в закоммиченном \`${SCRIPT}\`, поэтому не может понять, какое ревью он запускает.`;
    const local = skillOf(prompts[0]);
    const c = chosenWorkflow(repo, CI.triggers, CI);
    if (!c) return 'Проверка не может сравнить ревью без закоммиченного рабочего процесса ревью (см. пункт о нём).';
    const remote = skillOf(c.step.inputs.prompt?.text);
    if (!local) return `Промпт \`claude -p\` в \`${SCRIPT}\` не запускает skill, поэтому ревью живёт только в скрипте. Закоммитьте ревью команды как \`.claude/skills/<name>/SKILL.md\` и начните промпт с \`/<name>\`.`;
    if (!remote) return `\`prompt\` рабочего процесса ревью не запускает skill, поэтому CI делает ревью иначе, чем скрипт, который запускает \`/${local}\`. Сделайте \`prompt\` тоже \`/${local}\`.`;
    if (local.toLowerCase() !== remote.toLowerCase()) return `Скрипт запускает \`/${local}\`, а CI — \`/${remote}\`. Запускайте в обоих местах один skill, чтобы ноутбук и CI делали ревью одинаково.`;
    if (local.includes(':')) return `\`/${local}\` — это skill плагина. Копии репозитория в CI никогда не доверяли, поэтому marketplace репозитория там не загружается: закоммитьте ревью как \`.claude/skills/<name>/SKILL.md\` и запускайте \`/<name>\` в обоих местах.`;
    if (headText(repo, `.claude/skills/${local}/SKILL.md`) === null) return `\`/${local}\` не называет skill, закоммиченный в \`.claude/skills/${local}/SKILL.md\`. Закоммитьте туда ревью команды.`;
    return true;
  },
};

// A key's value in a parsed YAML map, or undefined.
const entry = (node, key) => (node?.type === 'map' ? node.entries.find((e) => e.key === key)?.value : undefined);

// A new push replaces CI's review of an older one: a `concurrency` group,
// for the workflow or for the job that runs the action, with
// `cancel-in-progress: true`.
export const reviewConcurrency = {
  text: 'рабочий процесс CI задаёт группу `concurrency` с `cancel-in-progress: true`, так что новый push отменяет ревью, которое ещё идёт',
  check(repo) {
    const c = chosenWorkflow(repo, CI.triggers, CI);
    if (!c) return 'Проверка не может прочитать группу `concurrency` без закоммиченного рабочего процесса ревью (см. пункт о нём).';
    let doc;
    try {
      doc = parseYaml(c.file.text);
    } catch {
      return `Проверка не может прочитать \`${c.file.path}\` как файл рабочего процесса (см. пункт о нём).`;
    }
    const job = entry(entry(doc, 'jobs'), c.step.job);
    const groups = [entry(doc, 'concurrency'), entry(job, 'concurrency')].filter(Boolean);
    if (!groups.length) return `\`${c.file.path}\` не задаёт \`concurrency\`, поэтому пять быстрых push запустят пять ревью. Добавьте \`concurrency:\` с \`group\` для pull request и \`cancel-in-progress: true\` и закоммитьте.`;
    if (groups.some((g) => entry(g, 'cancel-in-progress')?.text === 'true')) return true;
    return `\`concurrency\` в \`${c.file.path}\` не отменяет ревью, которое ещё идёт: поставьте \`cancel-in-progress: true\` рядом с его \`group\` и закоммитьте.`;
  },
};

// The CI review ran: the record of its runs the Learner saved with
// `gh run list`, read locally, as lesson 5's run item reads its own. A run
// of the review workflow (by its `name`, or its path when it has none) that
// a pull request started, in this repository, completed and successful. The
// run's commit isn't checked: which commit GitHub reports for a pull
// request run is unconfirmed.
const CI_FIELDS = 'databaseId,status,conclusion,event,url,workflowName';
const RUN_URL = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/actions\/runs\/\d+/i;
const FAILED = new Set(['failure', 'timed_out', 'startup_failure']);

// The names GitHub shows for the review workflow in any commit that held it.
function reviewNames(repo) {
  const names = new Set();
  for (const { files } of claudeHistory(repo)) {
    for (const f of files.filter((x) => x.path === REVIEW)) {
      let name;
      try {
        name = entry(parseYaml(f.text), 'name')?.text?.trim();
      } catch {
        name = undefined;
      }
      names.add(name || REVIEW);
    }
  }
  return [...names];
}

export const ciRun = {
  text: `\`${CI_RUNS}\` показывает завершённый успешный запуск рабочего процесса ревью от \`pull_request\``,
  local: true,
  check(repo) {
    const save = `\`gh run list --workflow claude-review.yml --json ${CI_FIELDS} > ${CI_RUNS}\``;
    const again = 'затем снова сохраните список';
    const text = repo.read(CI_RUNS);
    if (text === null || !text.trim()) return `Файла \`${CI_RUNS}\` пока нет. Когда запуск ревью на вашем pull request завершится, сохраните список: ${save}.`;
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      return `\`${CI_RUNS}\` — не JSON. Сохраните список с \`--json\`, без изменений: ${save}.`;
    }
    const runs = (Array.isArray(value) ? value : [value]).filter((r) => r && typeof r === 'object' && !Array.isArray(r));
    if (!runs.length) return `\`${CI_RUNS}\` не перечисляет ни одного запуска. Откройте pull request, чтобы ревью запустилось, дождитесь окончания, ${again}.`;
    if (!runs.some((r) => ['status', 'conclusion', 'event', 'workflowName'].some((k) => k in r))) return `В \`${CI_RUNS}\` нет полей, которые читает проверка. Сохраните список с ними: ${save}.`;
    const names = reviewNames(repo);
    if (!names.length) return 'Без закоммиченного рабочего процесса ревью проверка не может понять, какие запуски относятся к вашему ревью (см. пункт о нём).';
    const mine = runs.filter((r) => names.includes(r.workflowName));
    if (!mine.length) {
      const others = [...new Set(runs.map((r) => r.workflowName).filter((n) => typeof n === 'string' && n))];
      return `\`${CI_RUNS}\` не перечисляет ни одного запуска вашего рабочего процесса ревью, \`${names[0]}\`${others.length ? `, только ${others.slice(0, 3).map((n) => `\`${n}\``).join(', ')}` : ''}. Сохраните список для \`claude-review.yml\`: ${save}.`;
    }
    const prs = mine.filter((r) => r.event === 'pull_request');
    if (!prs.length) return `\`${CI_RUNS}\` не перечисляет ни одного запуска \`${names[0]}\`, который начал pull request (\`pull_request\`). Отправьте изменение в новой ветке и откройте pull request, дождитесь окончания ревью, ${again}.`;
    const origin = originRepo(repo);
    // gh lists the newest run first: report on the first that got furthest.
    const stage = (r) => {
      const id = /^\d+$/.test(String(r.databaseId ?? '')) ? String(r.databaseId) : '<run-id>';
      const which = id === '<run-id>' ? 'Запуск' : `Запуск ${id}`;
      if (origin) {
        const m = typeof r.url === 'string' ? r.url.match(RUN_URL) : null;
        if (!m) return { n: 0, hint: `${which} в \`${CI_RUNS}\` записан без URL запуска на GitHub, поэтому проверка не может понять, в каком репозитории он шёл. Снова сохраните список с его \`url\`.` };
        if (`${m[1]}/${m[2]}`.toLowerCase() !== origin.toLowerCase()) return { n: 0, hint: `${which} шёл в \`${m[1]}/${m[2]}\`, а \`origin\` этого репозитория — \`${origin}\`. Сохраните список в этой копии.` };
      }
      if (r.status !== 'completed') return { n: 1, hint: `${which} не завершён: его \`status\` — \`${String(r.status ?? 'missing')}\`. Дождитесь его командой \`gh run watch ${id}\`, ${again}.` };
      if (r.conclusion !== 'success') {
        const how = `\`${String(r.conclusion ?? 'missing')}\``;
        if (r.conclusion === 'cancelled') return { n: 2, hint: `${which} завершился с результатом ${how}: более новый push в pull request отменяет ревью, которое ещё идёт. Дождитесь окончания самого нового ревью, ${again}.` };
        return { n: 2, hint: FAILED.has(r.conclusion) ? `${which} завершился с результатом ${how}. Посмотрите причину командой \`gh run view ${id} --log-failed\`, исправьте рабочий процесс, закоммитьте, отправьте в pull request, дождитесь окончания ревью, ${again}.` : `${which} завершился с результатом ${how}. Отправьте изменение в pull request, чтобы ревью запустилось снова, дождитесь окончания, ${again}.` };
      }
      return { n: 3 };
    };
    const best = prs.map(stage).reduce((a, b) => (b.n > a.n ? b : a));
    return best.n === 3 ? true : best.hint;
  },
};

export const items = [
  ignoredWorktrees,
  mergedWorktrees(SNAPSHOT, { anywhere: true }),
  savedWorkflow({ needArgs: false, needAgentCall: true, needCheck: true }),
  committedScript(SCRIPT, SCRIPT_GUIDE),
  scriptCall(SCRIPT),
  scriptBehavior(SCRIPT),
  savedRun(RUN, SCRIPT),
  boundedWorkflow(CI),
  noCommittedKey,
  marketplaceItem(PLUGIN),
  settingsItem(PLUGIN),
  testsPass,
  nothingUncommitted,
  // After the others, so they keep their places in the app's list of slow
  // items; these read text and start no process.
  spendCap,
  sameReview,
  reviewConcurrency,
  ciRun,
];
