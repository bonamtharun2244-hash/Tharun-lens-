const menuBtn = document.getElementById("menuBtn");
const navMenu = document.getElementById("navMenu");

menuBtn.addEventListener("click", () => {
  navMenu.classList.toggle("open");
});

document.querySelectorAll("#navMenu a").forEach((link) => {
  link.addEventListener("click", () => navMenu.classList.remove("open"));
});

document
  .getElementById("contactForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const name = document.getElementById("name").value.trim();
    const course = document.getElementById("course").value;
    const message = document.getElementById("formMessage");

    message.textContent = `Thank you, ${name}! Your inquiry for ${course} has been received.`;
    this.reset();
  });
