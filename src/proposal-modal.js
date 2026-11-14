const PROPOSAL_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScoWgLBxNmZwAWGkEsFzV_0me3M2DeaBsV79szLmenXAlDdkQ/viewform';

const JOIN_MAILTO_URL =
  'mailto:info@kouheikosehira.com?subject=%E3%80%90AIueo%E3%80%91%E5%8F%82%E5%8A%A0%E7%94%B3%E3%81%97%E8%BE%BC%E3%81%BF&body=%E3%80%90AIueo%20%E5%8F%82%E5%8A%A0%E7%94%B3%E3%81%97%E8%BE%BC%E3%81%BF%E3%80%91%0D%0A%E3%83%BB%E3%81%8A%E5%90%8D%E5%89%8D%EF%BC%88%E3%83%8B%E3%83%83%E3%82%AF%E3%83%8D%E3%83%BC%E3%83%A0%E5%8F%AF%EF%BC%89%EF%BC%9A%0D%0A%E3%83%BB%E5%8F%82%E5%8A%A0%E5%B8%8C%E6%9C%9B%E3%81%AE%E4%BC%81%E7%94%BB%E3%83%BB%E9%96%A2%E5%BF%83%E3%83%86%E3%83%BC%E3%83%9E%EF%BC%9A%0D%0A%E3%83%BB%E4%B8%80%E8%A8%80%E3%83%A1%E3%83%83%E3%82%BB%E3%83%BC%E3%82%B8%EF%BC%9A';

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

  const handleEndTitleClick = (e) => {
    const lines = endTitleTrigger
      ? Array.from(
          endTitleTrigger.querySelectorAll('.end-section-title-link-line')
        )
      : [];
    const clickedLine =
      e.target && e.target.closest
        ? e.target.closest('.end-section-title-link-line')
        : null;

    if (lines.length >= 2 && clickedLine === lines[1]) {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = JOIN_MAILTO_URL;
      return;
    }

    if (lines.length === 0 && endTitleTrigger) {
      const rect = endTitleTrigger.getBoundingClientRect();
      if (e.clientY > rect.top + rect.height * 0.52) {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = JOIN_MAILTO_URL;
        return;
      }
    }

    openModal(e);
  };

  trigger.addEventListener('click', openModal, { capture: true });
  if (endTitleBox) {
    endTitleBox.addEventListener('click', handleEndTitleClick, {
      capture: true,
    });
  } else if (endTitleTrigger) {
    endTitleTrigger.addEventListener('click', handleEndTitleClick, {
      capture: true,
    });
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
