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
