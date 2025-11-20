/**
|--------------------------------------------------
| 記録を検索文字列でフィルタリング
|--------------------------------------------------
*/
/**
 * 記録を検索文字列でフィルタリング
 * @param {Array} entries
 * @param {string} query
 * @returns {Array}
 */

export function filterEntries(entries, query) {
  if (!query || query.trim().length === 0) {
    return entries;
  }
  const lowerQuery = query.toLowerCase();
  return entries.filter((entry) => {
    const beanMatch = entry.bean.toLowerCase().includes(lowerQuery);
    const noteMatch =
      entry.note && entry.note.toLowerCase().includes(lowerQuery);
    return beanMatch || noteMatch;
  });
}
