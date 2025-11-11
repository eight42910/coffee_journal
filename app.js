//グローバルな状態

let state = {
  entries: [], //記録の配列
  //検索ソート
  query: "",
  sortKey: "date",
  sortOrder: "desc", //降順、昇順を決める
};

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

function load() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) {
      console.log("保存されたデータがありません");
      return;
    }

    const data = JSON.parse(json);

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
| バリデーション関数
|--------------------------------------------------
*/
//入力値をバリデーション
function validate(entry) {
  const errors = [];

  if (!entry.bean || entry.bean.trim().length === 0) {
    errors.push("豆名を入力してください");
  }

  if (!entry.score || entry.score < 1 || entry.score > 5) {
    errors.push("評価は1~5の数値を入力してください");
  }

  if (!entry.date) {
    errors.push("日付を入力してください");
  } else {
    //ローカルタイムとしてパースする
    const inputDate = new Date(`${entry.date}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0); //時刻をリセット
    if (inputDate > today) {
      errors.push("未来の日付は入力できません");
    }
  }
  return errors;
}

/**
|--------------------------------------------------
| フィルタリング関数（純関数）
|--------------------------------------------------
*/

/**
 * 記録を検索文字列でフィルタリング
 * @param {Array} entries
 * @param {string} query
 * @returns {Array}
 */

function filterEntries(entries, query) {
  //検索文字列が空なら全て返す
  if (!query || query.trim().length === 0) {
    return entries;
  }

  // 小文字に統一して部分一致検索
  const lowerQuery = query.toLowerCase();

  return entries.filter((entry) => {
    const beanMatch = entry.bean.toLowerCase().includes(lowerQuery);
    const noteMatch =
      entry.note && entry.note.toLowerCase().includes(lowerQuery);
    return beanMatch || noteMatch;
  });
}

/**
|--------------------------------------------------
| 記録をソートする関数
|--------------------------------------------------
*/

/**
 * 記録をソート
 * @param {Array} entries - 記録の配列
 * @param {string} key - ソートキー（'date' | 'score' | 'bean'）
 * @param {string} order - ソート順（'asc' | 'desc'）
 * @returns {Array} - ソート済みの記録
 */

function sortEntries(entries, key, order) {
  const sorted = [...entries]; //元配列おｗ壊さない
  // ソートキーに応じて比較対象を決定
  sorted.sort((a, b) => {
    let compareA;
    let compareB;

    if (key === "date") {
      compareA = new Date(a.date);
      compareB = new Date(b.date);
    } else if (key === "score") {
      compareA = a.score;
      compareB = b.score;
    } else if (key == "bean") {
      compareA = a.bean.toLowerCase();
      compareB = b.bean.toLowerCase();
    } else {
      return 0; //想定外キーは並び替えない
    }

    if (order === "asc") {
      if (compareA < compareB) return 1;
      if (compareA > compareB) return -1;
      return 0;
    } else {
      if (compareA < compareB) return 1;
      if (compareA > compareB) return -1;
      return 0;
    }
  });

  return sorted;
}
/**
|--------------------------------------------------
| 統計情報を計算する関数
|--------------------------------------------------
*/
/**
 * 統計情報を計算
 * @param {Array} entries - 記録の配列
 * @returns {Object} - 統計情報 { avg, max, maxBean, total }
 */

function calculateState(entries) {
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

  // stateの検索条件とソート条件をフォームに反映
  searchInput.value = state.query;
  sortSelect.value = `${state.sortKey}_${state.sortOrder}`;

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
  save();
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
