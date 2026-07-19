/* PayHug 고객센터 — 해시 라우터 + 렌더러 + 검색
 * 라우트: #/ 홈, #/article/{id}, #/article/{id}/{섹션id} (섹션 딥링크)
 * 본문은 content/<id>.html 을 fetch로 로드 (GitHub Pages 정적 서빙)
 */
(function () {
  const app = document.getElementById("app");
  const bodies = {}; // id → HTML 문자열 캐시
  let currentArticleId = null;
  let spyCleanup = null; // 스크롤 리스너 해제 함수
  let openSearch = null; // 검색 모달 열기 (initSearchModal에서 할당)

  const byId = (id) => ARTICLES.find((a) => a.id === id);

  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

  /* ── 아이콘 (라인 SVG, currentColor) ───── */
  const IC = (paths, size) =>
    `<svg width="${size || 20}" height="${size || 20}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const ICONS = {
    signup: IC('<circle cx="8" cy="15" r="4"/><path d="M11 12L20 3M16 7l3 3M13 10l2 2"/>'),
    documents: IC('<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z"/><path d="M14 3v4h4M9.5 12h5M9.5 16h5"/>'),
    workplace: IC('<path d="M4 10l1.2-5h13.6L20 10M5 10v10h14V10M5 20h14M10 20v-5h4v5"/><path d="M4 10h16"/>'),
    contract: IC('<path d="M13 5l6 6-9 9H4v-6z"/><path d="M11 7l6 6M4 21h9"/>'),
    sales: IC('<path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/>'),
    settlement: IC('<rect x="3" y="7" width="18" height="11" rx="1.5"/><circle cx="12" cy="12.5" r="2.6"/><path d="M6.5 7v-0.5M17.5 18v0.5"/>'),
    faq: IC('<path d="M21 12a8 8 0 1 0-3.1 6.3L21 20l-1-3.3A8 8 0 0 0 21 12z"/><path d="M9.6 10a2.4 2.4 0 1 1 3.3 2.2c-.7.3-.9.7-.9 1.4M12 16.6v.1"/>'),
    tag: IC('<path d="M4 4h7l9 9-7 7-9-9z"/><circle cx="8.5" cy="8.5" r="1.2"/>', 13),
    mail: IC('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', 15),
    chat: IC('<path d="M21 12a8 8 0 1 0-3.1 6.3L21 20l-1-3.3A8 8 0 0 0 21 12z"/>', 15),
    link: IC('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.6 1.6"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.6-1.6"/>', 15),
    doc: IC('<path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z"/><path d="M14 3v4h4"/>', 16),
    search: IC('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  };

  /* ── 토스트 ───────────────────────────── */
  let toastTimer = null;
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) {
      el = document.createElement("div");
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2000);
  }

  async function loadBody(id) {
    if (!(id in bodies)) {
      try {
        const res = await fetch(`content/${id}.html`);
        bodies[id] = res.ok
          ? await res.text()
          : `<p>콘텐츠를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>`;
      } catch (e) {
        bodies[id] = `<p>콘텐츠를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>`;
      }
    }
    return bodies[id];
  }

  const loadAllBodies = () => Promise.all(ARTICLES.map((a) => loadBody(a.id)));

  /* ── 홈 ──────────────────────────────── */

  function renderHome() {
    currentArticleId = null;
    if (spyCleanup) { spyCleanup(); spyCleanup = null; }
    document.title = "페이허그 고객센터";
    const pinned = ARTICLES.filter((a) => a.pinned);
    app.innerHTML = `
      <section class="hero">
        <div class="wrap">
          <h1>페이허그 고객센터</h1>
          <button class="hero-search" id="hero-search" aria-label="검색 열기">
            <span class="hs-icon">${ICONS.search}</span>
            <span class="hs-placeholder">아티클 제목, 내용</span>
          </button>
        </div>
      </section>
      <div class="home-content">
        <div class="section-label">추천</div>
        <div class="feature-grid">
          ${pinned.map(
            (a) => `
            <a class="feature-card" href="#/article/${a.id}">
              <div class="fc-visual">${ICONS[a.id] || ICONS.doc}</div>
              <h3>${esc(a.title)}</h3>
              <p>${esc(a.desc)}</p>
            </a>`
          ).join("")}
        </div>
        <hr class="home-divider" />
        <div class="section-label">전체 카테고리</div>
        <div class="cat-list">
          ${ARTICLES.map(
            (a) => `
            <a class="cat-row" href="#/article/${a.id}">
              <div class="cr-text">
                <h3>${esc(a.title)}</h3>
                <p>${esc(a.desc)}</p>
              </div>
              <div class="cr-visual">${ICONS[a.id] || ICONS.doc}</div>
            </a>`
          ).join("")}
        </div>
      </div>`;
    const btn = document.getElementById("hero-search");
    if (btn && openSearch) btn.addEventListener("click", openSearch);
  }

  /* ── 아티클 ───────────────────────────── */

  async function renderArticle(artId, secId) {
    const art = byId(artId);
    if (!art) return renderHome();

    // 같은 아티클 내 섹션 이동이면 재렌더 없이 스크롤만
    if (currentArticleId === artId && document.getElementById("article-body")) {
      if (secId) scrollToSection(secId);
      return;
    }
    currentArticleId = artId;
    document.title = `${art.title} — 페이허그 고객센터`;

    app.innerHTML = `
      <div class="article-layout">
        <aside class="side-nav">
          ${ARTICLES.map(
            (a) =>
              `<a href="#/article/${a.id}" class="${a.id === artId ? "active" : ""}">${esc(a.title)}</a>`
          ).join("")}
        </aside>
        <article class="article-main">
          <div class="article-cover">${ICONS[artId] || ICONS.doc}</div>
          <h1 class="page-title">${esc(art.title)}</h1>
          <p class="page-desc">${esc(art.desc)}</p>
          <hr class="title-divider" />
          <div class="toc-mobile" id="toc-mobile"></div>
          <div class="article-body" id="article-body"><p class="loading">불러오는 중…</p></div>
          ${contactBox()}
        </article>
        <aside class="toc" id="toc"></aside>
      </div>`;
    if (!secId) window.scrollTo(0, 0);

    const html = await loadBody(artId);
    const bodyEl = document.getElementById("article-body");
    if (!bodyEl || currentArticleId !== artId) return; // 로딩 중 다른 페이지로 이동한 경우
    bodyEl.innerHTML = html;
    decorateHeadings(bodyEl, artId);
    buildToc(bodyEl, artId);
    initScrollSpy(bodyEl);
    if (secId) scrollToSection(secId);
  }

  /* 헤딩: 클릭 = 섹션 딥링크 이동, 호버 시 "링크 복사" 버튼 */
  function decorateHeadings(bodyEl, artId) {
    bodyEl.querySelectorAll("h2, h3").forEach((h, i) => {
      if (!h.id) h.id = "sec-" + i;
      const text = h.innerHTML;
      h.innerHTML =
        `<a class="h-anchor" href="#/article/${artId}/${h.id}">${text}</a>` +
        `<button class="copy-btn" data-sec="${h.id}" title="링크 복사" aria-label="링크 복사">${ICONS.link}</button>`;
    });
    bodyEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".copy-btn");
      if (!btn) return;
      const url = location.origin + location.pathname + `#/article/${artId}/${btn.dataset.sec}`;
      copyText(url)
        .then(() => toast("클립보드에 복사되었습니다."))
        .catch(() => toast("복사에 실패했어요."));
    });
  }

  function copyText(t) {
    const legacy = () =>
      new Promise((resolve, reject) => {
        const ta = document.createElement("textarea");
        ta.value = t;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand("copy") ? resolve() : reject(new Error("copy failed"));
        } catch (err) {
          reject(err);
        } finally {
          ta.remove();
        }
      });
    if (!(navigator.clipboard && navigator.clipboard.writeText)) return legacy();
    // 권한 대기로 매달리는 브라우저 대비: 1.2초 내 응답 없으면 레거시 방식으로 폴백
    return Promise.race([
      navigator.clipboard.writeText(t),
      new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 1200)),
    ]).catch(() => legacy());
  }

  function buildToc(bodyEl, artId) {
    const heads = bodyEl.querySelectorAll("h2, h3");
    if (!heads.length) return;
    let items = "";
    heads.forEach((h) => {
      items += `<a href="#/article/${artId}/${h.id}" data-sec="${h.id}" class="toc-${h.tagName.toLowerCase()}">${esc(h.textContent)}</a>`;
    });
    const toc = document.getElementById("toc");
    const tocMobile = document.getElementById("toc-mobile");
    if (toc) toc.innerHTML = items;
    if (tocMobile) {
      tocMobile.innerHTML = `<details><summary><span id="toc-current">목차</span></summary><div class="toc-mobile-list">${items}</div></details>`;
      // 항목 선택 시 드롭다운 닫기
      tocMobile.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => tocMobile.querySelector("details").removeAttribute("open"))
      );
    }
  }

  function scrollToSection(secId) {
    // 해시 내비게이션의 네이티브 스크롤 처리가 smooth 애니메이션을 취소하지 않도록 한 틱 뒤에 실행
    setTimeout(() => {
      const el = document.getElementById(secId);
      if (!el) return;
      const y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - 92);
      window.scrollTo({ top: y, behavior: "smooth" });
      // smooth 애니메이션이 취소·미완주되는 환경 대비: 도달 실패 시 즉시 이동
      setTimeout(() => {
        if (Math.abs(window.scrollY - y) > 40) window.scrollTo(0, y);
      }, 700);
    }, 30);
  }

  /* 목차 하이라이트: 스크롤 위치 기준 현재 섹션 (rAF 스로틀) */
  function initScrollSpy(bodyEl) {
    if (spyCleanup) spyCleanup();
    const heads = Array.from(bodyEl.querySelectorAll("h2, h3"));
    if (!heads.length) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      const line = 100; // 고정 헤더 + 여유
      let active = null;
      for (const h of heads) {
        if (h.getBoundingClientRect().top - line <= 0) active = h;
        else break;
      }
      const id = (active || heads[0]).id;
      const label = (active || heads[0]).textContent;
      document.querySelectorAll(".toc a").forEach((a) => a.classList.toggle("active", a.dataset.sec === id));
      const cur = document.getElementById("toc-current");
      if (cur) cur.textContent = active ? label : "목차";
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    spyCleanup = () => window.removeEventListener("scroll", onScroll);
  }

  function contactBox() {
    const inquiry = SITE.inquiryUrl
      ? `<a class="btn-primary" href="${SITE.inquiryUrl}" target="_blank" rel="noopener">${ICONS.chat} 1:1 문의하기</a>`
      : `<a class="btn-primary" href="mailto:${SITE.contactEmail}">${ICONS.mail} 문의하기</a>`;
    return `
      <div class="contact-box">
        <div>
          <div class="cb-title">더 궁금한 점이 있으신가요?</div>
          <div class="cb-sub">1:1 문의는 페이허그 로그인 후 이용하실 수 있어요. 이메일 문의도 언제든 환영이에요.</div>
        </div>
        <div class="cb-actions">
          ${inquiry}
          <a class="btn-link" href="mailto:${SITE.contactEmail}">${ICONS.mail} ${SITE.contactEmail}</a>
        </div>
      </div>`;
  }

  function renderFooter() {
    const f = document.getElementById("footer-info");
    const c = SITE.company;
    f.innerHTML = `
      <div class="f-brand">${esc(c.name)}</div>
      ${c.lines.map((l) => `<p>${esc(l)}</p>`).join("")}
      <div class="f-links">
        <a href="${SITE.homepage}" target="_blank" rel="noopener">페이허그 홈페이지</a>
        ${SITE.inquiryUrl ? `<a href="${SITE.inquiryUrl}" target="_blank" rel="noopener">1:1 문의</a>` : ""}
        <a href="mailto:${SITE.contactEmail}">이메일 문의</a>
      </div>
      <p style="margin-top:14px">© ${new Date().getFullYear()} ${esc(c.copyright)}. All rights reserved.</p>`;
  }

  /* ── 검색 ────────────────────────────── */

  const strip = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  function highlight(safeText, terms) {
    let out = safeText;
    terms.forEach((t) => {
      if (!t) return;
      const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      out = out.replace(re, (m) => `<em>${m}</em>`);
    });
    return out;
  }

  async function searchAll(q) {
    await loadAllBodies();
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return { terms, hits: [] };
    const hits = ARTICLES.map((a) => {
      const plain = strip(bodies[a.id] || "");
      const hay = (a.title + " " + a.desc + " " + plain).toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return null;
      const at = Math.max(0, plain.toLowerCase().indexOf(terms[0]));
      const excerpt = plain.slice(Math.max(0, at - 20), at + 80).trim();
      return { article: a, excerpt };
    }).filter(Boolean);
    return { terms, hits };
  }

  function resultsHtml(res) {
    const { terms, hits } = res;
    if (!hits.length)
      return `<div class="sr-empty">검색 결과가 없어요.<br/>다른 검색어로 다시 시도해 보세요.</div>`;
    return (
      `<div class="sr-count">${hits.length}개의 검색 결과</div>` +
      hits
        .map(
          (h) => `<a href="#/article/${h.article.id}" data-close-search>
            <div class="sr-title"><span class="sr-ic">${ICONS.doc}</span>${highlight(esc(h.article.title), terms)}</div>
            <div class="sr-cat">…${highlight(esc(h.excerpt), terms)}…</div>
          </a>`
        )
        .join("")
    );
  }

  /* 키보드 내비: ↑↓로 선택, Enter로 이동 */
  function bindKeyboardNav(input, resultsBox, onNavigate) {
    input.addEventListener("keydown", (e) => {
      const items = Array.from(resultsBox.querySelectorAll("a"));
      if (!items.length) return;
      const cur = resultsBox.querySelector("a.kbd-active");
      let idx = cur ? items.indexOf(cur) : -1;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        idx = e.key === "ArrowDown" ? Math.min(idx + 1, items.length - 1) : Math.max(idx - 1, 0);
        items.forEach((a) => a.classList.remove("kbd-active"));
        items[idx].classList.add("kbd-active");
        items[idx].scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        e.preventDefault();
        const target = cur || items[0];
        if (target) {
          location.hash = target.getAttribute("href");
          onNavigate();
        }
      }
    });
  }

  function initSearchModal() {
    const headerBtn = document.getElementById("header-search");
    const modal = document.getElementById("search-modal");
    if (!modal) return;
    const input = modal.querySelector("input");
    const results = modal.querySelector(".modal-results");
    let seq = 0;

    openSearch = () => {
      modal.classList.add("open");
      input.value = "";
      results.innerHTML = "";
      setTimeout(() => input.focus(), 50);
    };
    const close = () => modal.classList.remove("open");

    if (headerBtn) headerBtn.addEventListener("click", openSearch);
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.closest("[data-close-search]")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    input.addEventListener("input", async () => {
      const q = input.value.trim();
      if (!q) {
        results.innerHTML = "";
        return;
      }
      const mySeq = ++seq;
      const res = await searchAll(q);
      if (mySeq !== seq) return; // 오래된 응답 무시
      results.innerHTML = resultsHtml(res);
    });
    bindKeyboardNav(input, results, close);
  }

  /* 홈에서 히어로 검색창이 보이는 동안 헤더 검색 숨김 (원본 템플릿 동작) */
  function updateHeaderSearch() {
    const isHome = !location.hash.match(/^#\/(?:article|category)\//);
    document.body.classList.toggle("hide-header-search", isHome && window.scrollY < 220);
  }
  window.addEventListener("scroll", updateHeaderSearch, { passive: true });

  /* ── 라우터 ──────────────────────────── */

  function route() {
    const hash = location.hash || "#/";
    const m = hash.match(/^#\/(?:article|category)\/([a-z-]+)(?:\/([A-Za-z0-9-]+))?/);
    updateHeaderSearch();
    if (!m) return renderHome();
    return renderArticle(m[1], m[2] || null); // category 경로는 아티클로 수렴 (1:1 구조)
  }

  window.addEventListener("hashchange", route);
  renderFooter();
  initSearchModal();
  route();
  loadAllBodies(); // 검색 대비 선로딩 (백그라운드)
})();
