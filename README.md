# 페이허그 고객센터 (payhug-support)

페이허그 선정산 서비스 고객센터 정적 사이트. GitHub Pages로 배포됩니다.

- 배포 URL: https://joo2n.github.io/payhug-support/
- 페이허그 홈: https://payhug.io

## 구조

```
index.html      사이트 셸 (헤더 알약형 검색·검색 모달·푸터)
style.css       디자인 시스템 (브랜드: 딥 그린 #163300 / 라임 #9fe870, Noto Sans KR)
                레이아웃: 사이드내비 250px / 본문 700px / 목차 228px, 헤더 60px
app.js          해시 라우터 + 렌더러 + 검색 + 인터랙션
content.js      사이트 정보(문의 URL 포함) + 아티클 메타데이터
content/*.html  아티클 본문 (HTML 조각) — 내용 수정은 여기서
assets/         로고·파비콘 (payhug-merchant-web 원본)
tests/          runner.html — 헤드리스 인터랙션 회귀 테스트 (22개 검증)
                mobile-375.html — 모바일(375px) 뷰포트 QA (same-origin iframe 래퍼)
inbox/          정책·QnA 반영 요청 (아래 워크플로우 참조)
```

## 기능·인터랙션

- **섹션 딥링크**: `#/article/{id}/{섹션id}` — 제목 클릭 시 이동, 호버 시 "링크 복사" 버튼(토스트)
- **검색**: 헤더 알약/히어로 → 모달, 제목+본문 검색, 검색어 하이라이트, 결과 건수, ↑↓/Enter, 모바일 전체화면
- **목차**: 우측 고정(1310px+), 스크롤 시 현재 섹션 하이라이트, 모바일은 상단 드롭다운(현재 섹션명 표시)
- **본문 크로스링크**: "자세히 보기" 32곳이 대상 아티클의 정확한 섹션으로 연결 (전수 검증됨)
- **1:1 문의**: 문의 박스·푸터 → https://payhug.io/my-info/inquiries (로그인 필요) + support@payhug.io

테스트: 로컬 서버 실행 후 `tests/runner.html`을 헤드리스 Chrome `--dump-dom`으로 열면 PASS/FAIL 출력.
모바일(375px) 검증은 `tests/mobile-375.html`로 수행.

> **주의 (모바일 QA 캡처)**: macOS 헤드리스 Chrome(`--headless=new`)은 `--window-size`의 창 최소폭을
> 500px로 클램프한다. `--window-size=375`로 스크린샷을 찍으면 500px로 렌더된 화면의 좌측 375px만
> 잘려 저장되어 "우측 잘림"처럼 보이는 가짜 결함이 생기므로 그 방식의 캡처는 무효.
> 375px 검증은 same-origin iframe(375px) 래퍼(`tests/mobile-375.html`) 또는
> Playwright/Puppeteer의 `setViewport`로 할 것.

## 화면 구성 (7개 아티클)

| id | 제목 | 홈 추천 |
|---|---|---|
| signup | 가입 및 로그인 | |
| documents | 서류 등록 | |
| workplace | 내 사업장 | |
| contract | 서비스 계약 | |
| sales | 매출 조회 | |
| settlement | 선정산 | ✅ |
| faq | 자주 묻는 질문 | ✅ |

홈 = 히어로(사이트명 + 검색) + 추천 대형 카드 2개 + 전체 카테고리 행 리스트.
아티클 = 좌측 사이드 내비 + 본문(커버 배너·번호 섹션·콜아웃·접기토글) + 우측 목차(scroll-spy).

## 정책·QnA 반영 워크플로우

정책이 확정·변경되거나 QnA를 추가하고 싶으면 아래 **셋 중 아무거나** 쓰면 된다. 접수 항목은 모두 같다.

| 채널 | 주소 | 필요한 것 | 쓰는 상황 |
|---|---|---|---|
| **입력 양식** | [/policy/](https://joo2n.github.io/payhug-support/policy/) | GitHub 계정 | 기본. 항목을 빠짐없이 채우게 유도됨 |
| **노션 DB** | [📥 정책 입력함](https://app.notion.com/p/a43ff18585214319b5d3b5f0d8643fac) | 노션 계정 | 여럿이 같이 보고 상태를 추적할 때 |
| **마크다운 붙여넣기** | 입력 양식의 `[마크다운 복사]` | 없음 | 계정 없이 Claude에게 바로 줄 때 |

접수 → Claude가 근거 확인·기존 문서 대조 → ① 고객센터 아티클 수정 ② `payhug-spec` 정책서 동기화(07 미확정 질문 갱신 포함) ③ 이슈 닫기·노션 `처리 상태` 갱신 → push → 1~2분 내 사이트 반영.

**"확정" 수준의 내용만 고객센터 본문에 값으로 반영됨.** 가설·확인 필요는 정책서에만 기록.
근거가 부족하거나 기존 문서와 충돌하면 임의로 확정하지 않고 되묻는다.

> **접수 내용은 비공개 저장소([`payhug-policy-inbox`](https://github.com/Joo2n/payhug-policy-inbox))로만 전달된다.**
> 이 저장소는 Pages 배포 때문에 공개이므로, 내부 정책을 여기 이슈에 쓰면 누구나 볼 수 있다.
> `/policy/` 페이지는 공개 주소지만 빈 양식만 공개되고 작성 내용은 페이지에 저장되지 않는다 (`noindex`).

`inbox/` 폴더 방식(마크다운 파일을 직접 커밋)도 계속 동작하지만, 위 채널이 있으므로 보조 수단이다.

## 콘텐츠 수정 방법

1. 본문: `content/<id>.html` 편집 (h2 `id="sec-N"` / h3 `id="sec-N-M"` 유지 — 목차 자동 생성)
2. 제목·설명·수정일: `content.js`의 `ARTICLES` 편집
3. **미확정 정책**은 `<span class="tbd">확정 예정</span>` 자리표시자로 표기되어 있음 —
   수수료율, 지급 시각·캘린더, 최소 금액, 사업장 수 제한, 법인/외국인 이용, 계약 기간·해지 조건 등.
   정책 확정 시 자리표시자를 실제 값으로 교체.
4. push 하면 GitHub Pages 자동 반영 (1~2분).

## 콘텐츠 원칙 (payhug-spec 기준)

- 고객 노출 용어만 사용: 미리 받는 돈 / 이전 지급 조정금액 / 이번 선정산 미반영 금액 / 플랫폼 환급금 / 추가 지급 예정금액 / 출금전용 계좌 (내부 용어 노출 금지)
- 미확정 정책(payhug-spec C1 수수료율 / C2 지급 캘린더 / C4 예상 지급 차액)은 어떤 값도 확정 표기하지 않음
- 선정산은 대출이 아닌 정산금 채권 완전매입(양수도) — 이 프레임으로 일관 서술
