const estadoAccesoUsuarios = document.getElementById("estado-acceso");
const contenidoUsuarios = document.getElementById("contenido-usuarios");
const listaUsuarios = document.getElementById("lista-usuarios");
const mensajeUsuarios = document.getElementById("mensaje-usuarios");
const buscarUsuario = document.getElementById("buscar-usuario");
const actualizarUsuarios = document.getElementById("actualizar-usuarios");

let administradorActual = null;
let perfilesUsuarios = [];
let guardandoUsuario = false;

function informarUsuarios(texto, error = false) {
  mensajeUsuarios.textContent = texto;
  mensajeUsuarios.style.color = error ? "#b3261e" : "#155e75";
}

function crearTextoUsuario(etiqueta, valor) {
  const parrafo = document.createElement("p");
  const titulo = document.createElement("strong");

  titulo.textContent = `${etiqueta}: `;
  parrafo.append(titulo, document.createTextNode(valor || "Sin información"));

  return parrafo;
}

function renderizarUsuarios() {
  listaUsuarios.replaceChildren();

  const termino = buscarUsuario.value.trim().toLocaleLowerCase("es");

  const filtrados = perfilesUsuarios.filter((perfil) => {
    const texto =
      `${perfil.nombre_completo} ${perfil.correo_institucional}`
        .toLocaleLowerCase("es");

    return texto.includes(termino);
  });

  if (filtrados.length === 0) {
    const aviso = document.createElement("p");
    aviso.textContent = "No se encontraron usuarios.";
    listaUsuarios.append(aviso);
    return;
  }

  filtrados.forEach((perfil) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-usuario";

    const nombre = document.createElement("h2");
    nombre.textContent = perfil.nombre_completo;

    const estado = document.createElement("p");
    estado.className = "estado-usuario";
    estado.textContent = perfil.activo ? "Cuenta habilitada" : "Cuenta no habilitada";

    tarjeta.append(
      nombre,
      crearTextoUsuario("Correo", perfil.correo_institucional),
      crearTextoUsuario("Rol actual", perfil.rol),
      estado
    );

    if (perfil.id === administradorActual.id) {
      const nota = document.createElement("p");
      nota.textContent =
        "Esta es su cuenta. No puede modificarla desde este módulo.";

      tarjeta.append(nota);
      listaUsuarios.append(tarjeta);
      return;
    }

    const acciones = document.createElement("div");
    acciones.className = "acciones-usuario";

    const etiqueta = document.createElement("label");
    const selector = document.createElement("select");

    selector.id = `rol-${perfil.id}`;
    etiqueta.htmlFor = selector.id;
    etiqueta.textContent = "Asignar rol:";

    const opciones = [
      ["pendiente", "Pendiente — sin acceso"],
      ["editor", "Editor"],
      ["administrador", "Administrador"]
    ];

    opciones.forEach(([valor, texto]) => {
      const opcion = document.createElement("option");
      opcion.value = valor;
      opcion.textContent = texto;
      selector.append(opcion);
    });

    selector.value = perfil.rol;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-usuarios";
    boton.textContent = "Guardar rol";

    boton.addEventListener("click", () => {
      guardarRolUsuario(perfil, selector.value, boton, selector);
    });

    acciones.append(etiqueta, selector, boton);
    tarjeta.append(acciones);
    listaUsuarios.append(tarjeta);
  });
}

async function cargarUsuarios() {
  actualizarUsuarios.disabled = true;

  try {
    const { data, error } = await supabaseClient
      .from("perfiles")
      .select("id, nombre_completo, correo_institucional, rol, activo, creado_en")
      .order("creado_en", { ascending: false });

    if (error) throw error;

    perfilesUsuarios = data || [];
    renderizarUsuarios();

  } finally {
    actualizarUsuarios.disabled = false;
  }
}

async function guardarRolUsuario(perfil, nuevoRol, boton, selector) {
  if (guardandoUsuario) return;

  if (!["pendiente", "editor", "administrador"].includes(nuevoRol)) {
    informarUsuarios("Seleccione un rol válido.", true);
    return;
  }

  const habilitar = nuevoRol !== "pendiente";

  const confirmacion =
    `Usuario: ${perfil.nombre_completo}\n` +
    `Correo: ${perfil.correo_institucional}\n` +
    `Nuevo rol: ${nuevoRol}\n` +
    `Acceso: ${habilitar ? "habilitado" : "no habilitado"}\n\n` +
    "¿Desea guardar este cambio?";

  if (!window.confirm(confirmacion)) return;

  guardandoUsuario = true;
  boton.disabled = true;
  selector.disabled = true;
  boton.textContent = "Guardando...";

  buscarUsuario.disabled = true;
  actualizarUsuarios.disabled = true;

  let cambioAplicado = false;

  try {
    const { error } = await supabaseClient.rpc(
      "administrar_rol_usuario",
      {
        p_usuario_id: perfil.id,
        p_nuevo_rol: nuevoRol
      }
    );

    if (error) throw error;

    cambioAplicado = true;

    await cargarUsuarios();

    informarUsuarios(
      `Cambio guardado para ${perfil.nombre_completo}. ` +
      `Rol: ${nuevoRol}.`
    );

  } catch (error) {
    console.error("Error en gestión de usuarios:", error);

    informarUsuarios(
      cambioAplicado
        ? "El rol se guardó, pero no se pudo actualizar la lista. " +
          "Pulse Actualizar lista antes de repetir la operación."
        : "No se pudo guardar el rol. Compruebe que su cuenta " +
          "siga siendo administradora y que la función de Supabase exista.",
      true
    );

  } finally {
    guardandoUsuario = false;
    boton.disabled = false;
    selector.disabled = false;
    boton.textContent = "Guardar rol";
    buscarUsuario.disabled = false;
    actualizarUsuarios.disabled = false;
  }
}

async function iniciarGestionUsuarios() {
  try {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
      window.location.replace("login.html");
      return;
    }

    const { data: perfil, error: errorPerfil } = await supabaseClient
      .from("perfiles")
      .select("id, rol, activo")
      .eq("id", data.user.id)
      .maybeSingle();

    if (errorPerfil) throw errorPerfil;

    if (
      !perfil ||
      perfil.rol !== "administrador" ||
      perfil.activo !== true
    ) {
      estadoAccesoUsuarios.textContent =
        "Acceso restringido. Solo un administrador activo puede gestionar usuarios.";

      return;
    }

    administradorActual = data.user;
    contenidoUsuarios.hidden = false;

    estadoAccesoUsuarios.textContent =
      "Acceso autorizado para gestión de usuarios.";

    informarUsuarios("Cargando usuarios...");

    await cargarUsuarios();

    informarUsuarios("Seleccione una cuenta para aprobarla o cambiar su rol.");

  } catch (error) {
    console.error("Error al abrir gestión de usuarios:", error);

    estadoAccesoUsuarios.textContent =
      "No se pudo completar la carga de usuarios. " +
      "Revise la conexión y los permisos de Supabase.";
  }
}

buscarUsuario.addEventListener("input", renderizarUsuarios);

actualizarUsuarios.addEventListener("click", async () => {
  if (guardandoUsuario) return;

  try {
    informarUsuarios("Actualizando lista...");
    await cargarUsuarios();
    informarUsuarios("Lista actualizada.");
  } catch (error) {
    console.error("No se pudo actualizar la lista:", error);
    informarUsuarios("No se pudo actualizar la lista.", true);
  }
});

iniciarGestionUsuarios();