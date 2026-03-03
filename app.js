const STORAGE_KEY = "bem_estar_med_data";

const USERS = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "funcionario", password: "func123", role: "funcionario" },
];

const initialData = {
  products: [
    { id: crypto.randomUUID(), code: "MED-0001", name: "Cama hospitalar", category: "Locação", condition: "Bom", status: "disponivel" },
    { id: crypto.randomUUID(), code: "MED-0002", name: "Cadeira de rodas", category: "Locação", condition: "Bom", status: "disponivel" },
  ],
  rentals: [],
  sales: [],
};

const state = loadState();
const ui = {
  selectedRentalMonth: new Date(),
  selectedSaleMonth: new Date(),
  selectedReportMonth: new Date(),
  session: null,
};

const welcomeScreen = document.getElementById("welcomeScreen");
const appScreen = document.getElementById("appScreen");
const sessionInfo = document.getElementById("sessionInfo");

const openLoginBtn = document.getElementById("openLoginBtn");
const closeLoginBtn = document.getElementById("closeLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginForm = document.getElementById("loginForm");
const loginModal = document.getElementById("loginModal");

const productForm = document.getElementById("productForm");
const rentalForm = document.getElementById("rentalForm");
const saleForm = document.getElementById("saleForm");

const productsTable = document.getElementById("productsTable");
const rentalsTable = document.getElementById("rentalsTable");
const salesTable = document.getElementById("salesTable");
const reportCards = document.getElementById("reportCards");
const reportTable = document.getElementById("reportTable");
const alertsList = document.getElementById("alertsList");
const stats = document.getElementById("stats");

const rentalMonthLabel = document.getElementById("rentalMonthLabel");
const saleMonthLabel = document.getElementById("saleMonthLabel");
const reportMonthLabel = document.getElementById("reportMonthLabel");

const rentalPrevMonth = document.getElementById("rentalPrevMonth");
const rentalNextMonth = document.getElementById("rentalNextMonth");
const salePrevMonth = document.getElementById("salePrevMonth");
const saleNextMonth = document.getElementById("saleNextMonth");
const reportPrevMonth = document.getElementById("reportPrevMonth");
const reportNextMonth = document.getElementById("reportNextMonth");

const clientModal = document.getElementById("clientModal");
const modalBody = document.getElementById("modalBody");
const closeModalBtn = document.getElementById("closeModalBtn");

const productModal = document.getElementById("productModal");
const productModalBody = document.getElementById("productModalBody");
const closeProductModalBtn = document.getElementById("closeProductModalBtn");

openLoginBtn.addEventListener("click", openLoginModal);
closeLoginBtn.addEventListener("click", closeLoginModal);
logoutBtn.addEventListener("click", logout);

loginModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeLogin === "true") closeLoginModal();
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const username = formData.get("username").toString().trim();
  const password = formData.get("password").toString().trim();
  const role = formData.get("role").toString();

  const user = USERS.find((item) => item.username === username && item.password === password && item.role === role);
  if (!user) return alert("Credenciais inválidas.");

  ui.session = { username: user.username, role: user.role };
  sessionInfo.textContent = `Logado como ${user.username} (${user.role})`;
  closeLoginModal();
  welcomeScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  render();
});

productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(productForm);

  state.products.push({
    id: crypto.randomUUID(),
    code: generateProductCode(),
    name: formData.get("name").toString().trim(),
    category: formData.get("category").toString().trim(),
    condition: formData.get("condition").toString(),
    status: "disponivel",
  });

  productForm.reset();
  persistAndRender();
});

rentalForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(rentalForm);
  const product = state.products.find((item) => item.id === formData.get("productId"));

  if (!product || product.status !== "disponivel") return alert("Produto indisponível para aluguel.");

  const startDate = formData.get("startDate").toString();
  const endDate = formData.get("endDate").toString();
  if (new Date(`${endDate}T00:00:00`) < new Date(`${startDate}T00:00:00`)) return alert("Data final inválida.");

  product.status = "alugado";
  state.rentals.push({
    id: crypto.randomUUID(),
    name: formData.get("name").toString().trim(),
    phone: formData.get("phone").toString().trim(),
    address: formData.get("address").toString().trim(),
    document: formData.get("document").toString().trim(),
    cnpj: formData.get("cnpj").toString().trim(),
    productId: product.id,
    dailyPrice: Number(formData.get("dailyPrice")),
    total: Number(formData.get("total")),
    startDate,
    endDate,
    status: "Ativo",
  });

  rentalForm.reset();
  persistAndRender();
});

saleForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(saleForm);
  const product = state.products.find((item) => item.id === formData.get("productId"));
  if (!product || product.status !== "disponivel") return alert("Produto indisponível para venda.");

  product.status = "vendido";
  state.sales.push({
    id: crypto.randomUUID(),
    buyer: formData.get("buyer").toString().trim(),
    productId: product.id,
    unitPrice: Number(formData.get("unitPrice")),
    total: Number(formData.get("unitPrice")),
    date: new Date().toISOString(),
  });

  saleForm.reset();
  persistAndRender();
});

closeModalBtn.addEventListener("click", closeModal);
clientModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeModal === "true") closeModal();
});

closeProductModalBtn.addEventListener("click", closeProductModal);
productModal.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeProduct === "true") closeProductModal();
});

rentalPrevMonth.addEventListener("click", () => {
  ui.selectedRentalMonth = addMonth(ui.selectedRentalMonth, -1);
  renderRentals();
});
rentalNextMonth.addEventListener("click", () => {
  ui.selectedRentalMonth = addMonth(ui.selectedRentalMonth, 1);
  renderRentals();
});
salePrevMonth.addEventListener("click", () => {
  ui.selectedSaleMonth = addMonth(ui.selectedSaleMonth, -1);
  renderSales();
});
saleNextMonth.addEventListener("click", () => {
  ui.selectedSaleMonth = addMonth(ui.selectedSaleMonth, 1);
  renderSales();
});
reportPrevMonth.addEventListener("click", () => {
  ui.selectedReportMonth = addMonth(ui.selectedReportMonth, -1);
  renderReports();
});
reportNextMonth.addEventListener("click", () => {
  ui.selectedReportMonth = addMonth(ui.selectedReportMonth, 1);
  renderReports();
});

document.getElementById("exportRentalsCsv").addEventListener("click", () => {
  const rows = state.rentals.map((r) => ({
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
  }));
  downloadCsv("alugueis.csv", rows);
});

document.getElementById("exportSalesCsv").addEventListener("click", () => {
  const rows = state.sales.map((s) => ({
    data: new Date(s.date).toLocaleDateString("pt-BR"),
    comprador: s.buyer,
    produto: findProductName(s.productId),
    codigo_produto: findProductCode(s.productId),
    total: s.total,
  }));
  downloadCsv("vendas.csv", rows);
});

document.getElementById("exportPdf").addEventListener("click", () => window.print());

document.getElementById("tabs").addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  const tabId = target.dataset.tab;
  if (!tabId) return;

  document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
  target.classList.add("active");

  document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.add("hidden"));
  document.getElementById(`tab-${tabId}`).classList.remove("hidden");
});

function loadState() {
  const fromStorage = localStorage.getItem(STORAGE_KEY);
  if (!fromStorage) return initialData;

  try {
    const parsed = JSON.parse(fromStorage);
    const products = (parsed.products ?? []).map((product, index) => {
      const availableNum = Number(product.available ?? 0);
      return {
        ...product,
        code: product.code ?? `MED-${String(index + 1).padStart(4, "0")}`,
        condition: product.condition ?? "Bom",
        status: product.status ?? (availableNum > 0 ? "disponivel" : "vendido"),
      };
    });

    return {
      products,
      rentals: parsed.rentals ?? [],
      sales: parsed.sales ?? [],
    };
  } catch {
    return initialData;
  }
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function render() {
  renderProducts();
  renderRentals();
  renderSales();
  renderReports();
  renderAlerts();
  renderStats();
  fillProductsSelect();
}

function renderProducts() {
  productsTable.innerHTML = "";

  state.products.forEach((product) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><button class="link-button" data-open-product="${product.id}">${product.code}</button></td>
      <td>${product.name}</td>
      <td>${product.condition}</td>
      <td>${statusLabel(product.status)}</td>
      <td><button data-remove-product="${product.id}">Excluir</button></td>
    `;
    productsTable.appendChild(tr);
  });

  productsTable.querySelectorAll("[data-remove-product]").forEach((button) => {
    button.addEventListener("click", () => {
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

  state.products
    .filter((product) => product.status === "disponivel")
    .forEach((product) => {
      const optionText = `${product.code} - ${product.name}`;
      const rentalOption = document.createElement("option");
      rentalOption.value = product.id;
      rentalOption.textContent = optionText;
      rentalSelect.appendChild(rentalOption);

      const saleOption = document.createElement("option");
      saleOption.value = product.id;
      saleOption.textContent = optionText;
      saleSelect.appendChild(saleOption);
    });
}

function renderRentals() {
  rentalsTable.innerHTML = "";
  rentalMonthLabel.textContent = formatMonthYear(ui.selectedRentalMonth);

  const rentalsByMonth = state.rentals.filter((rental) => sameMonth(new Date(`${rental.startDate}T00:00:00`), ui.selectedRentalMonth));

  rentalsByMonth.forEach((rental) => {
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

  const salesByMonth = state.sales.filter((sale) => sameMonth(new Date(sale.date), ui.selectedSaleMonth));
  salesByMonth.forEach((sale) => {
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

  const rentalsInMonth = state.rentals.filter((item) => sameMonth(new Date(`${item.startDate}T00:00:00`), month));
  const salesInMonth = state.sales.filter((item) => sameMonth(new Date(item.date), month));

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
  clientModal.classList.remove("hidden");
  clientModal.setAttribute("aria-hidden", "false");
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

  if (typeof JsBarcode === "function") {
    JsBarcode(`#${barcodeId}`, product.code, { format: "CODE128", width: 2, height: 64, displayValue: true });
  }
  document.getElementById("printBarcodeBtn").addEventListener("click", () => printBarcodeLabel(product));

  productModal.classList.remove("hidden");
  productModal.setAttribute("aria-hidden", "false");
}

function printBarcodeLabel(product) {
  const w = window.open("", "_blank", "width=420,height=560");
  if (!w) return;
  const code = product.code.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const name = product.name.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const cond = product.condition.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
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

function closeModal() { clientModal.classList.add("hidden"); }
function closeProductModal() { productModal.classList.add("hidden"); }
function openLoginModal() { loginModal.classList.remove("hidden"); }
function closeLoginModal() { loginModal.classList.add("hidden"); }
function logout() { ui.session = null; appScreen.classList.add("hidden"); welcomeScreen.classList.remove("hidden"); }

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

render();
