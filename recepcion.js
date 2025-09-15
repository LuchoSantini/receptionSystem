(() => {
  const API_BASE = "https://df2eb04c544d.ngrok-free.app";
  const PENDING_ENDPOINT = API_BASE + "/api/Access/pending";
  const APPROVE_ENDPOINT = (id) => API_BASE + "/api/Access/approve/" + id;
  const DENY_ENDPOINT = (id) => API_BASE + "/api/Access/deny/" + id;

  const pendingListEl = document.getElementById("pending-list");
  const btnRefresh = document.getElementById("btn-refresh");

  // Sonido de notificación
  const notificationSound = new Audio("sonido.mp3");

  let lastPendingIds = new Set(); // track para detectar nuevas solicitudes

  let pollIntervalSec = 5;
  document.getElementById("poll-interval").textContent = pollIntervalSec + "s";
  let pollTimer = null;

  async function loadPending() {
    try {
      const res = await fetch(PENDING_ENDPOINT);
      if (!res.ok) {
        pendingListEl.innerHTML = `<div class="err">Error: ${res.statusText}</div>`;
        return;
      }
      const items = await res.json();
      renderPending(items);
    } catch (err) {
      pendingListEl.innerHTML = `<div class="err">Error de conexión: ${err.message}</div>`;
    }
  }

  function renderPending(items) {
    if (!items || items.length === 0) {
      pendingListEl.innerHTML =
        '<div class="small">No hay solicitudes pendientes.</div>';
      lastPendingIds.clear();
      return;
    }

    // Detectar nuevas solicitudes
    const currentIds = new Set(items.map((it) => it.Id || it.id));
    let isNew = false;
    for (let id of currentIds) {
      if (!lastPendingIds.has(id)) {
        isNew = true;
        break;
      }
    }
    if (isNew) {
      notificationSound
        .play()
        .catch((err) => console.log("Error al reproducir sonido:", err));
    }
    lastPendingIds = currentIds;

    // Renderizar lista
    const ul = document.createElement("ul");
    ul.className = "list";
    items.forEach((it) => {
      const li = document.createElement("li");
      li.className = "item";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${escapeHtml(
        it.FullName || it.fullName || ""
      )}</strong>
        <div class="meta">DNI: ${escapeHtml(
          it.DNI || it.dni || ""
        )} — ${new Date(
        it.RequestedAt || it.requestedAt
      ).toLocaleString()}</div>`;

      const right = document.createElement("div");

      // Botón aprobar
      const btnApprove = document.createElement("button");
      btnApprove.textContent = "Aprobar";
      btnApprove.addEventListener("click", () => approve(it.Id || it.id));
      right.appendChild(btnApprove);

      // Botón denegar
      const btnDeny = document.createElement("button");
      btnDeny.textContent = "Denegar";
      btnDeny.style.marginLeft = "6px";
      btnDeny.style.background = "#b91c1c"; // rojo
      btnDeny.style.color = "white";
      btnDeny.addEventListener("click", () => deny(it.Id || it.id));
      right.appendChild(btnDeny);

      li.appendChild(left);
      li.appendChild(right);
      ul.appendChild(li);
    });
    pendingListEl.innerHTML = "";
    pendingListEl.appendChild(ul);
  }

  async function approve(id) {
    if (!confirm("Aprobar acceso?")) return;
    try {
      const res = await fetch(APPROVE_ENDPOINT(id), { method: "POST" });
      if (!res.ok) {
        const t = await res.text();
        alert("Error al aprobar: " + (t || res.statusText));
        return;
      }
      alert("Acceso aprobado");
      await loadPending();
    } catch (err) {
      alert("Error de conexión: " + err.message);
    }
  }

  // Nueva función para denegar
  async function deny(id) {
    if (!confirm("Denegar acceso?")) return;
    try {
      const res = await fetch(DENY_ENDPOINT(id), { method: "POST" });
      if (!res.ok) {
        const t = await res.text();
        alert("Error al denegar: " + (t || res.statusText));
        return;
      }
      alert("Acceso denegado");
      await loadPending();
    } catch (err) {
      alert("Error de conexión: " + err.message);
    }
  }

  btnRefresh.addEventListener("click", loadPending);

  function startPolling() {
    stopPolling();
    pollTimer = setInterval(loadPending, pollIntervalSec * 1000);
    loadPending();
  }
  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }
  startPolling();

  function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
