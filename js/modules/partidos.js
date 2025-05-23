// Módulo para la gestión de partidos
const PartidosModule = {
    // Inicializar el módulo
    init: function() {
        // Cargar la lista de partidos si estamos en la página de partidos
        if (document.getElementById('partidos-proximos') || document.getElementById('partidos-finalizados')) {
            this.cargarPartidos();
            this.initFiltros();
        }

        // Inicializar el formulario de generación de calendario
        if (document.getElementById('generar-calendario-form')) {
            this.initFormCalendario();
        }

        // Inicializar el formulario de resultado
        if (document.getElementById('resultado-form')) {
            this.initFormResultado();
        }
    },

    // Cargar la lista de partidos
    cargarPartidos: async function(filtroTorneo = '', filtroEstado = '', filtroFecha = '') {
        const partidosProximosContainer = document.getElementById('partidos-proximos');
        const partidosFinalizadosContainer = document.getElementById('partidos-finalizados');
        let partidos = await window.FirebaseDataStore.getPartidos();

        // Aplicar filtros
        if (filtroTorneo) {
            partidos = partidos.filter(partido => partido.torneo == filtroTorneo);
        }

        if (filtroEstado) {
            partidos = partidos.filter(partido => partido.estado === filtroEstado);
        }

        if (filtroFecha) {
            partidos = partidos.filter(partido => partido.fecha === filtroFecha);
        }

        // Separar partidos por estado
        const partidosProximos = partidos.filter(p => p.estado === 'Próximo');
        const partidosFinalizados = partidos.filter(p => p.estado === 'Finalizado' && p.resultado);

        // Ordenar partidos por fecha
        partidosProximos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        partidosFinalizados.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        // Cargar partidos próximos
        if (partidosProximosContainer) {
            if (partidosProximos.length === 0) {
                partidosProximosContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        No hay partidos próximos programados.
                    </div>
                `;
            } else {
                // Agrupar partidos por torneo
                const partidosPorTorneo = this.agruparPartidosPorTorneo(partidosProximos);

                let html = '';
                for (const torneoId in partidosPorTorneo) {
                    const torneo = await window.FirebaseDataStore.getTorneo(torneoId);

                    if (torneo) {
                        html += `
                            <div class="card mb-4">
                                <div class="card-header">
                                    <div class="card-title">
                                        <i class="fas fa-trophy"></i> ${torneo.nombre}
                                    </div>
                                </div>
                                <div class="card-content">
                                    <div class="partidos-list">
                        `;

                        for (const partido of partidosPorTorneo[torneoId]) {
                            const equipoLocal = await window.FirebaseDataStore.getEquipo(partido.local);
                            const equipoVisitante = await window.FirebaseDataStore.getEquipo(partido.visitante);

                            if (equipoLocal && equipoVisitante) {
                                html += `
    <div class="partido-card">
        <div class="partido-fecha">
            <i class="fas fa-calendar"></i>
            ${new Date(partido.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
            ${partido.hora ? `<span class="partido-hora"><i class="fas fa-clock"></i> ${partido.hora}</span>` : ''}
        </div>
        <div class="partido-equipos partido-equipos-con-acciones">
            <div class="equipo-local">
                <img src="${equipoLocal.escudo || '../../assets/img/default-shield.png'}" alt="${equipoLocal.nombre}" class="equipo-logo-sm">
                <span>${equipoLocal.nombre}</span>
            </div>
            <div class="resultado">
                <span class="goles">${partido.resultado ? partido.resultado.golesLocal : ''}</span>
                <span class="separador">-</span>
                <span class="goles">${partido.resultado ? partido.resultado.golesVisitante : ''}</span>
            </div>
            <div class="equipo-visitante">
                <span>${equipoVisitante.nombre}</span>
                <img src="${equipoVisitante.escudo || '../../assets/img/default-shield.png'}" alt="${equipoVisitante.nombre}" class="equipo-logo-sm">
            </div>
            <div class="partido-acciones-horizontal">
                <button class="btn btn-sm btn-outline editar-fecha-btn" data-id="${partido.id}" data-fecha="${partido.fecha}">
                    <i class="fas fa-edit"></i> Editar fecha
                </button>
                <a href="resultado.html?id=${partido.id}" class="btn btn-sm btn-primary">Ingresar Resultado</a>
            </div>
        </div>
    </div>
`;
                            }
                        }

                        html += `
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }

                partidosProximosContainer.innerHTML = html;
            }
        }

        // Cargar partidos finalizados
        if (partidosFinalizadosContainer) {
            if (partidosFinalizados.length === 0) {
                partidosFinalizadosContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        No hay partidos finalizados.
                    </div>
                `;
            } else {
                // Agrupar partidos por torneo
                const partidosPorTorneo = this.agruparPartidosPorTorneo(partidosFinalizados);

                let html = '';
                for (const torneoId in partidosPorTorneo) {
                    const torneo = await window.FirebaseDataStore.getTorneo(torneoId);
                    if (torneo) {
                        html += `
                            <div class="card mb-4">
                                <div class="card-header">
                                    <div class="card-title">
                                        <i class="fas fa-trophy"></i> ${torneo.nombre}
                                    </div>
                                </div>
                                <div class="card-content">
                                    <div class="partidos-list">
                        `;

                        for (const partido of partidosPorTorneo[torneoId]) {
                            const equipoLocal = await window.FirebaseDataStore.getEquipo(partido.local);
                            const equipoVisitante = await window.FirebaseDataStore.getEquipo(partido.visitante);

                            if (equipoLocal && equipoVisitante && partido.resultado) {
                                html += `
                    <div class="partido-card">
                        <div class="partido-fecha">
                            <i class="fas fa-calendar-check"></i>
                            ${new Date(partido.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </div>
                        <div class="partido-equipos">
                            <div class="equipo-local">
                                <img src="${equipoLocal.escudo || '../../assets/img/default-shield.png'}" alt="${equipoLocal.nombre}" class="equipo-logo-sm">
                                <span>${equipoLocal.nombre}</span>
                            </div>
                            <div class="resultado">
                                <span class="goles">${partido.resultado.golesLocal}</span>
                                <span class="separador">-</span>
                                <span class="goles">${partido.resultado.golesVisitante}</span>
                            </div>
                            <div class="equipo-visitante">
                                <span>${equipoVisitante.nombre}</span>
                                <img src="${equipoVisitante.escudo || '../../assets/img/default-shield.png'}" alt="${equipoVisitante.nombre}" class="equipo-logo-sm">
                            </div>
                        </div>
                    </div>
                `;
                            }
                        }

                        html += `
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                }

                partidosFinalizadosContainer.innerHTML = html;
            }
        }
    },

    // Agrupar partidos por torneo
    agruparPartidosPorTorneo: function(partidos) {
        const partidosPorTorneo = {};
        partidos.forEach(partido => {
            if (!partidosPorTorneo[partido.torneo]) {
                partidosPorTorneo[partido.torneo] = [];
            }
            partidosPorTorneo[partido.torneo].push(partido);
        });
        return partidosPorTorneo;
    },

    // Inicializar filtros de partidos
    initFiltros: async function() {
        const filtroTorneo = document.getElementById('filtro-torneo');
        if (filtroTorneo) {
            const torneos = await window.FirebaseDataStore.getTorneos();
            let opcionesTorneos = '<option value="">Todos los torneos</option>';
            torneos.forEach(torneo => {
                opcionesTorneos += `<option value="${torneo.id}">${torneo.nombre}</option>`;
            });
            filtroTorneo.innerHTML = opcionesTorneos;
            filtroTorneo.addEventListener('change', () => {
                this.aplicarFiltros();
            });
        }

        const filtroEstado = document.getElementById('filtro-estado');
        if (filtroEstado) {
            filtroEstado.addEventListener('change', () => {
                this.aplicarFiltros();
            });
        }

        const filtroFecha = document.getElementById('filtro-fecha');
        if (filtroFecha) {
            filtroFecha.addEventListener('change', () => {
                this.aplicarFiltros();
            });
        }
    },

    // Aplicar filtros a la lista de partidos
    aplicarFiltros: function() {
        const filtroTorneo = document.getElementById('filtro-torneo');
        const filtroEstado = document.getElementById('filtro-estado');
        const filtroFecha = document.getElementById('filtro-fecha');

        const valorFiltroTorneo = filtroTorneo ? filtroTorneo.value : '';
        const valorFiltroEstado = filtroEstado ? filtroEstado.value : '';
        const valorFiltroFecha = filtroFecha ? filtroFecha.value : '';

        this.cargarPartidos(valorFiltroTorneo, valorFiltroEstado, valorFiltroFecha);
    },

    // Inicializar el formulario de generación de calendario
    initFormCalendario: async function() {
        const form = document.getElementById('generar-calendario-form');
        const torneoSelect = document.getElementById('torneo');

        // Cargar opciones de torneos
        if (torneoSelect) {
            const torneos = await window.FirebaseDataStore.getTorneos();
            let opcionesTorneos = '<option value="">Selecciona un torneo</option>';

            torneos.forEach(torneo => {
                opcionesTorneos += `<option value="${torneo.id}">${torneo.nombre} (${torneo.equipos ? torneo.equipos.length : 0} equipos)</option>`;
            });

            torneoSelect.innerHTML = opcionesTorneos;
        }

        // Verificar si hay un torneo preseleccionado en la URL
        const urlParams = new URLSearchParams(window.location.search);
        const torneoId = urlParams.get('torneo');
        if (torneoId && torneoSelect) {
            torneoSelect.value = torneoId;
            // Mostrar opciones de formato
            document.getElementById('formato-container').style.display = 'block';
            document.getElementById('btn-generar').disabled = false;
        }

        // Evento de envío del formulario
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.generarCalendario();
        });

        // Evento de cambio en el selector de torneo
        torneoSelect.addEventListener('change', function() {
            const formatoContainer = document.getElementById('formato-container');
            const btnGenerar = document.getElementById('btn-generar');
            if (formatoContainer && btnGenerar) {
                if (this.value) {
                    formatoContainer.style.display = 'block';
                    btnGenerar.disabled = false;
                } else {
                    formatoContainer.style.display = 'none';
                    btnGenerar.disabled = true;
                }
            }
        });
    },

    // Generar calendario de partidos
    generarCalendario: async function() {
        const torneoId = document.getElementById('torneo').value;
        const formato = document.querySelector('input[name="formato"]:checked').value;
        const fechaInicio = document.getElementById('fechaInicio').value;
        const finesSemana = document.getElementById('finesSemana').checked;
        const diasDescanso = parseInt(document.getElementById('diasDescanso').value);

        const opciones = { finesSemana, diasDescanso };

        // Llama a la función de Firebase
        const exito = await window.FirebaseDataStore.generarCalendario(torneoId, formato, fechaInicio, opciones);

        if (exito) {
            console.log('✅ Calendario generado y enviado a Firebase correctamente.');
            window.location.href = 'index.html';
        } else {
            console.error('❌ Error al generar el calendario. Verifica que el torneo tenga equipos asignados.');
            alert('Error al generar el calendario. Verifica que el torneo tenga equipos asignados.');
        }
    },

    // Inicializar el formulario de resultado
    initFormResultado: async function() {
        const form = document.getElementById('resultado-form');
        const partidoInfoContainer = document.getElementById('partido-info');

        // Obtener ID del partido de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const partidoId = urlParams.get('id');

        if (!partidoId) {
            window.location.href = 'index.html';
            return;
        }

        const partido = await window.FirebaseDataStore.getPartido(partidoId);
        if (!partido) {
            window.location.href = 'index.html';
            return;
        }

        // Mostrar información del partido
        const equipoLocal = await window.FirebaseDataStore.getEquipo(partido.local);
        const equipoVisitante = await window.FirebaseDataStore.getEquipo(partido.visitante);
        const torneo = await window.FirebaseDataStore.getTorneo(partido.torneo);

        if (equipoLocal && equipoVisitante && torneo) {
            // Mostrar detalles del partido
            partidoInfoContainer.innerHTML = `
                <div class="partido-header">
                    <div class="torneo-info">
                        <i class="fas fa-trophy"></i> ${torneo.nombre}
                    </div>
                    <div class="partido-fecha-hora">
                        <i class="fas fa-calendar"></i> ${new Date(partido.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        <span class="partido-hora"><i class="fas fa-clock"></i> ${partido.hora}</span>
                    </div>
                </div>
            `;

            // Mostrar formulario de resultado
            form.style.display = 'block';

            // Establecer información de equipos
            document.getElementById('escudo-local').src = equipoLocal.escudo || '../../assets/img/default-shield.png';
            document.getElementById('nombre-local').textContent = equipoLocal.nombre;
            document.getElementById('escudo-visitante').src = equipoVisitante.escudo || '../../assets/img/default-shield.png';
            document.getElementById('nombre-visitante').textContent = equipoVisitante.nombre;

            // Si ya hay un resultado, mostrarlo
            if (partido.resultado) {
                document.getElementById('goles-local').value = partido.resultado.golesLocal;
                document.getElementById('goles-visitante').value = partido.resultado.golesVisitante;
            }
        } else {
            partidoInfoContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al cargar la información del partido.
                </div>
            `;
        }

        // Evento de envío del formulario
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const golesLocal = document.getElementById('goles-local').value;
            const golesVisitante = document.getElementById('goles-visitante').value;
            const observaciones = document.getElementById('observaciones').value;

            // Registrar resultado en Firebase
            const resultado = await window.FirebaseDataStore.registrarResultado(partidoId, golesLocal, golesVisitante, observaciones);

            if (resultado) {
                window.location.href = 'index.html'; // Esto te regresa al index
            } else {
                alert('Error al guardar el resultado.');
            }
        });
    }
};

// Inicializar el módulo cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', async function() {
    await PartidosModule.init();
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
});

// Modal editar fecha
document.addEventListener('click', async function(e) {
    if (e.target.closest('.editar-fecha-btn')) {
        const btn = e.target.closest('.editar-fecha-btn');
        const partidoId = btn.getAttribute('data-id');
        const fechaActual = btn.getAttribute('data-fecha');
        document.getElementById('modal-partido-id').value = partidoId;
        document.getElementById('modal-nueva-fecha').value = fechaActual;
        document.getElementById('modal-editar-fecha').style.display = 'flex';
    }
    if (e.target.id === 'close-modal-fecha') {
        document.getElementById('modal-editar-fecha').style.display = 'none';
    }
});

// Guardar nueva fecha desde el modal
const formEditarFecha = document.getElementById('form-editar-fecha');
if (formEditarFecha) {
    formEditarFecha.addEventListener('submit', async function(e) {
        e.preventDefault();
        const partidoId = document.getElementById('modal-partido-id').value;
        const nuevaFecha = document.getElementById('modal-nueva-fecha').value;
        if (partidoId && nuevaFecha) {
            await window.FirebaseDataStore.updateFechaPartido(partidoId, nuevaFecha);
            document.getElementById('modal-editar-fecha').style.display = 'none';
            // Recargar la lista de partidos
            PartidosModule.cargarPartidos();
        }
    });
}

// Cambiar de pestaña entre Próximos y Finalizados
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        this.classList.add('active');
        const target = this.getAttribute('data-target');
        document.getElementById(target).classList.add('active');
    });
});

