"use strict";

/* ════════════════════════════════════════════════════════════
   TIMELINE RAIL  ·  timeline.js
   Handles: dot building, active/past state tracking, chip
   stacking, card fade-in, URL deep-linking
   ════════════════════════════════════════════════════════════ */

/* ── Entry registry (chronological order) ── */
const TL_ENTRIES = [
	{id: "entry-scouts", label: "Boy Scouts", year: "2017–22", cat: "experience"},
	{id: "entry-cabinet", label: "Cabinet", year: "2021–24", cat: "design-team"},
	{id: "entry-5776k", label: "Team 5776K", year: "2022–24", cat: "design-team"},
	{id: "entry-lsar", label: "LSAR", year: "Fl '24", cat: "design-team"},
	{id: "entry-ignite24", label: "Ignite '24", year: "Dec '24", cat: "event"},
	{id: "entry-aeroinfo", label: "Aero Infographics", year: "Mar '25", cat: "project"},
	{id: "entry-red", label: "Rocket Engine", year: "02/'25", cat: "design-team"},
	{id: "entry-invent", label: "Aggies Invent", year: "Mar '25", cat: "event"},
	{id: "entry-everyday", label: "Everyday Engr.", year: "Su '25", cat: "project"},
	{id: "entry-737cad", label: "737-800 CAD", year: "—", cat: "experience"},
	{id: "entry-vfd", label: "VFD", year: "09/'25–", cat: "design-team"},
	{id: "entry-f1brake", label: "F1 Brake Pedal", year: "Fl '25", cat: "experience"},
	{id: "entry-ignite25", label: "Ignite '25", year: "Nov '25", cat: "event"},
];

/* Category → CSS color token */
const CAT_COLOR = {
	"design-team": "var(--g)",
	event: "var(--accent)",
	project: "var(--gl)",
	experience: "var(--tdim)",
};

/* URL ?section= key → entry id */
const SECTION_MAP = {
	vfd: "entry-vfd",
	red: "entry-red",
	lsar: "entry-lsar",
	"team-5776k": "entry-5776k",
	cabinet: "entry-cabinet",
	ignite25: "entry-ignite25",
	invent: "entry-invent",
	ignite: "entry-ignite24",
	"everyday-engineering": "entry-everyday",
	"aerodynamics-infographics": "entry-aeroinfo",
	"boy-scouts": "entry-scouts",
	"737-800-cad": "entry-737cad",
	"formula-sae": "entry-f1brake",
};

/* ── State ── */
let activeIdx = -1;

/* ─────────────────────────────────────────────
   BUILD RAIL DOTS
   ───────────────────────────────────────────── */
function buildRail() {
	const container = document.getElementById("tl-dots");
	if (!container) return;
	container.innerHTML = "";

	TL_ENTRIES.forEach(({id, label, year, cat}) => {
		const a = document.createElement("a");
		a.className = `tl-dot cat-${cat}`;
		a.dataset.entry = id;
		a.href = "javascript:void(0)";
		a.setAttribute("aria-label", `${label} (${year})`);
		a.innerHTML = `
			<span class="tl-dot-marker"></span>
			<div class="tl-dot-info">
				<span class="tl-dot-name">${label}</span>
				<span class="tl-dot-year">${year}</span>
			</div>`;
		a.addEventListener("click", () => scrollToEntry(id));
		container.appendChild(a);
	});
}

/* ─────────────────────────────────────────────
   SCROLL TO ENTRY  (also closes mobile sidebar)
   ───────────────────────────────────────────── */
function scrollToEntry(id) {
	const el = document.getElementById(id);
	if (el) el.scrollIntoView({behavior: "smooth", block: "start"});

	const sb = document.getElementById("sb");
	const ov = document.getElementById("sb-overlay");
	if (sb && sb.classList.contains("sb-open")) {
		sb.classList.remove("sb-open");
		if (ov) ov.classList.remove("show");
		document.body.style.overflow = "";
	}
}

/* ─────────────────────────────────────────────
   COMPUTE ACTIVE ENTRY INDEX
   "Active" = bottommost entry whose top has crossed 42 % of vh
   ───────────────────────────────────────────── */
function computeActiveIdx() {
	const trigger = window.innerHeight * 0.42;
	let idx = -1;
	TL_ENTRIES.forEach(({id}, i) => {
		const el = document.getElementById(id);
		if (el && el.getBoundingClientRect().top < trigger) idx = i;
	});
	return idx;
}

/* ─────────────────────────────────────────────
   UPDATE RAIL DOM  (chips + dot styles)
   ───────────────────────────────────────────── */
function updateRail(idx) {
	const stack = document.getElementById("tl-stack");
	const divider = document.getElementById("tl-divider");
	if (!stack) return;

	stack.innerHTML = "";
	let hasPast = false;

	TL_ENTRIES.forEach(({id, label, year, cat}, i) => {
		const dot = container_dot(id);
		const isPast = idx >= 0 && i < idx;
		const isNow = i === idx;

		if (isPast) {
			hasPast = true;

			/* Chip in the past-stack */
			const chip = document.createElement("a");
			chip.className = `tl-past-chip cat-${cat}`;
			chip.href = "javascript:void(0)";
			chip.title = `Return to: ${label}`;
			chip.innerHTML = `
				<span class="tl-past-chip-dot"></span>
				<span class="tl-past-chip-label">${label}</span>
				<span class="tl-past-chip-year">${year}</span>`;
			chip.addEventListener("click", () => scrollToEntry(id));
			stack.appendChild(chip);

			/* Dim main dot */
			if (dot) {
				dot.style.opacity = "0.28";
				resetDotStyle(dot);
			}
		} else if (isNow) {
			const color = CAT_COLOR[cat] || "var(--accent)";

			if (dot) {
				dot.style.opacity = "1";
				const marker = dot.querySelector(".tl-dot-marker");
				const name = dot.querySelector(".tl-dot-name");
				if (marker) marker.style.cssText = `background:${color};border-color:${color};transform:scale(1.45)`;
				if (name) name.style.color = color;
			}

			/* Keep active dot scrolled into view within #tl-dots */
			if (dot) scrollDotIntoView(dot);
		} else {
			/* Future */
			if (dot) {
				dot.style.opacity = "1";
				resetDotStyle(dot);
			}
		}
	});

	if (divider) divider.style.display = hasPast ? "block" : "none";

	/* Mobile bar */
	const mobLabel = document.getElementById("tl-mob-label");
	const mobYear = document.getElementById("tl-mob-year");
	if (mobLabel) {
		const entry = idx >= 0 ? TL_ENTRIES[idx] : null;
		mobLabel.textContent = entry ? entry.label.toUpperCase() : "ENGINEERING PORTFOLIO";
		if (mobYear) mobYear.textContent = entry ? entry.year : "";
	}
}

function container_dot(id) {
	return document.querySelector(`.tl-dot[data-entry="${id}"]`);
}

function resetDotStyle(dot) {
	const marker = dot.querySelector(".tl-dot-marker");
	const name = dot.querySelector(".tl-dot-name");
	if (marker) marker.style.cssText = "";
	if (name) name.style.color = "";
}

function scrollDotIntoView(dot) {
	const dotsEl = document.getElementById("tl-dots");
	if (!dotsEl) return;
	const stackH = document.getElementById("tl-stack")?.offsetHeight ?? 0;
	const top = dot.offsetTop;
	const sh = dotsEl.offsetHeight;
	const st = dotsEl.scrollTop;
	if (top < st + 10 || top > st + sh - 60) {
		dotsEl.scrollTo({top: Math.max(0, top - 24), behavior: "smooth"});
	}
}

/* ─────────────────────────────────────────────
   CARD FADE-IN  (IntersectionObserver)
   ───────────────────────────────────────────── */
function initFadeIn() {
	if (!window.IntersectionObserver) {
		document.querySelectorAll(".tl-entry .ec").forEach((c) => c.classList.add("visible"));
		return;
	}
	const obs = new IntersectionObserver(
		(entries) => {
			entries.forEach((e) => {
				if (e.isIntersecting) {
					const card = e.target.querySelector(".ec");
					if (card) card.classList.add("visible");
					obs.unobserve(e.target);
				}
			});
		},
		{threshold: 0.04},
	);

	document.querySelectorAll(".tl-entry").forEach((el) => obs.observe(el));
}

/* ─────────────────────────────────────────────
   URL DEEP-LINK   (?section=vfd etc.)
   ───────────────────────────────────────────── */
function handleTLUrl() {
	const s = new URLSearchParams(window.location.search).get("section");
	const id = s && SECTION_MAP[s];
	if (id) setTimeout(() => scrollToEntry(id), 420);
}

/* ─────────────────────────────────────────────
   SCROLL LISTENER  (rAF-throttled)
   ───────────────────────────────────────────── */
let tlTicking = false;
window.addEventListener(
	"scroll",
	() => {
		if (!tlTicking) {
			requestAnimationFrame(() => {
				const idx = computeActiveIdx();
				if (idx !== activeIdx) {
					activeIdx = idx;
					updateRail(idx);
				}
				tlTicking = false;
			});
			tlTicking = true;
		}
	},
	{passive: true},
);

/* ─────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────── */
function initTimeline() {
	buildRail();
	activeIdx = computeActiveIdx();
	updateRail(activeIdx);
	initFadeIn();
	handleTLUrl();
}

if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", initTimeline);
} else {
	initTimeline();
}
