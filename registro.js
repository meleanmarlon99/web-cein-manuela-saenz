const formularioRegistro = document.getElementById("formulario-registro");
const mensajeRegistro = document.getElementById("mensaje-registro");
const botonRegistro = formularioRegistro.querySelector('button[type="submit"]');

let procesandoRegistro = false;

function informarRegistro(texto, error = false) {
  mensajeRegistro.textContent = texto;
  mensajeRegistro.style.color = error ? "#b3261e" : "#155e75";
}

formularioRegistro.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (procesandoRegistro) return;

  const nombre = document.getElementById("nombre-registro").value.trim();
  const correo = document.getElementById("correo-registro").value.trim();
  const clave = document.getElementById("clave-registro").value;
  const confirmacion = document.getElementById("confirmar-clave").value;

  if (nombre.length < 3) {
    informarRegistro("Escriba su nombre completo.", true);
    return;
  }

  if (clave.length < 12) {
    informarRegistro("La contraseña debe tener al menos 12 caracteres.", true);
    return;
  }

  if (clave !== confirmacion) {
    informarRegistro("Las contraseñas no coinciden.", true);
    return;
  }

  procesandoRegistro = true;
  botonRegistro.disabled = true;
  botonRegistro.textContent = "Procesando...";

  let completado = false;

  try {
    const { data: datosSesion, error: errorSesion } =
      await supabaseClient.auth.getSession();

    if (errorSesion) throw errorSesion;

    if (datosSesion.session) {
      informarRegistro(
        "Hay una sesión abierta. Cierre sesión desde el panel " +
        "o utilice una ventana privada para registrar otra cuenta.",
        true
      );
      return;
    }

    informarRegistro("Enviando solicitud...");

    const urlLogin = new URL("login.html", window.location.href).href;

    const { data, error } = await supabaseClient.auth.signUp({
      email: correo,
      password: clave,
      options: {
        emailRedirectTo: urlLogin,
        data: {
          nombre_completo: nombre
        }
      }
    });

    if (error) throw error;


    if (data.session) {
      const { error: errorCierre } =
        await supabaseClient.auth.signOut({ scope: "local" });

      if (errorCierre) throw errorCierre;
    }

    completado = true;
    formularioRegistro.reset();

    informarRegistro(
      "Solicitud procesada. Si corresponde, recibirá un correo " +
      "para confirmar su dirección. Revise también correo no deseado. " +
      "Las cuentas nuevas requieren aprobación administrativa. " +
      "Si ya tenía una cuenta, utilice Iniciar sesión."
    );

  } catch (error) {
    console.error("Error de registro:", error);

    informarRegistro(
      "No se pudo confirmar el registro. Revise su correo antes " +
      "de volver a intentarlo. Si no recibió instrucciones, " +
      "consulte al administrador.",
      true
    );

  } finally {
    procesandoRegistro = false;
    botonRegistro.disabled = completado;
    botonRegistro.textContent = completado
      ? "Solicitud procesada"
      : "Crear cuenta";
  }
});