const formularioLogin = document.getElementById("formulario-login");
const mensajeLogin = document.getElementById("mensaje-login");

const botonLogin = formularioLogin.querySelector(
  'button[type="submit"]'
);

let procesandoLogin = false;

function mostrarMensajeLogin(texto, tipo = "informacion") {
  const colores = {
    informacion: "#155e75",
    correcto: "#1b5e20",
    error: "#b3261e"
  };

  mensajeLogin.textContent = texto;
  mensajeLogin.style.color = colores[tipo] || colores.informacion;
}

async function cerrarSesionLocal() {
  const { error } = await supabaseClient.auth.signOut({
    scope: "local"
  });

  if (error) {
    console.warn("Advertencia al cerrar sesión:", error);
  }
}

formularioLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (procesandoLogin) {
    return;
  }

  const correo = document.getElementById("correo").value.trim();
  const contrasena = document.getElementById("contrasena").value;

  if (!correo || !contrasena) {
    mostrarMensajeLogin(
      "Escribe tu correo electrónico y tu contraseña.",
      "error"
    );
    return;
  }

  procesandoLogin = true;
  botonLogin.disabled = true;
  botonLogin.textContent = "Verificando...";
  formularioLogin.setAttribute("aria-busy", "true");

  let sesionIniciada = false;
  let accesoAutorizado = false;

  try {
    mostrarMensajeLogin("Verificando credenciales...");

    // 1. Validar correo y contraseña.
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: correo,
        password: contrasena
      });

    if (error) {
      console.warn("Acceso rechazado por Supabase Auth:", error);

      mostrarMensajeLogin(
        "No se pudo iniciar sesión. Verifica el correo y la " +
        "contraseña. Si tu cuenta es nueva, revisa también " +
        "si debes confirmar el correo.",
        "error"
      );

      return;
    }

    sesionIniciada = Boolean(data.session);

    if (!data.user || !data.session) {
      mostrarMensajeLogin(
        "No se pudo establecer una sesión válida. " +
        "Inténtalo nuevamente.",
        "error"
      );
      return;
    }

    // 2. Consultar el perfil de la cuenta autenticada.
    mostrarMensajeLogin("Comprobando permisos de acceso...");

    const {
      data: perfil,
      error: errorPerfil
    } = await supabaseClient
      .from("perfiles")
      .select("id, nombre_completo, rol, activo")
      .eq("id", data.user.id)
      .maybeSingle();

    if (errorPerfil) {
      console.error("Error al consultar el perfil:", errorPerfil);

      mostrarMensajeLogin(
        "No fue posible verificar tus permisos. " +
        "Inténtalo más tarde o consulta al administrador.",
        "error"
      );

      return;
    }

    if (!perfil) {
      mostrarMensajeLogin(
        "Tu cuenta no tiene un perfil institucional disponible. " +
        "Comunícate con el administrador.",
        "error"
      );

      return;
    }

    // 3. Las cuentas pendientes no acceden al panel.
    if (perfil.rol === "pendiente") {
      mostrarMensajeLogin(
        "Tu cuenta está registrada, pero todavía está pendiente " +
        "de aprobación. Un administrador debe revisarla " +
        "y asignarte un rol.",
        "informacion"
      );

      return;
    }

    // 4. Las cuentas inactivas tampoco acceden.
    if (perfil.activo !== true) {
      mostrarMensajeLogin(
        "Tu acceso administrativo no está habilitado. " +
        "Comunícate con el administrador.",
        "error"
      );

      return;
    }

    // 5. Aceptar únicamente los roles autorizados.
    const rolesPermitidos = ["administrador", "editor"];

    if (!rolesPermitidos.includes(perfil.rol)) {
      mostrarMensajeLogin(
        "Tu cuenta no tiene un rol autorizado para acceder al panel.",
        "error"
      );

      return;
    }

    // 6. Autorizar la navegación.
    accesoAutorizado = true;

    mostrarMensajeLogin(
      "Acceso correcto. Abriendo panel...",
      "correcto"
    );

    window.location.replace("panel.html");

  } catch (error) {
    console.error("Error durante el inicio de sesión:", error);

    mostrarMensajeLogin(
      "Ocurrió un problema al iniciar sesión. " +
      "Revisa tu conexión e inténtalo nuevamente.",
      "error"
    );

  } finally {
    // Si Auth inició sesión, pero el perfil no fue autorizado,
    // cerrar la sesión de este navegador.
    if (sesionIniciada && !accesoAutorizado) {
      try {
        await cerrarSesionLocal();
      } catch (errorCierre) {
        console.error(
          "No se pudo completar el cierre de sesión:",
          errorCierre
        );
      }
    }

    procesandoLogin = false;
    formularioLogin.removeAttribute("aria-busy");

    if (!accesoAutorizado) {
      botonLogin.disabled = false;
      botonLogin.textContent = "Iniciar sesión";
    }
  }
});