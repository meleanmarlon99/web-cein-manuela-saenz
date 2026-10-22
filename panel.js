let usuarioActual = null;

const formularioEvento = document.getElementById("formulario-evento");
const formularioNoticia = document.getElementById("formulario-noticia");

const mensajeEvento = document.getElementById("mensaje-evento");
const mensajeNoticia = document.getElementById("mensaje-noticia");

const listaEventos = document.getElementById("eventos-administrativos");
const listaNoticias = document.getElementById("noticias-administrativas");

function mostrarMensaje(elemento, texto, color) {
  elemento.textContent = texto;
  elemento.style.color = color;
}

function convertirFecha(fecha) {
  if (!fecha) return "Fecha no especificada";

  return new Date(`${fecha}T12:00:00`).toLocaleDateString("es-VE", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function convertirHora(hora) {
  if (!hora) return "Hora no especificada";

  return hora.slice(0, 5);
}

function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

async function subirImagenOpcional(inputId, carpeta) {
  const inputImagen = document.getElementById(inputId);
  const archivo = inputImagen.files[0];

  if (!archivo) {
    return null;
  }

  const formatosPermitidos = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  const tamanoMaximo = 5 * 1024 * 1024;

  if (!formatosPermitidos.includes(archivo.type)) {
    throw new Error("Solo se permiten imágenes JPG, PNG o WEBP.");
  }

  if (archivo.size > tamanoMaximo) {
    throw new Error("La imagen supera el tamaño máximo de 5 MB.");
  }

  const extension = archivo.name.split(".").pop().toLowerCase();

  const nombreArchivo = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const rutaArchivo = `${usuarioActual.id}/${carpeta}/${nombreArchivo}`;

  console.log("Subiendo imagen a:", rutaArchivo);

  const { data: datosSubida, error: errorSubida } = await supabaseClient
    .storage
    .from("imagenes-institucionales")
    .upload(rutaArchivo, archivo, {
      cacheControl: "3600",
      upsert: false,
      contentType: archivo.type
    });

  if (errorSubida) {
    throw new Error(`No se pudo subir la imagen: ${errorSubida.message}`);
  }

  console.log("Imagen subida correctamente:", datosSubida);

  const { data: datosUrl } = supabaseClient
    .storage
    .from("imagenes-institucionales")
    .getPublicUrl(rutaArchivo);

  console.log("URL pública generada:", datosUrl.publicUrl);

  return datosUrl.publicUrl;
}

async function verificarSesion() {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    window.location.href = "login.html";
    return false;
  }

  usuarioActual = data.user;

  document.getElementById("correo-usuario").textContent =
    `Sesión activa: ${usuarioActual.email}`;

  return true;
}

async function cargarEventos() {
  listaEventos.innerHTML = '<p class="cargando">Cargando eventos...</p>';

  const { data: eventos, error } = await supabaseClient
    .from("eventos")
    .select("*")
    .order("fecha", { ascending: true });

  if (error) {
    listaEventos.innerHTML =
      `<p class="mensaje-error">No se pudieron cargar los eventos: ${escaparHTML(error.message)}</p>`;
    return;
  }

  if (!eventos || eventos.length === 0) {
    listaEventos.innerHTML =
      '<p class="cargando">Aún no hay eventos publicados.</p>';
    return;
  }

  listaEventos.innerHTML = eventos.map((evento) => `
    <article class="tarjeta-gestion">
      <h3>${escaparHTML(evento.titulo)}</h3>
      <p><strong>Tipo:</strong> ${escaparHTML(evento.tipo)}</p>
      <p><strong>Fecha:</strong> ${convertirFecha(evento.fecha)}</p>
      <p><strong>Hora:</strong> ${convertirHora(evento.hora)}</p>
      <p><strong>Lugar:</strong> ${escaparHTML(evento.lugar || "No especificado")}</p>
      <p>${escaparHTML(evento.descripcion)}</p>
      <p class="meta-publicacion">Publicado: ${new Date(evento.creado_en).toLocaleString("es-VE")}</p>

      <div class="acciones-publicacion">
        <button
          type="button"
          class="boton-eliminar"
          data-id="${evento.id}"
          data-tipo="evento"
        >
          Eliminar
        </button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll('[data-tipo="evento"]').forEach((boton) => {
    boton.addEventListener("click", () => eliminarEvento(boton.dataset.id));
  });
}

async function cargarNoticias() {
  listaNoticias.innerHTML = '<p class="cargando">Cargando noticias...</p>';

  const { data: noticias, error } = await supabaseClient
    .from("noticias")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) {
    listaNoticias.innerHTML =
      `<p class="mensaje-error">No se pudieron cargar las noticias: ${escaparHTML(error.message)}</p>`;
    return;
  }

  if (!noticias || noticias.length === 0) {
    listaNoticias.innerHTML =
      '<p class="cargando">Aún no hay noticias publicadas.</p>';
    return;
  }

  listaNoticias.innerHTML = noticias.map((noticia) => `
    <article class="tarjeta-gestion">
      <h3>${escaparHTML(noticia.titulo)}</h3>
      <p>${escaparHTML(noticia.contenido)}</p>
      <p class="meta-publicacion">Publicado: ${new Date(noticia.creado_en).toLocaleString("es-VE")}</p>

      <div class="acciones-publicacion">
        <button
          type="button"
          class="boton-eliminar"
          data-id="${noticia.id}"
          data-tipo="noticia"
        >
          Eliminar
        </button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll('[data-tipo="noticia"]').forEach((boton) => {
    boton.addEventListener("click", () => eliminarNoticia(boton.dataset.id));
  });
}

formularioEvento.addEventListener("submit", async (eventoFormulario) => {
  eventoFormulario.preventDefault();

  if (!usuarioActual) return;

 mostrarMensaje(mensajeEvento, "Subiendo información...", "#155e75");

let imagenUrl = null;

try {
  imagenUrl = await subirImagenOpcional("imagen-evento", "eventos");
} catch (error) {
  mostrarMensaje(mensajeEvento, error.message, "#b3261e");
  return;
}

const nuevoEvento = {
    tipo: document.getElementById("tipo-evento").value,
    titulo: document.getElementById("titulo-evento").value.trim(),
    fecha: document.getElementById("fecha-evento").value,
    hora: document.getElementById("hora-evento").value || null,
    lugar: document.getElementById("lugar-evento").value.trim() || null,
   descripcion: document.getElementById("descripcion-evento").value.trim(),
creado_por: usuarioActual.id,
imagen_url: imagenUrl
};

  const { error } = await supabaseClient
    .from("eventos")
    .insert([nuevoEvento]);

  if (error) {
    mostrarMensaje(
      mensajeEvento,
      `No se pudo publicar: ${error.message}`,
      "#b3261e"
    );
    return;
  }

  mostrarMensaje(
    mensajeEvento,
    "Evento publicado correctamente.",
    "#1b5e20"
  );

  formularioEvento.reset();
  await cargarEventos();
});

formularioNoticia.addEventListener("submit", async (eventoFormulario) => {
  eventoFormulario.preventDefault();

  if (!usuarioActual) return;

 mostrarMensaje(mensajeNoticia, "Subiendo información...", "#155e75");

let imagenUrl = null;

try {
  imagenUrl = await subirImagenOpcional("imagen-noticia", "noticias");
} catch (error) {
  mostrarMensaje(mensajeNoticia, error.message, "#b3261e");
  return;
}

const nuevaNoticia = {
    titulo: document.getElementById("titulo-noticia").value.trim(),
   contenido: document.getElementById("contenido-noticia").value.trim(),
creado_por: usuarioActual.id,
imagen_url: imagenUrl
  };

  const { error } = await supabaseClient
    .from("noticias")
    .insert([nuevaNoticia]);

  if (error) {
    mostrarMensaje(
      mensajeNoticia,
      `No se pudo publicar: ${error.message}`,
      "#b3261e"
    );
    return;
  }

  mostrarMensaje(
    mensajeNoticia,
    "Noticia publicada correctamente.",
    "#1b5e20"
  );

  formularioNoticia.reset();
  await cargarNoticias();
});

async function eliminarEvento(id) {
  const confirmar = window.confirm(
    "¿Seguro que desea eliminar este evento? Esta acción no se puede deshacer."
  );

  if (!confirmar) return;

  const { error } = await supabaseClient
    .from("eventos")
    .delete()
    .eq("id", id);

  if (error) {
    alert(`No se pudo eliminar el evento: ${error.message}`);
    return;
  }

  await cargarEventos();
}

async function eliminarNoticia(id) {
  const confirmar = window.confirm(
    "¿Seguro que desea eliminar esta noticia? Esta acción no se puede deshacer."
  );

  if (!confirmar) return;

  const { error } = await supabaseClient
    .from("noticias")
    .delete()
    .eq("id", id);

  if (error) {
    alert(`No se pudo eliminar la noticia: ${error.message}`);
    return;
  }

  await cargarNoticias();
}

document
  .getElementById("boton-cerrar-sesion")
  .addEventListener("click", async () => {
    await supabaseClient.auth.signOut({ scope: "local" });
    window.location.href = "index.html";
  });

async function iniciarPanel() {
  const sesionValida = await verificarSesion();

  if (!sesionValida) return;

  await cargarEventos();
  await cargarNoticias();
}

iniciarPanel();