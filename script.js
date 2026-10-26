(() => {
  const STORAGE_KEY = 'fabricio-demo-management-v1';
  const initialRequests = [
    { id: 101, client: 'Cliente de demostración 01', initials: 'CD', service: 'Mantenimiento', date: '26 oct. 2026', amount: 1250, status: 'En proceso' },
    { id: 102, client: 'Cliente de demostración 02', initials: 'CD', service: 'Instalación', date: '25 oct. 2026', amount: 2400, status: 'Cotización enviada' },
    { id: 103, client: 'Cliente de demostración 03', initials: 'CD', service: 'Soporte técnico', date: '24 oct. 2026', amount: 450, status: 'Nueva' },
    { id: 104, client: 'Cliente de demostración 04', initials: 'CD', service: 'Mantenimiento', date: '23 oct. 2026', amount: 1800, status: 'Cerrada' },
    { id: 105, client: 'Cliente de demostración 05', initials: 'CD', service: 'Consultoría', date: '22 oct. 2026', amount: 950, status: 'Cotización enviada' },
    { id: 106, client: 'Cliente de demostración 06', initials: 'CD', service: 'Instalación', date: '21 oct. 2026', amount: 1600, status: 'En proceso' }
  ];
  const statusOptions = ['Nueva', 'Cotización enviada', 'En proceso', 'Cerrada'];
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  let requests = loadRequests();
  let toastTimer;

  function loadRequests() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (error) { console.warn('No se pudo leer el almacenamiento local.', error); }
    return initialRequests.map(item => ({ ...item }));
  }
  function saveRequests() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(requests)); }
    catch (error) { showToast('No se pudo guardar en este navegador.'); console.warn(error); }
  }
  function money(value) {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(Number(value) || 0).replace('PEN', 'S/');
  }
  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase();
  }
  function statusClass(status) {
    return ({ 'Nueva': 'status-nueva', 'Cotización enviada': 'status-cotizacion', 'En proceso': 'status-proceso', 'Cerrada': 'status-cerrada' })[status] || 'status-nueva';
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  function render() {
    const search = $('#searchInput').value.trim().toLowerCase();
    const statusFilter = $('#statusFilter').value;
    const filtered = requests.filter(item => {
      const matchesText = `${item.client} ${item.service}`.toLowerCase().includes(search);
      return matchesText && (statusFilter === 'all' || item.status === statusFilter);
    });
    $('#requestRows').innerHTML = filtered.map(item => `
      <tr>
        <td><div class="client-cell"><span class="client-avatar">${escapeHTML(item.initials || initials(item.client))}</span><span class="client-copy"><strong>${escapeHTML(item.client)}</strong><small>ID SOL-${item.id}</small></span></div></td>
        <td><span class="service-label">${escapeHTML(item.service)}</span></td>
        <td>${escapeHTML(item.date)}</td>
        <td><span class="amount">${money(item.amount)}</span></td>
        <td><select class="status-select ${statusClass(item.status)}" data-status-id="${item.id}" aria-label="Estado de ${escapeHTML(item.client)}">${statusOptions.map(status => `<option value="${status}" ${item.status === status ? 'selected' : ''}>${status}</option>`).join('')}</select></td>
      </tr>`).join('');
    $('#emptyState').hidden = filtered.length !== 0;
    $('#tableCount').textContent = `Mostrando ${filtered.length} de ${requests.length} solicitudes`;
    $('#navCount').textContent = String(requests.length).padStart(2, '0');
    $('#statTotal').textContent = String(requests.length).padStart(2, '0');
    $('#statPending').textContent = String(requests.filter(x => x.status === 'Nueva' || x.status === 'Cotización enviada').length).padStart(2, '0');
    $('#statProgress').textContent = String(requests.filter(x => x.status === 'En proceso').length).padStart(2, '0');
    const total = requests.filter(x => x.status !== 'Cerrada').reduce((sum, x) => sum + Number(x.amount || 0), 0);
    $('#statAmount').textContent = money(total);
    $$('[data-status-id]').forEach(select => select.addEventListener('change', event => {
      const id = Number(event.currentTarget.dataset.statusId);
      const target = requests.find(item => item.id === id);
      if (target) {
        target.status = event.currentTarget.value;
        saveRequests();
        render();
        showToast('Estado actualizado en la demo.');
      }
    }));
  }
  function openModal() {
    $('#modalBackdrop').hidden = false;
    document.body.classList.add('modal-open');
    setTimeout(() => $('[name="client"]').focus(), 30);
  }
  function closeModal() {
    $('#modalBackdrop').hidden = true;
    document.body.classList.remove('modal-open');
    $('#requestForm').reset();
    $('#openModal').focus();
  }
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  function exportCSV() {
    const rows = [['ID', 'Cliente', 'Servicio', 'Fecha', 'Monto estimado (PEN)', 'Estado'], ...requests.map(x => [x.id, x.client, x.service, x.date, x.amount, x.status])];
    const csv = '\uFEFF' + rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a'); link.href = url; link.download = 'solicitudes-demo.csv'; link.click(); URL.revokeObjectURL(url);
    showToast('Archivo CSV de ejemplo generado.');
  }
  $('#openModal').addEventListener('click', openModal);
  $('#closeModal').addEventListener('click', closeModal);
  $('#cancelModal').addEventListener('click', closeModal);
  $('#modalBackdrop').addEventListener('click', event => { if (event.target === $('#modalBackdrop')) closeModal(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#modalBackdrop').hidden) closeModal(); });
  $('#requestForm').addEventListener('submit', event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const client = String(form.get('client') || '').trim();
    const amount = Number(form.get('amount'));
    if (!client || !Number.isFinite(amount) || amount < 0) return;
    const now = new Date();
    const date = now.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
    requests.unshift({ id: Date.now(), client, initials: initials(client), service: String(form.get('service')), date, amount, status: String(form.get('status')) });
    saveRequests(); render(); closeModal(); showToast('Solicitud añadida solo a esta demo.');
  });
  $('#searchInput').addEventListener('input', render);
  $('#statusFilter').addEventListener('change', render);
  $('#exportCsv').addEventListener('click', exportCSV);
  $('#mobileMenu').addEventListener('click', () => {
    const isOpen = $('#sidebar').classList.toggle('open');
    $('#mobileMenu').setAttribute('aria-expanded', String(isOpen));
  });
  $$('.nav-item, .brand').forEach(link => link.addEventListener('click', () => {
    $('#sidebar').classList.remove('open'); $('#mobileMenu').setAttribute('aria-expanded', 'false');
    $$('.nav-item').forEach(item => item.classList.toggle('active', item === link));
  }));
  render();
})();
