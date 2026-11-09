(() => {
  const formulario = document.getElementById("formulario-contacto");
  const boton = document.getElementById("boton-guardar-contacto");
  const mensaje = document.getElementById("mensaje-contacto");

  if (!formulario || !boton || !mensaje) return;

  const campos = {
    telefono: document.getElementById("contacto-telefono"),
    correo: document.getElementById("contacto-correo"),
    direccion: document.getElementById("contacto-direccion"),
    mapa_url: document.getElementById("contacto-mapa"),
    horario: document.getElementById("contacto-horario")
  };

  let preparado = false;
  let guardando = false;

  function informar(texto, esError = false) {
    mensaje.textContent = texto;
    mensaje.style.color = esError ? "#b3261e" : "#155e75";
  }

  function bloquearCampos(bloqueados) {
    Object.values(campos).forEach((campo) => {
      campo.disabled = bloqueados;
    });
  }

  async function comprobarAdministrador() {
    const {
      data: datosUsuario,
      error: errorUsuario
    } = await supabaseClient.auth.getUser();

    if (errorUsuario || !datosUsuario.user) {
      throw new Error(
        "No hay una sesión válida. Inicia sesión nuevamente."
      );
    }

    const {
      data: autorizado,
      error: errorAutorizacion
    } = await supabaseClient.rpc("es_administrador");

    if (errorAutorizacion) {
      throw new Error(
        "No se pudo comprobar el permiso administrativo: " +
        errorAutorizacion.message
      );
    }

    if (autorizado !== true) {
      throw new Error(
        "Solo los administradores activos pueden editar el contacto."
      );
    }
  }

  function validarMapa(valor) {
    if (!valor) return;

    let url;

    try {
      url = new URL(valor);
    } catch {
      throw new Error(
        "El enlace del mapa no es válido."
      );
    }

    const host = url.hostname.toLowerCase();

    const esEnlaceCorto =
      host === "maps.app.goo.gl";

    const esGoogleMaps =
      (
        host === "www.google.com" ||
        host === "google.com"
      ) &&
      (
        url.pathname === "/maps" ||
        url.pathname.startsWith("/maps/")
      );

    const esDominioMaps =
      host === "maps.google.com";

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      !(esEnlaceCorto || esGoogleMaps || esDominioMaps)
    ) {
      throw new Error(
        "Utiliza un enlace HTTPS de Google Maps, " +
        "como el que ya tiene la institución."
      );
    }
  }

  async function prepararFormulario() {
    boton.disabled = true;
    bloquearCampos(true);
    informar("Verificando permiso y cargando contacto...");

    try {
      await comprobarAdministrador();

      const { data: contacto, error } = await supabaseClient
        .from("contacto_institucional")
        .select("telefono,correo,direccion,mapa_url,horario")
        .eq("id", 1)
        .single();

      if (error) {
        throw new Error(
          "No se pudo cargar el contacto: " + error.message
        );
      }

      Object.entries(campos).forEach(([nombre, campo]) => {
        campo.value = contacto[nombre] ?? "";
      });

      preparado = true;
      bloquearCampos(false);
      boton.disabled = false;

      informar("Información cargada. Puedes editar y guardar.");
    } catch (error) {
      informar(
        error.message || "No se pudo preparar el formulario.",
        true
      );
    }
  }

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (!preparado || guardando) return;
    if (!formulario.reportValidity()) return;

    const datos = {
      telefono: campos.telefono.value.trim(),
      correo: campos.correo.value.trim(),
      direccion: campos.direccion.value.trim(),
      mapa_url: campos.mapa_url.value.trim(),
      horario: campos.horario.value.trim()
    };

    try {
      if (!datos.direccion) {
        throw new Error(
          "Escribe la dirección de la institución."
        );
      }

      validarMapa(datos.mapa_url);
    } catch (error) {
      informar(error.message, true);
      return;
    }

    guardando = true;
    boton.disabled = true;
    boton.textContent = "Guardando...";
    bloquearCampos(true);
    informar("Guardando información de contacto...");

    try {
      await comprobarAdministrador();

      const { data: actualizado, error } = await supabaseClient
        .from("contacto_institucional")
        .update(datos)
        .eq("id", 1)
        .select("id")
        .maybeSingle();

      if (error) {
        throw new Error(
          "No se pudo guardar: " + error.message
        );
      }

      if (!actualizado) {
        throw new Error(
          "No se actualizó ningún registro. " +
          "Comprueba que tu cuenta siga siendo administradora " +
          "activa y que exista el contacto con id 1."
        );
      }

      informar(
        "Información de contacto guardada correctamente."
      );
    } catch (error) {
      informar(
        error.message || "Ocurrió un error al guardar.",
        true
      );
    } finally {
      guardando = false;
      bloquearCampos(false);
      boton.disabled = false;
      boton.textContent = "Guardar información de contacto";
    }
  });

  prepararFormulario();
})();