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
