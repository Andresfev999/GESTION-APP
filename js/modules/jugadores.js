// Módulo para la gestión de jugadores
const JugadoresModule = {
    // Inicializar el módulo
    init: function() {
        if (document.getElementById('jugadores-list')) {
            this.cargarJugadores();
            this.initFiltros();
        }
        if (document.getElementById('jugador-form')) {
            this.initForm();
        }
        if (document.getElementById('jugador-detalle')) {
            this.cargarDetalleJugador();
        }
    },

    // Cargar la lista de jugadores
    cargarJugadores: async function(filtroEquipo = '', filtroPosicion = '', busqueda = '') {
        const jugadoresList = document.getElementById('jugadores-list');
        const jugadoresCount = document.getElementById('jugadores-count');
        let jugadores = await window.FirebaseDataStore.getJugadores();

        // Aplicar filtros
        if (filtroEquipo) {
            jugadores = jugadores.filter(jugador => String(jugador.equipo) === String(filtroEquipo));
        }
        if (filtroPosicion) {
            jugadores = jugadores.filter(jugador => jugador.posicion === filtroPosicion);
        }
        if (busqueda) {
            const terminoBusqueda = busqueda.toLowerCase();
            jugadores = jugadores.filter(jugador =>
                jugador.nombre.toLowerCase().includes(terminoBusqueda)
            );
        }

        if (jugadores.length === 0) {
            jugadoresList.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            No hay jugadores que coincidan con los criterios de búsqueda.
                        </div>
                    </td>
                </tr>
            `;
            jugadoresCount.textContent = 'Mostrando 0 jugadores';
            return;
        }

        let html = '';
        for (const jugador of jugadores) {
            let equipoNombre = 'Sin equipo';
            if (jugador.equipo) {
                try {
                    const equipo = await window.FirebaseDataStore.getEquipo(String(jugador.equipo));
                    if (equipo && equipo.nombre) equipoNombre = equipo.nombre;
                } catch (e) {
                    equipoNombre = 'Sin equipo';
                }
            }

            // Calcular edad a partir de la fecha de nacimiento
            let edad = '-';
            if (jugador.fechaNacimiento) {
                const fechaNac = new Date(jugador.fechaNacimiento);
                const hoy = new Date();
                edad = hoy.getFullYear() - fechaNac.getFullYear();
                const m = hoy.getMonth() - fechaNac.getMonth();
                if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
                    edad--;
                }
            }

            html += `
            <tr>
                <td>${jugador.nombre}</td>
                <td>${equipoNombre}</td>
                <td>${jugador.posicion || '-'}</td>
                <td>${edad || '-'}</td>
                <td>
                    <a href="detalle.html?id=${jugador.id}" class="btn btn-sm btn-info"><i class="fas fa-eye"></i></a>
                    <a href="crear.html?id=${jugador.id}" class="btn btn-sm btn-warning"><i class="fas fa-edit"></i></a>
                    <button class="btn btn-sm btn-danger eliminar-jugador" data-id="${jugador.id}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
            `;
        }

        jugadoresList.innerHTML = html;
        jugadoresCount.textContent = `Mostrando ${jugadores.length} jugadores`;

        // Después de insertar el HTML de la tabla
        document.querySelectorAll('.eliminar-jugador').forEach(btn => {
            btn.addEventListener('click', async function() {
                const jugadorId = this.getAttribute('data-id');
                if (confirm('¿Seguro que deseas eliminar este jugador?')) {
                    await window.FirebaseDataStore.deleteJugador(jugadorId);
                    // Recarga la lista de jugadores
                    location.reload();
                }
            });
        });
    },

    // Inicializar filtros de jugadores
    initFiltros: async function() {
        const filtroEquipo = document.getElementById('filtro-equipo');
        const filtroPosicion = document.getElementById('filtro-posicion');
        const buscarJugador = document.getElementById('buscar-jugador');

        // Cargar opciones de equipos
        if (filtroEquipo) {
            const equipos = await window.FirebaseDataStore.getEquipos();
            let opcionesEquipos = '<option value="">Todos los equipos</option>';

            equipos.forEach(equipo => {
                opcionesEquipos += `<option value="${equipo.id}">${equipo.nombre}</option>`;
            });

            filtroEquipo.innerHTML = opcionesEquipos;

            filtroEquipo.addEventListener('change', () => {
                this.aplicarFiltros();
            });
        }

        if (filtroPosicion) {
            filtroPosicion.addEventListener('change', () => {
                this.aplicarFiltros();
            });
        }

        if (buscarJugador) {
            buscarJugador.addEventListener('input', () => {
                this.aplicarFiltros();
            });
        }
    },

    // Aplicar filtros a la lista de jugadores
    aplicarFiltros: function() {
        const filtroEquipo = document.getElementById('filtro-equipo');
        const filtroPosicion = document.getElementById('filtro-posicion');
        const buscarJugador = document.getElementById('buscar-jugador');

        const valorFiltroEquipo = filtroEquipo ? filtroEquipo.value : '';
        const valorFiltroPosicion = filtroPosicion ? filtroPosicion.value : '';
        const valorBusqueda = buscarJugador ? buscarJugador.value : '';

        this.cargarJugadores(valorFiltroEquipo, valorFiltroPosicion, valorBusqueda);
    },

    // Inicializar el formulario de creación/edición
    initForm: async function() {
        const form = document.getElementById('jugador-form');
        const urlParams = new URLSearchParams(window.location.search);
        const jugadorId = urlParams.get('id');

        // Cargar opciones de equipos
        const equipoSelect = document.getElementById('equipo');
        if (equipoSelect) {
            const equipos = await window.FirebaseDataStore.getEquipos();
            let opcionesEquipos = '<option value="">Selecciona un equipo</option>';

            equipos.forEach(equipo => {
                opcionesEquipos += `<option value="${equipo.id}">${equipo.nombre}</option>`;
            });

            equipoSelect.innerHTML = opcionesEquipos;
        }

        // Si hay un ID, cargar los datos del jugador para edición
        if (jugadorId) {
            const jugador = await window.FirebaseDataStore.getJugador(jugadorId);
            if (jugador) {
                document.getElementById('jugador-title').textContent = 'Editar Jugador';
                document.getElementById('nombre').value = jugador.nombre.split(' ')[0] || '';
                document.getElementById('apellidos').value = jugador.nombre.split(' ').slice(1).join(' ') || '';

                if (jugador.fechaNacimiento) {
                    document.getElementById('fechaNacimiento').value = jugador.fechaNacimiento;
                }

                if (jugador.equipo) {
                    document.getElementById('equipo').value = jugador.equipo;
                }

                if (jugador.posicion) {
                    document.getElementById('posicion').value = jugador.posicion;
                }

                if (jugador.dorsal) {
                    document.getElementById('dorsal').value = jugador.dorsal;
                }

                if (jugador.documentoIdentidad) {
                    document.getElementById('documentoIdentidad').value = jugador.documentoIdentidad;
                }

                // Si hay una foto, mostrarla
                if (jugador.foto) {
                    const previewContainer = document.querySelector('.file-input-container');
                    const preview = document.createElement('div');
                    preview.className = 'file-preview';
                    preview.innerHTML = `
                        <img src="${jugador.foto}" alt="Foto">
                        <span class="file-preview-name">Foto actual</span>
                        <button type="button" class="file-preview-remove">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    previewContainer.appendChild(preview);

                    const removeBtn = preview.querySelector('.file-preview-remove');
                    removeBtn.addEventListener('click', function() {
                        preview.remove();
                    });
                }
            }
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarJugador(jugadorId);
        });
    },

    // Guardar jugador
    guardarJugador: async function(jugadorId) {
        const nombre = document.getElementById('nombre').value;
        const apellidos = document.getElementById('apellidos').value;
        const nombreCompleto = `${nombre} ${apellidos}`.trim();
        const fechaNacimiento = document.getElementById('fechaNacimiento').value;
        const equipo = document.getElementById('equipo').value;
        const posicion = document.getElementById('posicion').value;
        const dorsal = document.getElementById('dorsal').value;
        const documentoIdentidad = document.getElementById('documentoIdentidad').value;

        // Obtener foto de perfil
        let foto = null;
        const filePreview = document.getElementById('foto-preview');
        if (filePreview) {
            foto = filePreview.src;
        }

        // Obtener foto documento frontal
        let fotoDocFrontal = null;
        const frontalPreview = document.getElementById('foto-doc-frontal-preview');
        if (frontalPreview) {
            fotoDocFrontal = frontalPreview.src;
        }

        // Obtener foto documento reverso
        let fotoDocReverso = null;
        const reversoPreview = document.getElementById('foto-doc-reverso-preview');
        if (reversoPreview) {
            fotoDocReverso = reversoPreview.src;
        }

        // Crear objeto jugador
        const jugador = {
            id: jugadorId,
            nombre: nombreCompleto,
            fechaNacimiento,
            equipo: String(equipo),
            posicion,
            dorsal: dorsal ? parseInt(dorsal) : null,
            documentoIdentidad,
            foto,
            fotoDocFrontal,
            fotoDocReverso
        };

        // Guardar jugador
        await window.FirebaseDataStore.saveJugador(jugador);

        // Redirigir a la lista de jugadores
        window.location.href = 'index.html';
    },

    // Cargar detalle de un jugador
    cargarDetalleJugador: async function() {
        const urlParams = new URLSearchParams(window.location.search);
        const jugadorId = urlParams.get('id');

        if (!jugadorId) {
            window.location.href = 'index.html';
            return;
        }

        const jugador = await window.FirebaseDataStore.getJugador(jugadorId);
        if (!jugador) {
            window.location.href = 'index.html';
            return;
        }

        // Nombre completo
        document.getElementById('jugador-nombre').textContent = jugador.nombre || '-';
        document.getElementById('info-nombre-completo').textContent = jugador.nombre || '-';

        // Fecha de nacimiento y edad
        if (jugador.fechaNacimiento) {
            const fechaNac = new Date(jugador.fechaNacimiento);
            document.getElementById('info-fecha-nacimiento').textContent = fechaNac.toLocaleDateString();
            const hoy = new Date();
            let edad = hoy.getFullYear() - fechaNac.getFullYear();
            const m = hoy.getMonth() - fechaNac.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < fechaNac.getDate())) {
                edad--;
            }
            document.getElementById('info-edad').textContent = `${edad} años`;
        } else {
            document.getElementById('info-fecha-nacimiento').textContent = '-';
            document.getElementById('info-edad').textContent = '-';
        }

        // Documento de identidad
        document.getElementById('info-documento-identidad').textContent = jugador.documentoIdentidad || '-';

        // Equipo
        if (jugador.equipo) {
            const equipo = await window.FirebaseDataStore.getEquipo(String(jugador.equipo));
            const equipoNombre = equipo && equipo.nombre ? equipo.nombre : '-';
            document.getElementById('jugador-equipo').textContent = equipoNombre;
            document.getElementById('info-equipo').textContent = equipoNombre;
        } else {
            document.getElementById('jugador-equipo').textContent = '-';
            document.getElementById('info-equipo').textContent = '-';
        }

        // Posición
        document.getElementById('jugador-posicion').textContent = jugador.posicion || '-';
        document.getElementById('info-posicion').textContent = jugador.posicion || '-';

        // Dorsal
        document.getElementById('jugador-dorsal').textContent = jugador.dorsal || '-';
        document.getElementById('info-dorsal').textContent = jugador.dorsal || '-';

        // Foto de perfil
        const fotoImg = document.getElementById('jugador-foto');
        if (jugador.foto) {
            fotoImg.src = jugador.foto;
            fotoImg.style.display = 'block';
        } else {
            fotoImg.style.display = 'none';
        }

        // Foto documento frontal
        const imgFrontal = document.getElementById('info-foto-doc-frontal');
        if (jugador.fotoDocFrontal) {
            imgFrontal.src = jugador.fotoDocFrontal;
            imgFrontal.style.display = 'block';
        } else {
            imgFrontal.style.display = 'none';
        }

        // Foto documento reverso
        const imgReverso = document.getElementById('info-foto-doc-reverso');
        if (jugador.fotoDocReverso) {
            imgReverso.src = jugador.fotoDocReverso;
            imgReverso.style.display = 'block';
        } else {
            imgReverso.style.display = 'none';
        }
    }
};

// Inicializar el módulo cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', async function() {
    JugadoresModule.init();

    // Cargar equipos en el select
    const equiposSelect = document.getElementById('equipo');
    if (equiposSelect && window.FirebaseDataStore && window.FirebaseDataStore.getEquipos) {
        const equipos = await window.FirebaseDataStore.getEquipos();
        equipos.forEach(equipo => {
            const option = document.createElement('option');
            option.value = equipo.id;
            option.textContent = equipo.nombre;
            equiposSelect.appendChild(option);
        });
    }
});

function previewImage(inputId, previewId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(ev) {
            let preview = document.getElementById(previewId);
            if (!preview) {
                preview = document.createElement('img');
                preview.id = previewId;
                preview.style.maxWidth = '120px';
                preview.style.marginTop = '10px';
                input.parentNode.appendChild(preview);
            }
            preview.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    });
}
previewImage('foto', 'foto-preview');
previewImage('fotoDocFrontal', 'foto-doc-frontal-preview');
previewImage('fotoDocReverso', 'foto-doc-reverso-preview');