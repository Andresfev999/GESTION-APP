// Módulo para la gestión de posiciones
const PosicionesModule = {
    // Inicializar el módulo
    init: function() {
        if (document.getElementById('posiciones-container')) {
            this.initTorneoSelect();
        }
    },

    // Inicializar selector de torneo
    initTorneoSelect: async function() {
        const torneoSelect = document.getElementById('torneo-select');
        if (!torneoSelect) return;

        // Cargar opciones de torneos desde Firebase
        const torneos = await window.FirebaseDataStore.getTorneos();
        let opcionesTorneos = '<option value="">Selecciona un torneo</option>';

        torneos.forEach(torneo => {
            opcionesTorneos += `<option value="${torneo.id}">${torneo.nombre}</option>`;
        });

        torneoSelect.innerHTML = opcionesTorneos;

        // Evento de cambio de torneo
        torneoSelect.addEventListener('change', async () => {
            const torneoId = torneoSelect.value;
            if (torneoId) {
                await this.cargarTablaPosiciones(torneoId);
            } else {
                document.getElementById('posiciones-container').innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        Selecciona un torneo para ver su tabla de posiciones.
                    </div>
                `;
            }
        });
    },

    // Cargar tabla de posiciones
    cargarTablaPosiciones: async function(torneoId) {
        const posicionesContainer = document.getElementById('posiciones-container');
        const torneo = await window.FirebaseDataStore.getTorneo(torneoId);

        if (!torneo) {
            posicionesContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al cargar la información del torneo.
                </div>
            `;
            return;
        }

        // Calcular posiciones usando Firebase
        const posiciones = await window.FirebaseDataStore.calcularPosiciones(torneoId);

        if (!posiciones || posiciones.length === 0) {
            posicionesContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay datos suficientes para mostrar la tabla de posiciones de este torneo.
                </div>
            `;
            return;
        }

        // Mostrar tabla de posiciones
        let html = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-trophy"></i> ${torneo.nombre} - Tabla de Posiciones
                    </div>
                </div>
                <div class="card-content">
                    <div class="table-container">
                        <table class="tabla-posiciones">
                            <thead>
                                <tr>
                                    <th>Pos</th>
                                    <th>Equipo</th>
                                    <th class="text-center">PTS</th>
                                    <th class="text-center">PJ</th>
                                    <th class="text-center">PG</th>
                                    <th class="text-center">PE</th>
                                    <th class="text-center">PP</th>
                                    <th class="text-center">GF</th>
                                    <th class="text-center">GC</th>
                                    <th class="text-center">DIF</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        for (const equipo of posiciones) {
            const equipoObj = await window.FirebaseDataStore.getEquipo(equipo.id);
            if (equipoObj) {
                html += `
                    <tr class="${equipo.posicion <= 3 ? 'destacado' : ''}">
                        <td class="text-center">${equipo.posicion}</td>
                        <td>
                            <div class="equipo-nombre">
                                <img src="${equipoObj.escudo || '../../assets/img/default-shield.png'}" alt="${equipoObj.nombre}" class="equipo-escudo">
                                <span>${equipoObj.nombre}</span>
                            </div>
                        </td>
                        <td class="text-center font-bold">${equipo.puntos}</td>
                        <td class="text-center">${equipo.pj}</td>
                        <td class="text-center">${equipo.pg}</td>
                        <td class="text-center">${equipo.pe}</td>
                        <td class="text-center">${equipo.pp}</td>
                        <td class="text-center">${equipo.gf}</td>
                        <td class="text-center">${equipo.gc}</td>
                        <td class="text-center">${equipo.dif > 0 ? '+' + equipo.dif : equipo.dif}</td>
                    </tr>
                `;
            }
        }

        html += `
                            </tbody>
                        </table>
                    </div>
                    <div class="posiciones-leyenda mt-4">
                        <div class="leyenda-item">
                            <div class="leyenda-color destacado"></div>
                            <div class="leyenda-texto">Posiciones de clasificación</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        posicionesContainer.innerHTML = html;
    }
};

// Inicializar el módulo cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    PosicionesModule.init();
});