const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.3 },
);

const animatedElements = document.querySelectorAll('.animate');
animatedElements.forEach((el) => observer.observe(el));
