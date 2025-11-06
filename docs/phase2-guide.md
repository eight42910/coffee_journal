# Phase 2 実装手順書 - データ永続化

**目標**: localStorage でデータを保存し、バリデーションを追加する  
**所要時間**: 2-3 時間  
**前提**: Phase 1 が完了していること

---

## ステップ 1: localStorage の仕組みを理解する（15 分）

### localStorage とは

- ブラウザにデータを保存できる仕組み
- ページをリロードしても、ブラウザを閉じてもデータが残る
- キーと値のペアで保存（値は文字列のみ）

### 基本的な使い方

```javascript
// 保存
localStorage.setItem("key", "value");

// 読み込み
const value = localStorage.getItem("key");

// 削除
localStorage.removeItem("key");

// 全削除
localStorage.clear();
```

### オブジェクトを保存する場合

```javascript
const data = { name: "Test", age: 20 };

// JSON文字列に変換して保存
localStorage.setItem("data", JSON.stringify(data));

// 読み込んでオブジェクトに戻す
const loaded = JSON.parse(localStorage.getItem("data"));
console.log(loaded); // { name: 'Test', age: 20 }
```

### 確認

コンソールで試してみる:

```javascript
localStorage.setItem("test", "hello");
console.log(localStorage.getItem("test")); // 'hello'
localStorage.removeItem("test");
console.log(localStorage.getItem("test")); // null
```

---

## ステップ 2: データを保存する関数（30 分）

### 目的

`state.entries` を localStorage に保存する。

### コード

```javascript
// localStorage のキー
const STORAGE_KEY = "coffee-journal-entries";

// データを保存
function save() {
  try {
    const json = JSON.stringify(state.entries);
    localStorage.setItem(STORAGE_KEY, json);
    console.log("データを保存しました:", state.entries.length, "件");
  } catch (err) {
    console.error("保存に失敗しました:", err);
    msgEl.textContent = "データの保存に失敗しました";
  }
}
```

### 学習ポイント

- **定数**: `STORAGE_KEY` は変更しないので `const` で定義
- **JSON.stringify**: オブジェクト・配列を文字列に変換
- **try-catch**: エラーが起きても処理を続ける
  - `try {}`: 実行する処理
  - `catch (err) {}`: エラーが起きたときの処理
- localStorage が使えない環境でもエラーで止まらない

### 確認

```javascript
state.entries = [{ id: 1, bean: "Test", score: 4, date: "2025-01-01" }];
save();
// コンソール: "データを保存しました: 1 件"

// ブラウザの開発者ツール > Application > Local Storage で確認
```

---

## ステップ 3: データを読み込む関数（30 分）

### 目的

localStorage からデータを読み込んで `state.entries` に復元する。

### コード

```javascript
// データを読み込み
function load() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);

    // データがない場合
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
```

### 学習ポイント

- **JSON.parse**: 文字列をオブジェクト・配列に変換
- **null チェック**: データがない場合は `null` が返る
- **Array.isArray**: 配列かどうかを判定
- データが壊れていても安全に処理

### 確認

```javascript
load();
console.log(state.entries); // 保存したデータが復元される

// データをクリアして再度テスト
localStorage.removeItem("coffee-journal-entries");
load();
console.log(state.entries); // []（空配列のまま）
```

---

## ステップ 4: 保存・読み込みを自動化（15 分）

### 目的

- ページ読み込み時に自動で `load()` を実行
- 記録を追加・削除したときに自動で `save()` を実行

### コード修正

#### init() を修正

```javascript
// 初期化
function init() {
  console.log("Coffee Journal を初期化しました");
  load(); // ← 追加: データを読み込み
  render();
}
```

#### addEntry() を修正

```javascript
// 記録を追加
function addEntry(entry) {
  const newEntry = {
    ...entry,
    id: Date.now(),
  };
  state.entries.push(newEntry);
  console.log("記録を追加しました:", newEntry);
  save(); // ← 追加: データを保存
}
```

#### deleteEntry() を修正

```javascript
// 記録を削除
function deleteEntry(id) {
  if (!confirm("この記録を削除しますか？")) {
    return;
  }
  state.entries = state.entries.filter((entry) => entry.id !== id);
  console.log("記録を削除しました:", id);
  save(); // ← 追加: データを保存
  render();
  msgEl.textContent = "記録を削除しました";
  setTimeout(() => {
    msgEl.textContent = "";
  }, 2000);
}
```

### 確認

1. ページをリロード → 保存したデータが表示される
2. 新しい記録を追加 → リロードしても残っている
3. 記録を削除 → リロードしても削除されたまま

---

## ステップ 5: バリデーション関数を作る（45 分）

### 目的

入力値が正しいかチェックし、エラーがあればメッセージを返す。

### コード

```javascript
// 入力値をバリデーション
function validate(entry) {
  const errors = [];

  // 豆名チェック
  if (!entry.bean || entry.bean.trim().length === 0) {
    errors.push("豆名を入力してください");
  }

  // 評価チェック
  if (!entry.score || entry.score < 1 || entry.score > 5) {
    errors.push("評価は1〜5の数値を入力してください");
  }

  // 日付チェック
  if (!entry.date) {
    errors.push("日付を入力してください");
  } else {
    const inputDate = new Date(entry.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 時刻をリセット

    if (inputDate > today) {
      errors.push("未来の日付は入力できません");
    }
  }

  return errors;
}
```

### 学習ポイント

- **純関数**: 引数を受け取り、結果を返すだけ（副作用なし）
- **配列でエラーを集める**: 複数のエラーをまとめて返せる
- **日付の比較**: `new Date()` で文字列を日付に変換
- **時刻のリセット**: `setHours(0,0,0,0)` で日付のみ比較

### 確認

```javascript
// 正常なデータ
console.log(
  validate({
    bean: "Ethiopia",
    score: 4,
    date: "2025-01-01",
  })
); // []（エラーなし）

// エラーのあるデータ
console.log(
  validate({
    bean: "",
    score: 6,
    date: "2025-12-31",
  })
); // ['豆名を入力してください', '評価は1〜5...', '未来の日付...']
```

---

## ステップ 6: フォーム送信時にバリデーション（30 分）

### 目的

フォーム送信時に `validate()` を実行し、エラーがあれば保存しない。

### コード修正

```javascript
// フォーム送信時の処理
form.addEventListener("submit", (e) => {
  e.preventDefault();

  // 入力値を取得
  const entry = {
    bean: beanInput.value.trim(),
    score: Number(scoreInput.value),
    date: dateInput.value,
  };

  // バリデーション
  const errors = validate(entry);

  // エラーがある場合
  if (errors.length > 0) {
    msgEl.textContent = errors.join(" / ");
    msgEl.style.color = "#ef4444"; // 赤色
    return; // ここで処理を中断
  }

  // 記録を追加
  addEntry(entry);
  form.reset();

  // 成功メッセージ
  msgEl.textContent = "記録を保存しました";
  msgEl.style.color = "#10b981"; // 緑色
  setTimeout(() => {
    msgEl.textContent = "";
  }, 2000);

  render();
});
```

### 学習ポイント

- **配列.join(区切り文字)**: 配列を文字列に結合
- **early return**: エラー時に `return` で処理を中断
- **スタイル変更**: `element.style.color` で色を変更

### 確認

1. 豆名を空欄で送信 → エラーメッセージが赤字で表示される
2. 評価を 10 で送信 → エラーメッセージが表示される
3. 未来の日付で送信 → エラーメッセージが表示される
4. 正しい値で送信 → 「記録を保存しました」が緑字で表示される

---

## ステップ 7: 全削除ボタンの実装（20 分）

### 目的

「全削除」ボタンで全てのデータを削除する。

### コード

```javascript
// DOM要素の取得に追加
const clearBtn = document.getElementById("clear");

// 全削除
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

// イベントリスナーを追加（init() の前に記述）
clearBtn.addEventListener("click", clearAll);
```

### 学習ポイント

- 削除前に確認ダイアログを表示
- `state.entries = []` で配列を空にする
- `save()` で localStorage も更新

### 確認

1. 複数の記録を追加
2. 「全削除」ボタンをクリック
3. 確認ダイアログで「OK」 → 全て削除される
4. ページをリロード → データが残っていないことを確認

---

## ステップ 8: リセットボタンの実装（15 分）

### 目的

「リセット」ボタンでフォームの入力をクリアする。

### コード

```javascript
// DOM要素の取得に追加
const resetBtn = document.getElementById("reset");

// イベントリスナーを追加
resetBtn.addEventListener("click", () => {
  form.reset();
  msgEl.textContent = "";
});
```

### 学習ポイント

- `form.reset()`: フォームの全入力欄を初期値に戻す
- メッセージもクリアする

### 確認

1. フォームに値を入力
2. 「リセット」ボタンをクリック
3. 入力欄が空になる

---

## ステップ 9: 動作確認（30 分）

### チェックリスト

- [ ] ページをリロードしてもデータが残る
- [ ] 豆名が空欄だとエラーが表示される
- [ ] 評価が 1 未満または 5 より大きいとエラーが表示される
- [ ] 未来の日付だとエラーが表示される
- [ ] エラーメッセージが赤字で表示される
- [ ] 成功メッセージが緑字で表示される
- [ ] メッセージが 2 秒後に消える
- [ ] 「全削除」ボタンで全てのデータが削除される
- [ ] 「リセット」ボタンでフォームがクリアされる

### ブラウザの開発者ツールで確認

1. **Application タブ** → **Local Storage** → ドメインを選択
2. `coffee-journal-entries` というキーでデータが保存されている
3. データを JSON 形式で確認できる

---

## Phase 2 完成コード全体

```javascript
// app.js

// グローバル状態
let state = {
  entries: [],
};

// localStorage のキー
const STORAGE_KEY = "coffee-journal-entries";

// DOM要素の取得
const form = document.getElementById("form");
const beanInput = document.getElementById("bean");
const scoreInput = document.getElementById("score");
const dateInput = document.getElementById("date");
const list = document.getElementById("list");
const msgEl = document.getElementById("msg");
const clearBtn = document.getElementById("clear");
const resetBtn = document.getElementById("reset");

// データを保存
function save() {
  try {
    const json = JSON.stringify(state.entries);
    localStorage.setItem(STORAGE_KEY, json);
    console.log("データを保存しました:", state.entries.length, "件");
  } catch (err) {
    console.error("保存に失敗しました:", err);
    msgEl.textContent = "データの保存に失敗しました";
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
    const entries = JSON.parse(json);
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

// 入力値をバリデーション
function validate(entry) {
  const errors = [];

  if (!entry.bean || entry.bean.trim().length === 0) {
    errors.push("豆名を入力してください");
  }

  if (!entry.score || entry.score < 1 || entry.score > 5) {
    errors.push("評価は1〜5の数値を入力してください");
  }

  if (!entry.date) {
    errors.push("日付を入力してください");
  } else {
    const inputDate = new Date(entry.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate > today) {
      errors.push("未来の日付は入力できません");
    }
  }

  return errors;
}

// 記録を追加
function addEntry(entry) {
  const newEntry = {
    ...entry,
    id: Date.now(),
  };
  state.entries.push(newEntry);
  console.log("記録を追加しました:", newEntry);
  save();
}

// 記録を削除
function deleteEntry(id) {
  if (!confirm("この記録を削除しますか？")) {
    return;
  }
  state.entries = state.entries.filter((entry) => entry.id !== id);
  console.log("記録を削除しました:", id);
  save();
  render();
  msgEl.textContent = "記録を削除しました";
  setTimeout(() => {
    msgEl.textContent = "";
  }, 2000);
}

// 全削除
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

  const errors = validate(entry);

  if (errors.length > 0) {
    msgEl.textContent = errors.join(" / ");
    msgEl.style.color = "#ef4444";
    return;
  }

  addEntry(entry);
  form.reset();

  msgEl.textContent = "記録を保存しました";
  msgEl.style.color = "#10b981";
  setTimeout(() => {
    msgEl.textContent = "";
  }, 2000);

  render();
});

// リセットボタン
resetBtn.addEventListener("click", () => {
  form.reset();
  msgEl.textContent = "";
});

// 全削除ボタン
clearBtn.addEventListener("click", clearAll);

// 初期化
function init() {
  console.log("Coffee Journal を初期化しました");
  load();
  render();
}

init();
```

---

## 学習の振り返り

### 新しく使った JavaScript の知識

- [x] localStorage API（setItem, getItem, removeItem）
- [x] JSON（stringify, parse）
- [x] try-catch（エラーハンドリング）
- [x] Array.isArray（型チェック）
- [x] 配列.join（配列を文字列に変換）
- [x] 日付の操作（new Date, setHours）
- [x] 純関数（引数 → 戻り値、副作用なし）

### 重要な設計パターン

- **データの永続化**: localStorage で状態を保存
- **バリデーション**: データを使う前に必ず検証
- **エラーハンドリング**: try-catch で予期しないエラーに対応
- **純関数**: `validate()` は副作用がなく、テストしやすい

### 次の Phase の準備

- [ ] 配列の filter / sort / reduce を復習
- [ ] デバウンス処理について調べる
- [ ] URLSearchParams の使い方を確認

---

**Phase 2 完了！** 次は Phase 3（検索とソート）に進みます。
