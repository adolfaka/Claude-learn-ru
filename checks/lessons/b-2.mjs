// Permission modes and plan mode (Beginner, lesson 2). Your turn works the
// ticket in practice/b-2/ticket.md and reviews the plan before approving.
// The Learner saves three snapshots under .practice/: git's status while the
// plan is on screen, the files the plan says it will change, and git's
// status after approving. The snapshots, not the live tree, prove the plan,
// since the Learner commits the change at the end of Your turn. The check
// runs the tool's behaviour itself, from the working tree.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inPlan, planPaths, statusPaths } from '../paths.mjs';

export const title = 'Режимы разрешений и plan mode';

const SAVE_BEFORE = 'Пока план на экране, выполните `git status --porcelain > .practice/b-2-before.txt` в другом терминале.';

// Only the practice template's own tool is run: `--dir` pointed at another
// repository must not execute that repository's src/cli.js.
function notTemplate(repo) {
  try {
    if (JSON.parse(repo.read('package.json') ?? '').name === 'claude-code-practice') return null;
  } catch {
    // Not JSON: not the template either.
  }
  return 'Здесь запускается инструмент linkcheck из шаблона для практики, поэтому запустите проверку в своей копии шаблона: `npm run check -- b-2`.';
}

// Runs the working tree's CLI on a scratch folder holding `files`.
function runTool(repo, files) {
  const work = mkdtempSync(join(tmpdir(), 'b-2-'));
  try {
    const docs = join(work, 'docs');
    mkdirSync(docs);
    for (const [name, text] of Object.entries(files)) writeFileSync(join(docs, name), text);
    return spawnSync(process.execPath, [join(repo.dir, 'src', 'cli.js'), docs], { encoding: 'utf8', timeout: 30_000 });
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

export const items = [
  {
    text: '`.practice/b-2-before.txt`, сохранённый, пока план был на экране, не содержит изменённых файлов',
    local: true,
    check(repo) {
      const before = repo.read('.practice/b-2-before.txt');
      if (before === null) return SAVE_BEFORE;
      const changed = statusPaths(before);
      if (changed.length) return `Файлы изменились ещё до того, как вы одобрили план: ${changed.join(', ')}. Начните с чистого рабочего дерева (закоммитьте их или отложите командой \`git stash push --include-untracked\`) и оставайтесь в plan mode, пока не одобрите план.`;
      return true;
    },
  },
  {
    text: 'каждый файл из `.practice/b-2-after.txt` указан в `.practice/b-2-plan.txt`',
    local: true,
    check(repo) {
      const plan = repo.read('.practice/b-2-plan.txt');
      const after = repo.read('.practice/b-2-after.txt');
      if (plan === null || !plan.trim()) return 'Перед одобрением впишите в `.practice/b-2-plan.txt` файлы, которые изменит план, по одному пути в строке.';
      if (after === null) return 'Когда Claude закончит правки, выполните `git status --porcelain > .practice/b-2-after.txt`.';
      // An empty snapshot is git seeing no edit yet, not a missing save: the
      // learner ran the command, so repeating it reads as stuck (190). It
      // keeps step 7's "or No" so it never says to approve every request,
      // and stays five lines in a 60x20 hint box so the card keeps its Goal
      // and border.
      if (!statusPaths(after).length) return '`.practice/b-2-after.txt` пока не содержит изменённых файлов. Одобрите проверенный план; если Claude Code спрашивает, читайте каждый запрос: Yes, если он в рамках плана, иначе No. Когда `git status` покажет изменения, сохраните снова.';
      const planned = planPaths(plan, repo.dir);
      const extra = statusPaths(after).filter((path) => !inPlan(planned, path));
      if (extra.length) return `Изменены, но не указаны в плане: ${extra.join(', ')}. Сравните одобренный план с тем, что изменил Claude.`;
      return true;
    },
  },
  {
    text: 'Незнакомый ключ в `linkcheck.json`, например `ignores`, заставляет инструмент завершиться с кодом 2 и назвать ключ',
    // The committed change reaches GitHub's progress run, so these two items
    // report there; the snapshots above stay on the Learner's machine.
    check(repo) {
      const refused = notTemplate(repo);
      if (refused) return refused;
      const run = runTool(repo, { 'linkcheck.json': '{ "files": ["."], "ignores": ["vendor/"] }\n' });
      if (run.status !== 2) return `С \`"ignores"\` в \`linkcheck.json\` инструмент завершился с кодом ${run.status}, а не 2. Перечитайте первую просьбу тикета: \`practice/b-2/ticket.md\`.`;
      if (!`${run.stderr}${run.stdout}`.includes('ignores')) return 'Инструмент завершается с кодом 2, но в его ошибке не назван ключ `ignores`. Тикет просит ошибку, которая его называет.';
      return true;
    },
  },
  {
    text: 'Битая ссылка по-прежнему заставляет инструмент завершиться с кодом 1 и сообщить о ссылке',
    check(repo) {
      const refused = notTemplate(repo);
      if (refused) return refused;
      const run = runTool(repo, { 'notes.md': 'See [the setup](missing.md).\n' });
      if (run.status !== 1) return `С битой ссылкой инструмент завершился с кодом ${run.status}, а не 1, поэтому CI прошёл бы с битыми ссылками. Сравните одобренный план с тикетом и скажите Claude, что отменить.`;
      // Node also exits with 1 when the CLI crashes, so the report must be there.
      if (!run.stdout.includes('broken link to missing.md')) return `С битой ссылкой инструмент завершился с кодом 1, но не сообщил \`broken link to missing.md\`, значит, он упал по другой причине: ${run.stderr.split('\n').find((line) => /Error/.test(line))?.trim() ?? 'он не вывел ошибки'}`;
      return true;
    },
  },
];
