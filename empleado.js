(() => {
  const API_BASE = "https://77b0a5bce428.ngrok-free.app";
  const REQ_ENDPOINT = API_BASE + "/api/Access"; // POST para pedir acceso
  const STATUS_ENDPOINT = API_BASE + "/api/Access/status"; // GET para consultar estado

  const dniInput = document.getElementById("dni");
  const btnRequest = document.getElementById("btn-request");
  const btnClear = document.getElementById("btn-clear");
  const empleadoMsg = document.getElementById("empleado-msg");

  let pollTimer = null; // <-- para guardar el intervalo

  function showMessage(targetEl, text, ok = true) {
    targetEl.innerHTML = `<div class="${ok ? "ok" : "err"}">${text}</div>`;
  }

  // Función para consultar el estado de la solicitud por DNI
  async function checkStatus(dni) {
    try {
      const res = await fetch(
        `${STATUS_ENDPOINT}?dni=${encodeURIComponent(dni)}`,
        {
          method: "GET",
          headers: {
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      const text = await res.text();
      console.log("Respuesta del servidor (estado):", text);

      if (!res.ok) {
        showMessage(empleadoMsg, "Error al consultar estado: " + text, false);
        return;
      }

      const data = JSON.parse(text);
      if (data && data.status) {
        let mensaje =
          data.status === "Pending"
            ? "Pendiente..."
            : data.status === "Approved"
            ? "✅ Aprobado, espera un momento."
            : "❌ Acceso denegado.";

        showMessage(empleadoMsg, `Estado de tu solicitud: ${mensaje}`);

        // si ya no está "Pending", paramos el polling
        if (data.status !== "Pending") {
          stopPolling();
        }
      } else {
        showMessage(empleadoMsg, "No se encontró ninguna solicitud", false);
      }
    } catch (err) {
      showMessage(empleadoMsg, "Error de conexión: " + err.message, false);
    }
  }

  function startPolling(dni) {
    stopPolling(); // por si ya había uno
    pollTimer = setInterval(() => checkStatus(dni), 5000); // cada 5 segundos
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
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
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(dni),
      });

      const text = await res.text();
      console.log("Respuesta del servidor (POST):", text);

      if (!res.ok) {
        showMessage(empleadoMsg, "Error: " + text, false);
      } else {
        const data = JSON.parse(text);
        showMessage(
          empleadoMsg,
          `Solicitud enviada: ${data?.empleado || "OK"}`
        );
        dniInput.value = "";

        // iniciar polling para que se actualice automáticamente
        startPolling(dni);
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
    stopPolling();
    empleadoMsg.innerHTML = "";
  });
})();
