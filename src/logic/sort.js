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
  const sorted = [...entries]; //元配列を壊さない
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
