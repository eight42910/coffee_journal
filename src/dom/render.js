import {
  filterEntries,
  sortEntries,
  calculateStats,
  paginate,
} from "../logic/index.js";
import { escapeHtml } from "../utils/escapeHtml";

/**
|--------------------------------------------------
| 記録一覧を描画
|--------------------------------------------------
*/

export function renderEntries(state, elements) {
  const { list, avgEl, pageInfoEl, prevPageBtn, nextPageBtn } = elements;

  //１.フィルタ
  const filtered = filterEntries(state.entries, state.query);

  // 2. ソート
  const sorted = sortEntries(filtered, state.sortKey, state.sortOrder);

  //3. paginateの呼び出しを追加
  const { items, totalPages, currentPage, hasNext, hasPrev } = paginate(
    sorted,
    state.page,
    state.perPage
  );

  // 4. 統計情報を計算
  const stats = calculateStats(filtered);
  avgEl.textContent =
    stats.total === 0 ? "-" : `☆${stats.avg}(${stats.total}件)`;

  //ページ情報
  pageInfoEl.textContent =
    totalPages === 0 ? "0/ 0" : `${currentPage}/ ${totalPages}`;
  prevPageBtn.disable = totalPages === 0 || !hasPrev;
  nextPageBtn.disable = totalPages === 0 || !hasNext;

  //リスト描画
  list.innerHTML = "";
  if (items.length === 0) {
    list.innerHTML = state.query
      ? `<li class="text-sm text-stone-500">検索結果がありません</li>`
      : `<li class="text-sm text-stone-500">記録がありません</li>`;
    return;
  }

  items.forEach((entry) => {
    const li = document.createElement("li");
    li.className =
      "flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm";
    const infoWrapper = document.createElement("div");
    infoWrapper.className = "flex flex-col gap-1";

    const title = document.createElement("strong");
    title.className = "text-sm font-semibold text-stone-900";
    title.innerHTML = escapeHtml(entry.bean);

    const meta = document.createElement("span");
    meta.className = "text-xs text-stone-500";
    const stars = "★".repeat(entry.score) + "☆".repeat(5 - entry.score);
    meta.textContent = `${stars} | ${entry.date}`;

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className =
      "inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200";
    deleteBtn.innerHTML = `<span aria-hidden="true">🗑️</span>削除`;
    deleteBtn.addEventListener("click", () => window.deleteEntry(entry.id));

    infoWrapper.append(title, meta);
    li.append(infoWrapper, deleteBtn);
    list.appendChild(li);
  });
}

/**
 * フォーム更新（編集開始/キャンセル時に利用）
 */
export function updateForm(entry, elements) {
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
  } = elements;

  if (entry) {
    idInput.value = entry.id;
    beanInput.value = entry.bean;
    scoreInput.value = entry.score;
    dateInput.value = entry.date;
    roastInput.value = entry.roast || "";
    doseInput.value = entry.dose || "";
    tempInput.value = entry.temp || "";
    secsInput.value = entry.secs || "";
    noteInput.value = entry.note || "";
    submitBtn.textContent = "更新";
  } else {
    idInput.value = "";
    beanInput.value = "";
    scoreInput.value = "";
    dateInput.value = "";
    roastInput.value = "";
    doseInput.value = "";
    tempInput.value = "";
    secsInput.value = "";
    noteInput.value = "";
    submitBtn.textContent = "保存";
  }
}
