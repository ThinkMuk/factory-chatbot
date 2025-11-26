/*
 * 날짜를 한국어 형식으로 포맷팅
 * 예: "2025년 11월 26일"
 */
export function formatKoreanDate(date: Date): string {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
