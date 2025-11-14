import { filterEntries, sortEntries, calculateStats } from "./src/logic.js";
import { validate } from "./src/validation.js";

/**
|--------------------------------------------------
| グローバルな状態
|--------------------------------------------------
*/

let state = {
  entries: [], //記録の配列
  //検索ソート
  query: "",
  sortKey: "date",
  sortOrder: "desc", //降順、昇順を決める
};

//updateURL()関数
function updateURL() {
  const params = new URLSearchParams();

  if (state.query) {
    params.set("q", state.query);
  }

  const sortValue = `${state.sortKey}_${state.sortOrder}`;
  if (sortValue !== "date_desc") {
    params.set("sort", sortValue);
  }

  const newURL = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;
  console.log("updateURL ->", newURL);
  history.replaceState(null, "", newURL);
}

//stateの復元処理
function loadFromURL() {
  const params = new URLSearchParams(window.location.search);

  const query = params.get("q");
  if (query !== null) {
    state.query = query;
  }

  const sort = params.get("sort");
  if (sort) {
    const [key, order] = sort.split("_");
    if (key && order) {
      state.sortKey = key;
      state.sortOrder = order;
    }
  }
}

//タイマー変数
let debounceTimer = null;

//DOM操作の取得
const form = document.getElementById("form");
const beanInput = document.getElementById("bean");
const scoreInput = document.getElementById("score");
const dateInput = document.getElementById("date");
const list = document.getElementById("list");
const msgEl = document.getElementById("msg");
//リセットボタン
const resetBtnEl = document.getElementById("resetBtn");
//全削除要素
const clearBtn = document.getElementById("clear");
//ソート
const searchInput = document.getElementById("q");
const sortSelect = document.getElementById("sort");
const avgEl = document.getElementById("avg");

/**
 * メッセージを表示
 * @param {string} message - 表示するメッセージ
 * @param {string} type - 'success' | 'error' | 'info'
 */

function showMessage(message, type = "info") {
  msgEl.textContent = message;
}

// 色を変更
if (type === "success") {
  msgEl.style.color = "#10b981";
} else if (type === "error") {
  msgEl.style.color = "#ef4444";
} else {
  msgEl.style.color = "inherit";
}

setTimeout(() => {
  msgEl.textContent = "";
}, 3000);

/**
|--------------------------------------------------
| localStorageについて
|--------------------------------------------------
*/
// // 保存
// localStorage.setItem("key", "value");

// // 読み込み
// const value = localStorage.getItem("key");

// // 削除
// localStorage.removeItem("key");

// // 全削除
// localStorage.clear();

// const data = { name: "eight", age: 35 };

// JSON文字列に変換して保存
// localStorage.setItem("data", JSON.stringify(data));

// 読み込んでオブジェクトに戻す
// const loaded = JSON.parse(localStorage.getItem("data"));
// console.log(loaded);

//localStorage key
const STORAGE_KEY = "coffee-journal-entries";
// データを保存
function save() {
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
function load() {
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
      state.sortKey = data.sortKey || "data";
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

/**
|--------------------------------------------------
| 記録を追加する関数
|--------------------------------------------------
*/
//記録を追加
function addEntry(entry) {
  //新しいIDを生成（現在のタイムスタンプ）
  const newEntry = {
    ...entry,
    id: Date.now(),
  };

  //state.entries　に追加
  state.entries.push(newEntry);

  console.log("記録を追加しました:", newEntry);
  save();
  console.log("現在の記録数:", state.entries.length);
}

/**
|--------------------------------------------------
| 記録を削除する関数
|--------------------------------------------------
*/
function deleteEntry(id) {
  if (!confirm("この記録を削除しますか？")) {
    return;
  }

  state.entries = state.entries.filter((entry) => entry.id !== id);

  console.log("記録を削除しました:", id);
  save();
  console.log("現在の記録数:", state.entries.length);

  render();

  msgEl.textContent = "記録を削除しました";
  setTimeout(() => (msgEl.textContent = ""), 2000);
}
/**
|--------------------------------------------------
| 記録を全削除処理の実装
|--------------------------------------------------
*/
function clearAll() {
  if (!confirm("全ての記録を削除しますか？この操作は取り消せません。")) {
    return;
  }
  state.entries = [];
  save();
  render();
  msgEl.textContent = "全ての記録を削除しました";
  setTimeout(() => {
    msgEl.textContent = "";
  }, 2000);
}

/**
|--------------------------------------------------
| render
|--------------------------------------------------
*/
function render() {
  //並び順
  // 1. フィルタリング

  let filtered = filterEntries(state.entries, state.query);

  // 2. ソート
  const sorted = sortEntries(filtered, state.sortKey, state.sortOrder);
  // 3. 統計情報を計算
  const stats = calculateState(filtered);

  //統計情報を表示
  if (stats.total === 0) {
    avgEl.textContent = "-";
  } else {
    avgEl.textContent = `☆${stats.avg}(${stats.total}件)`;
  }
  //リストを表示
  list.innerHTML = "";

  if (sorted.length === 0) {
    list.innerHTML = state.query
      ? `<li class="text-sm text-stone-500">検索結果がありません</li>`
      : `<li class="text-sm text-stone-500">記録がありません</li>`;
    return;
  }

  //表示内容
  sorted.forEach((entry) => {
    const li = document.createElement("li");
    li.className =
      "flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm";
    const stars = "★".repeat(entry.score) + "☆".repeat(5 - entry.score);
    li.innerHTML = `<div class="flex flex-col gap-1">
        <strong class="text-sm font-semibold text-stone-900">${escapeHtml(
          entry.bean
        )}</strong>
        <span class="text-xs text-stone-500">${stars} ｜ ${entry.date}</span>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200"
        onclick="deleteEntry(${entry.id})"
      >
        <span aria-hidden="true">🗑</span>
        削除
      </button>`;
    list.appendChild(li);
  });

  // state.entries.forEach(({ id, bean, score, date }) => {
  //   const li = document.createElement("li");
  //   li.textContent = `${date} - ${bean} (${score})`;
  //   list.appendChild(li);
  // });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

//初期化処理
function init() {
  console.log("Coffee Journal を初期化しました");
  load(); //追加:データを読み込み
  loadFromURL(); //URLから状態を復元

  // stateの検索条件とソート条件をフォームに反映
  searchInput.value = state.query;
  sortSelect.value = `${state.sortKey}_${state.sortOrder}`;

  //初回のURL更新
  updateURL();

  render();
}

//イベント登録(全削除)
clearBtn.addEventListener("click", clearAll);

//イベント登録（リセット）
resetBtnEl.addEventListener("click", () => {
  form.reset();
  //視覚的に通知を消すための処理
  msgEl.textContent = "";
});

//検索機能の処理
searchInput.addEventListener("input", (e) => {
  const value = e.target.value;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    state.query = value;
    updateURL();
    save();
    render();
  }, 300);
});

//ソート機能の実装
sortSelect.addEventListener("change", (e) => {
  const value = e.target.value;
  const [key, order] = value.split("_");

  state.sortKey = key;
  state.sortOrder = order;
  updateURL();
  save();
  render();
});

/**
|--------------------------------------------------
| 戻る・進むでURL変更時のstate復元からの再描画
|--------------------------------------------------
*/
window.addEventListener("popstate", () => {
  console.log("popstate イベント発火");

  // URLから状態を復元
  loadFromURL();
  // フォームの値を同期
  searchInput.value = state.query;
  sortSelect.value = `${state.sortKey}_${state.sortOrder}`;
  render();
});

//フォーム送信のイベントリスナー
/**
|--------------------------------------------------
|ユーザーが保存ボタンを押したときに、入力内容を取得して addEntryを呼ぶ
|--------------------------------------------------
*/

//フォーム送信処理
form.addEventListener("submit", (e) => {
  e.preventDefault(); //ページリロードを防ぐ

  //入力値を取得
  const entry = {
    bean: beanInput.value.trim(),
    score: Number(scoreInput.value),
    date: dateInput.value,
  };

  const errors = validate(entry);
  if (errors.length > 0) {
    msgEl.textContent = errors.join("/");
    msgEl.style.color = "#ef4444";
    return; // エラーを表示したら保存処理に進まない
  }

  addEntry(entry);
  form.reset();
  msgEl.textContent = "記録を保存しました";
  msgEl.style.color = "#10b981";
  setTimeout(() => (msgEl.textContent = ""), 2000);
  render();
});

init();
