/**
|--------------------------------------------------
| localStorage key
|--------------------------------------------------
*/
const STORAGE_KEY = "coffee-journal-entries";
// データを保存
export function saveToStorage(state) {
  try {
    const data = {
      entries: state.entries,
      query: state.query,
      sortKey: state.sortKey,
      sortOrder: state.sortOrder,
      page: state.page,
      perPage: state.perPage,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    console.log("データを保存しました", state.entries.length, "件");
    return true;
  } catch (err) {
    console.log("保存に失敗しました", err);
    return false;
  }
}

// データを読み込み
export function loadFromStorage() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    const data = JSON.parse(json);
    if (Array.isArray(data)) {
      return {
        entries: data,
        query: "",
        sortKey: "date",
        sortOrder: "desc",
        page: 1,
        perPage: 10,
      };
    }
    console.log("データを読み込みました:", data.entries?.length || 0, "件");
    return data;
  } catch (err) {
    console.error("読み込みに失敗しました:", err);
    return null;
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
