/* ============================================================
   DASHBOARD.JS — Página principal com gráficos e resumo
   Lê dados do Store e desenha usando Canvas API puro.
   ============================================================ */

const Dashboard = {

  /* Ponto de entrada: chamado pelo Router ao navegar para #dashboard */
  render() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
      <div class="dashboard-grid">

        <!-- CARDS DE RESUMO NO TOPO — com ícones SVG e pill de tendência -->
        <div class="summary-cards">

          <div class="summary-card card-balance">
            <div class="card-top">
              <div class="card-icon-box">
                <!-- Ícone: carteira -->
                <svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
              </div>
              <span class="card-trend trend-neutral" id="trend-balance">—</span>
            </div>
            <div class="card-label">Saldo Total</div>
            <div class="card-value" id="val-balance">R$ 0,00</div>
          </div>

          <div class="summary-card card-income">
            <div class="card-top">
              <div class="card-icon-box">
                <!-- Ícone: seta para cima com círculo -->
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/></svg>
              </div>
              <span class="card-trend trend-up" id="trend-income">Mês</span>
            </div>
            <div class="card-label">Receitas do Mês</div>
            <div class="card-value positive" id="val-income">R$ 0,00</div>
          </div>

          <div class="summary-card card-expense">
            <div class="card-top">
              <div class="card-icon-box">
                <!-- Ícone: seta para baixo com círculo -->
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
              </div>
              <span class="card-trend trend-down" id="trend-expense">Mês</span>
            </div>
            <div class="card-label">Despesas do Mês</div>
            <div class="card-value negative" id="val-expense">R$ 0,00</div>
          </div>

          <div class="summary-card card-savings">
            <div class="card-top">
              <div class="card-icon-box">
                <!-- Ícone: porquinho/cofre simplificado (raio) -->
                <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
              <span class="card-trend trend-neutral" id="trend-savings">Mês</span>
            </div>
            <div class="card-label">Economia do Mês</div>
            <div class="card-value violet" id="val-savings">R$ 0,00</div>
          </div>

        </div>

        <!-- GRÁFICOS -->
        <div class="charts-section">

          <div class="chart-card">
            <div class="chart-header">
              <div>
                <div class="chart-title">
                  <div class="chart-title-icon">
                    <svg viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                  </div>
                  Despesas por Categoria
                </div>
                <div class="chart-subtitle">Distribuição do mês atual</div>
              </div>
            </div>
            <div class="pie-wrapper">
              <div class="pie-canvas-wrap">
                <canvas id="chart-pie" class="chart-canvas" width="200" height="200"></canvas>
              </div>
              <ul class="pie-legend" id="pie-legend"></ul>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <div>
                <div class="chart-title">
                  <div class="chart-title-icon">
                    <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                  </div>
                  Receitas vs Despesas
                </div>
                <div class="chart-subtitle">Últimos 6 meses</div>
              </div>
            </div>
            <canvas id="chart-bars" class="chart-canvas" height="200"></canvas>
          </div>

          <div class="chart-card chart-full">
            <div class="chart-header">
              <div>
                <div class="chart-title">
                  <div class="chart-title-icon">
                    <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  Evolução do Saldo
                </div>
                <div class="chart-subtitle">Acumulado ao longo do tempo</div>
              </div>
            </div>
            <canvas id="chart-line" class="chart-canvas" height="160"></canvas>
          </div>

        </div>

        <!-- ÚLTIMAS TRANSAÇÕES -->
        <div class="bottom-section">
          <div class="recent-transactions">
            <div class="section-header">
              <div class="section-title">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Últimas Transações
              </div>
              <a href="#transactions" class="section-link">Ver todas <svg style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;vertical-align:middle" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></a>
            </div>
            <ul class="tx-list" id="recent-tx-list"></ul>
          </div>
        </div>

      </div>
    `;

    /* Carrega os dados e atualiza tudo */
    this._loadData();
  },

  /* Busca dados do Store e alimenta todos os elementos visuais */
  _loadData() {
    const transactions = Store.transactions.getAll();
    const categories   = Store.categories.getAll();
    const currentMonth = Utils.getYearMonth(0);

    /* --- Transações do mês atual --- */
    const monthTxs = transactions.filter(t => t.date.startsWith(currentMonth));

    const income  = monthTxs.filter(t => t.type === 'income' ).reduce((s, t) => s + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savings = income - expense;

    /* --- Saldo total (todas as transações) --- */
    const totalIncome  = transactions.filter(t => t.type === 'income' ).reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance      = totalIncome - totalExpense;

    /* --- Animar os cards --- */
    setTimeout(() => {
      Utils.animateCount(document.getElementById('val-balance'), balance);
      Utils.animateCount(document.getElementById('val-income'),  income);
      Utils.animateCount(document.getElementById('val-expense'), expense);
      Utils.animateCount(document.getElementById('val-savings'), savings);
    }, 150);

    /* --- Gráficos --- */
    setTimeout(() => {
      this._drawPieChart(monthTxs, categories);
      this._drawBarChart(transactions);
      this._drawLineChart(transactions);
      this._renderRecentTx(transactions, categories);
    }, 200);
  },

  /* ============================================================
     GRÁFICO DE PIZZA — despesas por categoria (Canvas API)
     ============================================================ */
  _drawPieChart(monthTxs, categories) {
    const canvas = document.getElementById('chart-pie');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    /* Agrupa despesas por categoria */
    const expMap = {};
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
      expMap[t.category] = (expMap[t.category] || 0) + t.amount;
    });

    const entries = Object.entries(expMap).sort((a, b) => b[1] - a[1]);
    if (!entries.length) {
      ctx.fillStyle = '#4a5580';
      ctx.font = '14px DM Sans';
      ctx.textAlign = 'center';
      ctx.fillText('Sem despesas este mês', 100, 100);
      return;
    }

    const total  = entries.reduce((s, [, v]) => s + v, 0);
    const cx     = 100, cy = 100, r = 88;
    let   angle  = -Math.PI / 2; /* começa no topo */

    /* Pega as cores das categorias */
    const catMap = {};
    categories.forEach(c => { catMap[c.id] = c; });

    const slices = entries.map(([catId, value]) => {
      const cat   = catMap[catId];
      const sweep = (value / total) * 2 * Math.PI;
      const color = cat ? cat.color : '#8892b0';
      const slice = { catId, value, sweep, color, startAngle: angle, cat };
      angle += sweep;
      return slice;
    });

    /* Desenha as fatias */
    slices.forEach(s => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, s.startAngle, s.startAngle + s.sweep);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      /* Separador entre fatias */
      ctx.strokeStyle = 'rgba(8,11,20,0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    /* Círculo central (efeito donut) */
    ctx.beginPath();
    ctx.arc(cx, cy, 50, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1120';
    ctx.fill();

    /* Texto no centro */
    ctx.fillStyle = '#5a6490';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Despesas', cx, cy - 6);
    ctx.fillStyle = '#e8eaf6';
    ctx.font = 'bold 13px JetBrains Mono';
    ctx.fillText(Utils.formatCurrency(total), cx, cy + 12);

    /* Legenda clicável */
    const legend = document.getElementById('pie-legend');
    legend.innerHTML = '';
    slices.forEach((s, i) => {
      const pct  = Math.round((s.value / total) * 100);
      const name = s.cat ? s.cat.name : 'Outros';
      const li   = document.createElement('li');
      li.className = 'legend-item';
      li.dataset.index = i;
      li.innerHTML = `
        <span class="legend-dot" style="background:${s.color}"></span>
        <span class="legend-name">${name}</span>
        <span class="legend-value">${pct}%</span>
      `;
      /* Ao clicar: destaca a fatia redenhando com opacidade */
      li.addEventListener('click', () => {
        const isActive = li.classList.contains('active');
        legend.querySelectorAll('.legend-item').forEach(el => el.classList.remove('active','dimmed'));
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (isActive) {
          /* Mostra todas normalmente */
          slices.forEach(sl => {
            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, sl.startAngle, sl.startAngle + sl.sweep);
            ctx.closePath();
            ctx.fillStyle = sl.color; ctx.fill();
            ctx.strokeStyle = 'rgba(15,17,23,0.6)'; ctx.lineWidth = 2; ctx.stroke();
          });
        } else {
          /* Destaca a fatia clicada */
          li.classList.add('active');
          legend.querySelectorAll('.legend-item:not(.active)').forEach(el => el.classList.add('dimmed'));
          slices.forEach((sl, j) => {
            ctx.beginPath(); ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, sl.startAngle, sl.startAngle + sl.sweep);
            ctx.closePath();
            ctx.globalAlpha = (j === i) ? 1 : 0.25;
            ctx.fillStyle = sl.color; ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(15,17,23,0.6)'; ctx.lineWidth = 2; ctx.stroke();
          });
        }
        /* Redesenha círculo central */
        ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI * 2);
        ctx.fillStyle = '#181c27'; ctx.fill();
        ctx.fillStyle = '#8892b0'; ctx.font = '11px DM Sans'; ctx.textAlign = 'center';
        ctx.fillText('Despesas', cx, cy - 6);
        ctx.fillStyle = '#f0f2ff'; ctx.font = '600 12px JetBrains Mono';
        ctx.fillText(isActive ? Utils.formatCurrency(total) : Utils.formatCurrency(s.value), cx, cy + 12);
      });
      legend.appendChild(li);
    });
  },

  /* ============================================================
     GRÁFICO DE BARRAS — receitas vs despesas (últimos 6 meses)
     ============================================================ */
  _drawBarChart(transactions) {
    const canvas = document.getElementById('chart-bars');
    if (!canvas) return;

    canvas.width = canvas.parentElement.clientWidth - 48;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 16, right: 16, bottom: 44, left: 72 };

    const months = [];
    for (let i = 5; i >= 0; i--) {
      const ym  = Utils.getYearMonth(i);
      const txs = transactions.filter(t => t.date.startsWith(ym));
      months.push({
        label:   Utils.getMonthLabel(i).substring(0, 3),
        income:  txs.filter(t => t.type==='income' ).reduce((s,t)=>s+t.amount,0),
        expense: txs.filter(t => t.type==='expense').reduce((s,t)=>s+t.amount,0),
      });
    }

    const maxVal = Math.max(...months.flatMap(m => [m.income, m.expense]), 1);
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;
    const slotW  = chartW / months.length;
    const barW   = slotW * 0.28;
    const gap    = slotW * 0.06;

    ctx.clearRect(0, 0, W, H);

    /* Grade com linhas tracejadas */
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (chartH / 4) * i;
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(60,70,110,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
      ctx.setLineDash([]);
      const val = maxVal * (1 - i / 4);
      ctx.fillStyle = '#3d4870';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'right';
      const label = val >= 1000 ? `R$${(val/1000).toFixed(0)}k` : `R$${val.toFixed(0)}`;
      ctx.fillText(label, pad.left - 8, y + 4);
    }

    months.forEach((m, i) => {
      const cx    = pad.left + slotW * i + slotW * 0.5;
      const incH  = (m.income  / maxVal) * chartH;
      const expH  = (m.expense / maxVal) * chartH;
      const bx    = cx - barW - gap * 0.5;

      /* Barra de receita com gradiente */
      const gInc = ctx.createLinearGradient(0, pad.top + chartH - incH, 0, pad.top + chartH);
      gInc.addColorStop(0, '#10d9a0');
      gInc.addColorStop(1, 'rgba(16,217,160,0.3)');
      ctx.fillStyle = gInc;
      ctx.beginPath();
      ctx.roundRect(bx, pad.top + chartH - incH, barW, incH, [4,4,0,0]);
      ctx.fill();

      /* Barra de despesa com gradiente */
      const gExp = ctx.createLinearGradient(0, pad.top + chartH - expH, 0, pad.top + chartH);
      gExp.addColorStop(0, '#f43f5e');
      gExp.addColorStop(1, 'rgba(244,63,94,0.3)');
      ctx.fillStyle = gExp;
      ctx.beginPath();
      ctx.roundRect(bx + barW + gap, pad.top + chartH - expH, barW, expH, [4,4,0,0]);
      ctx.fill();

      /* Mês */
      ctx.fillStyle = '#5a6490';
      ctx.font = '11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, cx, H - pad.bottom + 18);
    });

    /* Legenda compacta */
    const lx = pad.left, ly = H - 6;
    ctx.fillStyle = '#10d9a0';
    ctx.beginPath(); ctx.roundRect(lx, ly - 8, 20, 8, 3); ctx.fill();
    ctx.fillStyle = '#5a6490'; ctx.font = '10px Inter'; ctx.textAlign = 'left';
    ctx.fillText('Receita', lx + 24, ly);
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath(); ctx.roundRect(lx + 80, ly - 8, 20, 8, 3); ctx.fill();
    ctx.fillStyle = '#5a6490';
    ctx.fillText('Despesa', lx + 104, ly);
  },

  /* ============================================================
     GRÁFICO DE LINHA — evolução do saldo ao longo do tempo
     ============================================================ */
  _drawLineChart(transactions) {
    const canvas = document.getElementById('chart-line');
    if (!canvas) return;

    canvas.width = canvas.parentElement.clientWidth - 48;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const pad = { top: 16, right: 16, bottom: 36, left: 80 };

    /* Saldo acumulado mês a mês */
    const points = [];
    let running = 0;
    for (let i = 5; i >= 0; i--) {
      const ym  = Utils.getYearMonth(i);
      const txs = transactions.filter(t => t.date.startsWith(ym));
      txs.forEach(t => { running += t.type==='income' ? t.amount : -t.amount; });
      points.push({ label: Utils.getMonthLabel(i).substring(0, 3), value: running });
    }

    const minVal = Math.min(...points.map(p=>p.value), 0);
    const maxVal = Math.max(...points.map(p=>p.value), 1);
    const range  = maxVal - minVal || 1;
    const chartW = W - pad.left - pad.right;
    const chartH = H - pad.top  - pad.bottom;

    ctx.clearRect(0, 0, W, H);

    /* Grade tracejada */
    for (let i = 0; i <= 4; i++) {
      const y   = pad.top + (chartH / 4) * i;
      const val = maxVal - (range / 4) * i;
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(60,70,110,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W-pad.right, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#3d4870';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'right';
      const lbl = val >= 1000 ? `R$${(val/1000).toFixed(0)}k` : `R$${val.toFixed(0)}`;
      ctx.fillText(lbl, pad.left - 8, y + 4);
    }

    const coords = points.map((p, i) => ({
      x: pad.left + (i / (points.length - 1)) * chartW,
      y: pad.top  + ((maxVal - p.value) / range) * chartH,
      label: p.label,
    }));

    /* Área gradiente — violeta → transparente */
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, 'rgba(99,102,241,0.25)');
    grad.addColorStop(0.6, 'rgba(99,102,241,0.08)');
    grad.addColorStop(1,   'rgba(99,102,241,0)');
    ctx.beginPath();
    ctx.moveTo(coords[0].x, pad.top + chartH);
    /* Curva bezier suave entre pontos */
    coords.forEach((c, i) => {
      if (i === 0) { ctx.lineTo(c.x, c.y); return; }
      const prev = coords[i-1];
      const cpx  = (prev.x + c.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, c.y, c.x, c.y);
    });
    ctx.lineTo(coords[coords.length-1].x, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    /* Linha com bezier */
    ctx.beginPath();
    const lineGrad = ctx.createLinearGradient(pad.left, 0, W - pad.right, 0);
    lineGrad.addColorStop(0, '#a78bfa');
    lineGrad.addColorStop(1, '#6366f1');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    coords.forEach((c, i) => {
      if (i === 0) { ctx.moveTo(c.x, c.y); return; }
      const prev = coords[i-1];
      const cpx  = (prev.x + c.x) / 2;
      ctx.bezierCurveTo(cpx, prev.y, cpx, c.y, c.x, c.y);
    });
    ctx.stroke();

    /* Pontos com halo de brilho */
    coords.forEach(c => {
      /* Halo */
      ctx.beginPath();
      ctx.arc(c.x, c.y, 8, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(99,102,241,0.15)';
      ctx.fill();
      /* Ponto */
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4, 0, Math.PI*2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.strokeStyle = '#080b14';
      ctx.lineWidth = 2;
      ctx.stroke();
      /* Rótulo */
      ctx.fillStyle = '#5a6490';
      ctx.font = '11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(c.label, c.x, H - pad.bottom + 16);
    });
  },

  /* ============================================================
     LISTA DE ÚLTIMAS 5 TRANSAÇÕES
     ============================================================ */
  _renderRecentTx(transactions, categories) {
    const list = document.getElementById('recent-tx-list');
    if (!list) return;

    const recent = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const catMap = {};
    categories.forEach(c => { catMap[c.id] = c; });

    list.innerHTML = recent.map(t => {
      const cat      = catMap[t.category];
      const icon     = cat ? cat.icon : '💳';
      const catName  = cat ? cat.name : 'Outros';
      const isIncome = t.type === 'income';

      return `
        <li class="tx-item">
          <div class="tx-icon">${icon}</div>
          <div class="tx-info">
            <div class="tx-desc">${t.description}</div>
            <div class="tx-cat">${catName}</div>
          </div>
          <div class="tx-date">${Utils.formatDateShort(t.date)}</div>
          <div class="tx-amount ${isIncome ? 'money-positive' : 'money-negative'}">
            ${isIncome ? '+' : '−'}&nbsp;${Utils.formatCurrency(t.amount)}
          </div>
        </li>
      `;
    }).join('');
  },
};
