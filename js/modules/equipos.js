// Módulo para la gestión de equipos
const EquiposModule = {
    // Inicializar el módulo
    init: async function() {
        // Cargar la lista de equipos si estamos en la página de equipos
        if (document.getElementById('equipos-list')) {
            this.cargarEquipos();
            this.initBusqueda();
        }
        
        // Inicializar el formulario de creación/edición
        if (document.getElementById('equipo-form')) {
            this.initForm();
            this.initFileUpload();
        }
        
        // Inicializar la vista de detalle
        if (document.getElementById('equipo-detalle')) {
            this.cargarDetalleEquipo();
        }
    },
    
    // Cargar la lista de equipos
    cargarEquipos: async function() {
        const equiposList = document.getElementById('equipos-list');
        const equipos = await window.FirebaseDataStore.getEquipos();
        
        if (equipos.length === 0) {
            equiposList.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay equipos registrados. ¡Crea el primero!
                </div>
            `;
            return;
        }
        
        let html = '';
        for(let i = 0; i < equipos.length; i++) {
            const equipo = equipos[i];
            
            // Ejemplo de renderizado de cada equipo
            html += `
            <div class="card equipo-card">
                <div class="card-img">
                    <img src="${equipo.escudo ? equipo.escudo : '../../assets/img/default-shield.png'}" 
                         alt="Escudo de ${equipo.nombre}" 
                         class="escudo-lista">
                </div>
                <div class="card-body">
                    <h2 class="card-title">${equipo.nombre}</h2>
                    <p>${equipo.ciudad || ''}</p>
                    <a href="detalle.html?id=${equipo.id}" class="btn btn-sm btn-info">Ver Detalle</a>
                    <a href="crear.html?id=${equipo.id}" class="btn btn-sm btn-warning"><i class="fas fa-edit"></i> Editar</a>
                    <button class="btn btn-sm btn-danger eliminar-equipo" data-id="${equipo.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
            `;
        };
        
        equiposList.innerHTML = html;
        
        // Después de equiposList.innerHTML = html:
        const botonesEliminar = document.querySelectorAll('.eliminar-equipo');
        botonesEliminar.forEach(boton => {
            boton.addEventListener('click', async function(e) {
                e.preventDefault();
                const equipoId = this.getAttribute('data-id');
                if (confirm('¿Seguro que deseas eliminar este equipo?')) {
                    await window.FirebaseDataStore.deleteEquipo(equipoId);
                    location.reload();
                }
            });
        });
    },
    
    // Confirmar eliminación de equipo
    confirmarEliminarEquipo: async function(equipoId) {
        const equipo = await window.FirebaseDataStore.getEquipo(equipoId);
        if (!equipo) return;
        
        // Verificar si el equipo tiene jugadores
        const jugadores = await window.FirebaseDataStore.getJugadoresPorEquipo(equipoId);
        
        // Verificar si el equipo participa en torneos
        const torneos = await window.FirebaseDataStore.getTorneos().filter(torneo => 
            torneo.equipos && torneo.equipos.includes(equipoId)
        );
        
        let mensaje = `¿Estás seguro de que deseas eliminar el equipo "${equipo.nombre}"?`;
        
        if (jugadores.length > 0) {
            mensaje += `\n\nEste equipo tiene ${jugadores.length} jugador(es) que también serán eliminados.`;
        }
        
        if (torneos.length > 0) {
            mensaje += `\n\nEste equipo participa en ${torneos.length} torneo(s). Será removido de estos torneos.`;
        }
        
        if (confirm(mensaje)) {
            this.eliminarEquipo(equipoId);
        }
    },
    
    // Eliminar equipo
    eliminarEquipo: async function(equipoId) {
        // Eliminar jugadores del equipo
        const jugadores = await window.FirebaseDataStore.getJugadoresPorEquipo(equipoId);
        for (let i = 0; i < jugadores.length; i++) {
            const jugador = jugadores[i];
            await window.FirebaseDataStore.deleteJugador(jugador.id);
        }
       
        // Remover equipo de torneos
        const torneos = await window.FirebaseDataStore.getTorneos();
        for(let i = 0; i < torneos.length; i++) {
       
            if (torneo.equipos && torneo.equipos.includes(equipoId)) {
                torneo.equipos = torneo.equipos.filter(id => id !== equipoId);
                await window.FirebaseDataStore.saveTorneo(torneo);
            }
        };
        
        // Eliminar partidos donde participa el equipo
        const partidos = await window.FirebaseDataStore.getPartidos();
        for(let i = 0; i < partidos.length; i++) {
       
            
            if (partido.local === equipoId || partido.visitante === equipoId) {
                await window.FirebaseDataStore.deletePartido(partido.id);
            }
        };
        
        // Eliminar el equipo
        const resultado = await window.FirebaseDataStore.deleteEquipo(equipoId);
        
        if (resultado) {
            // Mostrar mensaje de éxito
            window.showNotification('Equipo eliminado correctamente', 'success');
            
            // Recargar la lista de equipos
            this.cargarEquipos();
        } else {
            window.showNotification('Error al eliminar el equipo', 'error');
        }
    },
    
    // Inicializar búsqueda de equipos
    initBusqueda: async function() {
        const buscarInput = document.getElementById('buscar-equipo');
        if (!buscarInput) return;
        
        buscarInput.addEventListener('input', () => {
            const termino = buscarInput.value.toLowerCase();
            const equipos = document.querySelectorAll('#equipos-list .card');
            
            equipos.forEach(equipo => {
                const nombre = equipo.querySelector('.card-title').textContent.toLowerCase();
                if (nombre.includes(termino)) {
                    equipo.style.display = 'block';
                } else {
                    equipo.style.display = 'none';
                }
            });
        });
    },
    
    // Inicializar el formulario de creación/edición
    initForm: async function() {
        const form = document.getElementById('equipo-form');
        const urlParams = new URLSearchParams(window.location.search);
        const equipoId = urlParams.get('id');

        // Cambiar el título si es edición
        const titulo = document.getElementById('equipo-title');
        if (titulo) {
            titulo.textContent = equipoId ? 'Editar Equipo' : 'Crear Nuevo Equipo';
        }

        // Si es edición, carga los datos del equipo y rellena los campos aquí...
        if (equipoId) {
            const equipo = await window.FirebaseDataStore.getEquipo(equipoId);
            if (equipo) {
                document.getElementById('nombre').value = equipo.nombre || '';
                document.getElementById('ciudad').value = equipo.ciudad || '';
                document.getElementById('abreviatura').value = equipo.abreviatura || '';
                document.getElementById('descripcion').value = equipo.descripcion || '';
                document.getElementById('fundacion').value = equipo.fundacion || '';
                // Si tienes más campos, agrégalos aquí

                // Previsualizar escudo si existe
                if (equipo.escudo) {
                    const previewContainer = document.querySelector('.file-input-container');
                    if (previewContainer) {
                        // Elimina previsualizaciones anteriores
                        const existingPreview = previewContainer.querySelector('.file-preview');
                        if (existingPreview) existingPreview.remove();

                        const preview = document.createElement('div');
                        preview.className = 'file-preview';
                        preview.innerHTML = `
                            <img src="${equipo.escudo}" alt="Escudo">
                            <span class="file-preview-name">Escudo actual</span>
                            <button type="button" class="file-preview-remove">
                                <i class="fas fa-times"></i>
                            </button>
                        `;
                        previewContainer.appendChild(preview);

                        // Botón para quitar la previsualización
                        const removeBtn = preview.querySelector('.file-preview-remove');
                        removeBtn.addEventListener('click', function() {
                            preview.remove();
                            document.getElementById('escudo').value = '';
                        });
                    }
                }
            }
        }

        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            await this.guardarEquipo(equipoId);
        });
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
    
    // Guardar equipo
    guardarEquipo: async function(equipoId) {
        const nombre = document.getElementById('nombre').value;
        const ciudad = document.getElementById('ciudad').value;
        const abreviatura = document.getElementById('abreviatura').value;
        const descripcion = document.getElementById('descripcion').value;
        const fundacion = document.getElementById('fundacion').value;

        // Obtener escudo como base64
        let escudo = null;
        const escudoInput = document.getElementById('escudo');
        if (escudoInput && escudoInput.files && escudoInput.files[0]) {
            const file = escudoInput.files[0];
            escudo = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = e => reject(e);
                reader.readAsDataURL(file);
            });
        } else {
            // Si no se selecciona nuevo archivo, toma el src de la previsualización
            const previewImg = document.querySelector('.file-preview img');
            if (previewImg) {
                escudo = previewImg.src;
            }
        }

        // Crear objeto equipo
        const equipo = {
            id: equipoId,
            nombre,
            ciudad,
            abreviatura,
            descripcion,
            fundacion,
            escudo // <-- este campo se guardará en Firebase
        };

        // Guardar equipo
        await window.FirebaseDataStore.saveEquipo(equipo);

        // Redirigir a la lista de equipos
        window.location.href = 'index.html';
    },
    
    // Cargar detalle de un equipo
    cargarDetalleEquipo: async function() {
        const urlParams = new URLSearchParams(window.location.search);
        const equipoId = urlParams.get('id');
        
        if (!equipoId) {
            window.location.href = 'index.html';
            return;
        }
        
        const equipo = await window.FirebaseDataStore.getEquipo(equipoId);
        if (!equipo) {
            window.location.href = 'index.html';
            return;
        }
        
        // Mostrar información del equipo
        document.getElementById('equipo-nombre').textContent = equipo.nombre;
        
        if (equipo.ciudad) {
            document.getElementById('equipo-ciudad').textContent = equipo.ciudad;
        }
        
        if (equipo.fundacion) {
            document.getElementById('equipo-fundacion').textContent = equipo.fundacion;
        }
        
        // Mostrar escudo si existe
        if (equipo.escudo) {
            const escudoImg = document.getElementById('equipo-escudo');
            escudoImg.src = equipo.escudo;
            escudoImg.style.display = 'block';
        }
        
        // Llenar información detallada
        document.getElementById('info-nombre').textContent = equipo.nombre;
        document.getElementById('info-abreviatura').textContent = equipo.abreviatura || '-';
        document.getElementById('info-ciudad').textContent = equipo.ciudad || '-';
        document.getElementById('info-fundacion').textContent = equipo.fundacion || '-';
        document.getElementById('info-descripcion').textContent = equipo.descripcion || 'Sin descripción';
        
        // Cargar jugadores del equipo
        this.cargarJugadoresEquipo(equipo);
        
        // Cargar torneos del equipo
        this.cargarTorneosEquipo(equipoId);
        
        // Cargar estadísticas del equipo
        this.cargarEstadisticasEquipo(equipoId);
        
        // Agregar botón para eliminar equipo
        const accionesContainer = document.querySelector('.acciones-equipo');
        if (accionesContainer) {
            const botonEliminar = document.createElement('button');
            botonEliminar.className = 'btn btn-danger';
            botonEliminar.innerHTML = '<i class="fas fa-trash"></i> Eliminar Equipo';
            botonEliminar.addEventListener('click', () => {
                this.confirmarEliminarEquipo(parseInt(equipoId));
            });
            accionesContainer.appendChild(botonEliminar);
        }
    },
    
    // Cargar jugadores de un equipo
    cargarJugadoresEquipo: async function(equipo) {
        const jugadoresContainer = document.getElementById('equipo-jugadores');
        if (!jugadoresContainer) return;
        
        const jugadores = await window.FirebaseDataStore.getJugadoresPorEquipo(equipo.id);
        
        if (jugadores.length === 0) {
            jugadoresContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay jugadores registrados para este equipo.
                </div>
                <div class="text-center mt-4">
                    <a href="../jugadores/crear.html?equipo=${equipo.id}" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Añadir Jugador
                    </a>
                </div>
            `;
            return;
        }
        
        // Agrupar jugadores por posición
        const jugadoresPorPosicion = {
            'Portero': [],
            'Defensa': [],
            'Mediocampista': [],
            'Delantero': []
        };
        
        jugadores.forEach(jugador => {
            if (jugadoresPorPosicion[jugador.posicion]) {
                jugadoresPorPosicion[jugador.posicion].push(jugador);
            } else {
                jugadoresPorPosicion['Mediocampista'].push(jugador);
            }
        });
        
        let html = `
            <div class="text-right mb-3">
                <a href="../jugadores/crear.html?equipo=${equipo.id}" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Añadir Jugador
                </a>
            </div>
        `;
        
        // Mostrar jugadores por posición
        for (const posicion in jugadoresPorPosicion) {
            if (jugadoresPorPosicion[posicion].length > 0) {
                html += `
                    <div class="jugadores-seccion">
                        <h3 class="posicion-titulo">${posicion}s</h3>
                        <div class="jugadores-grid">
                `;
                
                jugadoresPorPosicion[posicion].forEach(jugador => {
                    html += `
                        <div class="jugador-card" data-id="${jugador.id}">
                            <div class="jugador-foto">
                                <img src="${jugador.foto || '../../assets/img/default-player.png'}" alt="${jugador.nombre}">
                            </div>
                            <div class="jugador-info">
                                <div class="jugador-nombre">${jugador.nombre}</div>
                                <div class="jugador-dorsal">${jugador.dorsal || '-'}</div>
                            </div>
                            <div class="jugador-acciones">
                                <a href="../jugadores/detalle.html?id=${jugador.id}" class="btn btn-sm btn-outline">Ver perfil</a>
                                <a href="../jugadores/crear.html?id=${jugador.id}" class="btn btn-sm">
                                    <i class="fas fa-edit"></i>
                                </a>
                                <button class="btn btn-sm btn-danger eliminar-jugador" data-id="${jugador.id}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
        }
        
        jugadoresContainer.innerHTML = html;
        
        // Agregar eventos para eliminar jugadores
        const botonesEliminar = jugadoresContainer.querySelectorAll('.eliminar-jugador');
        botonesEliminar.forEach(boton => {
            boton.addEventListener('click', (e) => {
                e.preventDefault();
                const jugadorId = parseInt(boton.getAttribute('data-id'));
                this.confirmarEliminarJugador(jugadorId);
            });
        });
    },
    
    // Confirmar eliminación de jugador
    confirmarEliminarJugador: async function(jugadorId) {
        const jugador = await window.FirebaseDataStore.getJugador(jugadorId);
        if (!jugador) return;
        
        if (confirm(`¿Estás seguro de que deseas eliminar al jugador "${jugador.nombre}"?`)) {
            // Eliminar jugador
            const resultado = await window.FirebaseDataStore.deleteJugador(jugadorId);
            
            if (resultado) {
                // Mostrar mensaje de éxito
                window.showNotification('Jugador eliminado correctamente', 'success');
                
                // Recargar la lista de jugadores
                const equipo = await window.FirebaseDataStore.getEquipo(jugador.equipo);
                if (equipo) {
                    this.cargarJugadoresEquipo(equipo);
                }
            } else {
                window.showNotification('Error al eliminar el jugador', 'error');
            }
        }
    },
    
    // Cargar torneos de un equipo
    cargarTorneosEquipo: async function(equipoId) {
        const torneosContainer = document.getElementById('equipo-torneos');
        if (!torneosContainer) return;
        
        const torneos = await window.FirebaseDataStore.getTorneos().filter(torneo => 
            torneo.equipos && torneo.equipos.includes(parseInt(equipoId))
        );
        
        if (torneos.length === 0) {
            torneosContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    Este equipo no participa en ningún torneo actualmente.
                </div>
            `;
            return;
        }
        
        let html = '<div class="torneos-grid">';
        torneos.forEach(torneo => {
            let estadoClass = '';
            if (torneo.estado === 'En curso') {
                estadoClass = 'badge-primary';
            } else if (torneo.estado === 'Finalizado') {
                estadoClass = 'badge-danger';
            } else {
                estadoClass = 'badge-warning';
            }
            
            html += `
                <div class="torneo-card">
                    <div class="torneo-header">
                        <img src="${torneo.escudo || '../../assets/img/default-trophy.png'}" alt="${torneo.nombre}" class="torneo-escudo">
                        <div class="torneo-info">
                            <div class="torneo-nombre">${torneo.nombre}</div>
                            <div class="torneo-tipo">${torneo.tipo}</div>
                        </div>
                    </div>
                    <div class="torneo-estado">
                        <span class="badge ${estadoClass}">${torneo.estado}</span>
                    </div>
                    <a href="../torneos/detalle.html?id=${torneo.id}" class="btn btn-sm btn-outline">Ver torneo</a>
                </div>
            `;
        });
        html += '</div>';
        
        torneosContainer.innerHTML = html;
    },
    
    // Cargar estadísticas de un equipo
    cargarEstadisticasEquipo: async function(equipoId) {
        const estadisticasContainer = document.getElementById('equipo-estadisticas');
        if (!estadisticasContainer) return;
        
        // Obtener todos los partidos donde participa el equipo
        const partidos = await window.FirebaseDataStore.getPartidos().filter(partido => 
            (partido.local === parseInt(equipoId) || partido.visitante === parseInt(equipoId)) &&
            partido.estado === 'Finalizado' && partido.resultado
        );
        
        if (partidos.length === 0) {
            estadisticasContainer.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay estadísticas disponibles para este equipo.
                </div>
            `;
            return;
        }
        
        // Calcular estadísticas
        let partidosJugados = 0;
        let partidosGanados = 0;
        let partidosEmpatados = 0;
        let partidosPerdidos = 0;
        let golesFavor = 0;
        let golesContra = 0;
        
        partidos.forEach(partido => {
            partidosJugados++;
            
            if (partido.local === parseInt(equipoId)) {
                // El equipo juega como local
                golesFavor += partido.resultado.golesLocal;
                golesContra += partido.resultado.golesVisitante;
                
                if (partido.resultado.golesLocal > partido.resultado.golesVisitante) {
                    partidosGanados++;
                } else if (partido.resultado.golesLocal < partido.resultado.golesVisitante) {
                    partidosPerdidos++;
                } else {
                    partidosEmpatados++;
                }
            } else {
                // El equipo juega como visitante
                golesFavor += partido.resultado.golesVisitante;
                golesContra += partido.resultado.golesLocal;
                
                if (partido.resultado.golesVisitante > partido.resultado.golesLocal) {
                    partidosGanados++;
                } else if (partido.resultado.golesVisitante < partido.resultado.golesLocal) {
                    partidosPerdidos++;
                } else {
                    partidosEmpatados++;
                }
            }
        });
        
        const diferenciaGoles = golesFavor - golesContra;
        const efectividad = Math.round((partidosGanados * 100) / partidosJugados);
        
        // Mostrar estadísticas
        let html = `
            <div class="estadisticas-grid">
                <div class="estadistica-item">
                    <div class="estadistica-valor">${partidosJugados}</div>
                    <div class="estadistica-label">Partidos Jugados</div>
                </div>
                <div class="estadistica-item">
                    <div class="estadistica-valor">${partidosGanados}</div>
                    <div class="estadistica-label">Victorias</div>
                </div>
                <div class="estadistica-item">
                    <div class="estadistica-valor">${partidosEmpatados}</div>
                    <div class="estadistica-label">Empates</div>
                </div>
                <div class="estadistica-item">
                    <div class="estadistica-valor">${partidosPerdidos}</div>
                    <div class="estadistica-label">Derrotas</div>
                </div>
                <div class="estadistica-item">
                    <div class="estadistica-valor">${golesFavor}</div>
                    <div class="estadistica-label">Goles a Favor</div>
                </div>
                <div class="estadistica-item">
                    <div class="estadistica-valor">${golesContra}</div>
                    <div class="estadistica-label">Goles en Contra</div>
                </div>
                <div class="estadistica-item">
                    <div class="estadistica-valor">${diferenciaGoles > 0 ? '+' + diferenciaGoles : diferenciaGoles}</div>
                    <div class="estadistica-label">Diferencia de Goles</div>
                </div>
                <div class="estadistica-item">
                    <div class="estadistica-valor">${efectividad}%</div>
                    <div class="estadistica-label">Efectividad</div>
                </div>
            </div>
            
            <h3 class="mt-4">Últimos Partidos</h3>
            <div class="ultimos-partidos">
        `;
        
        // Mostrar últimos 5 partidos
        const ultimosPartidos = partidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);
        
        for(const partido of ultimosPartidos) {
      
            const equipoLocal = await window.FirebaseDataStore.getEquipo(partido.local);
            const equipoVisitante = await window.FirebaseDataStore.getEquipo(partido.visitante);
            
            if (equipoLocal && equipoVisitante) {
                const esLocal = partido.local === parseInt(equipoId);
                const resultado = partido.resultado;
                let resultadoClass = '';
                
                if (esLocal) {
                    if (resultado.golesLocal > resultado.golesVisitante) {
                        resultadoClass = 'resultado-victoria';
                    } else if (resultado.golesLocal < resultado.golesVisitante) {
                        resultadoClass = 'resultado-derrota';
                    } else {
                        resultadoClass = 'resultado-empate';
                    }
                } else {
                    if (resultado.golesVisitante > resultado.golesLocal) {
                        resultadoClass = 'resultado-victoria';
                    } else if (resultado.golesVisitante < resultado.golesLocal) {
                        resultadoClass = 'resultado-derrota';
                    } else {
                        resultadoClass = 'resultado-empate';
                    }
                }
                
                html += `
                    <div class="partido-resumen ${resultadoClass}">
                        <div class="partido-fecha">${new Date(partido.fecha).toLocaleDateString()}</div>
                        <div class="partido-equipos">
                            <span class="${partido.local === parseInt(equipoId) ? 'equipo-destacado' : ''}">${equipoLocal.nombre}</span>
                            <span class="partido-resultado">${resultado.golesLocal} - ${resultado.golesVisitante}</span>
                            <span class="${partido.visitante === parseInt(equipoId) ? 'equipo-destacado' : ''}">${equipoVisitante.nombre}</span>
                        </div>
                    </div>
                `;
            }
        };
        
        html += '</div>';
        
        estadisticasContainer.innerHTML = html;
    }
};

// Inicializar el módulo cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    EquiposModule.init();
});

// Cambiar de pestaña
document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none';
        });
        this.classList.add('active');
        const tabContent = document.getElementById('tab-content-' + this.dataset.tab);
        if (tabContent) {
            tabContent.classList.add('active');
            tabContent.style.display = 'block';
        }
    });
});

// Actualizar el link de crear jugador con el id del equipo
const equipoId = new URLSearchParams(window.location.search).get('id');
if (equipoId) {
    const equipoIdLink = document.getElementById('equipo-id-link');
    if (equipoIdLink) equipoIdLink.textContent = equipoId;
    const crearJugadorBtn = document.querySelector('a[href*="jugadores/crear.html"]');
    if (crearJugadorBtn) crearJugadorBtn.href = `../jugadores/crear.html?equipoId=${equipoId}`;
}

// Mostrar jugadores del equipo en la pestaña correspondiente
if (equipoId) {
    // Espera a que el DOM y el módulo estén listos
    if (window.EquiposModule && EquiposModule.cargarJugadoresEquipo) {
        window.FirebaseDataStore.getEquipo(equipoId).then(equipo => {
            if (equipo) {
                EquiposModule.cargarJugadoresEquipo(equipo);
            }
        });
    }
}