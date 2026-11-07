// Pick the model and effort (Intermediate, lesson 3). The Learner fills in
// the model and effort of a skill for a routine, precisely described task,
// and commits the entry a /changelog run wrote. Picking the model and effort
// for other tasks is judgement, self-checked here and at the capstone.
import { frontmatter } from '../frontmatter.mjs';

export const title = 'Выбираем модель и effort';

const SKILL = '.claude/skills/changelog/SKILL.md';
const SMALL = /^(sonnet|claude-sonnet-[\w.-]+)(\[1m\])?$|^(haiku|claude-haiku-[\w.-]+)$/;
const LARGE = /^(opus|fable|best|opusplan|claude-opus-[\w.-]+|claude-fable-[\w.-]+)(\[1m\])?$/;
const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'];

function committed(repo, path) {
  try {
    return repo.git('show', `HEAD:${path}`);
  } catch {
    return null;
  }
}

export const items = [
  {
    text: 'закоммиченный skill changelog использует модель поменьше с effort low или medium',
    check(repo) {
      const text = committed(repo, SKILL);
      if (text === null) return repo.exists(SKILL) ? `${SKILL} не закоммичен. Выполните \`git add ${SKILL}\` и закоммитьте его.` : `Нет файла ${SKILL}. Сохраните туда заготовку skill из раздела «Ваша очередь».`;
      const fields = frontmatter(text)?.fields ?? {};
      const model = String(fields.model ?? '').trim();
      const effort = String(fields.effort ?? '').trim();
      if (!model || model === 'TODO') return 'Укажите в skill строку `model:` с псевдонимом модели, которая нужна этой задаче, например `haiku`.';
      if (LARGE.test(model)) return `\`model: ${model}\` выбирает модель крупнее, чем нужно этой задаче: изменение, которое можно точно описать, это рутинная работа. Используйте \`haiku\` там, где он означает Haiku 5.5, как в Anthropic API, или \`sonnet\`.`;
      if (!SMALL.test(model)) return `\`model: ${model}\`: это не псевдоним и не имя модели, которые знает Claude Code. Используйте \`sonnet\` или \`haiku\`.`;
      if (!LEVELS.includes(effort)) return `Укажите в \`effort:\` одно из значений: ${LEVELS.join(', ')}.`;
      if (LEVELS.indexOf(effort) > 1) return `\`effort: ${effort}\` требует больше усилий, чем нужно рутинному изменению, которое вы проверите сами. Используйте \`low\` или \`medium\`.`;
      return true;
    },
  },
  {
    text: 'в закоммиченном CHANGELOG.md есть запись под `## Unreleased`',
    check(repo) {
      const text = committed(repo, 'CHANGELOG.md');
      const hint = 'Добавьте в индекс небольшое изменение, выполните `/changelog` и закоммитьте изменение вместе с записью, которую он сделает.';
      if (text === null) return `Закоммиченного CHANGELOG.md нет. ${hint}`;
      const lines = text.split(/\r?\n/);
      // Keep a Changelog writes the heading `## [Unreleased]`: a learner's own
      // changelog may already hold it, and the entry goes under it.
      const at = lines.findIndex((l) => /^##\s+(\[Unreleased\]|Unreleased\b)/i.test(l.trim()));
      if (at === -1) return `В CHANGELOG.md нет заголовка \`## Unreleased\`. ${hint}`;
      const next = lines.slice(at + 1).findIndex((l) => /^#{1,2}\s/.test(l));
      const section = lines.slice(at + 1, next === -1 ? undefined : at + 1 + next);
      return section.some((l) => /^\s*[-*]\s+\S/.test(l)) ? true : `Под \`## Unreleased\` в CHANGELOG.md нет записи. ${hint}`;
    },
  },
];
