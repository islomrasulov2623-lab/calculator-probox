// === Dev sanity tests ===
function approxEqual(a, b, tol = 2) { return Math.abs(a - b) <= tol; }
function runSanityTests() {
  // ... (testlar)
}

// Run tests only in dev; avoid illegal `import` usage
if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
  try {
    runSanityTests();
  } catch (e) {
    console.warn('Sanity tests failed', e);
  }
}
