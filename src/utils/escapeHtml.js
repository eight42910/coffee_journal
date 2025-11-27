/**
 * HTMLエスケープ（XSS対策）
 * @param {string} str - エスケープする文字列
 * @returns {string} - エスケープされた文字列
 */

export function escapeHtml(str) {
  if (!str) return "";

  if (typeof document === "undefined") {
    return String(str).replace(/[&<>]/g, (ch) => {
      if (ch === "&") return "&amp;";
      if (ch === "<") return "&lt;";
      if (ch === ">") return "&gt;";
    });
  }

  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
