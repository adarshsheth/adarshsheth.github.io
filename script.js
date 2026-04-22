/* ══ CUSTOM CURSOR (disabled – set true to enable) ══ */
const ENABLE_CUSTOM_CURSOR = false;
/*
if (ENABLE_CUSTOM_CURSOR) {
  // inject cursor element
  const curEl = document.createElement('div');
  curEl.id = 'cur';
  document.body.appendChild(curEl);
  // inject cursor CSS
  const curStyle = document.createElement('style');
  curStyle.textContent = `
    *{cursor:none!important}
    #cur{position:fixed;width:9px;height:9px;border-radius:50%;background:var(--accent);
      pointer-events:none;z-index:99999;transform:translate(-50%,-50%);
      transition:transform .08s,opacity .2s;animation:curPulse 2.4s ease-in-out infinite}
    #cur.clicking{transform:translate(-50%,-50%) scale(1.8);opacity:.6}
    @keyframes curPulse{0%,100%{box-shadow:0 0 0 0 rgba(200,168,75,.5)}
      50%{box-shadow:0 0 0 7px rgba(200,168,75,0)}}
  `;
  document.head.appendChild(curStyle);
  document.addEventListener('mousemove', e => {
    curEl.style.left = e.clientX + 'px';
    curEl.style.top  = e.clientY + 'px';
  });
  document.addEventListener('mousedown', () => curEl.classList.add('clicking'));
  document.addEventListener('mouseup',   () => curEl.classList.remove('clicking'));
}
*/

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
		SS[id] = {clip, cont, fr, slides, cur: 0, w: 0};

		// init visibility
		slides.forEach((sl, i) => {
			sl.style.visibility = i === 0 ? "visible" : "hidden";
		});

		calcW(id);
		setH(id, false);

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

function sw(id, idx, section, doScroll) {
	const s = SS[id];
	if (!s) return;
	const prev = s.cur;

	if (prev === idx) {
		(TABS[id] || []).forEach((bid, i) => {
			const b = document.getElementById(bid);
			if (b) b.disabled = i === idx;
		});
		updateURL(section);
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
			// Double requestAnimationFrame ensures the 'remove' is painted before the 'add' triggers the transition
			requestAnimationFrame(() => {
				requestAnimationFrame(() => newCard.classList.add("visible"));
			});
		}
	}

	s.fr.style.transform = `translateX(-${idx * s.w}px)`;
	requestAnimationFrame(() => setH(id, true));

	(TABS[id] || []).forEach((bid, i) => {
		const b = document.getElementById(bid);
		if (b) b.disabled = i === idx;
	});

	updateURL(section);
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
	document.getElementById(TABS[id][next])?.click();
}

function ddNav(section) {
	const c = SMAP[section];
	if (!c) return;
	if (window._lockNav) window._lockNav();
	if (window._hideNav) window._hideNav();
	sw(c.ss, c.i, section, true);
}

/* ── URL HELPERS & SUB-NAV HIGHLIGHTING ── */
let lastSec = null,
	debT = null;

function updateSubNav() {
	const currentSec = new URLSearchParams(window.location.search).get("section");
	document.querySelectorAll(".sbn-sub").forEach((a) => {
		a.classList.toggle("active", a.dataset.sub === currentSec);
	});
}

function updateURL(s) {
	if (s === lastSec) {
		updateSubNav();
		return;
	}
	lastSec = s;
	const u = new URL(window.location.href);
	if (s) {
		u.searchParams.set("section", s);
	} else {
		u.searchParams.delete("section");
	}
	history.replaceState(null, "", u.toString());
	updateSubNav();
}

function updateURLd(s) {
	clearTimeout(debT);
	debT = setTimeout(() => updateURL(s), 150);
}

function handleURL() {
	const s = new URLSearchParams(window.location.search).get("section");
	updateSubNav();
	if (!s || !SMAP[s]) return;
	if (window._lockNav) window._lockNav();
	if (window._hideNav) window._hideNav();
	const {ss, i} = SMAP[s];
	sw(ss, i, s, true);
}

function scrollToSec(id) {
	if (window._lockNav) window._lockNav();
	if (window._hideNav) window._hideNav();
	const el = id === "top" ? document.getElementById("top") : document.getElementById(id);
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

/* ── HEADER SCROLL BEHAVIOR ────────────────────────────────────────── */
const NAV_INITIAL_SHOW_ZONE_VH = 0.15;
const NAV_SCROLL_DOWN_PX = 80;
const NAV_SCROLL_UP_PX = 20;

(function () {
	const hdr = document.getElementById("hdr");
	const dd = document.getElementById("nav-dd");
	if (!hdr) return;

	let hovering = false;
	let ly = window.scrollY;
	let delta = 0;
	let hid = false;

	window._isNavLocked = false;
	window._navLockTimer = null;

	// Locks the nav to prevent scroll-up detection during smooth anchor jumps
	window._lockNav = function () {
		window._isNavLocked = true;
		hovering = false;
		clearTimeout(window._navLockTimer);
		window._navLockTimer = setTimeout(() => {
			window._isNavLocked = false;
		}, 1200); // Gives enough time for the smooth scroll to finish
	};

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
			hdr.style.transform = "translateY(-150%)"; // Pulls completely out of view
			hid = true;
			delta = 0;
		}
		// Fixes the dropdown hanging glitch: forcefully sever visibility
		document.querySelectorAll(".nav-dd").forEach((ddEl) => {
			ddEl.style.display = "none";
		});
	}

	[hdr, dd].forEach((el) => {
		if (!el) return;
		el.addEventListener("mouseenter", () => {
			if (window._isNavLocked) return;
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
			// If locked by a programmatic scroll, ignore all direction heuristics
			if (window._isNavLocked) {
				ly = window.scrollY;
				delta = 0;
				return;
			}

			if (hovering) {
				ly = window.scrollY;
				delta = 0;
				return;
			}

			const y = window.scrollY;

			if (y <= 0) {
				showNav();
				ly = y;
				return;
			}

			if (y < window.innerHeight * NAV_INITIAL_SHOW_ZONE_VH) {
				showNav();
				ly = y;
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
		},
		{passive: true},
	);

	window._hideNav = hideNav;
	window._showNav = showNav;
})();

/* ── DROPDOWN HOVER BRIDGE ── */
document.querySelectorAll(".ndrop").forEach((drop) => {
	const dd = drop.querySelector(".nav-dd");
	if (!dd) return;
	let t;
	drop.addEventListener("mouseenter", () => {
		clearTimeout(t);
		dd.style.display = "block";
	});
	drop.addEventListener("mouseleave", () => {
		t = setTimeout(() => {
			dd.style.display = "none";
		}, 160);
	});
	dd.addEventListener("mouseenter", () => clearTimeout(t));
	dd.addEventListener("mouseleave", () => {
		t = setTimeout(() => {
			dd.style.display = "none";
		}, 160);
	});
});

/* ── SIDEBAR SCROLL PROGRESS & MAIN NAV STATE ── */
function updateSidebar() {
	const fill = document.getElementById("sb-fill");
	const tot = document.documentElement.scrollHeight - window.innerHeight;
	if (fill) fill.style.width = (tot > 0 ? (window.scrollY / tot) * 100 : 0) + "%";

	let activeK = "top";
	const sections = [
		{id: "top", k: "top"},
		{id: "sec-tamu", k: "tamu"},
		{id: "sec-dvhs", k: "dvhs"},
		{id: "sec-events", k: "events"},
		{id: "sec-infographic", k: "infographic"},
		{id: "sec-cad", k: "cad"},
	];

	sections.forEach(({id, k}) => {
		const el = document.getElementById(id);
		if (el && el.getBoundingClientRect().top < window.innerHeight * 0.4) activeK = k;
	});

	// Update parent nav active states (keep tamu highlighted when in dvhs)
	document.querySelectorAll(".sbn").forEach((a) => {
		const isMatch = a.dataset.k === activeK || (a.dataset.k === "tamu" && activeK === "dvhs");
		a.classList.toggle("active", isMatch);
	});

	if (activeK === "top") {
		if (window.scrollY < 100) updateURLd(null);
		return;
	}

	const ssMap = {tamu: "ss7", dvhs: "ss8", events: "ss3", infographic: "ss6", cad: "ss9"};
	const ssId = ssMap[activeK];
	if (ssId && SS[ssId]) {
		const sec = RMAP[ssId]?.[SS[ssId].cur];
		if (sec) updateURLd(sec);
	}
}
window.addEventListener("scroll", updateSidebar, {passive: true});

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

			const clip = wrap.closest(".ss-clip");
			if (clip) {
				const id = clip.id.replace("-clip", "");
				if (SS[id]) requestAnimationFrame(() => setH(id, true));
			}
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
				duration = 5000;
			} else {
				duration = 2000;
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

/* ── CARD FADE-IN ── */
function initFadeIn() {
	const obs = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry, i) => {
				if (entry.isIntersecting) {
					setTimeout(() => entry.target.classList.add("visible"), i * 60);
					obs.unobserve(entry.target);
				}
			});
		},
		{threshold: 0.06},
	);
	document.querySelectorAll(".ec").forEach((c) => obs.observe(c));
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

/* ── UNIFIED INITIALIZATION ── */
function unifiedInit() {
	initSS();
	initCarousels();
	initFadeIn();
	initCountUp();

	// Final measurements once layout is painted
	requestAnimationFrame(() => {
		Object.keys(TABS).forEach((id) => {
			calcW(id);
			setH(id, false);
		});
		handleURL();
		updateSidebar();
	});
}

// Single initialization point handles both pre-loaded and dynamically injected scripts
if (document.readyState === "complete" || document.readyState === "interactive") {
	unifiedInit();
} else {
	document.addEventListener("DOMContentLoaded", unifiedInit);
}
