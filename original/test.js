const slides = document.querySelector('.slides');
const buttons = document.querySelectorAll('.buttons button');

function goToSlide(index) {
  // Move slides
  slides.style.transform = `translateX(-${index * 50}vw)`;

  // Enable all buttons
  buttons.forEach(btn => btn.disabled = false);
  buttons[index].disabled = true;
}