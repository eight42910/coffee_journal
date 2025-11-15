import { describe, it, expect } from "vitest";
import {
  filterEntries,
  sortEntries,
  calculateStats,
  paginate,
} from "../src/logic.js";

/**
|--------------------------------------------------
| filterEntries関数をまとめてテストする
| テストデータを定義する
|--------------------------------------------------
*/
describe("filterEntries", () => {
  const entries = [
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
    { id: 3, bean: "Kenya AA", score: 5, date: "2025-01-20", note: "ベリー系" },
  ];

  /** テストケース
|--------------------------------------------------
| 第1引数（何を確認するか）第2引数（処理実行、期待結果と比較）
|--------------------------------------------------
*/

  it("検索文字列が空の場合、全ての記録を返す", () => {
    expect(filterEntries(entries, "")).toEqual(entries);
    expect(filterEntries(entries, "   ")).toEqual(entries);
  });
  it("豆名で部分一致検索できる", () => {
    const result = filterEntries(entries, "eth");

    /**
    |--------------------------------------------------
    | expect(実際).toEqual(期待)
    |--------------------------------------------------
    */
    //結果配列の要素数が１つか確認
    expect(result).toHaveLength(1);
    //toBe(value)は ===と同じ　最初の要素のbeanが文字列を完全一致しているかどうか
    expect(result[0].bean).toBe("Ethiopia Yirgacheffe");
  });

  it("大文字小文字を区別しない", () => {
    const result = filterEntries(entries, "ETHIOPIA");
    expect(result).toHaveLength(1);
    expect(result[0].bean).toBe("Ethiopia Yirgacheffe");
  });

  it("メモで検索できる", () => {
    const result = filterEntries(entries, "ベリー");
    expect(result).toHaveLength(1);
    expect(result[0].bean).toBe("Kenya AA");
  });

  it("検索結果がない場合、空配列を返す", () => {
    const result = filterEntries(entries, "Brazil");
    expect(result).toEqual([]);
  });
});

describe("sortEntries", () => {
  const entries = [
    { id: 1, bean: "Zebra", score: 3, date: "2025-01-15" },
    { id: 2, bean: "Apple", score: 5, date: "2025-01-10" },
    { id: 3, bean: "Mango", score: 4, date: "2025-01-20" },
  ];

  it("日付の降順でソートできる", () => {
    const result = sortEntries(entries, "date", "desc");
    expect(result[0].bean).toBe("Mango");
    expect(result[1].bean).toBe("Zebra");
    expect(result[2].bean).toBe("Apple");
  });

  it("日付の昇順でソートできる", () => {
    const result = sortEntries(entries, "date", "asc");
    expect(result[0].bean).toBe("Apple");
    expect(result[1].bean).toBe("Zebra");
    expect(result[2].bean).toBe("Mango");
  });

  it("評価の降順でソートできる", () => {
    const result = sortEntries(entries, "score", "desc");
    expect(result[0].score).toBe(5);
    expect(result[1].score).toBe(4);
    expect(result[2].score).toBe(3);
  });

  it("豆名の昇順でソートできる", () => {
    const result = sortEntries(entries, "bean", "asc");
    expect(result[0].bean).toBe("Apple");
    expect(result[1].bean).toBe("Mango");
    expect(result[2].bean).toBe("Zebra");
  });

  it("元の配列を変更しない", () => {
    const original = [...entries];
    sortEntries(entries, "date", "desc");
    expect(entries).toEqual(original);
  });
});

describe("calculateStats", () => {
  it("正しく平均を計算する", () => {
    const entries = [{ score: 4 }, { score: 5 }, { score: 3 }];
    const result = calculateStats(entries);
    expect(result.avg).toBe(4.0);
    expect(result.total).toBe(3);
  });

  it("小数点1桁に丸める", () => {
    const entries = [{ score: 4 }, { score: 4 }, { score: 5 }];
    const result = calculateStats(entries);
    expect(result.avg).toBe(4.3);
  });

  it("最高評価を正しく取得する", () => {
    const entries = [
      { bean: "A", score: 3 },
      { bean: "B", score: 5 },
      { bean: "C", score: 4 },
    ];
    const result = calculateStats(entries);
    expect(result.max).toBe(5);
    expect(result.maxBean).toBe("B");
  });

  it("記録がない場合、デフォルト値を返す", () => {
    const result = calculateStats([]);
    expect(result).toEqual({
      avg: 0,
      max: 0,
      maxBean: null,
      total: 0,
    });
  });
});

/**
|--------------------------------------------------
| paginate　テスト
|--------------------------------------------------
*/
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
