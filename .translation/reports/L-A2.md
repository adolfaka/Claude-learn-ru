# L-A2 — уроки a-5, a-6, a-7

## Статус

| файл | готово | заметки |
|---|---|---|
| learn/lessons/a-5.md | да | parseLesson ok, форма совпадает, `](` 7/7, код-спаны 48/48, строк 428/428. Варианты выбора W2.1 переведены («Ключ API» / «Токен подписки»), `when: W2.1=…` синхронно поправлены |
| checks/lessons/a-5.mjs | да | все подсказки, `text` пунктов, `LESSON` (guide/secret/noToken), `and`/`or` → «и»/«или»; добавлен `import { pl }` для «И ещё N проблем» |
| checks/test/ladders/a-5.mjs | менять не пришлось | сценарии не зависят от текста подсказок |
| learn/lessons/a-6.md | да | parseLesson ok, форма совпадает, `](` 2/2, строк 395/395; код-спанов 113 вместо 112 (фрагмент `narrow "заданы и \`extraKnownMarketplaces\`"`). Варианты Y2.0 «Skill / Субагента / Hook», `when` поправлены |
| checks/lessons/a-6.mjs | да | все подсказки, `text`, `LESSON.marketplace/settings`, title; выполнена заметка S1: `.replace(/^\`[^\`]+\` /, 'он ')` |
| checks/test/ladders/a-6.mjs | менять не пришлось | |
| learn/lessons/a-7.md | да | parseLesson ok, форма совпадает, `](` 3/3, строк 563/563; код-спанов 118 вместо 113 — только во фрагментах `narrow "После \`--settings\` нет файла"` и т. п. Промпт части задачи в `bottom`/`show` переведён (как в русском уроке 4) |
| checks/lessons/a-7.mjs | да | все подсказки, `text`, `wideReason`, title; `pl()` для «N секунд», «N раз», «N таких правил», «N проблем» |
| checks/test/ladders/a-7.mjs | менять не пришлось | |

`node --test --test-name-pattern="a-N:" checks/test/learn-ladders.test.mjs` проходит для a-5, a-6, a-7.
В `learn-content.test.mjs` по моим урокам остаётся только «starts midway through a sentence»: `SENTENCE_START` = `/^[A-Z0-9\`["*(]/` не знает кириллицы (тест подгонят отдельно). Строки `why` a-6 и a-7 укорочены, чтобы помещаться в 2 строки.

## Пункты проверок (для a-capstone): английский text → русский text

### a-5
| English | Русский |
|---|---|
| a committed workflow runs `anthropics/claude-code-action` pinned to a release or a commit SHA, in automation mode, with its credential from a secret and none in the file | закоммиченный рабочий процесс запускает `anthropics/claude-code-action`, закреплённый на релизе или SHA коммита, в автоматическом режиме, с учётными данными из секрета и без них в файле |
| its limits are in the file: `--max-turns` of at most 10, an `--allowedTools` list without unrestricted `Bash`, a read-only job token and `timeout-minutes` | его лимиты записаны в файле: `--max-turns` не больше 10, список `--allowedTools` без неограниченного `Bash`, токен задания только для чтения и `timeout-minutes` |
| `.practice/a-5-runs.json` shows a completed, successful manual run on a commit that holds the workflow | `.practice/a-5-runs.json` показывает завершённый успешный ручной запуск на коммите, в котором есть рабочий процесс |
| (boundedWorkflow, для capstone) a committed workflow runs `anthropics/claude-code-action` on ${or(triggers)}, pinned to a release or a commit SHA, in automation mode, with its credential from a secret and none in the file, a read-only job token, `--max-turns` of at most 10, an `--allowedTools` list without unrestricted `Bash` and `timeout-minutes` of at most 30 | закоммиченный рабочий процесс запускает `anthropics/claude-code-action` на ${or(triggers)}, закреплённый на релизе или SHA коммита, в автоматическом режиме, с учётными данными из секрета и без них в файле, с токеном задания только для чтения, `--max-turns` не больше 10, списком `--allowedTools` без неограниченного `Bash` и `timeout-minutes` не больше 30 |

Для a-capstone `boundedWorkflow(CI)` даёт с `triggers: ['pull_request']`: «…`anthropics/claude-code-action` на `pull_request`, закреплённый…». `or` теперь соединяет «или».

### a-6
| English | Русский |
|---|---|
| (marketplaceItem) a committed team marketplace lists a plugin by a relative path, and the entry's name matches the `name` in the plugin's `plugin.json` | закоммиченный marketplace команды перечисляет плагин по относительному пути, и имя записи совпадает с `name` в `plugin.json` плагина |
| (settingsItem) the committed `.claude/settings.json` registers that marketplace by a relative path and turns the plugin on | закоммиченный `.claude/settings.json` регистрирует этот marketplace по относительному пути и включает плагин |
| a component you moved is in the plugin and gone from `.claude/` | перенесённый вами компонент лежит в плагине и убран из `.claude/` |
| a committed `.gitignore` keeps `.claude/settings.local.json` and `CLAUDE.local.md` out, and git tracks neither | закоммиченный `.gitignore` не пускает в git `.claude/settings.local.json` и `CLAUDE.local.md`, и git не отслеживает ни один из них |
| (strictValidation) `.practice/a-6-validate.json` records a strict validation of the plugin directory that passed | `.practice/a-6-validate.json` фиксирует пройденную строгую проверку папки плагина |
| (первый пункт урока) a committed team marketplace lists a plugin by a relative path, and `.practice/a-6-validate.json` records a strict validation of that plugin that passed | закоммиченный marketplace команды перечисляет плагин по относительному пути, а `.practice/a-6-validate.json` фиксирует пройденную строгую проверку этого плагина |

### a-7 (capstone не использует)
| English | Русский |
|---|---|
| `scripts/bounded-run.sh` is committed and executable, takes a task and a result path, and starts `claude -p` in `dontAsk` mode with JSON output, no MCP server and a committed `--settings` file | `scripts/bounded-run.sh` закоммичен и исполняемый, принимает задачу и путь результата и запускает `claude -p` в режиме `dontAsk` с выводом JSON, без MCP-серверов и с закоммиченным файлом `--settings` |
| it sets a turn limit and a spend limit | он задаёт лимит ходов и лимит расходов |
| every allow rule names one command or one folder, and the deny rules stop `git commit` and `git push` | каждое правило allow называет одну команду или одну папку, а правила deny запрещают `git commit` и `git push` |
| the settings file turns the sandbox on in strict mode without auto-allow, and makes the run refuse to start without it | файл настроек включает песочницу в строгом режиме без автоодобрения и заставляет запуск отказаться стартовать без неё |
| `.practice/a-7-slice.json` holds a slice run whose cost is under your spend limit | `.practice/a-7-slice.json` содержит запуск на части задачи, стоимость которого ниже вашего лимита расходов |

## Заметки для агента a-capstone (опции, которые подставляются в мои подсказки)
- a-5 `CI.guide` встаёт в «…, как описано в ${guide}, …» → нужен предложный падеж, например `'части 5 файла \`capstone/advanced-brief.md\`'` (у урока: `'разделе «Ваша очередь»'`).
- a-5 `CI.secret` встаёт в «…, указав ${secret}.» → винительный: `'секрет, который вы сохранили командой \`gh secret set\`'`.
- a-5 `CI.noToken` встаёт в «…не передаёт \`github_token\`, поэтому ${noToken}.» → клауза: `'действие аутентифицируется как Claude GitHub App, которое итоговый проект не настраивает'`.
- a-6 `PLUGIN.marketplace` встаёт в «Закоммиченного \`.claude-plugin/marketplace.json\` нет. ${start}, и закоммитьте его.» → повелительная фраза: `` `Положите в \`team-marketplace/\` marketplace с одним своим плагином, как описано в ${PLUGIN_GUIDE}` ``.
- a-6 `PLUGIN.settings` встаёт в «Создайте его: …, ${settings}, — и закоммитьте.» → `` `как описано в ${PLUGIN_GUIDE}` `` (PLUGIN_GUIDE в предложном: `'части 3 файла \`capstone/advanced-brief.md\`'`).
- Narrow-фрагменты капстоуна для пунктов a-5/a-6 берите из ladder моих уроков (там те же подсказки).

## Сомнительные места
- a-5: YAML-примеры (`prompt: "In one paragraph, what does src/links.js do? …"`) оставлены английскими — это блок кода, который ученик сохраняет в файл; проверка ищет в нём только ключи. Сообщение коммита `"Remove the Claude workflows"` и др. — команды, не переводились.
- a-5: русская страница руководства построена иначе (быстрая настройка через `/install-github-app`), поэтому многие цитаты переведены самостоятельно в стиле страницы; дословно взяты: «Ручной запуск возможен, только если файл рабочего процесса лежит в ветке по умолчанию», «В файле нет никаких учётных данных.», «Любой, у кого есть доступ на запись…», «Удаление секрета не отзывает…», «Не убирайте раньше…» и др.
- a-6: R1 — цитата дословно из русского урока i-4; R2 — та же фраза, что в моём a-5. Y1 because «Документация советует оставлять такую отдельную настройку…» — абзаца в русской странице нет, перевод свой.
- a-7: промпт части задачи в `bottom`/`show` переведён («Своим инструментом Edit добавь тест… а затем закоммить тест.»), вопрос W4 цитирует «а затем закоммить тест». Русская страница руководства оставила этот промпт английским (а промпт капа перевела) — если нужно совпадение со страницей, верните английский в обоих местах и в вопросе W4.
- a-7: подставная задача проверки `Add a test for one function (STUB-TASK-…)` осталась английской — она внутренняя, ученик её не видит. Плейсхолдер в подсказке `<a small part of the task>` переведён как `<небольшая часть задачи>` (приложение его не подставляет); `<path in the plugin>` в a-6 → `<путь в плагине>`.
- a-7: `label` встроенных настроек теперь в предложном падеже (`'встроенном JSON в \`--settings\`'`), а фраза «${Label} has no `sandbox` settings» переписана как «В ${label} нет настроек `sandbox`» (заглавная буква больше не нужна; число `return` не менялось).
- `checks/test/advanced.test.mjs` ищет английские подсказки a-5/a-6/a-7 — упадёт, его подгоняют отдельно.

## Осталось английским и почему
- Значения `badge`, `folder: new copy`, `skill/where/verify/…`, идентификаторы шагов, `Worked example step N of M`.
- Блоки кода (YAML, JSON, bash), команды в `bottom`/`run`/`show`, сообщения коммитов, вывод `✔ Validation passed`.
- Ссылки на шаблон `wesammustafa/...` в curl-команде a-6 (это адрес примера, не руководства).
