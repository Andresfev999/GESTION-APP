// Adaptador para compatibilidad entre localStorage y Firebase
const DataStore = {
    // Almacén de datos actual
    currentStore: null,
    
    // Inicializar el almacén de datos
    init: function() {
        // Verificar si se ha configurado Firebase
        const FirebaseDataStore = window.FirebaseDataStore; // Declare FirebaseDataStore here
        if (typeof FirebaseDataStore !== 'undefined') {
            this.currentStore = FirebaseDataStore;
            this.currentStore.init();
            console.log("DataStore inicializado con Firebase");
        } else {
            console.error("No se ha encontrado un almacén de datos válido");
        }
    },
    
    // Guardar torneo
    saveTorneo: async function(torneo) {
        if (!this.currentStore) this.init();
        return await this.currentStore.saveTorneo(torneo);
    },
    
    // Obtener todos los torneos
    getTorneos: async function() {
        if (!this.currentStore) this.init();
        return await this.currentStore.getTorneos();
    },
    
    // Obtener torneo por ID
    getTorneo: async function(torneoId) {
        if (!this.currentStore) this.init();
        return await this.currentStore.getTorneo(torneoId);
    },
    
    // Eliminar torneo
    deleteTorneo: async function(torneoId) {
        if (!this.currentStore) this.init();
        return await this.currentStore.deleteTorneo(torneoId);
    },
    
    // Guardar equipo
    saveEquipo: async function(equipo) {
        if (!this.currentStore) this.init();
        return await this.currentStore.saveEquipo(equipo);
    },
    
    // Obtener todos los equipos
    getEquipos: async function() {
        if (!this.currentStore) this.init();
        return await this.currentStore.getEquipos();
    },
    
    // Obtener equipo por ID
    getEquipo: async function(equipoId) {
        if (!this.currentStore) this.init();
        return await this.currentStore.getEquipo(equipoId);
    },
    
    // Eliminar equipo
    deleteEquipo: async function(equipoId) {
        if (!this.currentStore) this.init();
        return await this.currentStore.deleteEquipo(equipoId);
    },
    
    // Guardar jugador
    saveJugador: async function(jugador) {
        if (!this.currentStore) this.init();
        return await this.currentStore.saveJugador(jugador);
    },
    
    // Obtener todos los jugadores
    getJugadores: async function() {
        if (!this.currentStore) this.init();
        return await this.currentStore.getJugadores();
    },
    
    // Obtener jugador por ID
    getJugador: async function(jugadorId) {
        if (!this.currentStore) this.init();
        return await this.currentStore.getJugador(jugadorId);
    },
    
    // Eliminar jugador
    deleteJugador: async function(jugadorId) {
        if (!this.currentStore) this.init();
        return await this.currentStore.deleteJugador(jugadorId);
    },
    
    // Guardar partido
    savePartido: async function(partido) {
        if (!this.currentStore) this.init();
        return await this.currentStore.savePartido(partido);
    },
    
    // Obtener todos los partidos
    getPartidos: async function() {
        if (!this.currentStore) this.init();
        return await this.currentStore.getPartidos();
    },
    
    // Obtener partido por ID
    getPartido: async function(partidoId) {
        if (!this.currentStore) this.init();
        return await this.currentStore.getPartido(partidoId);
    },
    
    // Eliminar partido
    deletePartido: async function(partidoId) {
        if (!this.currentStore) this.init();
        return await this.currentStore.deletePartido(partidoId);
    },
    
    // Escuchar actualizaciones
    listenForUpdates: function(callback) {
        // Implementación básica para compatibilidad
        document.addEventListener('datastore-update', callback);
    }
};

// Hacer disponible el DataStore globalmente
window.DataStore = DataStore;