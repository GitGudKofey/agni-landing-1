/*
 * AGNI landing — static content (window.AGNI_DATA for js/app.js).
 */
(function () {
  "use strict";

  /**
   * Per-breakpoint asset path: lg — no suffix; md/sm — "_md" / "_sm" before extension.
   * @param {string} stem  file name without extension, e.g. "hero-vid_1"
   * @param {string} ext   extension including the dot, e.g. ".webm"
   * @param {"lg"|"md"|"sm"} bp
   */
  function aBp(stem, ext, bp) {
    var suf = !bp || bp === "lg" ? "" : "_" + bp;
    return "assets/" + stem + suf + ext;
  }

  // ---- SCENARIOS — slide content for renderScenarios() (lg overlays + md/sm sticky) ----
  var scenarioBase = [
    {
      n: "01",
      icon: "ph-sliders-horizontal",
      tag: "групповое питание",
      title: "Умное управление игровым сетапом",
      model: "TP-FI3U5E-C",
      thumbStem: "1slide-preview",
      vidStem: "scene1-top-v1short",
      left: "dual",
      right: "dual",
      ar: "1460 / 400",
      body: "Отключайте монитор, колонки или консоль отдельно, не вынимая вилок из розеток. Или разделите сетап на игровые и периферийные устройства и управляйте группами оборудования.",
      accents: [
        { parts: [{ t: "5 " }, { t: "выключателей", white: true }], big: "5 выключателей", label: "Включайте только то, что нужно" },
        { parts: [{ t: "QC/PD", white: true }, { t: " 20 Вт" }], big: "QC/PD 20 Вт", label: "Быстрая зарядка смартфона или геймпада" }
      ],
      details: [
        { kind: "img", stem: "1slide-left_2" },
        { kind: "vid", stem: "scene1-left-sockets" }
      ],
      // lg dual-overlay uses different (wider) crops than the md/sm inline accent media above
      detailsLg: [
        { kind: "img", stem: "scene1-left-usb" },
        { kind: "vid", stem: "scene1-left-sockets" }
      ]
    },
    {
      n: "02",
      icon: "ph-game-controller",
      tag: "до 6 устройств",
      title: "Игровые и консольные сетапы",
      model: "TP-FO4U10E-C",
      thumbStem: "2slide-preview",
      vidStem: "scene2-top-v1short",
      left: "dual",
      right: "dual",
      ar: "1460 / 400",
      rich: true,
      body: "Подключите ПК или консоль, монитор, роутер, колонки и зарядные устройства в одном месте. Контроль правильного заземления — безопасность игрового места. Версии с USB и без USB.",
      accents: [
        { big: "2 выключателя", label: "Отдельное питание игрового и рабочего сетапа" },
        { big: "QC/PD 20 Вт", label: "Геймпад снова готов к игре" }
      ],
      details: [
        { kind: "img", stem: "2slide-left_2" },
        { kind: "vid", stem: "scene2-left-sockets" }
      ],
      detailsLg: [
        { kind: "img", stem: "scene2-left-usb" },
        { kind: "vid", stem: "scene2-left-sockets" }
      ]
    },
    {
      n: "03",
      icon: "ph-broadcast",
      tag: "до 8 устройств",
      title: "Мощные сетапы\nи стриминг",
      model: "TP-FS6E",
      thumbStem: "3slide-preview",
      vidStem: "scene3-top-v1short",
      left: "dual",
      right: "dual",
      ar: "1460 / 400",
      rich: true,
      body: "Больше розеток для расширенного сетапа. Для игровых ПК, нескольких мониторов, освещения, камер, микрофонов и сетевого оборудования. Световой индикатор показывает наличие заземления в розетке.",
      accents: [
        { big: "QC/PD 20 Вт", label: "Быстрая зарядка смартфона без адаптера" },
        { big: "LED индикаторы", label: "Контроль заземления и защиты одним взглядом" }
      ],
      details: [
        // md/sm: wide USB crop (3slide-left_2_md source) — NOT tall scene3-left-usb (lg overlay only)
        { kind: "img", stem: "3slide-left_2" },
        { kind: "img", stem: "3slide-left_2", lgOnly: true }
      ],
      detailsLg: [
        { kind: "img", stem: "scene3-left-usb" },
        { kind: "img", stem: "3slide-left_2" }
      ]
    },
    {
      n: "04",
      icon: "ph-plug-charging",
      tag: "65 Вт GaN",
      title: "Вертикальные станции питания",
      model: "TP-VG6U12E-C-W",
      thumbStem: "4slide-preview",
      vidStem: "scene4-top-v1short",
      left: "tower",
      right: "tower",
      tower: true,
      body: "Вертикальная конструкция освобождает место на столе и обеспечивает удобный доступ ко всем розеткам и USB-разъёмам. 65 Вт GaN-зарядка для ноутбуков, Steam Deck, Nintendo Switch и смартфонов.",
      accents: [
        { pre: "беспроводная зарядка", big: "Qi 15 Вт", label: "Положили смартфон — зарядка началась" },
        { pre: "быстрая зарядка", big: "GaN 65 Вт", label: "Зарядка ноутбуков, Steam Deck, Nintendo Switch" }
      ],
      details: [
        { kind: "vid", stem: "4slide-left" },
        { kind: "img", stem: "4slide-left_2" }
      ]
    }
  ];

  // ---- FAQ ----
  var faqData = [
    ["Какой сетевой фильтр выбрать для игрового ПК?", "Для игрового ПК рекомендуется выбирать сетевой фильтр с заземлением, защитой от перегрузки и короткого замыкания, а также запасом по мощности. Современный игровой компьютер, монитор и периферия могут создавать значительную нагрузку, поэтому важно использовать модели, рассчитанные на длительную работу под высокой мощностью."],
    ["Можно ли подключать игровой компьютер через сетевой фильтр?", "Да. Качественный сетевой фильтр предназначен для подключения компьютеров, мониторов, игровых консолей и другой электроники. Он обеспечивает распределение нагрузки между устройствами и дополнительно защищает оборудование от аварийных режимов работы сети."],
    ["Подойдёт ли фильтр для мощного ПК с игровой видеокартой?", "Да. Игровые ПК с производительными видеокартами могут потреблять сотни ватт мощности даже без учёта мониторов и периферии. Поэтому важно использовать фильтр с достаточным запасом по нагрузке и проводниками увеличенного сечения."],
    ["Можно ли подключить компьютер и монитор одновременно?", "Да. Одновременное подключение системного блока, монитора, роутера, колонок и зарядных устройств является штатным режимом работы сетевого фильтра при условии соблюдения допустимой суммарной мощности."],
    ["Зачем нужна варисторная защита в сетевом фильтре?", "Варистор ограничивает кратковременные импульсы повышенного напряжения, возникающие при коммутационных процессах в электросети. Это помогает снизить воздействие опасных скачков напряжения на чувствительные электронные компоненты."],
    ["Для чего нужно заземление в сетевом фильтре?", "Заземление является частью системы электробезопасности и обеспечивает корректную работу устройств, рассчитанных на подключение к заземлённой сети. Особенно это важно для компьютеров, мониторов и блоков питания с помехоподавляющими фильтрами."],
    ["Что показывает индикатор заземления?", "Индикатор позволяет визуально контролировать наличие заземляющего проводника в розетке. Это помогает убедиться, что сетевой фильтр подключён к электросети с рабочим заземлением."],
    ["Чем сетевой фильтр отличается от обычного удлинителя?", "Обычный удлинитель увеличивает количество точек подключения. Сетевой фильтр дополнительно оснащается защитными элементами и рассчитан на безопасную работу подключённого оборудования при нештатных ситуациях в электросети."],
    ["Можно ли подключать игровую консоль через сетевой фильтр?", "Да. Игровые консоли, телевизоры, аудиосистемы и сетевое оборудование относятся к бытовой электронике и могут подключаться через сетевой фильтр при соблюдении допустимой нагрузки."],
    ["Какой фильтр лучше для компьютера и монитора?", "Рекомендуется использовать фильтр с заземлением, защитой от перегрузки и короткого замыкания, качественной контактной группой и медным кабелем достаточного сечения. Такие параметры обеспечивают надёжную работу оборудования при длительной эксплуатации."],
    ["Почему важен медный кабель 3×1,5 мм²?", "Сечение проводников напрямую влияет на способность кабеля безопасно передавать высокую мощность без чрезмерного нагрева. Кабель из чистой меди 3×1,5 мм² обеспечивает низкое сопротивление и рассчитан на длительную работу под высокой нагрузкой."],
    ["Почему важна качественная контактная группа?", "Плотный контакт уменьшает переходное сопротивление в месте подключения вилки. Это снижает нагрев контактов, повышает надёжность соединения и обеспечивает стабильную работу оборудования в течение всего срока службы устройства."]
  ];

  // ---- COMPARE ----
  var compareModels = [
    { name: "TP-FI3U5E-C", price: "3 742 ₽", stem: "TP-FI3U5E-C", url: "https://agni-tech.ru/catalog/setevye-filtrs-horizontalny/tp-fi3u5e-c-2m-black/" },
    { name: "TP-FS4U6E-C", price: "3 743 ₽", stem: "TP-FS4U6E-C", url: "https://agni-tech.ru/catalog/setevye-filtrs-horizontalny/tp-fs4u6e-c-2m-black/" },
    { name: "TP-FO4U10E-C", price: "4 355 ₽", stem: "TP-FO4U10E-C", url: "https://agni-tech.ru/catalog/setevye-filtrs-horizontalny/tp-fo4u10e-c-2m-black/" },
    { name: "VG6U12E-C-W", price: "8 545 ₽", stem: "VG6U12E-C-W", url: "https://agni-tech.ru/catalog/setevye-filtrs-bashni/tp-vg6u12e-c-w-2m-grey-white/" }
  ];

  var compareDefs = [
    { icon: "ph-plugs", label: "Количество розеток", vals: ["5", "6", "10", "12"] },
    { icon: "ph-lightning", label: "Номинальная суммарная мощность", vals: ["4000 Вт", "4000 Вт", "4000 Вт", "4000 Вт"] },
    { icon: "ph-gauge", label: "Ток нагрузки", vals: ["16 А", "16 А", "16 А", "16 А"] },
    { icon: "ph-usb", label: "USB Type A", vals: ["2", "3", "3", "3"] },
    { icon: "ph-usb", label: "USB Type C", vals: ["1", "1", "1", "2"] },
    { icon: "ph-plug-charging", label: "Общая мощность USB разъёмов", vals: ["5 Вт / 20 Вт", "5 Вт / 20 Вт", "5 Вт / 20 Вт", "5 Вт / 65 Вт GaN / 15 Вт беспроводная зарядка"] },
    { icon: "ph-ruler", label: "Длина кабеля", vals: ["2 м / 3 м / 5 м", "2 м / 3 м / 5 м", "2 м / 3 м / 5 м", "2 м"] },
    { icon: "ph-cube", label: "Габариты", vals: ["320×76×40 мм", "236×101×40 мм", "330×108×42 мм", "125×125×200 мм"] }
  ];

  // default selected column → compareModels index
  var keyIdx = { cmpA: 0, cmpB: 3, triA: 0, triB: 1, triC: 3 };

  // ---- EVENTS — marquee photo rail (stems get run through aBp per breakpoint) ----
  var eventsColABase = [
    { stem: "DSC05411", tall: false },
    { stem: "DSC06236", tall: true },
    { stem: "DSC05976", tall: false },
    { stem: "DSC06098", tall: false }
  ];
  var eventsColBBase = [
    { stem: "DSC05938", tall: false },
    { stem: "DSC06299", tall: false },
    { stem: "DSC06456", tall: true }
  ];

  // ---- ADVANTAGES — reference copy; markup lives in index.html ----
  var advantages = [
    { icon: "ph-lightning", title: "До 4000 Вт нагрузки", body: "Подключай всё необходимое одновременно без риска перегрузки.", photoStem: "nagruzka-mrb7l5q2" },
    { icon: "ph-shield-warning", title: "Защита от перегрузки и КЗ", body: "Фильтр защищает оборудование, а не просто занимает место под столом.", photoStem: "peregruz-mrb6p36a" },
    { icon: "ph-pulse", title: "Варисторная защита", body: "Помогает защитить чувствительную технику от вредоносных импульсных скачков.", photoStem: "varistor" },
    { icon: "ph-plug", title: "Кабель из чистой меди 3×1,5\u00A0мм²", body: "Стабильная работа под высокой нагрузкой и запас прочности для мощного оборудования.", photoStem: "med3x15-mrb6z43x" },
    { icon: "ph-plugs-connected", title: "Надёжная контактная группа", body: "Плотная фиксация вилки без люфта и искрения при подключении.", photoStem: "fiksatsia-mrb7g0k7" },
    { icon: "ph-shield-check", title: "Настоящее заземление", body: "Для безопасной работы ПК, мониторов, консолей и другой чувствительной электроники.", photoStem: "zazemlenie-mrb70cww" }
  ];

  window.AGNI_DATA = {
    aBp: aBp,
    scenarioBase: scenarioBase,
    faqData: faqData,
    compareModels: compareModels,
    compareDefs: compareDefs,
    keyIdx: keyIdx,
    eventsColABase: eventsColABase,
    eventsColBBase: eventsColBBase,
    advantages: advantages
  };
})();
