const formularioRestablecer =
  document.getElementById("formulario-restablecer");

const mensajeRestablecer =
  document.getElementById("mensaje-restablecer");

const botonRestablecer =
  formularioRestablecer.querySelector('button[type="submit"]');

let guardandoClave = false;
let claveActualizada = false;

function informarClave(texto, error = false) {
  mensajeRestablecer.textContent = texto;
  mensajeRestablecer.style.color = error ? "#b3261e" : "#155e75";
}

async function verificarAccesoClave() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
      informarClave(
        "No hay un acceso válido. Abra el enlace más reciente " +
        "recibido por correo o solicite uno nuevo.",
        true
      );
      return;
    }

    formularioRestablecer.hidden = false;
    informarClave("Escriba y confirme su nueva contraseña.");

  } catch (error) {
    informarClave(
      "No se pudo verificar el acceso. " +
      "Revise su conexión o solicite otro enlace.",
      true
    );
  }
}

formularioRestablecer.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  if (guardandoClave || claveActualizada) return;

  const clave = document.getElementById("nueva-clave").value;
  const confirmacion =
    document.getElementById("confirmar-nueva-clave").value;

  if (clave.length < 12) {
    informarClave("Utilice al menos 12 caracteres.", true);
    return;
  }

  if (clave !== confirmacion) {
    informarClave("Las contraseñas no coinciden.", true);
    return;
  }

  guardandoClave = true;
  botonRestablecer.disabled = true;
  botonRestablecer.textContent = "Guardando...";

  try {
    const { error } = await supabaseClient.auth.updateUser({
      password: clave
    });

    if (error) {
      console.error(
        "Cambio de contraseña rechazado:",
        error.code || error.name
      );

      informarClave(
        "No se pudo cambiar la contraseña. " +
        "Compruebe que sea diferente de la anterior y cumpla " +
        "los requisitos. Si el acceso caducó, solicite otro enlace.",
        true
      );
      return;
    }

    claveActualizada = true;
    formularioRestablecer.reset();
    formularioRestablecer.hidden = true;

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

    informarClave("Contraseña actualizada. Cerrando sesión...");

    const { error: errorCierre } =
      await supabaseClient.auth.signOut({ scope: "local" });

    if (errorCierre) {
      informarClave(
        "La contraseña se actualizó, pero no se pudo cerrar " +
        "la sesión local. Cierre sesión antes de probar el nuevo acceso.",
        true
      );
      return;
    }

    informarClave(
      "Contraseña actualizada. Seleccione Volver al inicio " +
      "de sesión e ingrese con su nueva contraseña."
    );

  } catch (error) {
    informarClave(
      claveActualizada
        ? "La contraseña se actualizó, pero el cierre no pudo completarse."
        : "No se pudo confirmar el cambio. Revise su conexión.",
      true
    );

  } finally {
    guardandoClave = false;

    if (!claveActualizada) {
      botonRestablecer.disabled = false;
      botonRestablecer.textContent = "Guardar nueva contraseña";
    }
  }
});

verificarAccesoClave();