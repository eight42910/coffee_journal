/**
 * ページネーション
 * @param {Array} entries - 記録の配列
 * @param {number} page - 現在のページ（1始まり）
 * @param {number} perPage - 1ページあたりの件数
 * @returns {Object} { items, totalPages, hasNext, hasPrev }
 */

export function paginate(entries, page, perPage) {
  const totalPages = Math.ceil(entries.length / perPage); //総ページ数の計算
  const start = (page - 1) * perPage; //0ベースのインデックスに変換
  const end = start + perPage;
  const items = entries.slice(start, end); //該当ページのデータ抽出（配列の一部）

  //戻り値のオブジェクト生成
  return {
    items,
    totalPages,
    hasNext: page < totalPages, //次　有無
    hasPrev: page > 1, //前　有無
    currentPage: page,
    total: entries.length,
  };
}
