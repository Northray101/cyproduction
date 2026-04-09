/* ============================================================
   CY Production Portal — Shared JavaScript
   ============================================================ */

'use strict';

/* ── Nav System ────────────────────────────────────────────── */

/**
 * initNav(config)
 *
 * config: {
 *   activeId:   string  — button id of the current page's nav item (e.g. 'notesBtn')
 *   routes:     object  — { target: () => void }  called when that tab is activated
 * }
 */
function initNav(config) {
  const nav   = document.getElementById('mainNav');
  const pill  = document.getElementById('navBg');
  if (!nav || !pill) return;

  // Disable transition on load to prevent the pill sliding in from 0
  pill.style.transition = 'none';
  pill.style.opacity    = '0';

  const activeBtn = document.getElementById(config.activeId);
  if (activeBtn) {
    activeBtn.classList.add('active');
    _movePillTo(pill, activeBtn);
  }

  // Re-enable spring transition on next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      pill.style.transition = [
        'width 0.48s cubic-bezier(0.19,1,0.22,1)',
        'transform 0.48s cubic-bezier(0.19,1,0.22,1)',
        'opacity 0.25s ease'
      ].join(', ');
    });
  });

  // ── Drag state ──
  let dragging    = false;
  let didDrag     = false;
  let startX      = 0;
  let initTrans   = 0;

  // Pointer helpers (unified touch/mouse)
  function clientX(e) {
    return e.touches ? e.touches[0].pageX : e.pageX;
  }

  function onStart(e) {
    dragging  = true;
    didDrag   = false;
    startX    = clientX(e);
    pill.style.transition = 'none';

    const matrix = new DOMMatrix(getComputedStyle(pill).transform);
    initTrans = matrix.m41;
  }

  function onMove(e) {
    if (!dragging) return;
    const dx = clientX(e) - startX;
    if (Math.abs(dx) > 4) didDrag = true;

    const btns     = nav.querySelectorAll('button');
    const first    = btns[0];
    const last     = btns[btns.length - 1];
    const maxTrans = (last.offsetLeft + last.offsetWidth) - pill.offsetWidth;

    let t = Math.max(first.offsetLeft, Math.min(initTrans + dx, maxTrans));
    pill.style.transform = `translateX(${t}px)`;
  }

  function onEnd() {
    if (!dragging) return;
    dragging = false;

    pill.style.transition = [
      'width 0.48s cubic-bezier(0.19,1,0.22,1)',
      'transform 0.48s cubic-bezier(0.19,1,0.22,1)',
      'opacity 0.25s ease'
    ].join(', ');

    if (didDrag) {
      const matrix   = new DOMMatrix(getComputedStyle(pill).transform);
      const center   = matrix.m41 + (pill.offsetWidth / 2);
      let   closest  = null;
      let   minDist  = Infinity;

      nav.querySelectorAll('button').forEach(btn => {
        const d = Math.abs(btn.offsetLeft + btn.offsetWidth / 2 - center);
        if (d < minDist) { minDist = d; closest = btn; }
      });

      if (closest) {
        _activateBtn(nav, pill, closest, config.routes);
      }

      // Prevent click from firing after drag
      setTimeout(() => { didDrag = false; }, 50);
    } else {
      // Snap back to current active
      const active = nav.querySelector('button.active');
      if (active) _movePillTo(pill, active);
    }
  }

  nav.addEventListener('mousedown',  onStart);
  nav.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('mousemove',  onMove);
  window.addEventListener('touchmove',  onMove, { passive: true });
  window.addEventListener('mouseup',    onEnd);
  window.addEventListener('touchend',   onEnd);

  // Click handler on each button
  nav.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (didDrag) return;
      const target = btn.dataset.nav;
      _activateBtn(nav, pill, btn, config.routes);
    });
  });
}

function _movePillTo(pill, btn) {
  pill.style.opacity   = '1';
  pill.style.width     = btn.offsetWidth + 'px';
  pill.style.transform = `translateX(${btn.offsetLeft}px)`;
}

function _activateBtn(nav, pill, btn, routes) {
  nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _movePillTo(pill, btn);

  const target = btn.dataset.nav;
  if (routes && routes[target]) {
    routes[target]();
  }
}

/* ── Menu ──────────────────────────────────────────────────── */

function initMenu() {
  const wrapper    = document.querySelector('.menu-wrapper');
  const hamburger  = document.querySelector('.hamburger');
  const dropdown   = document.getElementById('menuDropdown');
  if (!wrapper || !dropdown) return;

  function open() {
    dropdown.classList.add('open');
    hamburger && hamburger.classList.add('open');
  }
  function close() {
    dropdown.classList.remove('open');
    hamburger && hamburger.classList.remove('open');
  }
  function toggle() {
    dropdown.classList.contains('open') ? close() : open();
  }

  hamburger && hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });

  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

/* ── Resize: re-sync pill on window resize ─────────────────── */
function initNavResize() {
  let raf;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const pill   = document.getElementById('navBg');
      const active = document.querySelector('.nav button.active');
      if (pill && active) _movePillTo(pill, active);
    });
  });
}
