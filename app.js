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

//記録を追加する関数
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
  console.log("現在の記録数:", state.entries.length);
}

function render() {
  list.innerHTML = "";
  state.entries.forEach(({ id, bean, score, date }) => {
    const li = document.createElement("li");
    li.textContent = `${date} - ${bean} (${score})`;
    list.appendChild(li);
  });
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
  HTMLFormElement.prototype.reset.call(form);

  msgEl.textContent = "記録を保存しました";
  setTimeout(() => (msgEl.textContent = ""), 2000);

  //画面更新
  render();
});
