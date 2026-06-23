/* ── CUSTOM CURSOR (disabled – set true to enable) ── */
const ENABLE_CUSTOM_CURSOR = false;

/* ── SVG PERFECT TRACE CALCULATOR ── */
// Mathematically calculates the length of your logo paths to prevent GPU over-draw lag
document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll(".logo-path").forEach((path) => {
		const length = path.getTotalLength();
		path.style.setProperty("--path-length", length);
	});
});

/* ══ SLIDE CONFIG ══ */
const TABS = {
	ss7: ["btn-vfd", "btn-red", "btn-lsar"],
	ss8: ["btn-5776k", "btn-cabinet"],
	ss3: ["btn-ignite25", "btn-invent", "btn-ignite"],
	ss6: ["btn-everyday", "btn-aeroinfo"],
	ss9: ["btn-scouts", "btn-737", "btn-fsae"],
};
const RMAP = {
	ss7: ["vfd", "red", "lsar"],
	ss8: ["team-5776k", "cabinet"],
	ss3: ["ignite25", "invent", "ignite"],
	ss6: ["everyday-engineering", "aerodynamics-infographics"],
	ss9: ["boy-scouts", "737-800-cad", "formula-sae"],
};
const SMAP = {
	vfd: {ss: "ss7", i: 0},
	red: {ss: "ss7", i: 1},
	lsar: {ss: "ss7", i: 2},
	"team-5776k": {ss: "ss8", i: 0},
	cabinet: {ss: "ss8", i: 1},
	ignite25: {ss: "ss3", i: 0},
	invent: {ss: "ss3", i: 1},
	ignite: {ss: "ss3", i: 2},
	"everyday-engineering": {ss: "ss6", i: 0},
	"aerodynamics-infographics": {ss: "ss6", i: 1},
	"boy-scouts": {ss: "ss9", i: 0},
	"737-800-cad": {ss: "ss9", i: 1},
	"formula-sae": {ss: "ss9", i: 2},
};
const ANC = {ss7: "sec-tamu", ss8: "sec-dvhs", ss3: "sec-events", ss6: "sec-infographic", ss9: "sec-cad"};
const SS = {};
const WRAP_PAD = 20;

/* ── SLIDESHOW ENGINE ───────────────────────────────────────────────── */
function initSS() {
	Object.keys(TABS).forEach((id) => {
		const clip = document.getElementById(id + "-clip");
		const fr = document.getElementById(id + "-fr");
		const cont = document.getElementById(id);
		if (!clip || !fr || !cont) return;
		const slides = fr.querySelectorAll(".ssslide");
		SS[id] = {clip, cont, fr, slides, cur: 0, w: 0, lastH: null};

		slides.forEach((sl, i) => {
			sl.style.visibility = i === 0 ? "visible" : "hidden";
		});

		calcW(id);
		setH(id, false);

		// INSTANT Resize calculations (No 60ms delay, restored from unoptimized)
		new ResizeObserver(() => {
			calcW(id);
			fr.style.transition = "none";
			fr.style.transform = `translateX(-${SS[id].cur * (SS[id].w + 100)}px)`;
			requestAnimationFrame(() => {
				fr.style.transition = "";
			});
			setH(id, false);
		}).observe(clip);

		slides.forEach((sl) =>
			sl.querySelectorAll("img").forEach((img) => {
				if (!img.complete) img.addEventListener("load", () => setH(id, false), {once: true});
			}),
		);
	});
}

function calcW(id) {
	const s = SS[id];
	if (!s) return; // <-- THE MISSING SAFETY CHECK
	const w = s.clip.getBoundingClientRect().width;
	if (w === 0) return;
	s.w = w;
	s.slides.forEach((sl) => (sl.style.width = w + "px"));
}

function setH(id, animate) {
	const s = SS[id];
	if (!s || !s.slides[s.cur]) return;
	const card = s.slides[s.cur].querySelector(".ec");
	if (!card) return;
	const h = card.offsetHeight;
	if (!h) return;

	if (s.lastH === h && !animate) return;
	s.lastH = h;

	const clip = s.clip;
	const wrapper = clip.closest(".ss-wrapper");
	if (!wrapper) return;
	const wrapH = WRAP_PAD + h + WRAP_PAD;
	const arrTop = WRAP_PAD + Math.round(h / 2);

	if (!animate) {
		const clipTrans = clip.style.transition;
		const wrapTrans = wrapper.style.transition;
		clip.style.transition = "none";
		wrapper.style.transition = "none";
		clip.style.height = h + "px";
		wrapper.style.height = wrapH + "px";
		wrapper.querySelectorAll(".sarr").forEach((a) => {
			a.style.transition = "none";
			a.style.top = arrTop + "px";
		});
		requestAnimationFrame(() => {
			clip.style.transition = clipTrans || "";
			wrapper.style.transition = wrapTrans || "";
			wrapper.querySelectorAll(".sarr").forEach((a) => {
				a.style.transition = "";
			});
		});
	} else {
		void clip.offsetHeight;
		void wrapper.offsetHeight;
		clip.style.height = h + "px";
		wrapper.style.height = wrapH + "px";
		wrapper.querySelectorAll(".sarr").forEach((a) => {
			a.style.top = arrTop + "px";
		});
	}
}

// function sw(id, idx, section, doScroll = true) {
// 	const s = SS[id];
// 	if (!s) return;
// 	const prev = s.cur;

// 	if (prev === idx) {
// 		(TABS[id] || []).forEach((bid, i) => {
// 			const b = document.getElementById(bid);
// 			if (b) b.disabled = i === idx;
// 		});
// 		updateURLd(section);
// 		if (doScroll) {
// 			if (window._lockNav) window._lockNav();
// 			if (window._hideNav) window._hideNav();
// 			const el = document.getElementById(ANC[id]);
// 			if (el) el.scrollIntoView({behavior: "smooth", block: "start"});
// 		}
// 		return;
// 	}
// 	s.cur = idx;

// 	const prevSlide = s.slides[prev];
// 	if (prevSlide) {
// 		const prevCard = prevSlide.querySelector(".ec");
// 		if (prevCard) prevCard.classList.remove("visible");
// 		prevSlide.style.visibility = "hidden";
// 	}
// 	// const prevSlide = s.slides[prev];
// 	// if (prevSlide) {
// 	// 	const prevCard = prevSlide.querySelector(".ec");
// 	// 	if (prevCard) prevCard.classList.remove("visible");

// 	// 	// THE FIX: Delay the visibility toggle so the card can slide and fade out smoothly
// 	// 	setTimeout(() => {
// 	// 		// Ensure the user hasn't quickly navigated back to this slide
// 	// 		if (s.cur !== prev) {
// 	// 			prevSlide.style.visibility = "hidden";
// 	// 		}
// 	// 	}, 500); // 500ms covers both the 0.4s slide and 0.5s fade transitions
// 	// }

// 	const newSlide = s.slides[idx];
// 	if (newSlide) {
// 		newSlide.style.visibility = "visible";
// 		const newCard = newSlide.querySelector(".ec");
// 		if (newCard) {
// 			newCard.classList.remove("visible");
// 			void newCard.offsetWidth;
// 			newCard.classList.add("visible");
// 		}
// 	}

// 	s.fr.style.transform = `translateX(-${idx * s.w}px)`;
// 	requestAnimationFrame(() => setH(id, true));

// 	(TABS[id] || []).forEach((bid, i) => {
// 		const b = document.getElementById(bid);
// 		if (b) b.disabled = i === idx;
// 	});

// 	updateURLd(section);
// 	if (doScroll) {
// 		if (window._lockNav) window._lockNav();
// 		if (window._hideNav) window._hideNav();
// 		const el = document.getElementById(ANC[id]);
// 		if (el) el.scrollIntoView({behavior: "smooth", block: "start"});
// 	}
// }

function sw(id, idx, section, doScroll = true) {
	const s = SS[id];
	if (!s) return;
	const prev = s.cur;

	// If clicking the currently active tab, just handle routing/scrolling
	if (prev === idx) {
		(TABS[id] || []).forEach((bid, i) => {
			const b = document.getElementById(bid);
			if (b) b.disabled = i === idx;
		});
		updateURLd(section);
		if (doScroll) {
			if (window._lockNav) window._lockNav();
			if (window._hideNav) window._hideNav();
			const el = document.getElementById(ANC[id]);
			if (el) el.scrollIntoView({behavior: "smooth", block: "start"});
		}
		return;
	}

	s.cur = idx;

	// Update tab button styles instantly
	(TABS[id] || []).forEach((bid, i) => {
		const b = document.getElementById(bid);
		if (b) b.disabled = i === idx;
	});

	const prevSlide = s.slides[prev];
	const newSlide = s.slides[idx];

	// 1. Start fading down the old card
	if (prevSlide) {
		const prevCard = prevSlide.querySelector(".ec");
		if (prevCard) prevCard.classList.remove("visible");
	}

	// if (prevSlide) {
	// 	prevSlide.style.visibility = "hidden";
	// 	const prevCard = prevSlide.querySelector(".ec");
	// 	if (prevCard) {
	// 		prevCard.classList.remove("visible");
	// 		prevCard.style.transition = "none";
	// 		prevCard.style.opacity = "0";
	// 		prevCard.style.transform = "translateY(16px)";
	// 	}
	// }

	// Clear the timer if the user rapid-clicks tabs
	if (s.swTimer) clearTimeout(s.swTimer);

	// 2. Wait for the fade-out, snap the container, and fade-in the new card
	s.swTimer = setTimeout(() => {
		// Hide all slides except the target to prevent visual ghosting
		s.slides.forEach((sl, i) => {
			if (i !== s.cur) sl.style.visibility = "hidden";
		});

		// INSTANTLY snap the container horizontally (kills the "side business")
		s.fr.style.transition = "none";
		s.fr.style.transform = `translateX(-${idx * s.w}px)`;
		s.fr.style.transform = `translateX(-${idx * (s.w + 100)}px)`;

		// Show the new slide container and trigger its upward fade
		if (newSlide) {
			newSlide.style.visibility = "visible";
			const newCard = newSlide.querySelector(".ec");
			if (newCard) {
				newCard.classList.remove("visible");
				void newCard.offsetWidth; // Force CSS reflow so it starts at the bottom
				newCard.classList.add("visible");
			}
		}

		// Smoothly adjust the wrapper height to fit the new card
		requestAnimationFrame(() => setH(id, true));
	}, 150); // 350ms gives the outgoing CSS opacity transition time to vanish smoothly

	// URL and Scrolling handling
	updateURLd(section);
	if (doScroll) {
		if (window._lockNav) window._lockNav();
		if (window._hideNav) window._hideNav();
		const el = document.getElementById(ANC[id]);
		if (el) el.scrollIntoView({behavior: "smooth", block: "start"});
	}
}

function ar(id, dir) {
	const s = SS[id];
	if (!s) return;
	const next = Math.max(0, Math.min(s.slides.length - 1, s.cur + dir));
	if (next === s.cur) return;
	const nextSection = RMAP[id][next];
	sw(id, next, nextSection, false);
}

function ddNav(section) {
	const c = SMAP[section];
	if (!c) return;
	if (!SS[c.ss]) {
		window.location.href = "portfolio.html?section=" + section;
		return;
	}
	if (window._lockNav) window._lockNav();
	if (window._hideNav) window._hideNav();
	sw(c.ss, c.i, section, true);
}

/* ── URL HELPERS & SUB-NAV HIGHLIGHTING ─────────────────────────────── */
let lastSec = null,
	debT = null;

function updateSubNav(sec) {
	document.querySelectorAll(".sbn-sub").forEach((a) => {
		const isMatch = a.dataset.sub === sec;
		if (a.classList.contains("active") !== isMatch) {
			a.classList.toggle("active", isMatch);
		}
	});
}

function updateURLHistory(s) {
	const u = new URL(window.location.href);
	const currentParam = u.searchParams.get("section");

	if (s === currentParam || (!s && !currentParam)) return;

	if (s) u.searchParams.set("section", s);
	else u.searchParams.delete("section");

	try {
		history.replaceState(null, "", u.toString());
	} catch (e) {}
}

function updateURLd(s) {
	if (s === lastSec) return;
	lastSec = s;

	updateSubNav(s);
	clearTimeout(debT);
	debT = setTimeout(() => updateURLHistory(s), 150);
}

function handleURL() {
	const s = new URLSearchParams(window.location.search).get("section");
	updateSubNav(s);
	if (!s) return;
	if (SMAP[s]) {
		if (window._lockNav) window._lockNav();
		if (window._hideNav) window._hideNav();
		const {ss, i} = SMAP[s];
		sw(ss, i, s, true);
		return;
	}

	const el = document.getElementById(s);
	if (el) {
		if (window._lockNav) window._lockNav();
		if (window._hideNav) window._hideNav();
		el.scrollIntoView({behavior: "smooth", block: "start"});
	}
}

/* ── SMOOTH SCROLL NAVIGATOR ── */
function scrollToSec(id) {
	if (window._lockNav) window._lockNav();
	if (window._hideNav) window._hideNav();

	if (id === "top") {
		window.scrollTo({top: 75, behavior: "smooth"});
		return;
	}

	const el = document.getElementById(id);
	if (el) el.scrollIntoView({behavior: "smooth", block: "start"});
}

function copyAnchorURL(sectionId, defaultSlide) {
	const u = new URL(window.location.href);
	u.hash = "";
	if (defaultSlide && SMAP[defaultSlide]) {
		u.searchParams.set("section", defaultSlide);
	} else if (sectionId) {
		u.searchParams.delete("section");
		u.hash = sectionId;
	}
	const text = u.toString();
	const toast = document.getElementById("copy-toast");
	const fallback = () => {
		const ta = document.createElement("textarea");
		ta.value = text;
		ta.style.position = "fixed";
		ta.style.opacity = "0";
		document.body.appendChild(ta);
		ta.select();
		try {
			document.execCommand("copy");
		} catch (e) {}
		document.body.removeChild(ta);
	};
	(navigator.clipboard ? navigator.clipboard.writeText(text).catch(fallback) : Promise.resolve(fallback())).then(() => {
		toast.classList.add("show");
		setTimeout(() => toast.classList.remove("show"), 2000);
	});
}

window.addEventListener("message", (e) => {
	if (e.data?.type === "navigate" && e.data?.url) {
		const u = new URL(e.data.url, window.location.href);
		const s = u.searchParams.get("section");
		if (s && SMAP[s]) {
			const {ss, i} = SMAP[s];
			sw(ss, i, s, true);
		}
	}
});

/* ── MOBILE SIDEBAR TOGGLE ── */
document.addEventListener("click", (e) => {
	const btn = e.target.closest(".mobile-menu-btn");
	const sb = document.getElementById("sb");
	const overlay = document.getElementById("sb-overlay");

	if (!sb || !overlay) return;

	if (btn) {
		const isOpen = sb.classList.contains("sb-open");
		if (!isOpen) {
			sb.classList.add("sb-open");
			overlay.classList.add("show");
			document.body.style.overflow = "hidden";
		} else {
			closeSidebar();
		}
		return;
	}

	if (e.target.matches("#sb-overlay") || e.target.closest(".sbn, .sbn-sub, .tb")) {
		if (sb.classList.contains("sb-open")) {
			closeSidebar();
		}
	}
});

function closeSidebar() {
	const sb = document.getElementById("sb");
	const overlay = document.getElementById("sb-overlay");
	if (sb) sb.classList.remove("sb-open");
	if (overlay) overlay.classList.remove("show");
	document.body.style.overflow = "";
}

/* ── DESKTOP SIDEBAR HOVER EFFECT ── */
// document.addEventListener("DOMContentLoaded", () => {
// 	const sb = document.getElementById("sb");
// 	const overlay = document.getElementById("sb-overlay");

// 	if (sb && overlay) {
// 		sb.addEventListener("mouseenter", () => {
// 			// Only trigger on desktop screens (> 1050px)
// 			if (window.innerWidth > 1050) {
// 				overlay.classList.add("show");
// 			}
// 		});

// 		sb.addEventListener("mouseleave", () => {
// 			// Remove the overlay when mouse leaves, making sure we don't accidentally close a toggled mobile menu
// 			if (window.innerWidth > 1050 && !sb.classList.contains("sb-open")) {
// 				overlay.classList.remove("show");
// 			}
// 		});
// 	}
// });

/* ── UNIFIED SCROLL ENGINE (NAV & SIDEBAR) ─────────────────────────── */
let isScrollTicking = false;
let cachedAvailableSections = null;

// Navbar scroll sensitivity: how many pixels of scroll before hiding/showing the header.
// Desktop and mobile can use different thresholds.
const NAV_SCROLL_DOWN_PX_DESKTOP = 10;
const NAV_SCROLL_UP_PX_DESKTOP = 30;
const NAV_SCROLL_DOWN_PX_MOBILE = 100;
const NAV_SCROLL_UP_PX_MOBILE = 30;

function getNavScrollThresholds() {
	if (window.innerWidth <= 1050) {
		return {down: NAV_SCROLL_DOWN_PX_MOBILE, up: NAV_SCROLL_UP_PX_MOBILE};
	}
	return {down: NAV_SCROLL_DOWN_PX_DESKTOP, up: NAV_SCROLL_UP_PX_DESKTOP};
}

let navHovering = false;
let navHid = false;
let navDelta = 0;
let navLy = 0;

window._isNavLocked = false;
let scrollLockTimer = null;
let isScrolling = false;

function unlockNav() {
	window._isNavLocked = false;
	window.removeEventListener("scroll", extendLock);
	window.removeEventListener("scrollend", forceUnlock);
	isScrolling = false;
}

function forceUnlock() {
	clearTimeout(scrollLockTimer);
	unlockNav();
}

function extendLock() {
	isScrolling = true;
	clearTimeout(scrollLockTimer);
	scrollLockTimer = setTimeout(unlockNav, 250);
}

window._lockNav = function () {
	window._isNavLocked = true;
	navHovering = false;
	isScrolling = false;
	clearTimeout(scrollLockTimer);
	window.removeEventListener("scroll", extendLock);
	window.removeEventListener("scrollend", forceUnlock);
	window.addEventListener("scroll", extendLock, {passive: true});
	window.addEventListener("scrollend", forceUnlock, {passive: true});
	scrollLockTimer = setTimeout(() => {
		if (!isScrolling) unlockNav();
	}, 300);
};

function initNavHoverStates() {
	const hdr = document.getElementById("hdr");
	const dd = document.getElementById("nav-dd");
	if (!hdr) return;

	window._showNav = function () {
		if (navHid) {
			hdr.style.transition = "transform 0.52s cubic-bezier(0.34, 1.36, 0.64, 1)";
			hdr.style.transform = "translateY(0)";
			navHid = false;
			navDelta = 0;
		}
	};

	// window._hideNav = function () {
	// 	if (!navHid) {
	// 		hdr.style.transition = "transform 0.28s cubic-bezier(0.4, 0, 0.8, 1)";
	// 		hdr.style.transform = "translateY(-150%)";
	// 		// hdr.style.transition = "transform 0.48s cubic-bezier(0.4, 0, 0.8, 1)";
	// 		// hdr.style.transform = "translateY(-250%)";
	// 		navHid = true;
	// 		navDelta = 0;
	// 		hdr.querySelectorAll(".ndrop.open").forEach((drop) => drop.classList.remove("open"));
	// 	}
	// };

	// window._hideNav = function () {
	// 	if (!navHid) {
	// 		hdr.style.transition = "transform 0.28s cubic-bezier(0.4, 0, 0.8, 1)";
	// 		hdr.style.transform = "translateY(-150%)";
	// 		navHid = true;
	// 		navDelta = 0;

	// 		// Force close mobile dropdowns and OVERRIDE lingering :hover CSS
	// 		hdr.querySelectorAll(".ndrop").forEach((drop) => {
	// 			drop.classList.remove("open");
	// 			const navDd = drop.querySelector(".nav-dd");
	// 			if (navDd) {
	// 				navDd.style.setProperty("display", "none", "important");
	// 				setTimeout(() => navDd.style.removeProperty("display"), 300);
	// 			}
	// 		});
	// 	}
	// };

	// window._hideNav = function () {
	// 	if (!navHid) {
	// 		hdr.style.transition = "transform 0.28s cubic-bezier(0.4, 0, 0.8, 1)";
	// 		hdr.style.transform = "translateY(-150%)";
	// 		// hdr.style.transform = "translateY(-15%)";
	// 		navHid = true;
	// 		navDelta = 0;

	// 		// Instantly close mobile dropdowns
	// 		hdr.querySelectorAll(".ndrop").forEach((drop) => drop.classList.remove("open"));
	// 	}
	// };

	window._hideNav = function () {
		if (!navHid) {
			hdr.style.transition = "transform 0.28s cubic-bezier(0.4, 0, 0.8, 1)";
			hdr.style.transform = "translateY(-150%)";
			navHid = true;
			navDelta = 0;

			// Instantly close mobile dropdowns and clear the sticky blur overlay
			hdr.querySelectorAll(".ndrop").forEach((drop) => drop.classList.remove("open"));
			const shroud = document.getElementById("blur-page");
			if (shroud) shroud.classList.remove("visible");
		}
	};

	[hdr, dd].forEach((el) => {
		if (!el) return;
		el.addEventListener("mouseenter", () => {
			if (window._isNavLocked) return;
			navHovering = true;
			window._showNav();
		});
		el.addEventListener("mouseleave", () => {
			navHovering = false;
			navLy = window.scrollY;
		});
	});
}

function runCoreScrollTasks(sy) {
	const hdr = document.getElementById("hdr");
	if (!hdr) return;

	// --- NAV SCROLL LOGIC ---
	if (window._isNavLocked || navHovering) {
		navLy = sy;
		navDelta = 0;
	} else if (sy <= 10) {
		window._showNav();
		navLy = sy;
	} else {
		const d = sy - navLy;
		const {down: navScrollDownPx, up: navScrollUpPx} = getNavScrollThresholds();
		if (d > 0) {
			navDelta = navDelta > 0 ? navDelta + d : d;
			if (!navHid && navDelta >= navScrollDownPx) window._hideNav();
		} else if (d < 0) {
			navDelta = navDelta < 0 ? navDelta + d : d;
			if (navHid && -navDelta >= navScrollUpPx) window._showNav();
		}
		navLy = sy;
	}

	// --- SIDEBAR PROGRESS & BLOG LOGIC ---
	const fill = document.getElementById("sb-fill");
	const winH = window.innerHeight;
	const tot = document.documentElement.scrollHeight - winH;
	if (fill) fill.style.width = (tot > 0 ? (sy / tot) * 100 : 0) + "%";

	const coverWrap = document.getElementById("post-cover-wrap");
	if (coverWrap && window.isViewingDynamicPost) {
		coverWrap.style.transform = `translateY(${sy * 0.55}px)`;
	}

	if (window.isViewingDynamicPost) return;

	if (!cachedAvailableSections) {
		const allSections = [
			{id: "top", k: "top"},
			{id: "about", k: "about"},
			{id: "featured", k: "featured"},
			{id: "contact", k: "contact"},
			{id: "sec-tamu", k: "tamu"},
			{id: "sec-dvhs", k: "dvhs"},
			{id: "sec-events", k: "events"},
			{id: "sec-infographic", k: "infographic"},
			{id: "sec-cad", k: "cad"},
			// ADDED FOR PHOTOGRAPHY PAGE
			{id: "sec-nature", k: "nature"},
			{id: "sec-architecture", k: "architecture"},
			{id: "sec-subject", k: "subject"},
			{id: "sec-misc", k: "misc"},
		];
		cachedAvailableSections = allSections.filter((s) => document.getElementById(s.id));
	}

	let activeK = null;
	// const path = window.location.pathname;
	// const anchor_loc = path.endsWith("index.html") || path === "/" || path.endsWith("/") ? 0.6 : 0.45;
	const path = window.location.pathname;
	// Lower threshold (0.1) for photography, standard (0.45) for others
	const anchor_loc = path.includes("photography") ? 0.3 : path.endsWith("index.html") || path === "/" || path.endsWith("/") ? 0.6 : 0.45;
	const triggerPoint = winH * anchor_loc;

	cachedAvailableSections.forEach(({id, k}) => {
		const el = document.getElementById(id);
		if (el && el.getBoundingClientRect().top < triggerPoint) {
			activeK = k;
		}
	});

	if (sy < 100 && cachedAvailableSections.length > 0) { //400 initially for sy<
		updateURLd(null);
		activeK = cachedAvailableSections[0].k;
	}
	// bottom of page edge case
	if (window.innerHeight + Math.ceil(sy) >= document.documentElement.scrollHeight - 50) {
		activeK = cachedAvailableSections[cachedAvailableSections.length - 1].k;
	}


if (activeK) {
	document.querySelectorAll(".sbn[data-k]").forEach((a) => {
		const isMatch = a.dataset.k === activeK; /* Removed the hardcoded TAMU/DVHS bug */
		if (a.classList.contains("active") !== isMatch) {
			a.classList.toggle("active", isMatch);
		}
	});

	const ssMap = {tamu: "ss7", dvhs: "ss8", events: "ss3", infographic: "ss6", cad: "ss9"};
	const ssId = ssMap[activeK];
	if (ssId && SS[ssId] && sy >= 400) {
		const sec = RMAP[ssId]?.[SS[ssId].cur];
		if (sec) updateURLd(sec);
	}
}
}

/* ── CAROUSELS ── */
// function initCarousels() {
// 	// REVERTED: IntersectionObserver removed completely. We loop over all carousels immediately on load.
// 	document.querySelectorAll(".cw").forEach((wrap) => {
// 		const inner = wrap.querySelector(".cw-inner");
// 		if (!inner) return;
// 		const imgs = inner.querySelectorAll(".cimg");
// 		if (!imgs.length) return;

// 		// INSTANT REVERT: Swap data-src to src immediately on load.
// 		// Doing this BEFORE initSS() ensures the images load and heights are computed properly.
// 		imgs.forEach((img) => {
// 			if (img.dataset.src) {
// 				img.src = img.dataset.src;
// 				img.removeAttribute("data-src");
// 			}
// 		});

// 		let node = wrap,
// 			dotsEl = null,
// 			capEl = null;
// 		for (let i = 0; i < 4; i++) {
// 			node = node.nextElementSibling;
// 			if (!node) break;
// 			if (!dotsEl && node.classList.contains("cdots")) dotsEl = node;
// 			if (!capEl && node.classList.contains("car-caption")) capEl = node;
// 		}

// 		const dots = dotsEl ? dotsEl.querySelectorAll(".cdot") : [];
// 		let cur = 0,
// 			timer = null;

// 		function show(i) {
// 			const prevEl = imgs[cur];
// 			if (prevEl) prevEl.classList.remove("on");
// 			if (dots[cur]) dots[cur].classList.remove("on");

// 			cur = (i + imgs.length) % imgs.length;

// 			const newEl = imgs[cur];

// 			if (newEl) newEl.classList.add("on");
// 			if (dots[cur]) dots[cur].classList.add("on");

// 			if (capEl) {
// 				const cap = imgs[cur].dataset.cap || imgs[cur].alt || "";
// 				const link = imgs[cur].dataset.link || "";
// 				if (link) capEl.innerHTML = `<a href="${link}" target="_blank">${cap}</a>`;
// 				else capEl.textContent = cap;
// 			}

// 			const clip = wrap.closest(".ss-clip");
// 			if (clip) {
// 				const id = clip.id.replace("-clip", "");
// 				if (SS[id]) requestAnimationFrame(() => setH(id, true));
// 			}
// 		}

// 		function startAutoPlay() {
// 			clearTimeout(timer);
// 			if (imgs.length <= 1) return;

// 			let currentMedia = imgs[cur];
// 			let duration = 5000;

// 			if (currentMedia.dataset.interval) {
// 				duration = parseInt(currentMedia.dataset.interval);
// 			} else if (wrap.dataset.interval) {
// 				duration = parseInt(wrap.dataset.interval);
// 			} else if (currentMedia.tagName === "VIDEO") {
// 				duration = 6000;
// 			} else {
// 				duration = 3500;
// 			}

// 			timer = setTimeout(() => {
// 				show(cur + 1);
// 				startAutoPlay();
// 			}, duration);
// 		}

// 		dots.forEach((d, i) =>
// 			d.addEventListener("click", (e) => {
// 				e.stopPropagation();
// 				show(i);
// 				startAutoPlay();
// 			}),
// 		);

// 		wrap.addEventListener("click", () => {
// 			const tag = imgs[cur]?.tagName;
// 			if (tag === "IMG" || tag === "VIDEO" || tag === "IFRAME") openLb(imgs, cur);
// 		});

// 		show(0);
// 		startAutoPlay();
// 	});
// }

/* ── CAROUSELS ── */
// function initCarousels() {
// 	document.querySelectorAll(".cw").forEach((wrap) => {
// 		const inner = wrap.querySelector(".cw-inner");
// 		if (!inner) return;
// 		const imgs = inner.querySelectorAll(".cimg");
// 		if (!imgs.length) return;

// 		// ❌ THE EAGER LOAD LOOP HAS BEEN DELETED FROM HERE ❌

// 		let node = wrap,
// 			dotsEl = null,
// 			capEl = null;
// 		for (let i = 0; i < 4; i++) {
// 			node = node.nextElementSibling;
// 			if (!node) break;
// 			if (!dotsEl && node.classList.contains("cdots")) dotsEl = node;
// 			if (!capEl && node.classList.contains("car-caption")) capEl = node;
// 		}

// 		const dots = dotsEl ? dotsEl.querySelectorAll(".cdot") : [];
// 		let cur = 0,
// 			timer = null;

// 		function show(i) {
// 			const prevEl = imgs[cur];
// 			if (prevEl) prevEl.classList.remove("on");
// 			if (dots[cur]) dots[cur].classList.remove("on");

// 			cur = (i + imgs.length) % imgs.length;

// 			const newEl = imgs[cur];

// 			// ✅ THE FIX: JUST-IN-TIME LAZY LOADING ✅
// 			if (newEl && newEl.dataset.src) {
// 				newEl.src = newEl.dataset.src;

// 				// Fixes the 0-height bug: recalculate height only when this specific media loads
// 				const updateHeight = () => {
// 					const clip = wrap.closest(".ss-clip");
// 					if (clip) {
// 						const id = clip.id.replace("-clip", "");
// 						if (SS[id]) requestAnimationFrame(() => setH(id, true));
// 					}
// 				};

// 				if (newEl.tagName === "VIDEO") {
// 					newEl.addEventListener("loadeddata", updateHeight, {once: true});
// 					newEl.load(); // Force the browser to start fetching the video
// 				} else {
// 					newEl.addEventListener("load", updateHeight, {once: true});
// 				}

// 				newEl.removeAttribute("data-src");
// 			}

// 			if (newEl) newEl.classList.add("on");
// 			if (dots[cur]) dots[cur].classList.add("on");

// 			if (capEl) {
// 				const cap = imgs[cur].dataset.cap || imgs[cur].alt || "";
// 				const link = imgs[cur].dataset.link || "";
// 				if (link) capEl.innerHTML = `<a href="${link}" target="_blank">${cap}</a>`;
// 				else capEl.textContent = cap;
// 			}

// 			const clip = wrap.closest(".ss-clip");
// 			if (clip) {
// 				const id = clip.id.replace("-clip", "");
// 				if (SS[id]) requestAnimationFrame(() => setH(id, true));
// 			}
// 		}

// 		function startAutoPlay() {
// 			clearTimeout(timer);
// 			if (imgs.length <= 1) return;

// 			let currentMedia = imgs[cur];
// 			let duration = 5000;

// 			if (currentMedia.dataset.interval) {
// 				duration = parseInt(currentMedia.dataset.interval);
// 			} else if (wrap.dataset.interval) {
// 				duration = parseInt(wrap.dataset.interval);
// 			} else if (currentMedia.tagName === "VIDEO") {
// 				duration = 6000;
// 			} else {
// 				duration = 3500;
// 			}

// 			timer = setTimeout(() => {
// 				show(cur + 1);
// 				startAutoPlay();
// 			}, duration);
// 		}

// 		dots.forEach((d, i) =>
// 			d.addEventListener("click", (e) => {
// 				e.stopPropagation();
// 				show(i);
// 				startAutoPlay();
// 			}),
// 		);

// 		wrap.addEventListener("click", () => {
// 			const tag = imgs[cur]?.tagName;
// 			if (tag === "IMG" || tag === "VIDEO" || tag === "IFRAME") openLb(imgs, cur);
// 		});

// 		show(0);
// 		startAutoPlay();
// 	});
// }

/* ── CAROUSELS ── */
// function initCarousels() {
// 	document.querySelectorAll(".cw").forEach((wrap) => {
// 		const inner = wrap.querySelector(".cw-inner");
// 		if (!inner) return;
// 		const imgs = inner.querySelectorAll(".cimg");
// 		if (!imgs.length) return;

// 		let node = wrap,
// 			dotsEl = null,
// 			capEl = null;
// 		for (let i = 0; i < 4; i++) {
// 			node = node.nextElementSibling;
// 			if (!node) break;
// 			if (!dotsEl && node.classList.contains("cdots")) dotsEl = node;
// 			if (!capEl && node.classList.contains("car-caption")) capEl = node;
// 		}

// 		const dots = dotsEl ? dotsEl.querySelectorAll(".cdot") : [];
// 		let cur = 0,
// 			timer = null;

// 		// THE FIX: Silently load the next and previous slides in the background
// 		function preloadAdjacent(index) {
// 			const nextIdx = (index + 1) % imgs.length;
// 			const prevIdx = (index - 1 + imgs.length) % imgs.length;

// 			[nextIdx, prevIdx].forEach((idx) => {
// 				const el = imgs[idx];
// 				if (el && el.dataset.src) {
// 					el.src = el.dataset.src;

// 					const updateHeight = () => {
// 						const clip = wrap.closest(".ss-clip");
// 						if (clip) {
// 							const id = clip.id.replace("-clip", "");
// 							if (SS[id]) requestAnimationFrame(() => setH(id, true));
// 						}
// 					};

// 					if (el.tagName === "VIDEO") {
// 						el.addEventListener("loadeddata", updateHeight, {once: true});
// 						el.load();
// 					} else {
// 						el.addEventListener("load", updateHeight, {once: true});
// 					}

// 					el.removeAttribute("data-src");
// 				}
// 			});
// 		}

// 		function show(i) {
// 			const prevEl = imgs[cur];
// 			if (prevEl) prevEl.classList.remove("on");
// 			if (dots[cur]) dots[cur].classList.remove("on");

// 			cur = (i + imgs.length) % imgs.length;
// 			const newEl = imgs[cur];

// 			// Failsafe: In case the user clicks multiple dots ahead very quickly
// 			if (newEl && newEl.dataset.src) {
// 				newEl.src = newEl.dataset.src;
// 				newEl.removeAttribute("data-src");
// 				if (newEl.tagName === "VIDEO") newEl.load();
// 			}

// 			if (newEl) newEl.classList.add("on");
// 			if (dots[cur]) dots[cur].classList.add("on");

// 			if (capEl) {
// 				const cap = imgs[cur].dataset.cap || imgs[cur].alt || "";
// 				const link = imgs[cur].dataset.link || "";
// 				if (link) capEl.innerHTML = `<a href="${link}" target="_blank">${cap}</a>`;
// 				else capEl.textContent = cap;
// 			}

// 			const clip = wrap.closest(".ss-clip");
// 			if (clip) {
// 				const id = clip.id.replace("-clip", "");
// 				if (SS[id]) requestAnimationFrame(() => setH(id, true));
// 			}

// 			// Trigger the background loader for the neighbors of the new slide
// 			preloadAdjacent(cur);
// 		}

// 		function startAutoPlay() {
// 			clearTimeout(timer);
// 			if (imgs.length <= 1) return;

// 			let currentMedia = imgs[cur];
// 			let duration = 5000;

// 			if (currentMedia.dataset.interval) {
// 				duration = parseInt(currentMedia.dataset.interval);
// 			} else if (wrap.dataset.interval) {
// 				duration = parseInt(wrap.dataset.interval);
// 			} else if (currentMedia.tagName === "VIDEO") {
// 				duration = 6000;
// 			} else {
// 				duration = 3500;
// 			}

// 			timer = setTimeout(() => {
// 				show(cur + 1);
// 				startAutoPlay();
// 			}, duration);
// 		}

// 		dots.forEach((d, i) =>
// 			d.addEventListener("click", (e) => {
// 				e.stopPropagation();
// 				show(i);
// 				startAutoPlay();
// 			}),
// 		);

// 		wrap.addEventListener("click", () => {
// 			const tag = imgs[cur]?.tagName;
// 			if (tag === "IMG" || tag === "VIDEO" || tag === "IFRAME") openLb(imgs, cur);
// 		});

// 		show(0);
// 		startAutoPlay();
// 	});
// }

/* ── CAROUSELS ── */
function initCarousels() {
	document.querySelectorAll(".cw").forEach((wrap) => {
		const inner = wrap.querySelector(".cw-inner");
		if (!inner) return;
		const imgs = inner.querySelectorAll(".cimg");
		if (!imgs.length) return;

		let node = wrap,
			dotsEl = null,
			capEl = null;
		for (let i = 0; i < 4; i++) {
			node = node.nextElementSibling;
			if (!node) break;
			if (!dotsEl && node.classList.contains("cdots")) dotsEl = node;
			if (!capEl && node.classList.contains("car-caption")) capEl = node;
		}

		const dots = dotsEl ? dotsEl.querySelectorAll(".cdot") : [];
		let cur = 0,
			timer = null;

		function preloadAdjacent(index) {
			const nextIdx = (index + 1) % imgs.length;
			const prevIdx = (index - 1 + imgs.length) % imgs.length;

			[nextIdx, prevIdx].forEach((idx) => {
				const el = imgs[idx];
				if (el && el.dataset.src) {
					el.src = el.dataset.src;

					const updateHeight = () => {
						const clip = wrap.closest(".ss-clip");
						if (clip) {
							const id = clip.id.replace("-clip", "");
							if (SS[id]) requestAnimationFrame(() => setH(id, true));
						}
					};

					if (el.tagName === "VIDEO") {
						el.addEventListener("loadeddata", updateHeight, {once: true});
						el.load();
					} else {
						el.addEventListener("load", updateHeight, {once: true});
					}

					el.removeAttribute("data-src");
				}
			});
		}

		// THE FIX: Added an isInit flag to handle the first load safely
		function show(i, isInit = false) {
			const targetCur = (i + imgs.length) % imgs.length;

			// THE FIX: Ignore clicks on the dot that is already active
			if (!isInit && targetCur === cur) return;

			const prevEl = imgs[cur];
			if (prevEl) {
				prevEl.classList.remove("on");
				if (prevEl.tagName === "VIDEO") prevEl.pause(); // Explicitly pause old video
			}
			if (dots[cur]) dots[cur].classList.remove("on");

			cur = targetCur;
			const newEl = imgs[cur];

			if (newEl && newEl.dataset.src) {
				newEl.src = newEl.dataset.src;
				newEl.removeAttribute("data-src");
				if (newEl.tagName === "VIDEO") newEl.load();
			}

			if (newEl) {
				newEl.classList.add("on");
				// THE FIX: Explicitly command the new video to play
				if (newEl.tagName === "VIDEO") {
					const playPromise = newEl.play();
					if (playPromise !== undefined) {
						playPromise.catch(() => {
							// Silently catch browser autoplay restrictions if still loading
						});
					}
				}
			}

			if (dots[cur]) dots[cur].classList.add("on");

			if (capEl) {
				const cap = imgs[cur].dataset.cap || imgs[cur].alt || "";
				const link = imgs[cur].dataset.link || "";
				if (link) capEl.innerHTML = `<a href="${link}" target="_blank">${cap}</a>`;
				else capEl.textContent = cap;
			}

			const clip = wrap.closest(".ss-clip");
			if (clip) {
				const id = clip.id.replace("-clip", "");
				if (SS[id]) requestAnimationFrame(() => setH(id, true));
			}

			preloadAdjacent(cur);
		}

		function startAutoPlay() {
			clearTimeout(timer);
			if (imgs.length <= 1) return;

			let currentMedia = imgs[cur];
			let duration = 5000;

			if (currentMedia.dataset.interval) {
				duration = parseInt(currentMedia.dataset.interval);
			} else if (wrap.dataset.interval) {
				duration = parseInt(wrap.dataset.interval);
			} else if (currentMedia.tagName === "VIDEO") {
				duration = 6000;
			} else {
				duration = 3500;
			}

			timer = setTimeout(() => {
				show(cur + 1);
				startAutoPlay();
			}, duration);
		}

		dots.forEach((d, i) =>
			d.addEventListener("click", (e) => {
				e.stopPropagation();
				show(i);
				startAutoPlay();
			}),
		);

		wrap.addEventListener("click", () => {
			const tag = imgs[cur]?.tagName;
			if (tag === "IMG" || tag === "VIDEO" || tag === "IFRAME") openLb(imgs, cur);
		});

		// Pass true for the initial load so it bypasses the redundancy check
		show(0, true);
		startAutoPlay();
	});
}

/* ── LIGHTBOX ── */
let lbImgs = [],
	lbCur = 0;
function openLb(imgs, startIdx) {
	lbImgs = Array.from(imgs);
	lbCur = startIdx;
	renderLb();
	document.getElementById("lb").classList.add("open");
}
function renderLb() {
	const media = lbImgs[lbCur];
	const cap = media.getAttribute("alt") || media.dataset.cap || "";
	const link = media.dataset.link || "";

	const lbImg = document.getElementById("lbimg");
	const lbVid = document.getElementById("lbvid");
	const lbFrame = document.getElementById("lbframe");

	lbImg.style.display = "none";
	lbVid.style.display = "none";
	lbFrame.style.display = "none";
	lbVid.pause();

	if (media.tagName === "VIDEO") {
		lbVid.style.display = "block";
		lbVid.src = media.src;
	} else if (media.tagName === "IFRAME") {
		lbFrame.style.display = "block";
		lbFrame.style.pointerEvents = "auto";
		lbFrame.src = media.src;
	} else {
		lbImg.style.display = "block";
		lbImg.src = media.src;
	}

	const capEl = document.getElementById("lbcap");
	if (link) capEl.innerHTML = `<a href="${link}" target="_blank">${cap}</a>`;
	else capEl.textContent = cap;
}

function closeLb() {
	document.getElementById("lb").classList.remove("open");
	lbImgs = [];
	const lbVid = document.getElementById("lbvid");
	if (lbVid) lbVid.pause();
}
function lbNav(dir) {
	if (!lbImgs.length) return;
	lbCur = (lbCur + dir + lbImgs.length) % lbImgs.length;
	renderLb();
}

document.addEventListener("keydown", (e) => {
	if (!document.getElementById("lb").classList.contains("open")) return;
	if (e.key === "ArrowRight") lbNav(1);
	if (e.key === "ArrowLeft") lbNav(-1);
	if (e.key === "Escape") closeLb();
});

/* ── CARD FADE-IN ── */
function initFadeIn() {
	Object.values(SS).forEach((s) => {
		if (s.slides && s.slides[s.cur]) {
			const card = s.slides[s.cur].querySelector(".ec");
			if (card) {
				setTimeout(() => card.classList.add("visible"), 50);
			}
		}
	});
}

/* ── STAT COUNT-UP ── */
function initCountUp() {
	const obs = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (!entry.isIntersecting) return;
				entry.target.querySelectorAll("[data-count]").forEach((el) => {
					const target = parseInt(el.dataset.count);
					const suffix = el.dataset.suffix || "";
					const dur = 1200,
						start = performance.now();
					const tick = (now) => {
						const t = Math.min((now - start) / dur, 1);
						const ease = 1 - Math.pow(1 - t, 3);
						el.textContent = Math.round(ease * target) + suffix;
						if (t < 1) requestAnimationFrame(tick);
					};
					requestAnimationFrame(tick);
				});
				obs.unobserve(entry.target);
			});
		},
		{threshold: 0.3},
	);
	document.querySelectorAll(".srow").forEach((r) => obs.observe(r));
}

/* ── PAGE ACTIVE LINK HELPERS ── */
function applyPageActiveState(currentPath, links) {
	links.forEach((link) => {
		link.classList.remove("active");
		const linkText = link.textContent.trim().toLowerCase();
		const isPortfolioPath = currentPath.includes("portfolio") || currentPath.includes("photography");

		if (currentPath.includes("blog") && linkText === "blog") link.classList.add("active");
		else if (currentPath.includes("resume") && linkText === "resume") link.classList.add("active");
		else if (isPortfolioPath && linkText.includes("portfolio")) link.classList.add("active");
		else if ((currentPath.endsWith("/") || currentPath.includes("index") || currentPath.endsWith("site")) && linkText === "home")
			link.classList.add("active");
	});
}

/* ── DYNAMIC NAVBAR LOADER ── */
// function loadNav() {
// 	return new Promise((resolve) => {
// 		const placeholder = document.getElementById("nav-placeholder");
// 		const shroud = document.getElementById("blur-page");

// 		if (!placeholder) {
// 			initNavHoverStates();
// 			resolve();
// 			return;
// 		}

// 		fetch("nav.html")
// 			.then((response) => response.text())
// 			.then((data) => {
// 				const parser = new DOMParser();
// 				const doc = parser.parseFromString(data, "text/html");
// 				const header = doc.querySelector("header");

// 				if (header) {
// 					const currentPath = window.location.pathname.toLowerCase();

// 					applyPageActiveState(currentPath, header.querySelectorAll(".ni"));
// 					applyPageActiveState(currentPath, document.querySelectorAll("footer .fnav a"));

// 					placeholder.replaceWith(header);
// 					initNavHoverStates();

// 					const navbox = header.querySelector(".navbox");
// 					if (navbox && shroud) {
// 						navbox.addEventListener("mouseenter", () => {
// 							shroud.classList.add("visible");
// 						});
// 						navbox.addEventListener("mouseleave", () => {
// 							shroud.classList.remove("visible");
// 						});
// 					}

// 					const dropdownParents = header.querySelectorAll(".ndrop");
// 					dropdownParents.forEach((drop) => {
// 						const mainLink = drop.querySelector(":scope > .ni");
// 						if (!mainLink) return;
// 						mainLink.addEventListener("click", (e) => {
// 							if (window.innerWidth > 1050) return;
// 							if (!drop.classList.contains("open")) {
// 								e.preventDefault();
// 								dropdownParents.forEach((other) => {
// 									if (other !== drop) other.classList.remove("open");
// 								});
// 								drop.classList.add("open");
// 							}
// 						});
// 					});

// 					document.addEventListener("click", (e) => {
// 						if (window.innerWidth > 1050) return;
// 						if (e.target.closest(".ndrop")) return;
// 						dropdownParents.forEach((other) => other.classList.remove("open"));
// 					});
// 				}
// 				resolve();
// 			})
// 			.catch((error) => {
// 				console.error("Error loading navigation:", error);
// 				resolve();
// 			});
// 	});
// }
/* ── DYNAMIC NAVBAR LOADER ── */
function loadNav() {
	return new Promise((resolve) => {
		const placeholder = document.getElementById("nav-placeholder");
		let header = document.getElementById("hdr"); // Will exist if inline script injected it
		const shroud = document.getElementById("blur-page");

		// Helper function to attach all event listeners once the nav is in the DOM
		function setupNav(hdr) {
			const currentPath = window.location.pathname.toLowerCase();
			applyPageActiveState(currentPath, hdr.querySelectorAll(".ni"));
			applyPageActiveState(currentPath, document.querySelectorAll("footer .fnav a"));

			initNavHoverStates();

			const navbox = hdr.querySelector(".navbox");
			if (navbox && shroud) {
				navbox.addEventListener("mouseenter", () => shroud.classList.add("visible"));
				navbox.addEventListener("mouseleave", () => shroud.classList.remove("visible"));
			}

			const dropdownParents = hdr.querySelectorAll(".ndrop");
			dropdownParents.forEach((drop) => {
				const mainLink = drop.querySelector(":scope > .ni");
				if (!mainLink) return;
				mainLink.addEventListener("click", (e) => {
					if (window.innerWidth > 1050) return;
					if (!drop.classList.contains("open")) {
						e.preventDefault();
						dropdownParents.forEach((other) => {
							if (other !== drop) other.classList.remove("open");
						});
						drop.classList.add("open");
					}
				});
			});

			// document.addEventListener("click", (e) => {
			// 	if (window.innerWidth > 1050) return;
			// 	if (e.target.closest(".ndrop")) return;
			// 	dropdownParents.forEach((other) => other.classList.remove("open"));
			// });

			// document.addEventListener("click", (e) => {
			// 	if (window.innerWidth > 1050) return;

			// 	// Force close the dropdown if a sub-link is clicked
			// 	if (e.target.closest(".dd-lnk")) {
			// 		dropdownParents.forEach((other) => other.classList.remove("open"));
			// 		return;
			// 	}

			// 	if (e.target.closest(".ndrop")) return;
			// 	dropdownParents.forEach((other) => other.classList.remove("open"));
			// });

			// // 1. Standard global click to close menus when clicking outside
			// document.addEventListener("click", (e) => {
			// 	if (window.innerWidth > 1050) return;
			// 	if (e.target.closest(".ndrop")) return;
			// 	dropdownParents.forEach((other) => other.classList.remove("open"));
			// });

			// // 2. Direct click listeners on sub-links to bypass the "return false;" block
			// hdr.querySelectorAll(".dd-lnk").forEach((link) => {
			// 	link.addEventListener("click", () => {
			// 		if (window.innerWidth <= 1050) {
			// 			dropdownParents.forEach((drop) => {
			// 				drop.classList.remove("open"); // Strip the open class

			// 				// Instantly vanish the dropdown to bypass CSS transition lag
			// 				const navDd = drop.querySelector(".nav-dd");
			// 				if (navDd) {
			// 					navDd.style.display = "none";
			// 					// Restore default display state after the navbar has hidden
			// 					setTimeout(() => (navDd.style.display = ""), 300);
			// 				}
			// 			});
			// 		}
			// 	});
			// });

			// // 1. Standard global click to close menus when clicking outside
			// document.addEventListener("click", (e) => {
			// 	if (window.innerWidth > 1050) return;
			// 	if (e.target.closest(".ndrop")) return;
			// 	dropdownParents.forEach((drop) => {
			// 		drop.classList.remove("open");
			// 		const navDd = drop.querySelector(".nav-dd");
			// 		if (navDd) {
			// 			navDd.style.setProperty("display", "none", "important");
			// 			setTimeout(() => navDd.style.removeProperty("display"), 300);
			// 		}
			// 	});
			// });

			// // 2. Direct click listeners on sub-links to bypass the "return false;" block
			// hdr.querySelectorAll(".dd-lnk").forEach((link) => {
			// 	link.addEventListener("click", () => {
			// 		if (window.innerWidth <= 1050) {
			// 			dropdownParents.forEach((drop) => {
			// 				drop.classList.remove("open");

			// 				// Override the !important CSS rule to instantly vanish the dropdown
			// 				const navDd = drop.querySelector(".nav-dd");
			// 				if (navDd) {
			// 					navDd.style.setProperty("display", "none", "important");
			// 					setTimeout(() => navDd.style.removeProperty("display"), 300);
			// 				}
			// 			});
			// 		}
			// 	});
			// });

			// 1. Standard global click to close menus when clicking outside
			document.addEventListener("click", (e) => {
				if (window.innerWidth > 1050) return;
				if (e.target.closest(".ndrop")) return;
				dropdownParents.forEach((drop) => drop.classList.remove("open"));
			});

			// 2. Direct click listeners on sub-links
			// hdr.querySelectorAll(".dd-lnk").forEach((link) => {
			// 	link.addEventListener("click", () => {
			// 		if (window.innerWidth <= 1050) {
			// 			dropdownParents.forEach((drop) => drop.classList.remove("open"));
			// 		}
			// 	});
			// });

			// 2. Direct click listeners on sub-links
			hdr.querySelectorAll(".dd-lnk").forEach((link) => {
				link.addEventListener("click", () => {
					if (window.innerWidth <= 1050) {
						dropdownParents.forEach((drop) => drop.classList.remove("open"));

						// Instantly remove the blur effect so it doesn't linger over the page
						if (shroud) shroud.classList.remove("visible");
					}
				});
			});

			resolve();
		}

		// SCENARIO 1: The inline script already injected the cached nav instantly
		if (header && !placeholder) {
			setupNav(header);

			// Fetch silently in the background to ensure the cache stays up-to-date
			fetch("nav.html")
				.then((res) => res.text())
				.then((data) => {
					const parser = new DOMParser();
					const doc = parser.parseFromString(data, "text/html");
					const fetchedHeader = doc.querySelector("header");
					if (fetchedHeader) sessionStorage.setItem("rawNavHTML", fetchedHeader.outerHTML);
				})
				.catch(() => {});
			return;
		}

		// SCENARIO 2: First load (no cache available yet). Must fetch over network.
		fetch("nav.html")
			.then((response) => response.text())
			.then((data) => {
				const parser = new DOMParser();
				const doc = parser.parseFromString(data, "text/html");
				header = doc.querySelector("header");

				if (header) {
					// Save to cache for the next page load!
					sessionStorage.setItem("rawNavHTML", header.outerHTML);

					if (placeholder) {
						placeholder.replaceWith(header);
					}
					setupNav(header);
				} else {
					resolve();
				}
			})
			.catch((error) => {
				console.error("Error loading navigation:", error);
				resolve();
			});
	});
}

/* ── COLLAPSIBLE EC CARDS ── */
// function initCollapsibleCards() {
// 	document.querySelectorAll('.ec.collapsible').forEach(card => {
// 		// Define default height or grab the override from the HTML tag
// 		const defaultHeight = 450;
// 		const h = card.dataset.collapseHeight || defaultHeight;

// 		card.style.setProperty('--collapse-h', h + 'px');
// 		card.classList.add('is-collapsed');

// 		// Create the overlay and button
// 		const overlay = document.createElement('div');
// 		overlay.className = 'ec-collapse-overlay';
// 		overlay.innerHTML = `<button class="ec-show-more-btn">Show More <i class="fas fa-chevron-down" style="margin-left: 5px;"></i></button>`;

// 		const btn = overlay.querySelector('.ec-show-more-btn');
// 		btn.addEventListener('click', function(e) {
// 			e.stopPropagation();
// 			const isCol = card.classList.contains('is-collapsed');

// 			if (isCol) {
// 				card.classList.remove('is-collapsed');
// 				card.classList.add('is-expanded');
// 				btn.innerHTML = `Show Less <i class="fas fa-chevron-up" style="margin-left: 5px;"></i>`;
// 			} else {
// 				card.classList.add('is-collapsed');
// 				card.classList.remove('is-expanded');
// 				btn.innerHTML = `Show More <i class="fas fa-chevron-down" style="margin-left: 5px;"></i>`;

// 				// Smoothly scroll back into view if the user scrolled far down the expanded card
// 				const rect = card.getBoundingClientRect();
// 				const navH = window.innerWidth > 1050 ? 75 : 50;
// 				if (rect.top < navH) {
// 					window.scrollBy({ top: rect.top - navH - 20, behavior: 'smooth' });
// 				}
// 			}

// 			// Force the layout to update, then tell the slideshow wrapper to transition to the new height
// 			const clip = card.closest('.ss-clip');
// 			if (clip) {
// 				const ssId = clip.id.replace('-clip', '');
// 				void card.offsetHeight; // Flushes CSS changes
// 				requestAnimationFrame(() => setH(ssId, true));
// 			}
// 		});

// 		card.appendChild(overlay);
// 	});
// }

/* ── COLLAPSIBLE EC CARDS ── */
function initCollapsibleCards() {
	document.querySelectorAll(".ec").forEach((card) => {
		// If you didn't manually tag it as 'collapsible' for desktop, tag it for mobile-only
		const isAlwaysCollapsible = card.classList.contains("collapsible");
		if (!isAlwaysCollapsible) {
			card.classList.add("mobile-collapsible");
		}

		// Define default height or grab the override from the HTML tag
		const defaultHeight = 450;
		const h = card.dataset.collapseHeight || defaultHeight;

		card.style.setProperty("--collapse-h", h + "px");
		card.classList.add("is-collapsed");

		// Create the overlay and button
		const overlay = document.createElement("div");
		overlay.className = "ec-collapse-overlay";
		overlay.innerHTML = `<button class="ec-show-more-btn">Show More <i class="fas fa-chevron-down" style="margin-left: 5px;"></i></button>`;

		const btn = overlay.querySelector(".ec-show-more-btn");
		btn.addEventListener("click", function (e) {
			e.stopPropagation();
			const isCol = card.classList.contains("is-collapsed");

			if (isCol) {
				card.classList.remove("is-collapsed");
				card.classList.add("is-expanded");
				btn.innerHTML = `Show Less <i class="fas fa-chevron-up" style="margin-left: 5px;"></i>`;
			} else {
				card.classList.add("is-collapsed");
				card.classList.remove("is-expanded");
				btn.innerHTML = `Show More <i class="fas fa-chevron-down" style="margin-left: 5px;"></i>`;

				// Smoothly scroll back into view if the user scrolled far down the expanded card
				const rect = card.getBoundingClientRect();
				const navH = window.innerWidth > 1050 ? 75 : 50;
				if (rect.top < navH) {
					window.scrollBy({top: rect.top - navH - 20, behavior: "smooth"});
				}
			}

			// Force the layout to update, then tell the slideshow wrapper to transition
			const clip = card.closest(".ss-clip");
			if (clip) {
				const ssId = clip.id.replace("-clip", "");
				void card.offsetHeight;
				requestAnimationFrame(() => setH(ssId, true));
			}
		});

		card.appendChild(overlay);
	});
}
/* ── TOUCH SWIPE NAVIGATION FOR MAIN CARDS ONLY ── */
// function initSwipeNav() {
// 	Object.keys(SS).forEach(id => {
// 		const s = SS[id];
// 		if (!s || !s.clip) return;

// 		let touchStartX = 0;
// 		let touchStartY = 0;

// 		s.clip.addEventListener('touchstart', e => {
// 			if (e.touches.length > 1) return; // Ignore multi-touch/pinches
// 			touchStartX = e.changedTouches[0].screenX;
// 			touchStartY = e.changedTouches[0].screenY;
// 		}, { passive: true });

// 		s.clip.addEventListener('touchend', e => {
// 			const touchEndX = e.changedTouches[0].screenX;
// 			const touchEndY = e.changedTouches[0].screenY;

// 			const diffX = touchStartX - touchEndX;
// 			const diffY = touchStartY - touchEndY;

// 			// Thresholds: minimum 50px swipe, and must be mostly horizontal
// 			if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
// 				if (diffX > 0) {
// 					ar(id, 1); // Swiped Left -> Next Slide
// 				} else {
// 					ar(id, -1); // Swiped Right -> Prev Slide
// 				}
// 			}
// 		}, { passive: true });
// 	});
// }

/* ── TOUCH & TRACKPAD SWIPE NAVIGATION FOR MAIN CARDS ── */
function initSwipeNav() {
	Object.keys(SS).forEach((id) => {
		const s = SS[id];
		if (!s || !s.clip) return;

		// 1. MOBILE TOUCH LOGIC
		let touchStartX = 0;
		let touchStartY = 0;

		s.clip.addEventListener(
			"touchstart",
			(e) => {
				if (e.touches.length > 1) return;
				touchStartX = e.changedTouches[0].screenX;
				touchStartY = e.changedTouches[0].screenY;
			},
			{passive: true},
		);

		s.clip.addEventListener(
			"touchend",
			(e) => {
				const touchEndX = e.changedTouches[0].screenX;
				const touchEndY = e.changedTouches[0].screenY;

				const diffX = touchStartX - touchEndX;
				const diffY = touchStartY - touchEndY;

				if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
					if (diffX > 0)
						ar(id, 1); // Swiped Left -> Next
					else ar(id, -1); // Swiped Right -> Prev
				}
			},
			{passive: true},
		);

		// 2. DESKTOP TRACKPAD LOGIC
		let isTrackpadSwiping = false;

		s.clip.addEventListener(
			"wheel",
			(e) => {
				// If we recently triggered a swipe, ignore further scroll events
				// to prevent rapid-fire skipping while the slide is animating.
				if (isTrackpadSwiping) return;

				// Check if the scroll is predominantly horizontal and forceful enough
				if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 25) {
					isTrackpadSwiping = true;

					if (e.deltaX > 0) {
						ar(id, 1); // Scrolled Right (2-finger swipe left) -> Next
					} else {
						ar(id, -1); // Scrolled Left (2-finger swipe right) -> Prev
					}

					// Lock the trackpad for 600ms (gives time for the CSS animation to finish)
					setTimeout(() => {
						isTrackpadSwiping = false;
					}, 400);
					// adjust to finetune scroll left right delay
				}
			},
			{passive: true},
		);
	});
}

/* ── UNIFIED INITIALIZATION ── */
function unifiedInit() {
	// THE FIX: Carousels MUST run before initSS() to swap data-src back to src.
	// Otherwise initSS measures images with 0 height, creating black screens!
	initCarousels();
	initCollapsibleCards();
	initSS();
	initSwipeNav();
	initFadeIn();
	initCountUp();

	// Load the iframe safely without blocking the main thread
	// const iframe = document.getElementById("timeline-iframe");
	// if (iframe && iframe.dataset.src) {
	// 	setTimeout(() => {
	// 		iframe.onload = () => iframe.classList.add("loaded");
	// 		iframe.src = iframe.dataset.src;
	// 	}, 500);
	// }

	const iframe = document.getElementById("timeline-iframe");
	if (iframe) {
		iframe.onload = () => iframe.classList.add("loaded");
		// If already loaded (e.g. from cache), trigger it manually
		if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
			iframe.classList.add("loaded");
		}
	}

	// Wait for the Nav to load BEFORE handling URLs and scroll tracking
	loadNav().then(() => {
		requestAnimationFrame(() => {
			Object.keys(TABS).forEach((id) => {
				calcW(id);
				setH(id, false);
			});
			handleURL();

			window.addEventListener(
				"scroll",
				() => {
					if (!isScrollTicking) {
						window.requestAnimationFrame(() => {
							runCoreScrollTasks(window.scrollY);
							isScrollTicking = false;
						});
						isScrollTicking = true;
					}
				},
				{passive: true},
			);

			// Force an initial update
			runCoreScrollTasks(window.scrollY);
		});
	});
}

if (document.readyState === "complete" || document.readyState === "interactive") {
	unifiedInit();
} else {
	document.addEventListener("DOMContentLoaded", unifiedInit);
}

/* ══════════════════════════════════════════════════════════ */
/* ══ PRELOADER LOGIC                                      ── */
/* ══════════════════════════════════════════════════════════ */
function buildStarPath({cx = 477.5, cy = 477.5, points = 7, outer = 380, length = 0.32, round = 0.18, rotation = 0}) {
	points = Math.max(3, Math.round(points));
	outer = Math.max(0, outer);
	length = Math.min(1, Math.max(0, length));
	round = Math.min(1, Math.max(0, round));
	rotation = Number(rotation) || 0;

	if (length === 0) {
		const r = outer;
		return `M ${cx - r} ${cy} a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
	}

	const inner = outer * Math.max(0, 1 - length);
	const step = Math.PI / points;
	const startAngle = Math.PI / 2 - (rotation * Math.PI) / 180;
	const vertices = [];

	for (let i = 0; i < points * 2; i += 1) {
		const angle = startAngle + i * step;
		const radius = i % 2 === 0 ? outer : inner;
		vertices.push([cx + Math.cos(angle) * radius, cy - Math.sin(angle) * radius]);
	}

	if (round <= 0) {
		return (
			vertices.reduce((path, [x, y], index) => {
				return `${path}${index === 0 ? "M" : "L"} ${x.toFixed(3)} ${y.toFixed(3)}`;
			}, "") + " Z"
		);
	}

	const smooth = round * 2.5;
	const pointsWithHandles = vertices.map((current, idx, list) => {
		const previous = list[(idx + list.length - 1) % list.length];
		const next = list[(idx + 1) % list.length];
		return {
			point: current,
			start: [current[0] + (previous[0] - current[0]) * smooth, current[1] + (previous[1] - current[1]) * smooth],
			end: [current[0] + (next[0] - current[0]) * smooth, current[1] + (next[1] - current[1]) * smooth],
		};
	});

	let path = "";
	for (let i = 0; i < pointsWithHandles.length; i += 1) {
		const {point, start} = pointsWithHandles[i];
		const next = pointsWithHandles[(i + 1) % pointsWithHandles.length];
		if (i === 0) {
			path += `M ${start[0].toFixed(3)} ${start[1].toFixed(3)}`;
		}
		path += ` Q ${point[0].toFixed(3)} ${point[1].toFixed(3)} ${next.start[0].toFixed(3)} ${next.start[1].toFixed(3)}`;
	}
	return path + " Z";
}

function initPreloaderStars() {
	document.querySelectorAll(".preloader-svg .blob").forEach((node) => {
		const dataset = node.dataset;
		const starPath = buildStarPath({
			cx: parseFloat(dataset.starCx) || 477.5,
			cy: parseFloat(dataset.starCy) || 477.5,
			points: parseFloat(dataset.starPoints) || 7,
			outer: parseFloat(dataset.starOuter) || 380,
			length: parseFloat(dataset.starLength) || 0.32,
			round: parseFloat(dataset.starRound) || 0.18,
			rotation: parseFloat(dataset.starRotation) || 0,
		});
		node.setAttribute("d", starPath);
	});
}

initPreloaderStars();

const preloader = document.getElementById("site-preloader");

if (preloader) {
	if (!sessionStorage.getItem("preloaderSeen")) {
		sessionStorage.setItem("preloaderSeen", "true");

		window.addEventListener("load", () => {
			setTimeout(() => {
				preloader.classList.add("hidden");
				setTimeout(() => preloader.remove(), 1000);
			}, 2400);
		});

		setTimeout(() => {
			if (!preloader.classList.contains("hidden")) {
				preloader.classList.add("hidden");
				setTimeout(() => preloader.remove(), 1000);
			}
		}, 5000);
	} else {
		preloader.remove();
	}
}
