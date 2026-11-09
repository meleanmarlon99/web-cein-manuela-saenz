(() => {
  const contenedor = document.getElementById("galeria-publica");

  if (!contenedor) return;

  const DEPOSITO = "galeria-institucional";

  function mostrarEstado(texto) {
    const parrafo = document.createElement("p");

    parrafo.setAttribute("role", "status");
    parrafo.textContent = texto;

    contenedor.replaceChildren(parrafo);
  }

  async function cargarGaleriaPublica() {
    mostrarEstado("Cargando fotografías...");

    try {
      const { data: publicaciones, error } = await supabaseClient
        .from("galeria")
        .select(
          "id,titulo,descripcion,texto_alternativo,imagen_ruta,creado_en"
        )
        .order("creado_en", { ascending: false })
        .limit(60);

      if (error) throw error;

      if (!publicaciones || publicaciones.length === 0) {
        mostrarEstado(
          "Próximamente compartiremos nuestras actividades."
        );

        return;
      }

      const fragmento = document.createDocumentFragment();

      for (const publicacion of publicaciones) {
        const tarjeta = document.createElement("article");

        tarjeta.className = "galeria-publica-tarjeta";

        const imagen = document.createElement("img");

        const { data: datosUrl } = supabaseClient.storage
          .from(DEPOSITO)
          .getPublicUrl(publicacion.imagen_ruta);

        imagen.src = datosUrl.publicUrl;
        imagen.alt = publicacion.texto_alternativo;
        imagen.loading = "lazy";
        imagen.decoding = "async";

        imagen.addEventListener(
          "error",
          () => {
            imagen.hidden = true;

            const aviso = document.createElement("p");

            aviso.className = "galeria-publica-aviso";
            aviso.textContent = "Fotografía no disponible.";

            tarjeta.prepend(aviso);
          },
          { once: true }
        );

        const contenido = document.createElement("div");

        contenido.className = "galeria-publica-contenido";

        const titulo = document.createElement("h3");

        titulo.textContent = publicacion.titulo;

        const descripcion = document.createElement("p");

        descripcion.textContent = publicacion.descripcion;

        contenido.append(titulo, descripcion);

        tarjeta.append(imagen, contenido);

        fragmento.append(tarjeta);
      }

      contenedor.replaceChildren(fragmento);
    } catch (error) {
      console.error("Error al cargar la galería:", error);

      mostrarEstado(
        "No se pudo cargar la galería. " +
        "Intente nuevamente más tarde."
      );
    }
  }

  cargarGaleriaPublica();
})();