// Shared utility functions for all pages

function formatDate(dateString) {
    // Parse the date as local time to avoid timezone issues
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString();
}

function filterByYear(items, year, dateField) {
    return items.filter(item => item[dateField].startsWith(year));
}

function formatWordCount(count) {
    return count.toLocaleString();
}