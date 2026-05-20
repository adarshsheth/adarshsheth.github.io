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
			fr.style.transform = `translateX(-${SS[id].cur * SS[id].w}px)`;
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

function sw(id, idx, section, doScroll = true) {
	const s = SS[id];
	if (!s) return;
	const prev = s.cur;

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

	const prevSlide = s.slides[prev];
	if (prevSlide) {
		const prevCard = prevSlide.querySelector(".ec");
		if (prevCard) prevCard.classList.remove("visible");
		prevSlide.style.visibility = "hidden";
	}

	const newSlide = s.slides[idx];
	if (newSlide) {
		newSlide.style.visibility = "visible";
		const newCard = newSlide.querySelector(".ec");
		if (newCard) {
			newCard.classList.remove("visible");
			void newCard.offsetWidth;
			newCard.classList.add("visible");
		}
	}

	s.fr.style.transform = `translateX(-${idx * s.w}px)`;
	requestAnimationFrame(() => setH(id, true));

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
	if (!s || !SMAP[s]) return;
	if (window._lockNav) window._lockNav();
	if (window._hideNav) window._hideNav();
	const {ss, i} = SMAP[s];
	sw(ss, i, s, true);
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
	if (defaultSlide) u.searchParams.set("section", defaultSlide);
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

/* ── UNIFIED SCROLL ENGINE (NAV & SIDEBAR) ─────────────────────────── */
let isScrollTicking = false;
let cachedAvailableSections = null;

const NAV_SCROLL_DOWN_PX = 10;
const NAV_SCROLL_UP_PX = 30;
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

	window._hideNav = function () {
		if (!navHid) {
			hdr.style.transition = "transform 0.28s cubic-bezier(0.4, 0, 0.8, 1)";
			hdr.style.transform = "translateY(-150%)";
			navHid = true;
			navDelta = 0;
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
	} else if (sy <= 75) {
		window._showNav();
		navLy = sy;
	} else {
		const d = sy - navLy;
		if (d > 0) {
			navDelta = navDelta > 0 ? navDelta + d : d;
			if (!navHid && navDelta >= NAV_SCROLL_DOWN_PX) window._hideNav();
		} else if (d < 0) {
			navDelta = navDelta < 0 ? navDelta + d : d;
			if (navHid && -navDelta >= NAV_SCROLL_UP_PX) window._showNav();
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
		coverWrap.style.transform = `translateY(${sy * 0.35}px)`;
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
		];
		cachedAvailableSections = allSections.filter((s) => document.getElementById(s.id));
	}

	let activeK = null;
	const path = window.location.pathname;
	const anchor_loc = path.endsWith("index.html") || path === "/" || path.endsWith("/") ? 0.6 : 0.45;
	const triggerPoint = winH * anchor_loc;

	cachedAvailableSections.forEach(({id, k}) => {
		const el = document.getElementById(id);
		if (el && el.getBoundingClientRect().top < triggerPoint) {
			activeK = k;
		}
	});

	if (sy < 400 && cachedAvailableSections.length > 0) {
		updateURLd(null);
		activeK = cachedAvailableSections[0].k;
	}

	if (activeK) {
		document.querySelectorAll(".sbn").forEach((a) => {
			const isMatch = a.dataset.k === activeK || (a.dataset.k === "tamu" && activeK === "dvhs");
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

/* ── DYNAMIC NAVBAR LOADER ── */
function loadNav() {
	return new Promise((resolve) => {
		const placeholder = document.getElementById("nav-placeholder");
		const shroud = document.getElementById("blur-page");

		if (!placeholder) {
			initNavHoverStates();
			resolve();
			return;
		}

		fetch("nav.html")
			.then((response) => response.text())
			.then((data) => {
				const parser = new DOMParser();
				const doc = parser.parseFromString(data, "text/html");
				const header = doc.querySelector("header");

				if (header) {
					const currentPath = window.location.pathname.toLowerCase();

					header.querySelectorAll(".ni").forEach((link) => {
						link.classList.remove("active");
						const linkText = link.textContent.trim().toLowerCase();

						if (currentPath.includes("blog") && linkText === "blog") link.classList.add("active");
						else if (currentPath.includes("resume") && linkText === "resume") link.classList.add("active");
						else if (currentPath.includes("portfolio") && linkText.includes("portfolio")) link.classList.add("active");
						else if ((currentPath.endsWith("/") || currentPath.includes("index") || currentPath.endsWith("site")) && linkText === "home")
							link.classList.add("active");
					});

					placeholder.replaceWith(header);
					initNavHoverStates();

					const navbox = header.querySelector(".navbox");
					if (navbox && shroud) {
						navbox.addEventListener("mouseenter", () => {
							shroud.classList.add("visible");
						});
						navbox.addEventListener("mouseleave", () => {
							shroud.classList.remove("visible");
						});
					}
				}
				resolve();
			})
			.catch((error) => {
				console.error("Error loading navigation:", error);
				resolve();
			});
	});
}

/* ── UNIFIED INITIALIZATION ── */
function unifiedInit() {
	// THE FIX: Carousels MUST run before initSS() to swap data-src back to src.
	// Otherwise initSS measures images with 0 height, creating black screens!
	initCarousels();
	initSS();
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
