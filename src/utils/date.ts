const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** Today's date as "今日は、○月○日（曜日）". */
export function todayString(): string {
  const now = new Date();
  return `今日は、${now.getMonth() + 1}月${now.getDate()}日（${WEEKDAYS[now.getDay()]}）`;
}
