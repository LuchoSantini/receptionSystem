const API_BASE = "https://localhost:7030"; // mismo host de la API

// Empleado: enviar solicitud de acceso
async function requestAccess(dni) {
  try {
    const res = await fetch("/api/Access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dni),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    document.getElementById(
      "empleado-msg"
    ).textContent = `Solicitud enviada: ${data.empleado}`;
    document.getElementById("dni").value = "";
  } catch (e) {
    document.getElementById("empleado-msg").textContent = "Error: " + e.message;
  }
}

// Recepción: cargar solicitudes pendientes
async function loadPending() {
  const pendingEl = document.getElementById("pending-list");
  pendingEl.textContent = "Cargando...";
  try {
    const res = await fetch("/api/Access/pending");
    const items = await res.json();
    if (!items.length) {
      pendingEl.textContent = "No hay solicitudes pendientes";
      return;
    }
    pendingEl.innerHTML = "";
    items.forEach((it) => {
      const div = document.createElement("div");
      div.className = "item";
      div.innerHTML = `<strong>${it.FullName}</strong> DNI: ${it.DNI} <button onclick="approve(${it.Id})">Aprobar</button>`;
      pendingEl.appendChild(div);
    });
  } catch (e) {
    pendingEl.textContent = "Error: " + e.message;
  }
}

// Aprobar acceso
async function approve(id) {
  try {
    await fetch(`/api/Access/approve/${id}`, { method: "POST" });
    loadPending();
  } catch (e) {
    alert("Error: " + e.message);
  }
}
