const PROPOSAL_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScoWgLBxNmZwAWGkEsFzV_0me3M2DeaBsV79szLmenXAlDdkQ/viewform';

function initProposalModal() {
  const modal = document.getElementById('proposal-guidelines-modal');
  const trigger = document.getElementById('home-featured-cta');
  const checkbox = document.getElementById('proposal-agree-checkbox');
  const approveBtn = document.getElementById('proposal-modal-approve');
  const cancelBtn = document.getElementById('proposal-modal-cancel');
  const closeBtn = document.getElementById('proposal-modal-close');
  const dialog = modal ? modal.querySelector('.proposal-modal-dialog') : null;

  if (!modal || !trigger || !checkbox || !approveBtn) return;

  const openModal = (e) => {
    if (e) e.preventDefault();
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

  trigger.addEventListener('click', openModal);

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
    dialog.addEventListener(
      'wheel',
      (e) => {
        e.stopPropagation();
      },
      { passive: true }
    );
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
