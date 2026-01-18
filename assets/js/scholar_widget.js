(() => {
    const DATA_URL = "assets/data/scholar_metrics.json";

    const elUpdated = document.getElementById("scholar-updated");
    const elSinceCol = document.getElementById("since-year-col");

    const elAllC = document.getElementById("m-all-citations");
    const elAllH = document.getElementById("m-all-h");
    const elAllI = document.getElementById("m-all-i10");

    const elSinceC = document.getElementById("m-since-citations");
    const elSinceH = document.getElementById("m-since-h");
    const elSinceI = document.getElementById("m-since-i10");

    const tabAll = document.getElementById("tab-all");
    const tabSince = document.getElementById("tab-since");

    const chartHost = document.getElementById("scholar-chart");

    function fmtInt(x) {
        return new Intl.NumberFormat("en-US").format(Number(x));
    }

    function niceTickStep(maxVal) {
        const steps = [10, 20, 25, 50, 100, 200];
        for (const s of steps) {
            if (Math.ceil(maxVal / s) <= 5) return s;
        }
        return 200;
    }

    function renderChart(citationsPerYear) {
        const years = Object.keys(citationsPerYear)
            .map(y => Number(y))
            .sort((a, b) => a - b);

        const values = years.map(y => Number(citationsPerYear[String(y)]));

        const maxVal = Math.max(...values, 0);
        const step = niceTickStep(maxVal);
        const yMax = Math.ceil(maxVal / step) * step;

        const W = 330;
        const H = 220;
        const pad = { top: 10, right: 34, bottom: 36, left: 8 };
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top - pad.bottom;

        const barCount = years.length;
        const gap = 10;
        const barW = Math.max(10, Math.floor((plotW - gap * (barCount - 1)) / barCount));

        const y = (v) => pad.top + (plotH * (1 - (v / yMax)));

        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.setAttribute("width", String(W));
        svg.setAttribute("height", String(H));
        svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", "Citations per year");

        // Bars + x labels
        years.forEach((yr, i) => {
            const v = values[i];
            const x0 = pad.left + i * (barW + gap);
            const y0 = y(v);
            const h0 = pad.top + plotH - y0;

            const rect = document.createElementNS(ns, "rect");
            rect.setAttribute("x", String(x0));
            rect.setAttribute("y", String(y0));
            rect.setAttribute("width", String(barW));
            rect.setAttribute("height", String(h0));
            rect.setAttribute("rx", "2");
            rect.setAttribute("fill", "#6b7280");

            const title = document.createElementNS(ns, "title");
            title.textContent = `${yr}: ${v}`;
            rect.appendChild(title);

            svg.appendChild(rect);

            const t = document.createElementNS(ns, "text");
            t.setAttribute("x", String(x0 + barW / 2));
            t.setAttribute("y", String(pad.top + plotH + 22));
            t.setAttribute("text-anchor", "middle");
            t.setAttribute("font-size", "11");
            t.setAttribute("fill", "#6b7280");
            t.textContent = String(yr);
            svg.appendChild(t);
        });

        // Y-axis ticks on the right
        for (let tick = 0; tick <= yMax; tick += step) {
            const yy = y(tick);

            const label = document.createElementNS(ns, "text");
            label.setAttribute("x", String(W - 2));
            label.setAttribute("y", String(yy + 4));
            label.setAttribute("text-anchor", "end");
            label.setAttribute("font-size", "11");
            label.setAttribute("fill", "#6b7280");
            label.textContent = String(tick);
            svg.appendChild(label);
        }

        chartHost.innerHTML = "";
        chartHost.appendChild(svg);
    }

    function setActiveTab(which) {
        const allActive = which === "all";
        tabAll.classList.toggle("active", allActive);
        tabSince.classList.toggle("active", !allActive);
        tabAll.setAttribute("aria-selected", allActive ? "true" : "false");
        tabSince.setAttribute("aria-selected", !allActive ? "true" : "false");
    }

    function validateData(data) {
        if (!data) throw new Error("No data loaded.");
        if (!data.all || !data.since) throw new Error("Missing 'all' or 'since' metrics.");
        if (!data.citations_per_year) throw new Error("Missing 'citations_per_year'.");
        return data;
    }

    function loadInlineData() {
        const el = document.getElementById("scholar-data");
        if (!el) return null;
        const txt = el.textContent.trim();
        if (!txt) return null;
        return JSON.parse(txt);
    }

    async function loadData() {
        // 1) Prefer inline JSON (works even with file://)
        const inline = loadInlineData();
        if (inline) return validateData(inline);

        // 2) Fallback to fetch JSON file
        const res = await fetch(DATA_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load ${DATA_URL}: HTTP ${res.status}`);
        const data = await res.json();
        return validateData(data);
    }

    async function init() {
        const data = await loadData();

        if (elUpdated && data.updated) elUpdated.textContent = `Updated: ${data.updated}`;
        if (elSinceCol && data.since_year) elSinceCol.textContent = `Since ${data.since_year}`;

        elAllC.textContent = fmtInt(data.all.citations);
        elAllH.textContent = fmtInt(data.all.h_index);
        elAllI.textContent = fmtInt(data.all.i10_index);

        elSinceC.textContent = fmtInt(data.since.citations);
        elSinceH.textContent = fmtInt(data.since.h_index);
        elSinceI.textContent = fmtInt(data.since.i10_index);

        renderChart(data.citations_per_year);

        tabAll.addEventListener("click", () => setActiveTab("all"));
        tabSince.addEventListener("click", () => setActiveTab("since"));
        setActiveTab("all");
    }

    init().catch((err) => {
        console.error(err);
        if (chartHost) chartHost.textContent = "Scholar widget failed to load.";
        if (elUpdated) elUpdated.textContent = "Data unavailable";
    });
})();
