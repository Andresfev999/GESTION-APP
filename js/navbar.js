document.addEventListener('DOMContentLoaded', function() {
    // Cargar el navbar desde la raíz
    fetch('/navbar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('navbar-placeholder').innerHTML = data;
            
            // Inicializar el menú móvil después de cargar el navbar
            const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
            const mainNav = document.getElementById('main-nav');
            
            if (mobileMenuToggle && mainNav) {
                mobileMenuToggle.addEventListener('click', function() {
                    mainNav.classList.toggle('active');
                    mobileMenuToggle.classList.toggle('active');
                    
                    // Cambiar icono del botón
                    const icon = mobileMenuToggle.querySelector('i');
                    if (mainNav.classList.contains('active')) {
                        icon.classList.remove('fa-bars');
                        icon.classList.add('fa-times');
                    } else {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                });
            }
            
            // Marcar el enlace activo
            const currentPath = window.location.pathname;
            const navLinks = document.querySelectorAll('.nav-list a');
            
            navLinks.forEach(link => {
                if (currentPath.includes(link.getAttribute('href'))) {
                    link.classList.add('active');
                }
            });
        });
});