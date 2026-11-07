# L-A3 — итоговый проект продвинутого уровня

## Статус

| файл | готово | заметки |
|---|---|---|
| capstone/advanced-brief.md | да | Переведён целиком, тон и куски взяты из старого `Claude-learn-ru/capstone/advanced-brief.md`. Review = «ревью», GitHub workflow = «рабочий процесс» (как в a-5), dynamic workflow = «workflow» |
| learn/lessons/a-capstone.md | да | parseLesson ok, форма совпадает (same-shape), строк 546/546, `](` 4/4. Обратных кавычек на 2 больше: фрагмент narrow «заданы и `extraKnownMarketplaces`» взят из ladder a-6 |
| checks/lessons/a-capstone.mjs | да | `title`, `text` и подсказки своих пунктов (noCommittedKey, spendCap, ignoredWorktrees, sameReview, reviewConcurrency, ciRun); параметры для фабрик уроков (`CI.guide/secret/noToken`, `SCRIPT_GUIDE`, `PLUGIN`) согласованы с русскими фразами a-4/a-5/a-6. Число `return` не менялось |
| checks/test/ladders/a-capstone.mjs | правок не нужно | сценарии кладут в файлы только английский код и промпты, которые проверки не ищут |

Сверки: `node --test --test-name-pattern="a-capstone:" checks/test/learn-ladders.test.mjs` проходит; тест «a capstone item reused from a lesson shows the lesson item's code» тоже проходит.
В `learn-content.test.mjs` по a-capstone падает только проверка «starts midway through a sentence» (она сверяет с английской страницей). Та же ошибка есть и у других переведённых уроков, например у a-5 (22 строки), так что это общая подгонка тестов.
Строк `- say: Done when` в уроке нет, поэтому правило «Готово, когда » здесь не понадобилось.

## Повторно используемые пункты
Заголовки ladder и фрагменты `narrow` для пунктов уроков взяты из уже переведённых модулей. Заголовки вставлены программно из `items[i].text`:
- a-1: `mergedWorktrees(..., { anywhere: true })`, плюс `ignoresWorktrees`/`ignoreHint` как запасной путь;
- a-3: `savedWorkflow`;
- a-4: `committedScript`, `scriptCall`, `scriptBehavior`, `savedRun`. Когда я сверялся, a-4.mjs уже был переведён, а a-4.md ещё нет: фрагменты для этих пунктов я подбирал сам по подсказкам из a-4.mjs. **Сверьте с ladder в a-4.md**, когда L-A1 закончит;
- a-5: `boundedWorkflow`;
- a-6: `marketplaceItem`, `settingsItem`, фрагменты по ladder из a-6.md;
- b-3: `testsPass`, `nothingUncommitted`;
- от a-7 a-capstone ничего не импортирует.

Если L-A1/L-A2/автор b-3 поменяют подсказки, ladder a-capstone нужно перепроверить тестом выше.

## Сомнительные места
- Заголовок пункта из a-3 при `needAgentCall` без `needArgs` выходит таким: «…с `name` и `description`, вызывает `agent()` как минимум дважды», то есть без «и» перед последним условием. Это делает функция `and/needs` в a-3.mjs, мой файл тут ни при чём. Стоит подсказать L-A1.
- Термины: «ревью» (review) и «проверка» (check) я развёл. Цитаты, у которых английский абзац не менялся, взяты из русской страницы дословно, а там встречается «проверка» в значении review: «моему скрипту проверки», «прочитайте ревью» (последнюю я поправил: абзац в оригинале изменился).
- Заголовок урока взят дословно с русской страницы: «CI-проверка, которой может пользоваться команда». Строки `can`/`payoff` написаны своими словами: «добавить ревью в CI, которым может пользоваться команда».
- `CI.noToken`: «действие аутентифицируется как Claude GitHub App, которого итоговый проект не настраивает» (род «App» — мужской, как в a-5).
- В брифе есть длинные тире. `advanced.test.mjs` их запрещает (`the brief has an em dash`), а наш бриф перевода тире разрешает. Этот тест и английские ожидания в `advanced.test.mjs` (строки 3305–3411: «Write it as part 2 of…») нужно подогнать отдельно.
- Ссылка `Authentication` в D3 переведена на `/docs/ru/`, текст ссылки оставлен английским, как на русской странице.

## Что осталось английским и почему
- `option`/`when` — русские, совпадают побуквенно.
- Команды, пути, `bottom:`/`run:`/`show:`, `badge`, `folder: new copy`, служебные ключи; подписи шагов `The task step N of 5` и т. п. оставлены, их читает парсер.
- Сценарии ladder (код и промпты фикстур) остались английскими.

## Дополнение (после завершения a-1…a-4)
- Заголовки ladder пересобраны из окончательных `text` в a-1…a-4. Оба теста (`a-capstone:` и «reused from a lesson») снова проходят.
- `SCRIPT_GUIDE` = «части 2 `capstone/advanced-brief.md`» — в предложном падеже, под фразу «как описано в ${guide}». В том же падеже `CI.guide` и `PLUGIN_GUIDE`: «части 5…» и «части 3…».
