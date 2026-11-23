const formularioRecuperar =
  document.getElementById("formulario-recuperar");

const mensajeRecuperar =
  document.getElementById("mensaje-recuperar");

const botonRecuperar =
  formularioRecuperar.querySelector('button[type="submit"]');

let enviandoRecuperacion = false;

formularioRecuperar.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (enviandoRecuperacion) return;

  enviandoRecuperacion = true;
  botonRecuperar.disabled = true;
  botonRecuperar.textContent = "Enviando...";

  mensajeRecuperar.style.color = "#155e75";
  mensajeRecuperar.textContent = "Procesando solicitud...";

  let solicitudProcesada = false;

  try {
    const correo = document
      .getElementById("correo-recuperar")
      .value.trim();

    const destino = new URL(
      "restablecer-contrasena.html",
      window.location.href
    ).href;

    const { error } =
      await supabaseClient.auth.resetPasswordForEmail(correo, {
        redirectTo: destino
      });

    if (error) throw error;

    solicitudProcesada = true;
    formularioRecuperar.reset();

    mensajeRecuperar.textContent =
      "Si corresponde, recibirá un correo con instrucciones. " +
      "Revise también correo no deseado. " +
      "Utilice el enlace más reciente.";

  } catch (error) {
    console.error(
      "No se pudo solicitar recuperación:",
      error.code || error.name
    );

    mensajeRecuperar.style.color = "#b3261e";
    mensajeRecuperar.textContent =
      "No se pudo procesar la solicitud. " +
      "Espere antes de intentarlo nuevamente. " +
      "Si continúa, consulte al administrador.";

  } finally {
    enviandoRecuperacion = false;
    botonRecuperar.disabled = solicitudProcesada;
    botonRecuperar.textContent = solicitudProcesada
      ? "Solicitud procesada"
      : "Enviar enlace de recuperación";
  }
});