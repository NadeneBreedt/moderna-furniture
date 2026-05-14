(function () {
  let lastAnimatedButton = null;
  let lastAnimatedAt = 0;

  function bounceQuoteTag() {
    const quoteTag = document.getElementById('quote-floating-btn');
    if (!quoteTag) return;

    quoteTag.classList.remove('quote-bounce');
    void quoteTag.offsetWidth;
    quoteTag.classList.add('quote-bounce');
  }

  function flyProductToQuote(sourceElement) {
    const now = Date.now();
    if (sourceElement === lastAnimatedButton && now - lastAnimatedAt < 250) {
      return;
    }
    lastAnimatedButton = sourceElement;
    lastAnimatedAt = now;

    const quoteTag = document.getElementById('quote-floating-btn');
    const card = sourceElement && sourceElement.closest ? sourceElement.closest('.product-card') : null;

    if (!quoteTag || !card) {
      bounceQuoteTag();
      return;
    }

    const cardRect = card.getBoundingClientRect();
    const tagRect = quoteTag.getBoundingClientRect();
    const flyingCard = card.cloneNode(true);

    flyingCard.classList.add('quote-fly-card');
    flyingCard.style.left = `${cardRect.left}px`;
    flyingCard.style.top = `${cardRect.top}px`;
    flyingCard.style.width = `${cardRect.width}px`;
    flyingCard.style.height = `${cardRect.height}px`;
    flyingCard.style.maxWidth = '320px';
    flyingCard.style.opacity = '0.98';
    document.body.appendChild(flyingCard);

    const targetX = tagRect.left + tagRect.width / 2 - (cardRect.left + cardRect.width / 2);
    const targetY = tagRect.top + tagRect.height / 2 - (cardRect.top + cardRect.height / 2);

    window.quoteAddAnimationRunning = true;
    if (!flyingCard.animate) {
      flyingCard.style.transition = 'transform 900ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 900ms ease';
      requestAnimationFrame(() => {
        flyingCard.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.08)`;
        flyingCard.style.opacity = '0';
      });
      window.setTimeout(() => {
        flyingCard.remove();
        window.quoteAddAnimationRunning = false;
        bounceQuoteTag();
      }, 920);
      return;
    }

    const animation = flyingCard.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 0.98 },
      { transform: `translate(${targetX * 0.42}px, ${targetY * 0.18}px) scale(0.78)`, opacity: 0.86 },
      { transform: `translate(${targetX * 0.78}px, ${targetY * 0.62}px) scale(0.35)`, opacity: 0.55 },
      { transform: `translate(${targetX}px, ${targetY}px) scale(0.08)`, opacity: 0 }
    ], {
      duration: 900,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
    });

    animation.onfinish = () => {
      flyingCard.remove();
      window.quoteAddAnimationRunning = false;
      bounceQuoteTag();
    };
  }

  window.bounceQuoteTag = bounceQuoteTag;
  window.flyProductToQuote = flyProductToQuote;

  document.addEventListener('click', (event) => {
    const quoteButton = event.target.closest && event.target.closest('.add-to-quote-btn');
    if (!quoteButton) return;

    flyProductToQuote(quoteButton);
  }, true);
})();
