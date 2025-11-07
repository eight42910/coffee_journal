//グローバルな状態

let state = {
  entries: [], //記録の配列
};

//DOM操作の取得
const form = document.getElementById("form");
const beanInput = document.getElementById("bean");
const scoreInput = document.getElementById("score");
const dateInput = document.getElementById("date");
const list = document.getElementById("list");
const msgEl = document.getElementById("msg");

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
    const json = JSON.stringify(state.entries);
    localStorage.setItem(STORAGE_KEY, json);
    console.log("データを保存しました", state.entries.length, "件");
  } catch (err) {
    console.log("保存に失敗しました", err);
    msgEl.textContent = "データ保存に失敗しました";
  }
}

function load() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);

    //データがない場合
    if (!json) {
      console.log("保存されたデータがありません");
      return;
    }

    // JSON文字列をオブジェクトに変換
    const entries = JSON.parse(json);

    // 配列かどうかチェック
    if (!Array.isArray(entries)) {
      console.warn("不正なデータ形式です");
      return;
    }
    state.entries = entries;
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

//render
function render() {
  list.innerHTML = "";
  //空状態の処理
  if (state.entries.length === 0) {
    list.innerHTML = `<li class="text-sm text-stone-500">記録がありません</li>`;
    return;
  }

  //並び順
  const sorted = [...state.entries].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

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
  render();
}
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

  //記録を追加
  addEntry(entry);

  //フォームをクリア
  /**
  |--------------------------------------------------
  | HTMLFormElement.prototype.reset はフォーム要素に備わっている組み込みメソッド
  |--------------------------------------------------
  */
  HTMLFormElement.prototype.reset.call(form);

  msgEl.textContent = "記録を保存しました";
  setTimeout(() => (msgEl.textContent = ""), 2000);

  //画面更新
  render();
});

init();
