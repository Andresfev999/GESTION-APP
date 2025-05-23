// Módulo para la generación y gestión de calendarios de partidos
const CalendarioModule = {
    // Inicializar el módulo
    init: function() {
        // Inicializar visualización de calendario si estamos en la página correspondiente
        if (document.getElementById('calendario-container')) {
            this.initCalendarioView();
        }
        
        // Inicializar editor de calendario si estamos en la página correspondiente
        if (document.getElementById('editar-calendario-form')) {
            this.initCalendarioEditor();
        }
    },
    
    // Inicializar vista de calendario
    initCalendarioView: function() {
        const torneoSelect = document.getElementById('torneo-select');
        if (!torneoSelect) return;
        
        // Cargar opciones de torneos
        const torneos = window.DataStore.getTorneos();
        let opcionesTorneos = '<option value="">Selecciona un torneo</option>';
        
        torneos.forEach(torneo => {
            opcionesTorneos += `<option value="${torneo.id}">${torneo.nombre}</option>`;
        });
        
        torneoSelect.innerHTML = opcionesTorneos;
        
        // Evento de cambio de torneo
        torneoSelect.addEventListener('change', () => {
            const torneoId = torneoSelect.value;
            if (torneoId) {
                this.cargarCalendario(torneoId);
            } else {
                document.getElementById('calendario-container').innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        Selecciona un torneo para ver su calendario.
                    </div>
                `;
            }
        });
    },
    
    // Cargar calendario de un torneo
    cargarCalendario: function(torneoId) {
        const calendarioContainer = document.getElementById('calendario-container');
        const torneo = window.DataStore.getTorneo(torneoId);
        
        if (!torneo) {
            calendarioContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al cargar la información del torneo.
                </div>
            `;
            return;
        }
        
        // Obtener partidos del torneo
        const partidos = window.DataStore.getPartidosPorTorneo(torneoId);
        
        if (partidos.length === 0) {
            calendarioContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay partidos programados para este torneo.
                </div>
                <div class="text-center mt-4">
                    <a href="../partidos/generar.html?torneo=${torneoId}" class="btn btn-primary">
                        <i class="fas fa-calendar"></i> Generar Calendario
                    </a>
                </div>
            `;
            return;
        }
        
        // Agrupar partidos por jornada
        const partidosPorJornada = this.agruparPartidosPorJornada(partidos);
        
        // Mostrar calendario
        let html = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <i class="fas fa-calendar"></i> Calendario de ${torneo.nombre}
                    </div>
                    <div class="card-actions">
                        <a href="../partidos/editar-calendario.html?torneo=${torneoId}" class="btn btn-sm btn-outline">
                            <i class="fas fa-edit"></i> Editar Calendario
                        </a>
                    </div>
                </div>
                <div class="card-content">
                    <div class="calendario-tabs">
                        <div class="tabs">
        `;
        
        // Crear tabs para cada jornada
        Object.keys(partidosPorJornada).forEach((jornada, index) => {
            html += `
                <div class="tab ${index === 0 ? 'active' : ''}" data-target="jornada-${jornada}">
                    Jornada ${jornada}
                </div>
            `;
        });
        
        html += `
                        </div>
                        <div class="tab-contents">
        `;
        
        // Crear contenido para cada jornada
        Object.keys(partidosPorJornada).forEach((jornada, index) => {
            html += `
                <div id="jornada-${jornada}" class="tab-content ${index === 0 ? 'active' : ''}">
                    <div class="jornada-info">
                        <h3>Jornada ${jornada}</h3>
                        <div class="jornada-fechas">
                            ${this.obtenerRangoFechasJornada(partidosPorJornada[jornada])}
                        </div>
                    </div>
                    <div class="partidos-list">
            `;
            
            // Mostrar partidos de la jornada
            partidosPorJornada[jornada].forEach(partido => {
                const equipoLocal = window.DataStore.getEquipo(partido.local);
                const equipoVisitante = window.DataStore.getEquipo(partido.visitante);
                
                if (equipoLocal && equipoVisitante) {
                    // Determinar si el partido ya se jugó
                    const esPartidoJugado = partido.estado === 'Finalizado' && partido.resultado;
                    
                    html += `
                        <div class="partido-card ${esPartidoJugado ? 'partido-jugado' : ''}">
                            <div class="partido-fecha">
                                <i class="fas fa-calendar"></i>
                                ${new Date(partido.fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                <span class="partido-hora">${partido.hora}</span>
                            </div>
                            <div class="partido-equipos">
                                <div class="equipo-local">
                                    <img src="${equipoLocal.escudo || '../../assets/img/default-shield.png'}" alt="${equipoLocal.nombre}" class="equipo-logo-sm">
                                    <span>${equipoLocal.nombre}</span>
                                </div>
                    `;
                    
                    if (esPartidoJugado) {
                        html += `
                                <div class="resultado">
                                    <span class="goles">${partido.resultado.golesLocal}</span>
                                    <span class="separador">-</span>
                                    <span class="goles">${partido.resultado.golesVisitante}</span>
                                </div>
                        `;
                    } else {
                        html += `
                                <div class="vs">VS</div>
                        `;
                    }
                    
                    html += `
                                <div class="equipo-visitante">
                                    <span>${equipoVisitante.nombre}</span>
                                    <img src="${equipoVisitante.escudo || '../../assets/img/default-shield.png'}" alt="${equipoVisitante.nombre}" class="equipo-logo-sm">
                                </div>
                            </div>
                            <div class="partido-acciones">
                    `;
                    
                    if (esPartidoJugado) {
                        html += `
                                <span class="badge badge-success">Finalizado</span>
                        `;
                    } else {
                        html += `
                                <a href="../partidos/resultado.html?id=${partido.id}" class="btn btn-sm btn-primary">Ingresar Resultado</a>
                        `;
                    }
                    
                    html += `
                            </div>
                        </div>
                    `;
                }
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += `
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        calendarioContainer.innerHTML = html;
        
        // Inicializar tabs
        this.initTabs();
    },
    
    // Agrupar partidos por jornada
    agruparPartidosPorJornada: function(partidos) {
        const partidosPorJornada = {};
        
        partidos.forEach(partido => {
            if (!partidosPorJornada[partido.jornada]) {
                partidosPorJornada[partido.jornada] = [];
            }
            partidosPorJornada[partido.jornada].push(partido);
        });
        
        // Ordenar partidos por fecha dentro de cada jornada
        for (const jornada in partidosPorJornada) {
            partidosPorJornada[jornada].sort((a, b) => {
                // Primero ordenar por fecha
                const fechaA = new Date(a.fecha);
                const fechaB = new Date(b.fecha);
                if (fechaA.getTime() !== fechaB.getTime()) {
                    return fechaA - fechaB;
                }
                // Si las fechas son iguales, ordenar por hora
                return a.hora.localeCompare(b.hora);
            });
        }
        
        return partidosPorJornada;
    },
    
    // Obtener rango de fechas de una jornada
    obtenerRangoFechasJornada: function(partidos) {
        if (!partidos || partidos.length === 0) return '';
        
        // Encontrar la fecha más temprana y la más tardía
        const fechas = partidos.map(p => new Date(p.fecha));
        const fechaInicio = new Date(Math.min(...fechas));
        const fechaFin = new Date(Math.max(...fechas));
        
        // Si todas las fechas son iguales, mostrar solo una fecha
        if (fechaInicio.getTime() === fechaFin.getTime()) {
            return fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        
        // Si son diferentes, mostrar el rango
        return `${fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} al ${fechaFin.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    },
    
    // Inicializar editor de calendario
    initCalendarioEditor: function() {
        const form = document.getElementById('editar-calendario-form');
        const torneoSelect = document.getElementById('torneo-select');
        
        // Cargar opciones de torneos
        if (torneoSelect) {
            const torneos = window.DataStore.getTorneos();
            let opcionesTorneos = '<option value="">Selecciona un torneo</option>';
            
            torneos.forEach(torneo => {
                opcionesTorneos += `<option value="${torneo.id}">${torneo.nombre}</option>`;
            });
            
            torneoSelect.innerHTML = opcionesTorneos;
            
            // Verificar si hay un torneo preseleccionado en la URL
            const urlParams = new URLSearchParams(window.location.search);
            const torneoId = urlParams.get('torneo');
            if (torneoId) {
                torneoSelect.value = torneoId;
                this.cargarPartidosEdicion(torneoId);
            }
            
            // Evento de cambio de torneo
            torneoSelect.addEventListener('change', () => {
                const torneoId = torneoSelect.value;
                if (torneoId) {
                    this.cargarPartidosEdicion(torneoId);
                } else {
                    document.getElementById('partidos-container').innerHTML = `
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            Selecciona un torneo para editar su calendario.
                        </div>
                    `;
                }
            });
        }
        
        // Evento de envío del formulario
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.guardarCambiosCalendario();
            });
        }
    },
    
    // Cargar partidos para edición
    cargarPartidosEdicion: function(torneoId) {
        const partidosContainer = document.getElementById('partidos-container');
        const torneo = window.DataStore.getTorneo(torneoId);
        
        if (!torneo) {
            partidosContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al cargar la información del torneo.
                </div>
            `;
            return;
        }
        
        // Obtener partidos del torneo
        const partidos = window.DataStore.getPartidosPorTorneo(torneoId);
        
        if (partidos.length === 0) {
            partidosContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay partidos programados para este torneo.
                </div>
                <div class="text-center mt-4">
                    <a href="../partidos/generar.html?torneo=${torneoId}" class="btn btn-primary">
                        <i class="fas fa-calendar"></i> Generar Calendario
                    </a>
                </div>
            `;
            return;
        }
        
        // Agrupar partidos por jornada
        const partidosPorJornada = this.agruparPartidosPorJornada(partidos);
        
        // Mostrar formulario de edición
        let html = `
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                Puedes editar las fechas y horarios de los partidos. Los cambios se guardarán al hacer clic en "Guardar Cambios".
            </div>
        `;
        
        // Crear acordeón para cada jornada
        Object.keys(partidosPorJornada).forEach(jornada => {
            html += `
                <div class="accordion">
                    <div class="accordion-header">
                        <div class="accordion-title">
                            <i class="fas fa-calendar-week"></i> Jornada ${jornada}
                        </div>
                        <div class="accordion-icon">
                            <i class="fas fa-chevron-down"></i>
                        </div>
                    </div>
                    <div class="accordion-content">
            `;
            
            // Mostrar partidos de la jornada para edición
            partidosPorJornada[jornada].forEach(partido => {
                const equipoLocal = window.DataStore.getEquipo(partido.local);
                const equipoVisitante = window.DataStore.getEquipo(partido.visitante);
                
                if (equipoLocal && equipoVisitante) {
                    html += `
                        <div class="partido-edit-card" data-partido-id="${partido.id}">
                            <div class="partido-equipos">
                                <div class="equipo-local">
                                    <img src="${equipoLocal.escudo || '../../assets/img/default-shield.png'}" alt="${equipoLocal.nombre}" class="equipo-logo-sm">
                                    <span>${equipoLocal.nombre}</span>
                                </div>
                                <div class="vs">VS</div>
                                <div class="equipo-visitante">
                                    <span>${equipoVisitante.nombre}</span>
                                    <img src="${equipoVisitante.escudo || '../../assets/img/default-shield.png'}" alt="${equipoVisitante.nombre}" class="equipo-logo-sm">
                                </div>
                            </div>
                            <div class="partido-edit-form">
                                <div class="form-row">
                                    <div class="form-col">
                                        <div class="form-group">
                                            <label for="fecha-${partido.id}">Fecha</label>
                                            <input type="date" id="fecha-${partido.id}" class="form-control" value="${partido.fecha}" required>
                                        </div>
                                    </div>
                                    <div class="form-col">
                                        <div class="form-group">
                                            <label for="hora-${partido.id}">Hora</label>
                                            <input type="time" id="hora-${partido.id}" class="form-control" value="${partido.hora}" required>
                                        </div>
                                    </div>
                                    <div class="form-col">
                                        <div class="form-group">
                                            <label for="jornada-${partido.id}">Jornada</label>
                                            <input type="number" id="jornada-${partido.id}" class="form-control" value="${partido.jornada}" min="1" required>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        // Botón para guardar cambios
        html += `
            <div class="form-actions mt-4">
                <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save"></i> Guardar Cambios
                </button>
            </div>
        `;
        
        partidosContainer.innerHTML = html;
        
        // Inicializar acordeones
        this.initAccordions();
    },
    
    // Guardar cambios en el calendario
    guardarCambiosCalendario: function() {
        const torneoId = document.getElementById('torneo-select').value;
        if (!torneoId) return;
        
        // Obtener todos los partidos editados
        const partidosEditados = document.querySelectorAll('.partido-edit-card');
        const cambios = [];
        
        partidosEditados.forEach(partidoElement => {
            const partidoId = partidoElement.dataset.partidoId;
            const fecha = document.getElementById(`fecha-${partidoId}`).value;
            const hora = document.getElementById(`hora-${partidoId}`).value;
            const jornada = document.getElementById(`jornada-${partidoId}`).value;
            
            cambios.push({
                id: parseInt(partidoId),
                fecha,
                hora,
                jornada: parseInt(jornada)
            });
        });
        
        // Guardar cambios
        const resultado = window.DataStore.actualizarCalendario(cambios);
        
        if (resultado) {
            // Mostrar mensaje de éxito
            alert('Calendario actualizado correctamente.');
            
            // Recargar la página
            window.location.reload();
        } else {
            alert('Error al actualizar el calendario.');
        }
    },
    
    // Inicializar tabs
    initTabs: function() {
        const tabs = document.querySelectorAll('.tabs .tab');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remover clase active de todas las tabs
                tabs.forEach(t => t.classList.remove('active'));
                
                // Agregar clase active a la tab clickeada
                tab.classList.add('active');
                
                // Mostrar el contenido correspondiente
                const targetId = tab.dataset.target;
                const tabContents = document.querySelectorAll('.tab-content');
                
                tabContents.forEach(content => {
                    if (content.id === targetId) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
            });
        });
    },
    
    // Inicializar acordeones
    initAccordions: function() {
        const accordionHeaders = document.querySelectorAll('.accordion-header');
        
        accordionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const accordion = header.parentElement;
                const content = header.nextElementSibling;
                const icon = header.querySelector('.accordion-icon i');
                
                // Toggle clase active
                accordion.classList.toggle('active');
                
                // Toggle icono
                if (accordion.classList.contains('active')) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                    content.style.maxHeight = content.scrollHeight + 'px';
                } else {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                    content.style.maxHeight = null;
                }
            });
        });
        
        // Abrir el primer acordeón por defecto
        if (accordionHeaders.length > 0) {
            accordionHeaders[0].click();
        }
    },
    
    // Generar calendario de partidos
    generarCalendario: function(torneoId, formato, fechaInicio, opciones = {}) {
        const torneo = window.DataStore.getTorneo(torneoId);
        if (!torneo || !torneo.equipos || torneo.equipos.length < 2) {
            return false;
        }
        
        const equipos = torneo.equipos;
        let partidos = [];
        
        switch (formato) {
            case 'ida-vuelta':
                partidos = this.generarCalendarioLigaIdaVuelta(equipos);
                break;
            case 'ida':
                partidos = this.generarCalendarioLigaIda(equipos);
                break;
            case 'eliminacion':
                partidos = this.generarCalendarioEliminacion(equipos);
                break;
            case 'grupos':
                partidos = this.generarCalendarioGrupos(equipos);
                break;
            default:
                partidos = this.generarCalendarioLigaIdaVuelta(equipos);
        }
        
        // Asignar fechas y horas a los partidos
        this.asignarFechasHoras(partidos, fechaInicio, opciones);
        
        // Guardar partidos en el DataStore
        partidos.forEach(partido => {
            partido.torneo = parseInt(torneoId);
            partido.estado = 'Próximo';
            window.DataStore.savePartido(partido);
        });
        
        return true;
    },
    
    // Generar calendario de liga con ida y vuelta
    generarCalendarioLigaIdaVuelta: function(equipos) {
        const partidos = [];
        const numEquipos = equipos.length;
        
        // Si hay un número impar de equipos, añadir un equipo "fantasma"
        const equiposAjustados = numEquipos % 2 === 0 ? equipos : [...equipos, null];
        const n = equiposAjustados.length;
        
        // Generar partidos de ida
        const partidosIda = this.generarCalendarioLigaIda(equiposAjustados);
        partidos.push(...partidosIda);
        
        // Generar partidos de vuelta (invertir local y visitante)
        const partidosVuelta = partidosIda.map(partido => {
            return {
                id: null,
                local: partido.visitante,
                visitante: partido.local,
                jornada: partido.jornada + n - 1,
                fecha: null,
                hora: null
            };
        });
        partidos.push(...partidosVuelta);
        
        return partidos.filter(p => p.local !== null && p.visitante !== null);
    },
    
    // Generar calendario de liga con solo ida
    generarCalendarioLigaIda: function(equipos) {
        const partidos = [];
        const numEquipos = equipos.length;
        
        // Si hay un número impar de equipos, añadir un equipo "fantasma"
        const equiposAjustados = numEquipos % 2 === 0 ? equipos : [...equipos, null];
        const n = equiposAjustados.length;
        
        // Algoritmo de Round Robin para generar los enfrentamientos
        // Fijamos el primer equipo y rotamos el resto
        const equiposFijos = [...equiposAjustados];
        
        for (let jornada = 1; jornada < n; jornada++) {
            for (let i = 0; i < n / 2; i++) {
                const local = equiposFijos[i];
                const visitante = equiposFijos[n - 1 - i];
                
                // Solo añadir el partido si ambos equipos son reales (no null)
                if (local !== null && visitante !== null) {
                    partidos.push({
                        id: null,
                        local: local,
                        visitante: visitante,
                        jornada: jornada,
                        fecha: null,
                        hora: null
                    });
                }
            }
            
            // Rotar equipos (excepto el primero)
            equiposFijos.splice(1, 0, equiposFijos.pop());
        }
        
        return partidos;
    },
    
    // Generar calendario de eliminación directa
    generarCalendarioEliminacion: function(equipos) {
        const partidos = [];
        const numEquipos = equipos.length;
        
        // Calcular el número de rondas necesarias
        const numRondas = Math.ceil(Math.log2(numEquipos));
        const totalEquiposIdeal = Math.pow(2, numRondas);
        
        // Si no tenemos un número de equipos que sea potencia de 2, algunos equipos pasan directamente
        const equiposAjustados = [...equipos];
        while (equiposAjustados.length < totalEquiposIdeal) {
            equiposAjustados.push(null);
        }
        
        // Mezclar equipos aleatoriamente
        this.shuffleArray(equiposAjustados);
        
        // Primera ronda
        for (let i = 0; i < equiposAjustados.length; i += 2) {
            const local = equiposAjustados[i];
            const visitante = equiposAjustados[i + 1];
            
            // Solo añadir el partido si ambos equipos son reales (no null)
            if (local !== null && visitante !== null) {
                partidos.push({
                    id: null,
                    local: local,
                    visitante: visitante,
                    jornada: 1,
                    fecha: null,
                    hora: null
                });
            }
        }
        
        return partidos;
    },
    
    // Generar calendario de fase de grupos + eliminatorias
    generarCalendarioGrupos: function(equipos) {
        const partidos = [];
        const numEquipos = equipos.length;
        
        // Determinar el número de grupos (2 o 4 dependiendo del número de equipos)
        const numGrupos = numEquipos <= 8 ? 2 : 4;
        const equiposPorGrupo = Math.ceil(numEquipos / numGrupos);
        
        // Dividir equipos en grupos
        const grupos = [];
        for (let i = 0; i < numGrupos; i++) {
            grupos.push([]);
        }
        
        // Mezclar equipos aleatoriamente
        const equiposMezclados = [...equipos];
        this.shuffleArray(equiposMezclados);
        
        // Asignar equipos a grupos
        for (let i = 0; i < equiposMezclados.length; i++) {
            const grupoIndex = i % numGrupos;
            grupos[grupoIndex].push(equiposMezclados[i]);
        }
        
        // Generar partidos de cada grupo
        for (let g = 0; g < grupos.length; g++) {
            const grupoEquipos = grupos[g];
            
            // Generar calendario de liga para cada grupo
            const partidosGrupo = this.generarCalendarioLigaIda(grupoEquipos);
            
            // Ajustar jornada y añadir información de grupo
            partidosGrupo.forEach(partido => {
                partido.jornada = partido.jornada;
                partido.grupo = g + 1;
                partidos.push(partido);
            });
        }
        
        return partidos;
    },
    
    // Asignar fechas y horas a los partidos
    asignarFechasHoras: function(partidos, fechaInicio, opciones = {}) {
        const fechaBase = new Date(fechaInicio);
        const finesSemana = opciones.finesSemana || false;
        const diasDescanso = opciones.diasDescanso || 7;
        
        // Agrupar partidos por jornada
        const partidosPorJornada = {};
        partidos.forEach(partido => {
            if (!partidosPorJornada[partido.jornada]) {
                partidosPorJornada[partido.jornada] = [];
            }
            partidosPorJornada[partido.jornada].push(partido);
        });
        
        // Asignar fechas y horas
        let fechaActual = new Date(fechaBase);
        
        for (let jornada = 1; jornada <= Object.keys(partidosPorJornada).length; jornada++) {
            const partidosJornada = partidosPorJornada[jornada] || [];
            
            // Si solo se juega en fines de semana, ajustar la fecha al próximo fin de semana
            if (finesSemana) {
                // Ajustar al próximo sábado
                const diaSemana = fechaActual.getDay(); // 0 = domingo, 6 = sábado
                const diasHastaSabado = diaSemana === 6 ? 0 : 6 - diaSemana;
                fechaActual.setDate(fechaActual.getDate() + diasHastaSabado);
            }
            
            // Distribuir los partidos en 2 días (sábado y domingo si es fin de semana)
            const partidosPorDia = Math.ceil(partidosJornada.length / 2);
            
            for (let i = 0; i < partidosJornada.length; i++) {
                const partido = partidosJornada[i];
                const dia = Math.floor(i / partidosPorDia);
                
                // Clonar la fecha actual y añadir días si es necesario
                const fechaPartido = new Date(fechaActual);
                fechaPartido.setDate(fechaPartido.getDate() + dia);
                
                // Asignar fecha
                partido.fecha = fechaPartido.toISOString().split('T')[0];
                
                // Asignar hora (entre 15:00 y 21:00)
                const horaBase = 15;
                const minutos = ['00', '30'];
                const horaIndex = i % 4;
                const hora = horaBase + Math.floor(horaIndex / 2);
                const minuto = minutos[horaIndex % 2];
                partido.hora = `${hora}:${minuto}`;
            }
            
            // Avanzar a la próxima jornada
            fechaActual.setDate(fechaActual.getDate() + diasDescanso);
        }
    },
    
    // Mezclar array aleatoriamente (algoritmo Fisher-Yates)
    shuffleArray: function(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
};

// Inicializar el módulo cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    CalendarioModule.init();
});