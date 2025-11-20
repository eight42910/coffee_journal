/**
|--------------------------------------------------
| localStorage key
|--------------------------------------------------
*/
const STORAGE_KEY = "coffee-journal-entries";
// データを保存
export function save() {
  try {
    const data = {
      entries: state.entries,
      query: state.query,
      sortKey: state.sortKey,
      sortOrder: state.sortOrder,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("データを保存しました", state.entries.length, "件");
  } catch (err) {
    console.log("保存に失敗しました", err);
    msgEl.textContent = "データ保存に失敗しました";
  }
}

// データを読み込み
export function load() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) {
      console.log("保存されたデータがありません");
      return;
    }

    const data = JSON.parse(json);
    // 下位互換性: 古い形式（配列のみ）にも対応
    if (Array.isArray(data)) {
      state.entries = data;
    } else if (data && typeof data === "object") {
      state.entries = Array.isArray(data.entries) ? data.entries : [];
      state.query = typeof data.query === "string" ? data.query : "";
      state.sortKey = data.sortKey || "date";
    } else {
      console.warn("不正データ形式です");
      return;
    }

    console.log("データを読み込みました:", state.entries.length, "件");
  } catch (err) {
    console.error("読み込みに失敗しました:", err);
    msgEl.textContent = "データの読み込みに失敗しました";
  }
}

//データをクリア
export function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log("データを削除しました");
    return true;
  } catch (err) {
    console.error("削除に失敗しました:", err);
    return false;
  }
}
