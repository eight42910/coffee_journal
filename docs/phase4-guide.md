# Phase 4 実装手順書 - URL同期とテスト

**目標**: URLと状態を同期し、テストを導入する  
**所要時間**: 3-4時間  
**前提**: Phase 3 が完了していること

---

## ステップ 1: URLSearchParams の理解（20分）

### URLSearchParams とは
URLのクエリパラメータ（`?key=value&key2=value2`）を操作するAPI。

### 基本的な使い方
```javascript
// URLからパラメータを取得
const params = new URLSearchParams(window.location.search);
console.log(params.get('q'));      // クエリパラメータ 'q' の値
console.log(params.get('sort'));   // クエリパラメータ 'sort' の値

// パラメータを設定
params.set('q', 'ethiopia');
params.set('sort', 'score_desc');

// URL文字列に変換
console.log(params.toString()); // "q=ethiopia&sort=score_desc"
```

### 確認
```javascript
// 現在のURLを確認
console.log(window.location.href);
console.log(window.location.search); // "?q=test&sort=date_desc"

// パラメータを解析
const params = new URLSearchParams(window.location.search);
console.log(params.get('q'));      // "test"
console.log(params.get('sort'));   // "date_desc"
```

---

## ステップ 2: History API の理解（20分）

### History API とは
ブラウザの履歴を操作し、URLを変更できるAPI。

### 基本的な使い方
```javascript
// URLを変更（ページはリロードしない）
history.pushState(null, '', '/new-url?param=value');

// URLを置き換え（履歴を追加しない）
history.replaceState(null, '', '/new-url?param=value');

// 戻る/進むボタンが押されたときのイベント
window.addEventListener('popstate', (e) => {
  console.log('URLが変更されました:', window.location.href);
});
```

### pushState vs replaceState
- **pushState**: 履歴に追加（戻るボタンで戻れる）
- **replaceState**: 現在の履歴を置き換え（戻るボタンで戻れない）

検索・ソートの場合は **replaceState** を使う（履歴を汚さない）。

---

## ステップ 3: URLに状態を反映する関数（30分）

### 目的
検索・ソート条件をURLに反映する。

### コード
```javascript
/**
 * 現在の state を URL に反映
 */
function updateURL() {
  const params = new URLSearchParams();
  
  // 検索文字列
  if (state.query) {
    params.set('q', state.query);
  }
  
  // ソート条件（デフォルト値でなければ設定）
  const sortValue = `${state.sortKey}_${state.sortOrder}`;
  if (sortValue !== 'date_desc') {
    params.set('sort', sortValue);
  }
  
  // URL を更新（履歴は追加しない）
  const newURL = params.toString() 
    ? `${window.location.pathname}?${params.toString()}`
    : window.location.pathname;
  
  history.replaceState(null, '', newURL);
  
  console.log('URL を更新しました:', newURL);
}
```

### 学習ポイント
- **条件付き設定**: デフォルト値は省略してURLをシンプルに
- **replaceState**: 履歴を追加せず、現在のURLを置き換え
- **window.location.pathname**: ドメイン以降のパス部分

### 確認
```javascript
state.query = 'ethiopia';
state.sortKey = 'score';
state.sortOrder = 'desc';
updateURL();
// URL: http://localhost:5500/?q=ethiopia&sort=score_desc
```

---

## ステップ 4: URLから状態を復元する関数（30分）

### 目的
URLのパラメータから state を復元する。

### コード
```javascript
/**
 * URL から state を復元
 */
function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  
  // 検索文字列
  const query = params.get('q');
  if (query !== null) {
    state.query = query;
  }
  
  // ソート条件
  const sort = params.get('sort');
  if (sort) {
    const [key, order] = sort.split('_');
    if (key && order) {
      state.sortKey = key;
      state.sortOrder = order;
    }
  }
  
  console.log('URL から状態を復元しました:', { 
    query: state.query, 
    sort: `${state.sortKey}_${state.sortOrder}` 
  });
}
```

### 学習ポイント
- **null チェック**: `params.get()` は存在しない場合 `null` を返す
- **デフォルト値**: URLにパラメータがなければ state の初期値を使う

### 確認
```javascript
// URLに ?q=test&sort=score_asc を追加して
loadFromURL();
console.log(state.query);     // "test"
console.log(state.sortKey);   // "score"
console.log(state.sortOrder); // "asc"
```

---

## ステップ 5: 検索・ソート時にURLを更新（20分）

### コード修正
```javascript
// 検索入力時の処理
searchInput.addEventListener('input', (e) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    state.query = e.target.value;
    updateURL();  // ← 追加
    save();
    render();
  }, 300);
});

// ソート選択時の処理
sortSelect.addEventListener('change', (e) => {
  const value = e.target.value;
  const [key, order] = value.split('_');
  state.sortKey = key;
  state.sortOrder = order;
  updateURL();  // ← 追加
  save();
  render();
});
```

### 確認
1. 検索ボックスに「ethiopia」と入力
2. URLが `?q=ethiopia` に変わる
3. ソートを「評価が高い順」に変更
4. URLが `?q=ethiopia&sort=score_desc` に変わる

---

## ステップ 6: ブラウザの戻る/進むボタンに対応（30分）

### 目的
戻る/進むボタンでURLが変わったときに、状態を復元する。

### コード
```javascript
/**
 * ブラウザの戻る/進むボタンが押されたとき
 */
window.addEventListener('popstate', () => {
  console.log('popstate イベント発火');
  
  // URLから状態を復元
  loadFromURL();
  
  // フォームの値を同期
  searchInput.value = state.query;
  sortSelect.value = `${state.sortKey}_${state.sortOrder}`;
  
  // 再描画
  render();
});
```

### 学習ポイント
- **popstate イベント**: 戻る/進むボタンで発火
- フォームの値も更新しないと、表示と入力欄がズレる

### 確認
1. 検索・ソートを何度か変更（URLが変わる）
2. ブラウザの戻るボタンを押す
3. 前の検索・ソート状態に戻る
4. 進むボタンを押すと元に戻る

---

## ステップ 7: init() を修正（15分）

### 目的
ページ読み込み時に、URLとlocalStorageの両方から状態を復元する。

### コード修正
```javascript
// 初期化
function init() {
  console.log('Coffee Journal を初期化しました');
  
  // 1. localStorage からデータを読み込み
  load();
  
  // 2. URL から状態を復元（URL が優先）
  loadFromURL();
  
  // 3. フォームの値を同期
  searchInput.value = state.query;
  sortSelect.value = `${state.sortKey}_${state.sortOrder}`;
  
  // 4. 初回の URL 更新
  updateURL();
  
  // 5. 描画
  render();
}
```

### 学習ポイント
- **優先順位**: localStorage → URL の順で読み込み、URLを優先
- これにより、URLを共有すると同じ表示になる

### 確認
1. 検索・ソートを設定してURLをコピー
2. 別のタブで同じURLを開く
3. 同じ検索・ソート状態で表示される

---

## ステップ 8: エラーメッセージにARIAを追加（20分）

### 目的
スクリーンリーダー利用者にもエラーを通知する。

### HTML修正
`index.html` の `msgEl` に属性を追加:
```html
<p id="msg" class="message" role="status" aria-live="polite"></p>
```

### 学習ポイント
- **role="status"**: 状態メッセージであることを示す
- **aria-live="polite"**: 変更があったら読み上げる（控えめに）
  - `polite`: 現在の読み上げが終わってから
  - `assertive`: すぐに読み上げる

### エラー表示関数の作成
```javascript
/**
 * メッセージを表示
 * @param {string} message - 表示するメッセージ
 * @param {string} type - 'success' | 'error' | 'info'
 */
function showMessage(message, type = 'info') {
  msgEl.textContent = message;
  
  // 色を変更
  if (type === 'success') {
    msgEl.style.color = '#10b981';
  } else if (type === 'error') {
    msgEl.style.color = '#ef4444';
  } else {
    msgEl.style.color = 'inherit';
  }
  
  // 3秒後にクリア
  setTimeout(() => {
    msgEl.textContent = '';
  }, 3000);
}
```

### 既存コードを修正
```javascript
// 成功メッセージの例
showMessage('記録を保存しました', 'success');

// エラーメッセージの例
showMessage(errors.join(' / '), 'error');
```

---

## ステップ 9: Vitest のセットアップ（30分）

### package.json を作成
```bash
npm init -y
```

### Vitest をインストール
```bash
npm install -D vitest
```

### package.json にテストスクリプトを追加
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  },
  "type": "module"
}
```

### vite.config.js を作成
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node'
  }
});
```

---

## ステップ 10: ロジック関数を分離（45分）

### 目的
純関数を別ファイルに分離し、テストしやすくする。

### src/logic.js を作成
```javascript
/**
 * 記録を検索文字列でフィルタリング
 */
export function filterEntries(entries, query) {
  if (!query || query.trim().length === 0) {
    return entries;
  }
  const lowerQuery = query.toLowerCase();
  return entries.filter(entry => {
    const beanMatch = entry.bean.toLowerCase().includes(lowerQuery);
    const noteMatch = entry.note && entry.note.toLowerCase().includes(lowerQuery);
    return beanMatch || noteMatch;
  });
}

/**
 * 記録をソート
 */
export function sortEntries(entries, key, order) {
  const sorted = [...entries];
  sorted.sort((a, b) => {
    let compareA, compareB;
    if (key === 'date') {
      compareA = new Date(a.date);
      compareB = new Date(b.date);
    } else if (key === 'score') {
      compareA = a.score;
      compareB = b.score;
    } else if (key === 'bean') {
      compareA = a.bean.toLowerCase();
      compareB = b.bean.toLowerCase();
    } else {
      return 0;
    }
    if (order === 'asc') {
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
    total: entries.length
  };
}
```

### src/validation.js を作成
```javascript
/**
 * 入力値をバリデーション
 */
export function validate(entry) {
  const errors = [];
  
  if (!entry.bean || entry.bean.trim().length === 0) {
    errors.push('豆名を入力してください');
  }
  
  if (!entry.score || entry.score < 1 || entry.score > 5) {
    errors.push('評価は1〜5の数値を入力してください');
  }
  
  if (!entry.date) {
    errors.push('日付を入力してください');
  } else {
    const inputDate = new Date(entry.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDate > today) {
      errors.push('未来の日付は入力できません');
    }
  }
  
  return errors;
}
```

### app.js を修正
```javascript
import { filterEntries, sortEntries, calculateStats } from './src/logic.js';
import { validate } from './src/validation.js';

// ... 既存のコード ...
```

### index.html を修正
```html
<script type="module" src="./app.js"></script>
```

---

## ステップ 11: テストファイルを作成（45分）

### tests/logic.test.js
```javascript
import { describe, it, expect } from 'vitest';
import { filterEntries, sortEntries, calculateStats } from '../src/logic.js';

describe('filterEntries', () => {
  const entries = [
    { id: 1, bean: 'Ethiopia Yirgacheffe', score: 5, date: '2025-01-15', note: '華やか' },
    { id: 2, bean: 'Colombia Supremo', score: 4, date: '2025-01-10', note: 'バランス良い' },
    { id: 3, bean: 'Kenya AA', score: 5, date: '2025-01-20', note: 'ベリー系' }
  ];

  it('検索文字列が空の場合、全ての記録を返す', () => {
    expect(filterEntries(entries, '')).toEqual(entries);
    expect(filterEntries(entries, '   ')).toEqual(entries);
  });

  it('豆名で部分一致検索できる', () => {
    const result = filterEntries(entries, 'eth');
    expect(result).toHaveLength(1);
    expect(result[0].bean).toBe('Ethiopia Yirgacheffe');
  });

  it('大文字小文字を区別しない', () => {
    const result = filterEntries(entries, 'ETHIOPIA');
    expect(result).toHaveLength(1);
    expect(result[0].bean).toBe('Ethiopia Yirgacheffe');
  });

  it('メモで検索できる', () => {
    const result = filterEntries(entries, 'ベリー');
    expect(result).toHaveLength(1);
    expect(result[0].bean).toBe('Kenya AA');
  });

  it('検索結果がない場合、空配列を返す', () => {
    const result = filterEntries(entries, 'Brazil');
    expect(result).toEqual([]);
  });
});

describe('sortEntries', () => {
  const entries = [
    { id: 1, bean: 'Zebra', score: 3, date: '2025-01-15' },
    { id: 2, bean: 'Apple', score: 5, date: '2025-01-10' },
    { id: 3, bean: 'Mango', score: 4, date: '2025-01-20' }
  ];

  it('日付の降順でソートできる', () => {
    const result = sortEntries(entries, 'date', 'desc');
    expect(result[0].bean).toBe('Mango');  // 2025-01-20
    expect(result[1].bean).toBe('Zebra');  // 2025-01-15
    expect(result[2].bean).toBe('Apple');  // 2025-01-10
  });

  it('日付の昇順でソートできる', () => {
    const result = sortEntries(entries, 'date', 'asc');
    expect(result[0].bean).toBe('Apple');  // 2025-01-10
    expect(result[1].bean).toBe('Zebra');  // 2025-01-15
    expect(result[2].bean).toBe('Mango');  // 2025-01-20
  });

  it('評価の降順でソートできる', () => {
    const result = sortEntries(entries, 'score', 'desc');
    expect(result[0].score).toBe(5);
    expect(result[1].score).toBe(4);
    expect(result[2].score).toBe(3);
  });

  it('豆名の昇順でソートできる', () => {
    const result = sortEntries(entries, 'bean', 'asc');
    expect(result[0].bean).toBe('Apple');
    expect(result[1].bean).toBe('Mango');
    expect(result[2].bean).toBe('Zebra');
  });

  it('元の配列を変更しない', () => {
    const original = [...entries];
    sortEntries(entries, 'date', 'desc');
    expect(entries).toEqual(original);
  });
});

describe('calculateStats', () => {
  it('正しく平均を計算する', () => {
    const entries = [
      { score: 4 },
      { score: 5 },
      { score: 3 }
    ];
    const result = calculateStats(entries);
    expect(result.avg).toBe(4.0);
    expect(result.total).toBe(3);
  });

  it('小数点1桁に丸める', () => {
    const entries = [
      { score: 4 },
      { score: 4 },
      { score: 5 }
    ];
    const result = calculateStats(entries);
    expect(result.avg).toBe(4.3);
  });

  it('最高評価を正しく取得する', () => {
    const entries = [
      { bean: 'A', score: 3 },
      { bean: 'B', score: 5 },
      { bean: 'C', score: 4 }
    ];
    const result = calculateStats(entries);
    expect(result.max).toBe(5);
    expect(result.maxBean).toBe('B');
  });

  it('記録がない場合、デフォルト値を返す', () => {
    const result = calculateStats([]);
    expect(result).toEqual({
      avg: 0,
      max: 0,
      maxBean: null,
      total: 0
    });
  });
});
```

### tests/validation.test.js
```javascript
import { describe, it, expect } from 'vitest';
import { validate } from '../src/validation.js';

describe('validate', () => {
  it('正常な入力の場合、エラーなし', () => {
    const entry = {
      bean: 'Ethiopia',
      score: 4,
      date: '2025-01-01'
    };
    expect(validate(entry)).toEqual([]);
  });

  it('豆名が空の場合、エラーを返す', () => {
    const entry = {
      bean: '',
      score: 4,
      date: '2025-01-01'
    };
    const errors = validate(entry);
    expect(errors).toContain('豆名を入力してください');
  });

  it('評価が範囲外の場合、エラーを返す', () => {
    const entry1 = {
      bean: 'Test',
      score: 0,
      date: '2025-01-01'
    };
    const entry2 = {
      bean: 'Test',
      score: 6,
      date: '2025-01-01'
    };
    expect(validate(entry1)).toContain('評価は1〜5の数値を入力してください');
    expect(validate(entry2)).toContain('評価は1〜5の数値を入力してください');
  });

  it('未来の日付の場合、エラーを返す', () => {
    const entry = {
      bean: 'Test',
      score: 4,
      date: '2099-12-31'
    };
    const errors = validate(entry);
    expect(errors).toContain('未来の日付は入力できません');
  });

  it('複数のエラーを同時に返す', () => {
    const entry = {
      bean: '',
      score: 10,
      date: '2099-12-31'
    };
    const errors = validate(entry);
    expect(errors).toHaveLength(3);
  });
});
```

---

## ステップ 12: テストを実行（15分）

### テストを実行
```bash
npm test
```

### すべてのテストが通ることを確認
```
✓ tests/logic.test.js (15)
✓ tests/validation.test.js (6)

Test Files  2 passed (2)
Tests  21 passed (21)
```

### カバレッジを確認
```bash
npm run test:coverage
```

---

## Phase 4 完成チェックリスト

### URL同期
- [ ] 検索するとURLに `?q=検索文字列` が追加される
- [ ] ソート変更するとURLに `&sort=key_order` が追加される
- [ ] URLをコピーして別タブで開くと同じ表示になる
- [ ] ブラウザの戻るボタンで前の状態に戻る
- [ ] 進むボタンで次の状態に進む

### アクセシビリティ
- [ ] エラーメッセージに `role="status"` がある
- [ ] エラーメッセージに `aria-live="polite"` がある
- [ ] スクリーンリーダーでメッセージが読み上げられる

### テスト
- [ ] すべてのテストが通る
- [ ] カバレッジが80%以上
- [ ] 純関数はすべてテスト済み

---

## 学習の振り返り

### 新しく使った知識
- [x] URLSearchParams（URLパラメータの操作）
- [x] History API（pushState, replaceState, popstate）
- [x] WAI-ARIA（role, aria-live）
- [x] ES Modules（import/export）
- [x] Vitest（テストフレームワーク）
- [x] describe/it/expect（テストの書き方）

### 重要な設計パターン
- **URL as State**: URLを状態の一部として扱う
- **モジュール分割**: 機能ごとにファイルを分ける
- **純関数のテスト**: 副作用がないのでテストしやすい
- **境界値テスト**: 正常値・異常値・境界値をテスト

---

**Phase 4 完了！** 次は Phase 5（追加機能）に進みます。
