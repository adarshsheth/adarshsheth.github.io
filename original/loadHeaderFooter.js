let work = true;

document.addEventListener("DOMContentLoaded", () => {
  if (work) {
    const header = document.querySelector("header");
    if (!header) return;

    header.style.position = "fixed";
    header.style.top = "0";
    header.style.left = "0";
    header.style.width = "100%";
    header.style.zIndex = "1000";
    header.style.transition = "transform 0.4s ease-in-out";

    let lastScrollY = window.scrollY;
    let scrollDelta = 0;
    let headerHidden = false;

    const hideThreshold = 25; // 📉 Scroll down buffer
    const showThreshold = 100; // 📈 Scroll up buffer

    window.addEventListener("scroll", () => {
      const currentY = window.scrollY;

      // 🧷 Always show at top
      if (currentY <= 0) {
        header.style.transform = "translateY(0)";
        headerHidden = false;
        scrollDelta = 0;
        lastScrollY = currentY;
        return;
      }

      const delta = currentY - lastScrollY;

      if (delta > 0) {
        // 🔽 Scrolling down
        scrollDelta += delta;
        if (!headerHidden && scrollDelta >= hideThreshold) {
          header.style.transform = "translateY(-100%)";
          headerHidden = true;
          scrollDelta = 0;
        }
      } else if (delta < 0) {
        // 🔼 Scrolling up
        scrollDelta -= delta;
        if (headerHidden && scrollDelta >= showThreshold) {
          header.style.transform = "translateY(0)";
          headerHidden = false;
          scrollDelta = 0;
        }
      }

      lastScrollY = currentY;
    });
  }
});
