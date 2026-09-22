/* main.js — oppstart */
(async () => {
  try { await Promise.all([document.fonts.load('600 30px Caveat'), document.fonts.load('400 20px "Patrick Hand"')]); } catch (e) { /* fallback-font */ }
  const ok = GL3D.init();
  if (!ok) console.warn('WebGL utilgjengelig – 3D-kapitlene vises uten kuler.');
  World3D.init();
  Engine.finalize();
})();
