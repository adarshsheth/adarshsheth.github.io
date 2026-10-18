/* ─────────────────────────────────────────────
   effects.js — fade-in, count-up, preloader
   Split from js/script.js Oct 2026 (zero behavior change:
   same code, same order, global scope shared across files).
   Load order on every page: core.js → ui.js → effects.js
   ───────────────────────────────────────────── */
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
// function applyPageActiveState(currentPath, links) {
// 	links.forEach((link) => {
// 		link.classList.remove("active");
// 		const linkText = link.textContent.trim().toLowerCase();
// 		// const isPortfolioPath = currentPath.includes("portfolio") || currentPath.includes("photography");
// 		const isPortfolioPath =
// 			currentPath.endsWith("/") || currentPath.includes("portfolio") || currentPath.endsWith("site") || currentPath.includes("photography");
// 		const isAboutPath = currentPath.includes("about");
			

// 					if (currentPath.includes("blog") && text.includes("blog")) link.classList.add("active");
// 					else if (currentPath.includes("resume") && text.includes("resume")) link.classList.add("active");
// 					else if (isPortfolioPath && text.includes("portfolio")) link.classList.add("active");
// 					else if (isAboutPath && text.includes("about")) link.classList.add("active");
// 	});
// }
/* ── PAGE ACTIVE LINK HELPERS ── */


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

/* ── Boot: runs after core.js + ui.js + effects.js are all parsed
   (was at end of the single script.js; moved here so unifiedInit()
   sees every function. Same timing as before: readyState is
   "interactive" during deferred-script execution.) ── */
if (document.readyState === "complete" || document.readyState === "interactive") {
	unifiedInit();
} else {
	document.addEventListener("DOMContentLoaded", unifiedInit);
}
