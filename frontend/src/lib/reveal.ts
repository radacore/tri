// IntersectionObserver (replay) for .reveal elements.
// Kelas reveal-visible ditambah saat masuk viewport dan DICABUT saat keluar,
// sehingga animasi main lagi setiap pengguna scroll bolak-balik.
// Safe to call multiple times (e.g. after client-side nav).
export function initReveal(): void {
  if (typeof document === 'undefined') return;
  const els = document.querySelectorAll<HTMLElement>('.reveal:not([data-reveal-bound])');
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('reveal-visible'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal-visible');
        } else {
          e.target.classList.remove('reveal-visible');
        }
      });
    },
    { threshold: 0.1 }
  );
  els.forEach((el) => {
    el.setAttribute('data-reveal-bound', 'true');
    io.observe(el);
  });
}
