const STORAGE_KEY = "bem_estar_med_data";
const USERS_KEY = "bem_estar_med_users";

const initialData = {
  products: [
    { id: crypto.randomUUID(), code: "MED-0001", name: "Cama hospitalar", category: "Locação", condition: "Bom", status: "disponivel" },
    { id: crypto.randomUUID(), code: "MED-0002", name: "Cadeira de rodas", category: "Locação", condition: "Bom", status: "disponivel" },
  ],
  rentals: [],
  sales: [],
};

const state = loadState();
const users = loadUsers();
const ui = {
  selectedRentalMonth: new Date(),
  selectedSaleMonth: new Date(),
  selectedReportMonth: new Date(),
  session: null,
};

const $ = (id) => document.getElementById(id);

const welcomeScreen = $("welcomeScreen");
const appScreen = $("appScreen");
const sessionInfo = $("sessionInfo");
const openAuthBtn = $("openAuthBtn");
const closeAuthBtn = $("closeAuthBtn");
const logoutBtn = $("logoutBtn");

const authModal = $("authModal");
const authTitle = $("authTitle");
const setupForm = $("setupForm");
const loginForm = $("loginForm");

const productForm = $("productForm");
const rentalForm = $("rentalForm");
const saleForm = $("saleForm");

const createUserForm = $("createUserForm");
const changePasswordForm = $("changePasswordForm");
const usersAdminPanel = $("usersAdminPanel");
const usersTable = $("usersTable");

const productsTable = $("productsTable");
const rentalsTable = $("rentalsTable");
const salesTable = $("salesTable");
const reportCards = $("reportCards");
const reportTable = $("reportTable");
const alertsList = $("alertsList");
const stats = $("stats");

const rentalMonthLabel = $("rentalMonthLabel");
const saleMonthLabel = $("saleMonthLabel");
const reportMonthLabel = $("reportMonthLabel");

const rentalPrevMonth = $("rentalPrevMonth");
const rentalNextMonth = $("rentalNextMonth");
const salePrevMonth = $("salePrevMonth");
const saleNextMonth = $("saleNextMonth");
const reportPrevMonth = $("reportPrevMonth");
const reportNextMonth = $("reportNextMonth");

const clientModal = $("clientModal");
const modalBody = $("modalBody");
const closeClientModalBtn = $("closeClientModalBtn");

const productModal = $("productModal");
const productModalBody = $("productModalBody");
const closeProductModalBtn = $("closeProductModalBtn");

openAuthBtn.addEventListener("click", openAuthModal);
closeAuthBtn.addEventListener("click", closeAuthModal);
logoutBtn.addEventListener("click", logout);

authModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeAuth === "true") closeAuthModal();
});

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(setupForm);
  const username = data.get("adminUsername").toString().trim();
  const password = data.get("adminPassword").toString().trim();
  if (!username || !password) return alert("Preencha usuário e senha.");

  users.push({ username, password, role: "admin", createdAt: new Date().toISOString() });
  persistUsers();
  alert("Admin criado com sucesso. Faça login.");
  setupForm.reset();
  switchAuthMode();
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  const username = data.get("username").toString().trim();
  const password = data.get("password").toString().trim();
  const role = data.get("role").toString();

  const user = users.find((item) => item.username === username && item.password === password && item.role === role);
  if (!user) return alert("Credenciais inválidas.");

  ui.session = { username: user.username, role: user.role };
  sessionInfo.textContent = `Logado como ${user.username} (${user.role})`;

  closeAuthModal();
  welcomeScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  render();
});

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(productForm);
  state.products.push({
    id: crypto.randomUUID(),
    code: generateProductCode(),
    name: data.get("name").toString().trim(),
    category: data.get("category").toString().trim(),
    condition: data.get("condition").toString(),
    status: "disponivel",
  });
  productForm.reset();
  persistAndRender();
});

rentalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(rentalForm);
  const product = state.products.find((item) => item.id === data.get("productId"));
  if (!product || product.status !== "disponivel") return alert("Produto indisponível para aluguel.");

  const startDate = data.get("startDate").toString();
  const endDate = data.get("endDate").toString();
  if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) return alert("Data final inválida.");

  product.status = "alugado";
  state.rentals.push({
    id: crypto.randomUUID(),
    name: data.get("name").toString().trim(),
    phone: data.get("phone").toString().trim(),
    address: data.get("address").toString().trim(),
    document: data.get("document").toString().trim(),
    cnpj: data.get("cnpj").toString().trim(),
    productId: product.id,
    dailyPrice: Number(data.get("dailyPrice")),
    total: Number(data.get("total")),
    startDate,
    endDate,
    status: "Ativo",
  });
  rentalForm.reset();
  persistAndRender();
});

saleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(saleForm);
  const product = state.products.find((item) => item.id === data.get("productId"));
  if (!product || product.status !== "disponivel") return alert("Produto indisponível para venda.");

  product.status = "vendido";
  state.sales.push({
    id: crypto.randomUUID(),
    buyer: data.get("buyer").toString().trim(),
    productId: product.id,
    unitPrice: Number(data.get("unitPrice")),
    total: Number(data.get("unitPrice")),
    date: new Date().toISOString(),
  });

  saleForm.reset();
  persistAndRender();
});

createUserForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isAdmin()) return alert("Apenas admin pode criar usuários.");

  const data = new FormData(createUserForm);
  const username = data.get("username").toString().trim();
  const password = data.get("password").toString().trim();
  const role = data.get("role").toString();

  if (!username || !password) return alert("Informe usuário e senha.");
  if (users.some((item) => item.username === username)) return alert("Usuário já existe.");
  if (role !== "funcionario") return alert("Só é permitido criar funcionário.");

  users.push({ username, password, role: "funcionario", createdAt: new Date().toISOString() });
  persistUsers();
  createUserForm.reset();
  renderUsers();
});

changePasswordForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!isAdmin()) return alert("Apenas admin pode alterar senha.");

  const data = new FormData(changePasswordForm);
  const targetUser = data.get("targetUser").toString();
  const newPassword = data.get("newPassword").toString().trim();

  if (!targetUser || !newPassword) return alert("Selecione usuário e nova senha.");
  const user = users.find((item) => item.username === targetUser);
  if (!user) return alert("Usuário não encontrado.");

  user.password = newPassword;
  persistUsers();
  changePasswordForm.reset();
  alert("Senha alterada com sucesso.");
});

closeClientModalBtn.addEventListener("click", () => closeModal(clientModal));
clientModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeClient === "true") closeModal(clientModal);
});

closeProductModalBtn.addEventListener("click", () => closeModal(productModal));
productModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeProduct === "true") closeModal(productModal);
});

rentalPrevMonth.addEventListener("click", () => { ui.selectedRentalMonth = addMonth(ui.selectedRentalMonth, -1); renderRentals(); });
rentalNextMonth.addEventListener("click", () => { ui.selectedRentalMonth = addMonth(ui.selectedRentalMonth, 1); renderRentals(); });
salePrevMonth.addEventListener("click", () => { ui.selectedSaleMonth = addMonth(ui.selectedSaleMonth, -1); renderSales(); });
saleNextMonth.addEventListener("click", () => { ui.selectedSaleMonth = addMonth(ui.selectedSaleMonth, 1); renderSales(); });
reportPrevMonth.addEventListener("click", () => { ui.selectedReportMonth = addMonth(ui.selectedReportMonth, -1); renderReports(); });
reportNextMonth.addEventListener("click", () => { ui.selectedReportMonth = addMonth(ui.selectedReportMonth, 1); renderReports(); });

$("exportRentalsCsv").addEventListener("click", () => {
  downloadCsv("alugueis.csv", state.rentals.map((r) => ({
    nome: r.name,
    telefone: r.phone,
    endereco: r.address,
    documento: r.document,
    cnpj: r.cnpj || "",
    produto: findProductName(r.productId),
    codigo_produto: findProductCode(r.productId),
    diaria: r.dailyPrice,
    total: r.total,
    inicio: r.startDate,
    fim: r.endDate,
    status: r.status,
  })));
});

$("exportSalesCsv").addEventListener("click", () => {
  downloadCsv("vendas.csv", state.sales.map((s) => ({
    data: new Date(s.date).toLocaleDateString("pt-BR"),
    comprador: s.buyer,
    produto: findProductName(s.productId),
    codigo_produto: findProductCode(s.productId),
    total: s.total,
  })));
});

$("exportPdf").addEventListener("click", () => window.print());

$("tabs").addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const tabId = target.dataset.tab;
  if (!tabId) return;

  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  target.classList.add("active");
  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.add("hidden"));
  $(`tab-${tabId}`).classList.remove("hidden");
});

function render() {
  enforcePermissionsUI();
  renderProducts();
  renderRentals();
  renderSales();
  renderReports();
  renderAlerts();
  renderStats();
  renderUsers();
  fillProductsSelect();
}

function enforcePermissionsUI() {
  const admin = isAdmin();
  usersAdminPanel.classList.toggle("hidden", !admin);
}

function renderUsers() {
  usersTable.innerHTML = "";
  users.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.username}</td>
      <td>${user.role}</td>
      <td>${new Date(user.createdAt).toLocaleDateString("pt-BR")}</td>
    `;
    usersTable.appendChild(tr);
  });

  const targetSelect = changePasswordForm.elements.targetUser;
  targetSelect.innerHTML = "";
  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.username;
    option.textContent = `${user.username} (${user.role})`;
    targetSelect.appendChild(option);
  });
}

function renderProducts() {
  productsTable.innerHTML = "";

  state.products.forEach((product) => {
    const canDelete = isAdmin();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><button class="link-button" data-open-product="${product.id}">${product.code}</button></td>
      <td>${product.name}</td>
      <td>${product.condition}</td>
      <td>${statusLabel(product.status)}</td>
      <td>${canDelete ? `<button data-remove-product="${product.id}">Excluir</button>` : "Sem permissão"}</td>
    `;
    productsTable.appendChild(tr);
  });

  productsTable.querySelectorAll("[data-remove-product]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!isAdmin()) return alert("Funcionário não pode excluir.");
      const id = button.getAttribute("data-remove-product");
      state.products = state.products.filter((item) => item.id !== id);
      state.rentals = state.rentals.filter((item) => item.productId !== id);
      state.sales = state.sales.filter((item) => item.productId !== id);
      persistAndRender();
    });
  });

  productsTable.querySelectorAll("[data-open-product]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-open-product");
      const product = state.products.find((item) => item.id === id);
      if (product) openProductModal(product);
    });
  });
}

function fillProductsSelect() {
  const rentalSelect = rentalForm.elements.productId;
  const saleSelect = saleForm.elements.productId;
  rentalSelect.innerHTML = "";
  saleSelect.innerHTML = "";

  state.products.filter((product) => product.status === "disponivel").forEach((product) => {
    const txt = `${product.code} - ${product.name}`;
    const op1 = document.createElement("option");
    op1.value = product.id; op1.textContent = txt; rentalSelect.appendChild(op1);
    const op2 = document.createElement("option");
    op2.value = product.id; op2.textContent = txt; saleSelect.appendChild(op2);
  });
}

function renderRentals() {
  rentalsTable.innerHTML = "";
  rentalMonthLabel.textContent = formatMonthYear(ui.selectedRentalMonth);

  state.rentals
    .filter((r) => sameMonth(new Date(`${r.startDate}T00:00:00`), ui.selectedRentalMonth))
    .forEach((rental) => {
      const product = state.products.find((item) => item.id === rental.productId);
      const overdue = isOverdue(rental.endDate) && rental.status === "Ativo";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><button class="link-button" data-open-client="${rental.id}">${rental.name}</button></td>
        <td>${product?.name ?? "Produto removido"}</td>
        <td>${formatDate(rental.startDate)}</td>
        <td>${formatDate(rental.endDate)}</td>
        <td><span class="tag ${overdue ? "late" : "ok"}">${overdue ? "Atrasado" : rental.status}</span></td>
        <td>
          ${rental.status === "Ativo" ? `<button data-renew-rental="${rental.id}">Renovar</button> <button data-edit-rental="${rental.id}">Editar</button> <button data-return-rental="${rental.id}">Devolver</button>` : `<button data-edit-rental="${rental.id}">Editar</button>`}
        </td>
      `;
      rentalsTable.appendChild(tr);
    });

  rentalsTable.querySelectorAll("[data-return-rental]").forEach((button) => button.addEventListener("click", () => {
    const rental = state.rentals.find((item) => item.id === button.getAttribute("data-return-rental"));
    if (!rental || rental.status !== "Ativo") return;
    rental.status = "Devolvido";
    const product = state.products.find((item) => item.id === rental.productId);
    if (product) product.status = "disponivel";
    persistAndRender();
  }));

  rentalsTable.querySelectorAll("[data-renew-rental]").forEach((button) => button.addEventListener("click", () => {
    const rental = state.rentals.find((item) => item.id === button.getAttribute("data-renew-rental"));
    if (!rental || rental.status !== "Ativo") return;
    const newEndDate = prompt("Nova data final (AAAA-MM-DD):", rental.endDate);
    if (!newEndDate) return;
    rental.endDate = newEndDate;
    persistAndRender();
  }));

  rentalsTable.querySelectorAll("[data-edit-rental]").forEach((button) => button.addEventListener("click", () => {
    const rental = state.rentals.find((item) => item.id === button.getAttribute("data-edit-rental"));
    if (!rental) return;
    rental.name = prompt("Nome:", rental.name) || rental.name;
    rental.phone = prompt("Telefone:", rental.phone) || rental.phone;
    rental.address = prompt("Endereço:", rental.address) || rental.address;
    rental.document = prompt("CPF/RG:", rental.document) || rental.document;
    rental.cnpj = prompt("CNPJ (opcional):", rental.cnpj || "") ?? rental.cnpj;
    rental.dailyPrice = Number(prompt("Preço diária:", String(rental.dailyPrice)) || rental.dailyPrice);
    rental.total = Number(prompt("Total:", String(rental.total)) || rental.total);
    persistAndRender();
  }));

  rentalsTable.querySelectorAll("[data-open-client]").forEach((button) => button.addEventListener("click", () => {
    const rental = state.rentals.find((item) => item.id === button.getAttribute("data-open-client"));
    if (rental) openClientModal(rental);
  }));
}

function renderSales() {
  salesTable.innerHTML = "";
  saleMonthLabel.textContent = formatMonthYear(ui.selectedSaleMonth);

  state.sales
    .filter((s) => sameMonth(new Date(s.date), ui.selectedSaleMonth))
    .forEach((sale) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${new Date(sale.date).toLocaleDateString("pt-BR")}</td>
        <td>${sale.buyer}</td>
        <td>${findProductName(sale.productId)}</td>
        <td>${toBRL(sale.total)}</td>
        <td><button data-edit-sale="${sale.id}">Editar</button></td>
      `;
      salesTable.appendChild(tr);
    });

  salesTable.querySelectorAll("[data-edit-sale]").forEach((button) => button.addEventListener("click", () => {
    const sale = state.sales.find((item) => item.id === button.getAttribute("data-edit-sale"));
    if (!sale) return;
    sale.buyer = prompt("Comprador:", sale.buyer) || sale.buyer;
    sale.unitPrice = Number(prompt("Preço:", String(sale.unitPrice)) || sale.unitPrice);
    sale.total = sale.unitPrice;
    persistAndRender();
  }));
}

function renderReports() {
  const month = ui.selectedReportMonth;
  reportMonthLabel.textContent = formatMonthYear(month);

  const rentalsInMonth = state.rentals.filter((r) => sameMonth(new Date(`${r.startDate}T00:00:00`), month));
  const salesInMonth = state.sales.filter((s) => sameMonth(new Date(s.date), month));

  const rentalsTotal = rentalsInMonth.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const salesTotal = salesInMonth.reduce((sum, item) => sum + Number(item.total || 0), 0);

  reportCards.innerHTML = `
    <div class="report-card"><small>Total aluguéis (mês)</small><strong>${toBRL(rentalsTotal)}</strong></div>
    <div class="report-card"><small>Total vendas (mês)</small><strong>${toBRL(salesTotal)}</strong></div>
    <div class="report-card"><small>Qtd. aluguéis (mês)</small><strong>${rentalsInMonth.length}</strong></div>
    <div class="report-card"><small>Qtd. vendas (mês)</small><strong>${salesInMonth.length}</strong></div>
  `;

  reportTable.innerHTML = `
    <tr>
      <td>${formatMonthYear(month)}</td>
      <td>${rentalsInMonth.length}</td>
      <td>${toBRL(rentalsTotal)}</td>
      <td>${salesInMonth.length}</td>
      <td>${toBRL(salesTotal)}</td>
    </tr>
  `;
}

function renderAlerts() {
  alertsList.innerHTML = "";
  const alerts = [];

  state.rentals.forEach((rental) => {
    if (rental.status !== "Ativo") return;
    const dueInDays = diffInDays(rental.endDate);
    if (dueInDays < 0) alerts.push(`Aluguel de ${rental.name} atrasado há ${Math.abs(dueInDays)} dia(s).`);
    else if (dueInDays <= 2) alerts.push(`Aluguel de ${rental.name} vence em ${dueInDays} dia(s).`);
  });

  if (!alerts.length) return (alertsList.innerHTML = '<li class="alert">Sem alertas no momento.</li>');
  alerts.forEach((text) => {
    const li = document.createElement("li");
    li.className = "alert warning";
    li.textContent = text;
    alertsList.appendChild(li);
  });
}

function renderStats() {
  const activeRentals = state.rentals.filter((item) => item.status === "Ativo").length;
  const overdueRentals = state.rentals.filter((item) => item.status === "Ativo" && isOverdue(item.endDate)).length;
  const availableProducts = state.products.filter((item) => item.status === "disponivel").length;

  stats.innerHTML = `
    <div class="stat"><small>Aluguéis ativos</small><strong>${activeRentals}</strong></div>
    <div class="stat"><small>Atrasados</small><strong>${overdueRentals}</strong></div>
    <div class="stat"><small>Produtos disponíveis</small><strong>${availableProducts}</strong></div>
    <div class="stat"><small>Vendas realizadas</small><strong>${state.sales.length}</strong></div>
  `;
}

function openClientModal(rental) {
  modalBody.innerHTML = `
    <p><strong>Nome:</strong> ${rental.name}</p>
    <p><strong>Telefone:</strong> ${rental.phone}</p>
    <p><strong>Endereço:</strong> ${rental.address}</p>
    <p><strong>CPF/RG:</strong> ${rental.document}</p>
    <p><strong>CNPJ:</strong> ${rental.cnpj || "-"}</p>
    <p><strong>Produto:</strong> ${findProductName(rental.productId)}</p>
    <p><strong>Código:</strong> ${findProductCode(rental.productId)}</p>
    <p><strong>Preço da diária:</strong> ${toBRL(rental.dailyPrice)}</p>
    <p><strong>Total:</strong> ${toBRL(rental.total)}</p>
    <p><strong>Data de início:</strong> ${formatDate(rental.startDate)}</p>
    <p><strong>Data final:</strong> ${formatDate(rental.endDate)}</p>
    <p><strong>Status:</strong> ${rental.status}</p>
  `;
  openModal(clientModal);
}

function openProductModal(product) {
  const barcodeId = `barcode-${product.id}`;
  productModalBody.innerHTML = `
    <p><strong>Nome:</strong> ${product.name}</p>
    <p><strong>Código:</strong> ${product.code}</p>
    <p><strong>Estado:</strong> ${product.condition}</p>
    <p><strong>Status:</strong> ${statusLabel(product.status)}</p>
    <svg id="${barcodeId}" class="barcode"></svg>
    <div class="actions-row"><button type="button" id="printBarcodeBtn">Imprimir código + código de barras</button></div>
  `;

  if (typeof JsBarcode === "function") JsBarcode(`#${barcodeId}`, product.code, { format: "CODE128", width: 2, height: 64, displayValue: true });
  $("printBarcodeBtn").addEventListener("click", () => printBarcodeLabel(product));

  openModal(productModal);
}

function printBarcodeLabel(product) {
  const w = window.open("", "_blank", "width=420,height=560");
  if (!w) return;
  const code = escapeHtml(product.code);
  const name = escapeHtml(product.name);
  const cond = escapeHtml(product.condition);
  w.document.write(`
    <html><body style="font-family:Arial;padding:16px">
      <div style="border:1px dashed #666;padding:12px;width:320px">
        <h3 style="margin:0 0 8px">${name}</h3>
        <p><strong>Código:</strong> ${code}</p>
        <p><strong>Estado:</strong> ${cond}</p>
        <svg id="printBarcode"></svg>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
      <script>JsBarcode('#printBarcode','${code}',{format:'CODE128',width:2,height:70,displayValue:true});window.onload=()=>window.print();<\/script>
    </body></html>
  `);
  w.document.close();
}

function openAuthModal() {
  switchAuthMode();
  openModal(authModal);
}

function switchAuthMode() {
  const hasUsers = users.length > 0;
  setupForm.classList.toggle("hidden", hasUsers);
  loginForm.classList.toggle("hidden", !hasUsers);
  authTitle.textContent = hasUsers ? "Entrar no sistema" : "Primeiro acesso: criar admin";
}

function openModal(modal) { modal.classList.remove("hidden"); modal.setAttribute("aria-hidden", "false"); }
function closeModal(modal) { modal.classList.add("hidden"); modal.setAttribute("aria-hidden", "true"); }
function closeAuthModal() { closeModal(authModal); }
function logout() { ui.session = null; appScreen.classList.add("hidden"); welcomeScreen.classList.remove("hidden"); }

function isAdmin() { return ui.session?.role === "admin"; }

function statusLabel(status) {
  if (status === "disponivel") return "Disponível";
  if (status === "alugado") return "Alugado";
  if (status === "vendido") return "Vendido";
  return status;
}

function generateProductCode() {
  const max = state.products.reduce((acc, item) => {
    const match = /MED-(\d+)/.exec(item.code ?? "");
    return Math.max(acc, match ? Number(match[1]) : 0);
  }, 0);
  return `MED-${String(max + 1).padStart(4, "0")}`;
}

function findProductName(productId) { return state.products.find((item) => item.id === productId)?.name ?? "Produto removido"; }
function findProductCode(productId) { return state.products.find((item) => item.id === productId)?.code ?? "SEM-CODIGO"; }
function isOverdue(dateStr) { return diffInDays(dateStr) < 0; }
function diffInDays(dateStr) {
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}
function formatDate(dateStr) { return new Date(`${dateStr}T00:00:00`).toLocaleDateString("pt-BR"); }
function toBRL(value) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0); }
function addMonth(baseDate, amount) { const next = new Date(baseDate); next.setDate(1); next.setMonth(next.getMonth() + amount); return next; }
function sameMonth(dateA, dateB) { return dateA.getMonth() === dateB.getMonth() && dateA.getFullYear() === dateB.getFullYear(); }
function formatMonthYear(date) { return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }); }
function escapeHtml(text) { return String(text).replaceAll("<", "&lt;").replaceAll(">", "&gt;"); }

function downloadCsv(filename, rows) {
  if (!rows.length) return alert("Sem dados para exportar.");
  const headers = Object.keys(rows[0]);
  const csvLines = [headers.join(",")];
  rows.forEach((row) => {
    const line = headers.map((key) => String(row[key]).replaceAll('"', '""')).map((value) => `"${value}"`).join(",");
    csvLines.push(line);
  });
  const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function loadState() {
  const fromStorage = localStorage.getItem(STORAGE_KEY);
  if (!fromStorage) return initialData;

  try {
    const parsed = JSON.parse(fromStorage);
    return {
      products: parsed.products ?? [],
      rentals: parsed.rentals ?? [],
      sales: parsed.sales ?? [],
    };
  } catch {
    return initialData;
  }
}

function loadUsers() {
  const fromStorage = localStorage.getItem(USERS_KEY);
  if (!fromStorage) return [];
  try {
    const parsed = JSON.parse(fromStorage);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function persistUsers() {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

render();
