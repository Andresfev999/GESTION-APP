document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.getElementById('navbar');
    if (navbar) {
        // Aquí va tu HTML del navbar
        navbar.innerHTML = `
            <header class="main-header themed-navbar">
                <div class="container" style="display: flex; align-items: center; justify-content: center; position: relative;">
                    <span class="navbar-brand" style="font-size: 1.5rem; font-weight: bold; letter-spacing: 1px;">
                        Sistema de Gestión de Torneos de Fútbol
                    </span>
                    <button id="themeToggle" title="Cambiar tema"
                        style="position: absolute; right: 0; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; font-size: 1.4rem;">
                        <i id="theme-icon" class="fas fa-moon"></i>
                    </button>
                    <div id="user-info" style="display: none; align-items: center; gap: 0.5rem; position: absolute; right: 60px; top: 50%; transform: translateY(-50%);">
                        <span id="user-name" style="font-weight: 500;"></span>
                        <button id="logout-btn" class="btn btn-outline btn-sm" style="margin-left: 0.5rem;">
                            <i class="fas fa-sign-out-alt"></i> Cerrar sesión
                        </button>
                    </div>
                </div>
            </header>
        `;
    }

    // Espera un pequeño tiempo para asegurar que navbar.js ya insertó el HTML
    setTimeout(() => {
        setupThemeToggle();
        // Aquí puedes poner más inicializaciones dependientes del navbar
    }, 100);
});

document.addEventListener("DOMContentLoaded", async function() {
    const navbarContainer = document.getElementById("navbar-placeholder");
    if (navbarContainer) {
        let navbarPath = "";
        const currentPath = window.location.pathname;
        // Si estás en /pages/ usa ../../navbar.html, si no, usa navbar.html
        if (currentPath.includes("/pages/")) {
            navbarPath = "../../navbar.html";
        } else {
            navbarPath = "navbar.html";
        }
        try {
            const response = await fetch(navbarPath);
            if (!response.ok) throw new Error("No se pudo cargar el navbar");
            const navbarHTML = await response.text();
            navbarContainer.innerHTML = navbarHTML;
        } catch (e) {
            console.error("Error cargando navbar:", e);
        }
    }
});