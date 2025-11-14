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

/**
|--------------------------------------------------
| 記録をソート
|--------------------------------------------------
*/

/**
 * 記録をソート
 * @param {Array} entries - 記録の配列
 * @param {string} key - ソートキー（'date' | 'score' | 'bean'）
 * @param {string} order - ソート順（'asc' | 'desc'）
 * @returns {Array} - ソート済みの記録
 */

export function sortEntries(entries, key, order) {
  const sorted = [...entries]; //元配列おｗ壊さない
  // ソートキーに応じて比較対象を決定
  sorted.sort((a, b) => {
    let compareA;
    let compareB;

    if (key === "date") {
      compareA = new Date(a.date);
      compareB = new Date(b.date);
    } else if (key === "score") {
      compareA = a.score;
      compareB = b.score;
    } else if (key == "bean") {
      compareA = a.bean.toLowerCase();
      compareB = b.bean.toLowerCase();
    } else {
      return 0; //想定外キーは並び替えない
    }

    if (order === "asc") {
      if (compareA < compareB) return -1;
      if (compareA > compareB) return 1;
      return 0;
    } else {
      if (compareA < compareB) return 1;
      if (compareA > compareB) return -1;
      return 0;
    }
  });

  return sorted;
}

/**
|--------------------------------------------------
| 統計情報を計算
|--------------------------------------------------
*/
/**
 * 統計情報を計算
 * @param {Array} entries - 記録の配列
 * @returns {Object} - 統計情報 { avg, max, maxBean, total }
 */

export function calculateStats(entries) {
  if (entries.length === 0) {
    return { avg: 0, max: 0, maxBean: null, total: 0 };
  }
  //平均評価
  const totalScore = entries.reduce((sum, entry) => sum + entry.score, 0);
  const avg = totalScore / entries.length;
  //最高評価
  const maxEntry = entries.reduce((max, entry) => {
    return entry.score > max.score ? entry : max;
  }, entries[0]);

  return {
    avg: Math.round(avg * 10) / 10, //少数一桁に丸める
    max: maxEntry.score,
    maxBean: maxEntry.bean,
    total: entries.length,
  };
}
