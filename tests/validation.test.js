import { describe, it, expect } from "vitest";
import { validate } from "../src/validation/validation.js";

//テストブロック
describe("validate", () => {
  it("正常な入力の場合、エラーなし", () => {
    const entry = {
      bean: "Ethiopia",
      score: 4,
      date: "2025-01-01",
    };
    expect(validate(entry)).toEqual([]);
  });

  it("豆名が空の場合、エラーを返す", () => {
    const entry = {
      bean: "",
      score: 4,
      date: "2025-01-01",
    };
    const errors = validate(entry);
    //errorsの中にその文字列が含まれているか、どうか確認
    expect(errors).toContain("豆名を入力してください");
  });

  it("評価が範囲外の場合、エラーを返す", () => {
    const entry1 = {
      bean: "Test",
      score: 0,
      date: "2025-01-01",
    };
    const entry2 = {
      bean: "Test",
      score: 6,
      date: "2025-01-01",
    };
    expect(validate(entry1)).toContain("評価は1〜5の数値を入力してください");
    expect(validate(entry2)).toContain("評価は1〜5の数値を入力してください");
  });

  it("未来の日付の場合、エラーを返す", () => {
    const entry = {
      bean: "Test",
      score: 4,
      date: "2099-12-31",
    };
    const errors = validate(entry);
    expect(errors).toContain("未来の日付は入力できません");
  });

  it("複数のエラーを同時に返す", () => {
    const entry = {
      bean: "",
      score: 10,
      date: "2099-12-31",
    };
    const errors = validate(entry);
    expect(errors).toHaveLength(3);
  });
});
