/* ============================================================
   BACKUP.JS — Página de Backup e Restauração de dados
   
   O que faz:
   - EXPORTAR: pega todos os dados do localStorage e gera um
     arquivo .json que o usuário baixa no computador
   - IMPORTAR: lê um arquivo .json previamente exportado e
     restaura todos os dados no localStorage
   - RESETAR: apaga tudo e recarrega os dados de exemplo
   - HISTÓRICO: registra os backups feitos nesta sessão
   ============================================================ */

const Backup = {

  /* Arquivo selecionado pelo usuário para importação */
  _selectedFile: null,

  /* Histórico de backups realizados (guardado em memória) */
  _history: JSON.parse(localStorage.getItem('mf_backup_history') || '[]'),

  /* ============================================================
     PONTO DE ENTRADA — chamado pelo Router
     ============================================================ */
  render() {
    const container = document.getElementById('page-container');

    /* Conta quantos registros existem atualmente */
    const txCount  = Store.transactions.getAll().length;
    const gCount   = Store.goals.getAll().length;
    const catCount = Store.categories.getAll().length;

    container.innerHTML = `
      <div class="backup-page">

        <!-- CARD DE STATUS: o que está salvo agora -->
        <div class="backup-status-card">
          <div class="backup-status-icon">
            <!-- Ícone: servidor/banco de dados -->
            <svg viewBox="0 0 24 24">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/>
              <path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
            </svg>
          </div>
          <div class="backup-status-info">
            <div class="backup-status-title">Dados armazenados no navegador</div>
            <div class="backup-status-sub">
              Seus dados ficam no localStorage deste navegador neste computador.<br>
              Exporte regularmente para não perdê-los ao limpar o histórico do browser.
            </div>
            <div class="backup-counts">
              <span class="count-chip">
                <span class="count-chip-dot" style="background:#6366f1"></span>
                ${txCount} transaç${txCount === 1 ? 'ão' : 'ões'}
              </span>
              <span class="count-chip">
                <span class="count-chip-dot" style="background:#10d9a0"></span>
                ${gCount} meta${gCount === 1 ? '' : 's'}
              </span>
              <span class="count-chip">
                <span class="count-chip-dot" style="background:#a78bfa"></span>
                ${catCount} categorias
              </span>
            </div>
          </div>
        </div>

        <!-- SEÇÃO: EXPORTAR -->
        <div class="backup-section">
          <div class="backup-section-header">
            <div class="backup-section-icon icon-export">
              <!-- Ícone: seta para baixo (download) -->
              <svg viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 13 7 8"/>
                <line x1="12" y1="3" x2="12" y2="13"/>
              </svg>
            </div>
            <div>
              <div class="backup-section-title">Exportar dados</div>
              <div class="backup-section-desc">Baixa um arquivo .json com todos os seus dados</div>
            </div>
          </div>
          <div class="backup-section-body">
            <div class="backup-action-row">
              <div class="backup-action-label">
                Gera um arquivo <strong>minhas-financas-backup.json</strong> com todas as
                transações, metas e categorias. Guarde em local seguro (nuvem, pendrive, etc).
              </div>
              <button class="btn-export" id="btn-export">
                <svg viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 13 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="13"/>
                </svg>
                Exportar agora
              </button>
            </div>
          </div>
        </div>

        <!-- SEÇÃO: IMPORTAR -->
        <div class="backup-section">
          <div class="backup-section-header">
            <div class="backup-section-icon icon-import">
              <!-- Ícone: seta para cima (upload/restaurar) -->
              <svg viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 5 17 10"/>
                <line x1="12" y1="5" x2="12" y2="19"/>
              </svg>
            </div>
            <div>
              <div class="backup-section-title">Restaurar dados</div>
              <div class="backup-section-desc">Carrega um arquivo .json exportado anteriormente</div>
            </div>
          </div>
          <div class="backup-section-body">

            <!-- Input de arquivo oculto — acionado pelo clique na drop zone -->
            <input type="file" id="file-import-input" accept=".json">

            <!-- Área de soltar arquivo (drag & drop ou clique) -->
            <div class="drop-zone" id="drop-zone">
              <div class="drop-zone-icon">📂</div>
              <div class="drop-zone-text">Clique para escolher ou arraste o arquivo aqui</div>
              <div class="drop-zone-sub">Apenas arquivos .json exportados por este app</div>
            </div>

            <!-- Preview do arquivo selecionado (aparece após escolher) -->
            <div class="file-preview" id="file-preview">
              <div class="file-preview-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="file-preview-info">
                <div class="file-preview-name" id="preview-name">arquivo.json</div>
                <div class="file-preview-size" id="preview-size">—</div>
              </div>
              <button class="btn-clear-file" id="btn-clear-file" title="Remover arquivo">
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- Botão de confirmar importação (aparece quando arquivo está pronto) -->
            <div class="backup-action-row" id="import-action-row" style="display:none">
              <div class="backup-action-label">
                <strong>Atenção:</strong> a restauração irá <strong>substituir</strong>
                todos os dados atuais pelo conteúdo do arquivo.
              </div>
              <button class="btn-import" id="btn-confirm-import">
                <svg viewBox="0 0 24 24">
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                </svg>
                Restaurar dados
              </button>
            </div>

          </div>
        </div>

        <!-- SEÇÃO: ZONA DE PERIGO -->
        <div class="backup-section danger-zone">
          <div class="backup-section-header">
            <div class="backup-section-icon icon-danger">
              <!-- Ícone: triângulo de alerta -->
              <svg viewBox="0 0 24 24">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <div class="backup-section-title">Zona de perigo</div>
              <div class="backup-section-desc">Ações irreversíveis — faça backup antes</div>
            </div>
          </div>
          <div class="backup-section-body">
            <div class="backup-action-row">
              <div class="backup-action-label">
                <strong>Resetar para dados de exemplo</strong> — apaga tudo e carrega
                as transações e metas de demonstração originais do app.
              </div>
              <button class="btn btn-danger" id="btn-reset">
                <svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round" viewBox="0 0 24 24">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                </svg>
                Resetar dados
              </button>
            </div>
          </div>
        </div>

        <!-- HISTÓRICO DE BACKUPS desta sessão -->
        <div class="backup-history">
          <div class="backup-history-header">
            <div class="backup-history-title">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Histórico de exportações
            </div>
          </div>
          <ul class="backup-history-list" id="backup-history-list"></ul>
        </div>

      </div>
    `;

    this._renderHistory();
    this._bindEvents();
  },

  /* ============================================================
     EXPORTAR — gera e baixa o arquivo .json
     ============================================================ */
  _export() {
    /* Coleta todos os dados do Store */
    const data = {
      version:      '1.0',                          /* versão do formato */
      exportedAt:   new Date().toISOString(),        /* data/hora da exportação */
      appName:      'Minhas Finanças',
      transactions: Store.transactions.getAll(),
      goals:        Store.goals.getAll(),
      categories:   Store.categories.getAll(),
    };

    /* Converte para texto JSON bem formatado (2 espaços de indentação) */
    const json = JSON.stringify(data, null, 2);

    /* Cria um "arquivo virtual" na memória e força o download */
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');

    /* Nome do arquivo com data: "minhas-financas-2024-03-15.json" */
    const dateStr = new Date().toISOString().split('T')[0];
    a.href     = url;
    a.download = `minhas-financas-${dateStr}.json`;
    a.click();

    /* Libera a memória após o download */
    URL.revokeObjectURL(url);

    /* Registra no histórico */
    this._addToHistory(a.download, data.transactions.length, data.goals.length);

    Utils.toast('Backup exportado com sucesso!', 'success');
  },

  /* ============================================================
     IMPORTAR — lê o arquivo e restaura os dados
     ============================================================ */
  _import() {
    if (!this._selectedFile) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        /* Faz o parse do JSON */
        const data = JSON.parse(e.target.result);

        /* Valida se é um backup válido do app */
        if (!data.transactions || !data.goals || !data.categories) {
          Utils.toast('Arquivo inválido. Use apenas backups exportados por este app.', 'error');
          return;
        }

        /* Confirmação final antes de sobrescrever */
        const ok = window.confirm(
          `Restaurar ${data.transactions.length} transações e ${data.goals.length} metas?\n\n` +
          `Os dados atuais serão substituídos. Esta ação não pode ser desfeita.`
        );

        if (!ok) return;

        /* Grava no localStorage */
        localStorage.setItem('mf_transactions', JSON.stringify(data.transactions));
        localStorage.setItem('mf_goals',        JSON.stringify(data.goals));
        localStorage.setItem('mf_categories',   JSON.stringify(data.categories));

        Utils.toast(`Restauração concluída! ${data.transactions.length} transações importadas.`, 'success');

        /* Recarrega a página para refletir os novos dados */
        setTimeout(() => window.location.reload(), 1200);

      } catch (err) {
        Utils.toast('Erro ao ler o arquivo. Verifique se é um .json válido.', 'error');
      }
    };

    /* Inicia a leitura do arquivo como texto */
    reader.readAsText(this._selectedFile);
  },

  /* ============================================================
     RESETAR — apaga tudo e volta aos dados de exemplo
     ============================================================ */
  _reset() {
    const ok = window.confirm(
      'Apagar TODOS os dados e voltar aos exemplos do app?\n\nEsta ação não pode ser desfeita.'
    );
    if (!ok) return;

    /* Remove as chaves do localStorage */
    ['mf_transactions', 'mf_goals', 'mf_categories'].forEach(k => localStorage.removeItem(k));

    Utils.toast('Dados resetados! Recarregando...', 'info');
    setTimeout(() => window.location.reload(), 1000);
  },

  /* ============================================================
     HISTÓRICO — registra e exibe backups feitos
     ============================================================ */
  _addToHistory(filename, txCount, goalsCount) {
    const entry = {
      filename,
      txCount,
      goalsCount,
      date: new Date().toLocaleString('pt-BR'),
    };

    this._history.unshift(entry); /* adiciona no início (mais recente primeiro) */
    if (this._history.length > 10) this._history.pop(); /* mantém até 10 entradas */
    localStorage.setItem('mf_backup_history', JSON.stringify(this._history));
    this._renderHistory();
  },

  _renderHistory() {
    const list = document.getElementById('backup-history-list');
    if (!list) return;

    if (!this._history.length) {
      list.innerHTML = `<li class="history-empty">Nenhuma exportação registrada ainda.</li>`;
      return;
    }

    list.innerHTML = this._history.map(h => `
      <li class="history-item">
        <div class="history-icon">
          <svg viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <div class="history-info">
          <div class="history-name">${h.filename}</div>
          <div class="history-meta">${h.date} · ${h.txCount} transações · ${h.goalsCount} metas</div>
        </div>
      </li>
    `).join('');
  },

  /* ============================================================
     EVENTOS — conecta botões e drag & drop
     ============================================================ */
  _bindEvents() {
    /* Botão exportar */
    document.getElementById('btn-export')
      ?.addEventListener('click', () => this._export());

    /* Botão resetar */
    document.getElementById('btn-reset')
      ?.addEventListener('click', () => this._reset());

    /* Botão confirmar importação */
    document.getElementById('btn-confirm-import')
      ?.addEventListener('click', () => this._import());

    /* Clique na drop zone abre o seletor de arquivo */
    document.getElementById('drop-zone')
      ?.addEventListener('click', () => document.getElementById('file-import-input').click());

    /* Quando o usuário escolhe um arquivo pelo seletor */
    document.getElementById('file-import-input')
      ?.addEventListener('change', (e) => this._handleFile(e.target.files[0]));

    /* Drag & Drop — quando o arquivo passa sobre a zona */
    const dropZone = document.getElementById('drop-zone');
    dropZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone?.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    dropZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) this._handleFile(file);
    });

    /* Botão remover arquivo selecionado */
    document.getElementById('btn-clear-file')
      ?.addEventListener('click', () => this._clearFile());
  },

  /* Processa o arquivo escolhido e mostra o preview */
  _handleFile(file) {
    if (!file || !file.name.endsWith('.json')) {
      Utils.toast('Selecione apenas arquivos .json', 'error');
      return;
    }

    this._selectedFile = file;

    /* Formata o tamanho do arquivo */
    const size = file.size < 1024
      ? `${file.size} B`
      : `${(file.size / 1024).toFixed(1)} KB`;

    /* Mostra o preview e esconde a drop zone */
    document.getElementById('drop-zone').style.display    = 'none';
    document.getElementById('file-preview').classList.add('visible');
    document.getElementById('preview-name').textContent   = file.name;
    document.getElementById('preview-size').textContent   = size;
    document.getElementById('import-action-row').style.display = 'flex';
  },

  /* Limpa o arquivo selecionado e volta à drop zone */
  _clearFile() {
    this._selectedFile = null;
    document.getElementById('file-import-input').value    = '';
    document.getElementById('drop-zone').style.display    = '';
    document.getElementById('file-preview').classList.remove('visible');
    document.getElementById('import-action-row').style.display = 'none';
  },
};
