// ЛР №13: справжній HTTP GET-запит замість локального масиву й таймера.
const PROJECTS_API = "https://api.github.com/users/nikitauroboros-cpu/repos?type=owner&sort=updated&per_page=8";
const container = document.querySelector(".products-grid");
const retryButton = document.getElementById("retryProjects");
let globalStoreProjects = [];
let selectedProjects = [];

// Дані зовнішнього API вставляємо в шаблони тільки після екранування.
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
}

function githubURL(value, hostname) {
    try {
        const url = new URL(value);
        return url.protocol === "https:" && url.hostname === hostname ? url.href : "";
    } catch {
        return "";
    }
}

async function fetchProjects() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
        const response = await fetch(PROJECTS_API, {
            headers: { Accept: "application/vnd.github+json" },
            signal: controller.signal
        });
        if (!response.ok) {
            if (response.status === 403 || response.status === 429) {
                throw new Error("GitHub тимчасово обмежив кількість запитів. Спробуйте пізніше.");
            }
            throw new Error(`Не вдалося завантажити проєкти. HTTP ${response.status}.`);
        }
        const repositories = await response.json();
        if (!Array.isArray(repositories)) {
            throw new Error("GitHub повернув неочікуваний формат даних.");
        }
        return repositories.filter((repo) => Number.isSafeInteger(repo.id) && typeof repo.name === "string")
            .map((repo) => ({
                id: repo.id,
                title: repo.name,
                description: typeof repo.description === "string" && repo.description.trim()
                    ? repo.description : "Навчальний проєкт. Деталі та вихідний код доступні на GitHub.",
                level: typeof repo.language === "string" ? repo.language : "Мову не визначено",
                image: githubURL(repo.owner?.avatar_url, "avatars.githubusercontent.com"),
                alt: `Автор проєкту ${repo.name}`,
                url: githubURL(repo.html_url, "github.com")
            }));
    } catch (error) {
        console.error("Помилка завантаження проєктів:", error);
        if (error.name === "AbortError") {
            throw new Error("GitHub не відповів вчасно. Спробуйте ще раз.");
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

async function initProjects() {
    const loader = document.getElementById("loader");
    loader.classList.remove("hidden");
    retryButton.classList.add("hidden");
    retryButton.disabled = true;
    container.replaceChildren();
    container.setAttribute("aria-busy", "true");
    try {
        const data = await fetchProjects();
        globalStoreProjects = data;
        container.innerHTML = data.length ? data.map((project) => `
            <article class="product-card">
                ${project.image ? `<img class="product-img" src="${escapeHTML(project.image)}"
                    width="400" height="260" alt="${escapeHTML(project.alt)}" loading="lazy">` : ""}
                <h3 class="product-title">${escapeHTML(project.title)}</h3>
                <p class="product-desc">${escapeHTML(project.description)}</p>
                <span class="product-price">${escapeHTML(project.level)}</span>
                ${project.url ? `<p><a href="${escapeHTML(project.url)}" target="_blank" rel="noopener noreferrer">Переглянути на GitHub ↗</a></p>` : ""}
                <button class="btn-buy" type="button" data-id="${project.id}" aria-pressed="false">Обрати проєкт</button>
            </article>
        `).join("") : '<p class="section-note">Публічних проєктів поки немає.</p>';
        updateUI();
    } catch (error) {
        const message = document.createElement("p");
        message.className = "load-error";
        message.setAttribute("role", "alert");
        message.textContent = error instanceof TypeError || error instanceof SyntaxError
            ? "Не вдалося отримати дані з GitHub. Перевірте інтернет і спробуйте ще раз."
            : error.message;
        container.replaceChildren(message);
        retryButton.classList.remove("hidden");
    } finally {
        loader.classList.add("hidden");
        container.setAttribute("aria-busy", "false");
        retryButton.disabled = false;
    }
}

function toggleProject(id) {
    // Пошук у завантаженому глобальному стані, а не в старому масиві навичок.
    const project = globalStoreProjects.find((item) => item.id === id);
    if (!project) return;
    if (selectedProjects.some((item) => item.id === id)) {
        selectedProjects = selectedProjects.filter((item) => item.id !== id);
    } else {
        selectedProjects.push({ ...project });
    }
    updateUI();
}

function calculateTotal() {
    return selectedProjects.reduce((total) => total + 1, 0);
}

function updateUI() {
    const total = calculateTotal();
    document.querySelector(".selection-counter").textContent = total;
    document.getElementById("selection-summary").textContent = total
        ? `Обрано проєктів: ${total}. ${selectedProjects.map((project) => project.title).join(", ")}.`
        : "Поки нічого не обрано. Позначте проєкти, які вас зацікавили.";
    document.getElementById("clear-selection").disabled = total === 0;
    container.querySelectorAll(".btn-buy").forEach((button) => {
        const selected = selectedProjects.some((project) => project.id === Number(button.dataset.id));
        button.setAttribute("aria-pressed", String(selected));
        button.textContent = selected ? "Прибрати з обраного" : "Обрати проєкт";
    });
    renderCartItems();
}

container.addEventListener("click", (event) => {
    const button = event.target.closest(".btn-buy");
    if (!button || !container.contains(button)) return;
    toggleProject(Number(button.dataset.id));
});
document.getElementById("clear-selection").addEventListener("click", () => {
    selectedProjects = [];
    updateUI();
});
retryButton.addEventListener("click", initProjects);

// Модальне вікно використовує той самий selectedProjects, що й картки.
const cartButton = document.querySelector(".btn-cart");
const cartOverlay = document.getElementById("cartOverlay");
const cartDialog = document.getElementById("cartDialog");
const closeBtn = document.getElementById("closeCartBtn");
const cartItemsContainer = document.getElementById("cartItemsContainer");
let closeTimer;
let lastFocusedElement;

function renderCartItems() {
    cartItemsContainer.innerHTML = selectedProjects.length
        ? selectedProjects.map((project) => `
            <article class="cart-item">
                ${project.image ? `<img src="${escapeHTML(project.image)}" alt="${escapeHTML(project.alt)}" width="64" height="48">` : ""}
                <div class="cart-item-info">
                    <h3>${escapeHTML(project.title)}</h3>
                    <p>${escapeHTML(project.level)}</p>
                </div>
                <button class="btn" type="button" data-remove-id="${project.id}"
                    aria-label="Прибрати ${escapeHTML(project.title)} з обраного">Прибрати</button>
            </article>
        `).join("")
        : '<p class="section-note">Поки нічого не обрано. Оберіть проєкти у портфоліо.</p>';
    document.getElementById("cartTotalSum").textContent = calculateTotal();
    document.getElementById("clearModalSelection").disabled = selectedProjects.length === 0;
}

function openCartModal() {
    clearTimeout(closeTimer);
    lastFocusedElement = document.activeElement;
    renderCartItems();
    cartOverlay.classList.remove("hidden");
    // Фіксуємо початкову прозорість перед запуском CSS-переходу.
    void cartOverlay.offsetWidth;
    cartOverlay.classList.add("is-visible");
    document.body.classList.add("modal-open");
    cartButton.setAttribute("aria-expanded", "true");
    document.querySelectorAll("body > header, body > main, body > footer")
        .forEach((element) => { element.inert = true; });
    closeBtn.focus();
}

function closeCartModal() {
    cartOverlay.classList.remove("is-visible");
    cartButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("modal-open");
    document.querySelectorAll("body > header, body > main, body > footer")
        .forEach((element) => { element.inert = false; });
    (lastFocusedElement || cartButton).focus();
    // display: none додається після завершення переходу opacity.
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 300;
    closeTimer = setTimeout(() => cartOverlay.classList.add("hidden"), duration);
}

cartButton.addEventListener("click", openCartModal);
closeBtn.addEventListener("click", closeCartModal);
cartOverlay.addEventListener("click", (event) => {
    if (event.target === cartOverlay) closeCartModal();
});
document.getElementById("contactSelectedBtn").addEventListener("click", closeCartModal);
document.getElementById("clearModalSelection").addEventListener("click", () => {
    selectedProjects = [];
    updateUI();
    closeBtn.focus();
});
cartItemsContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-id]");
    if (!button || !cartItemsContainer.contains(button)) return;
    const id = Number(button.dataset.removeId);
    const index = selectedProjects.findIndex((project) => project.id === id);
    toggleProject(id);
    const buttons = cartItemsContainer.querySelectorAll("[data-remove-id]");
    (buttons[Math.min(index, buttons.length - 1)] || closeBtn).focus();
});
cartDialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        event.preventDefault();
        closeCartModal();
    }
    if (event.key === "Tab") {
        const controls = [...cartDialog.querySelectorAll('button:not(:disabled), a[href]')];
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
});

updateUI();
initProjects();


