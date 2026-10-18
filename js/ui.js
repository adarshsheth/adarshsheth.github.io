/* ─────────────────────────────────────────────
   ui.js — slideshow, carousels, lightbox, skills, cards, swipe
   Split from js/script.js Oct 2026 (zero behavior change:
   same code, same order, global scope shared across files).
   Load order on every page: core.js → ui.js → effects.js
   ───────────────────────────────────────────── */
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
