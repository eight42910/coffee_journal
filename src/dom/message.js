/**
 * メッセージを表示
 * @param {string} message - 表示するメッセージ
 * @param {string} type - 'success' | 'error' | 'info'
 */

let messageTimer = null;

export function showMessage(msgEl, message, type = "info", duration = 3000) {
  if (!msgEl) return;

  msgEl.textContent = message;
  // 色を変更
  if (type === "success") msgEl.style.color = "#10b981";
  else if (type === "error") msgEl.style.color = "#ef4444";
  else msgEl.style.color = "inherit";

  if (messageTimer) clearTimeout(messageTimer);
  if (duration > 0) {
    messageTimer = setTimeout(() => {
      msgEl.textContent = "";
    }, duration);
  }
}
export function clearMessage(msgEl) {
  if (!msgEl) return;
  msgEl.textContent = "";
  if (messageTimer) {
    clearTimeout(messageTimer);
    messageTimer = null;
  }
}
