# L-I2 — уроки i-5, i-6, i-7, i-8, i-capstone

## Статус

| файл | готово | заметки |
|---|---|---|
| learn/lessons/i-5.md | да | форма, `](`, `` ` ``, число строк совпадают; parseLesson ok; ladder ok |
| learn/lessons/i-6.md | да | то же |
| learn/lessons/i-7.md | да | то же |
| learn/lessons/i-8.md | да | то же |
| learn/lessons/i-capstone.md | да | то же; headings/narrow для пунктов из b-3, i-2, i-4 взяты из уже переведённых `checks/lessons/b-3.mjs`, `i-2.mjs`, `i-4.mjs` |
| checks/lessons/i-5.mjs … i-8.mjs | да | `title`, `text`, все подсказки; число `return` не менялось |
| checks/lessons/i-capstone.mjs | да | свои пункты; пары `[from, to]` в `asCapstone` переписаны под русские подсказки i-2, i-4, i-7, i-8 |
| checks/lessons/i-7-demo.mjs | нечего | видимых ученику строк нет (только `error.message` из JS) |
| checks/test/ladders/i-5…i-8, i-capstone | без изменений | сценарии не кладут в файлы текст, который ищет переведённая проверка |
| capstone/intermediate-brief.md, intermediate-bug.md | да | `URIError: URI malformed` оставлен |

`node --test --test-name-pattern="i-(5|6|7|8|capstone):|capstone item reused" checks/test/learn-ladders.test.mjs` — 6/6 pass (включая тест повторного использования и сумму 44).

## Связка с другими агентами (сверить при изменениях)
- `checks/lessons/i-capstone.mjs` `asCapstone` заменяет фразы дословно (`String.replace`). Если L-I1 или переводчик b-3 поменяет эти фразы, замена молча перестанет работать:
  - i-2: «Закоммитьте тот, который вы приводите в порядок в этом уроке.»
  - i-4: «Сохраните туда заготовку файла из раздела «Ваша очередь».»
  - i-7 (мой): «Сохраните туда заготовку из раздела «Ваша очередь» урока.», «Добавьте его в `mcpServers`, как в уроке.»
  - i-8 (мой): «Добавьте запись `enabledPlugins` из урока и закоммитьте.»
- Заголовки и `narrow` в `## ladder` i-capstone для пунктов b-3 (`тесты проходят`, `не осталось незакоммиченных изменений`), i-2 (два пункта), i-4 (пункты 0 и 2) повторяют их текущие русские формулировки — при правке тех файлов поправить и i-capstone.md.
- Тёплые вопросы: i-6 R1 повторяет i-2 («Запустите сессию с журналом: `claude --settings .practice/i-2-hook.json`» — совпадает с i-2.md L-I1); i-5 R2 — «`$ARGUMENTS` получает текст после имени skill» (совпадает с i-1.md).

## Сомнительные места
- Русские страницы руководства (b97a62b) для 05–08 и capstone сильно расходятся с оригиналом 676831f (другие «Ваша очередь», другие шаги). Дословно взяты только совпадающие абзацы (need/need-repo, части W1–W4 i-5, i-6 W1–W3, «Осторожно», Go further, чек-листы); остальные цитаты переведены по словарю в стиле русских страниц.
- Термины: Stop-hook из i-5 назван «заслон» (test gate → «заслон тестов»); «fails closed» → «при сбое блокирует действие/правку»; code intelligence оставлен английским («плагин code intelligence»); «percent escape» → «percent-последовательность» (как в .translation/CLAUDE.md).
- i-6 W5 правильный вариант сокращён до «Доказанной тестом ошибкой», i-6 R1, i-7 R2, i-8 R2 — варианты подогнаны по длине, чтобы правильный не был самым длинным (тест cue в learn-content).
- i-7 Y5 `bottom` — «Исправьте несовпадающий поиск, сохранив подсчёт» (кусок цитаты hint, как в оригинале).
- learn-content.test.mjs по-прежнему ругается на мои уроки только эвристиками, завязанными на английский («starts midway through a sentence» и т. п.); их подгоняют отдельно.

## Осталось английским и почему
- Блоки кода со страниц (bash, json, markdown агента test-gaps, html демо, `# TODO` в скелете test-gate.sh) — правило «строки блока как на странице»; HTML демо и `2 links ready` сравнивает проверка.
- UI Claude Code: **Will install**, **Context cost**, **Errors**, **Install for you, in this repo only (local scope)**, `Found N new diagnostic issues`, `failed; blocking because onFailure is "block"`, `Marketplace "claude-plugins-official" not found`, `Blocked:`.
- Подписи шагов, `badge`, ключи, `verify`, команды, `<your repo>`, `<sha>`, `<symbol>/<file>/<change>` в промпте i-8 (плейсхолдеры).
- Тексты ссылок на документацию Anthropic («Hooks reference», «Create custom subagents» …) — как на русских страницах.
