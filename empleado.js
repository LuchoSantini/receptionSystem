(() => {
  const API_BASE = "https://6c420e388759.ngrok-free.app";
  const REQ_ENDPOINT = API_BASE + "/api/Access";

  const dniInput = document.getElementById("dni");
  const btnRequest = document.getElementById("btn-request");
  const btnClear = document.getElementById("btn-clear");
  const empleadoMsg = document.getElementById("empleado-msg");

  function showMessage(targetEl, text, ok = true) {
    targetEl.innerHTML = `<div class="${ok ? "ok" : "err"}">${text}</div>`;
    setTimeout(() => {
      if (targetEl.innerHTML) targetEl.innerHTML = "";
    }, 5000);
  }

  btnRequest.addEventListener("click", async () => {
    const dni = (dniInput.value || "").trim();
    if (!dni) {
      showMessage(empleadoMsg, "Ingresá tu DNI", false);
      return;
    }

    btnRequest.disabled = true;
    btnRequest.textContent = "Enviando...";

    try {
      const res = await fetch(REQ_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dni),
      });

      if (!res.ok) {
        const text = await res.text();
        showMessage(empleadoMsg, "Error: " + (text || res.statusText), false);
      } else {
        const data = await res.json();
        showMessage(
          empleadoMsg,
          "Solicitud enviada: " + (data?.empleado || "OK")
        );
        dniInput.value = "";
      }
    } catch (err) {
      showMessage(empleadoMsg, "Error de conexión: " + err.message, false);
    } finally {
      btnRequest.disabled = false;
      btnRequest.textContent = "Pedir acceso";
    }
  });

  btnClear.addEventListener("click", () => {
    dniInput.value = "";
  });
})();
