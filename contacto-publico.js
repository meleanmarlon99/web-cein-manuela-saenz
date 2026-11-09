(() => {
  const telefono = document.getElementById("telefono-institucional");
  const correo = document.getElementById("correo-institucional");
  const direccion = document.getElementById("ubicacion-institucional");
  const mapa = document.getElementById("mapa-institucional");
  const horario = document.getElementById("horario-institucional");
  const estado = document.getElementById("estado-contacto-publico");

  if (
    !telefono ||
    !correo ||
    !direccion ||
    !mapa ||
    !horario ||
    !estado
  ) {
    console.error(
      "Falta un elemento HTML de la sección de contacto."
    );
    return;
  }

  function limpiar(valor) {
    return typeof valor === "string" ? valor.trim() : "";
  }

  function obtenerMapaSeguro(valor) {
    if (!valor) return null;

    try {
      const url = new URL(valor);
      const host = url.hostname.toLowerCase();

      const esEnlaceCorto =
        host === "maps.app.goo.gl";

      const esGoogleMaps =
        (
          host === "google.com" ||
          host === "www.google.com"
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
        return null;
      }

      return url.href;
    } catch {
      return null;
    }
  }

  function mostrarTelefono(valor) {
    telefono.replaceChildren();

    if (!valor) {
      telefono.textContent = "Por actualizar";
      return;
    }

    const numero = valor.replace(/[\s().-]/g, "");

    if (/^\+?[0-9]{7,15}$/.test(numero)) {
      const enlace = document.createElement("a");

      enlace.textContent = valor;
      enlace.href = `tel:${numero}`;

      telefono.appendChild(enlace);
    } else {
      telefono.textContent = valor;
    }
  }

  function mostrarCorreo(valor) {
    correo.removeAttribute("href");
    correo.textContent = valor || "Por actualizar";

    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      correo.href = `mailto:${encodeURIComponent(valor)}`;
    }
  }

  async function cargarContactoPublico() {
    estado.textContent = "Actualizando información de contacto...";

    try {
      const { data: contacto, error } = await supabaseClient
        .from("contacto_institucional")
        .select("telefono,correo,direccion,mapa_url,horario")
        .eq("id", 1)
        .single();

      if (error) throw error;

      mostrarTelefono(limpiar(contacto.telefono));
      mostrarCorreo(limpiar(contacto.correo));

      direccion.textContent =
        limpiar(contacto.direccion) || "Por actualizar";

      horario.textContent =
        limpiar(contacto.horario) || "Por actualizar";

      const enlaceMapa = obtenerMapaSeguro(
        limpiar(contacto.mapa_url)
      );

      if (enlaceMapa) {
        mapa.href = enlaceMapa;
        mapa.hidden = false;
      } else {
        mapa.removeAttribute("href");
        mapa.hidden = true;
      }

      estado.textContent = "";
    } catch (error) {
      console.error("Error al cargar contacto:", error);

      estado.textContent =
        "No se pudo actualizar la información de contacto. " +
        "Los datos visibles pueden corresponder a la versión anterior. " +
        "Intenta recargar la página.";
    }
  }

  cargarContactoPublico();
})();