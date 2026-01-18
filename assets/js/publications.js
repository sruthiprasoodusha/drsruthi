(() => {
    // =======================
    // CONFIG
    // =======================
    // Put publications.json here:
    //   assets/data/publications.json
    const JSON_URL = "assets/data/publications.json";

    // Common forms of your name as they appear in author strings.
    const NAME_VARIANTS = [
        "Usha, Sruthi Prasood",
        "Sruthi Prasood Usha",
        "Sruthi Prasood",
        "S. Prasood",
        "S. P. Usha",
        "Prasood Usha, Sruthi",
    ];

    // Normalize many upstream types into our site filters
    function normalizeType(t) {
        const x = (t || "").toString().toLowerCase();

        if (x.includes("journal") || x === "article" || x === "journal-article") return "journal";
        if (x.includes("conference") || x.includes("proceed") || x === "inproceedings" || x === "proceedings-article")
            return "conference";
        if (x.includes("preprint") || x.includes("unpublished") || x.includes("techreport") || x.includes("report"))
            return "preprint";
        if (x.includes("patent")) return "patent";
        if (x.includes("thesis") || x.includes("dissertation") || x.includes("phd")) return "thesis";
        return "other";
    }

    // =======================
    // DOM
    // =======================
    const listEl = document.getElementById("pub-list");

    const searchEl = document.getElementById("pub-search");
    const selectedOnlyEl = document.getElementById("selected-only");
    const sortEl = document.getElementById("pub-sort");
    const filterButtons = Array.from(document.querySelectorAll(".chip[data-filter]"));

    // =======================
    // STATE
    // =======================
    let allEntries = [];
    const state = {
        q: "",
        filter: "all",
        selectedOnly: false,
        sort: "year_desc",
    };

    // =======================
    // HELPERS
    // =======================
    const norm = (s) => (s || "").toString().replace(/\s+/g, " ").trim();
    const lower = (s) => norm(s).toLowerCase();

    function escapeHtml(s) {
        return (s ?? "")
            .toString()
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function formatAuthors(raw) {
        const a = norm(raw);
        if (!a) return "";
        let out = escapeHtml(a);

        for (const v of NAME_VARIANTS) {
            if (!v) continue;
            const re = new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig");
            out = out.replace(re, (m) => `<strong>${escapeHtml(m)}</strong>`);
        }
        return out;
    }

    function makeSearchHaystack(e) {
        const tags = Array.isArray(e.tags) ? e.tags.join(" ") : "";
        const venue = e.journal || e.venue || "";
        return lower([e.title, e.authors, venue, e.year, tags, e.note, e.doi].filter(Boolean).join(" "));
    }

    function sortEntries(arr, mode) {
        const copy = [...arr];

        if (mode === "year_asc") {
            copy.sort((a, b) => (a.yearNum - b.yearNum) || a.title.localeCompare(b.title));
            return copy;
        }
        if (mode === "title_asc") {
            copy.sort((a, b) => a.title.localeCompare(b.title) || (b.yearNum - a.yearNum));
            return copy;
        }
        if (mode === "title_desc") {
            copy.sort((a, b) => b.title.localeCompare(a.title) || (b.yearNum - a.yearNum));
            return copy;
        }
        // default year_desc
        copy.sort((a, b) => (b.yearNum - a.yearNum) || a.title.localeCompare(b.title));
        return copy;
    }

    function linkPills(e) {
        const links = e.links || {};
        const pills = [];

        if (links.pdf) pills.push({ label: "PDF", href: links.pdf });

        const doiValue = norm(links.doi || e.doi);
        if (doiValue) {
            const href = doiValue.startsWith("http") ? doiValue : `https://doi.org/${doiValue}`;
            pills.push({ label: "DOI", href });
        }

        if (links.code) pills.push({ label: "Code", href: links.code });
        if (links.slides) pills.push({ label: "Slides", href: links.slides });

        const urlValue = norm(links.url || e.url);
        if (urlValue && !doiValue) pills.push({ label: "Link", href: urlValue });

        if (e.bibtex) pills.push({ label: "BibTeX", bib: true, key: e.id });

        return pills;
    }

    // =======================
    // RENDER
    // =======================
    function render(entries) {
        if (!listEl) return;

        // Group by year
        const byYear = new Map();
        for (const e of entries) {
            const y = e.yearNum ? String(e.yearNum) : "Unknown";
            if (!byYear.has(y)) byYear.set(y, []);
            byYear.get(y).push(e);
        }

        // Year order: desc; Unknown last
        const years = Array.from(byYear.keys()).sort((a, b) => {
            if (a === "Unknown") return 1;
            if (b === "Unknown") return -1;
            return Number(b) - Number(a);
        });

        const html = years
            .map((y) => {
                const items = byYear.get(y);

                const itemsHtml = items
                    .map((e) => {
                        const authorsHtml = formatAuthors(e.authors);
                        const venueTxt = escapeHtml(e.journal || e.venue || "");
                        const typeLabel = e.pubType[0].toUpperCase() + e.pubType.slice(1);

                        const pillsHtml = linkPills(e)
                            .map((p) => {
                                if (p.bib) {
                                    return `<button class="pill pill-btn" data-bib="${escapeHtml(
                                        p.key
                                    )}" type="button">BibTeX</button>`;
                                }
                                return `<a class="pill" href="${escapeHtml(p.href)}" target="_blank" rel="noopener">${escapeHtml(
                                    p.label
                                )}</a>`;
                            })
                            .join("");

                        return `
          <article class="pub-item" data-key="${escapeHtml(e.id)}">
            <div class="pub-main">
              <div class="pub-title">${escapeHtml(e.title || "(Untitled)")}</div>
              <div class="pub-meta">
                ${authorsHtml ? `<span class="pub-authors">${authorsHtml}</span>` : ""}
                ${venueTxt ? ` · <span class="pub-venue">${venueTxt}</span>` : ""}
                ${e.yearNum ? ` · <span class="pub-year">${e.yearNum}</span>` : ""}
                <span class="pub-type"> · ${escapeHtml(typeLabel)}</span>
                ${e.selected ? ` · <span class="pub-badge">Selected</span>` : ""}
              </div>
            </div>
            <div class="pub-links">${pillsHtml}</div>

            ${e.bibtex
                                ? `<pre class="bibtex-block" id="bib-${escapeHtml(e.id)}" hidden>${escapeHtml(e.bibtex)}</pre>`
                                : ""
                            }
          </article>
        `;
                    })
                    .join("");

                return `
        <div class="year-group">
          <h2>${escapeHtml(y)}</h2>
          ${itemsHtml}
        </div>
      `;
            })
            .join("");

        listEl.innerHTML = html;

        // BibTeX toggles
        Array.from(listEl.querySelectorAll(".pill-btn[data-bib]")).forEach((btn) => {
            btn.addEventListener("click", () => {
                const key = btn.getAttribute("data-bib");
                const pre = document.getElementById(`bib-${key}`);
                if (!pre) return;

                if (pre.hasAttribute("hidden")) pre.removeAttribute("hidden");
                else pre.setAttribute("hidden", "");
            });
        });
    }

    function apply() {
        const q = lower(state.q);

        let filtered = allEntries;

        if (state.filter !== "all") {
            filtered = filtered.filter((e) => e.pubType === state.filter);
        }

        if (state.selectedOnly) {
            filtered = filtered.filter((e) => e.selected);
        }

        if (q) {
            filtered = filtered.filter((e) => e.searchHaystack.includes(q));
        }

        filtered = sortEntries(filtered, state.sort);
        render(filtered);
    }

    function setActiveFilter(filter) {
        state.filter = filter;
        filterButtons.forEach((b) => {
            b.classList.toggle("active", b.getAttribute("data-filter") === filter);
        });
        apply();
    }

    // =======================
    // LOAD JSON
    // =======================
    async function loadPublications() {
        const res = await fetch(JSON_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load ${JSON_URL} (HTTP ${res.status})`);
        return await res.json();
    }

    // =======================
    // INIT
    // =======================
    async function init() {
        if (!listEl) return;

        let data;
        try {
            data = await loadPublications();
        } catch (err) {
            console.error(err);
            listEl.innerHTML =
                "<p style='color:#b91c1c'>Publications could not be loaded. Please ensure Live Server is running and publications.json exists at <code>assets/data/publications.json</code>.</p>";
            return;
        }

        // Support both formats:
        //  1) publications.json is an array of entries
        //  2) publications.json is an object with an `items` array (recommended)
        const rows = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);

        allEntries = rows.map((e) => {
            const yearNumRaw = e.year ?? e.yearNum;
            const yearNum = Number.isFinite(Number(yearNumRaw)) ? Number(yearNumRaw) : null;

            const id = e.id || e.bibtex_key || e.key || e.slug || norm(e.title);
            const pubType = normalizeType(e.type || e.pubType);

            const out = {
                ...e,
                id,
                title: norm(e.title),
                authors: norm(e.authors || e.author || ""),
                journal: norm(e.journal || ""),
                venue: norm(e.venue || ""),
                doi: norm(e.doi || ""),
                url: norm(e.url || ""),
                links: e.links || {},
                tags: Array.isArray(e.tags) ? e.tags : [],
                note: norm(e.note || ""),
                selected: Boolean(e.selected),
                pubType,
                yearNum,
            };

            out.searchHaystack = makeSearchHaystack(out);
            return out;
        });

        // Hook UI
        searchEl?.addEventListener("input", () => {
            state.q = searchEl.value;
            apply();
        });

        selectedOnlyEl?.addEventListener("change", () => {
            state.selectedOnly = selectedOnlyEl.checked;
            apply();
        });

        sortEl?.addEventListener("change", () => {
            state.sort = sortEl.value;
            apply();
        });

        filterButtons.forEach((b) => {
            b.addEventListener("click", () => setActiveFilter(b.getAttribute("data-filter")));
        });

        // Default render
        setActiveFilter("all");
    }

    init();
})();