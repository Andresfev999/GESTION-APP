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

        // Inicializar el formulario de creación manual de partido
        if (document.getElementById('crear-partido-form')) {
            this.initFormCrearPartido();
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
                                let fechaPartido;
                                if (typeof partido.fecha === 'string') {
                                    // Asegura formato correcto y evita problemas de zona horaria
                                    const [year, month, day] = partido.fecha.split('-');
                                    fechaPartido = new Date(Number(year), Number(month) - 1, Number(day));
                                } else {
                                    fechaPartido = new Date(partido.fecha);
                                }
                                const fechaFormateada = fechaPartido.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

                                html += `
<div class="partido-card">
    <div class="partido-fecha">
        <i class="fas fa-calendar"></i>
        ${fechaFormateada}
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
                                let fechaPartido;
                                if (typeof partido.fecha === 'string') {
                                    // Asegura formato correcto y evita problemas de zona horaria
                                    const [year, month, day] = partido.fecha.split('-');
                                    fechaPartido = new Date(Number(year), Number(month) - 1, Number(day));
                                } else {
                                    fechaPartido = new Date(partido.fecha);
                                }
                                const fechaFormateada = fechaPartido.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });

                                html += `
                <div class="partido-card">
                    <div class="partido-fecha">
                        <i class="fas fa-calendar-check"></i>
                        ${fechaFormateada}
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
        // Guardar IDs de equipos en dataset para uso posterior
        partidoInfoContainer.dataset.equipoLocal = equipoLocal.id;
        partidoInfoContainer.dataset.equipoVisitante = equipoVisitante.id;

        // Mostrar detalles del partido
        partidoInfoContainer.innerHTML = `
            <div class="partido-header">
                <div class="torneo-info">
                    <i class="fas fa-trophy"></i> ${torneo.nombre}
                </div>
                <div class="partido-fecha-hora">
                    <i class="fas fa-calendar"></i> ${(() => {
                        if (typeof partido.fecha === 'string') {
                            const [year, month, day] = partido.fecha.split('-');
                            return new Date(Number(year), Number(month) - 1, Number(day))
                                .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                        } else {
                            return new Date(partido.fecha)
                                .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                        }
                    })()}
                    <span class="partido-hora"><i class="fas fa-clock"></i> ${partido.hora || ''}</span>
                </div>
            </div>
        `;

        // Mostrar formulario de resultado
        if (form) form.style.display = 'block';

        // Establecer información de equipos
        const escudoLocal = document.getElementById('escudo-local');
        const nombreLocal = document.getElementById('nombre-local');
        const escudoVisitante = document.getElementById('escudo-visitante');
        const nombreVisitante = document.getElementById('nombre-visitante');
        if (escudoLocal) escudoLocal.src = equipoLocal.escudo || '../../assets/img/default-shield.png';
        if (nombreLocal) nombreLocal.textContent = equipoLocal.nombre;
        if (escudoVisitante) escudoVisitante.src = equipoVisitante.escudo || '../../assets/img/default-shield.png';
        if (nombreVisitante) nombreVisitante.textContent = equipoVisitante.nombre;

        // Cargar jugadores de ambos equipos
        const jugadoresLocal = await window.FirebaseDataStore.getJugadoresPorEquipo(partido.local) || [];
        const jugadoresVisitante = await window.FirebaseDataStore.getJugadoresPorEquipo(partido.visitante) || [];

        // Llenar selectores de jugadores local
        const selectorLocal = document.querySelector('.jugador-select[data-equipo="local"]');
        let opcionesLocal = '<option value="">Seleccionar jugador</option>';
        if (jugadoresLocal.length > 0) {
            jugadoresLocal.forEach(jugador => {
                opcionesLocal += `<option value="${jugador.id}">${jugador.nombre}</option>`;
            });
        } else {
            opcionesLocal = '<option value="">No se encontraron jugadores para este equipo</option>';
        }
        if (selectorLocal) selectorLocal.innerHTML = opcionesLocal;

        // Llenar selectores de jugadores visitante
        const selectorVisitante = document.querySelector('.jugador-select[data-equipo="visitante"]');
        let opcionesVisitante = '<option value="">Seleccionar jugador</option>';
        if (jugadoresVisitante.length > 0) {
            jugadoresVisitante.forEach(jugador => {
                opcionesVisitante += `<option value="${jugador.id}">${jugador.nombre}</option>`;
            });
        } else {
            opcionesVisitante = '<option value="">No se encontraron jugadores para este equipo</option>';
        }
        if (selectorVisitante) selectorVisitante.innerHTML = opcionesVisitante;

        // Agregar event listeners para los botones de agregar goleador
        document.querySelectorAll('.add-goleador').forEach(btn => {
            btn.addEventListener('click', function() {
                const equipo = this.dataset.equipo;
                const container = document.getElementById(`goleadores-${equipo}`);
                const template = container.querySelector('.goleador-input').cloneNode(true);

                // Limpiar valores del clon
                template.querySelector('select').value = '';
                template.querySelector('input').value = '';

                // Agregar botón de eliminar
                const btnEliminar = document.createElement('button');
                btnEliminar.type = 'button';
                btnEliminar.className = 'btn btn-sm btn-outline remove-goleador';
                btnEliminar.innerHTML = '<i class="fas fa-minus"></i>';
                btnEliminar.onclick = function() {
                    this.parentElement.remove();
                };
                template.appendChild(btnEliminar);

                // Llenar el select de jugadores en el clon
                const select = template.querySelector('select');
                let opciones = '<option value="">Seleccionar jugador</option>';
                const jugadores = equipo === 'local' ? jugadoresLocal : jugadoresVisitante;
                if (jugadores.length > 0) {
                    jugadores.forEach(jugador => {
                        opciones += `<option value="${jugador.id}">${jugador.nombre}</option>`;
                    });
                } else {
                    opciones = '<option value="">No se encontraron jugadores para este equipo</option>';
                }
                select.innerHTML = opciones;

                container.appendChild(template);
            });
        });

        // Evento de envío del formulario
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const golesLocal = parseInt(document.getElementById('goles-local').value) || 0;
                const golesVisitante = parseInt(document.getElementById('goles-visitante').value) || 0;
                const observaciones = document.getElementById('observaciones').value;

                // Recolectar goles de jugadores locales
                const golesJugadoresLocal = [];
                document.querySelectorAll('#goleadores-local .goleador-input').forEach(div => {
                    const jugadorId = div.querySelector('select').value;
                    const goles = parseInt(div.querySelector('input').value) || 0;
                    if (jugadorId && goles > 0) {
                        golesJugadoresLocal.push({ jugadorId, goles });
                    }
                });

                // Recolectar goles de jugadores visitantes
                const golesJugadoresVisitante = [];
                document.querySelectorAll('#goleadores-visitante .goleador-input').forEach(div => {
                    const jugadorId = div.querySelector('select').value;
                    const goles = parseInt(div.querySelector('input').value) || 0;
                    if (jugadorId && goles > 0) {
                        golesJugadoresVisitante.push({ jugadorId, goles });
                    }
                });

                // Validar que la suma de goles individuales coincida con el total
                const totalGolesLocalIndividual = golesJugadoresLocal.reduce((sum, g) => sum + g.goles, 0);
                const totalGolesVisitanteIndividual = golesJugadoresVisitante.reduce((sum, g) => sum + g.goles, 0);

                if (totalGolesLocalIndividual !== golesLocal || totalGolesVisitanteIndividual !== golesVisitante) {
                    alert('La suma de goles individuales no coincide con el total del equipo');
                    return;
                }

                // Registrar resultado y goles de jugadores
                const resultado = await window.FirebaseDataStore.registrarResultado(
                    partidoId,
                    golesLocal,
                    golesVisitante,
                    observaciones,
                    golesJugadoresLocal,
                    golesJugadoresVisitante
                );

                if (resultado) {
                    window.location.href = 'index.html';
                } else {
                    alert('Error al guardar el resultado.');
                }
            });
        }
    } else {
        partidoInfoContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Error al cargar la información del partido.
            </div>
        `;
    }
},

    // NUEVO: Inicializar el formulario de creación manual de partido
    initFormCrearPartido: async function() {
        const form = document.getElementById('crear-partido-form');
        const torneoSelect = document.getElementById('torneo');
        const equipoLocalSelect = document.getElementById('equipoLocal'); // <--- corregido
        const equipoVisitanteSelect = document.getElementById('equipoVisitante'); // <--- corregido

        // Cargar torneos
        if (torneoSelect) {
            const torneos = await window.FirebaseDataStore.getTorneos();
            let opcionesTorneos = '<option value="">Selecciona un torneo</option>';
            torneos.forEach(torneo => {
                opcionesTorneos += `<option value="${torneo.id}">${torneo.nombre}</option>`;
            });
            torneoSelect.innerHTML = opcionesTorneos;

            // Cuando se selecciona un torneo, cargar equipos
            torneoSelect.addEventListener('change', async function() {
                const torneoId = this.value;
                if (torneoId) {
                    const torneo = await window.FirebaseDataStore.getTorneo(torneoId);
                    if (torneo && torneo.equipos) {
                        let opcionesEquipos = '<option value="">Selecciona equipo</option>';
                        for (const equipoId of torneo.equipos) {
                            const equipo = await window.FirebaseDataStore.getEquipo(equipoId);
                            if (equipo) {
                                opcionesEquipos += `<option value="${equipo.id}">${equipo.nombre}</option>`;
                            }
                        }
                        equipoLocalSelect.innerHTML = opcionesEquipos;
                        equipoVisitanteSelect.innerHTML = opcionesEquipos;
                    }
                } else {
                    equipoLocalSelect.innerHTML = '<option value="">Selecciona equipo</option>';
                    equipoVisitanteSelect.innerHTML = '<option value="">Selecciona equipo</option>';
                }
            });
        }

        // Validar que no se seleccione el mismo equipo en local y visitante
        equipoLocalSelect.addEventListener('change', function() {
            const local = this.value;
            Array.from(equipoVisitanteSelect.options).forEach(opt => {
                opt.disabled = (opt.value && opt.value === local);
            });
        });
        equipoVisitanteSelect.addEventListener('change', function() {
            const visitante = this.value;
            Array.from(equipoLocalSelect.options).forEach(opt => {
                opt.disabled = (opt.value && opt.value === visitante);
            });
        });

        // Evento de envío del formulario
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const torneo = torneoSelect.value;
            const local = equipoLocalSelect.value;
            const visitante = equipoVisitanteSelect.value;
            const fecha = document.getElementById('fecha').value;
            const hora = document.getElementById('hora').value;

            if (!torneo || !local || !visitante || !fecha || !hora) {
                alert('Completa todos los campos.');
                return;
            }
            if (local === visitante) {
                alert('El equipo local y visitante no pueden ser el mismo.');
                return;
            }

            // Guardar partido en Firebase
            const exito = await window.FirebaseDataStore.crearPartido({
                torneo,
                local,
                visitante,
                fecha,
                hora,
                estado: 'Próximo'
            });

            if (exito) {
                window.location.href = 'index.html';
            } else {
                alert('Error al crear el partido.');
            }
        });
    },

    // Función para cargar jugadores por equipo
    cargarJugadoresPorEquipo: async function(equipoId) {
        try {
            const jugadores = await window.FirebaseDataStore.getJugadoresPorEquipo(equipoId);
            return jugadores || [];
        } catch (error) {
            console.error('Error al cargar jugadores:', error);
            return [];
        }
    },

    // Función para actualizar los selectores de jugadores
    actualizarSelectoresJugadores: async function(equipoLocalId, equipoVisitanteId) {
        const selectoresLocal = document.querySelectorAll('.jugadores-local select');
        const selectoresVisitante = document.querySelectorAll('.jugadores-visitante select');
        
        // Cargar jugadores del equipo local
        if (equipoLocalId && selectoresLocal.length > 0) {
            const jugadoresLocal = await this.cargarJugadoresPorEquipo(equipoLocalId);
            let opcionesLocal = '<option value="">Seleccionar jugador</option>';
            jugadoresLocal.forEach(jugador => {
                opcionesLocal += `<option value="${jugador.id}">${jugador.nombre} ${jugador.apellido}</option>`;
            });
            
            selectoresLocal.forEach(select => {
                if (select) select.innerHTML = opcionesLocal;
            });
        }
        
        // Cargar jugadores del equipo visitante
        if (equipoVisitanteId && selectoresVisitante.length > 0) {
            const jugadoresVisitante = await this.cargarJugadoresPorEquipo(equipoVisitanteId);
            let opcionesVisitante = '<option value="">Seleccionar jugador</option>';
            jugadoresVisitante.forEach(jugador => {
                opcionesVisitante += `<option value="${jugador.id}">${jugador.nombre} ${jugador.apellido}</option>`;
            });
            
            selectoresVisitante.forEach(select => {
                if (select) select.innerHTML = opcionesVisitante;
            });
        }
    },

    // Función para agregar campo de gol
    agregarCampoGol: function(tipo) {
        const container = document.getElementById(`goles-${tipo}`);
        if (!container) return; // Verifica que el contenedor exista

        const contadorGoles = container.querySelectorAll('.gol-item').length;
        
        const nuevoGol = document.createElement('div');
        nuevoGol.className = 'gol-item';
        nuevoGol.innerHTML = `
            <select name="jugador-${tipo}[]" class="form-control" required>
                <option value="">Seleccionar jugador</option>
            </select>
            <input type="number" name="minuto-${tipo}[]" class="form-control minuto-input" 
                   placeholder="Min" min="1" max="120" required>
            <button type="button" class="btn btn-sm btn-danger" onclick="PartidosModule.eliminarCampoGol(this)">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        container.appendChild(nuevoGol);
        
        // Actualizar opciones del nuevo selector
        const partidoInfo = document.getElementById('partido-info');
        if (!partidoInfo) return;
        const equipoLocalId = partidoInfo.dataset.equipoLocal;
        const equipoVisitanteId = partidoInfo.dataset.equipoVisitante;
        
        if (tipo === 'local') {
            this.cargarJugadoresPorEquipo(equipoLocalId).then(jugadores => {
                const select = nuevoGol.querySelector('select');
                if (select) {
                    jugadores.forEach(jugador => {
                        const option = document.createElement('option');
                        option.value = jugador.id;
                        option.textContent = `${jugador.nombre} ${jugador.apellido}`;
                        select.appendChild(option);
                    });
                }
            });
        } else {
            this.cargarJugadoresPorEquipo(equipoVisitanteId).then(jugadores => {
                const select = nuevoGol.querySelector('select');
                if (select) {
                    jugadores.forEach(jugador => {
                        const option = document.createElement('option');
                        option.value = jugador.id;
                        option.textContent = `${jugador.nombre} ${jugador.apellido}`;
                        select.appendChild(option);
                    });
                }
            });
        }
    },

    // Función para eliminar campo de gol
    eliminarCampoGol: function(button) {
        const golItem = button.closest('.gol-item');
        golItem.remove();
        
        // Actualizar contador de goles
        const container = button.closest('.goles-container');
        const tipo = container.id.includes('local') ? 'local' : 'visitante';
        const input = document.getElementById(`goles-${tipo}`);
        const cantidadGoles = container.querySelectorAll('.gol-item').length;
        input.value = cantidadGoles;
    },

    // Función para actualizar contador de goles
    actualizarContadorGoles: function(tipo) {
        const container = document.getElementById(`goles-${tipo}`);
        const input = document.getElementById(`goles-${tipo}`);
        const cantidadGoles = container.querySelectorAll('.gol-item').length;
        input.value = cantidadGoles;
    },

    // Función para recopilar información de goleadores
    recopilarGoleadores: function() {
        const goleadores = [];
        
        // Goles del equipo local
        const golesLocal = document.querySelectorAll('#goles-local .gol-item');
        golesLocal.forEach(item => {
            const jugador = item.querySelector('select').value;
            const minuto = item.querySelector('input[name*="minuto"]').value;
            if (jugador && minuto) {
                goleadores.push({
                    jugadorId: jugador,
                    minuto: parseInt(minuto),
                    equipo: 'local'
                });
            }
        });
        
        // Goles del equipo visitante
        const golesVisitante = document.querySelectorAll('#goles-visitante .gol-item');
        golesVisitante.forEach(item => {
            const jugador = item.querySelector('select').value;
            const minuto = item.querySelector('input[name*="minuto"]').value;
            if (jugador && minuto) {
                goleadores.push({
                    jugadorId: jugador,
                    minuto: parseInt(minuto),
                    equipo: 'visitante'
                });
            }
        });
        
        return goleadores;
    },

    // Función para cargar goleadores existentes
    cargarGoleadoresExistentes: function(goleadores) {
        goleadores.forEach(gol => {
            this.agregarCampoGol(gol.equipo);
            const container = document.getElementById(`goles-${gol.equipo}`);
            const ultimoItem = container.lastElementChild;
            const select = ultimoItem.querySelector('select');
            const inputMinuto = ultimoItem.querySelector('input[name*="minuto"]');
            
            select.value = gol.jugadorId;
            inputMinuto.value = gol.minuto;
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