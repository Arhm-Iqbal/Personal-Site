// Ctrl+A (or Cmd+A) cycles the spear cursor's colour; the choice is remembered.
(() => {
  const colours = ["red", "blue", "green", "gold", "violet", "white"];
  const root = document.documentElement;
  const apply = (c) => { if (c === "red") delete root.dataset.spear; else root.dataset.spear = c; };
  let i = 0;
  try { i = Math.max(0, colours.indexOf(localStorage.getItem("spear-colour"))); } catch (_) {}
  apply(colours[i]);
  addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "a" || e.altKey || e.shiftKey) return;
    const t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    e.preventDefault();
    i = (i + 1) % colours.length;
    apply(colours[i]);
    try { localStorage.setItem("spear-colour", colours[i]); } catch (_) {}
  });
})();
