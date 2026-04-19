document.addEventListener("DOMContentLoaded", () => {
  // // === CTA BUTTON LOGIC ===
  // const ctaButton = document.getElementById("cta-button");
  // if (ctaButton) {
  //   ctaButton.addEventListener("click", () => {
  //     alert("Let’s build something amazing!");
  //   });
  // }

  // === NAVBAR ACTIVE LINK LOGIC ===
  const navLinks = document.querySelectorAll('.nav-item');
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (linkPath === currentPath) {
      link.classList.add('active');
    }
  });
});
