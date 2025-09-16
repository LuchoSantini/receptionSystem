(() => {
  const API_BASE = "https://recepcion-consultar.somee.com";
  const PENDING_ENDPOINT = API_BASE + "/api/Access/pending";
  const APPROVE_ENDPOINT = (id) => API_BASE + "/api/Access/approve/" + id;
  const DENY_ENDPOINT = (id) => API_BASE + "/api/Access/deny/" + id;

  const pendingListEl = document.getElementById("pending-list");
  const btnRefresh = document.getElementById("btn-refresh");
  const notificationSound = new Audio("sonido.mp3");
  let lastPendingIds = new Set();
  let pollIntervalSec = 5;
  document.getElementById("poll-interval").textContent = pollIntervalSec + "s";
  let pollTimer = null;

  async function loadPending() {
    console.log("🔄 Cargando solicitudes pendientes...");
    try {
      const res = await fetch(PENDING_ENDPOINT, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
          "ngrok-skip-browser-warning": "true", // <-- agregado
        },
      });

      console.log("🟢 Status:", res.status, res.statusText);

      const text = await res.text();
      console.log("📥 Respuesta del servidor (texto):", text);

      try {
        const items = JSON.parse(text);
        console.log("✅ JSON parseado:", items);
        renderPending(items);
      } catch (parseErr) {
        console.error("❌ Error al parsear JSON:", parseErr);
        pendingListEl.innerHTML = `<div class="err">Servidor no respondió JSON válido</div>`;
      }
    } catch (err) {
      console.error("❌ Error de conexión:", err);
      pendingListEl.innerHTML = `<div class="err">Error de conexión: ${err.message}</div>`;
    }
  }

  function renderPending(items) {
    console.log("🖌 Renderizando solicitudes:", items);

    if (!items || items.length === 0) {
      pendingListEl.innerHTML =
        '<div class="small">No hay solicitudes pendientes.</div>';
      lastPendingIds.clear();
      return;
    }

    const currentIds = new Set(items.map((it) => it.id));
    let isNew = false;
    for (let id of currentIds) {
      if (!lastPendingIds.has(id)) {
        isNew = true;
        break;
      }
    }
    if (isNew) {
      console.log("🔔 Nueva solicitud detectada, reproduciendo sonido");
      notificationSound
        .play()
        .catch((err) => console.log("Error al reproducir sonido:", err));
    }
    lastPendingIds = currentIds;

    const ul = document.createElement("ul");
    ul.className = "list";
    items.forEach((it) => {
      const li = document.createElement("li");
      li.className = "item";

      const left = document.createElement("div");
      left.innerHTML = `<strong>${escapeHtml(it.fullName)}</strong>
        <div class="meta">DNI: ${escapeHtml(it.dni)} — ${new Date(
        it.requestedAt
      ).toLocaleString()}</div>`;

      const right = document.createElement("div");

      const btnApprove = document.createElement("button");
      btnApprove.textContent = "Aprobar";
      btnApprove.addEventListener("click", () => approve(it.id));
      right.appendChild(btnApprove);

      const btnDeny = document.createElement("button");
      btnDeny.textContent = "Denegar";
      btnDeny.style.marginLeft = "6px";
      btnDeny.style.background = "#b91c1c";
      btnDeny.style.color = "white";
      btnDeny.addEventListener("click", () => deny(it.id));
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
    console.log("✅ Aprobando solicitud ID:", id);

    try {
      const res = await fetch(APPROVE_ENDPOINT(id), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
          "ngrok-skip-browser-warning": "true", // <-- agregado
        },
      });

      console.log("🟢 Status aprobación:", res.status, res.statusText);

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Error al aprobar:", text || res.statusText);
        alert("Error al aprobar: " + (text || res.statusText));
        return;
      }

      const data = await res.json();
      console.log("✅ Aprobación exitosa:", data);
      // alert(data?.message || "Acceso aprobado");
      await loadPending();
    } catch (err) {
      console.error("❌ Error de conexión al aprobar:", err);
      alert("Error de conexión: " + err.message);
    }
  }

  async function deny(id) {
    if (!confirm("Denegar acceso?")) return;
    console.log("⛔ Denegando solicitud ID:", id);

    try {
      const res = await fetch(DENY_ENDPOINT(id), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
          "ngrok-skip-browser-warning": "true", // <-- agregado
        },
      });

      console.log("🟢 Status denegación:", res.status, res.statusText);

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Error al denegar:", text || res.statusText);
        alert("Error al denegar: " + (text || res.statusText));
        return;
      }

      const data = await res.json();
      console.log("✅ Denegación exitosa:", data);
      alert(data?.message || "Acceso denegado");
      await loadPending();
    } catch (err) {
      console.error("❌ Error de conexión al denegar:", err);
      alert("Error de conexión: " + err.message);
    }
  }

  btnRefresh.addEventListener("click", loadPending);

  function startPolling() {
    stopPolling();
    console.log("▶ Iniciando polling cada", pollIntervalSec, "segundos");
    pollTimer = setInterval(loadPending, pollIntervalSec * 1000);
    loadPending();
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
    console.log("⏹ Polling detenido");
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
