// Funciones generales de la aplicación

// Función para alternar entre modo claro y oscuro
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    const isDarkMode = body.classList.toggle('dark-mode');
    
    // Actualizar icono del botón
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            if (isDarkMode) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }
    }
    
    // Guardar preferencia en localStorage
    localStorage.setItem('dark-mode', isDarkMode ? 'true' : 'false');
}

// Inicializar tema según preferencia guardada
function initTheme() {
    const isDarkMode = localStorage.getItem('dark-mode') === 'true';
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    if (isDarkMode) {
        body.classList.add('dark-mode');
        
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            }
        }
    }
    
    // Añadir evento al botón de alternar tema
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tema
    initTheme();
    
    // Otros inicializadores de la aplicación pueden ir aquí
});

// Función para mostrar notificaciones
window.showNotification = function(message, type = 'info', duration = 3000) {
    // Elimina notificaciones previas
    let old = document.querySelector('.notification');
    if (old) old.remove();

    // Crea el elemento
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);

    // Forzar reflow para animación
    void notif.offsetWidth;
    notif.classList.add('show');

    // Ocultar después de un tiempo
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, duration);
};