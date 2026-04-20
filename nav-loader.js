/**
 * nav-loader.js  ·  Adarsh Sheth Site
 * ─────────────────────────────────────────────────────────────
 * Fetches topnavbar.html and injects its contents into the page:
 *   • <style>   → appended to <head>   (takes effect immediately)
 *   • <header>  → injected into #nav-placeholder
 *   • <footer>  → injected into #nav-footer-placeholder
 *   • Other HTML (lightbox, toast) → injected into #nav-placeholder
 *   • <script>  → re-created as live script nodes so they execute
 *
 * ⚠  fetch() requires HTTP. Run locally:
 *     python -m http.server 8080  →  http://localhost:8080
 */
(function () {
  var NAVBAR_FILE = 'topnavbar.html';

  /* Helper: re-execute <script> tags that were injected via innerHTML */
  function runScripts(container) {
    container.querySelectorAll('script').forEach(function (old) {
      var s = document.createElement('script');
      Array.prototype.forEach.call(old.attributes, function (a) {
        s.setAttribute(a.name, a.value);
      });
      s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
  }

  /* Helper: move <style> tags to <head> so they apply globally */
  function hoistStyles(container) {
    container.querySelectorAll('style').forEach(function (style) {
      document.head.appendChild(style);
    });
  }

  fetch(NAVBAR_FILE)
    .then(function (r) {
      if (!r.ok) throw new Error('nav-loader: HTTP ' + r.status);
      return r.text();
    })
    .then(function (html) {
      /* Parse the fragment into a temporary container */
      var tmp = document.createElement('div');
      tmp.innerHTML = html;

      /* 1. Pull <style> tags to <head> first so tokens are available */
      hoistStyles(tmp);

      /* 2. Inject <header> into #nav-placeholder */
      var headerEl = tmp.querySelector('header');
      var navSlot  = document.getElementById('nav-placeholder');
      if (headerEl && navSlot) {
        /* Also inject lightbox + toast (everything before header) */
        var frag = document.createDocumentFragment();
        /* Move non-header, non-footer, non-script nodes first */
        Array.prototype.slice.call(tmp.childNodes).forEach(function (node) {
          if (node.tagName === 'FOOTER' || node.tagName === 'SCRIPT') return;
          frag.appendChild(node.cloneNode(true));
        });
        navSlot.appendChild(frag);
        runScripts(navSlot);
      }

      /* 3. Inject <footer> into #nav-footer-placeholder */
      var footerEl   = tmp.querySelector('footer');
      var footerSlot = document.getElementById('nav-footer-placeholder');
      if (footerEl && footerSlot) {
        footerSlot.appendChild(footerEl.cloneNode(true));
      }

      /* 4. Execute the <script> block (shared JS: hide-on-scroll, lightbox, etc.) */
      tmp.querySelectorAll('script').forEach(function (old) {
        var s = document.createElement('script');
        s.textContent = old.textContent;
        document.body.appendChild(s);
      });
    })
    .catch(function (err) {
      console.warn('[nav-loader] Could not load topnavbar.html:', err.message);
      console.warn('[nav-loader] Are you running over HTTP? Try: python -m http.server 8080');
    });
})();
