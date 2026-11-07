// Turn a repeated workflow into a skill (Intermediate, lesson 1). The Learner
// finishes the partial tdd skill so it runs by name and loads on its own,
// commits it, and saves the commit they made after reviewing a /tdd run's
// diff. Whether Claude loaded the skill on its own, and kept it out of a
// question, shows only in a session, so the lesson self-checks it.
import { frontmatter } from '../frontmatter.mjs';
import { isTestFile } from '../paths.mjs';

export const title = 'Превращаем повторяющийся процесс в skill';

const SKILL = '.claude/skills/tdd/SKILL.md';
const SAVE_COMMIT = '`git rev-parse HEAD > .practice/i-1-commit.txt`';

function committedSkill(repo) {
  try {
    return repo.git('show', `HEAD:${SKILL}`);
  } catch {
    return null;
  }
}

function missing(repo) {
  if (repo.exists(SKILL)) return `${SKILL} не закоммичен. Выполните \`git add ${SKILL}\` и закоммитьте его.`;
  return `Нет файла ${SKILL}. Сохраните туда заготовку skill из раздела «Ваша очередь», доработайте её и закоммитьте.`;
}

export const items = [
  {
    text: '`.claude/skills/tdd/SKILL.md` закоммичен, и TODO в нём не осталось',
    check(repo) {
      const text = committedSkill(repo);
      if (text === null) return missing(repo);
      const todo = text.split(/\r?\n/).flatMap((line, i) => (/\bTODO\b/.test(line) ? [i + 1] : []));
      if (!todo.length) return true;
      return `В закоммиченном skill всё ещё есть TODO в строк${todo.length > 1 ? 'ах' : 'е'} ${todo.join(', ')}. Напишите описание и шаги Green и Refactor, затем снова закоммитьте файл.`;
    },
  },
  {
    text: 'skill tdd запускается как `/tdd` и подгружается сам: есть описание и нет `disable-model-invocation: true`',
    check(repo) {
      const text = committedSkill(repo);
      if (text === null) return missing(repo);
      const fm = frontmatter(text);
      if (!fm) return `${SKILL} должен начинаться с frontmatter между двумя строками ---.`;
      const { fields } = fm;
      if (String(fields['disable-model-invocation']) === 'true') return 'Удалите строку `disable-model-invocation: true` и закоммитьте снова: она не даёт Claude подгружать skill самому.';
      if (String(fields['user-invocable']) === 'false') return 'Удалите строку `user-invocable: false` и закоммитьте снова: она не даёт `/tdd` запускать skill.';
      if (typeof fields.name === 'string' && fields.name && fields.name !== 'tdd') return `В frontmatter указано имя «${fields.name}», поэтому skill запускается как /${fields.name}, а не /tdd. Укажите \`name: tdd\` или удалите строку.`;
      const description = typeof fields.description === 'string' ? fields.description.trim() : '';
      const words = description.split(/\s+/).filter((w) => w && w !== 'TODO').length;
      if (words < 8) return 'Напишите описание в одно-два предложения: что делает skill и когда Claude должен его использовать.';
      return true;
    },
  },
  {
    text: 'коммит из `.practice/i-1-commit.txt` меняет тест и код, который он проверяет',
    local: true,
    check(repo) {
      const saved = repo.read('.practice/i-1-commit.txt');
      if (saved === null || !saved.trim()) return `Когда проверите и закоммитите тест и код из запуска /tdd, выполните ${SAVE_COMMIT}.`;
      const sha = saved.trim().split(/\s+/)[0];
      let files;
      try {
        files = repo.git('show', '--name-only', '--format=', sha).split('\n').filter(Boolean);
      } catch {
        return `\`.practice/i-1-commit.txt\` называет ${sha}, но такого коммита в этом репозитории нет.`;
      }
      const tests = files.filter(isTestFile);
      const code = files.filter((f) => !isTestFile(f) && !/\.md$/i.test(f) && !f.startsWith('.claude/'));
      if (tests.length && code.length) return true;
      return `В этом коммите должны быть тест и проверяемый им код. Запустите /tdd, проверьте дифф, закоммитьте оба, затем выполните ${SAVE_COMMIT}.`;
    },
  },
];
