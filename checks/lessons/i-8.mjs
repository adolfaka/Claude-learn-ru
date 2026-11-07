// Install and manage plugins (Intermediate, lesson 8). The Learner installs a
// language server, then trials its code intelligence plugin at local scope
// (the code intelligence page's order: the binary, the plugin, then a check
// that the server starts), enables a plugin from one of
// Anthropic's marketplaces for the whole project, in the committed
// .claude/settings.json, installs it at project scope, and saves
// `claude plugin list --json` so the check can see both installs.
import { realpathSync } from 'node:fs';

export const title = 'Устанавливаем плагины и управляем ими';

const ANTHROPIC = ['claude-plugins-official', 'claude-community', 'claude-code-plugins'];
const SAVE = '`claude plugin list --json > .practice/i-8-plugins.json`';

// Whether an install's projectPath is this repository: true or false when the
// path exists on this machine, null when it doesn't (a list saved elsewhere).
function here(projectPath, dir) {
  try {
    return realpathSync(projectPath) === realpathSync(dir);
  } catch {
    return null;
  }
}

// The plugins the committed settings turn on, every marketplace's, or null
// when there is no committed settings file that parses.
function committedPlugins(repo) {
  try {
    const value = JSON.parse(repo.git('show', 'HEAD:.claude/settings.json'));
    return Object.entries(value?.enabledPlugins ?? {}).filter(([, on]) => on === true).map(([id]) => id);
  } catch {
    return null;
  }
}

function projectPlugins(repo) {
  return committedPlugins(repo)?.filter((id) => ANTHROPIC.includes(id.split('@')[1])) ?? null;
}

// The saved plugin list's installs, or a FAIL message.
function savedList(repo) {
  const text = repo.read('.practice/i-8-plugins.json');
  if (text === null) return `В репозитории выполните ${SAVE}.`;
  try {
    const list = JSON.parse(text);
    return Array.isArray(list) ? list : list?.installed ?? [];
  } catch {
    return `.practice/i-8-plugins.json — не JSON. Выполните ${SAVE} снова, из корня репозитория.`;
  }
}

export const items = [
  {
    text: 'закоммиченный `.claude/settings.json` включает плагин из одного из marketplace Anthropic',
    check(repo) {
      const ids = projectPlugins(repo);
      if (ids === null) return 'Нет закоммиченного .claude/settings.json, который читается как JSON. Добавьте запись `enabledPlugins` из урока и закоммитьте.';
      return ids.length ? true : `Его \`enabledPlugins\` не включает ни одного плагина из marketplace Anthropic. Добавьте \`"claude-code-setup@claude-plugins-official": true\`.`;
    },
  },
  {
    text: '`.practice/i-8-plugins.json`, сохранённый в этом репозитории, показывает, что этот плагин установлен на уровне проекта и включён',
    local: true,
    check(repo) {
      const list = savedList(repo);
      if (typeof list === 'string') return list;
      const ids = projectPlugins(repo) ?? [];
      // The list holds project-scope installs for every project on the machine,
      // and projectEnabled reflects the settings of the folder it ran in, so an
      // install counts only when its projectPath is this repository.
      const ok = list.some((p) => ids.includes(p?.id) && p.scope === 'project' && p.enabled === true && p.projectEnabled === true && here(p.projectPath, repo.dir) !== false);
      return ok ? true : `Сохранённый список не показывает плагин на уровне проекта в этом репозитории. Установите его с \`--scope project\`, затем снова сохраните список.`;
    },
  },
  {
    text: 'плагин code intelligence, который вы пробовали, установлен здесь на локальном уровне, а закоммиченные настройки его не включают',
    local: true,
    check(repo) {
      const list = savedList(repo);
      if (typeof list === 'string') return list;
      const trials = list.filter((p) => /-lsp@/.test(p?.id ?? '') && p.scope === 'local' && here(p.projectPath, repo.dir) !== false);
      if (!trials.length) return 'Сохранённый список не показывает ни одного плагина code intelligence на локальном уровне. Установите, например, `typescript-lsp` только для этого репозитория.';
      const shared = trials.map((p) => p.id).filter((id) => (committedPlugins(repo) ?? []).includes(id));
      return shared.length < trials.length ? true : `${shared.join(', ')} включён в общих настройках, поэтому вашу пробу получит каждый коллега. Уберите его из \`enabledPlugins\`.`;
    },
  },
];
