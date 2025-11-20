/**
 * HTMLエスケープ（XSS対策）
 * @param {string} str - エスケープする文字列
 * @returns {string} - エスケープされた文字列
 */

export function escapeHtml(str) {
  if (!str) return;
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
