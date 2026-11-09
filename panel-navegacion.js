(() => {
  const principal = document.querySelector(".panel-principal");
  const bienvenida = document.querySelector(".bienvenida-panel");
  const cuadricula = document.querySelector(".panel-cuadricula");

  if (!principal || !bienvenida || !cuadricula) return;

  const grupos = [
    {
      clave: "eventos",
      titulo: "Eventos",
      elementos: [
        document
          .getElementById("formulario-evento")
          ?.closest(".panel-formulario"),

        document
          .getElementById("eventos-administrativos")
          ?.closest(".seccion-gestion")
      ]
    },
    {
      clave: "noticias",
      titulo: "Noticias",
      elementos: [
        document
          .getElementById("formulario-noticia")
          ?.closest(".panel-formulario"),

        document
          .getElementById("noticias-administrativas")
          ?.closest(".seccion-gestion")
      ]
    },
    {
      clave: "galeria",
      titulo: "Galería",
      elementos: [
        document
          .getElementById("formulario-galeria")
          ?.closest(".panel-formulario"),

        document
          .getElementById("galeria-administrativa")
          ?.closest(".seccion-gestion")
      ]
    },
    {
      clave: "contacto",
      titulo: "Contacto",
      elementos: [
        document.querySelector(".seccion-contacto-admin")
      ]
    }
  ];

  const faltaElemento = grupos.some((grupo) =>
    grupo.elementos.some((elemento) => !elemento)
  );

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

  const botones = [];
  const secciones = [];

  function mostrarSeccion(clave) {
    grupos.forEach((grupo, indice) => {
      const activa = grupo.clave === clave;

      botones[indice].setAttribute(
        "aria-pressed",
        String(activa)
      );

      secciones[indice].hidden = !activa;
    });
  }

  grupos.forEach((grupo) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "navegacion-panel__boton";
    boton.id = `boton-seccion-${grupo.clave}`;
    boton.textContent = grupo.titulo;
    boton.setAttribute(
      "aria-controls",
      `seccion-panel-${grupo.clave}`
    );
    boton.setAttribute("aria-pressed", "false");

    const seccion = document.createElement("section");
    seccion.id = `seccion-panel-${grupo.clave}`;
    seccion.className = "contenido-panel";
    seccion.setAttribute("aria-labelledby", boton.id);

    grupo.elementos.forEach((elemento) => {
      seccion.appendChild(elemento);
    });

    boton.addEventListener("click", () => {
      mostrarSeccion(grupo.clave);
    });

    botones.push(boton);
    secciones.push(seccion);

    navegacion.appendChild(boton);
    contenedor.appendChild(seccion);
  });

  bienvenida.after(navegacion);
  navegacion.after(contenedor);

  if (cuadricula.children.length === 0) {
    cuadricula.remove();
  }

  mostrarSeccion("eventos");
})();