const listaEventosPublicos = document.getElementById("lista-eventos");
const listaNoticiasPublicas = document.getElementById("lista-noticias");

function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

function formatearFecha(fecha) {
  if (!fecha) return "Fecha no especificada";

  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatearHora(hora) {
  if (!hora) return "";

  return hora.slice(0, 5);
}

function formatearFechaPublicacion(fechaHora) {
  if (!fechaHora) return "";

  return new Date(fechaHora).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

async function cargarEventosPublicos() {
  listaEventosPublicos.innerHTML =
    '<p class="cargando">Cargando eventos...</p>';

  const { data: eventos, error } = await supabaseClient
    .from("eventos")
    .select("*")
    .order("fecha", { ascending: true });

  if (error) {
    listaEventosPublicos.innerHTML =
      '<p class="mensaje-error">No se pudieron cargar los eventos en este momento.</p>';

    console.error("Error al cargar eventos:", error);
    return;
  }

  if (!eventos || eventos.length === 0) {
    listaEventosPublicos.innerHTML =
      '<p class="cargando">No hay eventos publicados por el momento.</p>';
    return;
  }

  listaEventosPublicos.innerHTML = eventos.map((evento) => {
    const hora = formatearHora(evento.hora);
    const lugar = evento.lugar
      ? `<p><strong>Lugar:</strong> ${escaparHTML(evento.lugar)}</p>`
      : "";

    const horaHTML = hora
      ? `<p><strong>Hora:</strong> ${hora}</p>`
      : "";
      const imagenHTML = evento.imagen_url
  ? `<img
       class="imagen-publicacion"
       src="${escaparHTML(evento.imagen_url)}"
       alt="Imagen del evento: ${escaparHTML(evento.titulo)}"
     >`
  : "";

    return `
      <article class="evento-publico">
        <div class="fecha-publica">
          <span>${formatearFecha(evento.fecha)}</span>
        </div>

        <div class="contenido-evento-publico">
          <p class="etiqueta-tipo">${escaparHTML(evento.tipo)}</p>
          <h3>${escaparHTML(evento.titulo)}</h3>
          ${horaHTML}
          ${lugar}
          <p>${escaparHTML(evento.descripcion)}</p>
          ${imagenHTML}
        </div>
      </article>
    `;
  }).join("");
}

async function cargarNoticiasPublicas() {
  listaNoticiasPublicas.innerHTML =
    '<p class="cargando">Cargando noticias...</p>';

  const { data: noticias, error } = await supabaseClient
    .from("noticias")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) {
    listaNoticiasPublicas.innerHTML =
      '<p class="mensaje-error">No se pudieron cargar las noticias en este momento.</p>';

    console.error("Error al cargar noticias:", error);
    return;
  }

  if (!noticias || noticias.length === 0) {
    listaNoticiasPublicas.innerHTML =
      '<p class="cargando">No hay noticias publicadas por el momento.</p>';
    return;
  }

  listaNoticiasPublicas.innerHTML = noticias.map((noticia) => `
    <article class="tarjeta noticia-publica">
      <h3>${escaparHTML(noticia.titulo)}</h3>
      <p class="fecha-publicacion">
        Publicado: ${formatearFechaPublicacion(noticia.creado_en)}
      </p>
      <p>${escaparHTML(noticia.contenido)}</p>

      ${noticia.imagen_url
  ? `<img
       class="imagen-publicacion"
       src="${escaparHTML(noticia.imagen_url)}"
       alt="Imagen de la noticia: ${escaparHTML(noticia.titulo)}"
     >`
  : ""}
    </article>
  `).join("");
}

function colocarAnioActual() {
  const anio = document.getElementById("anio-actual");

  if (anio) {
    anio.textContent = new Date().getFullYear();
  }
}

async function iniciarPaginaPublica() {
  colocarAnioActual();
  await cargarEventosPublicos();
  await cargarNoticiasPublicas();
}

iniciarPaginaPublica();

const canalEventos = supabaseClient
  .channel("cambios-publicos-eventos")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "eventos"
    },
    () => {
      console.log("Cambio detectado en eventos.");
      cargarEventosPublicos();
    }
  )
  .subscribe();

const canalNoticias = supabaseClient
  .channel("cambios-publicos-noticias")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "noticias"
    },
    () => {
      console.log("Cambio detectado en noticias.");
      cargarNoticiasPublicas();
    }
  )
  .subscribe();