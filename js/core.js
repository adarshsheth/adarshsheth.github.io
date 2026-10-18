/* ─────────────────────────────────────────────
   core.js — nav/sidebar/URL/scroll + shared state + boot
   Split from js/script.js Oct 2026 (zero behavior change:
   same code, same order, global scope shared across files).
   Load order on every page: core.js → ui.js → effects.js
   ───────────────────────────────────────────── */
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

function applyPageActiveState(currentPath, links) {
	links.forEach((link) => {
		link.classList.remove("active");
		const text = link.textContent.trim().toLowerCase(); // Changed 'linkText' to 'text'
		
		const isPortfolioPath =
			currentPath.endsWith("/") || currentPath.includes("portfolio") || currentPath.endsWith("site") || currentPath.includes("photography");
		const isAboutPath = currentPath.includes("about");
			
		if (currentPath.includes("blog") && text.includes("blog")) link.classList.add("active");
		else if (currentPath.includes("resume") && text.includes("resume")) link.classList.add("active");
		else if (isPortfolioPath && text.includes("portfolio")) link.classList.add("active");
		else if (isAboutPath && text.includes("about")) link.classList.add("active");
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

/* ══════════════════════════════════════════════════════════ */
/* ══ PRELOADER LOGIC                                      ── */
/* ══════════════════════════════════════════════════════════ */
