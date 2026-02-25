/* ============================================================
   STORE.JS — Módulo central de dados do app
   Toda leitura e gravação de dados passa por aqui.
   Usa o localStorage do navegador para persistir os dados.
   NENHUMA outra página deve criar seu próprio armazenamento.
   ============================================================ */

const Store = (() => {

  /* --- CHAVES usadas no localStorage --- */
  const KEYS = {
    transactions: 'mf_transactions',
    goals: 'mf_goals',
    categories: 'mf_categories',
    darkMode: 'mf_dark_mode',
  };

  /* ============================================================
     DADOS DE EXEMPLO pré-carregados
     Aparecem na primeira vez que o app é aberto.
     ============================================================ */
  const SAMPLE_DATA = {
    categories: [
      { id: 'cat_1', name: 'Alimentação',  icon: '🍽️', color: '#f87171' },
      { id: 'cat_2', name: 'Transporte',   icon: '🚗', color: '#fb923c' },
      { id: 'cat_3', name: 'Moradia',      icon: '🏠', color: '#a78bfa' },
      { id: 'cat_4', name: 'Lazer',        icon: '🎮', color: '#38bdf8' },
      { id: 'cat_5', name: 'Saúde',        icon: '💊', color: '#34d399' },
      { id: 'cat_6', name: 'Salário',      icon: '💼', color: '#4f8ef7' },
      { id: 'cat_7', name: 'Freelance',    icon: '💻', color: '#fbbf24' },
      { id: 'cat_8', name: 'Educação',     icon: '📚', color: '#f472b6' },
      { id: 'cat_9', name: 'Investimento', icon: '📈', color: '#6ee7b7' },
    ],

    /* 18 transações dos últimos 3 meses */
    transactions: (() => {
      const now = new Date();
      const m = (offset, day) => {
        const d = new Date(now.getFullYear(), now.getMonth() - offset, day);
        return d.toISOString().split('T')[0];
      };
      return [
        /* Mês atual */
        { id: 'tx_01', description: 'Salário',               amount: 5800, type: 'income',  category: 'cat_6', date: m(0,5)  },
        { id: 'tx_02', description: 'Supermercado',          amount: 480,  type: 'expense', category: 'cat_1', date: m(0,7)  },
        { id: 'tx_03', description: 'Freelance - site',      amount: 1200, type: 'income',  category: 'cat_7', date: m(0,10) },
        { id: 'tx_04', description: 'Aluguel',               amount: 1500, type: 'expense', category: 'cat_3', date: m(0,10) },
        { id: 'tx_05', description: 'Conta de Luz',          amount: 185,  type: 'expense', category: 'cat_3', date: m(0,12) },
        { id: 'tx_06', description: 'Farmácia',              amount: 95,   type: 'expense', category: 'cat_5', date: m(0,14) },
        { id: 'tx_07', description: 'Restaurante',           amount: 120,  type: 'expense', category: 'cat_1', date: m(0,16) },
        { id: 'tx_08', description: 'Uber',                  amount: 65,   type: 'expense', category: 'cat_2', date: m(0,18) },
        { id: 'tx_09', description: 'Streaming (Netflix+)',  amount: 55,   type: 'expense', category: 'cat_4', date: m(0,20) },
        /* Mês anterior */
        { id: 'tx_10', description: 'Salário',               amount: 5800, type: 'income',  category: 'cat_6', date: m(1,5)  },
        { id: 'tx_11', description: 'Supermercado',          amount: 520,  type: 'expense', category: 'cat_1', date: m(1,8)  },
        { id: 'tx_12', description: 'Aluguel',               amount: 1500, type: 'expense', category: 'cat_3', date: m(1,10) },
        { id: 'tx_13', description: 'Freelance - app',       amount: 800,  type: 'income',  category: 'cat_7', date: m(1,15) },
        { id: 'tx_14', description: 'Academia',              amount: 90,   type: 'expense', category: 'cat_5', date: m(1,15) },
        { id: 'tx_15', description: 'Cinema + jantar',       amount: 160,  type: 'expense', category: 'cat_4', date: m(1,20) },
        /* Dois meses atrás */
        { id: 'tx_16', description: 'Salário',               amount: 5800, type: 'income',  category: 'cat_6', date: m(2,5)  },
        { id: 'tx_17', description: 'Supermercado',          amount: 460,  type: 'expense', category: 'cat_1', date: m(2,9)  },
        { id: 'tx_18', description: 'Aluguel',               amount: 1500, type: 'expense', category: 'cat_3', date: m(2,10) },
      ];
    })(),

    /* 4 metas de economia em progresso */
    goals: [
      {
        id: 'goal_1',
        name: 'Viagem para Europa',
        icon: '✈️',
        targetAmount: 15000,
        currentAmount: 6200,
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 8)).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'goal_2',
        name: 'Reserva de Emergência',
        icon: '🛡️',
        targetAmount: 20000,
        currentAmount: 12500,
        deadline: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'goal_3',
        name: 'Notebook novo',
        icon: '💻',
        targetAmount: 4500,
        currentAmount: 4500,
        deadline: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'goal_4',
        name: 'Curso de Inglês',
        icon: '🇬🇧',
        targetAmount: 2400,
        currentAmount: 400,
        deadline: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
    ],
  };

  /* ============================================================
     INICIALIZAÇÃO — carrega dados de exemplo se for a 1ª vez
     ============================================================ */
  function init() {
    if (!localStorage.getItem(KEYS.categories)) {
      localStorage.setItem(KEYS.categories,   JSON.stringify(SAMPLE_DATA.categories));
      localStorage.setItem(KEYS.transactions, JSON.stringify(SAMPLE_DATA.transactions));
      localStorage.setItem(KEYS.goals,        JSON.stringify(SAMPLE_DATA.goals));
    }
  }

  /* ============================================================
     FUNÇÕES GENÉRICAS de leitura e gravação
     ============================================================ */
  function getAll(key)        { return JSON.parse(localStorage.getItem(key) || '[]'); }
  function saveAll(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

  /* ============================================================
     API DE TRANSAÇÕES
     ============================================================ */
  const transactions = {
    getAll: ()     => getAll(KEYS.transactions),
    add(item)      { const all = this.getAll(); all.push(item); saveAll(KEYS.transactions, all); },
    update(id, changes) {
      const all = this.getAll().map(t => t.id === id ? { ...t, ...changes } : t);
      saveAll(KEYS.transactions, all);
    },
    delete(id) {
      saveAll(KEYS.transactions, this.getAll().filter(t => t.id !== id));
    },
  };

  /* ============================================================
     API DE METAS
     ============================================================ */
  const goals = {
    getAll: ()     => getAll(KEYS.goals),
    add(item)      { const all = this.getAll(); all.push(item); saveAll(KEYS.goals, all); },
    update(id, changes) {
      const all = this.getAll().map(g => g.id === id ? { ...g, ...changes } : g);
      saveAll(KEYS.goals, all);
    },
    delete(id) {
      saveAll(KEYS.goals, this.getAll().filter(g => g.id !== id));
    },
  };

  /* ============================================================
     API DE CATEGORIAS
     ============================================================ */
  const categories = {
    getAll: () => getAll(KEYS.categories),
    getById: (id) => getAll(KEYS.categories).find(c => c.id === id),
  };

  /* ============================================================
     PREFERÊNCIAS (modo escuro/claro)
     ============================================================ */
  const prefs = {
    getDarkMode: () => localStorage.getItem(KEYS.darkMode) !== 'false',
    setDarkMode: (val) => localStorage.setItem(KEYS.darkMode, val),
  };

  /* Expõe apenas o que outras páginas precisam usar */
  return { init, transactions, goals, categories, prefs };

})();
