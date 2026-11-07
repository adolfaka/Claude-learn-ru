// Project memory with CLAUDE.md (Beginner, lesson 5). The Learner commits a
// CLAUDE.md with a header rule for the JavaScript in src/, a later session
// commits a new file that follows it, and the Learner sorts the lesson's four
// notes into the project's CLAUDE.md, a gitignored CLAUDE.local.md and their
// user file. The check reads only what git holds, so it gives the same answer
// on the Learner's machine, in the progress run and on the solutions branch:
// what CLAUDE.local.md says is the Self-check's.
import { committedIgnore, ignoreHint } from '../ignore.mjs';
import { isTestFile } from '../paths.mjs';

export const title = 'Память проекта в CLAUDE.md';

const MEMORY_PATHS = ['CLAUDE.md', '.claude/CLAUDE.md'];
const LOCAL = 'CLAUDE.local.md';
// The Russian lesson's rule: «… начинается со строки `…`».
const RULE = /(?:starts with the line|начина[а-яё]*\s+со?\s+строк[а-яё]*)\s+`([^`]+)`/i;
// What the notes' two personal lines say, lowercased.
const PERSONAL = ['linkcheck-docs', 'summary at the end', 'резюме в конце'];
// The files the rule covers: JavaScript in src/, not tests. Hooks, settings
// and other files later lessons commit are left out, so they can't undo a pass.
const isSource = (f) => /^src\/.+\.[cm]?js$/i.test(f) && !isTestFile(f);
// `npm run <script>`, with any options before the script's name skipped.
const NPM_RUN = /npm run(?:-script)?(?:\s+--?[\w-]+(?:=\S+)?)*\s+([A-Za-z0-9:._][A-Za-z0-9:._-]*)/g;

// The committed project CLAUDE.md: its path and text at HEAD.
function committedMemory(repo) {
  for (const path of MEMORY_PATHS) {
    try {
      return { path, text: repo.git('show', `HEAD:${path}`) };
    } catch { /* not in the last commit */ }
  }
  return null;
}

// The header rule in the committed CLAUDE.md: the line it names, and whether
// it says it covers `src/`. A rule scoped to src/ wins over a broader one.
function rule(repo) {
  const memory = committedMemory(repo);
  const found = (memory?.text.split(/\r?\n/) ?? [])
    .map((text) => ({ text, match: text.match(RULE) }))
    .filter((l) => l.match);
  const best = found.find((l) => l.text.includes('src/')) ?? found[0];
  return best ? { memory, line: best.match[1].trim(), scoped: best.text.includes('src/') } : { memory, line: null };
}

// The commit that first put the rule's line into the project CLAUDE.md.
function ruleCommit(repo, memory, line) {
  const shas = repo.git('log', '--reverse', '--format=%H', '-S', line, '--', memory.path).split('\n').filter(Boolean);
  return shas[0] ?? null;
}

// The commits after `since`, newest first, that add JavaScript files to src/,
// each as `{ sha, sources }`.
function addingSources(repo, since) {
  const log = repo.git('log', '--diff-filter=A', '--name-only', '--format=%x00%H', `${since}..HEAD`);
  return log.split('\0').filter((c) => c.trim())
    .map((c) => c.split('\n').map((l) => l.trim()).filter(Boolean))
    .map(([sha, ...files]) => ({ sha, sources: files.filter(isSource) }))
    .filter((c) => c.sources.length);
}

const firstLine = (repo, sha, path) => repo.git('show', `${sha}:${path}`).replace(/^﻿/, '').split(/\r?\n/)[0].trim();

function scripts(repo) {
  let text;
  try {
    text = repo.git('show', 'HEAD:package.json');
  } catch {
    text = repo.read('package.json');
  }
  try {
    return new Set(Object.keys(JSON.parse(text ?? '{}').scripts ?? {}));
  } catch {
    return null;
  }
}

const succeeds = (fn) => {
  try {
    fn();
    return true;
  } catch {
    return false;
  }
};

export const items = [
  {
    text: 'в закоммиченном CLAUDE.md есть правило, что каждый новый файл JavaScript в `src/` начинается с заданной строки',
    check(repo) {
      const { memory, line, scoped } = rule(repo);
      if (!memory) return 'Закоммиченного CLAUDE.md нет. Выполните `/init`, отредактируйте то, что он написал, затем выполните `git add CLAUDE.md` и закоммитьте.';
      if (!line) return 'В закоммиченном CLAUDE.md нет строки вроде ``- Каждый новый файл JavaScript в `src/` начинается со строки `// SPDX-License-Identifier: MIT`.``. Добавьте её под `## Conventions` и снова закоммитьте CLAUDE.md.';
      return scoped ? true : `Правило для \`${line}\` не говорит, к каким файлам оно относится. Ограничьте его словами «Каждый новый файл JavaScript в \`src/\`» и закоммитьте CLAUDE.md: такая первая строка может сломать скрипт оболочки или JSON.`;
    },
  },
  {
    text: 'коммит, сделанный после этого правила, добавляет файлы JavaScript в `src/`, и каждый из них начинается со строки из правила',
    check(repo) {
      const { memory, line } = rule(repo);
      if (!line) return 'Сначала закоммитьте CLAUDE.md с правилом о первой строке.';
      const since = ruleCommit(repo, memory, line);
      if (!since) return `В git нет коммита, который добавляет \`${line}\` в ${memory.path}. Закоммитьте CLAUDE.md с правилом, затем попросите новую сессию создать новый файл.`;
      const commits = addingSources(repo, since);
      // Any such commit passes, so later work can't turn a finished lesson back.
      const wrongIn = (c) => c.sources.filter((f) => firstLine(repo, c.sha, f) !== line);
      if (commits.some((c) => !wrongIn(c).length)) return true;
      if (!commits.length) {
        const waiting = repo.git('status', '--porcelain', '--untracked-files=all').split('\n')
          .filter((l) => /^(\?\?|A.) /.test(l)).map((l) => l.slice(3))
          .filter(isSource);
        if (waiting.length) return `Ни один коммит после правила не добавляет файл JavaScript в \`src/\`, а эти новые файлы ещё не закоммичены: ${waiting.join(', ')}. Попросите Claude закоммитить их.`;
        return 'Ни один коммит после правила не добавляет файл JavaScript в `src/`. В новой сессии попросите изменение, которое создаёт такой файл, например `src/stats.js` с тестом, и закоммитьте его.';
      }
      const [latest] = commits;
      return `В коммите ${latest.sha.slice(0, 7)} эти новые файлы не начинаются с \`${line}\`: ${wrongIn(latest).join(', ')}. В новой сессии проверьте CLAUDE.md через \`/context all\`, затем попросите другой новый файл и закоммитьте.`;
    },
  },
  {
    text: 'закоммиченный CLAUDE.md содержит правило из заметок об ошибках CLI, а каждый скрипт `npm run`, который он называет, есть в `package.json`',
    check(repo) {
      const memory = committedMemory(repo);
      if (!memory) return 'Закоммиченного CLAUDE.md нет.';
      if (!memory.text.includes('linkcheck:')) return 'В закоммиченном CLAUDE.md нет правила из заметок урока о том, что ошибки CLI начинаются с `linkcheck:`. Добавьте его и закоммитьте CLAUDE.md.';
      const known = scripts(repo);
      if (!known) return 'package.json не разбирается как JSON, поэтому проверка не может прочитать его скрипты.';
      const missing = memory.text.split(/\r?\n/).flatMap((text) => [...text.matchAll(NPM_RUN)]
        .filter((m) => !known.has(m[1])).map((m) => ({ script: m[1], text: text.trim() })));
      if (!missing.length) return true;
      const { script } = missing[0];
      return `Закоммиченный CLAUDE.md называет \`npm run ${script}\`, но в package.json такого скрипта нет. Исправьте или удалите эту строку, затем закоммитьте CLAUDE.md.`;
    },
  },
  {
    text: 'закоммиченный `.gitignore` исключает `CLAUDE.local.md`, git не отслеживает `CLAUDE.local.md`, а в закоммиченном CLAUDE.md нет ни одной из личных заметок',
    check(repo) {
      const memory = committedMemory(repo);
      if (!memory) return 'Закоммиченного CLAUDE.md нет.';
      if (succeeds(() => repo.git('ls-files', '--error-unmatch', '--', LOCAL))) return `git отслеживает \`${LOCAL}\`, а этот файл только ваш. Выполните \`git rm --cached ${LOCAL}\`, добавьте строку \`${LOCAL}\` в \`.gitignore\` и закоммитьте.`;
      if (succeeds(() => { if (!repo.git('ls-tree', '--name-only', 'HEAD', '--', LOCAL)) throw new Error(); })) return `\`${LOCAL}\` всё ещё есть в вашем последнем коммите. Закоммитьте его удаление.`;
      const ignore = committedIgnore(repo, LOCAL);
      if (ignore.problem) return ignoreHint(ignore, LOCAL);
      const personal = PERSONAL.filter((note) => memory.text.toLowerCase().includes(note));
      return personal.length ? `Закоммиченный ${memory.path} всё ещё содержит заметку, которая касается только вас (${personal.map((n) => `«${n}»`).join(', ')}). Перенесите её в \`${LOCAL}\` или в свой пользовательский файл, уберите из ${memory.path} и закоммитьте.` : true;
    },
  },
];
