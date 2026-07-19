/* PayHug 고객센터 — 해시 라우터 + 렌더러 + 검색
 * 구조: 홈(추천 + 전체 카테고리) / 아티클(사이드 내비 + 본문 + TOC)
 * 본문은 content/<id>.html 을 fetch로 로드 (GitHub Pages 정적 서빙)
 */
(function () {
  const app = document.getElementById("app");
  const bodies = {}; // id → HTML 문자열 캐시

  const byId = (id) => ARTICLES.find((a) => a.id === id);

  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));

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
    document.title = "페이허그 고객센터";
    const pinned = ARTICLES.filter((a) => a.pinned);
    app.innerHTML = `
      <section class="hero">
        <div class="wrap">
          <h1>무엇을 도와드릴까요?</h1>
          <p>${esc(SITE.tagline)}</p>
          <div class="searchbox">
            <input id="search-input" type="search" placeholder="아티클 제목, 내용 검색" autocomplete="off" />
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            <div class="search-results" id="search-results"></div>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="wrap">
          <div class="section-label">추천</div>
          <div class="cat-grid">${pinned.map(card).join("")}</div>
          <div class="section-label" style="margin-top:44px">전체 카테고리</div>
          <div class="cat-grid">${ARTICLES.map(card).join("")}</div>
        </div>
      </section>`;
    initInlineSearch();
  }

  function card(a) {
    return `
      <a class="cat-card" href="#/article/${a.id}">
        <div class="cat-emoji">${a.emoji}</div>
        <h3>${esc(a.title)}</h3>
        <p>${esc(a.desc)}</p>
      </a>`;
  }

  /* ── 아티클 ───────────────────────────── */

  async function renderArticle(artId) {
    const art = byId(artId);
    if (!art) return renderHome();
    document.title = `${art.title} — 페이허그 고객센터`;

    app.innerHTML = `
      <div class="wrap article-layout">
        <aside class="side-nav">
          <div class="sn-label">전체 아티클</div>
          ${ARTICLES.map(
            (a) =>
              `<a href="#/article/${a.id}" class="${a.id === artId ? "active" : ""}">${a.emoji} ${esc(a.title)}</a>`
          ).join("")}
        </aside>
        <article class="article-main">
          <span class="topic-chip">🏷️ 고객센터</span>
          <h1 class="page-title">${art.emoji} ${esc(art.title)}</h1>
          <div class="article-meta">
            <span>페이허그 고객센터</span><span>·</span><span>최종 수정: ${esc(art.updated)}</span>
          </div>
          <div class="toc-mobile" id="toc-mobile"></div>
          <div class="article-body" id="article-body"><p class="loading">불러오는 중…</p></div>
          ${contactBox()}
        </article>
        <aside class="toc" id="toc"></aside>
      </div>`;
    window.scrollTo(0, 0);

    const html = await loadBody(artId);
    const bodyEl = document.getElementById("article-body");
    if (!bodyEl) return; // 로딩 중 다른 페이지로 이동한 경우
    bodyEl.innerHTML = html;
    buildToc(bodyEl);
  }

  function buildToc(bodyEl) {
    const heads = bodyEl.querySelectorAll("h2, h3");
    if (!heads.length) return;
    let items = "";
    heads.forEach((h, i) => {
      if (!h.id) h.id = "sec-" + i;
      items += `<a data-target="${h.id}" class="toc-${h.tagName.toLowerCase()}">${esc(h.textContent)}</a>`;
    });
    const toc = document.getElementById("toc");
    const tocMobile = document.getElementById("toc-mobile");
    if (toc) toc.innerHTML = `<div class="toc-label">목차</div>${items}`;
    if (tocMobile)
      tocMobile.innerHTML = `<details><summary>목차</summary><div class="toc-mobile-list">${items}</div></details>`;
    document.querySelectorAll("[data-target]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const el = document.getElementById(a.dataset.target);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 78;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      });
    });
  }

  function contactBox() {
    return `
      <div class="contact-box">
        <div>
          <div class="cb-title">더 궁금한 점이 있으신가요?</div>
          <div class="cb-sub">찾는 내용이 없다면 페이허그 팀에 1:1로 문의해 주세요.</div>
        </div>
        <a class="btn-primary" href="mailto:${SITE.contactEmail}">문의하기</a>
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
        <a href="mailto:${SITE.contactEmail}">이메일 문의</a>
      </div>
      <p style="margin-top:14px">© ${new Date().getFullYear()} ${esc(c.copyright)}. All rights reserved.</p>`;
  }

  /* ── 검색 (공통 로직) ─────────────────── */

  const strip = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  async function searchAll(q) {
    await loadAllBodies();
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return ARTICLES.map((a) => {
      const hay = (a.title + " " + a.desc + " " + strip(bodies[a.id] || "")).toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return null;
      // 첫 매칭 위치 주변 발췌
      const idx = hay.indexOf(terms[0]);
      const plain = strip(bodies[a.id] || "");
      const at = Math.max(0, plain.toLowerCase().indexOf(terms[0]));
      const excerpt = plain.slice(Math.max(0, at - 20), at + 70).trim();
      return { article: a, excerpt };
    }).filter(Boolean);
  }

  function resultsHtml(hits) {
    return hits.length
      ? hits
          .map(
            (h) => `<a href="#/article/${h.article.id}" data-close-search>
              <div class="sr-title">${h.article.emoji} ${esc(h.article.title)}</div>
              <div class="sr-cat">…${esc(h.excerpt)}…</div>
            </a>`
          )
          .join("")
      : `<div class="sr-empty">검색 결과가 없어요. 다른 검색어로 다시 시도해 보세요.</div>`;
  }

  function initInlineSearch() {
    const input = document.getElementById("search-input");
    const box = document.getElementById("search-results");
    if (!input) return;
    let seq = 0;
    input.addEventListener("input", async () => {
      const q = input.value.trim();
      if (!q) {
        box.classList.remove("open");
        box.innerHTML = "";
        return;
      }
      const mySeq = ++seq;
      const hits = await searchAll(q);
      if (mySeq !== seq) return; // 오래된 응답 무시
      box.innerHTML = resultsHtml(hits);
      box.classList.add("open");
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".searchbox")) box.classList.remove("open");
    });
  }

  /* ── 헤더 검색 모달 ───────────────────── */

  function initSearchModal() {
    const openBtn = document.getElementById("header-search");
    const modal = document.getElementById("search-modal");
    if (!openBtn || !modal) return;
    const input = modal.querySelector("input");
    const results = modal.querySelector(".modal-results");
    let seq = 0;

    const open = () => {
      modal.classList.add("open");
      input.value = "";
      results.innerHTML = "";
      setTimeout(() => input.focus(), 50);
    };
    const close = () => modal.classList.remove("open");

    openBtn.addEventListener("click", open);
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
      const hits = await searchAll(q);
      if (mySeq !== seq) return;
      results.innerHTML = resultsHtml(hits);
    });
  }

  /* ── 라우터 ──────────────────────────── */

  function route() {
    const hash = location.hash || "#/";
    const m = hash.match(/^#\/(article|category)\/([a-z-]+)/);
    if (!m) return renderHome();
    return renderArticle(m[2]); // category 경로는 아티클로 수렴 (1:1 구조)
  }

  window.addEventListener("hashchange", route);
  renderFooter();
  initSearchModal();
  route();
  loadAllBodies(); // 검색 대비 선로딩 (백그라운드)
})();
