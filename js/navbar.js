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
            setupThemeToggle(); // Llama después de insertar el HTML
            setupUserModal(); // ¡Esto es lo que hace funcionar el botón de usuario!
        } catch (e) {
            console.error("Error cargando navbar:", e);
        }
    }
});

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const icon = document.getElementById('theme-icon');
    function updateThemeIcon() {
        if (!icon) return;
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    }
    if (themeToggle) {
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
            updateThemeIcon();
        });
    }
    // Aplicar tema guardado al cargar la página
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    updateThemeIcon();
}

function setupUserModal() {
    const userIconBtn = document.getElementById('user-icon-btn');
    const loginBtn = document.getElementById('login-btn');
    const userModal = document.getElementById('user-modal');
    const closeUserModal = document.getElementById('close-user-modal');
    const modalUserName = document.getElementById('modal-user-name');
    const logoutBtnModal = document.getElementById('logout-btn-modal');

    // Mostrar icono solo si hay usuario autenticado
    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                if (userIconBtn) userIconBtn.style.display = 'inline-block';
                if (loginBtn) loginBtn.style.display = 'none';
                if (modalUserName) modalUserName.textContent = user.displayName || user.email;
            } else {
                if (userIconBtn) userIconBtn.style.display = 'none';
                if (loginBtn) loginBtn.style.display = 'inline-block';
            }
        });
    }

    // Abrir modal al hacer clic en el icono de usuario
    if (userIconBtn && userModal) {
        userIconBtn.addEventListener('click', function() {
            userModal.classList.add('show');
        });
    }

    // Cerrar modal al hacer clic en la X o fuera del modal
    if (closeUserModal && userModal) {
        closeUserModal.addEventListener('click', function() {
            userModal.classList.remove('show');
        });
        userModal.addEventListener('click', function(e) {
            if (e.target === userModal) {
                userModal.classList.remove('show');
            }
        });
    }

    // Logout
    if (logoutBtnModal) {
        logoutBtnModal.addEventListener('click', function() {
            if (window.firebase && firebase.auth) {
                firebase.auth().signOut().then(function() {
                    window.location.href = '/pages/autenticacion/login.html';
                });
            }
        });
    }

    // Ir a login
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            window.location.href = '/pages/autenticacion/login.html';
        });
    }
}