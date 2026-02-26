/* ============================================================
   TRANSACTIONS.JS — Gerenciador de transações
   Tabela com filtros, busca, ordenação e CRUD completo.
   ============================================================ */

const Transactions = {

  /* Estado interno da página */
  _state: {
    sortField: 'date',   /* campo de ordenação atual */
    sortDir:   'desc',   /* direção: 'asc' ou 'desc' */
    filterPeriod:   'month',
    filterCategory: 'all',
    filterType:     'all',
    searchText:     '',
  },

  /* Ponto de entrada */
  render() {
    const container = document.getElementById('page-container');
    const categories = Store.categories.getAll();

    /* Opções do select de categoria */
    const catOptions = categories.map(c =>
      `<option value="${c.id}">${c.icon} ${c.name}</option>`
    ).join('');

    container.innerHTML = `
      <div class="transactions-page">

        <!-- BARRA DE FILTROS -->
        <div class="filters-bar">

          <div class="filter-group">
            <span class="filter-label">Período</span>
            <select class="filter-select" id="filter-period">
              <option value="month">Este mês</option>
              <option value="week">Esta semana</option>
              <option value="3months">Últimos 3 meses</option>
              <option value="all">Todos</option>
            </select>
          </div>

          <div class="filter-group">
            <span class="filter-label">Categoria</span>
            <select class="filter-select" id="filter-category">
              <option value="all">Todas</option>
              ${catOptions}
            </select>
          </div>

          <div class="filter-group">
            <span class="filter-label">Tipo</span>
            <select class="filter-select" id="filter-type">
              <option value="all">Todos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>
          </div>

          <div class="filter-group filter-spacer">
            <input type="text" class="filter-input" id="search-tx"
              placeholder="🔍 Buscar por descrição...">
          </div>

          <button class="btn btn-primary" id="btn-new-tx">
            ＋ Nova Transação
          </button>

        </div>

        <!-- TABELA -->
        <div class="tx-table-wrap">
          <table class="tx-table">
            <thead>
              <tr>
                <th class="sortable" data-field="date">Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th class="sortable" data-field="amount" style="text-align:right">Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="tx-tbody"></tbody>
          </table>

          <!-- RODAPÉ TOTALIZADOR -->
          <div class="tx-footer">
            <div class="footer-item">
              <div class="footer-label">Receitas</div>
              <div class="footer-value money-positive" id="foot-income">R$ 0,00</div>
            </div>
            <div class="footer-item">
              <div class="footer-label">Despesas</div>
              <div class="footer-value money-negative" id="foot-expense">R$ 0,00</div>
            </div>
            <div class="footer-item">
              <div class="footer-label">Saldo</div>
              <div class="footer-value" id="foot-balance">R$ 0,00</div>
            </div>
          </div>
        </div>

      </div>
    `;

    this._bindEvents();
    this._updateTable();
  },

  /* Conecta eventos aos elementos da página */
  _bindEvents() {
    /* Filtros */
    document.getElementById('filter-period').addEventListener('change',   e => { this._state.filterPeriod   = e.target.value; this._updateTable(); });
    document.getElementById('filter-category').addEventListener('change', e => { this._state.filterCategory = e.target.value; this._updateTable(); });
    document.getElementById('filter-type').addEventListener('change',     e => { this._state.filterType     = e.target.value; this._updateTable(); });

    /* Busca com debounce (espera 300ms antes de filtrar) */
    let debounce;
    document.getElementById('search-tx').addEventListener('input', e => {
      clearTimeout(debounce);
      debounce = setTimeout(() => { this._state.searchText = e.target.value.toLowerCase(); this._updateTable(); }, 300);
    });

    /* Ordenação por clique no cabeçalho */
    document.querySelectorAll('.tx-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const field = th.dataset.field;
        if (this._state.sortField === field) {
          this._state.sortDir = this._state.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          this._state.sortField = field;
          this._state.sortDir   = 'desc';
        }
        this._updateTable();
      });
    });

    /* Botão nova transação */
    document.getElementById('btn-new-tx').addEventListener('click', () => this._openForm());
  },

  /* Filtra, ordena e renderiza as linhas da tabela */
  _updateTable() {
    const allTx     = Store.transactions.getAll();
    const categories = Store.categories.getAll();
    const catMap    = {};
    categories.forEach(c => { catMap[c.id] = c; });

    const s = this._state;
    const currentMonth = Utils.getYearMonth(0);

    /* --- Aplica filtros --- */
    let filtered = allTx.filter(t => {
      /* Período */
      if (s.filterPeriod === 'month'   && !t.date.startsWith(currentMonth)) return false;
      if (s.filterPeriod === 'week'    && !Utils.isInCurrentWeek(t.date))   return false;
      if (s.filterPeriod === '3months') {
        const threeAgo = Utils.getYearMonth(2);
        if (t.date < threeAgo) return false;
      }
      /* Categoria e tipo */
      if (s.filterCategory !== 'all' && t.category !== s.filterCategory) return false;
      if (s.filterType     !== 'all' && t.type     !== s.filterType)     return false;
      /* Busca por texto */
      if (s.searchText && !t.description.toLowerCase().includes(s.searchText)) return false;
      return true;
    });

    /* --- Ordena --- */
    filtered.sort((a, b) => {
      let valA = a[s.sortField];
      let valB = b[s.sortField];
      if (s.sortField === 'amount') { valA = +valA; valB = +valB; }
      if (valA < valB) return s.sortDir === 'asc' ? -1 :  1;
      if (valA > valB) return s.sortDir === 'asc' ?  1 : -1;
      return 0;
    });

    /* --- Atualiza ícones de ordenação nos cabeçalhos --- */
    document.querySelectorAll('.tx-table th.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
      if (th.dataset.field === s.sortField) {
        th.classList.add(s.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    });

    /* --- Renderiza linhas --- */
    const tbody = document.getElementById('tx-tbody');
    if (!filtered.length) {
      tbody.innerHTML = `
        <tr><td colspan="6">
          <div class="tx-empty">
            <div class="tx-empty-icon">📭</div>
            <div class="tx-empty-text">Nenhuma transação encontrada</div>
          </div>
        </td></tr>
      `;
    } else {
      tbody.innerHTML = filtered.map(t => {
        const cat       = catMap[t.category];
        const icon      = cat ? cat.icon : '💳';
        const catName   = cat ? cat.name : 'Outros';
        const isIncome  = t.type === 'income';
        const amtClass  = isIncome ? 'money-positive' : 'money-negative';
        const amtSign   = isIncome ? '+' : '-';

        return `
          <tr data-id="${t.id}">
            <td>${Utils.formatDate(t.date)}</td>
            <td class="tx-desc-cell">
              <div class="tx-desc-text">${icon} ${t.description}</div>
              <div class="tx-cat-tag">${catName}</div>
            </td>
            <td>${catName}</td>
            <td>
              <span class="badge ${isIncome ? 'badge-income' : 'badge-expense'}">
                ${isIncome ? '↑ Receita' : '↓ Despesa'}
              </span>
            </td>
            <td class="tx-amount-cell ${amtClass}">${amtSign} ${Utils.formatCurrency(t.amount)}</td>
            <td>
              <button class="btn-delete-tx" data-id="${t.id}" title="Excluir">
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    }

    /* --- Eventos nas linhas --- */
    tbody.querySelectorAll('tr[data-id]').forEach(row => {
      /* Clique na linha → abre para edição */
      row.addEventListener('click', e => {
        if (e.target.closest('.btn-delete-tx')) return; /* não edita se clicou em excluir */
        const tx = allTx.find(t => t.id === row.dataset.id);
        if (tx) this._openForm(tx);
      });
    });

    /* Botões de excluir */
    tbody.querySelectorAll('.btn-delete-tx').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (Utils.confirm('Excluir esta transação?')) {
          const row = btn.closest('tr');
          row.classList.add('removing');
          setTimeout(() => {
            Store.transactions.delete(btn.dataset.id);
            this._updateTable();
            Utils.toast('Transação excluída.', 'info');
          }, 300);
        }
      });
    });

    /* --- Atualiza totalizador no rodapé --- */
    const income  = filtered.filter(t => t.type === 'income' ).reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;

    document.getElementById('foot-income').textContent  = Utils.formatCurrency(income);
    document.getElementById('foot-expense').textContent = Utils.formatCurrency(expense);
    const balEl = document.getElementById('foot-balance');
    balEl.textContent = Utils.formatCurrency(balance);
    balEl.className   = `footer-value ${balance >= 0 ? 'money-positive' : 'money-negative'}`;
  },

  /* Abre o modal de formulário (para criar ou editar) */
  _openForm(tx = null) {
    const categories = Store.categories.getAll();
    const isEdit     = tx !== null;

    const catOptions = categories.map(c =>
      `<option value="${c.id}" ${tx && tx.category === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`
    ).join('');

    const bodyHTML = `
      <div class="form-group">
        <label class="form-label">Descrição</label>
        <input class="form-input" id="f-desc" type="text" placeholder="Ex: Supermercado"
          value="${tx ? tx.description : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Valor (R$)</label>
        <input class="form-input" id="f-amount" type="number" min="0.01" step="0.01" placeholder="0,00"
          value="${tx ? tx.amount : ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <div class="type-toggle">
          <button class="type-btn ${!tx || tx.type === 'income' ? 'active-income' : ''}" data-type="income">
            ↑ Receita
          </button>
          <button class="type-btn ${tx && tx.type === 'expense' ? 'active-expense' : ''}" data-type="expense">
            ↓ Despesa
          </button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Categoria</label>
        <select class="form-select" id="f-category">${catOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Data</label>
        <input class="form-input" id="f-date" type="date"
          value="${tx ? tx.date : new Date().toISOString().split('T')[0]}">
      </div>
    `;

    Modal.open(isEdit ? '✏️ Editar Transação' : '＋ Nova Transação', bodyHTML, () => {
      /* Lê os valores do formulário */
      const desc     = document.getElementById('f-desc').value.trim();
      const amount   = parseFloat(document.getElementById('f-amount').value);
      const category = document.getElementById('f-category').value;
      const date     = document.getElementById('f-date').value;
      const activeBtn = document.querySelector('.type-btn.active-income, .type-btn.active-expense');
      const type     = activeBtn ? activeBtn.dataset.type : 'expense';

      if (!desc || isNaN(amount) || amount <= 0 || !date) {
        Utils.toast('Preencha todos os campos corretamente.', 'error');
        return;
      }

      if (isEdit) {
        Store.transactions.update(tx.id, { description: desc, amount, category, date, type });
        Utils.toast('Transação atualizada!', 'success');
      } else {
        Store.transactions.add({
          id: Utils.generateId('tx'),
          description: desc, amount, category, date, type,
        });
        Utils.toast('Transação adicionada!', 'success');
      }

      Modal.close();
      this._updateTable();
    });

    /* Toggle tipo receita/despesa */
    setTimeout(() => {
      document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active-income','active-expense'));
          btn.classList.add(btn.dataset.type === 'income' ? 'active-income' : 'active-expense');
        });
      });
    }, 50);
  },
};
