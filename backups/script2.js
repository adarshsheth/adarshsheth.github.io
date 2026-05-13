/* ══ CUSTOM CURSOR (disabled – set true to enable) ══ */
const ENABLE_CUSTOM_CURSOR = false;

/* ── SVG PERFECT TRACE CALCULATOR ── */
document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll(".logo-path").forEach((path) => {
		const length = path.getTotalLength();
		path.style.setProperty("--path-length", length);
	});
});

/* ── INTERSECTION OBSERVERS (Replaces old Slideshow/Tab logic) ── */
function initObservers() {
	// 1. Fade in cards as they scroll into view
	const fadeObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const card = entry.target;
					if (card) {
						setTimeout(() => card.classList.add("visible"), 50);
					}
				}
			});
		},
		{threshold: 0.1, rootMargin: "0px 0px -50px 0px"},
	);

	document.querySelectorAll(".timeline-sec").forEach((sec) => fadeObserver.observe(sec));

	// 2. Timeline Rail Scrollspy
	const sections = document.querySelectorAll(".timeline-sec");
	const navLinks = document.querySelectorAll(".rail-item");

	if (!sections.length || !navLinks.length) return;

	const spyObserver = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					const id = entry.target.id;

					// Update Sidebar Classes
					navLinks.forEach((link) => {
						const isActive = link.dataset.id === id;
						link.classList.toggle("active", isActive);

						// On Mobile: Auto-scroll the horizontal rail
						if (isActive && window.innerWidth <= 1050) {
							link.scrollIntoView({behavior: "smooth", inline: "center", block: "nearest"});
						}
					});

					// Update URL for seamless sharing
					updateURLd(id);
				}
			});
		},
		{
			// Triggers when the section crosses the upper-middle of the viewport
			rootMargin: "-30% 0px -30% 0px",
		},
	);

	sections.forEach((sec) => spyObserver.observe(sec));
}
/* ── SMOOTH SCROLL FOR RAIL LINKS ── */
document.querySelectorAll('.rail-item').forEach(link => {
	link.addEventListener('click', (e) => {
		e.preventDefault();
		const targetId = link.getAttribute('data-id');
		const targetEl = document.getElementById(targetId);
		
		if (targetEl) {
			// Offset perfectly tuned (320px) to snap under the giant hero block
			const y = targetEl.getBoundingClientRect().top + window.scrollY - 320;
			window.scrollTo({ top: y, behavior: 'smooth' });
		}
	});
});

/* ── URL HELPERS ── */
let lastSec = null,
	debT = null;

function updateURL(s) {
	if (s === lastSec) return;
	lastSec = s;
	const u = new URL(window.location.href);
	if (s && s !== "top") {
		u.searchParams.set("section", s);
	} else {
		u.searchParams.delete("section");
	}
	history.replaceState(null, "", u.toString());
}

function updateURLd(s) {
	clearTimeout(debT);
	debT = setTimeout(() => updateURL(s), 150);
}

function handleURL() {
	const s = new URLSearchParams(window.location.search).get("section");
	if (!s) return;

	// Auto-scroll on page load if URL has a section
	const targetEl = document.getElementById(s);
	if (targetEl) {
		setTimeout(() => {
			const y = targetEl.getBoundingClientRect().top + window.scrollY - 280;
			window.scrollTo({top: y, behavior: "smooth"});
		}, 100); // slight delay for layout calc
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

		function show(i) {
			const prevEl = imgs[cur];
			if (prevEl) prevEl.classList.remove("on");
			if (dots[cur]) dots[cur].classList.remove("on");

			cur = (i + imgs.length) % imgs.length;

			const newEl = imgs[cur];
			if (newEl) newEl.classList.add("on");
			if (dots[cur]) dots[cur].classList.add("on");

			if (capEl) {
				const cap = imgs[cur].dataset.cap || imgs[cur].alt || "";
				const link = imgs[cur].dataset.link || "";
				if (link) capEl.innerHTML = `<a href="${link}" target="_blank">${cap}</a>`;
				else capEl.textContent = cap;
			}
		}

		function startAutoPlay() {
			clearTimeout(timer);
			if (imgs.length <= 1) return;

			let currentMedia = imgs[cur];
			let duration = currentMedia.dataset.interval
				? parseInt(currentMedia.dataset.interval)
				: wrap.dataset.interval
					? parseInt(wrap.dataset.interval)
					: currentMedia.tagName === "VIDEO"
						? 5000
						: 2000;

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

		show(0);
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

/* ── HEADER SCROLL BEHAVIOR ── */
const NAV_INITIAL_SHOW_ZONE_VH = 0.01;
const NAV_SCROLL_DOWN_PX = 40;
const NAV_SCROLL_UP_PX = 30;

function initNavScroll() {
	const hdr = document.querySelector("header");
	const dd = document.querySelector(".nav-dd");
	if (!hdr) return;

	let hovering = false;
	let ly = window.scrollY;
	let delta = 0;
	let hid = false;
	let navTicking = false;

	function showNav() {
		if (hid) {
			hdr.style.transition = "transform 0.52s cubic-bezier(0.34, 1.36, 0.64, 1)";
			hdr.style.transform = "translateY(0)";
			hid = false;
			delta = 0;
		}
	}

	function hideNav() {
		if (!hid) {
			hdr.style.transition = "transform 0.28s cubic-bezier(0.4, 0, 0.8, 1)";
			hdr.style.transform = "translateY(-150%)";
			hid = true;
			delta = 0;
		}
	}

	[hdr, dd].forEach((el) => {
		if (!el) return;
		el.addEventListener("mouseenter", () => {
			hovering = true;
			showNav();
		});
		el.addEventListener("mouseleave", () => {
			hovering = false;
			ly = window.scrollY;
		});
	});

	window.addEventListener(
		"scroll",
		() => {
			if (!navTicking) {
				window.requestAnimationFrame(() => {
					const y = window.scrollY;

					if (hovering) {
						ly = y;
						delta = 0;
						navTicking = false;
						return;
					}

					if (y <= 0 || y < window.innerHeight * NAV_INITIAL_SHOW_ZONE_VH) {
						showNav();
						ly = y;
						navTicking = false;
						return;
					}

					const d = y - ly;
					if (d > 0) {
						delta = delta > 0 ? delta + d : d;
						if (!hid && delta >= NAV_SCROLL_DOWN_PX) hideNav();
					} else if (d < 0) {
						delta = delta < 0 ? delta + d : d;
						if (hid && -delta >= NAV_SCROLL_UP_PX) showNav();
					}
					ly = y;
					navTicking = false;
				});
				navTicking = true;
			}
		},
		{passive: true},
	);
}

/* ── DYNAMIC NAVBAR LOADER ── */
function loadNav() {
	return new Promise((resolve) => {
		const placeholder = document.getElementById("nav-placeholder");
		const shroud = document.getElementById("blur-page");

		if (!placeholder) {
			initNavScroll();
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
					initNavScroll();

					const navbox = header.querySelector(".navbox");
					if (navbox && shroud) {
						navbox.addEventListener("mouseenter", () => shroud.classList.add("visible"));
						navbox.addEventListener("mouseleave", () => shroud.classList.remove("visible"));
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

/* ── PRELOADER LOGIC ── */
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
		}, 6000);
	} else {
		preloader.remove();
	}
}

/* ── UNIFIED INITIALIZATION ── */
function unifiedInit() {
	initObservers();
	initCarousels();
	initCountUp();

	loadNav().then(() => {
		requestAnimationFrame(() => {
			handleURL();
		});
	});
}

if (document.readyState === "complete" || document.readyState === "interactive") {
	unifiedInit();
} else {
	document.addEventListener("DOMContentLoaded", unifiedInit);
}
