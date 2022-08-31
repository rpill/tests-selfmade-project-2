export default {
  translation: {
    structure: {
      directory: 'Отсутствует директория `{{ name }}` и необходимые файлы в ней.',
      file: 'Отсутствует файл `{{ name }}.`',
    },
    w3c: 'Файл: `{{ fileName }}`, строка: {{ line }}. {{ message }}.',
    stylelint: {
      CssSyntaxError: 'Файл: `{{ fileName }}`, строка: {{ line }}. Синтаксическая ошибка: {{ text }}.',
      'no-duplicate-selectors': 'Файл: `{{ fileName }}`, строка: {{ line }}. Дублируется селектор.',
      'block-no-empty': 'Файл: `{{ fileName }}`, строка: {{ line }}. Пустое CSS-правило.',
      'declaration-block-no-duplicate-properties': 'Файл: `{{ fileName }}`, строка: {{ line }}. Дублирующее свойство внутри CSS-правила.',
      'block-opening-brace-space-before': 'Файл: `{{ fileName }}`, строка: {{ line }}. Отсутствует пробел между селектором и открывающей скобкой.',
      'declaration-block-semicolon-newline-after': 'Файл: `{{ fileName }}`, строка: {{ line }}. Правило не на новой строке.',
      'block-opening-brace-newline-after': 'Файл: `{{ fileName }}`, строка: {{ line }}. Правило не на новой строке после открывающей скобки.',
      'block-closing-brace-newline-before': 'Файл: `{{ fileName }}`, строка: {{ line }}. Закрывающая скобка не на новой строке.',
    },
    alternativeFonts: 'Присутствуют альтернативные шрифты. Список допустимых шрифтов: `{{ fonts }}`.',
    layoutDifferent: 'Визуальное отличие макета от эталона. Изображение можно скачать в артефактах. Первое изображение - эталон, второе - ваша вёрстка, третье - отличие.',
    semanticTagsMissing: 'Отсутствуют семантические теги: `{{ tagNames }}`.',
    langAttrMissing: 'Укажите язык для страницы. Добавьте для тега `html` аттрибут `lang` со значением `{{ lang }}`',
    orderStylesheetLinks: 'Неправильный порядок подключения стилей: сначала шрифты, потом собственные стили.',
    notResetMargins: 'Сбросьте браузерные отступы у элементов: {{ tagNames }}.',
    titleEmmet: 'Содержание `title` должно отличаться от заготовки Emmet',
    logoWrapper: 'Логотип не обёрнут в ссылку в шапке',
    prefixForEmailAndPhone: 'Ссылки на номер телефона и почту не снабжены префиксами в значении атрибутов `href`',
  },
};
