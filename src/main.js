import { filterEntries, sortEntries, paginate } from "./logic/index.js";
import { validate } from "./validation/validate.js";

import { escapeCSV } from "./utils/escapeCSV.js";

import {
  saveToStorage,
  loadFromStorage,
  clearStorage,
} from "./storage/localStorage.js";

import { showMessage, clearMessage } from "./dom/message.js";
import { renderEntries, updateForm } from "./dom/render.js";

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
  page: 1, //現在のページ
  perPage: 10, //1ページあたりの表示件数
  editingId: null, //追加、編集中の記録ID
};

/**
|--------------------------------------------------
| ヘルパー関数
|--------------------------------------------------
*/

//save
function save() {
  const success = saveToStorage(state);
  if (!success) {
    showMessage(elements.msgEl, "データの保存に失敗しました", "error");
  }
}

//load
function load() {
  const data = loadFromStorage();
  if (!data) return;
  state.entries = Array.isArray(data.entries) ? data.entries : [];
  state.query = data.query || "";
  state.sortKey = data.sortKey || "date";
  state.sortOrder = data.sortOrder || "desc";
  state.page = data.page || 1;
  state.perPage = data.perPage || 10;
}

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

  //ページ（1ページ目は省略）
  if (state.page > 1) {
    params.set("page", state.page);
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
  //ページ
  const page = params.get("page");
  if (page) {
    const pageNum = parseInt(page, 10);
    if (pageNum > 0) {
      state.page = pageNum;
    }
  }
}

//タイマー変数
let debounceTimer = null;

//DOM操作の取得
// const form = document.getElementById("form");
// const beanInput = document.getElementById("bean");
// const scoreInput = document.getElementById("score");
// const dateInput = document.getElementById("date");
// const list = document.getElementById("list");
// const msgEl = document.getElementById("msg");
// //リセットボタン
// const resetBtnEl = document.getElementById("resetBtn");
// //全削除要素
// const clearBtn = document.getElementById("clear");
// //ソート
// const searchInput = document.getElementById("q");
// const sortSelect = document.getElementById("sort");
// const avgEl = document.getElementById("avg");
// //ページネーション
// const prevPageBtn = document.getElementById("prevPage");
// const nextPageBtn = document.getElementById("nextPage");
// const pageInfoEl = document.getElementById("pageInfo");

// //JSON/CSVボタン
// const exportJsonBtn = document.getElementById("exportJSON");
// const exportCsvBtn = document.getElementById("exportCSV");

// //インポート機能
// const importJsonBtn = document.getElementById("importJson");
// const fileInput = document.getElementById("fileInput");
/**
|--------------------------------------------------
| DOM参照をまとめる（オブジェクト導入）
|--------------------------------------------------
*/
const elements = {
  form: document.getElementById("form"),
  idInput: document.getElementById("id"),
  beanInput: document.getElementById("bean"),
  scoreInput: document.getElementById("score"),
  dateInput: document.getElementById("date"),
  roastInput: document.getElementById("roast"),
  doseInput: document.getElementById("dose"),
  tempInput: document.getElementById("temp"),
  secsInput: document.getElementById("secs"),
  noteInput: document.getElementById("note"),
  list: document.getElementById("list"),
  msgEl: document.getElementById("msg"),
  avgEl: document.getElementById("avg"),
  searchInput: document.getElementById("q"),
  sortSelect: document.getElementById("sort"),
  resetBtn: document.getElementById("resetBtn"),
  clearBtn: document.getElementById("clear"),
  prevPageBtn: document.getElementById("prevPage"),
  nextPageBtn: document.getElementById("nextPage"),
  pageInfoEl: document.getElementById("pageInfo"),
  exportJsonBtn: document.getElementById("exportJSON"),
  exportCsvBtn: document.getElementById("exportCSV"),
  importJsonBtn: document.getElementById("importJson"),
  fileInput: document.getElementById("fileInput"),
  submitBtn: null,
};
elements.submitBtn = elements.form.querySelector('button[type="submit"]');

/**
|--------------------------------------------------
| JSONエクスポート関数
|--------------------------------------------------
*/
function exportJSON() {
  if (state.entries.length === 0) {
    showMessage(elements.msgEl, "記録がありません", "error");
    return;
  }

  const json = JSON.stringify(state.entries, null, 2); //引1.オブジェクト,引2.replacerでnull, 引3.インデント幅

  //ダウンロードリンクを生成
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  //<a>要素を動的につくり、hrefに上記のurlをセット
  const a = document.createElement("a");
  a.href = url;
  a.download = `coffee-journal-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  showMessage(elements.msgEl, "JSONファイルをダウンロードしました", "success");
}
elements.exportJsonBtn.addEventListener("click", exportJSON);

/**
|--------------------------------------------------
| CSVエクスポート
|--------------------------------------------------
*/

function exportCSV() {
  //データがなければ、早期return
  if (state.entries.length === 0) {
    showMessage(elements.msgEl, "記録がありません", "error");
    return;
  }
  //headerとrowsをmapで組み立て
  const headers = [
    "ID",
    "日付",
    "豆名",
    "焙煎度",
    "粉量(g)",
    "湯温(℃ )",
    "抽出（秒）",
    "評価",
    "メモ",
  ];
  const rows = state.entries.map((entry) => [
    entry.id,
    entry.date,
    escapeCSV(entry.bean),
    entry.roast || "",
    entry.dose || "",
    entry.temp || "",
    entry.secs || "",
    entry.score || "",
    escapeCSV(entry.note || ""),
  ]);
  //joinのネストでCSV文字列を生成
  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );
  //excelで文字化けしないように、bomを先頭に
  const bom = "\uFEFF"; //excel用
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `coffee-journal-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  showMessage(elements.msgEl, "CSVファイルをダウンロードしました", "success");
}

elements.exportCsvBtn.addEventListener("click", exportCSV);

/**
|--------------------------------------------------
| 記録を追加する関数
|--------------------------------------------------
*/
//記録を追加
function saveEntry(entry) {
  if (state.editingId) {
    //更新処理
    const index = state.entries.findIndex((e) => e.id === state.editingId);
    if (index !== -1) {
      state.entries[index] = {
        ...state.entries[index],
        ...entry,
      };
      console.log("記録を更新しました:", state.entries[index]);
      showMessage(elements.msgEl, "記録を更新しました", "success");
    }
    cancelEdit();
  } else {
    const newEntry = {
      ...entry,
      id: Date.now(),
    };
    state.entries.push(newEntry);
    console.log("記録を追加しました: ", newEntry);
    showMessage(elements.msgEl, "記録を保存しました", "success");
  }

  save();
  render();
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

  elements.msgEl.textContent = "記録を削除しました";
  setTimeout(() => (elements.msgEl.textContent = ""), 2000);
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
  clearStorage();
  render();
  elements.msgEl.textContent = "全ての記録を削除しました";
  setTimeout(() => {
    elements.msgEl.textContent = "";
  }, 2000);
}
/**
|--------------------------------------------------
| 編集機能
|--------------------------------------------------
*/
function startEdit(id) {
  const entry = state.entries.find((e) => e.id === id);
  if (!entry) return;

  //編集中のIDを保存
  state.editingId = id;
  updateForm(entry, elements);
  elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
  showMessage(elements.msgEl, "編集モードです", "info");
}

/**
|--------------------------------------------------
| 編集モードキャンセル
|--------------------------------------------------
*/

function cancelEdit() {
  state.editingId = null;
  updateForm(null, elements);
  clearMessage(elements.msgEl);
}

/**
|--------------------------------------------------
| render
|--------------------------------------------------
*/

function render() {
  renderEntries(state, {
    list: elements.list,
    avgEl: elements.avgEl,
    pageInfoEl: elements.pageInfoEl,
    prevPageBtn: elements.prevPageBtn,
    nextPageBtn: elements.nextPageBtn,
  });
}

//初期化処理
function init() {
  console.log("Coffee Journal を初期化しました");
  load(); //追加:データを読み込み
  loadFromURL(); //URLから状態を復元

  // stateの検索条件とソート条件をフォームに反映
  elements.searchInput.value = state.query;
  elements.sortSelect.value = `${state.sortKey}_${state.sortOrder}`;

  //初回のURL更新
  updateURL();

  render();
}

//イベント登録(全削除)
elements.clearBtn.addEventListener("click", clearAll);

//イベント登録（リセット）
elements.resetBtn.addEventListener("click", () => {
  cancelEdit();
});

elements.importJsonBtn.addEventListener("click", () => {
  elements.fileInput.click();
});
//ファイル読み込み処理を追加
elements.fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
      throw new Error("不正なデータ形式です");
    }
    const maxId = state.entries.length
      ? Math.max(...state.entries.map((e) => e.id))
      : 0;
    const imported = data.map((entry, i) => ({
      ...entry,
      id: maxId + i + 1,
    }));
    state.entries = [...state.entries, ...imported];
    save();
    render();

    showMessage(
      elements.msgEl,
      `${imported.length}件の記録をインポートしました`,
      "success"
    );
  } catch (err) {
    console.error("インポート失敗:", err);
    showMessage(elements.msgEl, "ファイルの読み込みに失敗しました", "error");
  }
  elements.fileInput.value = "";
});

//検索機能の処理
elements.searchInput.addEventListener("input", (e) => {
  const value = e.target.value;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    state.query = value;
    state.page = 1; //条件変更後に存在しないページを指し続けないための処理
    updateURL();
    save();
    render();
  }, 300);
});

//ソート機能の実装
elements.sortSelect.addEventListener("change", (e) => {
  const value = e.target.value;
  const [key, order] = value.split("_");

  state.sortKey = key;
  state.sortOrder = order;
  state.page = 1; //条件変更後に存在しないページを指し続けないための処理
  updateURL();
  save();
  render();
});

/**
|--------------------------------------------------
| ページネーションの移動（イベントリスナー）
|--------------------------------------------------
*/
//前のページへ
elements.prevPageBtn.addEventListener("click", () => {
  if (state.page > 1) {
    state.page--;
    updateURL();
    save();
    render();
    elements.list.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

//次のページへ
elements.nextPageBtn.addEventListener("click", () => {
  const filtered = filterEntries(state.entries, state.query);
  const sorted = sortEntries(filtered, state.sortKey, state.sortOrder);
  const { totalPages } = paginate(sorted, state.page, state.perPage);

  if (state.page < totalPages) {
    state.page++;
    updateURL();
    save();
    render();
    elements.list.scrollIntoView({ behavior: "smooth", block: "start" });
  }
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
  elements.searchInput.value = state.query;
  elements.sortSelect.value = `${state.sortKey}_${state.sortOrder}`;
  render();
});

//フォーム送信のイベントリスナー
/**
|--------------------------------------------------
|ユーザーが保存ボタンを押したときに、入力内容を取得して addEntryを呼ぶ
|--------------------------------------------------
*/

//フォーム送信処理
elements.form.addEventListener("submit", (e) => {
  e.preventDefault(); //ページリロードを防ぐ

  //入力値を取得
  const entry = {
    bean: elements.beanInput.value.trim(),
    score: Number(elements.scoreInput.value),
    date: elements.dateInput.value,
  };

  const errors = validate(entry);
  if (errors.length > 0) {
    elements.msgEl.textContent = errors.join("/");
    elements.msgEl.style.color = "#ef4444";
    return; // エラーを表示したら保存処理に進まない
  }

  saveEntry(entry);
  elements.form.reset();
  elements.msgEl.textContent = "記録を保存しました";
  elements.msgEl.style.color = "#10b981";
  setTimeout(() => (elements.msgEl.textContent = ""), 2000);
  render();
});

window.deleteEntry = deleteEntry;
window.startEdit = startEdit;

init();
