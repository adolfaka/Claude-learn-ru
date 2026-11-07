// Choose an orchestration pattern (Advanced, lesson 2). The Learner picks a
// pattern for each of five backlog items by what it needs and what it costs,
// writes the choices to a file, and runs job 1 as parallel subagents in a
// session started with Intermediate lesson 6's delegation log, a
// SubagentStart hook that logs each subagent's type. An agent team is a
// pattern the Learner may name, and the chart's hint answers it. Naming the
// pattern for a job of their own is self-checked.

export const title = 'Выбор схемы оркестрации';

const CHOICES = '.practice/a-2-choices.md';
// Intermediate lesson 6's hook file and the log it appends to.
const LOG = '.practice/i-6-agents.txt';
const HOOK = '.practice/i-6-hook.json';
// The subagent lesson 6 delegated to, which its log already names.
const EARLIER = 'test-gaps';
const HOOKED = `\`claude --settings ${HOOK}\``;
const FORMAT = '`<номер задачи>: <схема> because <причина>`';
const NAMES = '`main conversation`, `subagents`, `workflow`, `/batch` или `agent team`';

// What the text after a job number may start with, once an article goes.
const PATTERNS = [
  ['subagents', /^(?:(?:parallel\s+)?sub[\s-]?agents?\b|(?:параллельн[а-яё]*\s+)?субагент)/i],
  ['workflow', /^(?:(?:dynamic\s+)?workflows?\b|(?:динамическ[а-яё]*\s+)?workflow)/i],
  ['batch', /^\/?batch\b/i],
  ['main conversation', /^(?:(?:main\s+(?:conversation|session)|(?:single|one)\s+(?:conversation|session))\b|(?:основн|одн)[а-яё]*\s+(?:диалог|разговор|сесси))/i],
  ['agent team', /^(?:agent[\s-]+teams?\b|команд[а-яё]*\s+агентов)/i],
];
const LABEL = { 'main conversation': '«основной диалог»', subagents: '«субагенты»', workflow: '«workflow»', batch: '`/batch`', 'agent team': '«команда агентов»' };

// The lesson's chart: its questions in order, and the answers that lead to
// each pattern. Where a wrong pick leaves the right path is the question that
// settles the job.
const QUESTIONS = [
  'Справится ли один диалог, не переполнившись?',
  'Должны ли исполнители общаться друг с другом?',
  'Нужны ли перекрёстная проверка находок или повторный запуск?',
  'Это одно большое изменение, которое делится на независимые части?',
];
const PATH = {
  'main conversation': [true],
  'agent team': [false, true],
  workflow: [false, false, true],
  batch: [false, false, false, true],
  subagents: [false, false, false, false],
};

// The five jobs in the lesson's Your turn, and the answer to each question on
// the way to the pattern that fits.
const JOBS = {
  1: { pattern: 'subagents', why: [
    'Нет: чтение трёх самых больших файлов переполнило бы ваш диалог, а нужны только подозрительные места.',
    'Нет: каждый рецензент проверяет свой файл и сообщает, что нашёл.',
    'Нет: три файла проверяются один раз, и шага, который подтверждает находки, нет.',
    'Нет: пока ничего не меняется, рецензенты только докладывают.',
  ] },
  2: { pattern: 'workflow', why: [
    'Нет: она охватывает всю кодовую базу.',
    'Нет: каждую находку сверяют с кодом, а не обсуждают между исполнителями.',
    'Да: она охватывает всю кодовую базу, подтверждает каждую находку, прежде чем внести её в список, и повторяется перед каждым релизом, поэтому план должен держать скрипт.',
  ] },
  3: { pattern: 'main conversation', why: [
    'Да: каждое место вызова читается быстро, а переименование должно войти одним изменением, которое не ломает сборку.',
  ] },
  4: { pattern: 'subagents', why: [
    'Нет: три расследования, каждое с чтением кода и повторным запуском теста, переполнили бы ваш диалог, а нужно только то, что нашло каждое.',
    'Нет: каждый исследователь проверяет одного подозреваемого и докладывает вам, а взвешиваете результаты вы.',
    'Нет: три проверки выполняются один раз, и результаты вы оцениваете сами.',
    'Нет: проверки не меняют код, они возвращают то, что нашли.',
  ] },
  5: { pattern: 'batch', why: [
    'Нет: изменение каждого пакета прошло бы через один диалог.',
    'Нет: каждый пакет переводится отдельно.',
    'Нет: она выполняется один раз, и изменение каждого пакета подтверждают его собственные тесты.',
    'Да: одно большое изменение, которое делится на пакеты, и каждый собирается, тестируется и вливается отдельно, в своём worktree.',
  ] },
};
const NUMBERS = Object.keys(JOBS).map(Number);

const SEPARATOR = '[:.)|\\-\\u2013\\u2014]';
const JOB_LINE = new RegExp(`^(?:(?:job|задача|задание)\\s*#?\\s*([1-5])(?!\\d)\\s*${SEPARATOR}*|#?([1-5])(?!\\d)\\s*${SEPARATOR}+)\\s*(.*)$`, 'i');

const and = (list) => (list.length > 1 ? `${list.slice(0, -1).join(', ')} и ${list.at(-1)}` : list[0]);

// The choice lines in the file, by job number. `1: subagents because ...`,
// `Job 1 - Subagents`, `- **2:** dynamic workflow`, `3. main session`,
// `4) agent teams` and a table row `| 4 | agent team | ... |` all count. A
// line's pattern is null when its text starts with none of the four, and
// `start` keeps that text's first words for the hint.
export function readChoices(text) {
  const jobs = new Map(NUMBERS.map((n) => [n, []]));
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/[*_`]/g, '')
      .replace(/^\s*(?:[-+>|(]\s*|#{1,6}\s+|\[[ xX]\]\s*)*/, '')
      .replace(/^\d+[.)]\s+(?=job\b)/i, '')
      .trim();
    const match = line.match(JOB_LINE);
    if (!match) continue;
    const rest = match[3].replace(/^["'([\s]+/, '').replace(/^(?:an?|the)\s+/i, '');
    const found = PATTERNS.find(([, pattern]) => pattern.test(rest));
    const start = rest.replace(/\s+(?:because\b|потому что|так как|,\s*потому).*$/i, '').split(/\s+/).filter(Boolean).slice(0, 4).join(' ');
    jobs.get(Number(match[1] ?? match[2])).push({ pattern: found ? found[0] : null, start });
  }
  return jobs;
}

function wrongPick(n, chosen) {
  const { pattern, why } = JOBS[n];
  const at = PATH[chosen].findIndex((answer, i) => answer !== PATH[pattern][i]);
  return `Для задачи ${n} не подходит схема ${LABEL[chosen]}. ${QUESTIONS[at]} ${why[at]} Ей нужна схема ${LABEL[pattern]}.`;
}

// Subagent starts in lesson 6's log, one per line: the hook writes each
// subagent's type (`agent_type`). A line that names lesson 6's own subagent
// came from that lesson, so job 1's starts are the other lines. A hook that
// also logs an id, `agent_id<TAB>agent_type`, counts each id once, as a
// resumed subagent logs its id again.
export function startedAgents(text) {
  const ids = new Map();
  let unnamed = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const tab = line.indexOf('\t');
    const id = tab === -1 ? '' : line.slice(0, tab).trim();
    const type = (tab === -1 ? line : line.slice(tab + 1)).trim();
    if (type === EARLIER) continue;
    if (id) ids.set(id, (ids.get(id) ?? 0) + 1);
    else unnamed += 1;
  }
  return { ids, count: ids.size + unnamed };
}

export const fittingPatterns = {
  text: `в \`${CHOICES}\` для каждой задачи выбрана самая дешёвая подходящая схема`,
  local: true,
  check(repo) {
    const text = repo.read(CHOICES);
    if (text === null) return `Файла \`${CHOICES}\` нет. Напишите в нём по одной строке на задачу, ${FORMAT}, где каждая схема — это ${NAMES}.`;
    const jobs = readChoices(text);
    if ([...jobs.values()].every((lines) => !lines.length)) return `В \`${CHOICES}\` нет ни одной строки, которая начинается с номера задачи. Напишите по одной строке на задачу, ${FORMAT}, где каждая схема — это ${NAMES}.`;
    const missing = [...jobs].filter(([, lines]) => !lines.length).map(([n]) => n);
    const problems = missing.length ? [`В \`${CHOICES}\` нет строки для ${missing.length > 1 ? 'задач' : 'задачи'} ${and(missing)}. Добавьте по одной на задачу в виде ${FORMAT}.`] : [];
    for (const [n, lines] of jobs) {
      if (!lines.length) continue;
      const picked = [...new Set(lines.map((l) => l.pattern).filter(Boolean))];
      if (!picked.length) {
        const { start } = lines[0];
        problems.push(start ? `Строка задачи ${n} начинается с «${start}», а это не одна из схем. Сразу после номера задачи напишите ${NAMES}.` : `Строка задачи ${n} не называет схему. Сразу после номера задачи напишите ${NAMES}.`);
      } else if (picked.length > 1) {
        problems.push(`У задачи ${n} есть строки с разными схемами: ${and(picked.map((p) => LABEL[p]))}. Оставьте одну строку на задачу.`);
      } else if (picked[0] !== JOBS[n].pattern) {
        problems.push(wrongPick(n, picked[0]));
      }
    }
    return problems.length ? problems.join(' ') : true;
  },
};

export const parallelSubagents = {
  text: `\`${LOG}\` показывает, что для задачи 1 запустились как минимум два субагента, кроме \`${EARLIER}\``,
  local: true,
  check(repo) {
    const text = repo.read(LOG);
    if (text === null) {
      return repo.exists(HOOK)
        ? `Файла \`${LOG}\` нет. Запустите сессию командой ${HOOKED}, затем выполните задачу 1.`
        : `Файла \`${LOG}\` нет. Сохраните файл hook из урока 6 среднего уровня как \`${HOOK}\`, затем выполните задачу 1 в сессии, запущенной командой ${HOOKED}.`;
    }
    const { count } = startedAgents(text);
    if (count >= 2) return true;
    if (!text.trim()) return `\`${LOG}\` пуст. Команда hook создаёт файл до запуска \`jq\`, поэтому проверьте, что работает \`jq --version\`, затем снова выполните задачу 1 в сессии, запущенной командой ${HOOKED}.`;
    const seen = count === 1 ? 'запуск только одного субагента' : `только \`${EARLIER}\` из урока 6`;
    return `\`${LOG}\` показывает ${seen}, а задаче 1 нужно как минимум два субагента. В сессии, запущенной командой ${HOOKED}, попросите по одному субагенту на файл, параллельно.`;
  },
};

export const items = [fittingPatterns, parallelSubagents];
