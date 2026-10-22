const formularioLogin = document.getElementById("formulario-login");
const mensajeLogin = document.getElementById("mensaje-login");

formularioLogin.addEventListener("submit", async (evento) => {
  evento.preventDefault();

  const correo = document.getElementById("correo").value.trim();
  const contrasena = document.getElementById("contrasena").value;

  mensajeLogin.textContent = "Verificando credenciales...";
  mensajeLogin.style.color = "#155e75";

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: correo,
      password: contrasena
    });

    if (error) {
      mensajeLogin.textContent = `No se pudo iniciar sesión: ${error.message}`;
      mensajeLogin.style.color = "#b3261e";
      return;
    }

    if (!data.user) {
      mensajeLogin.textContent = "No se encontró un usuario válido.";
      mensajeLogin.style.color = "#b3261e";
      return;
    }

    mensajeLogin.textContent = "Acceso correcto. Abriendo panel...";
    mensajeLogin.style.color = "#1b5e20";

    window.location.href = "panel.html";

  } catch (error) {
    mensajeLogin.textContent = `Error: ${error.message}`;
    mensajeLogin.style.color = "#b3261e";
    console.error("Error de inicio de sesión:", error);
  }
});