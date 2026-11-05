import { CATALOG_DEFAULTS, readStateFromURL, validateCategory, stateURL, sortProjects, paginateProducts } from './catalog-state.js';
// ЛР №13: справжній HTTP GET-запит замість локального масиву й таймера.
const PROJECTS_API = "https://api.github.com/users/nikitauroboros-cpu/repos?type=owner&sort=updated&per_page=8";
const container = document.querySelector(".products-grid");
const retryButton = document.getElementById("retryProjects");
let globalStoreProjects = [];
const SELECTED_STORAGE_KEY = "silkov_portfolio_selected_v1";
const THEME_STORAGE_KEY = "silkov_portfolio_theme";
const DRAFT_STORAGE_KEY = "silkov_portfolio_draft_v1";
let selectedProjects = loadSelectedProjects();
const searchInput = document.getElementById("searchInput");
const searchResultCount = document.getElementById("searchResultCount");
const orderForm = document.getElementById("checkoutOrderForm");
const promoInput = document.getElementById("orderPromo");
const requestResult = document.getElementById("requestResult");
// ЛР №15: умовні одиниці для демонстрації reduce() і SALE10, не ціна послуг.
const DEMO_PROJECT_PRICE = 100;

// ЛР №16: безпечна робота з власними ключами Web Storage.
function storageNotice(message) {
    const notice = document.getElementById("storageNotice");
    if (notice) notice.textContent = message;
}

function readStoredJSON(storageName, key, fallback) {
    try {
        const raw = window[storageName].getItem(key);
        if (raw === null) return fallback;
        try {
            return JSON.parse(raw);
        } catch {
            window[storageName].removeItem(key);
            storageNotice("Пошкоджений збережений запис пропущено. Сайт продовжує працювати.");
            return fallback;
        }
    } catch {
        storageNotice("Пам’ять браузера недоступна. Зміни працюватимуть у поточній сторінці.");
        return fallback;
    }
}

function writeStoredJSON(storageName, key, value) {
    try {
        window[storageName].setItem(key, JSON.stringify(value));
        return true;
    } catch {
        storageNotice("Не вдалося зберегти дані: пам’ять браузера недоступна або заповнена.");
        return false;
    }
}

function removeStoredItem(storageName, key) {
    try {
        window[storageName].removeItem(key);
    } catch {
        storageNotice("Не вдалося очистити збережений запис. Перевірте доступ до пам’яті браузера.");
    }
}

function loadSelectedProjects() {
    const data = readStoredJSON("localStorage", SELECTED_STORAGE_KEY, []);
    if (!Array.isArray(data)) return [];
    const unique = new Map();
    data.slice(0, 100).forEach((project) => {
        if (!project || !Number.isSafeInteger(project.id) || project.id <= 0 || typeof project.title !== "string") return;
        unique.set(project.id, {
            id: project.id,
            title: project.title.slice(0, 200),
            description: typeof project.description === "string" ? project.description.slice(0, 2000) : "",
            level: typeof project.level === "string" ? project.level.slice(0, 100) : "Мову не визначено",
            image: githubURL(project.image, "avatars.githubusercontent.com"),
            alt: typeof project.alt === "string" ? project.alt.slice(0, 250) : "Автор проєкту",
            url: githubURL(project.url, "github.com")
        });
    });
    return [...unique.values()];
}

function saveSelectedProjects() {
    if (selectedProjects.length) writeStoredJSON("localStorage", SELECTED_STORAGE_KEY, selectedProjects);
    else removeStoredItem("localStorage", SELECTED_STORAGE_KEY);
}

const draftFields = { clientName: 120, clientPhone: 40, clientEmail: 254, orderPromo: 32 };
function saveOrderFormDraft() {
    const draft = Object.fromEntries(Object.entries(draftFields).map(([id, limit]) => [id, document.getElementById(id).value.slice(0, limit)]));
    if (Object.values(draft).some(Boolean)) writeStoredJSON("sessionStorage", DRAFT_STORAGE_KEY, draft);
    else removeStoredItem("sessionStorage", DRAFT_STORAGE_KEY);
}

function restoreOrderFormDraft() {
    const draft = readStoredJSON("sessionStorage", DRAFT_STORAGE_KEY, null);
    if (!draft || typeof draft !== "object" || Array.isArray(draft)) return;
    Object.entries(draftFields).forEach(([id, limit]) => {
        if (typeof draft[id] === "string") document.getElementById(id).value = draft[id].slice(0, limit);
    });
}

const themeToggleBtn = document.getElementById("themeToggleBtn");
function applyTheme(theme) {
    const dark = theme === "dark";
    document.documentElement.classList.toggle("dark-theme", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    themeToggleBtn.textContent = dark ? "☀ Світла тема" : "☾ Темна тема";
    themeToggleBtn.setAttribute("aria-pressed", String(dark));
    themeToggleBtn.setAttribute("aria-label", dark ? "Увімкнути світлу тему" : "Увімкнути темну тему");
}

themeToggleBtn.addEventListener("click", () => {
    const next = document.documentElement.classList.contains("dark-theme") ? "light" : "dark";
    applyTheme(next);
    try {
        window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
        storageNotice("Вибрану тему застосовано, але пам’ять браузера недоступна для збереження.");
    }
});

window.addEventListener("storage", (event) => {
    // Не зберігаємо стан повторно у відповідь на чужу зміну: без циклу подій.
    let local;
    try { local = window.localStorage; } catch { return; }
    if (event.storageArea !== local) return;
    if (event.key === SELECTED_STORAGE_KEY || event.key === null) {
        selectedProjects = loadSelectedProjects();
        updateUI();
    }
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
        let saved = null;
        try { saved = local.getItem(THEME_STORAGE_KEY); } catch { /* Застосовуємо системну тему. */ }
        const fallback = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        applyTheme(saved === "dark" || saved === "light" ? saved : fallback);
    }
});

window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    try { if (window.localStorage.getItem(THEME_STORAGE_KEY)) return; } catch { /* Використовуємо системну тему. */ }
    applyTheme(document.documentElement.classList.contains("dark-theme") ? "dark" : "light");
});

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
                url: githubURL(repo.html_url, "github.com"),
                stars: Number.isSafeInteger(repo.stargazers_count) ? repo.stargazers_count : 0,
                updated: Date.parse(repo.updated_at) || 0
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
                <p class="project-stars">★ ${project.stars ?? 0} зірок на GitHub</p>
                ${project.url ? `<p><a draggable="false" href="${escapeHTML(project.url)}" target="_blank" rel="noopener noreferrer">Переглянути на GitHub ↗</a></p>` : ""}
                <button class="btn-buy" type="button" data-id="${project.id}" aria-pressed="false">Обрати проєкт</button>
            </article>
        `).join("") : '<p class="section-note">Проєктів не знайдено.</p>';
    syncProjectButtons();
}

// ЛР17: URL є джерелом відновлення; обране й тема залишаються у Web Storage.
let catalogState = readStateFromURL(location.search);
let catalogReady = false;
let searchTimer;
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const perPageSelect = document.getElementById('perPageSelect');
const pagination = document.getElementById('pagination');
const shareStatus = document.getElementById('shareStatus');
function syncURL(mode) {
    const url = stateURL(location.href, catalogState);
    // replace також створює початковий знімок history.state, push — лише реальні зміни.
    if (mode === 'replace' || url.href !== location.href) history[mode === 'push' ? 'pushState' : 'replaceState']({...catalogState}, '', url);
}
function applyStateToControls() {
    searchInput.value = catalogState.q;
    categorySelect.value = catalogState.category;
    sortSelect.value = catalogState.sort;
    perPageSelect.value = String(catalogState.perPage);
}
function populateCategories() {
    categorySelect.replaceChildren(new Option('Усі мови', 'all'));
    [...new Set(globalStoreProjects.map(p => p.level))].sort().forEach(value => categorySelect.add(new Option(value, value)));
}
function updateCatalog(mode) {
    if (!catalogReady) return;
    catalogState.category = validateCategory(catalogState.category, globalStoreProjects);
    const query = catalogState.q.toLocaleLowerCase();
    const filtered = globalStoreProjects.filter(p => p.title.toLocaleLowerCase().includes(query) && (catalogState.category === 'all' || p.level === catalogState.category));
    const result = paginateProducts(sortProjects(filtered, catalogState.sort), catalogState.page, catalogState.perPage);
    const corrected = catalogState.page !== result.currentPage;
    catalogState.page = result.currentPage;
    applyStateToControls();
    renderProjects(result.items);
    searchResultCount.textContent = result.totalItems ? `Показано ${result.startIndex+1}–${result.startIndex+result.items.length} з ${result.totalItems} проєктів` : catalogState.q ? `За запитом «${catalogState.q}» нічого не знайдено` : 'У цій категорії немає проєктів';
    pagination.replaceChildren();
    if (result.totalPages > 1) {
        const add = (label, page, disabled, current = false) => {
            const button = document.createElement('button');
            button.type = 'button'; button.className = 'page-btn'; button.textContent = label;
            button.dataset.page = String(page); button.disabled = disabled;
            if (current) button.setAttribute('aria-current', 'page');
            pagination.append(button);
        };
        add('← Попередня', result.currentPage-1, result.currentPage === 1);
        for (let page=1; page<=result.totalPages; page++) add(String(page), page, false, page === result.currentPage);
        add('Наступна →', result.currentPage+1, result.currentPage === result.totalPages);
    }
    if (mode || corrected) syncURL(mode || 'replace');
}
function flushSearch() {
    clearTimeout(searchTimer);
    catalogState.q = searchInput.value.trim().slice(0,50);
}
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { flushSearch(); catalogState.page=1; updateCatalog('replace'); }, 300);
});
for (const [control,key] of [[categorySelect,'category'], [sortSelect,'sort'], [perPageSelect,'perPage']]) {
    control.addEventListener('change', () => {
        flushSearch(); catalogState[key] = key === 'perPage' ? Number(control.value) : control.value;
        catalogState.page=1; updateCatalog('push');
    });
}
function goToPage(page) {
    if (!catalogReady || page === catalogState.page) return;
    flushSearch(); catalogState.page=page; updateCatalog('push');
    document.querySelector('.catalog-toolbar').scrollIntoView({behavior:'smooth', block:'start'});
}
pagination.addEventListener('click', event => {
    const button = event.target.closest('button[data-page]');
    if (button && !button.disabled) goToPage(Number(button.dataset.page));
});
document.getElementById('resetFiltersBtn').addEventListener('click', () => {
    clearTimeout(searchTimer); catalogState={...CATALOG_DEFAULTS}; updateCatalog('push');
});
window.addEventListener('popstate', () => {
    clearTimeout(searchTimer); catalogState=readStateFromURL(location.search);
    applyStateToControls(); updateCatalog(); // не додає записів в історію
});
document.addEventListener('keydown', event => {
    if (event.altKey || event.metaKey || event.ctrlKey || event.shiftKey || event.defaultPrevented || !catalogReady) return;
    if (event.target.closest('input, textarea, select, button, a, [contenteditable], [role="dialog"]') || !document.getElementById('cartOverlay').classList.contains('hidden')) return;
    const buttons = [...pagination.querySelectorAll('button')];
    const button = event.key === 'ArrowLeft' ? buttons[0] : event.key === 'ArrowRight' ? buttons.at(-1) : null;
    if (button && !button.disabled) { event.preventDefault(); goToPage(Number(button.dataset.page)); }
});
document.getElementById('shareLinkBtn').addEventListener('click', async () => {
    const changed = searchInput.value.trim().slice(0,50) !== catalogState.q;
    flushSearch(); if (changed) catalogState.page=1;
    updateCatalog('replace');
    const field = document.getElementById('shareLinkFallback');
    try { await navigator.clipboard.writeText(location.href); field.hidden=true; shareStatus.textContent='Посилання скопійовано.'; }
    catch { field.hidden=false; field.value=location.href; field.focus(); field.select(); shareStatus.textContent='Скопіюйте виділене посилання вручну.'; }
});
applyStateToControls();

async function initProjects() {
    const loader = document.getElementById("loader");
    loader.classList.remove("hidden");
    retryButton.classList.add("hidden");
    retryButton.disabled = true;
    catalogReady = false;
    pagination.replaceChildren();
    searchInput.disabled = true;
    [categorySelect,sortSelect,perPageSelect].forEach(c => c.disabled=true);
    searchResultCount.textContent = "";
    container.replaceChildren();
    container.setAttribute("aria-busy", "true");
    try {
        const data = await fetchProjects();
        globalStoreProjects = data;
        searchInput.disabled = false;
        catalogReady = true;
        populateCategories();
        catalogState = readStateFromURL(location.search);
        [categorySelect,sortSelect,perPageSelect].forEach(c => c.disabled=false);
        updateCatalog("replace");
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
    const project = globalStoreProjects.find((item) => item.id === id) || selectedProjects.find((item) => item.id === id);
    if (!project) return;
    if (selectedProjects.some((item) => item.id === id)) {
        selectedProjects = selectedProjects.filter((item) => item.id !== id);
    } else {
        selectedProjects.push({ ...project });
    }
    updateUI({ persist: true });
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

function updateUI({ persist = false } = {}) {
    if (persist) saveSelectedProjects();
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
    updateUI({ persist: true });
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
    updateUI({ persist: true });
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
    updateUI({ persist: true });
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
    saveOrderFormDraft();
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
    removeStoredItem("sessionStorage", DRAFT_STORAGE_KEY);
    showRequestErrors({});
    updateUI({ persist: true });
    closeCartModal();
    requestResult.textContent = `Дякуємо, ${customer.name}! Заявку сформовано локально. Проєктів: ${requestData.count}. Навчальний підсумок: ${requestData.totalToPay.toFixed(2)} ум. од. Дані нікуди не надіслано.`;
    requestResult.classList.remove("hidden");
    requestResult.focus();
});

restoreOrderFormDraft();
applyTheme(document.documentElement.classList.contains("dark-theme") ? "dark" : "light");
updateUI();
initProjects();





