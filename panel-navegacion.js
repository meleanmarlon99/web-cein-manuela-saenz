(() => {
  const principal = document.querySelector(".panel-principal");
  const bienvenida = document.querySelector(".bienvenida-panel");
  const cuadricula = document.querySelector(".panel-cuadricula");

  if (!principal || !bienvenida || !cuadricula) {
    console.error(
      "No se pudo organizar el panel: faltan sus contenedores."
    );
    return;
  }

  const grupos = [
    {
      clave: "eventos",
      titulo: "Eventos",
      tituloLista: "Eventos publicados",
      textoAgregar: "Agregar evento",
      formulario: document
        .getElementById("formulario-evento")
        ?.closest(".panel-formulario"),
      lista: document
        .getElementById("eventos-administrativos")
        ?.closest(".seccion-gestion")
    },
    {
      clave: "noticias",
      titulo: "Noticias",
      tituloLista: "Noticias publicadas",
      textoAgregar: "Agregar noticia",
      formulario: document
        .getElementById("formulario-noticia")
        ?.closest(".panel-formulario"),
      lista: document
        .getElementById("noticias-administrativas")
        ?.closest(".seccion-gestion")
    },
    {
      clave: "galeria",
      titulo: "Galería",
      tituloLista: "Fotografías publicadas",
      textoAgregar: "Agregar fotografía",
      formulario: document
        .getElementById("formulario-galeria")
        ?.closest(".panel-formulario"),
      lista: document
        .getElementById("galeria-administrativa")
        ?.closest(".seccion-gestion")
    },
    {
      clave: "contacto",
      titulo: "Contacto",
      contenido: document.querySelector(".seccion-contacto-admin")
    }
  ];

  const faltaElemento = grupos.some((grupo) => {
    if (grupo.clave === "contacto") {
      return !grupo.contenido;
    }

    return !grupo.formulario || !grupo.lista;
  });

  if (faltaElemento) {
    console.error(
      "No se pudo organizar el panel: falta un formulario o una lista."
    );
    return;
  }

  const navegacion = document.createElement("nav");
  navegacion.className = "navegacion-panel";
  navegacion.setAttribute(
    "aria-label",
    "Secciones del panel administrativo"
  );

  const contenedor = document.createElement("div");
  contenedor.className = "contenidos-panel";

  const vistas = new Map();

  function mostrarLista(clave, devolverFoco = false) {
    const vista = vistas.get(clave);

    if (!vista || !vista.formulario) return;

    vista.formulario.hidden = true;
    vista.lista.hidden = false;
    vista.cabecera.hidden = false;

    vista.botonAgregar.setAttribute("aria-expanded", "false");

    if (devolverFoco) {
      vista.botonAgregar.focus();
    }
  }

  function mostrarFormulario(clave) {
    const vista = vistas.get(clave);

    if (!vista || !vista.formulario) return;

    vista.lista.hidden = true;
    vista.cabecera.hidden = true;
    vista.formulario.hidden = false;

    vista.botonAgregar.setAttribute("aria-expanded", "true");

    // No habilitar botones que otro módulo haya deshabilitado.
    // Solo colocar el foco en el primer campo disponible.
    const primerCampo = vista.formulario.querySelector(
      "input:not([disabled]), select:not([disabled]), " +
      "textarea:not([disabled])"
    );

    if (primerCampo) {
      primerCampo.focus();
    }
  }

  function mostrarSeccion(clave) {
    vistas.forEach((vista, claveVista) => {
      const activa = claveVista === clave;

      vista.botonNavegacion.setAttribute(
        "aria-pressed",
        String(activa)
      );

      vista.seccion.hidden = !activa;
    });

    // Al seleccionar una sección, comenzar por su lista.
    mostrarLista(clave);
  }

  grupos.forEach((grupo) => {
    const botonNavegacion = document.createElement("button");

    botonNavegacion.type = "button";
    botonNavegacion.className = "navegacion-panel__boton";
    botonNavegacion.id = `boton-seccion-${grupo.clave}`;
    botonNavegacion.textContent = grupo.titulo;

    botonNavegacion.setAttribute(
      "aria-controls",
      `seccion-panel-${grupo.clave}`
    );

    botonNavegacion.setAttribute("aria-pressed", "false");

    const seccion = document.createElement("section");

    seccion.id = `seccion-panel-${grupo.clave}`;
    seccion.className = "contenido-panel";
    seccion.hidden = true;

    seccion.setAttribute(
      "aria-labelledby",
      botonNavegacion.id
    );

    const vista = {
      seccion,
      botonNavegacion
    };

    if (grupo.clave === "contacto") {
      seccion.appendChild(grupo.contenido);

    } else {
      const cabecera = document.createElement("div");
      cabecera.className = "cabecera-listado-panel";

      const titulo = document.createElement("h2");
      titulo.textContent = grupo.tituloLista;

      const botonAgregar = document.createElement("button");

      botonAgregar.type = "button";
      botonAgregar.className = "boton-agregar-panel";
      botonAgregar.id = `agregar-${grupo.clave}`;
      botonAgregar.textContent = `+ ${grupo.textoAgregar}`;

      grupo.formulario.id =
        `contenedor-formulario-${grupo.clave}`;

      botonAgregar.setAttribute(
        "aria-controls",
        grupo.formulario.id
      );

      botonAgregar.setAttribute("aria-expanded", "false");

      const botonVolver = document.createElement("button");

      botonVolver.type = "button";
      botonVolver.className = "boton-volver-lista";
      botonVolver.textContent = "← Volver a la lista";

      botonVolver.addEventListener("click", () => {
        mostrarLista(grupo.clave, true);
      });

      botonAgregar.addEventListener("click", () => {
        mostrarFormulario(grupo.clave);
      });

      // Reutilizar los elementos existentes, sin copiar formularios
      // ni perder los listeners registrados por otros archivos.
      grupo.formulario.prepend(botonVolver);

      grupo.lista.classList.add("listado-panel-administrativo");

      // El título se presenta ahora en la cabecera con el botón +.
      const tituloAnterior = grupo.lista.querySelector("h2");

      if (tituloAnterior) {
        tituloAnterior.hidden = true;
      }

      cabecera.append(titulo, botonAgregar);

      seccion.append(
        cabecera,
        grupo.lista,
        grupo.formulario
      );

      Object.assign(vista, {
        cabecera,
        lista: grupo.lista,
        formulario: grupo.formulario,
        botonAgregar
      });
    }

    vistas.set(grupo.clave, vista);

    botonNavegacion.addEventListener("click", () => {
      mostrarSeccion(grupo.clave);
    });

    navegacion.appendChild(botonNavegacion);
    contenedor.appendChild(seccion);
  });

  bienvenida.after(navegacion);
  navegacion.after(contenedor);

  if (cuadricula.children.length === 0) {
    cuadricula.remove();
  }

  mostrarSeccion("eventos");
})();