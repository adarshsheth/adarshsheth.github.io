/* ── CUSTOM CURSOR (disabled – set true to enable) ── */
const ENABLE_CUSTOM_CURSOR = false;
/* ── DISABLE GLOBAL CONTEXT MENU ON IMAGES & LINKS (MOBILE ONLY) ── */
document.addEventListener('contextmenu', (e) => {
    // Only execute if the screen width falls within your mobile breakpoint
    if (window.innerWidth <= 1050) {
        // Check if the item being long-pressed is an image, link, or card
        if (e.target.tagName === 'IMG' || e.target.closest('a') || e.target.closest('.ec-card')) {
            e.preventDefault();
        }
    }
});

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

function scrollToSec(id) {
	if (window._lockNav) window._lockNav();

	if (id === "top") {
		if (window._showNav) window._showNav(); // SHOW nav if going to the top
		window.scrollTo({top: 0, behavior: "smooth"}); // Changed from 75 to 0 to reach true top
		return;
	}

	if (window._hideNav) window._hideNav(); // HIDE nav for all other sections
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
		// Automatically build the sections array by reading the sidebar links
		const sidebarLinks = document.querySelectorAll("#sb-nav .sbn");

		const allSections = Array.from(sidebarLinks).map((link) => {
			return {
				// Strip the '#' from the href to get the raw element ID
				id: link.getAttribute("href").replace("#", ""),
				k: link.getAttribute("data-k"),
			};
		});

		// Filter out any sections that don't actually exist on the current page
		cachedAvailableSections = allSections.filter((s) => document.getElementById(s.id));
	}

	let activeK = null;
	// const path = window.location.pathname;
	// const anchor_loc = path.endsWith("index.html") || path === "/" || path.endsWith("/") ? 0.6 : 0.45;
	const path = window.location.pathname;
	// Lower threshold (0.1) for photography, standard (0.45) for others
	const anchor_loc = path.includes("photography") ? 0.3 : path.endsWith("index.html") || path === "/" || path.endsWith("/") ? 0.3 : 0.45;
	const triggerPoint = winH * anchor_loc;

	cachedAvailableSections.forEach(({id, k}) => {
		const el = document.getElementById(id);
		if (el && el.getBoundingClientRect().top < triggerPoint) {
			activeK = k;
		}
	});

	if (sy < 100 && cachedAvailableSections.length > 0) {
		//400 initially for sy<
		updateURLd(null);
		activeK = cachedAvailableSections[0].k;
	}
	// bottom of page edge case
	// if (window.innerHeight + Math.ceil(sy) >= document.documentElement.scrollHeight - 50) {
	// 	activeK = cachedAvailableSections[cachedAvailableSections.length - 1].k;
	// }
	// bottom of page edge case
	if (window.innerHeight + Math.ceil(sy) >= document.documentElement.scrollHeight - 50) {
		if (cachedAvailableSections.length > 0) {
			activeK = cachedAvailableSections[cachedAvailableSections.length - 1].k;
		}
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

		let wasSwiped = false; // Prevents opening the lightbox when you just meant to swipe

		wrap.addEventListener("click", (e) => {
			if (wasSwiped) {
				e.preventDefault();
				return;
			}
			const tag = imgs[cur]?.tagName;
			if (tag === "IMG" || tag === "VIDEO" || tag === "IFRAME") openLb(imgs, cur);
		});

		// --- ADDED: TOUCH & TRACKPAD SWIPE NAVIGATION ---

		// 1. Mobile Touch Swipe
		let touchStartX = 0;
		let touchStartY = 0;

		wrap.addEventListener(
			"touchstart",
			(e) => {
				if (e.touches.length > 1) return;
				touchStartX = e.changedTouches[0].screenX;
				touchStartY = e.changedTouches[0].screenY;
			},
			{passive: true},
		);

		wrap.addEventListener(
			"touchend",
			(e) => {
				const touchEndX = e.changedTouches[0].screenX;
				const touchEndY = e.changedTouches[0].screenY;
				const diffX = touchStartX - touchEndX;
				const diffY = touchStartY - touchEndY;

				// Thresholds: minimum 40px swipe, and must be mostly horizontal
				if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
					wasSwiped = true;

					if (diffX > 0)
						show(cur + 1); // Swiped left -> next image
					else show(cur - 1); // Swiped right -> prev image

					startAutoPlay();

					// Reset the swipe lock shortly after the click event fires
					setTimeout(() => {
						wasSwiped = false;
					}, 100);
				}
			},
			{passive: true},
		);

		// 2. Desktop Trackpad Swipe
		let isTrackpadSwiping = false;

		wrap.addEventListener(
			"wheel",
			(e) => {
				if (isTrackpadSwiping) return;

				// Ensure the scroll is horizontal and forceful enough
				if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 25) {
					isTrackpadSwiping = true;

					if (e.deltaX > 0)
						show(cur + 1); // Scrolled right -> next image
					else show(cur - 1); // Scrolled left -> prev image

					startAutoPlay();

					// Lock the trackpad for 500ms so you don't rapid-fire skip through images
					setTimeout(() => {
						isTrackpadSwiping = false;
					}, 500);
				}
			},
			{passive: true},
		);

		// ------------------------------------------------

		// Pass true for the initial load so it bypasses the redundancy check
		show(0, true);
		startAutoPlay();
	});
}

/* ── LIGHTBOX ── */
let lbImgs = [],
	lbCur = 0;
// function openLb(imgs, startIdx) {
// 	lbImgs = Array.from(imgs);
// 	lbCur = startIdx;
// 	renderLb();
// 	document.getElementById("lb").classList.add("open");
// }
function openLb(imgs, startIdx) {
	lbImgs = Array.from(imgs);
	lbCur = startIdx;
	renderLb();
	document.getElementById("lb").classList.add("open");
	document.body.style.overflow = "hidden"; // Adds scroll lock
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

	// FIX 1: Grab the URL from data-src if the lazy-loaded src doesn't exist yet
	let rawSrc = media.dataset.src || media.getAttribute("src");

	// Helper function to upgrade Cloudinary URLs for both images and videos
	function getHighResUrl(url) {
		if (url && url.includes("res.cloudinary.com") && url.includes("w_")) {
			let screenWidth = Math.min(Math.round(window.innerWidth * (window.devicePixelRatio || 1)), 2500);
			return url.replace(/w_\d+/, `w_${screenWidth}`);
		}
		return url;
	}

	if (media.tagName === "VIDEO") {
		lbVid.style.display = "block";

		// FIX 2: Apply the high-res function to the video URL
		lbVid.src = getHighResUrl(rawSrc);

		// Check for a poster (thumbnail) and upgrade that too
		let rawPoster = media.dataset.poster || media.getAttribute("poster");
		if (rawPoster) {
			lbVid.poster = getHighResUrl(rawPoster);
		}
	} else if (media.tagName === "IFRAME") {
		lbFrame.style.display = "block";
		lbFrame.style.pointerEvents = "auto";
		lbFrame.src = rawSrc;
	} else {
		lbImg.style.display = "block";

		// const ratio = media.naturalWidth / media.naturalHeight || 1;
		// lbImg.style.setProperty("--ratio", ratio);

		// Instantly show the low-res image (using the rawSrc fallback)
		lbImg.src = rawSrc;

		// Prepare the high-res Cloudinary URL
		let hdSrc = getHighResUrl(rawSrc);

		// Only run the background loader if the URL actually changed
		if (hdSrc !== rawSrc) {
			const hdLoader = new Image();
			hdLoader.onload = () => {
				if (lbImgs[lbCur] === media) {
					lbImg.src = hdSrc;
				}
			};
			hdLoader.src = hdSrc;
		}
	}

	const capEl = document.getElementById("lbcap");
	if (link) capEl.innerHTML = `<a href="${link}" target="_blank">${cap}</a>`;
	else capEl.textContent = cap;
}

function closeLb() {
	document.getElementById("lb").classList.remove("open");
	document.body.style.overflow = ""; // Removes scroll lock
	lbImgs = [];
	const lbVid = document.getElementById("lbvid");
	if (lbVid) lbVid.pause();
}
function lbNav(dir) {
	if (!lbImgs.length) return;
	lbCur = (lbCur + dir + lbImgs.length) % lbImgs.length;
	renderLb();
}

// document.addEventListener("keydown", (e) => {
// 	if (!document.getElementById("lb").classList.contains("open")) return;
// 	if (e.key === "ArrowRight") lbNav(1);
// 	if (e.key === "ArrowLeft") lbNav(-1);
// 	if (e.key === "Escape") closeLb();
// });
document.addEventListener("keydown", (e) => {
	if (!document.getElementById("lb").classList.contains("open")) return;

	// If the inner lightbox is open, consume the event so outer lightboxes ignore it
	// const currentPath = window.location.pathname.toLowerCase();
	const isPhotography = window.location.pathname.toLowerCase().includes("photography");
	if ((e.key === "Escape" || e.key === "ArrowRight" || e.key === "ArrowLeft") && !isPhotography) {
		e.stopImmediatePropagation();
	}

	if (e.key === "ArrowRight") lbNav(1);
	if (e.key === "ArrowLeft") lbNav(-1);
	if (e.key === "Escape") closeLb();
});


/* ── SKILLS SECTION PARSER ── */
/* ── SKILLS SECTION PARSER ── */
async function initSkills() {
	const container = document.getElementById("skills-container");
	if (!container) return;

	const catMap = {
		tools: "Tools",
		des: "Design",
		sys: "Systems / Methodologies",
		hw: "Hardware",
		swe: "Software Engineering",
		soft: "Soft Skills",
		gen: "General",
	};

	const skillsData = {};

	// 1. Try to parse badges from the current page
	document.querySelectorAll(".ec-summary .badge").forEach((badge) => {
		const cat = badge.dataset.cat || "misc"; // Fallback to 'misc' if no tag provided
		const text = badge.textContent.trim();

		if (!skillsData[cat]) {
			skillsData[cat] = new Set();
		}
		skillsData[cat].add(text);
	});

	// 2. DYNAMIC FALLBACK: If no badges were found (e.g., on resume.html), fetch from portfolio.html
	if (Object.keys(skillsData).length === 0) {
		try {
			const response = await fetch("portfolio.html");
			const htmlText = await response.text();

			// Parse the fetched text into a readable DOM document
			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlText, "text/html");

			// Query the badges from the fetched portfolio document
			doc.querySelectorAll(".ec-summary .badge").forEach((badge) => {
				const cat = badge.dataset.cat || "misc";
				const text = badge.textContent.trim();

				if (!skillsData[cat]) {
					skillsData[cat] = new Set();
				}
				skillsData[cat].add(text);
			});
		} catch (error) {
			console.error("Failed to fetch skills from portfolio.html:", error);
			return; // Exit if the fetch fails
		}
	}

	// 3. Generate HTML
	let html = "";
	for (const [catCode, catName] of Object.entries(catMap)) {
		if (skillsData[catCode] && skillsData[catCode].size > 0) {
			const badgesHtml = Array.from(skillsData[catCode])
				.sort() // Alphabetizes the badges within their bucket
				.map((skill) => `<span class="skill-badge">${skill}</span>`)
				.join("");

			html += `
                <div class="uni-card skill-cat">
                    <h4 class="ec-title skill-cat-title">${catName}</h4>
                    <div class="skill-badge-row">
                        ${badgesHtml}
                    </div>
                </div>
            `;
		}
	}

	container.innerHTML = html;
}

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
				navbox.addEventListener("mouseenter", () => {
					// Only apply the background blur hover effect on desktop
					if (window.innerWidth > 1050) {
						shroud.classList.add("visible");
					}
				});
				navbox.addEventListener("mouseleave", () => shroud.classList.remove("visible"));
			}

			const dropdownParents = hdr.querySelectorAll(".ndrop");
			dropdownParents.forEach((drop) => {
				const mainLink = drop.querySelector(":scope > .ni");
				if (!mainLink) return;

				let pressTimer;
				let isLongPress = false;

				// Touch start initiates the long press timer
				mainLink.addEventListener(
					"touchstart",
					(e) => {
						if (window.innerWidth > 1050) return;
						isLongPress = false;
						pressTimer = setTimeout(() => {
							isLongPress = true;
							dropdownParents.forEach((other) => {
								if (other !== drop) other.classList.remove("open");
							});
							drop.classList.add("open");
						}, 350); // 350ms for dropdown to trigger
					},
					{passive: true},
				);

				// Cancel timer if finger moves or leaves early
				mainLink.addEventListener("touchend", () => clearTimeout(pressTimer), {passive: true});
				mainLink.addEventListener("touchmove", () => clearTimeout(pressTimer), {passive: true});

				// Prevent native mobile long-press context menu if it successfully opened the dropdown
				mainLink.addEventListener("contextmenu", (e) => {
					if (window.innerWidth <= 1050 && isLongPress) e.preventDefault();
				});

				// Handle standard clicks
				mainLink.addEventListener("click", (e) => {
					if (window.innerWidth > 1050) return;

					if (isLongPress) {
						// It was a long press to open menu, prevent navigation.
						e.preventDefault();
					} else {
						// Short press! Clean up dropdowns and allow direct navigation.
						dropdownParents.forEach((other) => other.classList.remove("open"));
					}
				});
			});

			// 1. Standard global click to close menus when clicking outside
			document.addEventListener("click", (e) => {
				if (window.innerWidth > 1050) return;
				if (e.target.closest(".ndrop")) return;
				dropdownParents.forEach((drop) => drop.classList.remove("open"));
			});

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

/* ── DYNAMIC FOOTER LOADER ── */
function loadFooter() {
	return new Promise((resolve) => {
		const placeholder = document.getElementById("footer-placeholder");
		if (!placeholder) return resolve();

		fetch("footer.html")
			.then((response) => response.text())
			.then((data) => {
				const parser = new DOMParser();
				const doc = parser.parseFromString(data, "text/html");
				const footer = doc.querySelector("footer");

				if (footer) {
					placeholder.replaceWith(footer);

					// Automate highlighting the current page using your existing function
					const currentPath = window.location.pathname.toLowerCase();
					applyPageActiveState(currentPath, footer.querySelectorAll(".fnav a"));
				}
				resolve();
			})
			.catch((error) => {
				console.error("Error loading footer:", error);
				resolve();
			});
	});
}

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

					setTimeout(() => {
						isTrackpadSwiping = false;
					}, 400);
				}
			},
			{passive: true},
		);
	});

	// --- ADDED: EC CARD LIGHTBOX SWIPE LOGIC ---
	const lbBox = document.querySelector(".card-lb-box");
	if (lbBox) {
		// 1. Mobile Touch Swipe
		let lbStartX = 0;
		let lbStartY = 0;
		let isCarouselInteract = false;

		lbBox.addEventListener(
			"touchstart",
			(e) => {
				if (e.touches.length > 1) return;
				// Flag if interacting with a carousel
				if (e.target.closest(".cw")) {
					isCarouselInteract = true;
					return;
				}
				isCarouselInteract = false;
				lbStartX = e.touches[0].clientX;
				lbStartY = e.touches[0].clientY;
			},
			{passive: true},
		);

		lbBox.addEventListener(
			"touchend",
			(e) => {
				if (isCarouselInteract) return; // Let the carousel handle it

				const diffX = lbStartX - e.changedTouches[0].clientX;
				const diffY = lbStartY - e.changedTouches[0].clientY;

				if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
					if (typeof pfLbNav === "function") {
						if (diffX > 0) pfLbNav(1);
						else pfLbNav(-1);
					}
				}
			},
			{passive: true},
		);

		// 2. Desktop Trackpad Swipe
		let isLbTrackpadSwiping = false;

		lbBox.addEventListener(
			"wheel",
			(e) => {
				// Abort if animating, OR if the cursor is hovering over a carousel
				if (isLbTrackpadSwiping || e.target.closest(".cw")) return;

				if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 25) {
					isLbTrackpadSwiping = true;

					if (typeof pfLbNav === "function") {
						if (e.deltaX > 0) pfLbNav(1);
						else pfLbNav(-1);
					}

					// Debounce to prevent rapid-fire skipping
					setTimeout(() => {
						isLbTrackpadSwiping = false;
						// }, 400);
					}, 900);
				}
			},
			{passive: true},
		);
	}
}
/* ── FILTER SWIPE NAVIGATION (LAYER 1) ── */
function initFilterSwipe() {
	const filterContainer = document.querySelector(".portfolio-filters, #blog-filters");
	if (!filterContainer) return;

	let startX = 0;
	let startY = 0;
	let isSwiping = false;

	// This function acts as a strict bouncer. If it returns true, the Filter Swipe plays dead.
	function isFilterSwipeLocked(target) {
		// 1. Is the user reading a blog post?
		const blogPost = document.getElementById("blog-post");
		if (blogPost && blogPost.style.display !== "none") return true;

		// 2. Is the user physically touching inside a carousel, tile, or lightbox?
		// (Covers Layer 2 and Layer 3 elements)
		if (target.closest(".cw, .ss-clip, .card-lb-box, .lbbox, .ec-card")) return true;

		// 3. Is ANY tile or lightbox currently "open" on the page?
		// (If your active state uses a class other than '.active', like '.expanded' or '.open', add it here)
		const activeLightbox = document.querySelector('.ec-card.active, .card-lb-box.active, .lbbox.active, .lbbox[style*="display: block"]');
		if (activeLightbox) return true;

		return false;
	}

	function navigateFilter(direction) {
		const buttons = Array.from(filterContainer.querySelectorAll(".filter-btn"));
		if (!buttons.length) return;

		const activeIndex = buttons.findIndex((btn) => btn.classList.contains("active"));
		if (activeIndex === -1) return;

		let nextIndex = activeIndex + direction;

		if (nextIndex >= buttons.length) nextIndex = 0;
		if (nextIndex < 0) nextIndex = buttons.length - 1;

		buttons[nextIndex].click();
	}

	// Mobile Touch Swipe
	document.addEventListener(
		"touchstart",
		(e) => {
			if (e.touches.length > 1) return;

			// If a lightbox/carousel is active, completely abort the filter swipe
			if (isFilterSwipeLocked(e.target)) {
				isSwiping = false;
				return;
			}

			isSwiping = true;
			startX = e.touches[0].clientX;
			startY = e.touches[0].clientY;
		},
		{passive: true},
	);

	document.addEventListener(
		"touchend",
		(e) => {
			if (!isSwiping) return;

			const diffX = startX - e.changedTouches[0].clientX;
			const diffY = startY - e.changedTouches[0].clientY;

			if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
				navigateFilter(diffX > 0 ? 1 : -1);
			}

			isSwiping = false;
		},
		{passive: true},
	);

	// Desktop Trackpad Swipe
	let isTrackpadSwiping = false;
	document.addEventListener(
		"wheel",
		(e) => {
			if (isTrackpadSwiping) return;

			// If a lightbox/carousel is active, completely abort the filter swipe
			if (isFilterSwipeLocked(e.target)) return;

			if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 30) {
				isTrackpadSwiping = true;

				navigateFilter(e.deltaX > 0 ? 1 : -1);

				// setTimeout(() => { isTrackpadSwiping = false; }, 500);
				setTimeout(() => {
					isTrackpadSwiping = false;
				}, 900);
			}
		},
		{passive: true},
	);
}

/* ── UNIFIED INITIALIZATION ── */
function unifiedInit() {
	// THE FIX: Carousels MUST run before initSS() to swap data-src back to src.
	// Otherwise initSS measures images with 0 height, creating black screens!
	initCarousels();
	initCollapsibleCards();
	initSS();
	initSwipeNav();
	initFilterSwipe();
	// initCarouselSwipe();
	initFadeIn();
	initCountUp();
	initSkills();

	const iframe = document.getElementById("timeline-iframe");
	if (iframe) {
		iframe.onload = () => iframe.classList.add("loaded");
		// If already loaded (e.g. from cache), trigger it manually
		if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
			iframe.classList.add("loaded");
		}
	}

	// Wait for the Nav and Footer to load BEFORE handling URLs and scroll tracking
	// Promise.all([loadNav(), loadFooter()]).then(() => {
	// 	requestAnimationFrame(() => {
	// 		Object.keys(TABS).forEach((id) => {
	// 			calcW(id);
	// 			setH(id, false);
	// 		});
	// 		handleURL();

	// 		window.addEventListener(
	// 			"scroll",
	// 			() => {
	// 				if (!isScrollTicking) {
	// 					window.requestAnimationFrame(() => {
	// 						try {
	// 							runCoreScrollTasks(window.scrollY);
	// 						} finally {
	// 							isScrollTicking = false;
	// 						}
	// 					});
	// 					isScrollTicking = true;
	// 				}
	// 			},
	// 			{passive: true},
	// 		);

	// 		// Force an initial update
	// 		runCoreScrollTasks(window.scrollY);
	// 	});
	// });
	// Wait for the Nav and Footer to load BEFORE handling URLs and scroll tracking
	Promise.all([loadNav(), loadFooter()]).then(() => {
		// Give the browser 50ms to render the injected HTML before calculating layouts
		setTimeout(() => {
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
								try {
									runCoreScrollTasks(window.scrollY);
								} finally {
									isScrollTicking = false;
								}
							});
							isScrollTicking = true;
						}
					},
					{passive: true},
				);

				// Force an initial update
				runCoreScrollTasks(window.scrollY);
			});
		}, 50);
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
			// }, 2400);
			}, 1200);
		});

		setTimeout(() => {
			if (!preloader.classList.contains("hidden")) {
				preloader.classList.add("hidden");
				setTimeout(() => preloader.remove(), 1000);
			}
		// }, 5000);
		}, 2500);
	} else {
		preloader.remove();
	}
}
