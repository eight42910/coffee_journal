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
