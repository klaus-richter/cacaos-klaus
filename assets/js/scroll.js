// scroll.js — IntersectionObserver para fade-in al scroll
(function () {
  const els = document.querySelectorAll('[data-animate]');
  if (!els.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  els.forEach((el) => io.observe(el));
})();
