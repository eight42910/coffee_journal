# Phase 6 実装手順書 - リファクタリングと最適化

**目標**: コードを整理し、パフォーマンスとメンテナンス性を向上させる  
**所要時間**: 4-5 時間  
**前提**: Phase 5 が完了していること

---

## ステップ 1: ディレクトリ構造の整理（30 分）

### 目標のディレクトリ構造

```
/coffee-journal
  index.html
  styles.css
  /src
    main.js              # エントリポイント
    /logic
      filter.js          # フィルタリング
      sort.js            # ソート
      stats.js           # 統計計算
      paginate.js        # ページネーション
    /storage
      localStorage.js    # localStorage操作
    /validation
      validate.js        # バリデーション
    /dom
      render.js          # DOM操作
      message.js         # メッセージ表示
    /utils
      escapeHtml.js      # HTMLエスケープ
      escapeCSV.js       # CSVエスケープ
  /tests
    logic.test.js
    validation.test.js
    storage.test.js
  package.json
  vite.config.js
```

### ファイルを作成

以下のステップで段階的にファイルを分割していきます。

---

## ステップ 2: ユーティリティ関数の分離（30 分）

### src/utils/escapeHtml.js

```javascript
/**
 * HTMLエスケープ（XSS対策）
 * @param {string} str - エスケープする文字列
 * @returns {string} - エスケープされた文字列
 */
export function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
```

### src/utils/escapeCSV.js

```javascript
/**
 * CSVエスケープ
 * @param {string} str - エスケープする文字列
 * @returns {string} - エスケープされた文字列
 */
export function escapeCSV(str) {
  if (!str) return "";
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
```

### tests/utils.test.js

```javascript
import { describe, it, expect } from "vitest";
import { escapeHtml } from "../src/utils/escapeHtml.js";
import { escapeCSV } from "../src/utils/escapeCSV.js";

describe("escapeHtml", () => {
  it("特殊文字をエスケープする", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert("xss")&lt;/script&gt;'
    );
  });

  it("空文字列の場合", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml(null)).toBe("");
  });

  it("通常の文字列はそのまま", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });
});

describe("escapeCSV", () => {
  it("カンマを含む場合、ダブルクォートで囲む", () => {
    expect(escapeCSV("Hello, World")).toBe('"Hello, World"');
  });

  it("ダブルクォートをエスケープ", () => {
    expect(escapeCSV('Say "Hi"')).toBe('"Say ""Hi"""');
  });

  it("改行を含む場合、ダブルクォートで囲む", () => {
    expect(escapeCSV("Line1\nLine2")).toBe('"Line1\nLine2"');
  });

  it("通常の文字列はそのまま", () => {
    expect(escapeCSV("Hello")).toBe("Hello");
  });
});
```

---

## ステップ 3: ロジック関数の分離（45 分）

### src/logic/filter.js

```javascript
/**
 * 記録を検索文字列でフィルタリング
 */
export function filterEntries(entries, query) {
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
```

### src/logic/sort.js

```javascript
/**
 * 記録をソート
 */
export function sortEntries(entries, key, order) {
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
      return compareA < compareB ? -1 : compareA > compareB ? 1 : 0;
    } else {
      return compareA < compareB ? 1 : compareA > compareB ? -1 : 0;
    }
  });
  return sorted;
}
```

### src/logic/stats.js

```javascript
/**
 * 統計情報を計算
 */
export function calculateStats(entries) {
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
```

### src/logic/paginate.js

```javascript
/**
 * ページネーション
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

### src/logic/index.js（バレルエクスポート）

```javascript
export { filterEntries } from "./filter.js";
export { sortEntries } from "./sort.js";
export { calculateStats } from "./stats.js";
export { paginate } from "./paginate.js";
```

---

## ステップ 4: バリデーションの分離（20 分）

### src/validation/validate.js

```javascript
/**
 * 入力値をバリデーション
 */
export function validate(entry) {
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
```

---

## ステップ 5: localStorage 操作の分離（45 分）

### src/storage/localStorage.js

```javascript
const STORAGE_KEY = "coffee-journal-data";

/**
 * データを保存
 */
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
    const json = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, json);
    console.log("データを保存しました:", state.entries.length, "件");
    return true;
  } catch (err) {
    console.error("保存に失敗しました:", err);
    return false;
  }
}

/**
 * データを読み込み
 */
export function loadFromStorage() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) {
      console.log("保存されたデータがありません");
      return null;
    }
    const data = JSON.parse(json);

    // 下位互換性: 古い形式（配列のみ）にも対応
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

/**
 * データをクリア
 */
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
```

### tests/storage.test.js

```javascript
import { describe, it, expect, beforeEach } from "vitest";
import {
  saveToStorage,
  loadFromStorage,
  clearStorage,
} from "../src/storage/localStorage.js";

// モックlocalStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = mockLocalStorage;

describe("localStorage", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it("データを保存できる", () => {
    const state = {
      entries: [{ id: 1, bean: "Test", score: 4, date: "2025-01-01" }],
      query: "",
      sortKey: "date",
      sortOrder: "desc",
      page: 1,
      perPage: 10,
    };
    expect(saveToStorage(state)).toBe(true);
  });

  it("データを読み込める", () => {
    const state = {
      entries: [{ id: 1, bean: "Test", score: 4, date: "2025-01-01" }],
      query: "test",
      sortKey: "score",
      sortOrder: "asc",
      page: 2,
      perPage: 20,
    };
    saveToStorage(state);
    const loaded = loadFromStorage();
    expect(loaded.entries).toHaveLength(1);
    expect(loaded.query).toBe("test");
    expect(loaded.page).toBe(2);
  });

  it("データがない場合はnullを返す", () => {
    expect(loadFromStorage()).toBe(null);
  });

  it("データをクリアできる", () => {
    const state = {
      entries: [{ id: 1, bean: "Test", score: 4, date: "2025-01-01" }],
      query: "",
      sortKey: "date",
      sortOrder: "desc",
      page: 1,
      perPage: 10,
    };
    saveToStorage(state);
    expect(clearStorage()).toBe(true);
    expect(loadFromStorage()).toBe(null);
  });
});
```

---

## ステップ 6: メッセージ表示の分離（30 分）

### src/dom/message.js

```javascript
let messageTimer = null;

/**
 * メッセージを表示
 * @param {HTMLElement} msgEl - メッセージ要素
 * @param {string} message - 表示するメッセージ
 * @param {string} type - 'success' | 'error' | 'info'
 * @param {number} duration - 表示時間（ミリ秒）
 */
export function showMessage(msgEl, message, type = "info", duration = 3000) {
  if (!msgEl) return;

  msgEl.textContent = message;

  // 色を変更
  if (type === "success") {
    msgEl.style.color = "#10b981";
  } else if (type === "error") {
    msgEl.style.color = "#ef4444";
  } else {
    msgEl.style.color = "inherit";
  }

  // 前のタイマーをクリア
  if (messageTimer) {
    clearTimeout(messageTimer);
  }

  // 指定時間後にクリア
  if (duration > 0) {
    messageTimer = setTimeout(() => {
      msgEl.textContent = "";
    }, duration);
  }
}

/**
 * メッセージをクリア
 */
export function clearMessage(msgEl) {
  if (!msgEl) return;
  msgEl.textContent = "";
  if (messageTimer) {
    clearTimeout(messageTimer);
    messageTimer = null;
  }
}
```

---

## ステップ 7: render 関数の分離（60 分）

### src/dom/render.js

```javascript
import {
  filterEntries,
  sortEntries,
  calculateStats,
  paginate,
} from "../logic/index.js";
import { escapeHtml } from "../utils/escapeHtml.js";

/**
 * 記録一覧を描画
 */
export function renderEntries(state, elements) {
  const { list, avgEl, pageInfoEl, prevPageBtn, nextPageBtn } = elements;

  // 1. フィルタリング
  let filtered = filterEntries(state.entries, state.query);

  // 2. ソート
  const sorted = sortEntries(filtered, state.sortKey, state.sortOrder);

  // 3. ページネーション
  const paginationResult = paginate(sorted, state.page, state.perPage);

  // 4. 統計情報
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

  // リストを表示
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
        ${
          entry.note
            ? `<div class="muted" style="font-size: 0.9em;">${escapeHtml(
                entry.note
              )}</div>`
            : ""
        }
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="window.startEdit(${
          entry.id
        })" class="secondary">編集</button>
        <button onclick="window.deleteEntry(${entry.id})">削除</button>
      </div>
    `;

    list.appendChild(li);
  });
}

/**
 * フォームを更新（編集モード用）
 */
export function updateForm(entry, formElements) {
  const {
    idInput,
    beanInput,
    scoreInput,
    dateInput,
    roastInput,
    doseInput,
    tempInput,
    secsInput,
    noteInput,
    submitBtn,
  } = formElements;

  if (entry) {
    // 編集モード
    idInput.value = entry.id;
    beanInput.value = entry.bean;
    scoreInput.value = entry.score;
    dateInput.value = entry.date;
    if (roastInput && entry.roast) roastInput.value = entry.roast;
    if (doseInput && entry.dose) doseInput.value = entry.dose;
    if (tempInput && entry.temp) tempInput.value = entry.temp;
    if (secsInput && entry.secs) secsInput.value = entry.secs;
    if (noteInput && entry.note) noteInput.value = entry.note;
    submitBtn.textContent = "更新";
  } else {
    // 新規モード
    idInput.value = "";
    submitBtn.textContent = "保存";
  }
}
```

---

## ステップ 8: main.js の整理（90 分）

### src/main.js（リファクタリング後）

```javascript
import { filterEntries, sortEntries, paginate } from "./logic/index.js";
import { validate } from "./validation/validate.js";
import { saveToStorage, loadFromStorage } from "./storage/localStorage.js";
import { renderEntries, updateForm } from "./dom/render.js";
import { showMessage, clearMessage } from "./dom/message.js";
import { escapeCSV } from "./utils/escapeCSV.js";

// グローバル状態
let state = {
  entries: [],
  query: "",
  sortKey: "date",
  sortOrder: "desc",
  page: 1,
  perPage: 10,
  editingId: null,
};

// DOM要素
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
  resetBtn: document.getElementById("reset"),
  clearBtn: document.getElementById("clear"),
  prevPageBtn: document.getElementById("prevPage"),
  nextPageBtn: document.getElementById("nextPage"),
  pageInfoEl: document.getElementById("pageInfo"),
  exportJsonBtn: document.getElementById("exportJson"),
  exportCsvBtn: document.getElementById("exportCsv"),
  importJsonBtn: document.getElementById("importJson"),
  fileInput: document.getElementById("fileInput"),
  submitBtn: null, // form.querySelector で取得
};

elements.submitBtn = elements.form.querySelector('button[type="submit"]');

// デバウンスタイマー
let debounceTimer = null;

// ========== ヘルパー関数 ==========

function save() {
  const success = saveToStorage(state);
  if (!success) {
    showMessage(elements.msgEl, "データの保存に失敗しました", "error");
  }
}

function load() {
  const data = loadFromStorage();
  if (data) {
    state.entries = data.entries || [];
    state.query = data.query || "";
    state.sortKey = data.sortKey || "date";
    state.sortOrder = data.sortOrder || "desc";
    state.page = data.page || 1;
    state.perPage = data.perPage || 10;
  }
}

function updateURL() {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  const sortValue = `${state.sortKey}_${state.sortOrder}`;
  if (sortValue !== "date_desc") params.set("sort", sortValue);
  if (state.page > 1) params.set("page", state.page);

  const newURL = params.toString()
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;
  history.replaceState(null, "", newURL);
}

function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q");
  if (query !== null) state.query = query;

  const sort = params.get("sort");
  if (sort) {
    const [key, order] = sort.split("_");
    if (key && order) {
      state.sortKey = key;
      state.sortOrder = order;
    }
  }

  const page = params.get("page");
  if (page) {
    const pageNum = parseInt(page, 10);
    if (pageNum > 0) state.page = pageNum;
  }
}

function render() {
  renderEntries(state, {
    list: elements.list,
    avgEl: elements.avgEl,
    pageInfoEl: elements.pageInfoEl,
    prevPageBtn: elements.prevPageBtn,
    nextPageBtn: elements.nextPageBtn,
  });
}

// ========== ビジネスロジック ==========

function saveEntry(entry) {
  if (state.editingId) {
    // 更新
    const index = state.entries.findIndex((e) => e.id === state.editingId);
    if (index !== -1) {
      state.entries[index] = { ...state.entries[index], ...entry };
      showMessage(elements.msgEl, "記録を更新しました", "success");
    }
    cancelEdit();
  } else {
    // 追加
    const newEntry = { ...entry, id: Date.now() };
    state.entries.push(newEntry);
    showMessage(elements.msgEl, "記録を保存しました", "success");
  }
  save();
}

function deleteEntry(id) {
  if (!confirm("この記録を削除しますか？")) return;
  state.entries = state.entries.filter((e) => e.id !== id);
  save();
  render();
  showMessage(elements.msgEl, "記録を削除しました", "success");
}

function clearAll() {
  if (!confirm("全ての記録を削除しますか？この操作は取り消せません。")) return;
  state.entries = [];
  save();
  render();
  showMessage(elements.msgEl, "全ての記録を削除しました", "success");
}

function startEdit(id) {
  const entry = state.entries.find((e) => e.id === id);
  if (!entry) return;
  state.editingId = id;
  updateForm(entry, elements);
  elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
  showMessage(elements.msgEl, "編集モードです", "info");
}

function cancelEdit() {
  state.editingId = null;
  updateForm(null, elements);
  clearMessage(elements.msgEl);
}

function exportJSON() {
  if (state.entries.length === 0) {
    showMessage(elements.msgEl, "記録がありません", "error");
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
  showMessage(elements.msgEl, "JSONファイルをダウンロードしました", "success");
}

function exportCSV() {
  if (state.entries.length === 0) {
    showMessage(elements.msgEl, "記録がありません", "error");
    return;
  }
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
  const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join(
    "\n"
  );
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `coffee-journal-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showMessage(elements.msgEl, "CSVファイルをダウンロードしました", "success");
}

// ========== イベントリスナー ==========

elements.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const entry = {
    bean: elements.beanInput.value.trim(),
    score: Number(elements.scoreInput.value),
    date: elements.dateInput.value,
    roast: elements.roastInput.value,
    dose: Number(elements.doseInput.value),
    temp: Number(elements.tempInput.value),
    secs: Number(elements.secsInput.value),
    note: elements.noteInput.value.trim(),
  };
  const errors = validate(entry);
  if (errors.length > 0) {
    showMessage(elements.msgEl, errors.join(" / "), "error");
    return;
  }
  saveEntry(entry);
  elements.form.reset();
  render();
});

elements.searchInput.addEventListener("input", (e) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    state.query = e.target.value;
    state.page = 1;
    updateURL();
    save();
    render();
  }, 300);
});

elements.sortSelect.addEventListener("change", (e) => {
  const [key, order] = e.target.value.split("_");
  state.sortKey = key;
  state.sortOrder = order;
  state.page = 1;
  updateURL();
  save();
  render();
});

elements.prevPageBtn.addEventListener("click", () => {
  if (state.page > 1) {
    state.page--;
    updateURL();
    save();
    render();
    elements.list.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

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

elements.resetBtn.addEventListener("click", () => {
  cancelEdit();
  elements.form.reset();
});

elements.clearBtn.addEventListener("click", clearAll);
elements.exportJsonBtn.addEventListener("click", exportJSON);
elements.exportCsvBtn.addEventListener("click", exportCSV);

window.addEventListener("popstate", () => {
  loadFromURL();
  elements.searchInput.value = state.query;
  elements.sortSelect.value = `${state.sortKey}_${state.sortOrder}`;
  render();
});

// グローバル関数として公開（HTML onclick用）
window.deleteEntry = deleteEntry;
window.startEdit = startEdit;

// ========== 初期化 ==========

function init() {
  console.log("Coffee Journal を初期化しました");
  load();
  loadFromURL();
  elements.searchInput.value = state.query;
  elements.sortSelect.value = `${state.sortKey}_${state.sortOrder}`;
  updateURL();
  render();
}

init();
```

### index.html を修正

```html
<script type="module" src="./src/main.js"></script>
```

---

## ステップ 9: テストの更新（30 分）

### tests/logic.test.js を更新

```javascript
import { describe, it, expect } from "vitest";
import { filterEntries } from "../src/logic/filter.js";
import { sortEntries } from "../src/logic/sort.js";
import { calculateStats } from "../src/logic/stats.js";
import { paginate } from "../src/logic/paginate.js";

// 既存のテストをそのまま使用
// ...
```

---

## ステップ 10: パフォーマンス最適化（45 分）

### メモ化（memoization）の実装

#### src/utils/memoize.js

```javascript
/**
 * 関数をメモ化（キャッシュ）
 */
export function memoize(fn) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}
```

### 使用例（高度な最適化）

```javascript
import { memoize } from "./utils/memoize.js";

// 重い計算をメモ化
const memoizedFilter = memoize(filterEntries);
const memoizedSort = memoize(sortEntries);
const memoizedStats = memoize(calculateStats);
```

### デバウンスの改善

#### src/utils/debounce.js

```javascript
/**
 * デバウンス関数
 */
export function debounce(fn, delay) {
  let timer = null;

  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}
```

### 使用例

```javascript
import { debounce } from "./utils/debounce.js";

const debouncedSearch = debounce((value) => {
  state.query = value;
  state.page = 1;
  updateURL();
  save();
  render();
}, 300);

elements.searchInput.addEventListener("input", (e) => {
  debouncedSearch(e.target.value);
});
```

---

## ステップ 11: 最終チェック（30 分）

### チェックリスト

- [ ] すべてのファイルが正しい場所にある
- [ ] すべての import/export が正しい
- [ ] すべてのテストが通る
- [ ] カバレッジが 80%以上
- [ ] ESLint エラーがない（設定している場合）
- [ ] すべての機能が動作する
- [ ] パフォーマンスが向上している

### パフォーマンステスト

```javascript
// 大量データでテスト
console.time("render");
for (let i = 0; i < 1000; i++) {
  state.entries.push({
    id: i,
    bean: `Bean ${i}`,
    score: Math.floor(Math.random() * 5) + 1,
    date: "2025-01-01",
    note: "test",
  });
}
render();
console.timeEnd("render"); // 100ms以下が目標
```

---

## Phase 6 完成後のディレクトリ構造

```
/coffee-journal
  index.html
  styles.css
  package.json
  vite.config.js
  /src
    main.js
    /logic
      filter.js
      sort.js
      stats.js
      paginate.js
      index.js
    /storage
      localStorage.js
    /validation
      validate.js
    /dom
      render.js
      message.js
    /utils
      escapeHtml.js
      escapeCSV.js
      memoize.js
      debounce.js
  /tests
    logic.test.js
    validation.test.js
    storage.test.js
    utils.test.js
```

---

## 学習の振り返り

### 新しく使った知識

- [x] モジュール分割（関心の分離）
- [x] バレルエクスポート（index.js）
- [x] メモ化（memoization）
- [x] デバウンス関数の抽象化
- [x] テストのモック（localStorage）

### 重要な設計原則

- **単一責任の原則**: 1 つの関数/ファイルは 1 つの責任
- **DRY（Don't Repeat Yourself）**: 重複を避ける
- **関心の分離**: ロジック・UI・ストレージを分離
- **純関数優先**: 副作用を最小化
- **テスト容易性**: 各モジュールを独立してテスト可能に

### 達成できたこと

- [x] コードの可読性向上
- [x] メンテナンス性向上
- [x] テストカバレッジ 80%以上
- [x] パフォーマンス最適化
- [x] 再利用可能なモジュール

---

**Phase 6 完了！** これで Coffee Journal プロジェクトは完成です。
次のステップは React への移植、またはポートフォリオとしての公開準備です。
