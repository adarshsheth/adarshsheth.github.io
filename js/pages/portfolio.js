/* ─────────────────────────────────────────────
   PORTFOLIO — page-specific scripts
   Consolidated Oct 2026 from inline <script> blocks.
   (Blocks concatenated in original document order.)
   ───────────────────────────────────────────── */

/* ── Block 1 ── */
// --- VIDEO MANAGER ---
    document.addEventListener("DOMContentLoaded", () => {
      const videos = document.querySelectorAll("video.cimg");

      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          const vid = e.target;
          if (!e.isIntersecting) {
            vid.pause();
          } else if (vid.classList.contains("on") && getComputedStyle(vid).display !== "none") {
            vid.play().catch(() => { });
          }
        });
      }, { threshold: 0.1 });

      videos.forEach(vid => io.observe(vid));
    });

    // // --- LONG PRESS STATE FOR MOBILE TILES ---
    // let lbLongPressTimer = null;
    // let lbIsLongPress = false;
    // let lbTouchStartX = 0;
    // let lbTouchStartY = 0;

    // // 1. Listen for when the user touches a card
    // document.addEventListener('touchstart', (e) => {
    //   const summary = e.target.closest('.ec-summary');
    //   if (!summary) return;

    //   const stack = summary.closest('.card-stack');
    //   // Only apply this logic to tiles
    //   if (stack && stack.classList.contains('tile-mode')) {
    //     lbIsLongPress = false;
    //     lbTouchStartX = e.touches[0].clientX;
    //     lbTouchStartY = e.touches[0].clientY;

    //     // Start a 500ms timer. If it finishes before they let go, open the lightbox!
    //     lbLongPressTimer = setTimeout(() => {
    //       lbIsLongPress = true;
    //       pfOpenLightbox(summary);
    //     }, 500);
    //   }
    // }, { passive: true });

    // // 2. Cancel the long-press if the user scrolls or jiggles their finger too much
    // document.addEventListener('touchmove', (e) => {
    //   if (!lbLongPressTimer) return;
    //   const dx = Math.abs(e.touches[0].clientX - lbTouchStartX);
    //   const dy = Math.abs(e.touches[0].clientY - lbTouchStartY);
    //   if (dx > 10 || dy > 10) {
    //     clearTimeout(lbLongPressTimer);
    //     lbLongPressTimer = null;
    //   }
    // }, { passive: true });

    // // 3. Cancel the timer if they let go early (it was just a quick tap)
    // document.addEventListener('touchend', () => {
    //   clearTimeout(lbLongPressTimer);
    //   lbLongPressTimer = null;
    // }, { passive: true });

    // document.addEventListener('touchcancel', () => {
    //   clearTimeout(lbLongPressTimer);
    //   lbLongPressTimer = null;
    // }, { passive: true });

    // --- ACCORDION TOGGLE LOGIC --- 
    function toggleCardDetails(element) {
      const item = element.closest('.ec-item');
      if (item && item.classList.contains('in-lightbox')) return; // stays open while inside the lightbox

      const stack = element.closest('.card-stack');

      // if (stack && stack.classList.contains('tile-mode')) {
      //   // If it was a long-press on mobile, the lightbox already opened. Reset and do nothing here.
      //   if (lbIsLongPress) {
      //     setTimeout(() => { lbIsLongPress = false; }, 100);
      //     return;
      //   }

      //   // For EVERYTHING else (Desktop clicks OR Mobile quick taps), open the lightbox!
      //   pfOpenLightbox(element);
      //   return;
      // }
      if (stack && stack.classList.contains('tile-mode')) {
        pfOpenLightbox(element);
        return;
      }

      // Standard accordion expansion logic (Now only applies to list-mode)
      const card = element.closest('.ec-card');
      card.classList.toggle('open');
      const icon = element.querySelector('.expand-icon');

      //   if (card.classList.contains('open')) {
      //     // icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
      //   } else {
      //     // icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
      //     const rect = card.getBoundingClientRect();
      //     if (rect.top < 0) {
      //       const navOffset = document.getElementById('hdr') ? document.getElementById('hdr').offsetHeight : 50;
      //       window.scrollBy({ top: rect.top - navOffset - 20, behavior: 'smooth' });
      //     }
      //   }
      // }


      if (card.classList.contains('open')) {
        // icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
      } else {
        // icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
        const rect = card.getBoundingClientRect();
        if (rect.top < 0) {
          const navOffset = document.getElementById('hdr') ? document.getElementById('hdr').offsetHeight : 50;
          window.scrollBy({ top: rect.top - navOffset - 20, behavior: 'smooth' });
        }
      }
    }

    // --- CLICK ANYWHERE TO CLOSE EXPANDED CARD (LIST MODE) ---
    document.addEventListener('click', (e) => {
      // 1. Ensure the click happened inside the details section of an open card
      const details = e.target.closest('.ec-details');
      if (!details) return;

      const card = details.closest('.ec-card');
      if (!card || !card.classList.contains('open')) return;

      // 2. Ignore if we are in tile mode (lightbox view)
      const stack = card.closest('.card-stack');
      if (stack && stack.classList.contains('tile-mode')) return;

      // 3. Ignore clicks on interactive elements (links, buttons, carousels)
      if (e.target.closest('a, button, .cw')) return;

      // 4. Ignore if the user is currently selecting text
      if (window.getSelection().toString().length > 0) return;

      // 5. Safely close the card by triggering the toggle on the summary
      const summary = card.querySelector('.ec-summary');
      if (summary) toggleCardDetails(summary);
    });










    // --- CARD CONTENT LIGHTBOX (tile mode only) ---
    let pfLbHome = null;
    let pfLbClone = null;

    function pfOpenLightbox(element) {
      const item = element.closest('.ec-item');
      if (!item) return;

      pfLbClone = item.cloneNode(true);
      item.parentNode.insertBefore(pfLbClone, item);

      pfLbHome = { node: item, parent: item.parentNode };

      const content = document.getElementById('card-lb-content');
      content.innerHTML = '';
      content.appendChild(item);
      item.classList.add('in-lightbox');

      const card = item.querySelector('.ec-card');
      if (card) {
        card.classList.add('open');
        const icon = card.querySelector('.expand-icon');
        // if (icon) icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
      }

      document.getElementById('card-lb').classList.add('open');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden'; // Ensure iOS Safari respects the lock

      // Push state WITH a hash so mobile browsers explicitly register a page change
      // history.pushState({ lightboxOpen: true }, "", "#detail");
      if (item.id) {
        history.pushState({ lightboxOpen: true }, "", "#" + item.id);
      }
    }

    // Intercept the browser/system back button
    window.addEventListener('popstate', (e) => {
      if (document.getElementById('card-lb').classList.contains('open')) {
        pfCloseLightbox(true); // Pass flag to signify it was closed via back button
      }
    });

    function pfCloseLightbox(fromPopState = false) {
      const lb = document.getElementById('card-lb');
      if (!lb.classList.contains('open')) return;

      lb.classList.remove('open');
      document.body.style.overflow = '';
      document.documentElement.style.overflow = ''; // Release the lock

      if (pfLbHome) {
        const { node, parent } = pfLbHome;
        setTimeout(() => {
          const card = node.querySelector('.ec-card');
          if (card) {
            card.classList.remove('open');
            const icon = card.querySelector('.expand-icon');
            // if (icon) icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
          }
          node.classList.remove('in-lightbox');
          if (pfLbClone && pfLbClone.parentNode) {
            pfLbClone.parentNode.replaceChild(node, pfLbClone);
          } else {
            parent.appendChild(node);
          }
          pfLbClone = null;
          pfLbHome = null;
        }, 250);
      }

      // If closed manually via the X button or backdrop, reverse the dummy state
      // if (fromPopState !== true && window.location.hash === '#detail') {
      //   history.back();
      // }

      // // Fallback: forcefully strip the hash from the URL bar visually 
      // // (Runs a split second later to ensure history.back() doesn't conflict)
      // setTimeout(() => {
      //   if (window.location.hash === '#detail') {
      //     history.replaceState(null, "", window.location.pathname + window.location.search);
      //   }
      // }, 50);
      // Check if the current hash matches the open card before going back
      const currentCardId = pfLbHome && pfLbHome.node ? pfLbHome.node.id : '';
      if (fromPopState !== true && window.location.hash === '#' + currentCardId) {
        history.back();
      }

      // Fallback to strip ANY hash on close to prevent reload loops
      setTimeout(() => {
        if (window.location.hash) {
          history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }, 50);
    }

    // function pfLbNav(dir) {
    //   if (!pfLbHome || !pfLbHome.node || !pfLbClone) return;

    //   const stack = pfLbHome.parent;
    //   if (!stack) return;

    //   // Get all visible items in the current stack
    //   const items = Array.from(stack.querySelectorAll('.ec-item')).filter(item => item.style.display !== 'none');
    //   if (items.length <= 1) return;

    //   // FIX: Look for pfLbClone instead of the original node (which is currently inside the lightbox)
    //   const currentIndex = items.indexOf(pfLbClone);
    //   if (currentIndex === -1) return;

    //   const nextIndex = (currentIndex + dir + items.length) % items.length;
    //   const nextItem = items[nextIndex];

    //   // Clean up current item cleanly
    //   const currentItem = pfLbHome.node;
    //   const currentCard = currentItem.querySelector('.ec-card');
    //   if (currentCard) currentCard.classList.remove('open');
    //   currentItem.classList.remove('in-lightbox');

    //   // FIX: Replace the clone in the stack with the original item
    //   stack.replaceChild(currentItem, pfLbClone);

    //   // Setup the next item in the lightbox
    //   pfLbClone = nextItem.cloneNode(true);
    //   stack.insertBefore(pfLbClone, nextItem);

    //   pfLbHome = { node: nextItem, parent: stack };

    //   const content = document.getElementById('card-lb-content');
    //   content.innerHTML = '';
    //   content.appendChild(nextItem);
    //   nextItem.classList.add('in-lightbox');

    //   const nextCard = nextItem.querySelector('.ec-card');
    //   if (nextCard) nextCard.classList.add('open');

    //   // Reset scroll position
    //   content.scrollTop = 0;
    // }
    function pfLbNav(dir) {
      if (!pfLbHome || !pfLbHome.node || !pfLbClone) return;

      // 1. Select ALL visible items across ALL sections. 
      // Querying '.card-stack .ec-item' automatically skips the hidden master pool 
      // and captures the exact top-to-bottom visual order of the page.
      const visibleItems = Array.from(document.querySelectorAll('.card-stack .ec-item'))
        .filter(item => item.style.display !== 'none');

      if (visibleItems.length <= 1) return;

      // 2. The clone acts as our placeholder in the grid. Find its index globally.
      const currentIndex = visibleItems.indexOf(pfLbClone);
      if (currentIndex === -1) return;

      // 3. Calculate the next index, looping around if we hit the start or end.
      const nextIndex = (currentIndex + dir + visibleItems.length) % visibleItems.length;
      const nextItem = visibleItems[nextIndex];

      // 4. Clean up the currently open item and return it to its original grid spot.
      const currentItem = pfLbHome.node;
      const currentCard = currentItem.querySelector('.ec-card');
      if (currentCard) currentCard.classList.remove('open');
      currentItem.classList.remove('in-lightbox');

      pfLbHome.parent.replaceChild(currentItem, pfLbClone);

      // 5. Prepare the next item by cloning it and recording its new home stack.
      const nextParent = nextItem.parentNode;
      pfLbClone = nextItem.cloneNode(true);
      nextParent.insertBefore(pfLbClone, nextItem);

      pfLbHome = { node: nextItem, parent: nextParent };

      // 6. Move the next item into the lightbox overlay.
      const content = document.getElementById('card-lb-content');
      content.innerHTML = '';
      content.appendChild(nextItem);
      nextItem.classList.add('in-lightbox');

      const nextCard = nextItem.querySelector('.ec-card');
      if (nextCard) nextCard.classList.add('open');

      // 7. Reset the lightbox scroll position to the top.
      content.scrollTop = 0;

      // Replace current state so we don't clutter the back button history
      if (nextItem.id) {
        history.replaceState({ lightboxOpen: true }, "", "#" + nextItem.id);
      }
    }











    // document.addEventListener('keydown', (e) => {
    //   if (document.getElementById('card-lb').classList.contains('open')) {
    //     if (e.key === 'Escape') pfCloseLightbox();
    //     else if (e.key === 'ArrowRight') pfLbNav(1);
    //     else if (e.key === 'ArrowLeft') pfLbNav(-1);
    //   }
    // });
    // document.addEventListener('keydown', (e) => {
    //     if (document.getElementById('card-lb').classList.contains('open')) {
    //       // Stop execution if the inner image lightbox is currently open
    //       const imgLightbox = document.getElementById('lb');
    //       if (imgLightbox && imgLightbox.classList.contains('open')) return;

    //       if (e.key === 'Escape') pfCloseLightbox();
    //       else if (e.key === 'ArrowRight') pfLbNav(1);
    //       else if (e.key === 'ArrowLeft') pfLbNav(-1);
    //     }
    //   });
    document.addEventListener('keydown', (e) => {
      const cardLb = document.getElementById('card-lb');
      const imgLb = document.getElementById('lb');

      if (cardLb && cardLb.classList.contains('open')) {
        // Stop execution if the inner image lightbox is currently open
        if (imgLb && imgLb.classList.contains('open')) {
          return;
        }

        // If the image lightbox is closed, handle the EC card normally
        if (e.key === 'Escape') pfCloseLightbox();
        else if (e.key === 'ArrowRight') pfLbNav(1);
        else if (e.key === 'ArrowLeft') pfLbNav(-1);
      }
    });

    // --- FLOAT-UP REVEAL ON SCROLL ---
    let pfRevealObserver = null;

    function pfInitReveal() {
      if (pfRevealObserver) pfRevealObserver.disconnect();

      pfRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            pfRevealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px 50px 0px' });

      document.querySelectorAll('.ec-item').forEach((item) => {
        if (!item.classList.contains('visible') && item.style.display !== 'none') {
          pfRevealObserver.observe(item);
        }
      });
    }
    // let pfRevealObserver = null;

    //   function pfInitReveal() {
    //     if (pfRevealObserver) pfRevealObserver.disconnect();

    //     // Lowered threshold and added a positive rootMargin to trigger slightly before scrolling into view
    //     pfRevealObserver = new IntersectionObserver((entries) => {
    //       entries.forEach((entry) => {
    //         if (entry.isIntersecting) {
    //           entry.target.classList.add('visible');
    //           pfRevealObserver.unobserve(entry.target);
    //         }
    //       });
    //     }, { threshold: 0.05, rootMargin: '0px 0px 50px 0px' });

    //     document.querySelectorAll('.ec-item').forEach((item) => {
    //       if (!item.classList.contains('visible') && item.style.display !== 'none') {

    //         // NEW: Immediately show items that are already in the viewport on page load
    //         if (item.getBoundingClientRect().top < window.innerHeight) {
    //           // Slight delay ensures the CSS has processed before adding the class
    //           setTimeout(() => item.classList.add('visible'), 50);
    //         } else {
    //           pfRevealObserver.observe(item);
    //         }

    //       }
    //     });
    //   }

    // document.addEventListener('DOMContentLoaded', () => {
    //   if (typeof filterPortfolio === 'function') {
    //     const urlParams = new URLSearchParams(window.location.search);
    //     const filterTag = urlParams.get('filter') || 'all';
    //     filterPortfolio(filterTag);
    //   }
    // });

    // --- FILTER & SIDEBAR SYNC LOGIC ---
    function filterPortfolio(tag) {
      const url = new URL(window.location);
      if (tag === 'all') {
        url.searchParams.delete('filter');
      } else {
        url.searchParams.set('filter', tag);
      }
      window.history.replaceState({}, '', url);

      pfCloseLightbox();

      // Prevent layout shift transitions from firing
      document.body.classList.add('filtering-active');

      // 👇 NEW LOGIC HERE 👇
      document.querySelectorAll('.card-stack').forEach((stack) => {
        const isMobile = window.innerWidth <= 800; // Match your mobile CSS breakpoint
        stack.classList.toggle('tile-mode', tag === 'all' || isMobile);
      });
      // 👆 END NEW LOGIC 👆

      document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.tag === tag) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      // ... (rest of the function remains the same)

      const pool = document.getElementById('master-card-pool');
      const stacks = {
        'teams': document.getElementById('stack-teams'),
        'leadership': document.getElementById('stack-leadership'),
        'projects': document.getElementById('stack-projects'),
        'educational': document.getElementById('stack-educational')
      };

      // Safely move existing cards back to the pool to re-evaluate placement
      Object.values(stacks).forEach(stack => {
        while (stack.firstChild) {
          pool.appendChild(stack.firstChild);
        }
      });

      const allCards = Array.from(pool.children);

      // Sort cards numerically by their data-order attribute (descending: highest first)
      allCards.sort((a, b) => {
        const orderA = a.dataset.order ? parseInt(a.dataset.order) : -1;
        const orderB = b.dataset.order ? parseInt(b.dataset.order) : -1;
        return orderB - orderA;
      });

      allCards.forEach(card => {
        const tags = card.dataset.tags.split(' ');
        const isVisible = (tag === 'all' || tags.includes(tag));

        if (isVisible) {
          const sections = card.dataset.sections.split(' ');
          let targetSec = sections[0];

          // LOGIC: If filter is applied ('all' is default), and card has multiple sections, assign to secondary section.
          if (tag !== 'all' && sections.length > 1) {
            targetSec = sections[1];
          }

          card.style.display = 'block';
          card.classList.remove('visible');

          if (stacks[targetSec]) {
            stacks[targetSec].appendChild(card);
          }
        } else {
          card.style.display = 'none';
          card.classList.remove('visible');
        }
      });

      const sections = document.querySelectorAll('.portfolio-sec');
      sections.forEach(sec => {
        const stack = sec.querySelector('.card-stack');
        const hasVisibleCards = stack && stack.children.length > 0;

        sec.style.display = hasVisibleCards ? 'block' : 'none';

        const secId = sec.getAttribute('data-k');
        const sidebarLink = document.querySelector(`.sbn[data-k="${secId}"]`);
        if (sidebarLink) {
          sidebarLink.style.display = hasVisibleCards ? 'flex' : 'none';
        }
      });

      if (typeof runCoreScrollTasks === 'function') {
        runCoreScrollTasks(window.scrollY);
      }

      // Force reflow and restore transitions
      void document.body.offsetWidth;
      document.body.classList.remove('filtering-active');

      setTimeout(() => pfInitReveal(), 50);


      // Force reflow and restore transitions
      void document.body.offsetWidth;
      document.body.classList.remove('filtering-active');

      setTimeout(() => pfInitReveal(), 50);

      // FIX: Close all expanded cards when switching filters
      document.querySelectorAll('.ec-card.open').forEach(card => card.classList.remove('open'));

      // FIX: Fade out, swap background, then fade in
      // document.body.classList.add('bg-fade-out');

      // Wait for the opacity to hit 0 (200ms) before swapping the image class
      setTimeout(() => {
        // Strip existing bg- classes
        document.body.className = document.body.className.replace(/bg-\S+/g, '').trim();
        // Apply new background class
        document.body.classList.add('bg-' + tag);

        // Wait a tiny bit for the browser to register the new image, then fade back in
        // setTimeout(() => {
        //   document.body.classList.remove('bg-fade-out');
        // }, 50);
      }, 200);
    }
    document.addEventListener('DOMContentLoaded', () => {
      const params = new URLSearchParams(window.location.search);
      const filterTag = params.get('filter') || 'all'; // Default to 'all' if no filter in URL

      // Run the filter immediately
      filterPortfolio(filterTag);

      // Background class will be handled inside filterPortfolio()
    });
    // 👇 ADD THIS LISTENER 👇
    window.addEventListener('resize', () => {
      const params = new URLSearchParams(window.location.search);
      const tag = params.get('filter') || 'all';
      const isMobile = window.innerWidth <= 800;

      document.querySelectorAll('.card-stack').forEach((stack) => {
        stack.classList.toggle('tile-mode', tag === 'all' || isMobile);

        // Safety cleanup: If switching to tile mode on resize, close any open list accordions
        if ((tag === 'all' || isMobile) && stack.classList.contains('tile-mode')) {
          stack.querySelectorAll('.ec-card.open').forEach(c => c.classList.remove('open'));
        }
      });
    });








  window.addEventListener('load', () => {
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      // Find the element matching the hash (e.g., #ray)
      const targetCard = document.querySelector(hash);

      // Ensure it's a valid portfolio card before opening
      if (targetCard && targetCard.classList.contains('ec-item')) {
        const summary = targetCard.querySelector('.ec-summary');
        if (summary) {
          // Slight delay ensures CSS/filters have settled before animating
          setTimeout(() => pfOpenLightbox(summary), 250);
        }
      }
    }
  });







    document.addEventListener('DOMContentLoaded', () => {
      // Find all ec-subtitles and reformat them for the mobile dot/newline layout
      document.querySelectorAll('.ec-subtitle').forEach(sub => {
        const text = sub.innerText;

        // Only process if it contains the pipe character
        if (text.includes('|')) {
          const parts = text.split('|');

          if (parts.length === 2) {
            const role = parts[0].trim();
            const date = parts[1].trim();

            // Rewrite the HTML structure
            sub.innerHTML = `
                    <span class="sub-role">${role}<span class="sub-mobile-dot"> •</span></span>
                    <span class="sub-date">
                        <span class="sub-desktop-pipe"> | </span>
                        
                        ${date}
                    </span>
                `;
          }
        }
      });
    });
















    document.addEventListener("DOMContentLoaded", () => {
      // Map the raw data-tags to your preferred display text
      const tagMap = {
        'aero': 'AERO',
        'astro': 'ASTRO',
        'robotics': 'ROBOTICS',
        'general': 'GENERAL'
      };

      document.querySelectorAll('.ec-item').forEach(item => {
        const tags = item.dataset.tags ? item.dataset.tags.split(' ') : [];
        const brow = item.querySelector('.brow');

        if (brow) {
          // Create a clickable badge for each valid category tag
          tags.forEach(tag => {
            if (tagMap[tag]) {
              const badge = document.createElement('span');
              badge.className = 'badge cat-badge';
              badge.textContent = tagMap[tag];

              // Trigger the filter and prevent the lightbox from opening
              badge.onclick = (e) => {
                e.stopPropagation();
                filterPortfolio(tag);

                // Optional: smoothly scroll back to the top of the portfolio section
                document.getElementById('mn').scrollIntoView({ behavior: 'smooth' });
              };

              // Insert at the beginning of the badge row
              brow.prepend(badge);
            }
          });
        }
      });
    });
