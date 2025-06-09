// Funciones generales de la aplicación

// Función para alternar entre modo claro y oscuro


// Inicializar tema según preferencia guardada


// Inicializar cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    
    
    // Otros inicializadores de la aplicación pueden ir aquí

    if (window.firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
            // Selecciona todos los botones de editar, eliminar y guardar
            const editBtns = document.querySelectorAll('.btn-edit, .btn-editar');
            const deleteBtns = document.querySelectorAll('.btn-delete, .btn-eliminar');
            const saveBtns = document.querySelectorAll('.btn-save, .btn-guardar, .btn-primary[type="submit"]');

            if (!user) {
                // Si NO hay usuario autenticado, deshabilita los botones
                editBtns.forEach(btn => btn.disabled = true);
                deleteBtns.forEach(btn => btn.disabled = true);
                saveBtns.forEach(btn => btn.disabled = true);
            } else {
                // Si hay usuario, habilita los botones
                editBtns.forEach(btn => btn.disabled = false);
                deleteBtns.forEach(btn => btn.disabled = false);
                saveBtns.forEach(btn => btn.disabled = false);
            }
        });
    }
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