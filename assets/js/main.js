// ЛР №13: справжній HTTP GET-запит замість локального масиву й таймера.
const PROJECTS_API = "https://api.github.com/users/nikitauroboros-cpu/repos?type=owner&sort=updated&per_page=8";
const container = document.querySelector(".products-grid");
const retryButton = document.getElementById("retryProjects");
let globalStoreProjects = [];
let selectedProjects = [];
const searchInput = document.getElementById("searchInput");
const searchResultCount = document.getElementById("searchResultCount");
const orderForm = document.getElementById("checkoutOrderForm");
const promoInput = document.getElementById("orderPromo");
const requestResult = document.getElementById("requestResult");
// ЛР №15: умовні одиниці для демонстрації reduce() і SALE10, не ціна послуг.
const DEMO_PROJECT_PRICE = 100;

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

// Один рендерер для первинного завантаження та живого пошуку.
function renderProjects(projectsToDisplay) {
    container.innerHTML = projectsToDisplay.length ? projectsToDisplay.map((project) => `
            <article class="product-card" draggable="true" data-id="${project.id}">
                ${project.image ? `<img class="product-img" draggable="false" src="${escapeHTML(project.image)}"
                    width="400" height="260" alt="${escapeHTML(project.alt)}" loading="lazy">` : ""}
                <h3 class="product-title">${escapeHTML(project.title)}</h3>
                <p class="product-desc">${escapeHTML(project.description)}</p>
                <span class="product-price">${escapeHTML(project.level)}</span>
                ${project.url ? `<p><a draggable="false" href="${escapeHTML(project.url)}" target="_blank" rel="noopener noreferrer">Переглянути на GitHub ↗</a></p>` : ""}
                <button class="btn-buy" type="button" data-id="${project.id}" aria-pressed="false">Обрати проєкт</button>
            </article>
        `).join("") : '<p class="section-note">Проєктів не знайдено.</p>';
    syncProjectButtons();
}

function applyProjectSearch() {
    const query = searchInput.value.trim().toLowerCase();
    const matchedProjects = globalStoreProjects.filter((project) => project.title.toLowerCase().includes(query));
    searchResultCount.textContent = query ? `Знайдено проєктів: ${matchedProjects.length}` : "";
    renderProjects(matchedProjects);
}

searchInput.addEventListener("input", applyProjectSearch);

async function initProjects() {
    const loader = document.getElementById("loader");
    loader.classList.remove("hidden");
    retryButton.classList.add("hidden");
    retryButton.disabled = true;
    searchInput.disabled = true;
    searchResultCount.textContent = "";
    container.replaceChildren();
    container.setAttribute("aria-busy", "true");
    try {
        const data = await fetchProjects();
        globalStoreProjects = data;
        searchInput.disabled = false;
        applyProjectSearch();
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

function syncProjectButtons() {
    container.querySelectorAll(".btn-buy").forEach((button) => {
        const selected = selectedProjects.some((project) => project.id === Number(button.dataset.id));
        button.setAttribute("aria-pressed", String(selected));
        button.textContent = selected ? "Прибрати з обраного" : "Обрати проєкт";
    });
}

function updateUI() {
    const total = calculateTotal();
    document.querySelector(".selection-counter").textContent = total;
    document.getElementById("selection-summary").textContent = total
        ? `Обрано проєктів: ${total}. ${selectedProjects.map((project) => project.title).join(", ")}.`
        : "Поки нічого не обрано. Позначте проєкти, які вас зацікавили.";
    document.getElementById("clear-selection").disabled = total === 0;
    syncProjectButtons();
    renderCartItems();
    renderFavorites();
    dragStatus.textContent = "";
    updateRequestSummary();
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

// ЛР №14: делегування dragstart/dragend на постійному контейнері.
const favoritesZone = document.getElementById("favoritesZone");
const favoritesList = document.getElementById("favoritesList");
const dragStatus = document.getElementById("dragStatus");
let draggedProjectId = null;
let draggedCard = null;

function renderFavorites() {
    favoritesList.innerHTML = selectedProjects.map((project) => `
        <li class="fav-item">${escapeHTML(project.title)} <span>ID: ${project.id}</span></li>
    `).join("");
}

function resetDrag() {
    draggedCard?.classList.remove("dragging");
    favoritesZone.classList.remove("drag-over");
    draggedCard = null;
    draggedProjectId = null;
}

container.addEventListener("dragstart", (event) => {
    const card = event.target.closest(".product-card");
    if (!card || !container.contains(card) || !event.dataTransfer) return;
    if (event.target.closest("button, a, input")) {
        event.preventDefault();
        return;
    }
    const id = Number(card.dataset.id);
    if (!globalStoreProjects.some((project) => project.id === id)) {
        event.preventDefault();
        return;
    }
    draggedProjectId = id;
    draggedCard = card;
    event.dataTransfer.setData("text/plain", String(id));
    event.dataTransfer.effectAllowed = "copy";
    card.classList.add("dragging");
});

container.addEventListener("dragend", resetDrag);

favoritesZone.addEventListener("dragover", (event) => {
    // Приймаємо лише картки поточного портфоліо, а не сторонні файли чи текст.
    if (draggedProjectId === null || !event.dataTransfer) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    favoritesZone.classList.add("drag-over");
});

favoritesZone.addEventListener("dragleave", (event) => {
    if (!favoritesZone.contains(event.relatedTarget)) {
        favoritesZone.classList.remove("drag-over");
    }
});

favoritesZone.addEventListener("drop", (event) => {
    event.preventDefault();
    const rawId = event.dataTransfer?.getData("text/plain") || "";
    const id = /^\d+$/.test(rawId) ? Number(rawId) : NaN;
    const project = globalStoreProjects.find((item) => item.id === id);
    const valid = Number.isSafeInteger(id) && id === draggedProjectId && project;
    resetDrag();
    if (!valid) return;
    if (selectedProjects.some((item) => item.id === id)) {
        dragStatus.textContent = `Проєкт ${project.title} вже є в улюблених.`;
        return;
    }
    selectedProjects.push({ ...project });
    updateUI();
    dragStatus.textContent = `Проєкт ${project.title} додано в улюблені.`;
});

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
    requestResult.classList.add("hidden");
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
        const controls = [...cartDialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled)')];
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

// ЛР №15: нормалізація, FormData, валідація та локальний JSON заявки.
function normalizeRequestData(formData) {
    return {
        name: String(formData.get("clientName") || "").trim().replace(/\s+/g, " "),
        phone: String(formData.get("clientPhone") || "").replaceAll(/[\s()\-]/g, ""),
        email: String(formData.get("clientEmail") || "").trim().toLowerCase(),
        promo: String(formData.get("orderPromo") || "").trim().toUpperCase()
    };
}

function getRequestErrors(customer) {
    const errors = {};
    const words = customer.name.split(" ").filter(Boolean);
    const nameWord = /^[\p{L}][\p{L}'’ʼ-]*$/u;
    if (words.length < 2 || customer.name.length > 120 || words.some((word) => word.length < 2 || !nameWord.test(word))) {
        errors.clientName = "Введіть ім’я та прізвище: щонайменше два слова від двох літер.";
    }
    if (!/^\+?380\d{9}$/.test(customer.phone)) {
        errors.clientPhone = "Введіть номер у форматі +380XXXXXXXXX.";
    }
    if (customer.email.length > 254 || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(customer.email)) {
        errors.clientEmail = "Введіть коректну пошту, наприклад user@example.com.";
    }
    return errors;
}

const errorFields = { clientName: "nameError", clientPhone: "phoneError", clientEmail: "emailError" };
function showRequestErrors(errors) {
    Object.entries(errorFields).forEach(([field, errorId]) => {
        document.getElementById(errorId).textContent = errors[field] || "";
        document.getElementById(field).setAttribute("aria-invalid", String(Boolean(errors[field])));
    });
}

function calculateRequestSummary(projects, promo) {
    const count = projects.reduce((sum) => sum + 1, 0);
    const subtotal = projects.reduce((sum) => sum + DEMO_PROJECT_PRICE, 0);
    const discountPercent = promo === "SALE10" ? 10 : 0;
    const discountAmount = Math.round(subtotal * discountPercent) / 100;
    return { count, subtotal, discountPercent, discountAmount, totalToPay: Number(Math.max(0, subtotal - discountAmount).toFixed(2)) };
}

function updateRequestSummary() {
    const promo = promoInput.value.trim().toUpperCase();
    const summary = calculateRequestSummary(selectedProjects, promo);
    document.getElementById("requestSubtotal").textContent = summary.subtotal.toFixed(2);
    document.getElementById("requestDiscount").textContent = summary.discountAmount.toFixed(2);
    document.getElementById("requestTotal").textContent = summary.totalToPay.toFixed(2);
    document.getElementById("promoStatus").textContent = promo
        ? (summary.discountPercent ? "SALE10: навчальну знижку 10% застосовано." : "Промокод не розпізнано. Знижку не застосовано.") : "";
    document.getElementById("orderError").textContent = "";
    return summary;
}

function buildRequestData(customer, projects) {
    return {
        type: "portfolio_inquiry_demo",
        customer: { name: customer.name, phone: customer.phone, email: customer.email },
        items: projects.map((project) => ({
            id: project.id, title: project.title, url: project.url,
            quantity: 1, demoPrice: DEMO_PROJECT_PRICE, demoCost: DEMO_PROJECT_PRICE
        })),
        pricingMode: "educational_example_not_service_price",
        unit: "умовні одиниці",
        promoCode: customer.promo || null,
        ...calculateRequestSummary(projects, customer.promo),
        createdAt: new Date().toISOString()
    };
}

promoInput.addEventListener("input", updateRequestSummary);
orderForm.addEventListener("input", (event) => {
    const errorId = errorFields[event.target.id];
    if (errorId) {
        document.getElementById(errorId).textContent = "";
        event.target.setAttribute("aria-invalid", "false");
    }
});

orderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const customer = normalizeRequestData(new FormData(orderForm));
    const errors = getRequestErrors(customer);
    showRequestErrors(errors);
    if (Object.keys(errors).length) {
        document.getElementById(Object.keys(errors)[0]).focus();
        return;
    }
    if (selectedProjects.length === 0) {
        document.getElementById("orderError").textContent = "Спочатку оберіть хоча б один проєкт.";
        return;
    }
    const requestData = buildRequestData(customer, selectedProjects);
    // Навчальний результат лише у поточному браузері; запиту на сервер немає.
    console.log("Заявку сформовано локально (JSON Payload):", JSON.stringify(requestData, null, 2));
    selectedProjects = [];
    orderForm.reset();
    showRequestErrors({});
    updateUI();
    closeCartModal();
    requestResult.textContent = `Дякуємо, ${customer.name}! Заявку сформовано локально. Проєктів: ${requestData.count}. Навчальний підсумок: ${requestData.totalToPay.toFixed(2)} ум. од. Дані нікуди не надіслано.`;
    requestResult.classList.remove("hidden");
    requestResult.focus();
});

updateUI();
initProjects();




