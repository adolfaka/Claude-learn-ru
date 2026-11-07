# L-A1 — уроки a-1, a-2, a-3, a-4

## Статус

| файл | готово | заметки |
|---|---|---|
| learn/lessons/a-1.md | да | parseLesson ok, форма совпадает, `](` и `` ` `` совпадают |
| learn/lessons/a-2.md | да | то же; `why` сокращён до 2 строк |
| learn/lessons/a-3.md | да | то же; `why` сокращён (в оригинале уже было 3 строки — тест падал и до перевода) |
| learn/lessons/a-4.md | да | то же; промпты `claude -p` в блоках bash переведены, как на русской странице |
| checks/lessons/a-1.mjs | да | title, text, все подсказки |
| checks/lessons/a-2.mjs | да | title, text, QUESTIONS, JOBS.why, LABEL, FORMAT, NAMES, подсказки |
| checks/lessons/a-3.mjs | да | title, text (с ветками `needs` для итогового проекта), SAVE, scriptHint, uncommittedHint, подсказки по шаблону |
| checks/lessons/a-4.mjs | да | все подсказки; добавлен `import { pl } from '../../learn/lib/copy.mjs'` (секунды, «раз», ходы, «замечания») |
| checks/test/ladders/a-1…a-4.mjs | без изменений | сценарии кладут английские тексты/скрипты, проверки по ним не ищут переведённых строк |

Сверки: `node --test --test-name-pattern="a-[1-4]:" checks/test/learn-ladders.test.mjs` — 4/4 pass.
В learn-content для a-1…a-4 больше нет проверок длины `why` или подсказок по длине вариантов.
Остались только английские правила (запрет длинного тире, «starts midway through a sentence»), они срабатывают на любой русский текст.

## Пункты проверок: английский text → русский text

| урок | English | Русский |
|---|---|---|
| a-1 #0 | a committed `.gitignore` ignores `.claude/worktrees/` and not the rest of `.claude/` | закоммиченный `.gitignore` игнорирует `.claude/worktrees/`, но не остальное в `.claude/` |
| a-1 #1 `mergedWorktrees(snapshot)` | `` `${snapshot}` lists two worktrees under `.claude/worktrees/` whose commits split from each other, and both changes are in your branch `` | `` `${snapshot}` перечисляет два worktrees в `.claude/worktrees/`, чьи коммиты разошлись друг с другом, и оба изменения есть в вашей ветке `` |
| a-1 #1, `{ anywhere: true }` (итоговый проект) | `… lists two worktrees of this repository whose commits …` | `… перечисляет два worktrees этого репозитория, чьи коммиты …` |
| a-1 #2 | neither of those worktrees still exists | ни одного из этих worktrees больше нет |
| a-2 #0 | `` `.practice/a-2-choices.md` picks the cheapest pattern that fits each job `` | `` в `.practice/a-2-choices.md` для каждой задачи выбрана самая дешёвая подходящая схема `` |
| a-2 #1 | `` `.practice/i-6-agents.txt` shows at least two subagents other than `test-gaps` starting for job 1 `` | `` `.practice/i-6-agents.txt` показывает, что для задачи 1 запустились как минимум два субагента, кроме `test-gaps` `` |
| a-3 #0 `savedWorkflow(options)` | a committed script in `.claude/workflows/` has a literal `export const meta`, with a `name` and a `description`, as its first statement[, and <needs>] | закоммиченный скрипт в `.claude/workflows/` первой инструкцией содержит литеральный `export const meta` с `name` и `description`[, <needs>] |
| a-3 needs: needArgs | reads its input from `args` | читает входные данные из `args` |
| a-3 needs: needCheck | calls `agent()` at least twice | вызывает `agent()` как минимум дважды |
| a-3 needs: needAgentCall | starts subagents with `agent()` | запускает субагентов через `agent()` |
| a-3 #0 в уроке (полностью) | … as its first statement, and reads its input from `args` and calls `agent()` at least twice | закоммиченный скрипт в `.claude/workflows/` первой инструкцией содержит литеральный `export const meta` с `name` и `description`, читает входные данные из `args` и вызывает `agent()` как минимум дважды |
| a-3 #1 | the `git grep -E` pattern in `.practice/a-3-pattern.txt` matched in a folder at an earlier commit and matches nothing in that folder at `HEAD` | шаблон `git grep -E` из `.practice/a-3-pattern.txt` находил совпадения в папке в более раннем коммите и ничего не находит в этой папке в `HEAD` |
| a-4 #0 `committedScript(script)` | `` `${script}` is committed and executable `` | `` `${script}` закоммичен и исполняем `` |
| a-4 #1 `scriptCall(script)` | its `claude -p` call asks for JSON in `dontAsk` mode, allows only `Read`, `Grep` and `Glob`, with no hook or MCP server, caps turns at 10 or fewer, and has the prompt right after `-p` | его вызов `claude -p` запрашивает JSON в режиме `dontAsk`, разрешает только `Read`, `Grep` и `Glob`, обходится без hooks и MCP-серверов, допускает не больше 10 ходов, а промпт в нём стоит сразу после `-p` |
| a-4 #2 `scriptBehavior(script)` | it pipes the staged diff in, saves the JSON where its argument says, prints the result, exits non-zero when the run fails, and doesn't call Claude when nothing is staged | он передаёт staged-дифф через конвейер, сохраняет JSON туда, куда указывает аргумент, печатает результат, завершается с ненулевым кодом при сбое запуска и не вызывает Claude, когда ничего не подготовлено |
| a-4 #3 `savedRun(result, script)` | `` `${result}` holds a run that succeeded within your cap `` | `` `${result}` содержит запуск, который завершился успешно в пределах вашего ограничения `` |

## Заметки для агента a-capstone
- `committedScript(script, guide)`: `guide` подставляется во фразу «Напишите его так, как описано в ${guide}, затем закоммитьте.» Нужен предложный падеж. По умолчанию стоит «разделе «Ваша очередь» урока».
- `savedRun(result, script)`: если `result` не равен `RESULT`, подсказка «подготовьте изменение и запустите `script result`» собирается сама.
- `mergedWorktrees(snapshot, { anywhere: true })`: подсказка «`${snapshot}` перечисляет только один worktree / не перечисляет ни одного worktree помимо основного checkout…» переведена.
- `savedWorkflow` склеивает `needs` через `and()` с « и ».

## Сомнительные места
- a-2: имена схем в `.practice/a-2-choices.md` остались английскими (`main conversation`, `subagents`, `workflow`, `/batch`, `agent team`), как на русской странице руководства. Формат строки: `<номер задачи>: <схема> because <причина>`.
  Регулярки `PATTERNS`/`JOB_LINE` я не трогал: строку «Задача 1: субагенты» проверка не распознает. Если нужно, можно добавить русские синонимы в `PATTERNS` и префикс «задача» в `JOB_LINE`.
- a-2: «chart» переведён как «блок-схема», чтобы не путать со «схемой» (pattern). В цитате подсказки ladder осталось «вопросы схемы»: так дословно на русской странице.
- a-1: следую странице руководства и пишу «основной checkout», «два worktrees», «оба worktrees».
- Многие цитаты переведены самостоятельно: русские страницы a-1…a-4 сделаны по старому коммиту b97a62b, и разделы «Ваша очередь» и «Проверка» с тех пор сильно изменились. Из русских страниц дословно взято всё, что совпало по смыслу.
- a-3: в `/goal …` (run W2) переведена только описательная часть, команды и пути не тронуты. Промпт `Run /<name> on <folder>` оставлен английским, как на русской странице.
- a-4: внутренний ответ заглушки `'The stand-in reports a failed run.'` (SCENARIOS.isError) остался английским. Это данные сценария, в подсказки он не попадает.

## Что осталось английским и почему
- `badge`, служебные ключи, `W1/Y2/C`, `Worked example step N of M` — по брифу.
- Shell-команды, флаги, пути, надписи интерфейса Claude Code (**View raw script**, **Yes, run it**, `◎ /goal active` и т. п.).
- Названия страниц документации в тексте ссылок ([Run agents in parallel] и т. п.) — по словарю; домен заменён на `/docs/ru/`.
