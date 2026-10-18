/* ─────────────────────────────────────────────
   ABOUT — page-specific scripts
   Consolidated Oct 2026 from inline <script> blocks.
   (Blocks concatenated in original document order.)
   ───────────────────────────────────────────── */

/* ── Block 1 ── */
const cachedNav = sessionStorage.getItem("rawNavHTML");
		if (cachedNav) {
			document.getElementById("nav-placeholder").outerHTML = cachedNav;
			const currentPath = window.location.pathname.toLowerCase();
			// const isPortfolioPath = currentPath.includes("portfolio") || currentPath.includes("photography");
			// const isHomePath = currentPath.endsWith("/") || currentPath.includes("index") || currentPath.endsWith("site");
			const isPortfolioPath = currentPath.endsWith("/") || currentPath.includes("portfolio") || currentPath.endsWith("site") || currentPath.includes("photography");
			const isAboutPath = currentPath.includes("about");
			const header = document.getElementById("hdr");
			if (header) {
				header.querySelectorAll(".ni").forEach(link => {
					link.classList.remove("active");
					const text = link.textContent.trim().toLowerCase();
					// if (currentPath.includes("blog") && text === "blog") link.classList.add("active");
					// else if (currentPath.includes("resume") && text === "resume") link.classList.add("active");
					// else if (isPortfolioPath) link.classList.add("active");
					// else if (isAboutPath && text === "about") link.classList.add("active");
					if (currentPath.includes("blog") && text.includes("blog")) link.classList.add("active");
					else if (currentPath.includes("resume") && text.includes("resume")) link.classList.add("active");
					else if (isPortfolioPath && text.includes("portfolio")) link.classList.add("active");
					else if (isAboutPath && text.includes("about")) link.classList.add("active");
				});
			}
		}

/* ── Block 2 ── */
const marquee = document.querySelector('.marquee');
		const originalTrack = document.querySelector('.marquee-track');

		function setupMarquee() {
			// 1. Remove any existing clones (useful if the window is resized)
			const existingClones = marquee.querySelectorAll('.marquee-track.clone');
			existingClones.forEach(clone => clone.remove());

			// 2. Measure the track and the screen
			// We add 50px to account for the CSS gap between tracks
			const trackWidth = originalTrack.scrollWidth;
			const screenWidth = window.innerWidth;

			// 3. Calculate how many total tracks we need to fill the screen
			// We use Math.ceil to round up, and add 1 extra as a scrolling buffer
			const copiesNeeded = Math.ceil(screenWidth / trackWidth) + 1;

			// 4. Spawn the required number of clones
			for (let i = 0; i < copiesNeeded - 1; i++) {
				const clone = originalTrack.cloneNode(true);
				clone.classList.add('clone'); // Tag it as a clone so we can track it
				clone.setAttribute('aria-hidden', 'true'); // Hide duplicates from screen readers
				marquee.appendChild(clone);
			}
		}

		// Run the math when the page loads
		setupMarquee();

		// Re-calculate automatically if the user resizes their browser window
		window.addEventListener('resize', setupMarquee);

/* ── Block 3 ── */
document.addEventListener("DOMContentLoaded", async () => {
			const recentContainer = document.getElementById("recent-card-container");
			if (!recentContainer) return;

			try {
				// Fetch the portfolio page
				const response = await fetch("portfolio");
				const htmlText = await response.text();

				// Parse the fetched HTML
				const parser = new DOMParser();
				const doc = parser.parseFromString(htmlText, "text/html");

				// --- EXTRACT & SCOPE CSS ---
				// Grab all style blocks from portfolio
				const styleBlocks = doc.querySelectorAll("style");
				let portfolioCSS = "";
				styleBlocks.forEach(block => portfolioCSS += block.innerHTML + "\n");

				// Find the specific card by its ID
				const targetCard = doc.querySelector("#ray");

				if (targetCard) {
					const summaryNode = targetCard.querySelector(".ec-summary");

					// --- STRIP UNWANTED ELEMENTS ---
					// Find the elements inside the summary
					const badges = summaryNode.querySelector(".brow");
					const expandPrompt = summaryNode.querySelector(".expand-prompt");
					const dateSubtitle = summaryNode.querySelector(".ec-subtitle");
					const logo = summaryNode.querySelector(".eclogos");
					const thumb = summaryNode.querySelector(".ec-thumb");

					// Delete them if they exist
					if (badges) badges.remove();
					if (expandPrompt) expandPrompt.remove();
					// if (dateSubtitle) dateSubtitle.remove();
					if (logo) logo.remove();
					// if (thumb) thumb.remove();
					// -------------------------------

					// Extract the inner wrapper and the newly cleaned summary HTML
					const cardClasses = targetCard.querySelector(".ec-card").className;
					const summaryHtml = summaryNode.outerHTML;

					// Inject the scoped styles AND the formatted card wrapped in a link to the portfolio
					recentContainer.innerHTML = `
	                    <link rel="stylesheet" href="css/pages/about-2.css">
	                    <div style="width: 100%; margin: 35px auto 5px; font-size: clamp(16px, 1.2vw, 22px); line-height: 1.6; font-weight: 700;">
	                        FEATURED EXPERIENCE:
	                    </div>
	                    <div class="card-stack">
	                        <a href="/portfolio?filter=all" class="ec-card-link" style="display: block; text-decoration: none;">
	                            <div class="${cardClasses}">
	                                ${summaryHtml}
	                            </div>
	                        </a>
	                    </div>
	                `;

					// Strip the "onclick" attribute to prevent errors
					const injectedSummary = recentContainer.querySelector('.ec-summary');
					if (injectedSummary) {
						injectedSummary.removeAttribute('onclick');
						injectedSummary.style.cursor = "pointer";
					}
				}
			} catch (error) {
				console.error("Failed to load recent card:", error);
			}
		});

/* ── Block 4 ── */
// document.addEventListener("DOMContentLoaded", () => {
		// 	const text = "Hi, I'm Adarsh! 👋";
		// 	const characters = [...text];

		// 	const el = document.getElementById("typewriter");
		// 	let i = 0;

		// 	function type() {
		// 		if (i < characters.length) {
		// 			el.textContent += characters[i];
		// 			i++;
		// 			setTimeout(type, Math.random() * 50 + 60);
		// 		}
		// 	}

		// 	const preloaderSeen = sessionStorage.getItem("preloaderSeen");
		// 	const delay = preloaderSeen === "true" ? 300 : 1400;
		// 	setTimeout(type, delay);
		// });
		document.addEventListener("DOMContentLoaded", () => {
			// Break the text into parts to isolate the name
			const prefix = "Hi, I'm ";
			const name = "Adarsh!";
			const suffix = " 👋";
			const characters = [...(prefix + name + suffix)];

			const el = document.getElementById("typewriter");
			let i = 0;

			function type() {
				if (i < characters.length) {
					const currentText = characters.slice(0, i + 1).join('');

					// Wrap only the 'name' portion in the gradient span
					if (currentText.length <= prefix.length) {
						el.innerHTML = currentText;
					} else if (currentText.length <= prefix.length + name.length) {
						const currentName = currentText.substring(prefix.length);
						el.innerHTML = `${prefix}<span class="text-gradient">${currentName}</span>`;
					} else {
						const currentSuffix = currentText.substring(prefix.length + name.length);
						el.innerHTML = `${prefix}<span class="text-gradient">${name}</span>${currentSuffix}`;
					}

					i++;
					setTimeout(type, Math.random() * 50 + 60);
				}
			}

			const preloaderSeen = sessionStorage.getItem("preloaderSeen");
			const delay = preloaderSeen === "true" ? 300 : 1400;
			setTimeout(type, delay);
		});

/* ── Block 5 ── */
function navToSection(k, scrollFn) {
			document.querySelectorAll(".sbn").forEach((a) =>
				a.classList.toggle("active", a.dataset.k === k)
			);
			if (window._lockNav) window._lockNav();

			// Explicitly show navbar for top sections, hide for everything else
			if (k === "about" || k === "top") {
				if (window._showNav) window._showNav();
			} else {
				if (window._hideNav) window._hideNav();
			}

			const hash = (k === "about" || k === "bio") ? "" : "#" + k;
			history.replaceState(null, "", window.location.pathname + window.location.search + hash);
			scrollFn();
		}

				(function () {
			const photos = document.querySelectorAll(".insta-photo");
			const dots = document.querySelectorAll("#igDots .insta-dot");
			let cur = 0, timer = null, isPlaying = false;

			function show(i) {
				photos[cur].classList.remove("ion");
				dots[cur] && dots[cur].classList.remove("ion");
				cur = (i + photos.length) % photos.length;
				photos[cur].classList.add("ion");
				dots[cur] && dots[cur].classList.add("ion");
			}

			function startCarousel() {
				if (!isPlaying) {
					isPlaying = true;
					timer = setInterval(() => show(cur + 1), 4200);
				}
			}

			function stopCarousel() {
				if (isPlaying) {
					isPlaying = false;
					clearInterval(timer);
				}
			}

			const wrap = document.getElementById("igWrap");
			if (wrap && window.IntersectionObserver) {
				const observer = new IntersectionObserver((entries) => {
					entries.forEach(entry => {
						if (entry.isIntersecting) {
							startCarousel();
						} else {
							stopCarousel();
						}
					});
				}, { threshold: 0.15 });
				observer.observe(wrap);
			} else {
				startCarousel();
			}

			dots.forEach((d, i) =>
				d.addEventListener("click", (e) => {
					e.stopPropagation(); stopCarousel(); show(i); startCarousel();
				}),
			);

			// --- TOUCH & TRACKPAD SWIPE NAVIGATION FOR INSTAGRAM CAROUSEL ---
			if (wrap) {
				let touchStartX = 0, touchStartY = 0;
				let isTrackpadSwiping = false, wasSwiped = false;

				// 1. Mobile Touch Swipe
				wrap.addEventListener("touchstart", (e) => {
					if (e.touches.length > 1) return;
					touchStartX = e.changedTouches[0].screenX;
					touchStartY = e.changedTouches[0].screenY;
				}, { passive: true });

				wrap.addEventListener("touchend", (e) => {
					const touchEndX = e.changedTouches[0].screenX;
					const touchEndY = e.changedTouches[0].screenY;
					const diffX = touchStartX - touchEndX;
					const diffY = touchStartY - touchEndY;

					if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
						wasSwiped = true;
						stopCarousel();
						if (diffX > 0) show(cur + 1); // Swiped Left -> Next
						else show(cur - 1);           // Swiped Right -> Prev
						startCarousel();

						setTimeout(() => wasSwiped = false, 100);
					}
				}, { passive: true });

				// 2. Desktop Trackpad Swipe
				wrap.addEventListener("wheel", (e) => {
					if (isTrackpadSwiping) return;

					if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 25) {
						isTrackpadSwiping = true;
						stopCarousel();
						if (e.deltaX > 0) show(cur + 1); // Scrolled Right -> Next
						else show(cur - 1);              // Scrolled Left -> Prev
						startCarousel();

						setTimeout(() => isTrackpadSwiping = false, 500);
					}
				}, { passive: true });

				// 3. Fallback Click Navigation
				wrap.addEventListener("click", (e) => {
					if (wasSwiped) {
						e.preventDefault();
						return;
					}
					stopCarousel();
					show(cur + 1);
					startCarousel();
				});
			}

			show(0);
		})();
