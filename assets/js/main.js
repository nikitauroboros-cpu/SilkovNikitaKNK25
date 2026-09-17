const skills = [
    {
        "id": 1,
        "title": "HTML",
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
        "category": "css",
        "image": "https://picsum.photos/400/260?random=22",
        "description": "Освоюю стилізацію сайтів, роботу з кольорами, відступами, шрифтами та Flexbox.",
        "level": "У процесі вивчення",
        "alt": "Випадкове зображення для CSS"
    },
    {
        "id": 3,
        "title": "Веб-дизайн",
        "category": "design",
        "image": "https://picsum.photos/400/260?random=33",
        "description": "Прагну створювати охайні та зручні інтерфейси, які добре виглядають на різних екранах.",
        "level": "Практичні роботи",
        "alt": "Випадкове зображення для веб-дизайну"
    },
    {
        "id": 4,
        "title": "Адаптивна верстка",
        "category": "responsive",
        "image": "https://picsum.photos/400/260?random=44",
        "description": "Навчаюсь будувати сторінки, де блоки переносяться та коректно перебудовуються при зміні ширини екрана.",
        "level": "CSS Grid layout",
        "alt": "Випадкове зображення для адаптивної верстки"
    },
    {
        "id": 5,
        "title": "HTML-форми",
        "category": "html",
        "image": "https://picsum.photos/400/260?random=55",
        "description": "Створення форм входу та реєстрації з перевіркою введених даних.",
        "alt": "Випадкове зображення для HTML-форм",
        "level": "Практикую"
    },
    {
        "id": 6,
        "title": "CSS-анімації",
        "category": "css",
        "image": "https://picsum.photos/400/260?random=66",
        "description": "Плавні переходи, ефекти наведення та анімації елементів сторінки.",
        "alt": "Випадкове зображення для CSS-анімацій",
        "level": "Практикую"
    },
    {
        "id": 7,
        "title": "Дизайн інтерфейсів",
        "category": "design",
        "image": "https://picsum.photos/400/260?random=77",
        "description": "Підбір кольорів, типографіки та зручного розташування елементів.",
        "alt": "Випадкове зображення для дизайну інтерфейсів",
        "level": "Практикую"
    },
    {
        "id": 8,
        "title": "Адаптивна сторінка",
        "category": "responsive",
        "image": "https://picsum.photos/400/260?random=88",
        "description": "Верстка сторінки для телефонів, планшетів і великих екранів.",
        "alt": "Випадкове зображення для адаптивної сторінки",
        "level": "Практикую"
    }
];

const container = document.querySelector(".products-grid");
let selectedSkills = [];

container.innerHTML = skills
    .map((skill) => `
        <article class="product-card">
            <img class="product-img" src="${skill.image}"
                ${skill.srcset ? `srcset="${skill.srcset}" sizes="${skill.sizes}"` : ""}
                width="400" height="260" alt="${skill.alt}" loading="lazy">
            <h3 class="product-title">${skill.title}</h3>
            <p class="product-desc">${skill.description}</p>
            <span class="product-price">${skill.level}</span>
            <button class="btn-buy" type="button" data-id="${skill.id}" aria-pressed="false">Обрати навичку</button>
        </article>
    `)
    .join("");

function toggleSkill(id) {
    const skill = skills.find((item) => item.id === id);
    if (!skill) return;

    const existingSkill = selectedSkills.find((item) => item.id === id);
    if (existingSkill) {
        selectedSkills = selectedSkills.filter((item) => item.id !== id);
    } else {
        selectedSkills.push({ ...skill });
    }

    updateUI();
}

function calculateTotal() {
    return selectedSkills.reduce((total) => total + 1, 0);
}

function updateUI() {
    const total = calculateTotal();
    document.querySelector(".selection-counter").textContent = total;
    document.querySelector("#selection-summary").textContent = total
        ? `Обрано навичок: ${total}. ${selectedSkills.map((skill) => skill.title).join(", ")}.`
        : "Поки нічого не обрано. Позначте навички, які вас зацікавили.";
    document.querySelector("#clear-selection").disabled = total === 0;

    container.querySelectorAll(".btn-buy").forEach((button) => {
        const selected = selectedSkills.some((skill) => skill.id === Number(button.dataset.id));
        button.setAttribute("aria-pressed", String(selected));
        button.textContent = selected ? "Прибрати з обраного" : "Обрати навичку";
    });

    console.log("Обрані навички:", selectedSkills);
    console.log("Кількість обраних навичок:", total);
}

container.addEventListener("click", (event) => {
    const button = event.target.closest(".btn-buy");
    if (!button || !container.contains(button)) return;
    toggleSkill(Number(button.dataset.id));
});

document.querySelector("#clear-selection").addEventListener("click", () => {
    selectedSkills = [];
    updateUI();
});

updateUI();
