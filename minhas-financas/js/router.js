/* ============================================================
   ROUTER.JS — Navegação SPA (Single Page Application)
   Troca de página sem recarregar o navegador.
   Funciona lendo o "#hash" da URL:
     #dashboard    → Dashboard
     #transactions → Transações
     #goals        → Metas
     #backup       → Backup & Restauração
   ============================================================ */

const Router = (() => {

  /* Mapa de rotas: hash → função que renderiza a página */
  const routes = {
    '#dashboard':    () => Dashboard.render(),
    '#transactions': () => Transactions.render(),
    '#goals':        () => Goals.render(),
    '#backup':       () => Backup.render(),
  };

  /* Títulos exibidos no header por rota */
  const titles = {
    '#dashboard':    'Dashboard',
    '#transactions': 'Transações',
    '#goals':        'Metas',
    '#backup':       'Backup & Restauração',
  };

  function navigate() {
    const hash  = window.location.hash || '#dashboard';
    const route = routes[hash];

    const titleEl = document.getElementById('header-title');
    if (titleEl) titleEl.textContent = titles[hash] || 'Minhas Finanças';

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.getAttribute('href') === hash);
    });

    const container = document.getElementById('page-container');
    if (container) {
      container.innerHTML = '<div class="spinner"></div>';
      setTimeout(() => {
        container.innerHTML = '';
        if (route) route();
        else container.innerHTML = '<p style="color:var(--text-secondary);padding:2rem">Página não encontrada.</p>';
      }, 100);
    }
  }

  function init() {
    window.addEventListener('hashchange', navigate);
    navigate();
  }

  return { init, navigate };

})();
