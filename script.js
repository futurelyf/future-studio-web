// ===== THEME TOGGLE (dark by default, remembers choice) =====
const toggleBtn = document.getElementById("theme-toggle");
toggleBtn?.addEventListener("click", () => {
  const isLight =
    document.documentElement.getAttribute("data-theme") === "light";
  if (isLight) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  }
});

// ===== Parallax drift on the floating tags =====
const tags = document.querySelectorAll(".tag");
const canHover = window.matchMedia(
  "(hover: hover) and (pointer: fine)",
).matches;
if (canHover) {
  window.addEventListener("mousemove", (e) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    tags.forEach((tag, i) => {
      const depth = (i + 1) * 6;
      const rot = tag.dataset.rot || 0;
      tag.style.transform = `translate(${x * depth}px, ${y * depth}px) rotate(${rot}deg)`;
    });
  });
}

// ===== Auto-updating copyright year =====
document.addEventListener("DOMContentLoaded", () => {
  const currentYear = new Date().getFullYear(); // → 2026
  document.querySelectorAll(".year").forEach((el) => {
    el.textContent = currentYear;
  });
});

// ===== Scrollbar width probe (macOS overlays report 0, Windows reserves ~12-17px) =====
const sbProbe = document.createElement("div");
sbProbe.style.cssText = "position:absolute;visibility:hidden;overflow:scroll;";
document.body.appendChild(sbProbe);
const sbWidth = sbProbe.offsetWidth - sbProbe.clientWidth;
sbProbe.remove();
document.documentElement.style.setProperty("--sbw", sbWidth + "px");

// ===== Smooth scroll for in-page anchor links (only href="#...") =====
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const t = document.querySelector(a.getAttribute("href"));
    if (t) {
      e.preventDefault();
      t.scrollIntoView({ behavior: "smooth" });
    }
  });
});
