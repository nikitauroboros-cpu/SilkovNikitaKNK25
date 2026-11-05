// ЛР17: чисті функції стану — незалежні від DOM і джерела даних.
export const CATALOG_DEFAULTS = Object.freeze({q: '', category: 'all', sort: 'default', page: 1, perPage: 4});
export const ALLOWED_SORTS = ['default', 'title_asc', 'title_desc', 'stars_desc', 'updated_desc'];
export const ALLOWED_PAGE_SIZES = [1, 2, 4, 6, 8, 12];
export function readStateFromURL(search) {
    const p = new URLSearchParams(search);
    const integer = (value, fallback) => /^\d+$/.test(value ?? '') && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
    const perPage = integer(p.get('perPage'), 4);
    return {
        q: (p.get('q') || '').trim().slice(0, 50),
        category: (p.get('category') || 'all').slice(0, 100),
        sort: ALLOWED_SORTS.includes(p.get('sort')) ? p.get('sort') : 'default',
        page: integer(p.get('page'), 1),
        perPage: ALLOWED_PAGE_SIZES.includes(perPage) ? perPage : 4
    };
}
export function validateCategory(category, projects) {
    return projects.some(p => p.level === category) ? category : 'all';
}
export function stateURL(href, state) {
    const url = new URL(href);
    for (const [key, fallback] of Object.entries(CATALOG_DEFAULTS)) {
        url.searchParams.delete(key); // прибираємо також дублікати керованих параметрів
        if (state[key] !== fallback) url.searchParams.set(key, String(state[key]));
    }
    return url;
}
export function sortProjects(projects, sort) {
    const copy = [...projects];
    const title = (a,b) => a.title.localeCompare(b.title, 'uk', {numeric: true});
    if (sort === 'title_asc') copy.sort(title);
    if (sort === 'title_desc') copy.sort((a,b) => title(b,a));
    if (sort === 'stars_desc') copy.sort((a,b) => b.stars-a.stars || title(a,b));
    if (sort === 'updated_desc') copy.sort((a,b) => b.updated-a.updated || title(a,b));
    return copy;
}
export function paginateProducts(projects, page, perPage) {
    const totalPages = Math.max(1, Math.ceil(projects.length / perPage));
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage-1)*perPage;
    return {items: projects.slice(startIndex, startIndex+perPage), totalItems: projects.length, totalPages, currentPage, startIndex};
}
