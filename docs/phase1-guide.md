# Phase 1 実装手順書 - 最小機能

**目標**: 記録の追加・表示・削除機能を実装する  
**所要時間**: 2-3 時間

---

## ステップ 0: 準備

### 既存ファイルのバックアップ

現在の `app.js` を `app.js.backup` にリネームして保存しておく。

### 新規ファイル作成

新しい `app.js` をゼロから作成する。

---

## ステップ 1: 状態管理の基盤を作る（15 分）

### 目的

アプリケーション全体で使う「状態」を定義する。

### コード

```javascript
// app.js

// グローバル状態
let state = {
  entries: [], // 記録の配列
};
```

### 学習ポイント

- **状態（state）**: アプリのデータを一箇所で管理
- 変数 `let` を使う理由: 後で状態を更新するため
- `entries` は配列で、各要素が 1 つの記録オブジェクト

### 確認

- ファイルを保存
- ブラウザのコンソールで `state` を入力して `{entries: []}` と表示されることを確認

---

## ステップ 2: DOM 要素への参照を取得（15 分）

### 目的

HTML の要素を JavaScript から操作できるようにする。

### コード

```javascript
// DOM要素の取得
const form = document.getElementById("form");
const beanInput = document.getElementById("bean");
const scoreInput = document.getElementById("score");
const dateInput = document.getElementById("date");
const list = document.getElementById("list");
const msgEl = document.getElementById("msg");
```

### 学習ポイント

- `document.getElementById()`: HTML 要素を取得
- 変数名は `Input` や `El` をつけて「要素」だとわかりやすくする
- 取得した要素を変数に保存しておくと、何度も検索しなくて済む

### 確認

```javascript
console.log(form); // <form id="form">...</form>
console.log(beanInput); // <input id="bean" ...>
console.log(list); // <ul id="list" ...>
```

---

## ステップ 3: 記録を追加する関数（30 分）

### 目的

フォーム送信時に、入力内容を `state.entries` に追加する。

### コード

```javascript
// 記録を追加
function addEntry(entry) {
  // 新しいIDを生成（現在のタイムスタンプ）
  const newEntry = {
    ...entry,
    id: Date.now(),
  };

  // state.entries に追加
  state.entries.push(newEntry);

  console.log("記録を追加しました:", newEntry);
  console.log("現在の記録数:", state.entries.length);
}
```

### 学習ポイント

- `Date.now()`: 現在時刻をミリ秒で取得（一意の ID として使える）
- スプレッド構文 `...entry`: オブジェクトをコピーして新しいプロパティを追加
- `push()`: 配列の末尾に要素を追加

### 確認

コンソールで手動テスト:

```javascript
addEntry({ bean: "Test Bean", score: 4, date: "2025-01-01" });
console.log(state.entries); // [{ id: 1234567890, bean: 'Test Bean', ... }]
```

---

## ステップ 4: フォーム送信のイベントリスナー（30 分）

### 目的

ユーザーが「保存」ボタンを押したときに、入力内容を取得して `addEntry` を呼ぶ。

### コード

```javascript
// フォーム送信時の処理
form.addEventListener("submit", (e) => {
  e.preventDefault(); // ページリロードを防ぐ

  // 入力値を取得
  const entry = {
    bean: beanInput.value.trim(),
    score: Number(scoreInput.value),
    date: dateInput.value,
  };

  // 記録を追加
  addEntry(entry);

  // フォームをクリア
  form.reset();

  // メッセージを表示
  msgEl.textContent = "記録を保存しました";
  setTimeout(() => {
    msgEl.textContent = "";
  }, 2000);

  // 画面を更新
  render();
});
```

### 学習ポイント

- `e.preventDefault()`: フォームのデフォルト動作（ページリロード）を止める
- `.value`: input 要素の入力値を取得
- `.trim()`: 前後の空白を削除
- `Number()`: 文字列を数値に変換
- `form.reset()`: フォームの入力欄を全てクリア

### 確認

1. ブラウザでフォームに値を入力
2. 「保存」ボタンをクリック
3. コンソールに「記録を追加しました」と表示される
4. フォームが空になる

---

## ステップ 5: 記録を表示する関数（45 分）

### 目的

`state.entries` の内容を画面に表示する。

### コード

```javascript
// 記録を画面に表示
function render() {
  // リストを空にする
  list.innerHTML = "";

  // entries が空の場合
  if (state.entries.length === 0) {
    list.innerHTML = '<li class="muted">記録がありません</li>';
    return;
  }

  // 最新順に並べ替え（日付の降順）
  const sorted = [...state.entries].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  // 各記録をリストアイテムとして追加
  sorted.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "item";

    // 評価を★で表示
    const stars = "★".repeat(entry.score) + "☆".repeat(5 - entry.score);

    li.innerHTML = `
      <div>
        <strong>${escapeHtml(entry.bean)}</strong>
        <span class="muted">${stars} | ${entry.date}</span>
      </div>
      <button onclick="deleteEntry(${entry.id})">削除</button>
    `;

    list.appendChild(li);
  });
}

// HTMLエスケープ（XSS対策）
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
```

### 学習ポイント

- `innerHTML = ''`: 要素の中身を空にする
- スプレッド構文 `[...array]`: 配列をコピー（元の配列を変更しない）
- `sort()`: 配列を並び替える
  - `(a, b) => b - a`: 降順（大きい順）
  - `new Date()`: 文字列を日付オブジェクトに変換
- `forEach()`: 配列の各要素に対して処理を実行
- `document.createElement()`: 新しい HTML 要素を作成
- `appendChild()`: 要素を追加
- `repeat()`: 文字列を繰り返す
- XSS 対策: ユーザー入力はエスケープする

### 確認

1. `render()` をコンソールで実行
2. 画面に「記録がありません」と表示される
3. 記録を追加してから `render()` を実行
4. 追加した記録が表示される

---

## ステップ 6: 記録を削除する関数（30 分）

### 目的

削除ボタンをクリックしたときに、その記録を `state.entries` から削除する。

### コード

```javascript
// 記録を削除
function deleteEntry(id) {
  // 確認ダイアログを表示
  if (!confirm("この記録を削除しますか？")) {
    return;
  }

  // 指定されたIDの記録を除外
  state.entries = state.entries.filter((entry) => entry.id !== id);

  console.log("記録を削除しました:", id);
  console.log("現在の記録数:", state.entries.length);

  // 画面を更新
  render();

  // メッセージを表示
  msgEl.textContent = "記録を削除しました";
  setTimeout(() => {
    msgEl.textContent = "";
  }, 2000);
}
```

### 学習ポイント

- `filter()`: 条件に合う要素だけを残した新しい配列を返す
- `!==`: 厳密な不等価（型も含めて比較）
- `confirm()`: ユーザーに確認ダイアログを表示
- 削除後に `render()` を呼んで画面を更新

### 確認

1. 記録を追加
2. 削除ボタンをクリック
3. 確認ダイアログが表示される
4. 「OK」を押すと記録が消える
5. 「キャンセル」を押すと何も起こらない

---

## ステップ 7: 初期化処理（15 分）

### 目的

ページが読み込まれたときに、最初の描画を行う。

### コード

```javascript
// 初期化
function init() {
  console.log("Coffee Journal を初期化しました");
  render();
}

// ページ読み込み時に初期化
init();
```

### 学習ポイント

- `init()`: アプリの初期設定を行う関数
- ファイルの最後で `init()` を呼ぶことで、ページ読み込み時に自動実行

### 確認

1. ページをリロード
2. コンソールに「Coffee Journal を初期化しました」と表示される
3. 画面に「記録がありません」と表示される

---

## ステップ 8: 動作確認（30 分）

### チェックリスト

- [ ] フォームに入力して「保存」ボタンを押すと記録が追加される
- [ ] 追加した記録がリストに表示される
- [ ] 複数の記録を追加すると、新しいものが上に表示される
- [ ] 削除ボタンを押すと確認ダイアログが表示される
- [ ] 「OK」を押すと記録が削除される
- [ ] 「キャンセル」を押すと何も起こらない
- [ ] 記録を全て削除すると「記録がありません」と表示される
- [ ] 評価が ★ で表示される（5 なら ★★★★★、3 なら ★★★☆☆）
- [ ] 日付が新しい順に並んでいる

### デバッグのコツ

問題が起きたら:

1. コンソールにエラーが出ていないか確認
2. `console.log(state.entries)` で状態を確認
3. 各関数を個別にコンソールで実行してみる

---

## Phase 1 完成コード全体

```javascript
// app.js

// グローバル状態
let state = {
  entries: [],
};

// DOM要素の取得
const form = document.getElementById("form");
const beanInput = document.getElementById("bean");
const scoreInput = document.getElementById("score");
const dateInput = document.getElementById("date");
const list = document.getElementById("list");
const msgEl = document.getElementById("msg");

// 記録を追加
function addEntry(entry) {
  const newEntry = {
    ...entry,
    id: Date.now(),
  };
  state.entries.push(newEntry);
  console.log("記録を追加しました:", newEntry);
}

// 記録を削除
function deleteEntry(id) {
  if (!confirm("この記録を削除しますか？")) {
    return;
  }
  state.entries = state.entries.filter((entry) => entry.id !== id);
  console.log("記録を削除しました:", id);
  render();
  msgEl.textContent = "記録を削除しました";
  setTimeout(() => {
    msgEl.textContent = "";
  }, 2000);
}

// 記録を画面に表示
function render() {
  list.innerHTML = "";

  if (state.entries.length === 0) {
    list.innerHTML = '<li class="muted">記録がありません</li>';
    return;
  }

  const sorted = [...state.entries].sort((a, b) => {
    return new Date(b.date) - new Date(a.date);
  });

  sorted.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "item";

    const stars = "★".repeat(entry.score) + "☆".repeat(5 - entry.score);

    li.innerHTML = `
      <div>
        <strong>${escapeHtml(entry.bean)}</strong>
        <span class="muted">${stars} | ${entry.date}</span>
      </div>
      <button onclick="deleteEntry(${entry.id})">削除</button>
    `;

    list.appendChild(li);
  });
}

// HTMLエスケープ
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// フォーム送信時の処理
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const entry = {
    bean: beanInput.value.trim(),
    score: Number(scoreInput.value),
    date: dateInput.value,
  };

  addEntry(entry);
  form.reset();

  msgEl.textContent = "記録を保存しました";
  setTimeout(() => {
    msgEl.textContent = "";
  }, 2000);

  render();
});

// 初期化
function init() {
  console.log("Coffee Journal を初期化しました");
  render();
}

init();
```

---

## 学習の振り返り

### 使った JavaScript の知識

- [x] 変数宣言（let, const）
- [x] オブジェクト（`{ key: value }`）
- [x] 配列（`[]`）と配列メソッド（push, filter, sort, forEach）
- [x] 関数定義
- [x] アロー関数（`() => {}`）
- [x] DOM 操作（getElementById, createElement, appendChild）
- [x] イベントリスナー（addEventListener）
- [x] テンプレートリテラル（`` `文字列${変数}` ``）
- [x] スプレッド構文（`...`）
- [x] 三項演算子・条件分岐
- [x] タイマー（setTimeout）

### 次の Phase の準備

- [ ] localStorage でデータを永続化する方法を調べる
- [ ] try-catch でエラーハンドリングする方法を確認する
- [ ] バリデーションの必要性を理解する

---

**Phase 1 完了！** 次は Phase 2（データ永続化）に進みます。
