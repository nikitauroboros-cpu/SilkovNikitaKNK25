
const products = [
    {
        "id": 1,
        "title": "HTML",
        "price": 0,
        "category": "html",
        "image": "https://picsum.photos/400/260?random=11",
        "description": "Вивчаю створення структурованих веб-сторінок та правильну семантичну розмітку.",
        "level": "Початковий рівень",
        "alt": "Випадкове зображення для HTML",
        "srcset": "https://picsum.photos/400/260?random=11 400w, https://picsum.photos/800/520?random=11 800w",
        "sizes": "(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 400px"
    },
    {
        "id": 2,
        "title": "CSS",
        "price": 0,
        "category": "css",
        "image": "https://picsum.photos/400/260?random=22",
        "description": "Освоюю стилізацію сайтів, роботу з кольорами, відступами, шрифтами та Flexbox.",
        "level": "У процесі вивчення",
        "alt": "Випадкове зображення для CSS"
    },
    {
        "id": 3,
        "title": "Веб-дизайн",
        "price": 0,
        "category": "design",
        "image": "https://picsum.photos/400/260?random=33",
        "description": "Прагну створювати охайні та зручні інтерфейси, які добре виглядають на різних екранах.",
        "level": "Практичні роботи",
        "alt": "Випадкове зображення для веб-дизайну"
    },
    {
        "id": 4,
        "title": "Адаптивна верстка",
        "price": 0,
        "category": "responsive",
        "image": "https://picsum.photos/400/260?random=44",
        "description": "Навчаюсь будувати сторінки, де блоки переносяться та коректно перебудовуються при зміні ширини екрана.",
        "level": "CSS Grid layout",
        "alt": "Випадкове зображення для адаптивної верстки"
    },
    {
        "id": 5,
        "title": "HTML-форми",
        "price": 300,
        "category": "html",
        "image": "https://picsum.photos/400/260?random=55",
        "description": "Створення форм входу та реєстрації з перевіркою введених даних.",
        "alt": "Випадкове зображення для HTML-форм"
    },
    {
        "id": 6,
        "title": "CSS-анімації",
        "price": 400,
        "category": "css",
        "image": "https://picsum.photos/400/260?random=66",
        "description": "Плавні переходи, ефекти наведення та анімації елементів сторінки.",
        "alt": "Випадкове зображення для CSS-анімацій"
    },
    {
        "id": 7,
        "title": "Дизайн інтерфейсів",
        "price": 600,
        "category": "design",
        "image": "https://picsum.photos/400/260?random=77",
        "description": "Підбір кольорів, типографіки та зручного розташування елементів.",
        "alt": "Випадкове зображення для дизайну інтерфейсів"
    },
    {
        "id": 8,
        "title": "Адаптивна сторінка",
        "price": 800,
        "category": "responsive",
        "image": "https://picsum.photos/400/260?random=88",
        "description": "Верстка сторінки для телефонів, планшетів і великих екранів.",
        "alt": "Випадкове зображення для адаптивної сторінки"
    }
];

const container = document.querySelector(".products-grid");

const htmlString = products
    .map((product) => {
        return `
            <article class="product-card">
                <img
                    class="product-img"
                    src="${product.image}"
                    ${product.srcset ? `srcset="${product.srcset}" sizes="${product.sizes}"` : ""}
                    width="400"
                    height="260"
                    alt="${product.alt}"
                    loading="lazy"
                >
                <h3 class="product-title">${product.title}</h3>
                <p class="product-desc">${product.description}</p>
                <span class="product-price">${product.level ?? `${product.price} грн`}</span>
                <button class="btn-buy" type="button" data-id="${product.id}">Детальніше</button>
            </article>
        `;
    })
    .join("");

container.innerHTML = htmlString;

