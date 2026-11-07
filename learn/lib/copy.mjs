// The app's own words. They state no Claude Code fact: every fact on screen
// is a quote from the lesson's content file. Tests keep commands, versions,
// model names and any claim the app can't back out of this file.
// A celebration praises the work, not how it was done: a string a
// celebration shows goes on CELEBRATIONS in checks/test/learn-content.test.mjs.

// Russian plural form: pl(1, 'шаг', 'шага', 'шагов') → 'шаг'; 3 → 'шага'; 5, 11, 12 → 'шагов'.
export function pl(n, one, few, many) {
  const lastTwo = Math.abs(n) % 100;
  const last = lastTwo % 10;
  if (lastTwo > 10 && lastTwo < 20) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

// One name for each thing the app's words talk about. The copy test rejects
// an older name, or a second way to describe the tiers.
export const TERMS = {
  practiceCopy: 'учебная копия',
  // The copy of the template a-5 and the Advanced capstone have the learner make.
  newCopy: 'новая копия',
  // Where a later level's lessons happen (ticket 86): the practice copy by
  // default, or another folder, such as one of the learner's own projects.
  workFolder: 'рабочая папка',
  yourRepository: 'ваш репозиторий',
  tierHelp: { guided: 'показана каждая команда', hinted: 'цель, подсказки по запросу', challenge: 'только цель' },
  // The guide's level names, by the folder of a lesson's page.
  levels: { beginner: 'Начальный', intermediate: 'Средний', advanced: 'Продвинутый' },
  // The same names in the genitive, before «уровня»: «путь начального уровня».
  levelsGen: { beginner: 'начального', intermediate: 'среднего', advanced: 'продвинутого' },
  // A level's index page, docs/<level>/README.md, as the guide's README
  // links it: "Level index".
  levelIndex: 'оглавление уровня',
};

// A level's name, as C.levels gives it, in the genitive: 'Средний' → 'среднего'.
// A name that is no level's comes back lower-cased.
const levelGen = (level) => {
  const key = Object.keys(TERMS.levels).find((k) => TERMS.levels[k] === level);
  return key ? TERMS.levelsGen[key] : String(level ?? '').toLowerCase();
};

// What a badge, a lesson's `badge:` id, is called on screen.
export const BADGES = {
  Explorer: 'Исследователь', Planner: 'Планировщик', Builder: 'Строитель', Navigator: 'Штурман', Keeper: 'Хранитель',
  Beginner: 'Начальный уровень', Crafter: 'Мастер', Organizer: 'Организатор', Tuner: 'Настройщик', Guardian: 'Страж',
  Enforcer: 'Блюститель', Delegator: 'Делегатор', Connector: 'Связной', Curator: 'Куратор', Intermediate: 'Средний уровень',
  Brancher: 'Ветвитель', Orchestrator: 'Дирижёр', Automator: 'Автоматизатор', Scripter: 'Сценарист', Strategist: 'Стратег',
  Steward: 'Распорядитель', Warden: 'Смотритель', Advanced: 'Продвинутый уровень',
};
export const badgeName = (name) => BADGES[name] ?? name;

// "a, b или c": names joined for a sentence.
const either = (names) => (names.length > 1 ? `${names.slice(0, -1).join(', ')} или ${names.at(-1)}` : names[0]);
const andMore = (shown, more) => `${shown}${more ? ` и ещё ${more}` : ''}`;
const files = (n) => pl(n, 'файл изменён', 'файла изменены', 'файлов изменено');

export const C = {
  appName: 'Практика Claude Code',
  levels: TERMS.levels,
  levelPath: (level) => `Путь ${levelGen(level)} уровня`,
  pathLabel: (level, done, total) => `${C.levelPath(level)} · пройдено ${done} из ${total}`,
  pathHint: 'каждая остановка чуть сложнее',
  hi: (name) => `Привет, ${name || 'друг'}! Давайте изучать Claude Code, работая в нём.`,
  pip1: 'Я Pip. Я слежу за вашей учебной копией и загораюсь',
  pip2: 'в ту секунду, когда шаг получился.',
  // A lesson may use more than one other window (ticket 103), so the
  // welcome promises none in particular.
  twoWindows: 'Это окно работает рядом с одним или несколькими терминалами:',
  thisWindow: 'это окно',
  thisWindowLines: ['один шаг за раз,', 'проверяет работу'],
  otherWindow: 'ваши терминалы',
  otherWindowLines: ['где вы вводите команды', 'и запускаете Claude Code', '(их проверяет это окно)'],
  openSecond: 'Откройте сейчас второй терминал в этой же папке:',
  comeBack: 'Потом вернитесь сюда и нажмите enter.',
  // The boot frame, while git answers the first questions at start.
  askingGit: 'Спрашиваю git об этой папке…',
  gitBroken: (error) => `git здесь не работает: ${error}. Ваша работа тут ни при чём: установите git и запустите приложение снова.`,

  whyLead: 'Зачем:',
  youllBeAble: 'После урока вы сможете',
  helpShrinks: 'Подсказок меньше всякий раз, когда навык встречается снова:',
  tierHelp: TERMS.tierHelp,
  startLesson: (n) => `Начать урок ${n}`,
  startCapstone: 'Начать итоговый проект',
  lessHelp: 'Я уже работал с Claude Code: дайте меньше подсказок',
  steps: (n) => `${n} ${pl(n, 'шаг', 'шага', 'шагов')}`,
  stepOf: (n, m) => `шаг ${n} из ${m}`,

  where: { terminal: 'в другом терминале', claude: 'в Claude Code', 'claude-2': 'во втором Claude Code', shell: 'в терминале рядом с Claude Code', editor: 'в редакторе', browser: 'в браузере', predict: 'сначала угадайте', ask: 'быстрый вопрос', type: 'по памяти', self: 'самопроверка' },
  // A lesson that numbers its terminals as its page does (ticket 103).
  terminalN: (n) => `в терминале ${n}`,
  // A long wait's card, where the page gives no words for it (ticket 103):
  // about the app, never about how long the run takes.
  waitLong: 'Не спешите: эта карточка подождёт сколько нужно.',
  // The box a long wait offers a warm-up in (ticket 150). It scores nothing.
  whileItRuns: 'Пока идёт запуск',
  whileNotScored: 'без оценки',
  whilePress: 'Нажмите номер ответа.',
  terminalInFolder: 'в терминале',
  warmup: (n, level) => (level ? `Разминка из урока ${n} ${levelGen(level)} уровня` : `Разминка из урока ${n}`),
  warmupIndex: (level) => `Разминка из оглавления ${levelGen(level)} уровня`,
  // A wrong pick shows its because at once, but a typed warm-up with no hint
  // (Intermediate's, 137) shows the lesson's words only after a second try,
  // and since 194 this line goes on whichever warm-up a learner meets first:
  // so "follow", not "at once".
  warmupWhy: 'Разминка возвращает к прошлому уроку: ответьте по памяти. Ошибиться не страшно: следом покажутся слова урока.',
  // A warm-up from a level index quotes that page, not a lesson (ticket
  // 178): these take the place of the words of the same name around it.
  fromIndex: {
    warmupWhy: 'Разминка задаёт один вопрос по памяти. Ошибиться не страшно: следом покажутся слова оглавления уровня.',
    why: 'Почему это важно, словами оглавления уровня:',
    trueOfElse: 'Это верно для другого. В оглавлении уровня сказано:',
    theAnswer: 'Ответ словами оглавления уровня:',
    fixFirst: 'Вот исправление словами оглавления уровня:',
    stillStuck: 'Всё ещё не получается? Нажмите p: откроется оглавление уровня и ссылка «Застряли».',
    codeMore: 'Остальные строки — в оглавлении уровня: нажмите p.',
    codeWide: (dots) => `Строка, которая кончается на ${dots}, уходит за край: нажмите p, чтобы открыть оглавление уровня.`,
    pageTitle: 'Оглавление уровня',
  },
  warmups: (n) => `сначала ${n} ${pl(n, 'разминка', 'разминки', 'разминок')}`,
  done: 'ГОТОВО',
  // Before an expect line, and the opening of a lesson's "Done when" say
  // line (content.mjs reads both spellings).
  doneWhen: 'Готово, когда ',
  noCommands: 'В этот раз без команд.',
  // An optional step's card (ticket 102): the lesson file's words for when
  // to skip it, then the key.
  optional: (when) => `Необязательный шаг. ${when} Нажмите x, чтобы пропустить его.`,
  doneEachPart: 'Каждую часть вы уже делали.',
  watching: (what) => ['Слежу за ', what, '. Загорюсь зелёным, как только всё будет верно.'],
  staleWatch: (what) => ['Слежу за ', what, '. Это осталось с прошлого шага: загорюсь зелёным, когда это изменится.'],
  stalePush: (what) => ['Слежу за ', what, ': всё здесь уже отправлено, поэтому загорюсь зелёным после вашего следующего push.'],
  fileEmpty: (path) => `В ${path} пока нет ни одной строки.`,
  // What a file holds, for a beat that reads it (ticket 87): the not-yet lines.
  noFile: (path) => `${path} пока нет.`,
  noMatch: (glob) => `Пока нет файла, подходящего под ${glob}.`,
  notText: (path, what) => `${path} пока не текстовый файл: в нём ${what}.`,
  notJson: (path, error) => `${path} пока не читается как JSON (${error}).`,
  noKey: (path, key) => `В ${path} пока нет ${key}.`,
  noLine: (path) => `В ${path} пока нет такой строки.`,
  // A fresh match on a file that only grew reads only what was added.
  noNewLine: (path) => `В ${path} пока нет новой такой строки.`,
  stillHas: (path, line) => `В ${path} всё ещё есть: ${line}`,
  notValue: (path, key, found, value) => `В ${path} ${key} пока ${found}, а не ${value}.`,
  // A binary file's evidence: its kind and size, never its bytes.
  pngImage: (w, h) => `картинка PNG, ${w} x ${h}`,
  binaryData: (size) => `двоичные данные, ${size}`,
  andMore: (line, n) => `${line} и ещё ${n} ${pl(n, 'строка', 'строки', 'строк')}`,
  slowWait: 'Часть этой проверки идёт долго, поэтому она запускается только по вашей просьбе: нажмите r, когда будете готовы.',
  doneBefore: { hinted: 'Вы это уже делали, поэтому показана цель: подсказки по клавише h.', challenge: 'Вы это уже делали, поэтому показана только цель.' },
  watchingGit: 'Слежу за ',
  gitClean: 'пока нет изменений',
  // `under`: the paths a git-clean beat names, where it names some (ticket 88).
  gitCleanUnder: (under) => `пока нет изменений в ${under}`,
  gitDirty: (n) => `git status показывает ${n} ${pl(n, 'изменение', 'изменения', 'изменений')}:`,
  // A look at part of the tree has git list each file, where git status
  // alone lists a new folder whole: these lines name files, not git status.
  changedUnder: (n, under) => `${n} ${files(n)} в ${under}:`,
  // A git-clean scope that is one file, and the one change (r27 E13).
  fileUncommitted: (path) => `В ${path} есть незакоммиченные изменения.`,
  checking: (what) => (what ? `Проверяю ${what}…` : 'Проверяю…'),
  // How far a run of several items has got, from the check child's reports.
  checkingItem: (n, m) => `Проверяю пункт ${n} из ${m}…`,
  // How long a slow check's child has run, beside the spinner.
  seconds: (n) => `${n} с`,
  notYet: 'Пока нет:',
  // The not-yet line folded under "The check says:", which says why.
  notYetShort: 'Пока нет.',
  pressH: 'Нажмите h, чтобы получить подсказку.',
  pressHAgain: 'Нажмите h ещё раз, чтобы получить больше подсказок.',
  checkSays: 'Проверка говорит:',
  showExact: 'Показать точную команду? y / n',
  // A check that answers the same after the learner redid the step (ticket
  // 192). The app can't see why, so it points earlier, and to the step a
  // lesson's back line names, which e goes back to.
  sameAnswer: 'Вы переделали этот шаг, а проверка отвечает так же, значит, причина, скорее всего, в одном из прошлых шагов.',
  goBack: (n, title) => `Нажмите e, чтобы вернуться к шагу ${n}: ${title}. Ваши файлы и отметки останутся.`,
  // The note's shorter forms, for a window with fewer spare rows: the note
  // takes only the rows the screen has free, so nothing on it moves.
  sameShort: 'Тот же ответ: причина, скорее всего, раньше.',
  goBackTo: (n, title) => `Нажмите e, чтобы вернуться к шагу ${n}: ${title}.`,
  sameBack: (n, title) => (title ? `Тот же ответ. Нажмите e, чтобы вернуться к шагу ${n}: ${title}.` : `Тот же ответ. Нажмите e, чтобы вернуться к шагу ${n}.`),
  stuckOffer: 'Застряли? Нажмите h, чтобы получить подсказку.',
  broken: (error) => `Проверка не смогла запуститься: ${error}. Ваша работа тут ни при чём. Нажмите r, чтобы повторить.`,
  gitFailAfter: 'Нажмите r, чтобы посмотреть ещё раз.',
  stepDone: (n) => `Шаг ${n} пройден!`,
  holds: (path) => [path, ' содержит '],
  cleanCopy: 'Ваша учебная копия чистая: коммитить нечего.',
  // In the learner's own repository, a work folder that isn't the copy.
  cleanRepo: 'Ваш репозиторий чистый: коммитить нечего.',
  cleanUnder: (under) => `git status ничего не показывает в ${under}.`,
  // What changed, for a beat that needs git status to list something.
  changedShows: (shown, more) => `Изменено: ${andMore(shown, more)}`,
  noChangeUnder: (under) => `git status пока не показывает изменений в ${under}.`,
  noChange: 'git status пока не показывает изменений.',
  nothingStaged: 'git status пока не показывает файлов, добавленных в индекс.',
  stagedShows: (shown, more) => `В индексе: ${andMore(shown, more)}`,
  changedOutside: (n, under, shown) => `${n} ${files(n)} вне ${under}: ${shown}`,
  // Against how git was when step n opened (ticket 105).
  headSame: (n) => `Нового коммита пока нет: HEAD там же, где был, когда открылся шаг ${n}.`,
  headDirty: (count, shown, more) => `Новый коммит есть, но git status всё ещё показывает ${count} ${pl(count, 'путь', 'пути', 'путей')}: ${andMore(shown, more)}`,
  headMoved: (sha) => `Новый коммит, ${sha}, и коммитить больше нечего.`,
  unchanged: (n) => `git status показывает те же пути, что и когда открылся шаг ${n}.`,
  changedSince: (n, count, shown, more) => `git status показывает другие пути, чем когда открылся шаг ${n}${count ? `: ${andMore(shown, more)}` : ': сейчас ни одного'}`,
  // A requires item that is the work folder's own (probe todos), not a lesson's.
  folderLacks: (hint) => `Для этого урока в вашей рабочей папке должно быть больше: ${hint}`,
  session: (n) => `${n} ${pl(n, 'шаг', 'шага', 'шагов')} за эту сессию`,
  beatDone: 'Готово.',
  already: 'Уже готово: проверка уже проходит, шаг засчитан.',
  // A beat git status passed before anything changed: no check ran.
  alreadyDone: 'Уже готово, шаг засчитан.',
  alreadyCheck: 'Проверка уже проходит, шаг засчитан.',
  hintsLater: (via) => (via === 'pick' ? 'Сначала попробуйте сами: выберите ответ, и тогда заработает h.' : 'Сначала попробуйте сами: нажмите r, чтобы проверить, и тогда заработает h.'),
  pickFirst: 'Сначала выберите ответ: цифрой или стрелками.',
  why: 'Почему это важно, словами урока:',

  guessFirst: 'Догадайтесь:',
  safetyChoice: 'Выбор ради безопасности.',
  anyAnswer: 'Подойдёт любой ответ: баллы не считаются.',
  guessRight: 'Вы угадали.',
  nowYouKnow: 'Теперь вы знаете:',
  findOutAt: (n) => `Понятно. Узнаете на шаге ${n}.`,
  youGuessed: (text) => `Ваша догадка: ${text}`,
  right: 'Верно.',
  answered: 'Отвечено.',
  notQuite: 'Не совсем.',
  trueOfElse: 'Это верно для другого. В уроке сказано:',
  lookAgain: 'Посмотрите ещё раз или нажмите s, чтобы увидеть ответ.',
  // On a typing beat s is a letter of the answer (ticket 187).
  lookAgainTyped: 'Посмотрите ещё раз или нажмите enter на пустой строке, чтобы увидеть ответ.',
  lookFor: 'Ищите',
  theAnswer: 'Ответ словами урока:',
  theAnswerIs: (n) => `Это вариант ${n}.`,
  fixFirst: 'Вот исправление словами урока:',
  fixThenPick: 'Исправьте это и выберите снова.',
  otherFine: 'Это нормально.',
  stillStuck: 'Всё ещё не получается? Нажмите p: откроется страница урока со ссылкой «Застряли».',
  // Where a code block is taller than the window: what doesn't fit is on
  // the page (ticket 90), above or below the line the beat explains.
  codeMore: 'Остальные строки — на странице урока: нажмите p.',
  // Where a line of it is wider than the window and ends in `dots`.
  codeWide: (dots) => `Строка, которая кончается на ${dots}, уходит за край: нажмите p, чтобы открыть страницу урока.`,
  // k sends the block to the terminal, which may or may not put it on the
  // clipboard: the app can't see which, so it says what it did.
  copied: (n) => `Попросил терминал скопировать ${n === 1 ? 'эту строку' : `эти ${n} ${pl(n, 'строку', 'строки', 'строк')}`}. Нечего вставить? Нажмите p, чтобы открыть страницу.`,
  lastQuestion: 'Последний вопрос',
  typeIt: 'Введите ответ и нажмите enter. В этот раз без вариантов.',
  emptyShows: 'Не уверены? Нажмите enter на пустой строке, чтобы увидеть ответ.',
  checkPasses: (n, m) => [`проходит: ${n} из ${m} ${pl(m, 'пункта', 'пунктов', 'пунктов')}.`],
  runItToo: (place) => `Запустите это и ${place}: результат будет тот же.`,
  eased: 'На этом шаге подсказок чуть больше: в прошлый раз вам понадобилась помощь.',
  stray: 'Это похоже на команду. Введите её в другом терминале, а не здесь.',
  strayIn: (place) => `Это похоже на команду. Введите её в терминале, ${place}, а не здесь.`,
  // Which folder a line that sends the learner to another terminal means,
  // where the level's work folder isn't the copy (ticket 86).
  inFolder: (name) => `в папке ${name}`,
  inCopy: 'в вашей учебной копии',
  inNewCopy: 'в вашей новой копии',

  // Drawn in art.mjs's banner font: only the letters it has.
  levelUp: 'НОВЫЙ УРОВЕНЬ',
  toHinted: ['Каждое из этих заданий вы сделали один раз, с показанными командами.', 'Дальше показана цель. Нажмите h, когда понадобится подсказка.'],
  toChallenge: ['Теперь по памяти: только цель.', 'Сначала попробуйте сами, потом нажмите h, если нужна подсказка.'],
  nextCounts: (h, c) => `Впереди: ${[h && `${h} ${pl(h, 'шаг', 'шага', 'шагов')} с подсказками`, c && `${c} ${pl(c, 'испытание', 'испытания', 'испытаний')}`].filter(Boolean).join(' и ')}.`,

  complete: 'ПРОЙДЕНО',
  // `label`: «Урок N» or «Итоговый проект», both masculine.
  lessonDone: (label) => `${label} пройден! Что вы отработали:`,
  badge: (name) => `Новый значок: ${badgeName(name)}`,
  checkedSummary: (n, m) => `Проверка урока проходит: ${n} из ${m} ${pl(m, 'пункта', 'пунктов', 'пунктов')}`,
  handover: 'Вы выполнили все задания без точной команды.',
  // On each level's capstone next screen only: inside a level, the next
  // lesson expects a clean tree.
  invitation: 'Есть вопросы по этому уровню? Задайте их в другом терминале, а потом сверьте ответ со страницами уроков.',
  invitationAt: (place) => `Есть вопросы по этому уровню? Задайте их в другом терминале, ${place}, а потом сверьте ответ со страницами уроков.`,
  answeredSummary: (n) => `Отвечено на ${n} ${pl(n, 'вопрос', 'вопроса', 'вопросов')}`,
  yourClimb: 'Ваш путь вверх',
  nextUp: 'Следующий',
  notchHarder: 'Чуть сложнее: подсказок с самого начала меньше.',
  savedBreak: 'Прогресс сохранён, так что можно сделать перерыв. Вернуться: npm run learn.',
  goFurther: 'Дальше:',

  map: 'КАРТА',
  help: 'Подсказки:',
  mapFooter: 'Каждый урок опирается на предыдущие, поэтому начинается с меньшим числом подсказок.',
  mapDone: 'готово',
  mapNext: 'дальше',
  // A lesson whose Check passed with its Tear down still to do (ticket 102).
  mapTearDown: 'уборка',
  tearDownLeft: 'Проверка проходит. Уборка ещё впереди.',
  ofDone: (n, m) => `готово ${n} из ${m}`,

  checkOnly: ['Этого урока в приложении пока нет. Идите по странице урока,', 'а я буду следить за его проверкой:'],
  // After the page's name (pageTitle, p's title), a link where links work,
  // on the card: p spells out the address, which a card's rail would break.
  pageLink: ': нажмите p, чтобы увидеть адрес.',
  newCopy: ['Этот урок идёт в новой копии шаблона, а не в этой', 'учебной копии. Нажмите f и укажите её папку — я буду следить за проверкой там:'],
  newCopyAt: ['Этот урок идёт в вашей новой копии шаблона. Идите по', 'странице урока, а я буду следить за его проверкой там:'],
  newCopyPlain: 'идёт в новой копии шаблона, поэтому здесь не проверяется',
  // Which items the check-only card shows, where they don't all fit.
  itemsShown: (a, b, n) => `Пункты ${a}–${b} из ${n}`,
  itemOf: (a, n) => `Пункт ${a} из ${n}`,

  // The work folder (ticket 86): the intro's question, the prompt for a
  // folder's path, and what the app found there. These are about this app
  // and git, never about Claude Code.
  folderAsk: (level) => `Где вы хотите проходить ${String(level ?? '').toLowerCase()} уровень?`,
  folderCopy: 'В этой учебной копии',
  folderOther: 'В другой папке, например в вашем репозитории',
  newCopyAsk: 'Где ваша новая копия шаблона?',
  folderNewCopy: 'Укажите папку вашей новой копии',
  workFolder: 'Рабочая папка:',
  thisCopy: 'эта учебная копия',
  folderPrompt: (level) => `Рабочая папка для ${levelGen(level)} уровня`,
  folderPromptNew: 'Папка вашей новой копии шаблона',
  folderHow: 'Введите или вставьте путь и нажмите enter.',
  folderEmpty: 'Пустая строка — эта учебная копия.',
  // The notes name no folder: the header and the Work folder line do, so a
  // long name costs no row.
  notGit: 'git говорит, что эта рабочая папка — не git-репозиторий. Нажмите f, чтобы выбрать другую папку.',
  noPractice: 'Git не игнорирует .practice/ в этой рабочей папке, а уроки хранят там свои файлы: добавьте строку .practice/ в её .git/info/exclude или .gitignore.',
  folderGitBroken: (error) => `git не смог заглянуть в эту рабочую папку: ${error}.`,
  // A new copy given as this practice copy, in the prompt or with --dir.
  newCopyIsCopy: 'Это и есть эта учебная копия. Укажите папку вашей новой копии шаблона.',
  folderGone: (path) => `Папки ${path} больше нет. Нажмите f, чтобы выбрать другую.`,
  // What a lesson needs before it starts (ticket 89). A prerequisite that
  // failed in the work folder: the lesson it comes from, and the one check
  // item that doesn't pass or what the one file lacks.
  buildsOnCheck: (label, item) => `Этот урок опирается на ${label}. Один пункт его проверки здесь пока не проходит: ${item}`,
  buildsOnFile: (label, hint) => `Этот урок опирается на ${label}: ${hint}`,
  openFirst: (label) => `Сначала откройте ${label}`,
  // Commands no PATH folder holds, before the page's You need lines that name them.
  // The lead of the page's line for the learner's repository (ticket 179).
  youNeed: 'Что понадобится:',
  notOnPath: (...names) => `В вашем PATH нет ${either(names)}. Что понадобится:`,
  // Where the intro has no room for all of that, one row hands it to n.
  notesShort: 'Прочитайте это перед началом: нажмите n',
  notesTitle: 'Перед началом',

  welcomeBack: 'С возвращением!',
  restartAsk: 'Начать этот урок заново? Ваши ответы и отметки по нему будут стёрты.',
  saveFailed: (error) => `Не удалось сохранить место: ${error}. Приложение продолжает работу.`,
  youreOn: (label, n, m, title) => `Вы здесь: ${label}, шаг ${n} из ${m}: ${title}.`,

  cardTitle: 'Ваша карточка',
  cardIntro: 'Команды из пройденных шагов, словами уроков.',
  cardEmpty: 'Пока пусто: команды появятся здесь, когда вы пройдёте шаги, где они нужны.',
  cardLink: 'Команды по уровням в руководстве:',
  // Recall, then compare: the next screen asks, space shows the entries.
  // A lesson's entries can be keys or a git command, and there can be one:
  // the words name neither a kind nor a number.
  recallAsk: (label) => `Вспомните, чему вас научил урок ${label}, и нажмите space.`,
  compareTitle: (label) => `${label} на вашей карточке`,
  compareIntro: 'Сравните то, что вспомнили, со словами урока.',

  pageTitle: 'Страница урока',
  stuckLink: 'Застряли? Напишите нам здесь:',

  keysTitle: 'Клавиши',
  keyHelp: [
    ['enter', 'дальше или выбрать'],
    ['space', 'я сделал'],
    ['↑ ↓  1-9', 'двигаться или выбрать ответ'],
    ['h', 'подсказка, по одной'],
    ['r', 'проверить ещё раз сейчас'],
    ['w', 'почему это важно'],
    ['b', 'назад на один экран'],
    ['m', 'карта уроков'],
    ['p', 'страница урока и что почитать дальше'],
    ['?', 'эти клавиши'],
    ['q', 'выйти (место сохранится)'],
  ],
  // Listed under the arrows where the course has more than one level, with
  // f, which changes a later level's work folder on its map page (ticket 86).
  levelKey: ['← →  f', 'карта: другой уровень; f: рабочая папка'],
  folderChange: 'f — сменить',
  // Listed only where the ? overlay has a row to spare.
  cardKey: ['c', 'ваша карточка: команды из пройденных шагов'],
  calm: 'Нужен неподвижный экран? Выйдите и запустите npm run learn -- --calm.',

  small: 'Сделайте это окно чуть больше (не меньше 60 на 20).',
  savedAt: (label, n, m) => `Сохранено: ${label}, шаг ${n} из ${m}. Запустите npm run learn, чтобы продолжить с этого места.`,
  // Where the lesson's work folder is another: progress stays in the copy.
  savedAtCopy: (label, n, m, root) => `Сохранено: ${label}, шаг ${n} из ${m}. Запустите npm run learn в вашей учебной копии, ${root}, чтобы продолжить с этого места.`,
  // Beginner lesson 1 no longer makes .practice/; lesson 2 does, so name the
  // command rather than a step.
  savedLater: 'Ваше место сохранится, когда в учебной копии появится папка .practice/: выполните там mkdir .practice.',
  plainIntro: 'npm run learn показывает по одному шагу в терминале. Запустите его в окне терминала.',
  usage: 'Запуск: npm run learn -- [--calm] [--plain] [--dir <папка>]. --calm — неподвижный экран; --plain — простые символы без цвета; --dir задаёт рабочую папку уровня, на котором откроется приложение.',
  noFolder: (path) => `Папки ${path} нет.`,
  dirBeginner: 'Начальный уровень приложение проверяет в этой учебной копии, поэтому --dir пока нечего задавать. Со среднего уровня используйте его или нажмите f на карте.',
  plainIn: (dir) => ` (проверено в ${dir})`,
  // A lesson done in the app whose check fails now (106): a later lesson
  // may change what it checks on purpose, as a-6 moves a component.
  plainChanged: 'Сейчас его проверка не проходит: возможно, один из следующих уроков изменил то, что она проверяет.',
  // Lines of the plain listing (plain.mjs).
  plainDone: ' (пройден в приложении)',
  plainBroken: (error) => `проверка не смогла запуститься: ${error}`,
  plainItems: (n, m) => `проходит ${n} из ${m} ${pl(m, 'пункта', 'пунктов', 'пунктов')} проверки`,
  plainSlow: (id, n) => ` (npm run check -- ${id} запускает ещё ${n} ${pl(n, 'долгий пункт', 'долгих пункта', 'долгих пунктов')})`,
  // A file's size, for binaryData (holds.mjs).
  bytes: (n) => `${n} ${pl(n, 'байт', 'байта', 'байт')}`,
  kilobytes: (n) => `${n} КБ`,

  k: {
    itsOpen: 'открыт', quit: 'выйти', choose: 'выбрать', start: 'начать', map: 'карта', more: 'ещё', checkNow: 'проверить',
    checkAgain: 'ещё раз', moreHelp: 'больше помощи', help: 'помощь', hint: 'подсказка', anotherHint: 'ещё подсказка', why: 'зачем', back: 'назад',
    next: 'дальше', nextTo: (title) => `дальше: ${title}`, answer: 'ответить', showAnswer: 'показать ответ', letsGo: 'поехали',
    bringIt: 'давайте', whatsNext: 'что дальше', startN: (label) => `начать ${label}`, open: 'открыть',
    useIt: 'выбрать', cancel: 'отмена', folder: 'папка', giveFolder: 'указать папку',
    continue: 'продолжить', startOver: 'заново', yesStartOver: 'да, заново', keep: 'нет, оставить', close: 'закрыть', scroll: 'листать', level: 'уровень', card: 'карточка', yes: 'показать', no: 'пока нет', page: 'страница', clear: 'очистить',
    copy: 'копировать', earlier: 'прошлый шаг', earlierShort: 'назад', skip: 'пропустить',
  },
};
