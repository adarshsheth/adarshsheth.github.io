/* ─────────────────────────────────────────────
   PHOTOGRAPHY — page-specific scripts
   Consolidated Oct 2026 from inline <script> blocks.
   (Blocks concatenated in original document order.)
   ───────────────────────────────────────────── */

/* ── Block 1 ── */
// Instantly inject the nav from cache to prevent UI flashing
    const cachedNav = sessionStorage.getItem("rawNavHTML");
    if (cachedNav) {
      // 1. Inject the cached HTML
      document.getElementById("nav-placeholder").outerHTML = cachedNav;

      // 2. Instantly fix the active states before the browser paints
      const currentPath = window.location.pathname.toLowerCase();
      const isPortfolioPath = currentPath.includes("portfolio") || currentPath.includes("photography");
      const isHomePath = currentPath.endsWith("/") || currentPath.includes("index") || currentPath.endsWith("site");

      const header = document.getElementById("hdr");
      if (header) {
        header.querySelectorAll(".ni").forEach(link => {
          link.classList.remove("active"); // Strip the cached "ghost" state

          // Apply the correct state for the current page
          const text = link.textContent.trim().toLowerCase();
          if (currentPath.includes("blog") && text === "blog") link.classList.add("active");
          else if (currentPath.includes("resume") && text === "resume") link.classList.add("active");
          else if (isPortfolioPath && text.includes("portfolio")) link.classList.add("active");
          else if (isHomePath && text === "home") link.classList.add("active");
        });
      }
    }

/* ── Block 2 ── */
try {
      const cachedNav = localStorage.getItem("siteNavHTML");
      if (cachedNav) {
        const doc = new DOMParser().parseFromString(cachedNav, "text/html");
        const header = doc.querySelector("header");
        if (header) {
          header.querySelectorAll(".active").forEach((el) => el.classList.remove("active"));
          document.getElementById("nav-placeholder").outerHTML = header.outerHTML;
        }
      }
    } catch (e) { }

/* ── Block 3 ── */
document.addEventListener("DOMContentLoaded", () => {
      // Initialize multiple galleries
      const galleries = Array.from(document.querySelectorAll('.masonry'));
      const tiles = Array.from(document.querySelectorAll('.photo-tile'));
      const images = Array.from(document.querySelectorAll('.photo-tile img'));

      // Remove lazy loading attributes to fetch thumbnails immediately
      images.forEach(img => {
        img.loading = "eager";
        img.removeAttribute('loading');
      });

      let isInit = false;

      function initGallery() {
        if (isInit) return;
        isInit = true;

        galleries.forEach(g => g.classList.add('ready'));

        const obs = new IntersectionObserver((entries, observer) => {
          const visibleEntries = entries.filter(entry => entry.isIntersecting);
          if (!visibleEntries.length) return;

          const rows = [];
          const rowTolerance = 80;

          visibleEntries.forEach(entry => {
            const top = entry.boundingClientRect.top;
            let placed = false;

            for (let row of rows) {
              if (Math.abs(row.top - top) < rowTolerance) {
                row.entries.push(entry);
                placed = true;
                break;
              }
            }
            if (!placed) {
              rows.push({ top: top, entries: [entry] });
            }
          });

          rows.sort((a, b) => a.top - b.top);

          rows.forEach((row, rowIndex) => {
            row.entries.forEach(entry => {
              setTimeout(() => {
                entry.target.classList.add('visible');
              }, rowIndex * 120);
              observer.unobserve(entry.target);
            });
          });
        }, { threshold: 0.04 });

        tiles.forEach(t => obs.observe(t));
      }

      // Modern Promise-based loading & decoding pipeline
      Promise.all(images.map(img => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = resolve;
            img.onerror = resolve; // Ensure a broken image doesn't halt the whole gallery
          }
        }).then(() => {
          return img.decode ? img.decode().catch(() => { }) : Promise.resolve();
        });
      })).then(() => {
        initGallery();
      });

      // Increased fallback timeout just in case network hangs. 
      setTimeout(initGallery, 3000);

      // Lightbox Logic
      const lb = document.getElementById('lb');
      const lbImg = document.getElementById('lbimg');
      const lbCap = document.getElementById('lbcap');

      const photos = tiles.map(t => ({
        full: t.dataset.full,
        thumb: t.querySelector('img').src,
        cap: t.dataset.cap || ''
      }));

      let currentIndex = 0;
      let highResPreloader = null;

      // --- GPU Pre-warm the lightbox ---
      // On the very first open, the browser has never had to build the
      // compositing layers for the backdrop blur / background fade / opacity
      // fade, so instead of animating smoothly it just snaps straight to the
      // end state (the "flash"). Fix: render the lightbox once at opacity:0
      // (invisible) right after load so those layers exist ahead of time.
      // Every open after that is instant + smooth, which matches what we
      // already see after the first click.
      function prewarmLightbox() {
        lb.classList.add('lb-prewarm');
        void lb.offsetHeight; // force a synchronous layout/paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            lb.classList.remove('lb-prewarm');
          });
        });
      }
      prewarmLightbox();

      function updateLightbox() {
        if (!photos.length) return;

        const currentData = photos[currentIndex];

        lbImg.src = currentData.thumb;
        lbCap.textContent = currentData.cap;

        if (highResPreloader) {
          highResPreloader.onload = null;
        }

        highResPreloader = new Image();
        highResPreloader.src = currentData.full;

        highResPreloader.onload = () => {
          if (photos[currentIndex] === currentData) {
            lbImg.src = currentData.full;
          }
        };
      }

      function closeLightbox() {
        lb.classList.remove('open');
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }

      function navigateLightbox(dir) {
        if (!photos.length) return;
        currentIndex = (currentIndex + dir + photos.length) % photos.length;
        updateLightbox();
      }

      tiles.forEach((tile, idx) => {
        tile.addEventListener('click', () => {
          currentIndex = idx;
          updateLightbox();
          lb.classList.add('open');
          document.body.style.overflow = 'hidden';
          document.documentElement.style.overflow = 'hidden';
        });
      });

      document.getElementById('lb-bg').addEventListener('click', closeLightbox);
      document.getElementById('lb-close').addEventListener('click', closeLightbox);
      document.getElementById('lb-prev').addEventListener('click', () => navigateLightbox(-1));
      document.getElementById('lb-next').addEventListener('click', () => navigateLightbox(1));

      document.addEventListener('keydown', (e) => {
        if (!lb.classList.contains('open')) return;
        if (e.key === 'ArrowRight') navigateLightbox(1);
        if (e.key === 'ArrowLeft') navigateLightbox(-1);
        if (e.key === 'Escape') closeLightbox();
      });

      // --- ADD: Touch & Trackpad Swipe Navigation for Photography Lightbox ---
      (function () {
        const lbBox = document.querySelector('.lbbox');
        if (!lbBox) return;

        // Mobile touch
        let lbStartX = 0;
        let lbStartY = 0;
        let isCarouselInteract = false;

        lbBox.addEventListener('touchstart', (e) => {
          if (e.touches.length > 1) return;
          if (e.target.closest('.cw')) {
            isCarouselInteract = true;
            return;
          }
          isCarouselInteract = false;
          lbStartX = e.touches[0].clientX;
          lbStartY = e.touches[0].clientY;
        }, { passive: true });

        lbBox.addEventListener('touchend', (e) => {
          if (isCarouselInteract) return;
          const diffX = lbStartX - e.changedTouches[0].clientX;
          const diffY = lbStartY - e.changedTouches[0].clientY;
          if (Math.abs(diffX) > 50 && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0) navigateLightbox(1);
            else navigateLightbox(-1);
          }
        }, { passive: true });

        // Desktop trackpad
        let isLbTrackpadSwiping = false;
        lbBox.addEventListener('wheel', (e) => {
          if (isLbTrackpadSwiping || e.target.closest('.cw')) return;
          if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 25) {
            isLbTrackpadSwiping = true;
            if (e.deltaX > 0) navigateLightbox(1);
            else navigateLightbox(-1);
            setTimeout(() => { isLbTrackpadSwiping = false; }, 400);
          }
        }, { passive: true });
      })();

      // --- CUSTOM SCROLL SPY FOR SIDEBAR ---
      // window.addEventListener('scroll', () => {
      //   const triggerPoint = window.innerHeight * 0.45;
      //   const sections = [
      //     { id: 'top', k: 'top' },
      //     { id: 'sec-nature', k: 'nature' },
      //     { id: 'sec-architecture', k: 'architecture' },
      //     { id: 'sec-subject', k: 'subject' },
      //     { id: 'sec-misc', k: 'misc' }
      //   ];

      //   let activeK = 'top';
      //   for (const sec of sections) {
      //     const el = document.getElementById(sec.id);
      //     if (el && el.getBoundingClientRect().top < triggerPoint) {
      //       activeK = sec.k;
      //     }
      //   }

      //   document.querySelectorAll('#sb-nav .sbn').forEach(a => {
      //     a.classList.toggle('active', a.dataset.k === activeK);
      //   });
      // }, { passive: true });
      // --------------------------------------
    });
