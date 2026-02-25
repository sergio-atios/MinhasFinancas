/* ============================================================
   MODAL.JS — Componente de janela modal reutilizável
   Usado pela página de Transações e de Metas.
   Cria uma janela sobreposta com formulário.
   ============================================================ */

const Modal = {

  /* Abre o modal com o conteúdo HTML fornecido */
  open(title, bodyHTML, onConfirm) {
    /* Remove modal anterior se houver */
    this.close();

    const modal = document.createElement('div');
    modal.id = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" onclick="Modal.close()" title="Fechar">✕</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="Modal.close()">Cancelar</button>
          <button class="btn btn-primary" id="modal-confirm">Salvar</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    /* Fecha ao clicar fora da caixa */
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    /* Associa a ação de confirmar */
    document.getElementById('modal-confirm').addEventListener('click', () => {
      if (onConfirm) onConfirm();
    });

    /* Fecha com tecla ESC */
    document.addEventListener('keydown', this._onKeyDown);

    /* Animação de entrada */
    requestAnimationFrame(() => modal.classList.add('visible'));
  },

  /* Fecha e remove o modal */
  close() {
    const modal = document.getElementById('modal-overlay');
    if (modal) {
      modal.classList.remove('visible');
      setTimeout(() => modal.remove(), 250);
    }
    document.removeEventListener('keydown', this._onKeyDown);
  },

  _onKeyDown(e) {
    if (e.key === 'Escape') Modal.close();
  },
};

/* Estilos do modal (injetados uma vez) */
const modalStyle = document.createElement('style');
modalStyle.textContent = `
  #modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.22s ease;
    padding: 1rem;
  }
  #modal-overlay.visible { opacity: 1; }

  .modal-box {
    background: var(--color-bg-2);
    border: 1px solid var(--color-border-2, rgba(99,120,200,0.22));
    border-radius: 20px;
    width: 100%;
    max-width: 460px;
    transform: scale(0.96) translateY(16px);
    transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.06);
  }
  #modal-overlay.visible .modal-box {
    transform: scale(1) translateY(0);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--color-border);
  }

  .modal-title {
    font-family: var(--font-display, 'Outfit', sans-serif);
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .modal-close {
    background: var(--color-bg-3);
    border: 1px solid var(--color-border);
    color: var(--text-muted);
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.12s;
  }
  .modal-close:hover { background: var(--color-bg-4); color: var(--text-primary); border-color: var(--color-border-2); }

  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.625rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--color-border);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.7px;
  }

  .form-input, .form-select {
    background: var(--color-bg-3);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    color: var(--text-primary);
    font-family: var(--font-body, 'Inter', sans-serif);
    font-size: 0.9375rem;
    padding: 0.625rem 0.875rem;
    transition: border-color 0.12s, box-shadow 0.12s;
    width: 100%;
    outline: none;
  }
  .form-input:focus, .form-select:focus {
    border-color: var(--color-primary, #6366f1);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }
  .form-select option { background: var(--color-bg-2); }

  .type-toggle {
    display: flex;
    background: var(--color-bg-3);
    border-radius: 10px;
    border: 1px solid var(--color-border);
    overflow: hidden;
    padding: 3px;
    gap: 3px;
  }
  .type-btn {
    flex: 1;
    padding: 0.5rem;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-family: var(--font-body, 'Inter', sans-serif);
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.15s;
    border-radius: 8px;
  }
  .type-btn.active-income  { background: rgba(16,217,160,0.15); color: #10d9a0; }
  .type-btn.active-expense { background: rgba(244,63,94,0.15);  color: #f43f5e; }
`;
document.head.appendChild(modalStyle);
