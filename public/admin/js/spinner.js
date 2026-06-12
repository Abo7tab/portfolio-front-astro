/**
 * ═══════════════════════════════════════════
 *  Admin Panel — Loading Spinner Utilities
 * ═══════════════════════════════════════════
 *
 * Usage:
 *   // On a button:
 *   btnStartLoading(btn)   → disables + shows spinner
 *   btnStopLoading(btn)    → re-enables + restores text
 *
 *   // Full-screen overlay:
 *   showSaveOverlay('Saving...')
 *   hideSaveOverlay()
 *
 *   // Wrap an async submit:
 *   wrapSubmit(btn, async () => { await API.request(...) })
 */

// ── Button-level spinner ──
function btnStartLoading(btn) {
  if (!btn) return;
  btn._origHTML = btn.innerHTML;
  btn.innerHTML = `<span class="btn-text">${btn.innerHTML}</span>`;
  btn.classList.add('btn-loading');
  btn.disabled = true;
}

function btnStopLoading(btn) {
  if (!btn) return;
  btn.classList.remove('btn-loading');
  btn.disabled = false;
  if (btn._origHTML) btn.innerHTML = btn._origHTML;
}

// ── Full-screen overlay ──
function showSaveOverlay(message = 'Saving...') {
  if (document.getElementById('save-overlay')) return;
  const overlay = document.createElement('div');
  overlay.id = 'save-overlay';
  overlay.className = 'save-overlay';
  overlay.innerHTML = `
    <div class="save-overlay-inner">
      <div class="spinner-border text-primary mb-3" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mb-0 fw-semibold">${message}</p>
    </div>`;
  document.body.appendChild(overlay);
}

function hideSaveOverlay() {
  const el = document.getElementById('save-overlay');
  if (el) el.remove();
}

// ── Convenience wrapper for form submits ──
async function wrapSubmit(btn, asyncFn, overlayMsg) {
  btnStartLoading(btn);
  if (overlayMsg) showSaveOverlay(overlayMsg);
  try {
    await asyncFn();
  } finally {
    btnStopLoading(btn);
    hideSaveOverlay();
  }
}
