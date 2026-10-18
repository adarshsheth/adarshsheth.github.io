/* ─────────────────────────────────────────────
   ACCESS CONTROL — Protect private pages
   Include this at the TOP of app-hub.html and digital-garden pages.
   If not logged in, shows 404. If logged in with wrong account, signs out.
   ───────────────────────────────────────────── */

(function() {
  // Wait for Firebase auth to initialize
  function checkAccess() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      // Firebase not loaded yet, wait
      setTimeout(checkAccess, 100);
      return;
    }
    
    firebase.auth().onAuthStateChanged((user) => {
      const authorizedEmail = window.AUTHORIZED_EMAIL; // Set in auth.js
      
      if (!user || user.email !== authorizedEmail) {
        // Not logged in or wrong account — show 404
        document.body.innerHTML = `
          <div style="text-align:center;padding:100px 20px;font-family:sans-serif;">
            <h1 style="font-size:72px;margin:0;">404</h1>
            <p style="font-size:18px;color:#666;">Page not found.</p>
            <a href="/" style="color:#0066cc;">← Back to home</a>
          </div>
        `;
        document.title = '404 — Page not found';
        // Stop all other scripts
        throw new Error('Access denied');
      }
      // Authorized — let the page load normally
      document.body.classList.add('authorized');
    });
  }
  
  // Run immediately (before page content renders)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAccess);
  } else {
    checkAccess();
  }
})();
