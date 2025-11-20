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
