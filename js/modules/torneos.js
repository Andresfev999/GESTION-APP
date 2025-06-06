// Módulo para la gestión de torneos
const TorneosModule = {
    // Inicializar el módulo
    init: async function() {
        if (document.getElementById('torneo-detalle')) {
            await this.cargarDetalleTorneo();
        }
        // Cargar la lista de torneos si estamos en la página de torneos
        if (document.getElementById('torneos-list')) {
            this.cargarTorneos();
            this.initBusqueda();
        }
        
        // Inicializar el formulario de creación/edición
        if (document.getElementById('torneo-form')) {
            this.initForm();
            this.initFileUpload();
            this.initEquiposSelect();
        }
        
        // Inicializar la vista de posiciones
        if (document.getElementById('posiciones-table')) {
            this.cargarPosiciones();
        }
    },
    
    // Cargar la lista de torneos
    cargarTorneos:  async function() {
        const torneosList = document.getElementById('torneos-list');
        const torneos = await window.FirebaseDataStore.getTorneos();
        
        if (torneos.length === 0) {
            torneosList.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay torneos registrados. ¡Crea el primero!
                </div>
            `;
            return;
        }
        
        let html = '';
        for(const torneo of torneos) {
        
            let estadoClass = '';
            if (torneo.estado === 'En curso') {
                estadoClass = 'badge-primary';
            } else if (torneo.estado === 'Finalizado') {
                estadoClass = 'badge-danger';
            } else {
                estadoClass = 'badge-warning';
            }
            
            // Contar equipos participantes
            const equipos = torneo.equipos ? torneo.equipos.length : 0;
            
            // Contar partidos del torneo
            const partidos = await window.FirebaseDataStore.getPartidosPorTorneo(torneo.id).length;
            
            html += `
                <div class="card" data-id="${torneo.id}">
                    <div class="card-header">
                        <div class="card-title">
                            <i class="fas fa-trophy"></i>
                            ${torneo.nombre}
                        </div>
                        <span class="badge ${estadoClass}">${torneo.estado}</span>
                    </div>
                    <div class="card-content">
                       
                        <div class="info-row">
                            <span class="info-label">Tipo:</span>
                            <span>${torneo.tipo}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Categoría:</span>
                            <span>${torneo.categoria || 'No especificada'}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Equipos:</span>
                            <span>${equipos}</span>
                        </div>
                        
                    </div>
                    <div class="card-footer">
                        <a href="detalle.html?id=${torneo.id}" class="btn btn-outline">Ver detalles</a>
                        <a href="crear.html?id=${torneo.id}" class="btn btn-sm">
                            <i class="fas fa-edit"></i>
                        </a>
                        <button class="btn btn-sm btn-danger eliminar-torneo" data-id="${torneo.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        };
        
        torneosList.innerHTML = html;
        
        // Agregar eventos para eliminar torneos
        const botonesEliminar = document.querySelectorAll('.eliminar-torneo');
        botonesEliminar.forEach(boton => {
            boton.addEventListener('click', (e) => {
                e.preventDefault();
                const torneoId = boton.getAttribute('data-id');
                TorneosModule.confirmarEliminarTorneo(torneoId);
            });
        });
    },
    
    // Confirmar eliminación de torneo
    confirmarEliminarTorneo:   async function(torneoId) {
        const torneo = await window.FirebaseDataStore.getTorneo(torneoId);
        if (!torneo) return;
        
        // Verificar si el torneo tiene partidos
        const partidos = await window.FirebaseDataStore.getPartidosPorTorneo(torneoId);
        
        let mensaje = `¿Estás seguro de que deseas eliminar el torneo "${torneo.nombre}"?`;
        
        if (partidos.length > 0) {
            mensaje += `\n\nEste torneo tiene ${partidos.length} partido(s) que también serán eliminados.`;
        }
        
        if (confirm(mensaje)) {
            this.eliminarTorneo(torneoId);
        }
    },
    
    // Eliminar torneo
    eliminarTorneo:  async function(torneoId) {
        // Eliminar partidos del torneo
        const partidos = await window.FirebaseDataStore.getPartidosPorTorneo(torneoId);
        for(const partido of partidos) {    
        
            await window.FirebaseDataStore.deletePartido(partido.id);
        };
        
        // Eliminar el torneo
        const resultado = await window.FirebaseDataStore.deleteTorneo(torneoId);
        
        if (resultado) {
            // Mostrar mensaje de éxito
            window.showNotification('Torneo eliminado correctamente', 'success');
            
            // Recargar la lista de torneos o redirigir
            if (document.getElementById('torneos-list')) {
                this.cargarTorneos();
            } else {
                window.location.href = 'index.html';
            }
        } else {
            window.showNotification('Error al eliminar el torneo', 'error');
        }
    },
    
    // Inicializar búsqueda de torneos
    initBusqueda: async function() {
        const buscarInput = document.getElementById('buscar-torneo');
        if (!buscarInput) return;
        
        buscarInput.addEventListener('input', () => {
            const termino = buscarInput.value.toLowerCase();
            const torneos = document.querySelectorAll('#torneos-list .card');
            
            torneos.forEach(torneo => {
                const nombre = torneo.querySelector('.card-title').textContent.toLowerCase();
                if (nombre.includes(termino)) {
                    torneo.style.display = 'block';
                } else {
                    torneo.style.display = 'none';
                }
            });
        });
        
        document.getElementById('buscador-equipos').addEventListener('input', function() {
            const filtro = this.value.toLowerCase();
            document.querySelectorAll('#equipos-container .equipo-checkbox-label').forEach(label => {
                const nombre = label.textContent.toLowerCase();
                label.style.display = nombre.includes(filtro) ? '' : 'none';
            });
        });
    },
    
    // Inicializar el formulario de creación/edición
    // Inicializar el formulario de creación/edición
    initForm: async function() {
        const form = document.getElementById('torneo-form');
        const urlParams = new URLSearchParams(window.location.search);
        const torneoId = urlParams.get('id');

        let equiposTorneo = [];
        if (torneoId) {
            // Cargar datos del torneo para edición
            const torneo = await window.FirebaseDataStore.getTorneo(torneoId);
            if (torneo) {
                document.getElementById('torneo-title').textContent = 'Editar Torneo';
                document.getElementById('nombre').value = torneo.nombre || '';
                document.getElementById('tipo').value = torneo.tipo || '';
                document.getElementById('descripcion').value = torneo.descripcion || '';
                document.getElementById('fechaInicio').value = torneo.fechaInicio || '';
                document.getElementById('fechaFin').value = torneo.fechaFin || '';
                document.getElementById('estado').value = torneo.estado || '';
                document.getElementById('categoria').value = torneo.categoria || '';
                equiposTorneo = torneo.equipos || [];
            }
        }

        // Espera a que los equipos estén cargados en el checklist
        await this.initEquiposSelect();

        // Marca los equipos ya asociados si es edición
        if (equiposTorneo.length > 0) {
            equiposTorneo.forEach(id => {
                const checkbox = document.querySelector(`#equipos-container input[type="checkbox"][value="${id}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await TorneosModule.guardarTorneo(torneoId); // Pasa el id para actualizar si existe
        });
        
        document.getElementById('escudo').addEventListener('change', function(e) {
            const file = e.target.files[0];
            const preview = document.getElementById('escudo-preview');
            if (file) {
                const reader = new FileReader();
                reader.onload = function(evt) {
                    preview.innerHTML = `<img src="${evt.target.result}" alt="Escudo" style="max-width:100px;max-height:100px;">`;
                    // Guarda el base64 en un atributo para usarlo al guardar
                    preview.dataset.base64 = evt.target.result;
                };
                reader.readAsDataURL(file);
            } else {
                preview.innerHTML = '';
                preview.dataset.base64 = '';
            }
        });
        
        const buscadorEquipos = document.getElementById('buscador-equipos');
        if (buscadorEquipos) {
            buscadorEquipos.addEventListener('input', function() {
                const filtro = this.value.toLowerCase();
                document.querySelectorAll('#equipos-container .equipo-checkbox-label').forEach(label => {
                    const nombre = label.textContent.toLowerCase();
                    label.style.display = nombre.includes(filtro) ? '' : 'none';
                });
            });
        }
    },
    
    // Inicializar carga de archivos
    initFileUpload: async function() {
        const fileInput = document.querySelector('.file-input');
        if (!fileInput) return;
        
        fileInput.addEventListener('change', async function() {
            const file = this.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = async function(e) {
                // Eliminar vista previa anterior si existe
                const existingPreview = document.querySelector('.file-preview');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                // Crear nueva vista previa
                const previewContainer = document.querySelector('.file-input-container');
                const preview = document.createElement('div');
                preview.className = 'file-preview';
                preview.innerHTML = `
                    <img src="${e.target.result}" alt="Escudo">
                    <span class="file-preview-name">${file.name}</span>
                    <button type="button" class="file-preview-remove">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(preview);
                
                // Agregar evento para eliminar la vista previa
                const removeBtn = preview.querySelector('.file-preview-remove');
                removeBtn.addEventListener('click', async function() {
                    preview.remove();
                    fileInput.value = '';
                });
            };
            
            reader.readAsDataURL(file);
        });
    },
    
    // Inicializar selección de equipos
    initEquiposSelect: async function() {
        const equiposContainer = document.getElementById('equipos-container');
        if (!equiposContainer) {
            console.error('Error: No se encontró el contenedor de equipos.');
            return;
        }

        // Obtener equipos desde Firebase
        const equipos = await window.FirebaseDataStore.getEquipos();

        if (!equipos || equipos.length === 0) {
            equiposContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> No hay equipos registrados. Crea uno primero.
                </div>
            `;
            return;
        }

        let html = '';
        equipos.forEach(equipo => {
            html += `
                <label class="equipo-checkbox-label" style="display:block;">
                    <input type="checkbox" id="equipo-${equipo.id}" value="${equipo.id}">
                    ${equipo.nombre}
                </label>
            `;
        });

        equiposContainer.innerHTML = html;

        // Depuración: Verificar si los equipos se han cargado correctamente
        console.log("Equipos cargados en la vista de creación:", equipos);
    },
  
    // Guardar torneo
    guardarTorneo: async function(torneoId) {
        // Obtén los valores del formulario
        const nombre = document.getElementById('nombre').value;
        const tipo = document.getElementById('tipo').value;
        const descripcion = document.getElementById('descripcion').value;
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;
        const estado = document.getElementById('estado').value;
        const categoria = document.getElementById('categoria').value;

        // Obtén los equipos seleccionados
        const equipos = Array.from(document.querySelectorAll('#equipos-container input[type="checkbox"]:checked')).map(e => e.value);

        // Crea o actualiza el torneo
        const torneo = {
            id: torneoId,
            nombre,
            tipo,
            descripcion,
            fechaInicio,
            fechaFin,
            estado,
            categoria, 
            equipos
        };
        // Guarda el torneo y obtén el ID (si es nuevo)
        const torneoGuardado = await window.FirebaseDataStore.saveTorneo(torneo);
        const idTorneoFinal = torneoGuardado?.id || torneoId;

        // Asigna el campo torneo a cada equipo seleccionado
        for (const equipoId of equipos) {
            await window.FirebaseDataStore.updateEquipoTorneo(equipoId, idTorneoFinal);
        }

        // Si es edición, elimina el campo torneo de los equipos que ya no están seleccionados
        if (torneoId) {
            // Obtén todos los equipos de este torneo antes de la edición
            const torneoAnterior = await window.FirebaseDataStore.getTorneo(torneoId);
            const equiposAntes = torneoAnterior?.equipos || [];
            const equiposQuitados = equiposAntes.filter(id => !equipos.includes(id));
            for (const equipoId of equiposQuitados) {
                await window.FirebaseDataStore.updateEquipoTorneo(equipoId, null);
            }
        }

        // Mostrar mensaje en consola y redirigir
        console.log("Cambios guardados");
        window.location.href = "index.html";
    },
    
    // Cargar detalle de un torneo
    cargarDetalleTorneo: async function() {
        const urlParams = new URLSearchParams(window.location.search);
        const torneoId = urlParams.get('id');
        if (!torneoId) return;

        const torneo = await window.FirebaseDataStore.getTorneo(torneoId);
        if (!torneo) return;

        // Cabecera
        document.getElementById('torneo-nombre').textContent = torneo.nombre || '-';
        document.getElementById('torneo-tipo').textContent = torneo.tipo || '-';
        document.getElementById('torneo-fecha-inicio').textContent = torneo.fechaInicio || '-';
        document.getElementById('torneo-fecha-fin').textContent = torneo.fechaFin || '-';
        document.getElementById('torneo-estado').textContent = torneo.estado || '-';

        // Información
        document.getElementById('info-nombre').textContent = torneo.nombre || '-';
        document.getElementById('info-tipo').textContent = torneo.tipo || '-';
        document.getElementById('info-estado').textContent = torneo.estado || '-';
        document.getElementById('info-fecha-inicio').textContent = torneo.fechaInicio || '-';
        document.getElementById('info-fecha-fin').textContent = torneo.fechaFin || '-';
        document.getElementById('info-equipos').textContent = torneo.equipos ? torneo.equipos.length + ' equipo(s)' : '-';
    },
    
    // Cargar equipos de un torneo
    cargarEquiposTorneo: async function(torneo) {
        const equiposContainer = document.getElementById('torneo-equipos');
        if (!equiposContainer) return;
        
        if (!torneo.equipos || torneo.equipos.length === 0) {
            equiposContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay equipos registrados para este torneo.
                </div>
                <div class="text-center mt-4">
                    <a href="crear.html?id=${torneo.id}" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Añadir Equipos
                    </a>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="text-right mb-3">
                <a href="crear.html?id=${torneo.id}" class="btn btn-primary">
                    <i class="fas fa-edit"></i> Editar Equipos
                </a>
            </div>
            <div class="equipos-grid">
        `;
        
        // Obtener detalles de cada equipo
        for (const equipoId of torneo.equipos) {
            const equipo = await window.FirebaseDataStore.getEquipo(equipoId);
            if (equipo) {
                html += `
                    <div class="equipo-card">
                        <div class="equipo-escudo">
                            <img src="${equipo.escudo || '../../assets/img/default-shield.png'}" alt="${equipo.nombre}">
                        </div>
                        <div class="equipo-info">
                            <div class="equipo-nombre">${equipo.nombre}</div>
                            <div class="equipo-ciudad">${equipo.ciudad || ''}</div>
                        </div>
                        <a href="../equipos/detalle.html?id=${equipo.id}" class="btn btn-sm btn-outline">Ver equipo</a>
                    </div>
                `;
            }
        };
        
        html += '</div>';
        equiposContainer.innerHTML = html;
    },
    
    // Cargar partidos de un torneo
    cargarPartidosTorneo: async function(torneoId) {
        const partidosContainer = document.getElementById('torneo-partidos');
        if (!partidosContainer) return;
        
        const partidos = await window.FirebaseDataStore.getPartidosPorTorneo(torneoId);
        
        if (partidos.length === 0) {
            partidosContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay partidos programados para este torneo.
                </div>
                <div class="text-center mt-4">
                    <a href="../calendario/generar.html?torneo=${torneoId}" class="btn btn-primary">
                        <i class="fas fa-calendar-alt"></i> Generar Calendario
                    </a>
                </div>
            `;
            return;
        }
        
        // Agrupar partidos por jornada
        const partidosPorJornada = {};
        partidos.forEach(partido => {
            const jornada = partido.jornada || 'Sin jornada';
            if (!partidosPorJornada[jornada]) {
                partidosPorJornada[jornada] = [];
            }
            partidosPorJornada[jornada].push(partido);
        });
        
        let html = `
            <div class="text-right mb-3">
                <a href="../calendario/index.html?torneo=${torneoId}" class="btn btn-primary">
                    <i class="fas fa-calendar-alt"></i> Ver Calendario Completo
                </a>
            </div>
        `;
        
        // Mostrar partidos por jornada
        for (const jornada in partidosPorJornada) {
            html += `
                <div class="jornada-seccion">
                    <h3 class="jornada-titulo">Jornada ${jornada}</h3>
                    <div class="partidos-list">
            `;
            for (const partido of partidosPorJornada[jornada]) {    
           
                const equipoLocal = await window.FirebaseDataStore.getEquipo(partido.local);
                const equipoVisitante = await window.FirebaseDataStore.getEquipo(partido.visitante);
                
                if (equipoLocal && equipoVisitante) {
                    let estadoClass = '';
                    let resultadoHtml = '';
                    
                    if (partido.estado === 'Finalizado' && partido.resultado) {
                        estadoClass = 'partido-finalizado';
                        resultadoHtml = `
                            <div class="partido-resultado">
                                <span class="goles-local">${partido.resultado.golesLocal}</span>
                                <span class="separador">-</span>
                                <span class="goles-visitante">${partido.resultado.golesVisitante}</span>
                            </div>
                        `;
                    } else if (partido.estado === 'En curso') {
                        estadoClass = 'partido-en-curso';
                        resultadoHtml = `
                            <div class="partido-estado">
                                <span class="badge badge-primary">En curso</span>
                            </div>
                        `;
                    } else {
                        estadoClass = 'partido-programado';
                        resultadoHtml = `
                            <div class="partido-fecha-hora">
                                <div class="partido-fecha">${new Date(partido.fecha).toLocaleDateString()}</div>
                                <div class="partido-hora">${partido.hora || '00:00'}</div>
                            </div>
                        `;
                    }
                    
                    html += `
                        <div class="partido-card ${estadoClass}">
                            <div class="partido-equipos">
                                <div class="equipo-local">
                                    <img src="${equipoLocal.escudo || '../../assets/img/default-shield.png'}" alt="${equipoLocal.nombre}" class="equipo-escudo">
                                    <span class="equipo-nombre">${equipoLocal.nombre}</span>
                                </div>
                                ${resultadoHtml}
                                <div class="equipo-visitante">
                                    <span class="equipo-nombre">${equipoVisitante.nombre}</span>
                                    <img src="${equipoVisitante.escudo || '../../assets/img/default-shield.png'}" alt="${equipoVisitante.nombre}" class="equipo-escudo">
                                </div>
                            </div>
                            <div class="partido-acciones">
                                <a href="../partidos/detalle.html?id=${partido.id}" class="btn btn-sm btn-outline">Detalles</a>
                            </div>
                        </div>
                    `;
                }
            };
            
            html += `
                    </div>
                </div>
            `;
        }
        
        partidosContainer.innerHTML = html;
    },
    
    // Cargar tabla de posiciones
    cargarTablaPosiciones: async function(torneoId) {
        const posicionesContainer = document.getElementById('torneo-posiciones');
        if (!posicionesContainer) return;
        
        const torneo = await window.FirebaseDataStore.getTorneo(torneoId);
        if (!torneo || !torneo.equipos || torneo.equipos.length === 0) {
            posicionesContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay equipos en este torneo para mostrar la tabla de posiciones.
                </div>
            `;
            return;
        }
        
        // Calcular posiciones
        const posiciones = await window.FirebaseDataStore.calcularPosiciones(torneoId);
        
        if (posiciones.length === 0) {
            posicionesContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay partidos finalizados para calcular la tabla de posiciones.
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="text-right mb-3">
                <a href="../posiciones/index.html?torneo=${torneoId}" class="btn btn-primary">
                    <i class="fas fa-table"></i> Ver Tabla Completa
                </a>
            </div>
            <div class="table-responsive">
                <table class="table table-posiciones">
                    <thead>
                        <tr>
                            <th>Pos</th>
                            <th>Equipo</th>
                            <th>PJ</th>
                            <th>G</th>
                            <th>E</th>
                            <th>P</th>
                            <th>GF</th>
                            <th>GC</th>
                            <th>DIF</th>
                            <th>PTS</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        posiciones.forEach(equipo => {
            html += `
                <tr>
                    <td>${equipo.posicion}</td>
                    <td class="equipo-nombre">
                        <a href="../equipos/detalle.html?id=${equipo.id}">${equipo.nombre}</a>
                    </td>
                    <td>${equipo.pj}</td>
                    <td>${equipo.pg}</td>
                    <td>${equipo.pe}</td>
                    <td>${equipo.pp}</td>
                    <td>${equipo.gf}</td>
                    <td>${equipo.gc}</td>
                    <td>${equipo.dif > 0 ? '+' + equipo.dif : equipo.dif}</td>
                    <td class="puntos">${equipo.puntos}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        posicionesContainer.innerHTML = html;
    },
    
    // Cargar posiciones para la página de posiciones
    cargarPosiciones: async function() {
        const urlParams = new URLSearchParams(window.location.search);
        const torneoId = urlParams.get('torneo');
        
        if (!torneoId) {
            document.getElementById('posiciones-container').innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    No se ha seleccionado ningún torneo.
                </div>
            `;
            return;
        }
        
        const torneo = await window.FirebaseDataStore.getTorneo(torneoId);
        if (!torneo) {
            document.getElementById('posiciones-container').innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    El torneo seleccionado no existe.
                </div>
            `;
            return;
        }
        
        // Mostrar nombre del torneo
        document.getElementById('torneo-nombre').textContent = torneo.nombre;
        
        // Calcular posiciones
        const posiciones = await window.FirebaseDataStore.calcularPosiciones(torneoId);
        
        if (posiciones.length === 0) {
            document.getElementById('posiciones-table').innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay partidos finalizados para calcular la tabla de posiciones.
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="table-responsive">
                <table class="table table-posiciones">
                    <thead>
                        <tr>
                            <th>Pos</th>
                            <th>Equipo</th>
                            <th>PJ</th>
                            <th>G</th>
                            <th>E</th>
                            <th>P</th>
                            <th>GF</th>
                            <th>GC</th>
                            <th>DIF</th>
                            <th>PTS</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        posiciones.forEach(equipo => {
            html += `
                <tr>
                    <td>${equipo.posicion}</td>
                    <td class="equipo-nombre">
                        <a href="../equipos/detalle.html?id=${equipo.id}">${equipo.nombre}</a>
                    </td>
                    <td>${equipo.pj}</td>
                    <td>${equipo.pg}</td>
                    <td>${equipo.pe}</td>
                    <td>${equipo.pp}</td>
                    <td>${equipo.gf}</td>
                    <td>${equipo.gc}</td>
                    <td>${equipo.dif > 0 ? '+' + equipo.dif : equipo.dif}</td>
                    <td class="puntos">${equipo.puntos}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        document.getElementById('posiciones-table').innerHTML = html;
    }
};

// Inicializar el módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    TorneosModule.init();
});