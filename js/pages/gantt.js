/* ─────────────────────────────────────────────
   GANTT — page-specific scripts
   Consolidated Oct 2026 from inline <script> blocks.
   (Blocks concatenated in original document order.)
   ───────────────────────────────────────────── */

/* ── Block 1 ── */
const barScale = 0.75;
    const orgScale = 1.0;
    const experiences = [
      { role: "'24", start: "November 2024", end: "November 2024", org: "Ignite", isLeft: true, url: "portfolio.html?section=ignite" },
      { role: "'25", isLeft: true, alignTo: 2, alignToPercent: 0, alignToOffsetX: 0.03, widthPx: 1, row: 0, offsetY: 0, z: 30, noBar: false, colorBar: false, url: "portfolio.html?section=ignite25" },
      { role: "Aerodynamics Engineer", start: "September 2025", end: "Present", org: "TAMU VFD", isLeft: true, row: 1, url: "portfolio.html?section=vfd" },
      { role: "Fluid Systems Engineer", start: "February 2025", end: "January 2026", org: "TAMU RED", isLeft: true, row: 2, url: "portfolio.html?section=red" },
      { role: "Lunar Search & Rescue Team Lead", start: "October 2024", end: "November 2024", org: "TAMU SEDS", isLeft: true, row: 3, url: "portfolio.html?section=lsar" },
      { role: "Cabinet Member", start: "March 2021", end: "June 2024", org: "➦", isLeft: false, row: 4, url: "portfolio.html?section=cabinet" },
      { role: "Co-Founder and Captain", start: "March 2022", end: "June 2024", org: "DVHS Robotics", isLeft: false, row: 5, url: "portfolio.html?section=team-5776k" },
      { role: "Paid Summer Camp Mentor", start: "July 2021", end: "July 2023", org: "➥", isLeft: false, row: 6, url: "portfolio.html?section=cabinet" },
      { role: "", isLeft: false, alignTo: 0, alignToPercent: 0, alignToOffsetX: -0.555, widthPx: 140, row: 6, offsetY: 0, z: 30, noBar: false, colorBar: true, color: "#000",  url: "portfolio.html?section=cabinet" }
    ];
    const root = document.documentElement;
    function getChartWidth() {
      const width = parseFloat(getComputedStyle(root).getPropertyValue('--width-gap'));
      return Number.isFinite(width) && width > 0 ? width : 920;
    }
    const chart = { left: 0, right: 0, top: 0, bottom: 300, vertical_step: 35 * barScale, bar_height: 18 * barScale };
    const orgBuffer = 12;
    const yr = new Date();
    const chart_year_start = 2021;
    const chart_year_end = yr.getFullYear();
    function dateToX(dateStr) {
      let months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
      if (dateStr.toLowerCase() === "present") { const today = new Date(); let y = today.getFullYear(); let m = today.getMonth(); let yearFrac = y - chart_year_start + m / 12; return chart.left + (yearFrac / (chart_year_end - chart_year_start + 1)) * chart.width; }
      let parts = dateStr.replace(",", "").split(" "); let month = months[parts[0].slice(0, 3)] || 0; let year = parseInt(parts[1]); let yearFrac = year - chart_year_start + month / 12; return chart.left + (yearFrac / (chart_year_end - chart_year_start + 1)) * chart.width;
    }
    function renderGantt() {
      const chartWidth = getChartWidth();
      chart.width = chartWidth;
      chart.right = chartWidth;
      let orgHtml = "";
      experiences.forEach(function (exp) { if (exp.org) { let lbl = `<div class="org-label" style="font-size:${16 * barScale * orgScale}px;height:${chart.bar_height}px;line-height:${chart.bar_height}px;">${exp.org}</div>`; orgHtml += exp.url ? `<a class="gantt-link" data-url="${exp.url}" href="#">${lbl}</a>` : lbl; } });
      document.getElementById("orgcol").innerHTML = orgHtml;
      let yearsHtml = ""; let nYears = chart_year_end - chart_year_start + 1;
      for (let y = chart_year_start; y <= chart_year_end; y++) { yearsHtml += `<div class="year-label" style="width:${(chart.width / nYears)}px;font-size:${16 * barScale}px;">${y}</div>`; }
      document.getElementById("years").innerHTML = yearsHtml;
      let ganttHtml = "";
      for (let y = 1; y < nYears; y++) { let x = ((chart.width / nYears) * y); ganttHtml += `<div class="year-vert" style="left:${x}px;height:100%;"></div>`; }
      experiences.forEach(function (exp, idx) {
        let baseRow = (typeof exp.row === 'number') ? exp.row : idx;
        let top = (typeof exp.topPx === 'number') ? exp.topPx : (baseRow * chart.vertical_step);
        if (typeof exp.offsetY === 'number') top += exp.offsetY;
        let left, right, barWidth;
        if (typeof exp.alignTo === 'number' && experiences[exp.alignTo]) { let ref = experiences[exp.alignTo]; let refLeft = dateToX(ref.start); let refRight = dateToX(ref.end === 'Present' ? 'Present' : ref.end); let refWidth = refRight - refLeft; let pct = (typeof exp.alignToPercent === 'number') ? exp.alignToPercent : 0.5; let anchorX = refLeft + refWidth * pct; if (typeof exp.alignToOffsetX === 'number') { const frac = exp.alignToOffsetX; anchorX += frac * chart.width; } if (typeof exp.widthPx === 'number') { barWidth = exp.widthPx; left = anchorX; } else { barWidth = 120; left = anchorX - barWidth * 0.5; } right = left + barWidth; }
        else if (exp.start && exp.end) { left = dateToX(exp.start); right = dateToX(exp.end === 'Present' ? 'Present' : exp.end); barWidth = right - left; }
        else { left = 0; barWidth = (typeof exp.widthPx === 'number') ? exp.widthPx : 120; right = left + barWidth; }
        let bgColor = exp.colorBar === true ? 'var(--accent)' : 'var(--g)'; if (typeof exp.color === 'string') bgColor = exp.color;
        let z = (typeof exp.z === 'number') ? exp.z : 2;
        let placeRight = (exp.isLeft === false);
        let roleHtml = '';
        if (exp.role) { if (placeRight) { let labelLeftPos = right + orgBuffer; roleHtml = `<div class="gantt-bar-label" style="top:${top}px;left:${labelLeftPos}px;height:${chart.bar_height}px;font-size:${15 * barScale}px;line-height:${chart.bar_height}px;text-align:left;padding-left:4px;white-space:nowrap;overflow:visible;">${exp.role}</div>`; } else { roleHtml = `<div class="gantt-bar-label" style="top:${top}px;left:${left - orgBuffer}px;height:${chart.bar_height}px;font-size:${15 * barScale}px;line-height:${chart.bar_height}px;text-align:right;padding-right:4px;white-space:nowrap;overflow:visible;transform:translateX(-100%);">${exp.role}</div>`; } }
        let barHtml = ''; if (!exp.noBar) { let extraClass = exp.colorBar ? ' alt-color' : ''; barHtml = `<div class="gantt-bar${extraClass}" style="top:${top}px;left:${left}px;width:${barWidth}px;height:${chart.bar_height}px;z-index:${z};background:${bgColor};"></div>`; }
        if (roleHtml || barHtml) { if (exp.url) { ganttHtml += `<a class="gantt-link" data-url="${exp.url}" href="#">${roleHtml}${barHtml}</a>`; } else { ganttHtml += roleHtml + barHtml; } }
      });
      let today_x = dateToX("Present");
      ganttHtml += `<div class="timeline-marker" style="left:${today_x}px;height:${chart.bottom}px"><div class="timeline-marker-label">present</div></div>`;
      document.getElementById("gantt").innerHTML = ganttHtml;
      setTimeout(function () { document.querySelectorAll('.gantt-link').forEach(function (link) { link.addEventListener('click', function (e) { e.preventDefault(); var u = link.getAttribute('data-url'); if (u) { window.parent.postMessage({ type: 'navigate', url: u }, '*'); } }); }); }, 150);
    }
    window.addEventListener('resize', renderGantt);
    renderGantt();
