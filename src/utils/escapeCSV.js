/**
|--------------------------------------------------
| セル内にカンマ・改行・ダブルクォートがあるときにダブルクォートで囲み、
| 内部の " は "" にエスケープするルールがあります。
|--------------------------------------------------
*/

/**
 * CSVエスケープ
 * @param {string} str - エスケープする文字列
 * @returns {string} - エスケープされた文字列
 */

export function escapeCSV(str) {
  if (!str) return "";
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
