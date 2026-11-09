(() => {
  const formulario = document.getElementById("formulario-galeria");
  const boton = document.getElementById("boton-publicar-galeria");
  const mensaje = document.getElementById("mensaje-galeria");

  if (!formulario || !boton || !mensaje) return;

  const DEPOSITO = "galeria-institucional";
  const TAMANO_MAXIMO = 5 * 1024 * 1024;

  const extensiones = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };

  let publicando = false;

  function informar(texto, esError = false) {
    mensaje.textContent = texto;
    mensaje.style.color = esError ? "#b3261e" : "#155e75";
  }

  async function obtenerAdministrador() {
    const {
      data: datosSesion,
      error: errorSesion
    } = await supabaseClient.auth.getUser();

    if (errorSesion || !datosSesion.user) {
      throw new Error(
        "No hay una sesión válida. Cierra sesión y vuelve a ingresar."
      );
    }

    const usuario = datosSesion.user;

    const {
      data: autorizacion,
      error: errorAutorizacion
    } = await supabaseClient
      .from("administradores_galeria")
      .select("usuario_id")
      .eq("usuario_id", usuario.id)
      .maybeSingle();

    if (errorAutorizacion) {
      throw new Error(
        `No se pudo verificar la autorización: ${errorAutorizacion.message}`
      );
    }

    if (!autorizacion) {
      throw new Error(
        "Esta cuenta todavía no está autorizada para publicar en la galería."
      );
    }

    return usuario;
  }

  async function prepararGaleria() {
    boton.disabled = true;
    informar("Verificando permiso para publicar...");

    try {
      await obtenerAdministrador();
      boton.disabled = false;
      informar("Formulario listo para publicar.");
    } catch (error) {
      informar(error.message, true);
    }
  }

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (publicando || !formulario.reportValidity()) return;

    const titulo = document
      .getElementById("titulo-galeria")
      .value.trim();

    const descripcion = document
      .getElementById("descripcion-galeria")
      .value.trim();

    const textoAlternativo = document
      .getElementById("texto-alternativo-galeria")
      .value.trim();

    const archivo = document
      .getElementById("imagen-galeria")
      .files[0];

    if (!titulo || !descripcion || !textoAlternativo) {
      informar("Complete todos los campos con texto válido.", true);
      return;
    }

    if (!archivo) {
      informar("Seleccione una fotografía.", true);
      return;
    }

    if (!extensiones[archivo.type]) {
      informar("Solo se permiten imágenes JPG, PNG o WEBP.", true);
      return;
    }

    if (archivo.size === 0 || archivo.size > TAMANO_MAXIMO) {
      informar(
        "La imagen debe tener contenido y no superar los 5 MB.",
        true
      );
      return;
    }

    publicando = true;
    boton.disabled = true;
    boton.textContent = "Publicando...";

    let rutaSubida = null;
    let registroGuardado = false;

    try {
      const usuario = await obtenerAdministrador();

      const nombreArchivo =
        `${crypto.randomUUID()}.${extensiones[archivo.type]}`;

      const ruta = `${usuario.id}/${nombreArchivo}`;

      informar("Subiendo fotografía...");

      const { error: errorSubida } = await supabaseClient.storage
        .from(DEPOSITO)
        .upload(ruta, archivo, {
          cacheControl: "3600",
          contentType: archivo.type,
          upsert: false
        });

      if (errorSubida) {
        throw new Error(
          `No se pudo subir la fotografía: ${errorSubida.message}`
        );
      }

      rutaSubida = ruta;

      informar("Guardando publicación...");

      const { error: errorRegistro } = await supabaseClient
        .from("galeria")
        .insert({
          titulo,
          descripcion,
          texto_alternativo: textoAlternativo,
          imagen_ruta: ruta,
          creado_por: usuario.id
        });

      if (errorRegistro) {
        throw new Error(
          `No se pudo guardar la publicación: ${errorRegistro.message}`
        );
      }

      registroGuardado = true;
      formulario.reset();
window.dispatchEvent(new Event("galeria-publicada"));

      informar(
        "Fotografía publicada correctamente. " +
        "Recarga la página pública para verla."
      );

      mensaje.style.color = "#1b5e20";
    } catch (error) {
      let avisoLimpieza = "";

      if (rutaSubida && !registroGuardado) {
        try {
          const { error: errorLimpieza } = await supabaseClient.storage
            .from(DEPOSITO)
            .remove([rutaSubida]);

          if (errorLimpieza) {
            avisoLimpieza =
              " La imagen subida no pudo retirarse automáticamente; " +
              "revise el depósito en Supabase.";
          }
        } catch {
          avisoLimpieza =
            " No se pudo comprobar la limpieza del archivo subido.";
        }
      }

      informar(
        `${error.message || "Ocurrió un error inesperado."}${avisoLimpieza}`,
        true
      );
    } finally {
      publicando = false;
      boton.disabled = false;
      boton.textContent = "Publicar fotografía";
    }
  });

  prepararGaleria();
})();