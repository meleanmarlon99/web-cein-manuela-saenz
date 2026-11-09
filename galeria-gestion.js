(() => {
  const lista = document.getElementById("galeria-administrativa");
  const mensaje = document.getElementById("mensaje-gestion-galeria");
  const botonActualizar = document.getElementById(
    "boton-actualizar-galeria"
  );

  if (!lista || !mensaje || !botonActualizar) return;

  const DEPOSITO = "galeria-institucional";

  let ocupado = false;

  function informar(texto, esError = false) {
    mensaje.textContent = texto;
    mensaje.style.color = esError ? "#b3261e" : "#155e75";
  }

  function mostrarEstadoLista(texto) {
    const parrafo = document.createElement("p");

    parrafo.className = "cargando";
    parrafo.textContent = texto;

    lista.replaceChildren(parrafo);
  }

  function bloquearControles(bloquear) {
    botonActualizar.disabled = bloquear;

    lista.querySelectorAll("[data-eliminar-galeria]").forEach(
      (boton) => {
        boton.disabled = bloquear;
      }
    );
  }

  async function obtenerAdministrador() {
    const {
      data: datosSesion,
      error: errorSesion
    } = await supabaseClient.auth.getUser();

    if (errorSesion || !datosSesion.user) {
      throw new Error(
        "La sesión no está disponible. Vuelva a iniciar sesión."
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
      throw new Error(errorAutorizacion.message);
    }

    if (!autorizacion) {
      throw new Error(
        "Esta cuenta no está autorizada para administrar la galería."
      );
    }

    return usuario;
  }

  async function dibujarLista(usuario) {
    const { data: publicaciones, error } = await supabaseClient
      .from("galeria")
      .select(
        "id,titulo,descripcion,texto_alternativo," +
        "imagen_ruta,creado_por,creado_en"
      )
      .order("creado_en", { ascending: false })
      .limit(100);

    if (error) throw error;

    if (!publicaciones || publicaciones.length === 0) {
      mostrarEstadoLista("Todavía no hay fotografías publicadas.");
      return;
    }

    const fragmento = document.createDocumentFragment();

    for (const publicacion of publicaciones) {
      const tarjeta = document.createElement("article");
      tarjeta.className = "tarjeta-gestion";

      const imagen = document.createElement("img");
      imagen.className = "imagen-gestion-galeria";
      imagen.alt = publicacion.texto_alternativo;
      imagen.loading = "lazy";

      const { data: datosUrl } = supabaseClient.storage
        .from(DEPOSITO)
        .getPublicUrl(publicacion.imagen_ruta);

      imagen.src = datosUrl.publicUrl;

      imagen.addEventListener(
        "error",
        () => {
          imagen.hidden = true;
        },
        { once: true }
      );

      const titulo = document.createElement("h3");
      titulo.textContent = publicacion.titulo;

      const descripcion = document.createElement("p");
      descripcion.className = "descripcion-gestion-galeria";
      descripcion.textContent = publicacion.descripcion;

      const fecha = document.createElement("p");
      fecha.className = "meta-publicacion";
      fecha.textContent =
        "Publicado: " +
        new Date(publicacion.creado_en).toLocaleString("es-VE");

      tarjeta.append(imagen, titulo, descripcion, fecha);

      if (publicacion.creado_por === usuario.id) {
        const acciones = document.createElement("div");
        acciones.className = "acciones-publicacion";

        const boton = document.createElement("button");
        boton.type = "button";
        boton.className = "boton-eliminar";
        boton.textContent = "Eliminar publicación";
        boton.dataset.eliminarGaleria = publicacion.id;

        boton.addEventListener("click", () => {
          eliminarPublicacion(publicacion);
        });

        acciones.append(boton);
        tarjeta.append(acciones);
      } else {
        const aviso = document.createElement("p");
        aviso.className = "texto-ayuda";
        aviso.textContent =
          "Publicada por otra cuenta administrativa.";

        tarjeta.append(aviso);
      }

      fragmento.append(tarjeta);
    }

    lista.replaceChildren(fragmento);
  }

  async function cargarLista() {
    if (ocupado) return;

    ocupado = true;
    bloquearControles(true);
    informar("Actualizando lista...");

    try {
      const usuario = await obtenerAdministrador();

      await dibujarLista(usuario);

      informar(
        "Lista actualizada. Se muestran hasta 100 publicaciones recientes."
      );
    } catch (error) {
      mostrarEstadoLista("No se pudo cargar la lista.");
      informar(error.message || "Error inesperado.", true);
    } finally {
      ocupado = false;
      bloquearControles(false);
    }
  }

  async function eliminarPublicacion(publicacion) {
    if (ocupado) return;

    const confirmar = window.confirm(
      `¿Desea eliminar "${publicacion.titulo}"?\n\n` +
      "Se retirará la publicación y se intentará borrar su fotografía.\n" +
      "Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    ocupado = true;
    bloquearControles(true);

    let publicacionEliminada = false;
    let avisoFinal = "";
    let avisoEsError = false;

    try {
      const usuario = await obtenerAdministrador();

      if (publicacion.creado_por !== usuario.id) {
        throw new Error(
          "Solo puede eliminar publicaciones realizadas con su cuenta."
        );
      }

      informar("Eliminando publicación...");

      const { data: filasEliminadas, error: errorRegistro } =
        await supabaseClient
          .from("galeria")
          .delete()
          .eq("id", publicacion.id)
          .eq("creado_por", usuario.id)
          .select("id");

      if (errorRegistro) throw errorRegistro;

      if (!filasEliminadas || filasEliminadas.length !== 1) {
        throw new Error(
          "No se confirmó la eliminación. " +
          "La publicación puede haber sido eliminada antes " +
          "o su cuenta puede no tener permiso."
        );
      }

      publicacionEliminada = true;

      informar("Retirando archivo de imagen...");

      const { data: archivos, error: errorArchivo } =
        await supabaseClient.storage
          .from(DEPOSITO)
          .remove([publicacion.imagen_ruta]);

      if (
        errorArchivo ||
        !archivos ||
        archivos.length === 0
      ) {
        avisoEsError = true;
        avisoFinal =
          "La publicación fue eliminada, pero no se confirmó " +
          "el borrado del archivo. Revise Storage → " +
          DEPOSITO +
          ". Ruta: " +
          publicacion.imagen_ruta;

        if (errorArchivo) {
          avisoFinal += ". Detalle: " + errorArchivo.message;
        }
      } else {
        avisoFinal =
          "Publicación y fotografía eliminadas correctamente.";
      }
    } catch (error) {
      avisoEsError = true;

      avisoFinal = publicacionEliminada
        ? "La publicación fue eliminada, pero hubo un problema " +
          "posterior. Revise el archivo en Storage. Detalle: " +
          error.message
        : "No se pudo eliminar la publicación: " +
          (error.message || "Error inesperado.");
    }

    try {
      const usuario = await obtenerAdministrador();

      await dibujarLista(usuario);
    } catch (error) {
      avisoEsError = true;
      avisoFinal +=
        " No se pudo actualizar la lista: " + error.message;
    } finally {
      ocupado = false;
      bloquearControles(false);
    }

    informar(avisoFinal, avisoEsError);
  }

  botonActualizar.addEventListener("click", cargarLista);

  window.addEventListener("galeria-publicada", cargarLista);

  cargarLista();
})();