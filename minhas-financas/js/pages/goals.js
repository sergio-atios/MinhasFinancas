/* ============================================================
   GOALS.JS — Sistema de metas de economia
   Cards com progresso, aportes parciais e celebração ao concluir.
   ============================================================ */

const Goals = {

  _sortBy: 'progress', /* ordenação atual: 'progress' | 'deadline' | 'amount' */

  /* Ponto de entrada */
  render() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
      <div class="goals-page">

        <!-- RESUMO NO TOPO -->
        <div class="goals-summary">
          <div class="goals-stat">
            <div class="goals-stat-label">💰 Total Economizado</div>
            <div class="goals-stat-value" id="gs-total">R$ 0,00</div>
          </div>
          <div class="goals-stat">
            <div class="goals-stat-label">📅 Média Mensal (estimada)</div>
            <div class="goals-stat-value" id="gs-monthly">R$ 0,00</div>
          </div>
          <div class="goals-stat">
            <div class="goals-stat-label">🎯 Próxima Meta</div>
            <div class="goals-stat-value" id="gs-next" style="font-size:1.1rem">—</div>
          </div>
        </div>

        <!-- CONTROLES -->
        <div class="goals-controls">
          <span class="goals-controls-label">Ordenar por:</span>
          <button class="sort-btn active" data-sort="progress">Progresso</button>
          <button class="sort-btn" data-sort="deadline">Prazo</button>
          <button class="sort-btn" data-sort="amount">Valor</button>
          <div class="goals-actions">
            <button class="btn btn-primary" id="btn-new-goal">＋ Nova Meta</button>
          </div>
        </div>

        <!-- GRID DE METAS -->
        <div class="goals-grid" id="goals-grid"></div>

      </div>
    `;

    this._bindEvents();
    this._renderGoals();
  },

  _bindEvents() {
    document.getElementById('btn-new-goal').addEventListener('click', () => this._openForm());

    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this._sortBy = btn.dataset.sort;
        this._renderGoals();
      });
    });
  },

  /* Renderiza o grid de metas */
  _renderGoals() {
    const goals    = Store.goals.getAll();
    const grid     = document.getElementById('goals-grid');
    const today    = new Date().toISOString().split('T')[0];

    /* --- Calcula resumo --- */
    const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
    const txs        = Store.transactions.getAll();
    const months     = this._countActiveMonths(txs);
    const monthly    = months > 0 ? totalSaved / months : 0;

    /* Próxima meta a concluir (mais próxima do 100% sem ter concluído) */
    const inProgress = goals
      .filter(g => g.currentAmount < g.targetAmount)
      .sort((a, b) => (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount));
    const nextGoal   = inProgress[0];

    document.getElementById('gs-total').textContent   = Utils.formatCurrency(totalSaved);
    document.getElementById('gs-monthly').textContent = Utils.formatCurrency(monthly);

    if (nextGoal) {
      const remaining = nextGoal.targetAmount - nextGoal.currentAmount;
      const months2   = monthly > 0 ? Math.ceil(remaining / monthly) : '?';
      document.getElementById('gs-next').textContent =
        `${nextGoal.icon} ${nextGoal.name} — falta ${Utils.formatCurrency(remaining)} (~${months2} meses)`;
    } else {
      document.getElementById('gs-next').textContent = goals.length ? '🎉 Todas concluídas!' : '—';
    }

    /* --- Ordena --- */
    const sorted = [...goals].sort((a, b) => {
      if (this._sortBy === 'progress') {
        return (b.currentAmount / b.targetAmount) - (a.currentAmount / a.targetAmount);
      }
      if (this._sortBy === 'deadline') return a.deadline < b.deadline ? -1 : 1;
      if (this._sortBy === 'amount')   return b.targetAmount - a.targetAmount;
      return 0;
    });

    /* --- Renderiza cards --- */
    if (!sorted.length) {
      grid.innerHTML = `
        <div class="goals-empty">
          <div style="font-size:3rem;margin-bottom:1rem">🎯</div>
          <div>Nenhuma meta cadastrada. Crie sua primeira meta!</div>
        </div>`;
      return;
    }

    grid.innerHTML = sorted.map(g => {
      const pct       = Utils.calculatePercentage(g.currentAmount, g.targetAmount);
      const isDone    = g.currentAmount >= g.targetAmount;
      const isLate    = !isDone && g.deadline < today;
      const pctClass  = pct < 30 ? 'pct-low' : pct < 60 ? 'pct-mid' : pct < 100 ? 'pct-high' : 'pct-done';

      const statusText  = isDone ? '🎉 Concluída' : isLate ? '⚠️ Atrasada' : '🔵 Em andamento';
      const statusClass = isDone ? 'status-done' : isLate ? 'status-late' : 'status-ongoing';

      return `
        <div class="goal-card" data-id="${g.id}">
          <span class="goal-status-badge ${statusClass}">${statusText}</span>

          <div class="goal-header">
            <div class="goal-emoji-wrap">${g.icon || '🎯'}</div>
            <div style="min-width:0;flex:1">
              <div class="goal-title">${g.name}</div>
              <div class="goal-deadline">Prazo: ${Utils.formatDate(g.deadline)}</div>
            </div>
          </div>

          <div class="goal-amounts">
            <div>
              <div class="goal-current">${Utils.formatCurrency(g.currentAmount)}</div>
              <div class="goal-target">de ${Utils.formatCurrency(g.targetAmount)}</div>
            </div>
            <div class="goal-pct">${pct}%</div>
          </div>

          <div class="goal-progress-wrap">
            <div class="goal-progress-bar ${pctClass}"
              style="width: 0%" data-width="${pct}%"></div>
          </div>

          <div class="goal-actions">
            <button class="btn-add-value" data-id="${g.id}">
              <svg style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Adicionar
            </button>
            <button class="btn-edit-goal" data-id="${g.id}" title="Editar">
              <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-delete-goal" data-id="${g.id}" title="Excluir">
              <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    /* Anima as barras de progresso com delay */
    setTimeout(() => {
      document.querySelectorAll('.goal-progress-bar').forEach(bar => {
        bar.style.width = bar.dataset.width;
      });
    }, 100);

    /* Eventos dos botões */
    document.querySelectorAll('.btn-add-value').forEach(btn => {
      btn.addEventListener('click', () => this._openAddValue(btn.dataset.id));
    });
    document.querySelectorAll('.btn-edit-goal').forEach(btn => {
      btn.addEventListener('click', () => {
        const goal = Store.goals.getAll().find(g => g.id === btn.dataset.id);
        if (goal) this._openForm(goal);
      });
    });
    document.querySelectorAll('.btn-delete-goal').forEach(btn => {
      btn.addEventListener('click', () => {
        if (Utils.confirm('Excluir esta meta?')) {
          Store.goals.delete(btn.dataset.id);
          this._renderGoals();
          Utils.toast('Meta excluída.', 'info');
        }
      });
    });
  },

  /* Abre modal para criar ou editar meta */
  _openForm(goal = null) {
    const isEdit  = goal !== null;
    const emojis  = ['🎯','✈️','🏠','🚗','💻','📚','🛡️','💍','🎸','🏋️','🇬🇧','🌊','🎓','🏖️'];
    const emojiOptions = emojis.map(e =>
      `<option value="${e}" ${goal && goal.icon === e ? 'selected' : ''}>${e}</option>`
    ).join('');

    const bodyHTML = `
      <div class="form-group">
        <label class="form-label">Nome da Meta</label>
        <input class="form-input" id="g-name" type="text" placeholder="Ex: Viagem para Europa"
          value="${goal ? goal.name : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Valor Alvo (R$)</label>
        <input class="form-input" id="g-target" type="number" min="1" step="0.01" placeholder="0,00"
          value="${goal ? goal.targetAmount : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Prazo</label>
        <input class="form-input" id="g-deadline" type="date"
          value="${goal ? goal.deadline : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Ícone / Emoji</label>
        <select class="form-select" id="g-icon">${emojiOptions}</select>
      </div>
    `;

    Modal.open(isEdit ? '✏️ Editar Meta' : '🎯 Nova Meta', bodyHTML, () => {
      const name     = document.getElementById('g-name').value.trim();
      const target   = parseFloat(document.getElementById('g-target').value);
      const deadline = document.getElementById('g-deadline').value;
      const icon     = document.getElementById('g-icon').value;

      if (!name || isNaN(target) || target <= 0 || !deadline) {
        Utils.toast('Preencha todos os campos corretamente.', 'error');
        return;
      }

      if (isEdit) {
        Store.goals.update(goal.id, { name, targetAmount: target, deadline, icon });
        Utils.toast('Meta atualizada!', 'success');
      } else {
        Store.goals.add({
          id: Utils.generateId('goal'),
          name, targetAmount: target, currentAmount: 0,
          deadline, icon, createdAt: new Date().toISOString(),
        });
        Utils.toast('Meta criada!', 'success');
      }

      Modal.close();
      this._renderGoals();
    });
  },

  /* Abre modal para adicionar valor a uma meta */
  _openAddValue(goalId) {
    const goal = Store.goals.getAll().find(g => g.id === goalId);
    if (!goal) return;

    const remaining = goal.targetAmount - goal.currentAmount;

    const bodyHTML = `
      <div style="text-align:center;font-size:2rem;margin-bottom:0.5rem">${goal.icon}</div>
      <div style="text-align:center;color:var(--text-secondary);margin-bottom:1rem;font-size:0.9rem">
        Faltam <strong style="color:var(--color-success)">${Utils.formatCurrency(remaining)}</strong>
        para concluir a meta.
      </div>
      <div class="form-group">
        <label class="form-label">Valor a adicionar (R$)</label>
        <input class="form-input" id="add-val" type="number" min="0.01" step="0.01"
          placeholder="0,00" autofocus>
      </div>
    `;

    Modal.open(`＋ Aporte — ${goal.name}`, bodyHTML, () => {
      const val = parseFloat(document.getElementById('add-val').value);
      if (isNaN(val) || val <= 0) {
        Utils.toast('Informe um valor válido.', 'error');
        return;
      }

      const newAmount  = goal.currentAmount + val;
      const wasDone    = goal.currentAmount >= goal.targetAmount;
      const nowDone    = newAmount >= goal.targetAmount;

      Store.goals.update(goalId, { currentAmount: Math.min(newAmount, goal.targetAmount * 2) });
      Modal.close();
      this._renderGoals();
      Utils.toast(`${Utils.formatCurrency(val)} adicionado à meta!`, 'success');

      /* Celebração com confetti ao atingir 100% */
      if (!wasDone && nowDone) {
        setTimeout(() => this._celebrate(), 400);
      }
    });
  },

  /* Dispara a animação de confetti */
  _celebrate() {
    Utils.toast('🎉 Meta concluída! Parabéns!', 'success');

    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);

    const colors = ['#4f8ef7','#34d399','#fbbf24','#f87171','#a78bfa','#38bdf8'];
    for (let i = 0; i < 80; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.cssText = `
        left: ${Math.random() * 100}%;
        background: ${colors[Math.floor(Math.random() * colors.length)]};
        width: ${6 + Math.random() * 8}px;
        height: ${6 + Math.random() * 8}px;
        animation-duration: ${1.5 + Math.random() * 2}s;
        animation-delay: ${Math.random() * 0.8}s;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      `;
      container.appendChild(piece);
    }

    /* Remove o confetti após 4 segundos */
    setTimeout(() => container.remove(), 4000);
  },

  /* Conta quantos meses distintos há em transações */
  _countActiveMonths(txs) {
    const set = new Set(txs.map(t => t.date.substring(0, 7)));
    return set.size || 1;
  },
};
