/* PayHug 고객센터 — 콘텐츠 메타데이터
 * 본문은 content/<id>.html 파일에 분리되어 있음 (내용·정책 업데이트 시 해당 파일만 수정).
 * 정책 미확정 항목은 본문에서 <span class="tbd">확정 예정</span> 자리표시자로 표기.
 * 근거: payhug-spec (수수료율 C1, 지급 캘린더 C2, 예상 지급 차액 C4 미확정)
 * 아이콘은 app.js의 ICONS[id] (라인 SVG) 사용.
 */

const SITE = {
  tagline: "어제 매출 오늘 받기 — 페이허그 선정산 서비스",
  homepage: "https://payhug.io",
  contactEmail: "support@payhug.io",
  inquiryUrl: "https://payhug.io/my-info/inquiries", // 가맹점 앱 1:1 문의 (로그인 필요, 미로그인 시 로그인 화면으로 이동)
  company: {
    name: "주식회사 페이허그",
    copyright: "주식회사 페이허그",
    lines: [
      "사업자등록번호 896-87-03433",
      "서울특별시 광진구 천호대로 561, 14층 (중곡동, 영창빌딩)",
      "고객지원 support@payhug.io",
    ],
  },
};

/* 아티클 = 카테고리 (1:1). order = 홈 카드/사이드 내비 순서, pinned = 홈 "추천" 노출 */
const ARTICLES = [
  { id: "signup",     title: "가입 및 로그인", desc: "회원가입과 본인인증, 로그인 방법을 알려드려요.", updated: "2026-07-19" },
  { id: "documents",  title: "서류 등록",       desc: "서류를 미리 준비하시면 선정산 신청이 더 빨라져요.", updated: "2026-07-19" },
  { id: "workplace",  title: "내 사업장",       desc: "사업장 정보와 계좌를 관리하는 방법을 안내해요.", updated: "2026-07-19" },
  { id: "contract",   title: "서비스 계약",     desc: "페이허그 선정산 이용을 위한 계약 절차를 안내해요.", updated: "2026-07-19" },
  { id: "sales",      title: "매출 조회",       desc: "매출처를 연동하고 카드·배달앱 매출을 확인해 보세요.", updated: "2026-07-19" },
  { id: "settlement", title: "선정산",          desc: "어제 매출 오늘 받기 — 미리 받는 돈의 모든 것.", updated: "2026-07-19", pinned: true },
  { id: "faq",        title: "자주 묻는 질문",  desc: "사장님들이 가장 자주 묻는 질문을 모았어요.", updated: "2026-07-19", pinned: true },
];
