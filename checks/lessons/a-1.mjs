// Parallel sessions with worktrees (Advanced, lesson 1). The Learner ignores
// .claude/worktrees/ in a committed .gitignore, runs two sessions at once,
// each in a worktree that `claude --worktree <name>` makes there, merges both
// branches and removes the worktrees. A worktree listing saved while both
// existed names the commit each session made. What a fresh worktree lacked,
// and whether .worktreeinclude or the session supplied it, is a decision the
// check can't see, so the lesson self-checks it. The Advanced capstone reuses these items with its own
// listing.
import { execFileSync } from 'node:child_process';
import { committedIgnore, ignoreHint } from '../ignore.mjs';
import { claudeWorktrees, CLAUDE_WORKTREES, liveWorktrees, parseWorktrees } from '../worktrees.mjs';

export const title = 'Параллельные сессии с worktrees';

const SNAPSHOT = '.practice/a-1-worktrees.txt';

const save = (snapshot) => `\`git worktree list --porcelain > ${snapshot}\``;
const short = (sha) => sha.slice(0, 7);
const label = (r) => r.branch ?? short(r.head);
const shell = (path) => (/\s/.test(path) ? `"${path}"` : path);

// Whether a lock is a running Claude Code session's: its reason reads like
// `claude session <name> (pid <n> start <date>)` and that process is alive
// (EPERM means it exists under another user). Unlocking such a worktree
// would pull its folder from under the session. That reason's form is what
// Claude Code wrote in the r27 dry-run, not a documented format, so any
// other lock may still be a session's: its message says to exit one first.
function sessionRunning(reason) {
  const pid = Number(String(reason).match(/^"?claude session\b.*\(pid (\d+)\b/)?.[1]);
  if (!Number.isSafeInteger(pid) || pid < 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

function isCommit(repo, sha) {
  try {
    repo.gitLocal('cat-file', '-e', `${sha}^{commit}`);
    return true;
  } catch {
    return false;
  }
}

// `git merge-base --is-ancestor`, remembered: it exits 1 for "no".
function ancestry(repo) {
  const known = new Map();
  return (a, b) => {
    const key = `${a} ${b}`;
    if (!known.has(key)) {
      try {
        repo.gitLocal('merge-base', '--is-ancestor', a, b);
        known.set(key, true);
      } catch (error) {
        if (error.status !== 1) throw error;
        known.set(key, false);
      }
    }
    return known.get(key);
  };
}

// The patch-ids `git patch-id --stable` gives for a diff or a log with
// patches, one `<patch-id> <commit>` line each.
function patchIds(repo, text) {
  if (!text.trim()) return [];
  const out = execFileSync('git', ['patch-id', '--stable'], { cwd: repo.dir, input: text, encoding: 'utf8', env: { ...process.env, GIT_NO_LAZY_FETCH: '1' }, stdio: ['pipe', 'pipe', 'pipe'] });
  return out.split('\n').filter(Boolean).map((line) => line.split(' ')[0]);
}

// Whether a worktree commit's change is in HEAD: HEAD holds the commit
// itself (a merge or a fast-forward), every commit of its branch as an
// equal patch (a rebase or a cherry-pick), or one commit whose patch is the
// branch's whole change (a squash merge). Remembered per commit.
function integration(repo, isAncestor) {
  const known = new Map();
  return (sha) => {
    if (!known.has(sha)) known.set(sha, isAncestor(sha, 'HEAD') || copied(repo, sha));
    return known.get(sha);
  };
}

function copied(repo, sha) {
  try {
    const base = repo.gitLocal('merge-base', sha, 'HEAD');
    if (!base || base === sha) return false;
    // `git cherry` marks with `-` each commit whose patch HEAD already has.
    const marks = repo.gitLocal('cherry', 'HEAD', sha).split('\n').filter(Boolean);
    if (marks.length && marks.every((line) => line.startsWith('-'))) return true;
    const [whole] = patchIds(repo, `${repo.gitLocal('diff', '--no-color', '--no-ext-diff', base, sha)}\n`);
    if (!whole) return false;
    const log = repo.gitLocal('log', '-p', '--no-color', '--no-ext-diff', '--no-merges', '--format=commit %H', `${base}..HEAD`);
    return patchIds(repo, `${log}\n`).includes(whole);
  } catch {
    return false;
  }
}

// What a saved listing shows: the Claude Code worktrees it lists (with
// `anywhere`, every linked worktree, wherever it is), the two whose commits
// split from each other (a merged pair first, as any two pass), and a hint,
// which is null when both changes of that pair are in HEAD.
function review(repo, snapshot, anywhere = false) {
  const text = repo.read(snapshot);
  if (text === null || !text.trim()) return { worktrees: [], hint: `Пока обе сессии worktree существуют и каждая уже закоммитила, выполните ${save(snapshot)} из основного checkout.` };
  const records = parseWorktrees(text);
  if (!records.length) return { worktrees: [], hint: `\`${snapshot}\` — не список из \`git worktree list --porcelain\`. Пока оба worktrees существуют, сохраните его заново: ${save(snapshot)}.` };
  const worktrees = anywhere ? records.slice(1).filter((r) => !r.bare) : claudeWorktrees(records);
  if (worktrees.length < 2) {
    if (anywhere) return { worktrees, hint: `\`${snapshot}\` ${worktrees.length ? 'перечисляет только один worktree' : 'не перечисляет ни одного worktree'} помимо основного checkout. Дайте каждой сессии собственный worktree и выполните ${save(snapshot)}, пока оба worktrees существуют.` };
    const others = records.slice(1).filter((r) => !r.bare && !worktrees.includes(r));
    const elsewhere = others.length ? ` В нём есть и ${others.map((r) => `\`${r.path}\``).join(', ')}, но проверка учитывает только worktrees, которые создаёт \`claude --worktree <name>\`, — в \`.claude/worktrees/\`.` : '';
    return { worktrees, hint: `\`${snapshot}\` ${worktrees.length ? 'перечисляет только один worktree' : 'не перечисляет ни одного worktree'} в \`.claude/worktrees/\`.${elsewhere} Запускайте каждую сессию командой \`claude --worktree <name>\` и выполните ${save(snapshot)}, пока оба worktrees существуют.` };
  }
  const known = worktrees.filter((r) => r.head && isCommit(repo, r.head));
  if (known.length < 2) {
    const missing = worktrees.find((r) => !known.includes(r));
    const what = missing.head ? `коммит ${short(missing.head)}, которого нет в этом репозитории` : `\`${missing.path}\` без коммита`;
    return { worktrees, hint: `\`${snapshot}\` называет ${what}. Сохраните список из основного checkout этого репозитория, пока его worktrees существуют: ${save(snapshot)}.` };
  }
  const isAncestor = ancestry(repo);
  const inHead = integration(repo, isAncestor);
  const pairs = [];
  for (const [i, a] of known.entries()) {
    for (const b of known.slice(i + 1)) {
      if (a.head !== b.head && !isAncestor(a.head, b.head) && !isAncestor(b.head, a.head)) pairs.push([a, b]);
    }
  }
  if (!pairs.length) return { worktrees, hint: `\`${snapshot}\` сохранён до того, как обе сессии закоммитили: его worktrees указывают на один коммит или один из них — на более ранний коммит другого. Сохраните его заново, прежде чем удалять их: ${save(snapshot)}.` };
  const [{ pair, unmerged }] = pairs
    .map((p) => ({ pair: p, unmerged: p.filter((r) => !inHead(r.head)) }))
    .sort((x, y) => x.unmerged.length - y.unmerged.length);
  if (!unmerged.length) return { worktrees, pair, hint: null };
  const names = unmerged.map(label);
  return { worktrees, pair, hint: `${names.length > 1 ? 'Изменений на' : 'Изменения на'} ${names.map((n) => `\`${n}\``).join(' и ')} пока нет в вашей текущей ветке. Из основного checkout внесите ${names.length > 1 ? 'каждое' : 'его'} так, как принято в вашей команде: ${names.map((n) => `\`git merge ${n}\``).join(', затем ')} или через rebase либо squash merge.` };
}

export const ignoresWorktrees = {
  text: 'закоммиченный `.gitignore` игнорирует `.claude/worktrees/`, но не остальное в `.claude/`',
  check(repo) {
    const worktrees = committedIgnore(repo, '.claude/worktrees/a-1-probe/file');
    if (worktrees.problem) return ignoreHint(worktrees, '.claude/worktrees/');
    const settings = committedIgnore(repo, '.claude/settings.json');
    if (settings.problem || settings.source !== worktrees.source) return true;
    return `Строка ${settings.line} в \`${settings.source}\`, \`${settings.pattern}\`, игнорирует и \`.claude/settings.json\`, поэтому скрыла бы настройки, которые вы коммитите для команды. Игнорируйте только \`.claude/worktrees/\` и закоммитьте.`;
  },
};

// With `anywhere`, as the Advanced capstone asks, a worktree may sit
// anywhere, not only where `claude --worktree` makes it.
export function mergedWorktrees(snapshot, { anywhere = false } = {}) {
  return {
    text: `\`${snapshot}\` перечисляет два worktrees ${anywhere ? 'этого репозитория' : 'в `.claude/worktrees/`'}, чьи коммиты разошлись друг с другом, и оба изменения есть в вашей ветке`,
    local: true,
    check: (repo) => review(repo, snapshot, anywhere).hint ?? true,
  };
}

export function removedWorktrees(snapshot) {
  return {
    text: 'ни одного из этих worktrees больше нет',
    local: true,
    check(repo) {
      const text = repo.read(snapshot);
      if (text === null || !text.trim()) return `Файл \`${snapshot}\` не найден, поэтому проверка не может понять, каких worktrees уже не должно быть. Сохраните его, как сказано в пункте выше.`;
      const { worktrees, pair } = review(repo, snapshot);
      if (!worktrees.length) return `\`${snapshot}\` не перечисляет ни одного worktree в \`.claude/worktrees/\`, поэтому проверка не может понять, каких worktrees уже не должно быть. Сохраните его, как сказано в пункте выше.`;
      // Paths as git printed them: one that isn't on this machine was saved elsewhere.
      const records = liveWorktrees(repo);
      const live = new Map(records.map((r) => [r.path, r]));
      const left = (pair ?? worktrees).map((r) => live.get(r.path)).filter(Boolean);
      if (!left.length) return true;
      // A worktree under the main checkout's .claude/worktrees/, named from
      // there, so a long repository path shows once, not three times.
      const main = records[0]?.path ?? '';
      const named = (p) => (main && p.startsWith(`${main}${CLAUDE_WORKTREES}`) ? p.slice(main.length + 1) : p);
      return left.map((r) => {
        const at = named(r.path);
        const path = shell(at);
        if (r.locked && sessionRunning(r.locked)) return `\`${at}\` всё ещё существует, и сессия Claude Code в нём ещё работает: выполните \`/exit\` в ней, затем \`git worktree remove ${path}\`.`;
        if (r.locked) return `\`${at}\` всё ещё существует и заблокирован: выйдите из сессий Claude Code в нём. Когда ветка будет слита, выполните \`git worktree remove ${path}\`; если git пишет, что он заблокирован, — сначала \`git worktree unlock\`.`;
        if (r.prunable) return `git всё ещё перечисляет \`${r.path}\`, хотя его папки уже нет: выполните \`git worktree prune\`.`;
        return `\`${at}\` всё ещё существует: когда его ветка будет слита, выполните \`git worktree remove ${path}\` из основного checkout.`;
      }).join(' ');
    },
  };
}

export const items = [ignoresWorktrees, mergedWorktrees(SNAPSHOT), removedWorktrees(SNAPSHOT)];
