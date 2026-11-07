# L-I1: уроки i-1, i-2, i-3, i-4

## Статус

| файл | готово | заметки |
|---|---|---|
| learn/lessons/i-1.md | да | parseLesson ok, форма та же, `](` 5/5, обратные кавычки 116/116, строк 316/316. Два примера промптов в `` `…` `` переведены (`Добавь функцию countHeadings(markdown), сначала тест.`, `Объясни, как isExternal решает, что ссылка внешняя.`), поэтому сами спаны отличаются, а их число то же |
| checks/lessons/i-1.mjs | да | title, 3 text, 11 подсказок; число `return` то же. «line/lines» → `строк${n > 1 ? 'ах' : 'е'}` |
| checks/test/ladders/i-1.mjs | без изменений | сценарии кладут английский skill: проверка ищет только TODO, frontmatter и число слов, а не переведённый текст |
| learn/lessons/i-2.md | да | все `say: Done when …` → `Готово, когда …`; `](` 2/2, обратные кавычки 158/158, строк 367/367 |
| checks/lessons/i-2.mjs | да | title, START, 3 text, 8 подсказок |
| checks/test/ladders/i-2.mjs | без изменений | содержимое файлов английское, проверка его не сравнивает с текстом |
| learn/lessons/i-3.md | да | `](` 2/2, обратные кавычки 106/106, строк 284/284 |
| checks/lessons/i-3.mjs | да | title, 2 text, 10 подсказок |
| checks/test/ladders/i-3.mjs | без изменений | — |
| learn/lessons/i-4.md | да | `](` 3/3, обратные кавычки 110/110, строк 318/318 |
| checks/lessons/i-4.mjs | да | title, 3 text, 14 подсказок |
| checks/test/ladders/i-4.mjs | без изменений | — |

`node --test --test-name-pattern="i-N:" checks/test/learn-ladders.test.mjs` проходит для i-1…i-4 (и тест про i-capstone тоже проходит). Строка why в каждом уроке укладывается в 2 строки при ширине 60 колонок (проверил функцией `wrapRuns`, как в тесте).

## Пункты проверок: английский text → русский text

| урок/пункт | English | Русский |
|---|---|---|
| i-1 [0] | `.claude/skills/tdd/SKILL.md` is committed, with no TODO left | `.claude/skills/tdd/SKILL.md` закоммичен, и TODO в нём не осталось |
| i-1 [1] | the tdd skill can run as `/tdd` and load on its own: a description, and no `disable-model-invocation: true` | skill tdd запускается как `/tdd` и подгружается сам: есть описание и нет `disable-model-invocation: true` |
| i-1 [2] | the commit in `.practice/i-1-commit.txt` changes a test and the code it tests | коммит из `.practice/i-1-commit.txt` меняет тест и код, который он проверяет |
| i-2 [0] | a committed CLAUDE.md imports a file with `@path`, and the file exists | закоммиченный CLAUDE.md импортирует файл через `@path`, и этот файл существует |
| i-2 [1] | a committed rule in `.claude/rules/` is scoped with `paths:`, and every scoped rule matches a file in the repository | закоммиченное правило в `.claude/rules/` ограничено через `paths:`, и каждое такое правило подходит к файлу в репозитории |
| i-2 [2] | `.practice/i-2-loaded.txt` shows the imported file and a scoped rule loading | `.practice/i-2-loaded.txt` показывает загрузку импортированного файла и правила с областью действия |
| i-3 [0] | the committed changelog skill runs a smaller model at low or medium effort | закоммиченный skill changelog использует модель поменьше с effort low или medium |
| i-3 [1] | a committed CHANGELOG.md has an entry under `## Unreleased` | в закоммиченном CHANGELOG.md есть запись под `## Unreleased` |
| i-4 [0] | the committed `.claude/settings.json` denies reading `.env` files and allows a narrow test command | закоммиченный `.claude/settings.json` запрещает читать файлы `.env` и разрешает узкую команду запуска тестов |
| i-4 [1] | the sandbox is on, and `.claude/settings.local.json` stays out of git | песочница включена, а `.claude/settings.local.json` не попадает в git |
| i-4 [2] | the committed `.claude/settings.json` asks before a command the team approves each time, such as `git push` | закоммиченный `.claude/settings.json` спрашивает перед командой, которую коллеги одобряют каждый раз, например `git push` |

### Фрагменты для замен в `asCapstone` (i-capstone)
- i-2 [0]: `'Commit the one you organize in this lesson.'` → `'Закоммитьте тот, который вы приводите в порядок в этом уроке.'` (полная подсказка: «Закоммиченного CLAUDE.md нет. Закоммитьте тот, который вы приводите в порядок в этом уроке.»)
- i-4 [0]: `'Save the partial file from the lesson\'s Your turn there.'` → `'Сохраните туда заготовку файла из раздела «Ваша очередь».'` (полная подсказка: «Нет файла .claude/settings.json. Сохраните туда заготовку файла из раздела «Ваша очередь».»)

В i-capstone.mjs эти фрагменты уже стоят в таком виде.

## Сомнительные места
- Русские страницы руководства (b97a62b) сильно расходятся с 676831f на страницах i-1…i-4: многие абзацы переписаны. Дословно взяты только совпадающие куски (например, цели W1/W3 в i-1, промпты, абзацы «Проверка», тексты Watch out). Остальные цитаты я перевёл сам в стиле русских страниц. Цитаты в разминках из b-4/b-5 (их нет в старой русской b-4) тоже переведены мной. Те же цитаты из i-1/i-2/i-3 в разминках следующих уроков дословно совпадают с моими переводами в исходных уроках.
- В i-1 W1 цитата `note: "Don't change any files."` стала «Правило «Don't change any files» (не менять никакие файлы).»: сам skill английский, и ученик видит эту фразу по-английски.
- В i-2 Y1 подсказка `"Print errors to stderr, starting with `linkcheck:`."` оставлена по-английски (это строка правила в блоке кода), перевод добавлен в скобках без нового code-спана.
- Блоки кода (skills, правила, JSON с `TODO: …`) оставлены английскими, как на русских страницах. От этого зависят и регулярки verify (`^Read the staged changes`).
- Адреса `curl https://raw.githubusercontent.com/wesammustafa/...` оставлены: правило брифа касается только формы `github.com/...`, и русская страница тоже их не меняет.
- Тексты ссылок на документацию (`[Prompt suggestions]`, `[Extend Claude with skills]`, `[Model configuration]`) оставлены английскими, как на русских страницах; домен заменён на `/docs/ru/`. Ссылка «workspace trust dialog» переведена как «окно доверия к папке» (по UI-GLOSSARY).
- Сценарии ladders не менял: ни одна проверка не ищет переведённый текст в файлах ученика.

## Что осталось английским и почему
- Заголовки шагов (`Worked example step N of M` и т. п.), `badge`, ключи, verify-регулярки, shell-команды, сообщения коммитов (`"Add project skills"`) — служебное или вывод/ввод команд.
- `PASS`/`FAIL` и имена сценариев в ladders (это имена тестов).
- Содержимое скачиваемых и сохраняемых файлов (tdd/five-whys/changelog skills, правила, JSON).

## Тесты, которые падают из-за перевода (не мои, по брифу их подгонят отдельно)
Я прогнал копию `learn-content.test.mjs` только на i-1…i-4. Из-за перевода падают проверки с английскими регулярками:
- штамп `^Verified against …`;
- `SENTENCE_START = /^[A-Z0-9…/` (с `А-ЯЁ` мои уроки проходят);
- длинное тире под `learn/`;
- проверки `copy.mjs` (TERMS, «claim only»).
Остальные падения в этой выборке получаются только из-за фильтра (связи между уроками) и в полном прогоне не относятся к i-1…i-4.
