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
            console.log("Torneo seleccionado:", torneoId);
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

        console.log("initTorneoSelect ejecutado");
    },

    // Cargar tabla de posiciones
    cargarTablaPosiciones: async function(torneoId) {
        const posicionesContainer = document.getElementById('posiciones-container');
        posicionesContainer.innerHTML = '<div>Cargando...</div>';

        // Espera a que se calculen todas las posiciones
        const posiciones = await window.FirebaseDataStore.calcularPosiciones(torneoId);

        // Ahora sí, renderiza la tabla con los datos ya calculados
        this.renderTablaPosiciones(posiciones, posicionesContainer, torneoId);
    },

    // Renderizar tabla de posiciones
    renderTablaPosiciones: async function(posiciones, container, torneoId) {
        if (!posiciones || posiciones.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay datos suficientes para mostrar la tabla de posiciones de este torneo.
                </div>
            `;
            return;
        }

        // Mostrar tabla de posiciones
        let htmlPosiciones = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-trophy"></i> Tabla de Posiciones
                    </div>
                </div>
                <div class="card-content">
                    <div class="table-container">
                        <table class="tabla-posiciones">
                            <thead>
                                <tr>
                                    <th>Pos</th>
                                    <th>Equipo</th>
                                    <th class="text-center">PJ</th>
                                    <th class="text-center">PG</th>
                                    <th class="text-center">PE</th>
                                    <th class="text-center">PP</th>
                                    <th class="text-center">GF</th>
                                    <th class="text-center">GC</th>
                                    <th class="text-center">DIF</th>
                                    <th class="text-center">PTS</th>
                                </tr>
                            </thead>
                            <tbody>
`;

        for (const equipo of posiciones) {
            const equipoObj = await window.FirebaseDataStore.getEquipo(equipo.id);
            if (equipoObj) {
                htmlPosiciones += `
                    <tr class="${equipo.posicion <= 3 ? 'destacado' : ''}">
                        <td class="text-center">${equipo.posicion}</td>
                        <td>
                            <div class="equipo-nombre">
                                <img src="${equipoObj.escudo || '../../assets/img/default-shield.png'}" alt="${equipoObj.nombre}" class="equipo-escudo">
                                <span>${equipoObj.nombre}</span>
                            </div>
                        </td>
                        <td class="text-center">${equipo.pj}</td>
                        <td class="text-center">${equipo.pg}</td>
                        <td class="text-center">${equipo.pe}</td>
                        <td class="text-center">${equipo.pp}</td>
                        <td class="text-center">${equipo.gf}</td>
                        <td class="text-center">${equipo.gc}</td>
                        <td class="text-center">${equipo.dif > 0 ? '+' + equipo.dif : equipo.dif}</td>
                        <td class="text-center font-bold">${equipo.puntos}</td>
                    </tr>
                `;
            }
        }

        htmlPosiciones += `
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

        // Renderiza la tabla de posiciones normalmente (arriba)
        container.innerHTML = htmlPosiciones;

        // Luego, debajo, agrega un contenedor para las dos tablas secundarias
        container.innerHTML += `
          <div class="tablas-secundarias"></div>
        `;

        // Llama a ambas funciones y pásales el contenedor secundario
        const secundariasContainer = document.querySelector('.tablas-secundarias');
        await this.mostrarTablasSecundarias(torneoId, secundariasContainer);
    },

    // Mostrar ambas tablas secundarias: goleadores y arco menos vencido
    mostrarTablasSecundarias: async function(torneoId, container) {
        const htmlGoleadores = await this.generarTablaGoleadores(torneoId);
        const htmlArcoMenosVencido = await this.generarTablaArcoMenosVencido(torneoId);
        // Quita los div.card de las funciones y ponlos aquí
        container.innerHTML = `
            <div class="card mt-4">${htmlGoleadores}</div>
            <div class="card mt-4">${htmlArcoMenosVencido}</div>
        `;
    },

    // Generar tabla de goleadores (devuelve HTML)
    generarTablaGoleadores: async function(torneoId) {
        // Obtener todos los partidos del torneo
        const partidos = await window.FirebaseDataStore.getPartidosPorTorneo(torneoId);
        if (!partidos || partidos.length === 0) {
            return `
                <div class="alert alert-info mt-4">
                    <i class="fas fa-info-circle"></i>
                    No hay partidos para mostrar goleadores.
                </div>
            `;
        }

        // Acumular goles por jugador
        const golesPorJugador = {};
        for (const partido of partidos) {
            if (Array.isArray(partido.goleadores)) {
                partido.goleadores.forEach(gol => {
                    if (!golesPorJugador[gol.jugadorId]) {
                        golesPorJugador[gol.jugadorId] = 0;
                    }
                    golesPorJugador[gol.jugadorId] += gol.goles ? gol.goles : 1; // Si guardas cantidad, usa gol.goles, si no, suma 1
                });
            }
        }

        // Convertir a array y ordenar por goles
        const goleadoresArray = Object.entries(golesPorJugador)
            .map(([jugadorId, goles]) => ({ jugadorId, goles }))
            .sort((a, b) => b.goles - a.goles);

        if (goleadoresArray.length === 0) {
            return `
                <div class="alert alert-info mt-4">
                    <i class="fas fa-info-circle"></i>
                    No hay goles registrados en este torneo.
                </div>
            `;
        }

        // Obtener datos de los jugadores y equipos
        for (const goleador of goleadoresArray) {
            const jugador = await window.FirebaseDataStore.getJugador(goleador.jugadorId);
            goleador.nombre = jugador ? jugador.nombre : 'Jugador desconocido';
            goleador.equipoId = jugador ? jugador.equipo : '';
            if (goleador.equipoId) {
                const equipo = await window.FirebaseDataStore.getEquipo(goleador.equipoId);
                goleador.equipoNombre = equipo ? equipo.nombre : '';
                goleador.equipoEscudo = equipo ? equipo.escudo : '';
            } else {
                goleador.equipoNombre = '';
                goleador.equipoEscudo = '';
            }
        }

        // Renderizar tabla de goleadores
        let htmlGoleadores = `
            <div class="card-header">
                <div class="card-title">
                    <i class="fas fa-futbol"></i> Tabla de Goleadores
                </div>
            </div>
            <div class="card-content">
                <div class="table-container">
                    <table class="tabla-posiciones">
                        <thead>
                            <tr>
                                <th>Pos</th>
                                <th>Jugador</th>
                                <th>Equipo</th>
                                <th class="text-center">Goles</th>
                            </tr>
                        </thead>
                        <tbody>
    `;
        let pos = 1;
        for (const goleador of goleadoresArray) {
            htmlGoleadores += `
                <tr>
                    <td class="text-center">${pos++}</td>
                    <td>${goleador.nombre}</td>
                    <td>
                        <div class="equipo-nombre">
                            ${goleador.equipoEscudo ? `<img src="${goleador.equipoEscudo}" alt="${goleador.equipoNombre}" class="equipo-escudo">` : ''}
                            <span>${goleador.equipoNombre}</span>
                        </div>
                    </td>
                    <td class="text-center font-bold">${goleador.goles}</td>
                </tr>
            `;
        }
        htmlGoleadores += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        return htmlGoleadores;
    },

    // Generar tabla de arco menos vencido (devuelve HTML)
    generarTablaArcoMenosVencido: async function(torneoId) {
        // Obtener posiciones (ya calculadas)
        const posiciones = await window.FirebaseDataStore.calcularPosiciones(torneoId);
        if (!posiciones || posiciones.length === 0) {
            return `
                <div class="alert alert-info mt-4">
                    <i class="fas fa-info-circle"></i>
                    No hay datos para mostrar arcos menos vencidos.
                </div>
            `;
        }

        // Ordenar equipos por menos goles recibidos (GC)
        const equiposOrdenados = posiciones
            .filter(e => typeof e.gc === 'number')
            .sort((a, b) => a.gc - b.gc);

        // Obtener datos de porteros y equipos
        let tabla = `
            <div class="card mt-4 arco-menos-vencido">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-shield-alt"></i> Arco menos vencido
                    </div>
                </div>
                <div class="card-content">
                    <div class="table-container">
                        <table class="tabla-posiciones">
                            <thead>
                                <tr>
                                    <th>Pos</th>
                                    <th>Portero</th>
                                    <th>Equipo</th>
                                    <th class="text-center">Goles Recibidos</th>
                                </tr>
                            </thead>
                            <tbody>
        `;
        let pos = 1;
        for (const equipo of equiposOrdenados) {
            const equipoObj = await window.FirebaseDataStore.getEquipo(equipo.id);
            if (!equipoObj || !equipoObj.portero) continue;
            const portero = await window.FirebaseDataStore.getJugador(equipoObj.portero);
            tabla += `
                <tr>
                    <td class="text-center">${pos++}</td>
                    <td>${portero ? (portero.nombre + (portero.apellido ? ' ' + portero.apellido : '')) : 'Sin portero'}</td>
                    <td>
                        <div class="equipo-nombre">
                            ${equipoObj.escudo ? `<img src="${equipoObj.escudo}" alt="${equipoObj.nombre}" class="equipo-escudo">` : ''}
                            <span>${equipoObj.nombre}</span>
                        </div>
                    </td>
                    <td class="text-center font-bold">${equipo.gc}</td>
                </tr>
            `;
        }
        tabla += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        return tabla;
    }
};

// Inicializar el módulo cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    PosicionesModule.init();
    console.log("PosicionesModule cargado");
    console.log(">>> posiciones.js cargado <<<");
});



window.logoOrganizacion = null; // Valor por defecto

// Si tienes el logo en assets/img/logo-organizacion.png:
getBase64FromUrl('../../assets/img/logo-organizacion.png').then(base64 => {
    window.logoOrganizacion = base64;
});