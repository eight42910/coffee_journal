# Phase 3 実装手順書 - 検索とソート

**目標**: 検索機能、ソート機能、統計情報を実装する  
**所要時間**: 3-4 時間  
**前提**: Phase 2 が完了していること

---

## ステップ 1: 状態に検索・ソート条件を追加（15 分）

### 目的

検索文字列とソート条件を `state` で管理する。

### コード修正

```javascript
// グローバル状態
let state = {
  entries: [],
  query: "", // ← 追加: 検索文字列
  sortKey: "date", // ← 追加: ソートのキー
  sortOrder: "desc", // ← 追加: ソート順（desc=降順, asc=昇順）
};
```

### 学習ポイント

- **状態の一元管理**: 検索・ソート条件も `state` で管理
- `query`: 検索ボックスの入力値
- `sortKey`: 何でソートするか（date / score / bean）
- `sortOrder`: 昇順（asc）か降順（desc）か

---

## ステップ 2: DOM 要素の取得を追加（10 分）

### コード

```javascript
// DOM要素の取得に追加
const searchInput = document.getElementById("q");
const sortSelect = document.getElementById("sort");
const avgEl = document.getElementById("avg");
```

---

## ステップ 3: フィルタリング関数（純関数）（30 分）

### 目的

検索文字列に基づいて記録を絞り込む純関数を作る。

### コード

```javascript
/**
 * 記録を検索文字列でフィルタリング
 * @param {Array} entries - 記録の配列
 * @param {string} query - 検索文字列
 * @returns {Array} - フィルタリングされた記録
 */
function filterEntries(entries, query) {
  // 検索文字列が空なら全て返す
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
```

### 学習ポイント

- **純関数**: 引数を受け取り、新しい配列を返す（元の配列は変更しない）
- **大文字小文字を区別しない**: `toLowerCase()` で統一
- **部分一致**: `includes()` で文字列が含まれるか判定
- **OR 検索**: 豆名 or メモのどちらかに含まれればヒット
- **JSDoc**: コメントで関数の説明を記述

### 確認

```javascript
const testEntries = [
  {
    id: 1,
    bean: "Ethiopia Yirgacheffe",
    score: 5,
    date: "2025-01-15",
    note: "華やか",
  },
  {
    id: 2,
    bean: "Colombia Supremo",
    score: 4,
    date: "2025-01-10",
    note: "バランス良い",
  },
];

console.log(filterEntries(testEntries, "eth"));
// [{ id: 1, bean: 'Ethiopia Yirgacheffe', ... }]

console.log(filterEntries(testEntries, "華やか"));
// [{ id: 1, bean: 'Ethiopia Yirgacheffe', ... }]

console.log(filterEntries(testEntries, "kenya"));
// []
```

---

## ステップ 4: ソート関数（純関数）（45 分）

### 目的

指定されたキーと順序で記録をソートする純関数を作る。

### コード

```javascript
/**
 * 記録をソート
 * @param {Array} entries - 記録の配列
 * @param {string} key - ソートキー（'date' | 'score' | 'bean'）
 * @param {string} order - ソート順（'asc' | 'desc'）
 * @returns {Array} - ソート済みの記録
 */
function sortEntries(entries, key, order) {
  // 配列をコピー（元の配列を変更しない）
  const sorted = [...entries];

  sorted.sort((a, b) => {
    let compareA, compareB;

    // ソートキーに応じて比較対象を決定
    if (key === "date") {
      compareA = new Date(a.date);
      compareB = new Date(b.date);
    } else if (key === "score") {
      compareA = a.score;
      compareB = b.score;
    } else if (key === "bean") {
      compareA = a.bean.toLowerCase();
      compareB = b.bean.toLowerCase();
    } else {
      return 0; // 不明なキーの場合は順序を変えない
    }

    // 昇順 or 降順
    if (order === "asc") {
      if (compareA < compareB) return -1;
      if (compareA > compareB) return 1;
      return 0;
    } else {
      if (compareA < compareB) return 1;
      if (compareA > compareB) return -1;
      return 0;
    }
  });

  return sorted;
}
```

### 学習ポイント

- **スプレッド構文**: `[...entries]` で配列をコピー
- **sort()**: 配列を並び替える（元の配列を変更する）
  - 比較関数: `(a, b) => { ... }`
  - 負の値を返すと a が前、正の値を返すと b が前
- **日付の比較**: `new Date()` で Date 型に変換してから比較
- **文字列の比較**: `<` `>` で辞書順に比較
- **型に応じた処理**: key によって比較方法を変える

### 確認

```javascript
const testEntries = [
  { id: 1, bean: "Zebra", score: 3, date: "2025-01-15" },
  { id: 2, bean: "Apple", score: 5, date: "2025-01-10" },
  { id: 3, bean: "Mango", score: 4, date: "2025-01-20" },
];

// 日付降順
console.log(sortEntries(testEntries, "date", "desc"));
// [Mango(1/20), Zebra(1/15), Apple(1/10)]

// 評価昇順
console.log(sortEntries(testEntries, "score", "asc"));
// [Zebra(3), Mango(4), Apple(5)]

// 豆名昇順
console.log(sortEntries(testEntries, "bean", "asc"));
// [Apple, Mango, Zebra]
```

---

## ステップ 5: 統計情報を計算する関数（30 分）

### 目的

平均評価、最高評価の豆を計算する純関数を作る。

### コード

```javascript
/**
 * 統計情報を計算
 * @param {Array} entries - 記録の配列
 * @returns {Object} - 統計情報 { avg, max, maxBean, total }
 */
function calculateStats(entries) {
  if (entries.length === 0) {
    return {
      avg: 0,
      max: 0,
      maxBean: null,
      total: 0,
    };
  }

  // 平均評価
  const total = entries.reduce((sum, entry) => sum + entry.score, 0);
  const avg = total / entries.length;

  // 最高評価
  const maxEntry = entries.reduce((max, entry) => {
    return entry.score > max.score ? entry : max;
  }, entries[0]);

  return {
    avg: Math.round(avg * 10) / 10, // 小数点1桁に丸める
    max: maxEntry.score,
    maxBean: maxEntry.bean,
    total: entries.length,
  };
}
```

### 学習ポイント

- **reduce()**: 配列を 1 つの値に集約
  - `(累積値, 現在の要素) => 新しい累積値`
  - 第 2 引数: 初期値
- **平均の計算**: 合計 ÷ 件数
- **最大値の検索**: reduce で最大の要素を探す
- **小数点の丸め**: `Math.round(value * 10) / 10` で小数点 1 桁

### 確認

```javascript
const testEntries = [
  { bean: "A", score: 4 },
  { bean: "B", score: 5 },
  { bean: "C", score: 3 },
];

console.log(calculateStats(testEntries));
// { avg: 4.0, max: 5, maxBean: 'B', total: 3 }

console.log(calculateStats([]));
// { avg: 0, max: 0, maxBean: null, total: 0 }
```

---

## ステップ 6: render() を修正（45 分）

### 目的

フィルタリング・ソート・統計を適用して表示する。

### コード修正

```javascript
// 記録を画面に表示
function render() {
  // 1. フィルタリング
  let filtered = filterEntries(state.entries, state.query);

  // 2. ソート
  const sorted = sortEntries(filtered, state.sortKey, state.sortOrder);

  // 3. 統計情報を計算
  const stats = calculateStats(filtered);

  // 統計情報を表示
  if (stats.total === 0) {
    avgEl.textContent = "–";
  } else {
    avgEl.textContent = `★${stats.avg} (${stats.total}件)`;
  }

  // リストを表示
  list.innerHTML = "";

  if (sorted.length === 0) {
    if (state.query) {
      list.innerHTML = '<li class="muted">検索結果がありません</li>';
    } else {
      list.innerHTML = '<li class="muted">記録がありません</li>';
    }
    return;
  }

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
```

### 学習ポイント

- **データの流れ**: 元データ → フィルタ → ソート → 表示
- **純関数の利用**: 各ステップで純関数を呼び出す
- **条件分岐**: 検索結果がない場合と、そもそもデータがない場合で表示を変える

---

## ステップ 7: 検索機能の実装（30 分）

### 目的

検索ボックスの入力に応じてリアルタイムに絞り込む。

### コード

```javascript
// 検索入力時の処理
searchInput.addEventListener("input", (e) => {
  state.query = e.target.value;
  render();
});
```

### 学習ポイント

- **input イベント**: 入力欄の値が変わるたびに発火
- **e.target.value**: 現在の入力値
- リアルタイム検索: 入力するたびに `render()` を呼ぶ

### 確認

1. 複数の記録を追加
2. 検索ボックスに「eth」と入力
3. 「Ethiopia」を含む記録だけが表示される
4. 検索ボックスをクリアすると全て表示される

---

## ステップ 8: デバウンス処理（30 分）

### 目的

入力が完了するまで待ってから検索を実行し、パフォーマンスを向上させる。

### コード修正

```javascript
// デバウンス用のタイマー
let debounceTimer = null;

// 検索入力時の処理（デバウンス付き）
searchInput.addEventListener("input", (e) => {
  // 前のタイマーをキャンセル
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  // 300ms後に検索実行
  debounceTimer = setTimeout(() => {
    state.query = e.target.value;
    render();
  }, 300);
});
```

### 学習ポイント

- **デバウンス**: 連続する処理を最後の 1 回だけ実行する
- **setTimeout**: 指定時間後に関数を実行
- **clearTimeout**: タイマーをキャンセル
- 300ms = ユーザーが入力を止めてから少し待つ

### 確認

1. 検索ボックスに素早く文字を入力
2. 入力を止めて 300ms 後に絞り込みが実行される
3. コンソールで `render()` の呼び出し回数を確認

---

## ステップ 9: ソート機能の実装（30 分）

### 目的

セレクトボックスでソート条件を変更できるようにする。

### コード

```javascript
// ソート選択時の処理
sortSelect.addEventListener("change", (e) => {
  const value = e.target.value;

  // value の形式: "date_desc", "score_asc" など
  const [key, order] = value.split("_");

  state.sortKey = key;
  state.sortOrder = order;

  render();
});
```

### 学習ポイント

- **change イベント**: セレクトボックスの選択が変わったときに発火
- **split()**: 文字列を指定の区切り文字で分割
- **分割代入**: `const [a, b] = array` で配列の要素を変数に代入

### 確認

1. ソートセレクトボックスを変更
2. 記録の並び順が変わる
3. 「評価が高い順」を選択 → 評価の高い順に表示される

---

## ステップ 10: 初期値の設定（15 分）

### 目的

ページ読み込み時に、検索ボックスとソートセレクトボックスを `state` の値に同期させる。

### コード修正

```javascript
// 初期化
function init() {
  console.log("Coffee Journal を初期化しました");
  load();

  // フォームの初期値を設定
  searchInput.value = state.query;
  sortSelect.value = `${state.sortKey}_${state.sortOrder}`;

  render();
}
```

### 学習ポイント

- **初期値の同期**: HTML 側の値を state に合わせる
- テンプレートリテラル: `` `${key}_${order}` `` で文字列を結合

---

## ステップ 11: localStorage に検索・ソート条件を保存（30 分）

### 目的

検索・ソート条件も localStorage に保存し、ページリロード後に復元する。

### コード修正

#### save() を修正

```javascript
// データを保存
function save() {
  try {
    const data = {
      entries: state.entries,
      query: state.query,
      sortKey: state.sortKey,
      sortOrder: state.sortOrder,
    };
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
    console.log("データを保存しました:", state.entries.length, "件");
  } catch (err) {
    console.error("保存に失敗しました:", err);
    msgEl.textContent = "データの保存に失敗しました";
  }
}
```

#### load() を修正

```javascript
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
      state.entries = data.entries || [];
      state.query = data.query || "";
      state.sortKey = data.sortKey || "date";
      state.sortOrder = data.sortOrder || "desc";
    }

    console.log("データを読み込みました:", state.entries.length, "件");
  } catch (err) {
    console.error("読み込みに失敗しました:", err);
    msgEl.textContent = "データの読み込みに失敗しました";
  }
}
```

### 学習ポイント

- **オブジェクトで保存**: entries だけでなく、query/sortKey/sortOrder も保存
- **下位互換性**: 古いデータ形式（配列のみ）でも読み込める
- **デフォルト値**: データがない場合は初期値を使用

### 確認

1. 検索文字列を入力、ソートを変更
2. ページをリロード
3. 検索・ソート条件が復元される

---

## ステップ 12: 検索・ソート変更時に保存（15 分）

### 目的

検索・ソート条件が変わったときに自動で保存する。

### コード修正

```javascript
// 検索入力時の処理（デバウンス付き）
searchInput.addEventListener("input", (e) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    state.query = e.target.value;
    save(); // ← 追加
    render();
  }, 300);
});

// ソート選択時の処理
sortSelect.addEventListener("change", (e) => {
  const value = e.target.value;
  const [key, order] = value.split("_");
  state.sortKey = key;
  state.sortOrder = order;
  save(); // ← 追加
  render();
});
```

---

## ステップ 13: 動作確認（30 分)

### チェックリスト

- [ ] 検索ボックスに文字を入力すると絞り込まれる
- [ ] 検索は大文字小文字を区別しない
- [ ] 豆名とメモの両方で検索できる
- [ ] 検索結果がない場合は「検索結果がありません」と表示される
- [ ] ソートセレクトボックスで並び順が変わる
- [ ] 平均評価が表示される
- [ ] 平均評価は小数点 1 桁で表示される
- [ ] 記録がない場合は「–」と表示される
- [ ] 検索・ソート条件が localStorage に保存される
- [ ] ページをリロードしても検索・ソート条件が復元される

### パフォーマンステスト

1. 開発者ツールのコンソールで大量のデータを追加:

```javascript
for (let i = 0; i < 100; i++) {
  addEntry({
    bean: `Test Bean ${i}`,
    score: Math.floor(Math.random() * 5) + 1,
    date: "2025-01-01",
  });
}
```

2. 検索が素早く動作するか確認
3. ソートが素早く動作するか確認

---

## Phase 3 完成コード（主要な変更部分）

```javascript
// グローバル状態
let state = {
  entries: [],
  query: "",
  sortKey: "date",
  sortOrder: "desc",
};

// DOM要素の取得に追加
const searchInput = document.getElementById("q");
const sortSelect = document.getElementById("sort");
const avgEl = document.getElementById("avg");

// デバウンス用のタイマー
let debounceTimer = null;

// フィルタリング関数（純関数）
function filterEntries(entries, query) {
  if (!query || query.trim().length === 0) {
    return entries;
  }
  const lowerQuery = query.toLowerCase();
  return entries.filter((entry) => {
    const beanMatch = entry.bean.toLowerCase().includes(lowerQuery);
    const noteMatch =
      entry.note && entry.note.toLowerCase().includes(lowerQuery);
    return beanMatch || noteMatch;
  });
}

// ソート関数（純関数）
function sortEntries(entries, key, order) {
  const sorted = [...entries];
  sorted.sort((a, b) => {
    let compareA, compareB;
    if (key === "date") {
      compareA = new Date(a.date);
      compareB = new Date(b.date);
    } else if (key === "score") {
      compareA = a.score;
      compareB = b.score;
    } else if (key === "bean") {
      compareA = a.bean.toLowerCase();
      compareB = b.bean.toLowerCase();
    } else {
      return 0;
    }
    if (order === "asc") {
      if (compareA < compareB) return -1;
      if (compareA > compareB) return 1;
      return 0;
    } else {
      if (compareA < compareB) return 1;
      if (compareA > compareB) return -1;
      return 0;
    }
  });
  return sorted;
}

// 統計情報を計算（純関数）
function calculateStats(entries) {
  if (entries.length === 0) {
    return { avg: 0, max: 0, maxBean: null, total: 0 };
  }
  const total = entries.reduce((sum, entry) => sum + entry.score, 0);
  const avg = total / entries.length;
  const maxEntry = entries.reduce((max, entry) => {
    return entry.score > max.score ? entry : max;
  }, entries[0]);
  return {
    avg: Math.round(avg * 10) / 10,
    max: maxEntry.score,
    maxBean: maxEntry.bean,
    total: entries.length,
  };
}

// render() の修正版
function render() {
  let filtered = filterEntries(state.entries, state.query);
  const sorted = sortEntries(filtered, state.sortKey, state.sortOrder);
  const stats = calculateStats(filtered);

  if (stats.total === 0) {
    avgEl.textContent = "–";
  } else {
    avgEl.textContent = `★${stats.avg} (${stats.total}件)`;
  }

  list.innerHTML = "";

  if (sorted.length === 0) {
    if (state.query) {
      list.innerHTML = '<li class="muted">検索結果がありません</li>';
    } else {
      list.innerHTML = '<li class="muted">記録がありません</li>';
    }
    return;
  }

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

// save() の修正版
function save() {
  try {
    const data = {
      entries: state.entries,
      query: state.query,
      sortKey: state.sortKey,
      sortOrder: state.sortOrder,
    };
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
    console.log("データを保存しました:", state.entries.length, "件");
  } catch (err) {
    console.error("保存に失敗しました:", err);
    msgEl.textContent = "データの保存に失敗しました";
  }
}

// load() の修正版
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
      state.entries = data.entries || [];
      state.query = data.query || "";
      state.sortKey = data.sortKey || "date";
      state.sortOrder = data.sortOrder || "desc";
    }
    console.log("データを読み込みました:", state.entries.length, "件");
  } catch (err) {
    console.error("読み込みに失敗しました:", err);
    msgEl.textContent = "データの読み込みに失敗しました";
  }
}

// 検索入力時の処理
searchInput.addEventListener("input", (e) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    state.query = e.target.value;
    save();
    render();
  }, 300);
});

// ソート選択時の処理
sortSelect.addEventListener("change", (e) => {
  const value = e.target.value;
  const [key, order] = value.split("_");
  state.sortKey = key;
  state.sortOrder = order;
  save();
  render();
});

// init() の修正版
function init() {
  console.log("Coffee Journal を初期化しました");
  load();
  searchInput.value = state.query;
  sortSelect.value = `${state.sortKey}_${state.sortOrder}`;
  render();
}

init();
```

---

## 学習の振り返り

### 新しく使った JavaScript の知識

- [x] 配列メソッドのチェーン（filter → sort → forEach）
- [x] reduce()（合計・最大値の計算）
- [x] split()（文字列の分割）
- [x] 分割代入（`const [a, b] = array`）
- [x] setTimeout / clearTimeout（デバウンス）
- [x] Math.round()（小数の丸め）
- [x] includes()（部分一致検索）

### 重要な設計パターン

- **純関数**: filter, sort, stats は副作用なし、テストしやすい
- **データの流れ**: 元データ → フィルタ → ソート → 表示
- **デバウンス**: 連続する処理を最後の 1 回だけ実行
- **状態の一元管理**: 検索・ソート条件も state で管理

### 次の Phase の準備

- [ ] URLSearchParams の使い方を調べる
- [ ] History API（pushState, popstate）を確認
- [ ] WAI-ARIA（role, aria-live）について学ぶ

---

**Phase 3 完了！** 次は Phase 4（URL 同期とテスト）に進みます。
