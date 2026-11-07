// Install, sign in and look around (Beginner, lesson 1). The check runs
// `claude --version` itself, and reads the onboarding note the Learner
// corrects against the code in Your turn.
import { spawnSync } from 'node:child_process';

export const title = 'Установка, вход и первый осмотр';

// The longest `claude --version` may run, in milliseconds.
export const VERSION_LIMIT = 30_000;

const VERSION = /^\d+\.\d+\.\d+ \(Claude Code\)/m;
const FIX_PATH = 'Откройте новый терминал. Если ошибка останется, исправьте PATH по шагу 2 разбора на примере в уроке 1 и повторите.';

export const claudeVersion = {
  text: '`claude --version` выводит версию Claude Code',
  // It runs on the Learner's machine: a GitHub runner has no Claude Code.
  local: true,
  check(repo) {
    // On Windows, `claude` can be an npm shim, which only a shell can start.
    const run = spawnSync('claude', ['--version'], { cwd: repo.dir, encoding: 'utf8', shell: process.platform === 'win32', timeout: VERSION_LIMIT });
    if (run.error?.code === 'ENOENT') return `Проверка не нашла \`claude\` в PATH оболочки, в которой её запустили. ${FIX_PATH}`;
    if (run.error?.code === 'ETIMEDOUT') return `\`claude --version\` не завершилась за ${VERSION_LIMIT / 1000} секунд. Запустите её отдельно и посмотрите, чего она ждёт.`;
    if (run.error) return `Проверка не смогла запустить \`claude --version\`: ${run.error.message}`;
    const out = `${run.stdout ?? ''}`;
    if (run.status === 0 && VERSION.test(out)) return true;
    const said = `${out}\n${run.stderr ?? ''}`.trim().split(/\r?\n/)[0] ?? '';
    return `\`claude --version\` вывела ${said ? `«${said.slice(0, 120)}»` : 'пустую строку'}${run.status ? ` и завершилась с кодом ${run.status}` : ''}, а не строку вида \`2.1.0 (Claude Code)\`. ${FIX_PATH}`;
  },
};

export const NOTE = 'practice/b-1/onboarding.md';

// The note's one wrong claim: src/cli.js exits with 1 when it finds a broken
// link (and 2 on a bad linkcheck.json), so linkcheck can fail a CI job. A
// claim is stale when it pairs exit code 0 with broken links, or says
// linkcheck can't fail a CI job; it is corrected when it pairs 1, or a
// non-zero code, with broken links. Each pairing is read within one part of a
// sentence, so "1 when it finds a broken link and 0 when every link resolves"
// is right and "1 when every link resolves and 0 when it finds broken links"
// is wrong.
// Each pattern also reads the Russian note: `\b` sees no word edge next to a
// Cyrillic letter, so the Russian alternatives use (?<![а-яё]) and (?![а-яё]).
const EXIT = /\bexit|\breturns?\b|\bstatus\b|\bcode\s+\d|\bnon-?zero\b|\bCI\b|заверш|(?<![а-яё])выход|возвращ|(?<![а-яё])код[а-яё]*\s+(?:\d|выхода|возврата|завершения)|ненулев/i;
const CANT_FAIL = /\b(?:can(?:not|['’]t)|never|won['’]t|will not|does(?:n['’]t| not))\s+fail\s+(?:a\s+|the\s+|any\s+|your\s+)?(?:CI|build|pull request|PR)\b|(?<![а-яё])не\s+(?:(?:может|сможет|способен|будет)\s+)?(?:(?:сам|сама|само)\s+по\s+себе\s+)?(?:провал|завал|урон|рон|вал)[а-яё]*\s+(?:[а-яё-]+\s+){0,2}?(?:CI|PR|сборк|пул)/i;
const NONZERO = /\b(?:not|other than|anything but)\s+(?:0|zero)\b|\bnon-?zero\b|ненулев[а-яё]*|(?<![а-яё])(?:не|кроме)\s+(?:0|ноля|нуля|ноль|нуль)(?![\w.а-яё])|отличн[а-яё]*\s+от\s+(?:0|нуля|ноля)(?![\w.а-яё])/gi;
const NOT_BROKEN = /\b(?:no|without|not a single)\s+(?:[\w-]+\s+){0,3}?(?:broken|dead|missing)\b|(?<![\w.])(?:0|zero)\s+broken\b|\b(?:none|nothing)\s+(?:[\w-]+\s+){0,2}?(?:is|are)\s+(?:broken|dead|missing)\b|\b(?:isn['’]t|aren['’]t|is not|are not)\s+(?:broken|dead|missing)\b|(?<![а-яё])(?:нет|без|ни\s+одной|ни\s+одна|ни\s+одного)\s+(?:[а-яё-]+\s+){0,3}?(?:бит|сломан|неработ|м[её]ртв)[а-яё]*|(?<![\w.])(?:0|ноль)\s+(?:бит|сломан)[а-яё]*|(?<![а-яё])(?:бит|сломан)[а-яё]*\s+(?:ссыл[а-яё]*\s+)?нет(?![а-яё])|(?<![а-яё])не\s+(?:бит|сломан|м[её]ртв)[а-яё]*/gi;
// A broken link, but not a missing linkcheck.json, which gives 0.
const BROKEN = /\bbroken\b|\bdead\b|\b(?:target|file|page)s?\s+(?:[\w-]+\s+){0,2}?(?:is|are)\s+missing\b|\bmissing\s+(?:target|file|page)|\bdoes(?:n['’]t| not) exist\b|(?<![а-яё])бит[аоуыеи]|(?<![а-яё])сломан|неработающ|(?<![а-яё])м[её]ртв|(?<![а-яё])(?:цел|файл)[а-яё]*\s+(?:[а-яё-]+\s+){0,2}?(?:отсутству|не\s+существу)/i;
const ZERO = /(?<![\w.])(?:0|zero)(?![\w.])|(?<![а-яё])(?:ноль|нуль|ноля|нуля|нол[её]м|нул[её]м|нулев[а-яё]*)(?![а-яё])/i;
const ONE = /(?<![\w.])1(?![\w.])|\bNONZERO\b|(?<![а-яё])единиц[а-яё]*/i;
// "0 unless it finds a broken link" gives broken links a non-zero code.
const ZERO_UNLESS = /(?<![\w.])(?:0|zero)(?![\w.])[^.;:]*?\bunless\b[^.;:]*?\b(?:broken|dead|missing)\b|(?<![\w.а-яё])(?:0|ноль|нул[а-яё]*)(?![\w.а-яё])[^.;:]*?(?:если\s+только\s+не|если\s+не|пока\s+не|кроме\s+случа[а-яё]+,?\s+когда)\s+[^.;:]*?(?:бит|сломан|м[её]ртв)/gi;
const ONLY_IF = /\bonly (?:when|if)\b|(?<![а-яё])только\s+(?:если|когда|при)(?![а-яё])/i;
const ALL_RESOLVE = /\b(?:all|every)\s+(?:[\w-]+\s+){0,2}?(?:links?|targets?)\s+(?:resolves?|exists?|works?|(?:is|are) fine)\b|(?<![а-яё])(?:все|вс[её]х|каждая|каждой)\s+(?:[а-яё-]+\s+){0,2}?(?:ссылк|цел)[а-яё]*\s+(?:[а-яё]+\s+)?(?:в\s+порядке|рабоч|целы|ведут|существу|разреша|работа)/i;
// Where one part of a sentence ends and the next begins: a comma only when a
// new code follows it, as in "1 when ..., 0 when ...".
const PART = /[;:!?()\[\]–—]|\.(?=\s|$)|,(?=\s*`?(?:\d+|zero|code|exit)\b)|\b(?:and|but|while|whereas|otherwise|else|so|then|unless)\b|,(?=\s*(?:с\s+)?`?(?:\d+|ноль|нул|код|заверш|выход))|(?<![а-яё])(?:и|но|а|иначе|поэтому|тогда|зато|однако|в\s+остальных\s+случаях)(?![а-яё])/i;

// The note's claims, one per list item or paragraph, each on one line, so a
// claim wrapped over several lines still reads as one. Struck-through text
// (`~~like this~~`) is left out: it is what the claim no longer says.
function claims(text) {
  return text
    .split(/\r?\n(?=\s*(?:[-*+]|\d+[.)])\s)|\r?\n\s*\r?\n/)
    .map((claim) => claim.replace(/~~[^~]*~~/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

// How a claim pairs exit codes with broken links: 'stale' if any part gives
// them 0 or the claim says linkcheck can't fail CI, 'right' if a part gives
// them 1 or a non-zero code, or gives 0 only to a run with none, otherwise
// null.
export function exitClaim(claim) {
  if (CANT_FAIL.test(claim)) return 'stale';
  let right = false;
  let zeroWhenNone = false;
  let failing = false;
  const rest = claim.replace(ZERO_UNLESS, () => { right = true; return ' . '; });
  for (const raw of rest.split(PART)) {
    const coded = (raw ?? '').replace(NONZERO, ' NONZERO ');
    const none = coded.search(NOT_BROKEN) >= 0 || ONLY_IF.test(coded) || ALL_RESOLVE.test(coded);
    const part = coded.replace(NOT_BROKEN, ' resolves ');
    if (ONE.test(part)) failing = true;
    if (!BROKEN.test(part)) {
      if (none && ZERO.test(part)) zeroWhenNone = true;
      continue;
    }
    if (ZERO.test(part)) return 'stale';
    if (ONE.test(part)) right = true;
  }
  // "0 when no link is broken and 1 otherwise", or "0 only when every link resolves".
  if (zeroWhenNone && (failing || ONLY_IF.test(rest))) right = true;
  return right ? 'right' : null;
}

export const noteCorrected = {
  text: 'утверждение в `practice/b-1/onboarding.md`, которому противоречит код, исправлено',
  check(repo) {
    const text = repo.read(NOTE);
    if (text === null) {
      if (!repo.exists('checks/run.mjs')) return `В этой папке нет \`${NOTE}\`: в «Вашей очереди» используется заметка из учебной копии. Запустите \`npm run check -- b-1\` там, без \`--dir\`.`;
      return `Файл \`${NOTE}\` пропал. Верните его командой \`git checkout HEAD -- ${NOTE}\` и исправьте одно утверждение, которому противоречит код.`;
    }
    const exits = claims(text).filter((claim) => EXIT.test(claim) || CANT_FAIL.test(claim));
    const stale = exits.find((claim) => exitClaim(claim) === 'stale');
    if (stale) return `В заметке всё ещё написано: «${stale.replace(/^[-*+]\s+/, '').replace(/[.\s]+$/, '').slice(0, 160)}». Спросите Claude, какой файл решает, с каким кодом завершается linkcheck, сами откройте эту строку и напишите, что делает код.`;
    if (!exits.some((claim) => exitClaim(claim) === 'right')) return 'Ни одна строка заметки не говорит, с каким кодом завершается linkcheck при битой ссылке. Откройте строку, которую для этого указал Claude, и впишите этот код в утверждение: от него зависит CI.';
    return true;
  },
};

export const items = [claudeVersion, noteCorrected];
