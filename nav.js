// 1. Dynamically load the header and footer from nav.html
fetch('nav.html')
.then(response => response.text())
.then(data => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    const header = doc.querySelector('header');
    const footer = doc.querySelector('footer');
    
    // Auto-detect the active page based on the document title 
    // (e.g., "PORTFOLIO | Adarsh Sheth" -> activePage = 'PORTFOLIO')
    let activePage = 'HOME'; // default
    const pageTitle = document.title.toUpperCase();
    if (pageTitle.includes('PORTFOLIO')) activePage = 'PORTFOLIO';
    else if (pageTitle.includes('RESUME')) activePage = 'RESUME';
    else if (pageTitle.includes('BLOG')) activePage = 'BLOG';
    
    // ==========================================
    // HEADER INJECTION & LOGIC
    // ==========================================
    if (header) {
        // Update active state dynamically
        header.querySelectorAll('.ni').forEach(link => {
            if (link.textContent.trim().includes(activePage)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Inject into DOM
        const navPlaceholder = document.getElementById('nav-placeholder');
        if (navPlaceholder) {
            navPlaceholder.replaceWith(header);
        }

        // Safely initialize Header Scroll & Dropdown behaviors 
        const hdr = document.getElementById('hdr');
        const dd  = document.getElementById('nav-dd');
        let hovering = false, hid = false, ly = window.scrollY, delta = 0;

        function showNav() {
            if (hid && hdr) {
                hdr.style.transition = 'transform 0.52s cubic-bezier(0.34, 1.36, 0.64, 1)';
                hdr.style.transform  = 'translateY(0)';
                hid = false; delta = 0;
            }
        }
        function hideNav() {
            if (!hid && hdr) {
                hdr.style.transition = 'transform 0.28s cubic-bezier(0.4, 0, 0.8, 1)';
                hdr.style.transform  = 'translateY(-120%)';
                hid = true; delta = 0;
            }
        }

        [hdr, dd].forEach(el => {
            if (!el) return;
            el.addEventListener('mouseenter', () => { hovering = true; showNav(); });
            el.addEventListener('mouseleave', () => { hovering = false; ly = window.scrollY; });
        });

        window.addEventListener('scroll', () => {
            if (hovering) { ly = window.scrollY; delta = 0; return; }
            const y = window.scrollY;
            if (y <= 0) { showNav(); ly = y; return; }
            if (y < window.innerHeight * 0.15) { showNav(); ly = y; return; } // Initial show zone
            
            const d = y - ly;
            if (d > 0) { // Scrolling down
                delta = delta > 0 ? delta + d : d;
                if (!hid && delta >= 80) hideNav();
            } else if (d < 0) { // Scrolling up
                delta = delta < 0 ? delta + d : d;
                if (hid && -delta >= 20) showNav();
            }
            ly = y;
        }, { passive: true });

        // Dropdown hover bridges
        document.querySelectorAll('.ndrop').forEach(drop => {
            const navDd = drop.querySelector('.nav-dd');
            let t;
            drop.addEventListener('mouseenter', () => { clearTimeout(t); if(navDd) navDd.style.display = 'block'; });
            drop.addEventListener('mouseleave', () => { t = setTimeout(() => { if(navDd) navDd.style.display = 'none'; }, 160); });
            if (navDd) {
                navDd.addEventListener('mouseenter', () => clearTimeout(t));
                navDd.addEventListener('mouseleave', () => { t = setTimeout(() => { navDd.style.display = 'none'; }, 160); });
            }
        });
    }

    // ==========================================
    // FOOTER INJECTION & LOGIC
    // ==========================================
    if (footer) {
        // Update active state in footer dynamically
        footer.querySelectorAll('.fnav a').forEach(link => {
            if (link.textContent.trim() === activePage) {
                link.classList.add('fp');
            } else {
                link.classList.remove('fp');
            }
        });

        // Find existing footer or a placeholder to replace
        const existingFooter = document.querySelector('footer') || document.getElementById('footer-placeholder');
        if (existingFooter) {
            existingFooter.replaceWith(footer);
        } else {
            // Fallback: append to the end of the body if no footer element exists
            document.body.appendChild(footer);
        }
    }

})
.catch(error => console.error('Error loading navigation:', error));