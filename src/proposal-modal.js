const PROPOSAL_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScoWgLBxNmZwAWGkEsFzV_0me3M2DeaBsV79szLmenXAlDdkQ/viewform';

function smoothScrollToSection(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const targetY = window.scrollY + rect.top - 40;
  window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
}

function initProposalModal() {
  const modal = document.getElementById('proposal-guidelines-modal');
  const trigger = document.getElementById('home-featured-cta');
  const checkbox = document.getElementById('proposal-agree-checkbox');
  const approveBtn = document.getElementById('proposal-modal-approve');
  const cancelBtn = document.getElementById('proposal-modal-cancel');
  const closeBtn = document.getElementById('proposal-modal-close');
  const dialog = modal ? modal.querySelector('.proposal-modal-dialog') : null;

  const endTitleTrigger = document.getElementById('end-section-title-link');
  const endTitleBox = document.getElementById('end-section-title');

  // Mark internal SPA links that lack separate HTML files as external before RouteManager binds
  document
    .querySelectorAll(
      '#home-reel-cta, .header-menu-link[data-page="about"], .header-menu-link[data-page="projects"], #home .project-item'
    )
    .forEach((a) => {
      a.setAttribute('data-link-type', 'external');
    });

  if (!modal || !trigger || !checkbox || !approveBtn) return;

  const openModal = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    checkbox.checked = false;
    approveBtn.disabled = true;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  };

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  };

  trigger.addEventListener('click', openModal, { capture: true });
  if (endTitleTrigger) {
    endTitleTrigger.addEventListener('click', openModal, { capture: true });
  }
  if (endTitleBox) {
    endTitleBox.addEventListener('click', openModal, { capture: true });
  }

  // Safe navigation for Reel CTA, Menu Links, and Project Items (prevents SPA router crash on /about or /projects/*)
  const reelCta = document.getElementById('home-reel-cta');
  if (reelCta) {
    reelCta.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        smoothScrollToSection('#home-featured');
      },
      { capture: true }
    );
  }

  document.querySelectorAll('#home .project-item').forEach((card) => {
    card.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        smoothScrollToSection('.initiatives-cta-group');
      },
      { capture: true }
    );
  });

  const aboutMenuLink = document.querySelector(
    '.header-menu-link[data-page="about"]'
  );
  if (aboutMenuLink) {
    aboutMenuLink.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        const menuBtn = document.getElementById('header-right-menu-btn');
        if (menuBtn) menuBtn.click();
        smoothScrollToSection('#home-members');
      },
      { capture: true }
    );
  }

  const eventsMenuLink = document.querySelector(
    '.header-menu-link[data-page="projects"]'
  );
  if (eventsMenuLink) {
    eventsMenuLink.addEventListener(
      'click',
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        const menuBtn = document.getElementById('header-right-menu-btn');
        if (menuBtn) menuBtn.click();
        smoothScrollToSection('#home-featured');
      },
      { capture: true }
    );
  }

  checkbox.addEventListener('change', () => {
    approveBtn.disabled = !checkbox.checked;
  });

  approveBtn.addEventListener('click', () => {
    if (!checkbox.checked) return;
    window.open(PROPOSAL_FORM_URL, '_blank', 'noopener,noreferrer');
    closeModal();
  });

  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  if (dialog) {
    ['wheel', 'touchstart', 'touchmove'].forEach((evtName) => {
      dialog.addEventListener(
        evtName,
        (e) => {
          e.stopPropagation();
        },
        { passive: true }
      );
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProposalModal);
} else {
  initProposalModal();
}
