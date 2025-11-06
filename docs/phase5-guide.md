# Phase 5 実装手順書 - 追加機能

**目標**: ページネーション、エクスポート、編集機能を実装する  
**所要時間**: 4-5 時間  
**前提**: Phase 4 が完了していること

---

## ステップ 1: 状態にページ情報を追加（15 分）

### コード修正

```javascript
// グローバル状態
let state = {
  entries: [],
  query: "",
  sortKey: "date",
  sortOrder: "desc",
  page: 1, // ← 追加: 現在のページ
  perPage: 10, // ← 追加: 1ページあたりの表示件数
  editingId: null, // ← 追加: 編集中の記録ID
};
```

---

## ステップ 2: ページネーション関数（純関数）（30 分）

### src/logic.js に追加

```javascript
/**
 * ページネーション
 * @param {Array} entries - 記録の配列
 * @param {number} page - 現在のページ（1始まり）
 * @param {number} perPage - 1ページあたりの件数
 * @returns {Object} { items, totalPages, hasNext, hasPrev }
 */
export function paginate(entries, page, perPage) {
  const totalPages = Math.ceil(entries.length / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const items = entries.slice(start, end);

  return {
    items,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    currentPage: page,
    total: entries.length,
  };
}
```

### 学習ポイント

- **slice()**: 配列の一部を取り出す（元の配列は変更しない）
- **Math.ceil()**: 切り上げ（10 件で 3 件なら 1 ページ）
- **1 始まり**: ページ番号は 1 から始まる（UI に合わせる）

### テスト - tests/logic.test.js に追加

```javascript
describe("paginate", () => {
  const entries = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

  it("1ページ目を正しく取得", () => {
    const result = paginate(entries, 1, 10);
    expect(result.items).toHaveLength(10);
    expect(result.items[0].id).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(false);
  });

  it("最後のページを正しく取得", () => {
    const result = paginate(entries, 3, 10);
    expect(result.items).toHaveLength(5); // 残り5件
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
  });

  it("空の配列の場合", () => {
    const result = paginate([], 1, 10);
    expect(result.items).toEqual([]);
    expect(result.totalPages).toBe(0);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(false);
  });
});
```

---

## ステップ 3: HTML にページネーション要素を追加（15 分）

### index.html の `<section class="card">` 内に追加

```html
<section class="card">
  <h2>一覧</h2>
  <ul id="list" class="list"></ul>

  <!-- ページネーション -->
  <div
    id="pagination"
    class="toolbar"
    style="margin-top: 16px; justify-content: center;"
  >
    <button id="prevPage" class="secondary" disabled>← 前へ</button>
    <span id="pageInfo" class="muted">1 / 1</span>
    <button id="nextPage" class="secondary" disabled>次へ →</button>
  </div>
</section>
```

### app.js に DOM 要素を追加

```javascript
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfoEl = document.getElementById("pageInfo");
```

---

## ステップ 4: render() にページネーションを適用（45 分）

### コード修正

```javascript
import {
  filterEntries,
  sortEntries,
  calculateStats,
  paginate,
} from "./src/logic.js";

// render() を修正
function render() {
  // 1. フィルタリング
  let filtered = filterEntries(state.entries, state.query);

  // 2. ソート
  const sorted = sortEntries(filtered, state.sortKey, state.sortOrder);

  // 3. ページネーション
  const paginationResult = paginate(sorted, state.page, state.perPage);

  // 4. 統計情報（フィルタ後の全件）
  const stats = calculateStats(filtered);

  // 統計情報を表示
  if (stats.total === 0) {
    avgEl.textContent = "–";
  } else {
    avgEl.textContent = `★${stats.avg} (${stats.total}件)`;
  }

  // ページネーション情報を表示
  pageInfoEl.textContent = `${paginationResult.currentPage} / ${
    paginationResult.totalPages || 1
  }`;
  prevPageBtn.disabled = !paginationResult.hasPrev;
  nextPageBtn.disabled = !paginationResult.hasNext;

  // リストを表示（ページネーション後のデータ）
  list.innerHTML = "";

  if (paginationResult.items.length === 0) {
    if (state.query) {
      list.innerHTML = '<li class="muted">検索結果がありません</li>';
    } else {
      list.innerHTML = '<li class="muted">記録がありません</li>';
    }
    return;
  }

  paginationResult.items.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "item";

    const stars = "★".repeat(entry.score) + "☆".repeat(5 - entry.score);

    li.innerHTML = `
      <div>
        <strong>${escapeHtml(entry.bean)}</strong>
        <span class="muted">${stars} | ${entry.date}</span>
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="startEdit(${entry.id})" class="secondary">編集</button>
        <button onclick="deleteEntry(${entry.id})">削除</button>
      </div>
    `;

    list.appendChild(li);
  });
}
```

---

## ステップ 5: ページ移動のイベントリスナー（30 分）

### コード

```javascript
// 前のページへ
prevPageBtn.addEventListener("click", () => {
  if (state.page > 1) {
    state.page--;
    updateURL();
    save();
    render();
    // ページトップにスクロール
    list.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

// 次のページへ
nextPageBtn.addEventListener("click", () => {
  const filtered = filterEntries(state.entries, state.query);
  const sorted = sortEntries(filtered, state.sortKey, state.sortOrder);
  const { totalPages } = paginate(sorted, state.page, state.perPage);

  if (state.page < totalPages) {
    state.page++;
    updateURL();
    save();
    render();
    list.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
```

### 学習ポイント

- **scrollIntoView()**: 要素までスクロール
- **behavior: 'smooth'**: スムーズにスクロール

### 検索・ソート時にページをリセット

```javascript
// 検索入力時の処理
searchInput.addEventListener("input", (e) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    state.query = e.target.value;
    state.page = 1; // ← 追加: ページをリセット
    updateURL();
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
  state.page = 1; // ← 追加: ページをリセット
  updateURL();
  save();
  render();
});
```

---

## ステップ 6: URL にページ情報を追加（20 分）

### updateURL() を修正

```javascript
function updateURL() {
  const params = new URLSearchParams();

  if (state.query) {
    params.set("q", state.query);
  }

  const sortValue = `${state.sortKey}_${state.sortOrder}`;
  if (sortValue !== "date_desc") {
    params.set("sort", sortValue);
  }

  // ページ（1ページ目は省略）
  if (state.page > 1) {
    params.set("page", state.page);
  }

  const newURL = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;

  history.replaceState(null, "", newURL);
}
```

### loadFromURL() を修正

```javascript
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

  // ページ
  const page = params.get("page");
  if (page) {
    const pageNum = parseInt(page, 10);
    if (pageNum > 0) {
      state.page = pageNum;
    }
  }
}
```

---

## ステップ 7: 編集機能 - フォームに値を入力（45 分）

### コード

```javascript
/**
 * 編集モードを開始
 */
function startEdit(id) {
  const entry = state.entries.find((e) => e.id === id);
  if (!entry) return;

  // 編集中IDを保存
  state.editingId = id;

  // フォームに値を入力
  document.getElementById("id").value = entry.id;
  beanInput.value = entry.bean;
  scoreInput.value = entry.score;
  dateInput.value = entry.date;

  // その他のフィールド（Phase1で追加した場合）
  if (entry.roast) document.getElementById("roast").value = entry.roast;
  if (entry.dose) document.getElementById("dose").value = entry.dose;
  if (entry.temp) document.getElementById("temp").value = entry.temp;
  if (entry.secs) document.getElementById("secs").value = entry.secs;
  if (entry.note) document.getElementById("note").value = entry.note;

  // 送信ボタンのテキストを変更
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = "更新";

  // フォームまでスクロール
  form.scrollIntoView({ behavior: "smooth", block: "start" });

  showMessage("編集モードです", "info");
}

/**
 * 編集モードをキャンセル
 */
function cancelEdit() {
  state.editingId = null;
  document.getElementById("id").value = "";
  form.reset();

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.textContent = "保存";

  msgEl.textContent = "";
}
```

### 学習ポイント

- **find()**: 配列から条件に合う最初の要素を取得
- フォームの値を事前入力することで編集可能に

---

## ステップ 8: フォーム送信を更新に対応（30 分）

### addEntry() を修正

```javascript
// 記録を追加または更新
function saveEntry(entry) {
  if (state.editingId) {
    // 更新
    const index = state.entries.findIndex((e) => e.id === state.editingId);
    if (index !== -1) {
      state.entries[index] = {
        ...state.entries[index],
        ...entry,
      };
      console.log("記録を更新しました:", state.entries[index]);
      showMessage("記録を更新しました", "success");
    }
    cancelEdit();
  } else {
    // 追加
    const newEntry = {
      ...entry,
      id: Date.now(),
    };
    state.entries.push(newEntry);
    console.log("記録を追加しました:", newEntry);
    showMessage("記録を保存しました", "success");
  }
  save();
}
```

### フォーム送信イベントを修正

```javascript
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const entry = {
    bean: beanInput.value.trim(),
    score: Number(scoreInput.value),
    date: dateInput.value,
    roast: document.getElementById("roast").value,
    dose: Number(document.getElementById("dose").value),
    temp: Number(document.getElementById("temp").value),
    secs: Number(document.getElementById("secs").value),
    note: document.getElementById("note").value.trim(),
  };

  const errors = validate(entry);

  if (errors.length > 0) {
    showMessage(errors.join(" / "), "error");
    return;
  }

  saveEntry(entry);
  form.reset();
  render();
});
```

### リセットボタンを修正

```javascript
resetBtn.addEventListener("click", () => {
  cancelEdit();
});
```

---

## ステップ 9: エクスポート機能 - JSON（30 分）

### HTML にボタンを追加

```html
<div class="row">
  <button type="submit">保存</button>
  <button type="button" id="reset" class="secondary">リセット</button>
  <button type="button" id="clear" class="secondary">全削除</button>
  <button type="button" id="exportJson" class="secondary">JSON出力</button>
  <button type="button" id="exportCsv" class="secondary">CSV出力</button>
</div>
```

### コード

```javascript
const exportJsonBtn = document.getElementById("exportJson");

/**
 * JSON形式でエクスポート
 */
function exportJSON() {
  if (state.entries.length === 0) {
    showMessage("記録がありません", "error");
    return;
  }

  const json = JSON.stringify(state.entries, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `coffee-journal-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();

  URL.revokeObjectURL(url);

  showMessage("JSONファイルをダウンロードしました", "success");
}

exportJsonBtn.addEventListener("click", exportJSON);
```

### 学習ポイント

- **Blob**: ファイルのようなデータオブジェクト
- **URL.createObjectURL()**: Blob からダウンロード用 URL を生成
- **a.download**: ダウンロードするファイル名を指定
- **URL.revokeObjectURL()**: メモリを解放

---

## ステップ 10: エクスポート機能 - CSV（45 分）

### コード

```javascript
const exportCsvBtn = document.getElementById("exportCsv");

/**
 * CSV形式でエクスポート
 */
function exportCSV() {
  if (state.entries.length === 0) {
    showMessage("記録がありません", "error");
    return;
  }

  // ヘッダー行
  const headers = [
    "ID",
    "日付",
    "豆名",
    "焙煎度",
    "粉量(g)",
    "湯温(℃)",
    "抽出(秒)",
    "評価",
    "メモ",
  ];

  // データ行
  const rows = state.entries.map((entry) => [
    entry.id,
    entry.date,
    escapeCSV(entry.bean),
    entry.roast || "",
    entry.dose || "",
    entry.temp || "",
    entry.secs || "",
    entry.score,
    escapeCSV(entry.note || ""),
  ]);

  // CSV文字列を作成
  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );

  // BOMを追加（Excel対応）
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `coffee-journal-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();

  URL.revokeObjectURL(url);

  showMessage("CSVファイルをダウンロードしました", "success");
}

/**
 * CSVエスケープ
 */
function escapeCSV(str) {
  if (!str) return "";
  // カンマ、改行、ダブルクォートがあればダブルクォートで囲む
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

exportCsvBtn.addEventListener("click", exportCSV);
```

### 学習ポイント

- **BOM**: `\uFEFF` をつけると Excel で文字化けしない
- **CSV エスケープ**: カンマや改行を含む値は `"` で囲む
- **ダブルクォートのエスケープ**: `"` は `""` に置き換え

---

## ステップ 11: インポート機能（オプション）（45 分）

### HTML にボタンを追加

```html
<button type="button" id="importJson" class="secondary">JSON読込</button>
<input type="file" id="fileInput" accept=".json" style="display: none;" />
```

### コード

```javascript
const importJsonBtn = document.getElementById("importJson");
const fileInput = document.getElementById("fileInput");

/**
 * JSONファイルをインポート
 */
importJsonBtn.addEventListener("click", () => {
  fileInput.click();
});

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!Array.isArray(data)) {
      throw new Error("不正なデータ形式です");
    }

    // 既存のデータに追加（IDの重複を避ける）
    const maxId =
      state.entries.length > 0
        ? Math.max(...state.entries.map((e) => e.id))
        : 0;

    const imported = data.map((entry, i) => ({
      ...entry,
      id: maxId + i + 1,
    }));

    state.entries = [...state.entries, ...imported];
    save();
    render();

    showMessage(`${imported.length}件の記録をインポートしました`, "success");
  } catch (err) {
    console.error("インポート失敗:", err);
    showMessage("ファイルの読み込みに失敗しました", "error");
  }

  // inputをリセット
  fileInput.value = "";
});
```

### 学習ポイント

- **file.text()**: ファイルの内容を文字列として読み込み（非同期）
- **async/await**: 非同期処理を同期的に書ける
- **ID の重複回避**: 既存の最大 ID に連番を追加

---

## ステップ 12: 動作確認（30 分）

### チェックリスト - ページネーション

- [ ] 10 件以上のデータで、ページが分かれる
- [ ] 「次へ」ボタンで次のページに移動
- [ ] 「前へ」ボタンで前のページに戻る
- [ ] 最初のページで「前へ」が無効
- [ ] 最後のページで「次へ」が無効
- [ ] ページ情報（1 / 3）が表示される
- [ ] 検索・ソートすると 1 ページ目に戻る

### チェックリスト - 編集

- [ ] 「編集」ボタンでフォームに値が入力される
- [ ] 送信ボタンが「更新」に変わる
- [ ] 値を変更して「更新」を押すと記録が更新される
- [ ] 「リセット」ボタンで編集モードがキャンセルされる

### チェックリスト - エクスポート

- [ ] 「JSON 出力」で JSON ファイルがダウンロードされる
- [ ] 「CSV 出力」で CSV ファイルがダウンロードされる
- [ ] CSV を Excel で開いて文字化けしない
- [ ] カンマを含む豆名が正しくエスケープされる

### チェックリスト - インポート

- [ ] 「JSON 読込」でファイル選択ダイアログが開く
- [ ] JSON ファイルを選択すると記録が追加される
- [ ] 不正なファイルでエラーが表示される

---

## Phase 5 完成コード（主要な追加部分）

### src/logic.js に追加

```javascript
export function paginate(entries, page, perPage) {
  const totalPages = Math.ceil(entries.length / perPage);
  const start = (page - 1) * perPage;
  const end = start + perPage;
  const items = entries.slice(start, end);

  return {
    items,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    currentPage: page,
    total: entries.length,
  };
}
```

### app.js に追加された主要な関数

- `startEdit(id)` - 編集モード開始
- `cancelEdit()` - 編集モードキャンセル
- `saveEntry(entry)` - 追加または更新
- `exportJSON()` - JSON 出力
- `exportCSV()` - CSV 出力
- `escapeCSV(str)` - CSV エスケープ

---

## 学習の振り返り

### 新しく使った知識

- [x] slice()（配列の部分取得）
- [x] Math.ceil()（切り上げ）
- [x] find() / findIndex()（配列検索）
- [x] Blob / URL.createObjectURL()（ファイルダウンロード）
- [x] File API（ファイル読み込み）
- [x] async/await（非同期処理）
- [x] scrollIntoView()（スクロール）

### 重要な設計パターン

- **ページネーション**: データを分割して表示
- **編集モード**: 同じフォームで追加と更新を切り替え
- **エクスポート/インポート**: データの移行・バックアップ
- **CSV エスケープ**: 特殊文字を正しく扱う

---

**Phase 5 完了！** 次は Phase 6（リファクタリング）に進みます。
