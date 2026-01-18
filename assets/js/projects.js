// assets/js/projects.js
(() => {
    const cards = Array.from(document.querySelectorAll(".project-card"));
    const chips = Array.from(document.querySelectorAll(".chip[data-tag]"));
    const searchInput = document.getElementById("projectSearch");
    const clearBtn = document.getElementById("clearFilters");
    const statusEl = document.getElementById("filterStatus");

    if (!cards.length) return; // nothing to do

    // --- helpers ---
    const norm = (s) => (s || "").toString().trim().toLowerCase();
    const splitTags = (s) => norm(s).split(",").map(t => norm(t)).filter(Boolean);

    const params = new URLSearchParams(window.location.search);
    let activeTag = norm(params.get("tag"));
    let query = norm(params.get("q"));

    function setChipUI() {
        chips.forEach(ch => {
            const t = norm(ch.getAttribute("data-tag"));
            ch.classList.toggle("is-active", !!activeTag && t === activeTag);
        });
    }

    function matches(card) {
        const tagList = splitTags(card.getAttribute("data-tags"));
        const text = norm(card.innerText);

        const tagOk = !activeTag || tagList.includes(activeTag);
        const qOk = !query || text.includes(query);

        return tagOk && qOk;
    }

    function applyFilters({ pushUrl = true } = {}) {
        let visible = 0;

        cards.forEach(card => {
            const show = matches(card);
            card.style.display = show ? "" : "none";
            if (show) visible += 1;
        });

        setChipUI();

        // update status line (optional)
        if (statusEl) {
            const parts = [];
            if (activeTag) parts.push(`Tag: ${activeTag}`);
            if (query) parts.push(`Search: "${query}"`);
            statusEl.textContent = parts.length
                ? `${visible} project(s) shown · ${parts.join(" · ")}`
                : `${visible} project(s) shown`;
        }

        // persist in URL (shareable)
        if (pushUrl) {
            const next = new URLSearchParams(window.location.search);
            if (activeTag) next.set("tag", activeTag); else next.delete("tag");
            if (query) next.set("q", query); else next.delete("q");

            const newUrl = `${window.location.pathname}${next.toString() ? `?${next}` : ""}${window.location.hash || ""}`;
            window.history.replaceState({}, "", newUrl);
        }
    }

    function clearFilters() {
        activeTag = "";
        query = "";
        if (searchInput) searchInput.value = "";
        applyFilters();
    }

    // --- wire up chips ---
    chips.forEach(chip => {
        chip.style.cursor = "pointer";
        chip.addEventListener("click", () => {
            const t = norm(chip.getAttribute("data-tag"));
            activeTag = (activeTag === t) ? "" : t; // toggle
            applyFilters();
        });
    });

    // --- search (debounced) ---
    let tmr = null;
    if (searchInput) {
        // initialize from URL
        if (query) searchInput.value = query;

        searchInput.addEventListener("input", () => {
            window.clearTimeout(tmr);
            tmr = window.setTimeout(() => {
                query = norm(searchInput.value);
                applyFilters();
            }, 120);
        });
    }

    // --- clear button ---
    if (clearBtn) {
        clearBtn.addEventListener("click", clearFilters);
    }

    // --- smooth scroll for "Details →" anchors ---
    document.addEventListener("click", (e) => {
        const a = e.target.closest("a.anchor-link");
        if (!a) return;

        const href = a.getAttribute("href") || "";
        if (!href.startsWith("#")) return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });

        // keep hash in URL without jumping
        window.history.replaceState({}, "", `${window.location.pathname}${window.location.search}${href}`);
    });

    // --- init ---
    setChipUI();
    applyFilters({ pushUrl: false });
})();
