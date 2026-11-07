# CLAUDE.md

Этот файл — инструкции для Claude Code (claude.ai/code) при работе с кодом в этом репозитории.

## Что это за репозиторий

Русский перевод учебного шаблона к руководству по Claude Code. В нём две независимые части:

- **Учебный проект linkcheck** (`src/`, `test/`, `samples/`): небольшая программа, которая ищет битые относительные ссылки в Markdown. На нём ученик выполняет упражнения.
- **Инфраструктура курса** (`learn/`, `checks/`, `capstone/`, `practice/`, `.github/`): пошаговое приложение, проверки уроков, задания итоговых проектов, материалы для уроков начального уровня (`practice/b-*`) и workflows.

Нужен Node.js >=22. Зависимостей нет, `npm install` не требуется. Код использует ESM.

## Команды

```bash
npm run test                   # тесты linkcheck (test/)
npm run test:checks            # тесты проверок и приложения (checks/test/), долгие
npm run check -- b-1           # проверка одного урока; all — все уроки; --dir <path> — в другой папке
npm run learn                  # учебное приложение; флаги --dir <path>, --calm, --plain
npm run linkcheck -- samples   # linkcheck на папке; код выхода 0, 1 (есть битые ссылки), 2 (неверный конфиг)

# Один файл или один тест
node --test checks/test/learn-content.test.mjs
node --test --test-name-pattern="finds inline links" test/links.test.js
```

У `checks/run.mjs` есть ещё флаги для workflows: `--summary` (таблица Markdown для Progress) и `--assert fail|pass`.

## linkcheck

Поток: `src/cli.js` читает необязательный `linkcheck.json` через `parseConfig` (`src/config.js`) и вызывает `brokenLinks` (`src/check-links.js`), а тот получает ссылки из `findLinks` (`src/links.js`).

- `findLinks` разбирает Markdown построчно регулярным выражением, без настоящего парсера, поэтому покрывает не весь синтаксис.
- Ссылка считается битой, только если она относительная и по её пути, отсчитанному от папки файла со ссылкой, ничего нет. Внешние адреса и якоря не проверяются.
- Тест `reports only the relative links whose file is missing` ожидает ровно одну битую ссылку в `samples/`. Для новых случаев создавайте файлы во временной папке, а не меняйте образцы.

Ошибки из `capstone/beginner-bug.md` (отсутствующая папка из конфига молча пропускается) и `capstone/intermediate-bug.md` (неверная percent-последовательность роняет linkcheck) оставлены намеренно: это упражнения итоговых проектов. Не исправляйте их попутно.

## Инфраструктура курса

Три уровня: начальный (`b-*`), средний (`i-*`) и продвинутый (`a-*`), у каждого свой итоговый проект (`b-capstone`, `i-capstone`, `a-capstone`).

**Проверки.** `checks/lessons/<id>.mjs` экспортирует `title` и `items`. Каждый пункт содержит `text` и `check(repo)`, а `check` возвращает `true` или текст подсказки. Урок регистрируется в `checks/lessons/index.mjs`. Проверки читают репозиторий только через `openRepo` (`checks/repo.mjs`), ничего в нём не меняют и не запускают Claude Code. Пункты с `local: true` читают `.practice/` или установленный CLI: эту папку git игнорирует, поэтому такие пункты работают только локально. Общие помощники лежат рядом, в `checks/`:

- `actions.mjs` — workflows GitHub Actions с `anthropics/claude-code-action` (a-5, итоговый проект продвинутого уровня);
- `claude-args.mjs` — разбор командной строки `claude` так, как её читает Claude Code;
- `frontmatter.mjs` — фронтматтер YAML у skills и субагентов, без библиотеки YAML;
- `hooks.mjs` — hooks из закоммиченных настроек и запуск их скриптов;
- `ignore.mjs` — игнорирует ли закоммиченный `.gitignore` путь (глобальный excludes отключён);
- `marketplace.mjs` — командный marketplace и плагины из него;
- `paths.mjs` — пути из `git status --porcelain`, из файла плана ученика, тестовые файлы;
- `probes.mjs` — git-пробы (worktrees, ветки, слияния, push) для шагов продвинутого уровня без пункта проверки;
- `stub-claude.mjs` — запуск закоммиченного скрипта ученика с заглушкой вместо `claude`, без расхода;
- `workflow-script.mjs` — сохранённые workflows в `.claude/workflows/`;
- `worktrees.mjs` — записи `git worktree list --porcelain`.

**Учебное приложение.** `learn/app.mjs` вызывает `main` из `learn/lib/main.mjs`. Все решения принимает чистая функция `reduce(state, event)` в `learn/lib/flow.mjs`, она возвращает `{ state, effects }`; `main.mjs` только передаёт события и выполняет эффекты. Модули `learn/lib/`:

- `render.mjs` рисует состояние, `screen.mjs` управляет терминалом, `keys.mjs` превращает ввод в события клавиш, `text.mjs` измеряет и переносит текст;
- `verify.mjs` запускает проверки и git в дочерних процессах (через `learn/run-check.mjs`), чтобы не блокировать экран;
- `holds.mjs` и `status.mjs` — чистые функции, которые решают, что значит содержимое файла и вывод `git status` для шага;
- `watch.mjs` следит за файлами копии; где события не приходят, правду даёт опрос в `main.mjs`;
- `store.mjs` сохраняет место ученика в `.practice/learn.json` — единственный файл, который пишет приложение;
- `tiers.mjs` — уровни помощи `guided`, `hinted`, `challenge` и правило их убывания;
- `content.mjs` разбирает файлы уроков (`parseLesson`);
- `copy.mjs` — собственные слова приложения (`TERMS`, функция `pl` для русских числительных);
- `plain.mjs` — вывод `npm run learn` без терминала (в CI, через pipe);
- `caps.mjs` (`LEARN_PLAIN`, `LEARN_CALM`, `--plain`, `--calm`), `theme.mjs`, `art.mjs`, `face.mjs`, `motion.mjs`, `pip/` — возможности терминала, цвета, талисман Pip и анимация.

**Содержимое уроков.** `learn/lessons/<id>.md` разбирает `learn/lib/content.mjs`, есть уроки всех трёх уровней.
- Значение в двойных кавычках — дословная цитата со страницы руководства, значение без кавычек — собственные слова приложения. Не перефразируйте цитаты и не меняйте тип значения без необходимости.
- В собственных словах нельзя называть команду или код, которых нет в цитатах того же шага (`checks/test/learn-content.test.mjs`).
- Подписи шагов (`Worked example step N of M`, `Your turn part N of M`, `Check`, `Warm-up` и другие) читает парсер (`STEP_HEADING` в `content.mjs`), их нельзя переводить.

**Связка проверок и подсказок.** Для каждого сообщения `FAIL` в проверке урока нужен сценарий в `checks/test/ladders/<id>.mjs` и подсказка в разделе `## ladder` файла урока. Это контролирует `checks/test/learn-ladders.test.mjs` для всех уроков, поэтому при новом сообщении `FAIL` меняются три места. Тест считает `return` в `check`, их количество при переводе не меняйте.

**Workflows.** `Progress` запускается на каждый push и никогда не падает. `Assert checks` работает только в репозитории шаблона: там каждая проверка должна падать на `main` и проходить на ветке `solutions`. Поэтому в шаблоне решения упражнений не должны попадать в `main`, а `main` и `solutions` объединяются только через merge, потому что файлы в `.practice/` на `solutions` ссылаются на коммиты по SHA.

## Перевод

Правила перевода, исходный коммит и словари описаны в `.translation/README.md`; коммит оригинала — в `.translation/UPSTREAM_SHA`.

- Переведены: уроки, видимые строки `learn/lib/*.mjs`, подсказки в `checks/`, `README.md`, `capstone/*.md`, шаблон issue.
- Не переводятся: `src/`, `test/`, `samples/` — вывод linkcheck и его тесты остаются на английском.
- Не переводятся подписи шагов в уроках (`Worked example step N of M` и т. п.) — их читает парсер.
- Не переводятся значения `badge` в уроках — это идентификаторы, отображаемое имя значка даёт `copy.mjs`.
- Некоторые строки используются в нескольких местах. Например, сообщение `All relative links resolve.` есть в `src/cli.js`, `capstone/beginner-bug.md`, `learn/lessons/b-capstone.md`, `checks/lessons/b-3.mjs`, `checks/lessons/b-4.mjs` и в нескольких тестах и сценариях `checks/test/`. Перед заменой текста ищите его через `git grep`.
