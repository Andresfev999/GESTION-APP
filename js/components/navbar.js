// Funciones comunes para el navbar
async function loadNavbar() {
  try {
    // Determinar la ruta correcta basada en la ubicación actual
    const currentPath = window.location.pathname
    let navbarPath = ""

    // Si estamos en una página dentro de pages/
    if (currentPath.includes("/pages/")) {
      navbarPath = "../../navbar.html"
    } else {
      // Si estamos en la raíz, no cargar navbar dinámicamente
      console.log("Estamos en la página principal, no se carga navbar dinámico")
      return
    }

    console.log("Intentando cargar navbar desde:", navbarPath)

    const response = await fetch(navbarPath)
    if (!response.ok) {
      throw new Error(`Error al cargar navbar: ${response.status}`)
    }

    const navbarHTML = await response.text()

    // Insertar el navbar al inicio del body
    document.body.insertAdjacentHTML("afterbegin", navbarHTML)

    // Inicializar funcionalidades del navbar después de cargarlo
    setupNavbar()
    setupThemeToggle()

    console.log("Navbar cargado correctamente")
  } catch (error) {
    console.error("Error al cargar el navbar:", error)
    // Fallback: crear un navbar básico si falla la carga
    createFallbackNavbar()
  }
}

// Función para crear un navbar básico como fallback
function createFallbackNavbar() {
  const fallbackNavbar = `
    <header class="main-header">
        <div class="container">
            <div class="logo">
                <i class="fas fa-futbol"></i>
                <h1>Torneos de Fútbol</h1>
            </div>
            <button class="mobile-menu-toggle" id="mobile-menu-toggle">
                <i class="fas fa-bars"></i>
            </button>
            <nav class="main-nav" id="main-nav">
                <ul class="nav-list">
                    <li><a href="../../index.html"><i class="fas fa-home"></i> Inicio</a></li>
                    <li><a href="../torneos/index.html"><i class="fas fa-trophy"></i> Torneos</a></li>
                    <li><a href="../equipos/index.html"><i class="fas fa-users"></i> Equipos</a></li>
                    <li><a href="../jugadores/index.html"><i class="fas fa-user"></i> Jugadores</a></li>
                    <li><a href="../partidos/index.html"><i class="fas fa-futbol"></i> Partidos</a></li>
                </ul>
            </nav>
            <div class="header-actions">
                <button id="themeToggle" class="btn btn-icon">
                    <i class="fas fa-moon"></i>
                </button>
            </div>
        </div>
    </header>
  `

  document.body.insertAdjacentHTML("afterbegin", fallbackNavbar)
  setupNavbar()
  setupThemeToggle()
}

// Funciones para manejar el navbar
function setupNavbar() {
  // Manejar el menú móvil
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle")
  const mainNav = document.getElementById("main-nav")

  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener("click", () => {
      mainNav.classList.toggle("active")

      // Cambiar icono del botón
      const icon = mobileMenuToggle.querySelector("i")
      if (mainNav.classList.contains("active")) {
        icon.classList.remove("fa-bars")
        icon.classList.add("fa-times")
      } else {
        icon.classList.remove("fa-times")
        icon.classList.add("fa-bars")
      }
    })
  }

  // Cerrar menú móvil al hacer clic en un enlace
  const navLinks = document.querySelectorAll(".main-nav .nav-list a")
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (mainNav && mainNav.classList.contains("active")) {
        mainNav.classList.remove("active")
        const icon = mobileMenuToggle.querySelector("i")
        icon.classList.remove("fa-times")
        icon.classList.add("fa-bars")
      }
    })
  })

  // Marcar el enlace activo
  markActiveLink()
}

// 🔥 FUNCIÓN MEJORADA PARA MARCAR ENLACE ACTIVO
function markActiveLink() {
  const currentPath = window.location.pathname
  const navLinks = document.querySelectorAll(".main-nav .nav-list a")

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href")

    // Remover clase active de todos los enlaces
    link.classList.remove("active")

    // Determinar si el enlace debe estar activo
    if (currentPath.includes("/equipos/") && linkPath.includes("equipos")) {
      link.classList.add("active")
    } else if (currentPath.includes("/partidos/") && linkPath.includes("partidos")) {
      link.classList.add("active")
    } else if (currentPath.includes("/torneos/") && linkPath.includes("torneos")) {
      link.classList.add("active")
    } else if (currentPath.includes("/jugadores/") && linkPath.includes("jugadores")) {
      link.classList.add("active")
    } else if ((currentPath === "/" || currentPath.includes("index.html")) && linkPath.includes("index.html")) {
      link.classList.add("active")
    }
  })
}

// Función para configurar el cambio de tema
function setupThemeToggle() {
  const themeToggle = document.getElementById("themeToggle")
  if (!themeToggle) return

  const icon = themeToggle.querySelector("i")
  if (!icon) return

  function updateThemeIcon() {
    if (document.body.classList.contains("dark-mode")) {
      icon.classList.remove("fa-moon")
      icon.classList.add("fa-sun")
    } else {
      icon.classList.remove("fa-sun")
      icon.classList.add("fa-moon")
    }
  }

  themeToggle.addEventListener("click", (e) => {
    e.preventDefault()
    document.body.classList.toggle("dark-mode")

    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark")
    } else {
      localStorage.setItem("theme", "light")
    }

    updateThemeIcon()
  })

  // Aplicar tema guardado
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode")
  } else if (savedTheme === "light") {
    document.body.classList.remove("dark-mode")
  }

  updateThemeIcon()
}

// Inicializar cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
  // Solo cargar navbar dinámico si estamos en páginas internas
  const currentPath = window.location.pathname
  if (currentPath.includes("/pages/")) {
    loadNavbar()
  } else {
    console.log("Página principal detectada, usando navbar estático")
  }
})

// También exportar las funciones para uso manual si es necesario
window.NavbarUtils = {
  loadNavbar,
  setupNavbar,
  setupThemeToggle,
  markActiveLink,
}
