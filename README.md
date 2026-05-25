# SilkovNikitaKNK25

Laboratory work №6 — HTML5 Forms  
Форми входу/реєстрації + вбудована валідація + стилізація без JS

## Опис

Проєкт — це сторінка-портфоліо з додатковими сторінками **“Вхід”** та **“Реєстрація”**.  
Форми реалізовані на чистому HTML/CSS: використано різні типи полів, **HTML5-атрибути валідації** та **візуальний фідбек** через псевдокласи `:valid` / `:invalid` (без JavaScript).

## Що реалізовано

- **Навігація**
  - перехід з головної сторінки на сторінки входу/реєстрації.
- **Сторінки з формами (`login.html`, `register.html`)**
  - розбиття форми на логічні блоки через `fieldset` / `legend`;
  - типи полів: `text`, `email`, `tel`, `radio`, `checkbox`, `date`, `select`, `textarea`;
  - кнопка відправки форми `submit`.
- **HTML5-валидація**
  - `required` для обовʼязкових полів;
  - `minlength` для текстових значень;
  - `pattern` для телефону у форматі **`+380XXXXXXXXX`** (підказка через `title`).
- **Стилізація та стани валідації (CSS)**
  - охайний вигляд форми (відступи, рамки, тіні, адаптивність);
  - підсвічування полів: `:valid` (зелений бордер) та `:invalid:focus` (червоний бордер).

## Структура проєкту

- `index.html` — стартова сторінка-переадресація на основну HTML-сторінку
- `pages/index.html` — основна HTML-сторінка сайту
- `pages/login.html` — сторінка входу (форма)
- `pages/register.html` — сторінка реєстрації (форма)
- `assets/css/style.css` — основні стилі + стилі для форми та валідації
- `README.md` — опис проєкту
- `.gitignore` — ігнорування службових файлів для Git

## Як запустити

### Локально

1. Відкрий `index.html` у браузері (відбудеться автоматичний перехід на `pages/index.html`).
2. Або відкрий напряму:
   - `pages/index.html` — головна
   - `pages/login.html` — форма входу
   - `pages/register.html` — форма реєстрації

### Як перевірити валідацію

- **ПІБ**: залиш порожнім і натисни Submit → браузер заблокує відправку (`required`).
- **Телефон**: введи неправильний формат (наприклад `0991234567`) → буде помилка через `pattern`.
- **Згода з правилами**: не став галочку → форма не відправиться (`required`).

---

## Лабораторна робота №7 — SVG, іконки та адаптивність

**Тема:** [Лекція №7 — оптимізація графіки та продуктивність](https://surkovkostiantyn.github.io/nmk/web_technology/lecture_07.html) · [Лабораторне заняття №7](https://surkovkostiantyn.github.io/nmk/web_technology/lab_07.html)

### Що додано

- **Inline SVG у шапці**
  - кнопка **«Кошик»** з векторною іконкою (`stroke="currentColor"`, розмір 24×24);
  - кнопка **бургер-меню** для мобільних (`aria-label`, прихована на десктопі).
- **Inline SVG у підвалі**
  - посилання на соцмережі (Instagram, Telegram, YouTube) зі стилізацією `:hover` через `fill` / `color`.
- **Адаптивність (`max-width: 768px`)**
  - бургер видимий, горизонтальне меню `.nav-list` приховане (готово до JS у наступному семестрі);
  - зменшені відступи `.page-layout` / `.auth-layout`, типографіка заголовків на малих екранах.
- **Оптимізація зображень (лекція №7)**
  - `width` + `height` на картках — менший CLS;
  - `loading="lazy"` для зображень нижче першого екрану;
  - `srcset` + `sizes` на першій картці (адаптивний вибір розміру з Lorem Picsum).

### Як перевірити (Lab 7)

1. Відкрий `pages/index.html` у браузері.
2. У DevTools увімкни емулятор телефону (ширина ≤ 768px):
   - з’являється іконка бургера;
   - горизонтальне меню зникає;
   - кнопка «Кошик» та іконки соцмереж у футері залишаються читабельними.
3. Наведи курсор на іконки соцмереж — колір змінюється (hover).
4. Прокрути до карток навичок — зображення підвантажуються lazy (Network у DevTools).

### Оновлені файли (Lab 7)

- `pages/index.html` — SVG, бургер, соцмережі, оптимізація `<img>`
- `pages/login.html`, `pages/register.html` — той самий header/footer з SVG
- `assets/css/style.css` — `.menu-toggle`, `.btn-cart`, `.social-links`, медіа-запити

---

## Лабораторна робота №8 — публікація (GitHub Pages / Vercel)

**Завдання:** [Лабораторне заняття №8](https://surkovkostiantyn.github.io/nmk/web_technology/lab_08.html)

### Підготовка проєкту до релізу (зроблено в репозиторії)

- Усі шляхи **відносні** (`../assets/css/style.css`, `pages/index.html`, `login.html`) — немає `C:\...` чи `file://`.
- Точка входу для хостингу: кореневий `index.html` → перенаправлення на `pages/index.html`.
- Файл **`.nojekyll`** — GitHub Pages не обробляє сайт через Jekyll (стилі та структура папок працюють як є).
- **`.gitignore`** — службові файли IDE/ОС не потрапляють у Git.
- Навігація на головній: посилання `index.html`, `#skills`, `#contacts` замість порожніх `#`.
- Логотип на всіх сторінках веде на головну (`<a class="logo" href="index.html">`).

### Перевірка HTML (W3C)

1. Відкрий [W3C Markup Validator](https://validator.w3.org/).
2. Вкладка **Validate by Direct Input** — встав код з `pages/index.html` (або **File Upload**).
3. Переконайся, що немає **Error** (попередження Warning часто допустимі).

### Публікація на GitHub Pages

1. Створи репозиторій на GitHub (наприклад `SilkovNikitaKNK25`) і завантаж код:

```bash
git init
git add .
git commit -m "Prepare static site for deployment"
git branch -M main
git remote add origin https://github.com/ТВІЙ_ЛОГІН/SilkovNikitaKNK25.git
git push -u origin main
```

2. На GitHub: репозиторій → **Settings** → **Pages**.
3. **Build and deployment** → **Source**: гілка **`main`**, папка **`/ (root)`** → **Save**.
4. Зачекай 2–3 хвилини. З’явиться посилання:

`https://ТВІЙ_ЛОГІН.github.io/SilkovNikitaKNK25/`

5. Перевір сторінки:
   - головна (через редірект): `.../pages/index.html`
   - вхід: `.../pages/login.html`
   - реєстрація: `.../pages/register.html`

### Публікація на Vercel (опційно, сучасніший варіант)

1. Зареєструйся на [vercel.com](https://vercel.com) → **Continue with GitHub**.
2. **Add New…** → **Project** → імпортуй репозиторій `SilkovNikitaKNK25`.
3. Framework: **Other** (статичний HTML, без збірки) → **Deploy**.
4. Отримаєш домен на кшталт `silkov-nikita-knk25.vercel.app`.

### Continuous Deployment (CD)

Після підключення GitHub Pages або Vercel:

```bash
# зміни будь-що (наприклад текст у footer)
git add .
git commit -m "Update footer"
git push
```

Сайт оновиться автоматично (Vercel — за кілька секунд; GitHub Pages — 1–3 хв).

### Живі посилання (заповни після деплою)

| Хостинг        | URL |
|----------------|-----|
| GitHub Pages   | `https://____________.github.io/SilkovNikitaKNK25/` |
| Vercel         | `https://____________.vercel.app` |

### Нові / оновлені файли (Lab 8)

- `.gitignore`, `.nojekyll`
- `pages/index.html` — відносні посилання в меню, логотип-посилання
- `pages/login.html`, `pages/register.html` — логотип-посилання на головну
