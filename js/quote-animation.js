/**
 * Curv Office — Add to Quote microinteraction
 *
 * Behaviour:
 *   1. User clicks `.add-to-quote-btn`.
 *   2. Source button briefly confirms (scale pulse + temporary "Added" label).
 *   3. A small circular "puck" cloned from the product image flies along a
 *      smooth arc toward the vertical quote tab.
 *   4. When the puck reaches the tag, the tag bounces and pulses an accent
 *      glow, giving the user a clear "received" signal.
 *
 * If no image is available (or the image has 0 dimensions for any reason),
 * the puck step is skipped and we fall back to a reliable
 * button-pulse + tag-bounce microinteraction. Nothing visually breaks.
 */
(function () {
  const PUCK_SIZE = 72;            // px, diameter of the flying puck
  const FLY_DURATION = 720;        // ms
  const THROTTLE_MS = 300;         // dedupe rapid clicks on the same button
  let lastSource = null;
  let lastFiredAt = 0;

  // ----- helpers -------------------------------------------------------------

  function getQuoteTag() {
    return document.getElementById('quote-floating-btn');
  }

  function bounceQuoteTag() {
    const quoteTag = getQuoteTag();
    if (!quoteTag) return;
    quoteTag.classList.remove('quote-bounce');
    // force reflow so the animation restarts cleanly on rapid additions
    void quoteTag.offsetWidth;
    quoteTag.classList.add('quote-bounce');
    window.setTimeout(() => {
      quoteTag.classList.remove('quote-bounce');
    }, 650);
  }

  function pulseSourceButton(button) {
    if (!button) return;
    button.classList.remove('quote-btn-pulse');
    void button.offsetWidth;
    button.classList.add('quote-btn-pulse');
    window.setTimeout(() => button.classList.remove('quote-btn-pulse'), 600);
  }

  function flashAddedLabel(button) {
    if (!button || button.dataset.addedFlashRunning === '1') return;
    button.dataset.addedFlashRunning = '1';
    const originalHTML = button.innerHTML;
    button.classList.add('added');
    button.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">' +
      '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>' +
      '</svg>Added';
    window.setTimeout(() => {
      button.classList.remove('added');
      button.innerHTML = originalHTML;
      delete button.dataset.addedFlashRunning;
    }, 1400);
  }

  function pickProductImage(card) {
    if (!card) return null;
    const img = card.querySelector('img');
    if (!img) return null;
    // Skip pixel-empty (broken) images — fall back to the simpler interaction.
    if ((img.naturalWidth || 0) === 0 && !img.complete) return null;
    if ((img.getBoundingClientRect().width || 0) === 0) return null;
    return img;
  }

  function buildPuck(sourceImg, originRect) {
    const puck = document.createElement('div');
    puck.className = 'quote-fly-puck';
    puck.style.width = PUCK_SIZE + 'px';
    puck.style.height = PUCK_SIZE + 'px';
    puck.style.left = (originRect.left + originRect.width / 2 - PUCK_SIZE / 2) + 'px';
    puck.style.top = (originRect.top + originRect.height / 2 - PUCK_SIZE / 2) + 'px';

    const inner = document.createElement('img');
    inner.src = sourceImg.currentSrc || sourceImg.src;
    inner.alt = '';
    inner.decoding = 'sync';
    inner.style.width = '100%';
    inner.style.height = '100%';
    inner.style.objectFit = 'cover';
    inner.style.borderRadius = 'inherit';
    inner.draggable = false;
    puck.appendChild(inner);
    return puck;
  }

  // ----- main flight ---------------------------------------------------------

  function flyProductToQuote(sourceElement) {
    const now = Date.now();
    if (sourceElement === lastSource && now - lastFiredAt < THROTTLE_MS) return;
    lastSource = sourceElement;
    lastFiredAt = now;

    const card = sourceElement && sourceElement.closest
      ? sourceElement.closest('.product-card')
      : null;
    const quoteTag = getQuoteTag();

    // Always confirm on the button itself — works even when the puck fails.
    pulseSourceButton(sourceElement);
    flashAddedLabel(sourceElement);

    // If we cannot fly, still give the customer a clear signal.
    if (!quoteTag) return;
    if (!card) {
      bounceQuoteTag();
      return;
    }

    const sourceImg = pickProductImage(card);
    if (!sourceImg) {
      // Fallback: no usable image — skip the puck, keep the rest premium-feeling.
      window.setTimeout(bounceQuoteTag, 180);
      return;
    }

    const imgRect = sourceImg.getBoundingClientRect();
    const tagRect = quoteTag.getBoundingClientRect();
    if (imgRect.width === 0 || tagRect.width === 0) {
      window.setTimeout(bounceQuoteTag, 180);
      return;
    }

    const puck = buildPuck(sourceImg, imgRect);
    document.body.appendChild(puck);

    const startX = imgRect.left + imgRect.width / 2;
    const startY = imgRect.top + imgRect.height / 2;
    const endX = tagRect.left + tagRect.width / 2;
    const endY = tagRect.top + tagRect.height / 2;
    const dx = endX - startX;
    const dy = endY - startY;

    // Arc upward: lift the puck above the straight line, then drop into the tag.
    // The lift is a fraction of the horizontal travel — feels natural across
    // any card-to-tag geometry.
    const lift = Math.max(60, Math.min(180, Math.abs(dx) * 0.18));

    window.quoteAddAnimationRunning = true;

    const keyframes = [
      { transform: 'translate(0px, 0px) scale(1)', opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.25}px, ${dy * 0.15 - lift}px) scale(1.04)`, opacity: 1, offset: 0.15 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.4 - lift * 0.7}px) scale(0.85)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx * 0.85}px, ${dy * 0.78}px) scale(0.5)`, opacity: 0.9, offset: 0.8 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.18)`, opacity: 0, offset: 1 }
    ];
    const timing = { duration: FLY_DURATION, easing: 'cubic-bezier(0.32, 0.72, 0.32, 1)' };

    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      if (puck.parentNode) puck.parentNode.removeChild(puck);
      window.quoteAddAnimationRunning = false;
      bounceQuoteTag();
    }

    // Belt-and-suspenders safety timer: guarantees the puck is cleaned up and
    // the tag bounces even when onfinish never fires (background tab throttling,
    // prefers-reduced-motion overrides, headless environments, etc.).
    const safetyTimer = window.setTimeout(finish, FLY_DURATION + 250);

    let waapiAnimation = null;
    if (typeof puck.animate === 'function') {
      try {
        waapiAnimation = puck.animate(keyframes, timing);
        waapiAnimation.onfinish = () => { window.clearTimeout(safetyTimer); finish(); };
        waapiAnimation.oncancel = () => { window.clearTimeout(safetyTimer); finish(); };
      } catch (err) {
        waapiAnimation = null;
        console.warn('quote-animation: WAAPI animate() threw, falling back', err);
      }
    }

    // CSS-transition fallback for environments where WAAPI doesn't actually
    // paint (some headless test runners, very old browsers). The safety timer
    // still owns cleanup; this just ensures the puck visibly moves.
    if (!waapiAnimation) {
      puck.style.transition =
        `transform ${FLY_DURATION}ms cubic-bezier(0.32, 0.72, 0.32, 1), ` +
        `opacity ${FLY_DURATION}ms ease`;
      requestAnimationFrame(() => {
        puck.style.transform = `translate(${dx}px, ${dy}px) scale(0.18)`;
        puck.style.opacity = '0';
      });
    }
  }

  // Expose globally for callers that already use these names.
  window.bounceQuoteTag = bounceQuoteTag;
  window.flyProductToQuote = flyProductToQuote;

  // Single delegated handler covers every page and dynamic product card.
  document.addEventListener('click', (event) => {
    const quoteButton = event.target && event.target.closest
      ? event.target.closest('.add-to-quote-btn')
      : null;
    if (!quoteButton) return;
    flyProductToQuote(quoteButton);
  }, true);
})();
