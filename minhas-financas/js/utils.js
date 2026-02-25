/* ============================================================
   UTILS.JS — Funções auxiliares reutilizáveis
   Pequenas ferramentas usadas por todas as páginas.
   ============================================================ */

const Utils = {

  /* Formata número como moeda brasileira: 1234.56 → "R$ 1.234,56" */
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL'
    }).format(value);
  },

  /* Formata data ISO "2024-03-15" → "15/03/2024" */
  formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  },

  /* Formata data abreviada: "2024-03-15" → "15 Mar" */
  formatDateShort(dateStr) {
    if (!dateStr) return '';
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const [y, m, d] = dateStr.split('-');
    return `${d} ${months[parseInt(m) - 1]}`;
  },

  /* Gera um ID único para novos registros */
  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  },

  /* Calcula porcentagem: quanto de total é atual? (max 100) */
  calculatePercentage(current, total) {
    if (!total || total === 0) return 0;
    return Math.min(Math.round((current / total) * 100), 100);
  },

  /* Retorna "Janeiro 2024" para o mês/ano atual ou offset */
  getMonthLabel(offset = 0) {
    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const d = new Date();
    d.setMonth(d.getMonth() - offset);
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  },

  /* Retorna "YYYY-MM" do mês atual com offset */
  getYearMonth(offset = 0) {
    const d = new Date();
    d.setMonth(d.getMonth() - offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  },

  /* Verifica se uma data (string "YYYY-MM-DD") está no mês passado como argumento */
  isInMonth(dateStr, yearMonth) {
    return dateStr && dateStr.startsWith(yearMonth);
  },

  /* Verifica se data está na semana atual */
  isInCurrentWeek(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);
    return date >= startOfWeek && date <= endOfWeek;
  },

  /* Anima um número de 0 até o valor final (para os cards do dashboard) */
  animateCount(element, targetValue, duration = 800, isCurrency = true) {
    const start = performance.now();
    const startVal = 0;
    function update(timestamp) {
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      /* easing suave: começa rápido, desacelera no final */
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetValue - startVal) * eased;
      element.textContent = isCurrency ? Utils.formatCurrency(current) : Math.round(current);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  },

  /* Mostra uma notificação rápida no canto da tela */
  toast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    /* Mostra */
    setTimeout(() => toast.classList.add('visible'), 10);
    /* Esconde após 3 segundos */
    setTimeout(() => {
      toast.classList.remove('visible');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /* Confirma exclusão com diálogo nativo */
  confirm(message) {
    return window.confirm(message);
  },
};

/* Estilos do toast (injetados uma única vez) */
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 12px 20px;
    border-radius: 10px;
    font-family: var(--font-body);
    font-size: 0.875rem;
    font-weight: 500;
    color: #fff;
    z-index: 9999;
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }
  .toast.visible { transform: translateY(0); opacity: 1; }
  .toast-success { background: #34d399; color: #064e3b; }
  .toast-error   { background: #f87171; color: #7f1d1d; }
  .toast-info    { background: #4f8ef7; color: #fff; }
`;
document.head.appendChild(toastStyle);
