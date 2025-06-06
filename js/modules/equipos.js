// Módulo para la gestión de equipos
const EquiposModule = {
  // Inicializar el módulo
  init: async function () {
    // Cargar la lista de equipos si estamos en la página de equipos
    if (document.getElementById("equipos-list")) {
      this.cargarEquipos()
      this.initBusqueda()
    }

    // Inicializar el formulario de creación/edición
    if (document.getElementById("equipo-form")) {
      this.initForm()
      this.initFileUpload()
    }
  },

  // Cargar la lista de equipos
  cargarEquipos: async () => {
    // En la función cargarEquipos, modificar el div de loading-spinner
    const equiposList = document.getElementById("equipos-list")
    equiposList.innerHTML = '<div class="loading-spinner"></div>'
    const equipos = await window.FirebaseDataStore.getEquipos()

    if (equipos.length === 0) {
      equiposList.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    No hay equipos registrados. ¡Crea el primero!
                </div>
            `
      return
    }

    let html = ""
    for (let i = 0; i < equipos.length; i++) {
      const equipo = equipos[i]

      // Ejemplo de renderizado de cada equipo
      html += `
            <div class="card equipo-card">
                <div class="card-img">
                    <img src="${equipo.escudo ? equipo.escudo : "../../assets/img/default-shield.png"}" 
                         alt="Escudo de ${equipo.nombre}" 
                         class="escudo-lista">
                </div>
                <div class="card-body">
                    <h2 class="card-title">${equipo.nombre}</h2>
                    <p>${equipo.ciudad || ""}</p>
                    <a href="detalle.html?id=${equipo.id}" class="btn btn-sm btn-info">Ver Detalle</a>
                    <a href="crear.html?id=${equipo.id}" class="btn btn-sm btn-warning"><i class="fas fa-edit"></i> Editar</a>
                    <button class="btn btn-sm btn-danger eliminar-equipo" data-id="${equipo.id}">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
            `
    }

    equiposList.innerHTML = html

    // Agregar eventos para eliminar equipos
    const botonesEliminar = document.querySelectorAll(".eliminar-equipo")
    botonesEliminar.forEach((boton) => {
      boton.addEventListener("click", async function (e) {
        e.preventDefault()
        const equipoId = this.getAttribute("data-id")
        await EquiposModule.confirmarEliminarEquipo(equipoId)
      })
    })
  },

  // Confirmar eliminación de equipo
  confirmarEliminarEquipo: async (equipoId) => {
    const equipo = await window.FirebaseDataStore.getEquipo(equipoId)
    if (!equipo) return

    // Verificar si el equipo tiene jugadores
    const jugadores = await window.FirebaseDataStore.getJugadoresPorEquipo(equipoId)

    // Verificar si el equipo participa en torneos
    const torneos = await window.FirebaseDataStore.getTorneos()
    const torneosConEquipo = torneos.filter((torneo) => torneo.equipos && torneo.equipos.includes(equipoId))

    let mensaje = `¿Estás seguro de que deseas eliminar el equipo "${equipo.nombre}"?`

    if (jugadores.length > 0) {
      mensaje += `\n\nEste equipo tiene ${jugadores.length} jugador(es) que también serán eliminados.`
    }

    if (torneosConEquipo.length > 0) {
      mensaje += `\n\nEste equipo participa en ${torneosConEquipo.length} torneo(s). Será removido de estos torneos.`
    }

    if (confirm(mensaje)) {
      await EquiposModule.eliminarEquipo(equipoId)
    }
  },

  // Eliminar equipo
  eliminarEquipo: async function (equipoId) {
    try {
      // Eliminar jugadores del equipo
      const jugadores = await window.FirebaseDataStore.getJugadoresPorEquipo(equipoId)
      for (let i = 0; i < jugadores.length; i++) {
        const jugador = jugadores[i]
        await window.FirebaseDataStore.deleteJugador(jugador.id)
      }

      // Remover equipo de torneos
      const torneos = await window.FirebaseDataStore.getTorneos()
      for (let i = 0; i < torneos.length; i++) {
        const torneo = torneos[i]
        if (torneo.equipos && torneo.equipos.includes(Number.parseInt(equipoId))) {
          torneo.equipos = torneo.equipos.filter((id) => id !== equipoId)
          await window.FirebaseDataStore.saveTorneo(torneo)
        }
      }

      // Eliminar partidos donde participa el equipo
      const partidos = await window.FirebaseDataStore.getPartidos()
      for (let i = 0; i < partidos.length; i++) {
        const partido = partidos[i]
        if (partido.local === equipoId || partido.visitante === equipoId) {
          await window.FirebaseDataStore.deletePartido(partido.id)
        }
      }

      // Eliminar el equipo
      const resultado = await window.FirebaseDataStore.deleteEquipo(equipoId)

      if (resultado) {
        // Mostrar mensaje de éxito
        if (window.showNotification) {
          window.showNotification("Equipo eliminado correctamente", "success")
        }

        // Recargar la lista de equipos
        this.cargarEquipos()
      } else {
        if (window.showNotification) {
          window.showNotification("Error al eliminar el equipo", "error")
        }
      }
    } catch (error) {
      console.error("Error al eliminar equipo:", error)
      if (window.showNotification) {
        window.showNotification("Error al eliminar el equipo", "error")
      }
    }
  },

  // Inicializar búsqueda de equipos
  initBusqueda: () => {
    const buscarInput = document.getElementById("buscar-equipo")
    if (!buscarInput) return

    buscarInput.addEventListener("input", () => {
      const termino = buscarInput.value.toLowerCase()
      const equipos = document.querySelectorAll("#equipos-list .card")

      equipos.forEach((equipo) => {
        const nombre = equipo.querySelector(".card-title").textContent.toLowerCase()
        if (nombre.includes(termino)) {
          equipo.style.display = "block"
        } else {
          equipo.style.display = "none"
        }
      })
    })
  },

  // Inicializar el formulario de creación/edición
  initForm: async function () {
    const form = document.getElementById("equipo-form")
    const urlParams = new URLSearchParams(window.location.search)
    const equipoId = urlParams.get("id")

    // Cambiar el título si es edición
    const titulo = document.getElementById("equipo-title")
    if (titulo) {
      titulo.textContent = equipoId ? "Editar Equipo" : "Crear Nuevo Equipo"
    }

    // Si es edición, cargar los datos del equipo
    if (equipoId) {
      const equipo = await window.FirebaseDataStore.getEquipo(equipoId)
      if (equipo) {
        document.getElementById("nombre").value = equipo.nombre || ""
        document.getElementById("ciudad").value = equipo.ciudad || ""
        document.getElementById("abreviatura").value = equipo.abreviatura || ""
        document.getElementById("descripcion").value = equipo.descripcion || ""
        document.getElementById("fundacion").value = equipo.fundacion || ""

        // Previsualizar escudo si existe
        if (equipo.escudo) {
          const previewContainer = document.querySelector(".file-input-container")
          if (previewContainer) {
            const existingPreview = previewContainer.querySelector(".file-preview")
            if (existingPreview) existingPreview.remove()

            const preview = document.createElement("div")
            preview.className = "file-preview"
            preview.innerHTML = `
                            <img src="${equipo.escudo}" alt="Escudo">
                            <span class="file-preview-name">Escudo actual</span>
                            <button type="button" class="file-preview-remove">
                                <i class="fas fa-times"></i>
                            </button>
                        `
            previewContainer.appendChild(preview)

            const removeBtn = preview.querySelector(".file-preview-remove")
            removeBtn.addEventListener("click", () => {
              preview.remove()
              document.getElementById("escudo").value = ""
            })
          }
        }
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault()
      await this.guardarEquipo(equipoId)
    })

    // Supón que tienes un array jugadoresEquipo con los jugadores del equipo
    const jugadoresEquipo = await window.FirebaseDataStore.getJugadoresPorEquipo(equipoId)
    const porteroSelect = document.getElementById('portero');
    if (porteroSelect && jugadoresEquipo.length > 0) {
        let opciones = '<option value="">Selecciona un portero</option>';
        jugadoresEquipo.forEach(jugador => {
            opciones += `<option value="${jugador.id}">${jugador.nombre} ${jugador.apellido || ''}</option>`;
        });
        porteroSelect.innerHTML = opciones;

        // Seleccionar el portero guardado si existe
        const equipo = await window.FirebaseDataStore.getEquipo(equipoId);
        if (equipo && equipo.portero) {
            porteroSelect.value = equipo.portero;
        }
    }
  },

  // Inicializar carga de archivos
  initFileUpload: () => {
    const fileInput = document.querySelector(".file-input")
    if (!fileInput) return

    fileInput.addEventListener("change", function () {
      const file = this.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        const existingPreview = document.querySelector(".file-preview")
        if (existingPreview) {
          existingPreview.remove()
        }

        const previewContainer = document.querySelector(".file-input-container")
        const preview = document.createElement("div")
        preview.className = "file-preview"
        preview.innerHTML = `
                    <img src="${e.target.result}" alt="Escudo">
                    <span class="file-preview-name">${file.name}</span>
                    <button type="button" class="file-preview-remove">
                        <i class="fas fa-times"></i>
                    </button>
                `
        previewContainer.appendChild(preview)

        const removeBtn = preview.querySelector(".file-preview-remove")
        removeBtn.addEventListener("click", () => {
          preview.remove()
          fileInput.value = ""
        })
      }

      reader.readAsDataURL(file)
    })
  },

  // Guardar equipo
  guardarEquipo: async (equipoId) => {
    const nombre = document.getElementById("nombre").value
    const ciudad = document.getElementById("ciudad").value
    const abreviatura = document.getElementById("abreviatura").value
    const descripcion = document.getElementById("descripcion").value
    const fundacion = document.getElementById("fundacion").value

    // Obtener escudo como base64
    let escudo = null
    const escudoInput = document.getElementById("escudo")
    if (escudoInput && escudoInput.files && escudoInput.files[0]) {
      const file = escudoInput.files[0]
      escudo = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = (e) => reject(e)
        reader.readAsDataURL(file)
      })
    } else {
      const previewImg = document.querySelector(".file-preview img")
      if (previewImg) {
        escudo = previewImg.src
      } else if (equipoId) {
        // Si no hay preview y es edición, obtener el escudo anterior de la base de datos
        const equipoAnterior = await window.FirebaseDataStore.getEquipo(equipoId)
        if (equipoAnterior && equipoAnterior.escudo) {
          escudo = equipoAnterior.escudo
        }
      }
    }

    const equipo = {
      id: equipoId,
      nombre,
      ciudad,
      abreviatura,
      descripcion,
      fundacion,
      escudo,
    }

    await window.FirebaseDataStore.saveEquipo(equipo)

    // Actualizar el portero en el documento del equipo en Firestore
    const porteroId = document.getElementById('portero').value;
    if (porteroId) {
      await window.FirebaseDataStore.db.collection('equipos').doc(equipoId).update({ portero: porteroId });
    }

    window.location.href = "index.html"
  },

  // Cargar detalle de un equipo
  cargarDetalleEquipo: async (equipoId) => {
    if (!equipoId) {
      window.location.href = "index.html"
      return
    }

    const equipo = await window.FirebaseDataStore.getEquipo(equipoId)
    if (!equipo) {
      window.location.href = "index.html"
      return
    }

    // Mostrar información del equipo
    const nombreElement = document.getElementById("equipo-nombre")
    if (nombreElement) {
      nombreElement.textContent = equipo.nombre
    }

    const ciudadElement = document.getElementById("equipo-ciudad")
    if (ciudadElement && equipo.ciudad) {
      ciudadElement.textContent = equipo.ciudad
    }

    const fundacionElement = document.getElementById("equipo-fundacion")
    if (fundacionElement && equipo.fundacion) {
      fundacionElement.textContent = equipo.fundacion
    }

    // Mostrar escudo si existe
    const escudoImg = document.getElementById("equipo-escudo")
    if (escudoImg && equipo.escudo) {
      escudoImg.src = equipo.escudo
      escudoImg.style.display = "block"
    }

    // Llenar información detallada si existen los elementos
    const infoNombre = document.getElementById("info-nombre")
    if (infoNombre) infoNombre.textContent = equipo.nombre

    const infoAbreviatura = document.getElementById("info-abreviatura")
    if (infoAbreviatura) infoAbreviatura.textContent = equipo.abreviatura || "-"

    const infoCiudad = document.getElementById("info-ciudad")
    if (infoCiudad) infoCiudad.textContent = equipo.ciudad || "-"

    const infoFundacion = document.getElementById("info-fundacion")
    if (infoFundacion) infoFundacion.textContent = equipo.fundacion || "-"

    const infoDescripcion = document.getElementById("info-descripcion")
    if (infoDescripcion) infoDescripcion.textContent = equipo.descripcion || "Sin descripción"
  },

  // Cargar jugadores de un equipo - FUNCIÓN CORREGIDA
  cargarJugadoresEquipo: async function (equipo) {
    console.log("Cargando jugadores para el equipo:", equipo)

    // Buscar el contenedor correcto
    let jugadoresContainer = document.getElementById("jugadores-lista")
    if (!jugadoresContainer) {
      jugadoresContainer = document.getElementById("equipo-jugadores")
    }

    if (!jugadoresContainer) {
      console.error("No se encontró el contenedor de jugadores")
      return
    }

    try {
      // Asegurarse de que tenemos un ID de equipo válido
      if (!equipo || !equipo.id) {
        throw new Error("ID de equipo no válido")
      }

      // Obtener jugadores del equipo
      const jugadores = await window.FirebaseDataStore.getJugadoresPorEquipo(equipo.id)
      console.log("Jugadores obtenidos:", jugadores)

      if (!jugadores || jugadores.length === 0) {
        jugadoresContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        No hay jugadores registrados para este equipo.
                    </div>
                    <div class="text-center mt-4">
                        <a href="../jugadores/crear.html?equipoId=${equipo.id}" class="btn btn-primary">
                            <i class="fas fa-plus"></i> Añadir Jugador
                        </a>
                    </div>
                `
        return
      }

      // Agrupar jugadores por posición
      const jugadoresPorPosicion = {
        Portero: [],
        Defensa: [],
        Mediocampista: [],
        Delantero: [],
      }

      jugadores.forEach((jugador) => {
        if (jugador.posicion && jugadoresPorPosicion[jugador.posicion]) {
          jugadoresPorPosicion[jugador.posicion].push(jugador)
        } else {
          jugadoresPorPosicion["Mediocampista"].push(jugador)
        }
      })

      let html = `
    <div class="text-right mb-3">
        <a href="../jugadores/crear.html?equipoId=${equipo.id}" class="btn btn-primary">
            <i class="fas fa-plus"></i> Añadir Jugador
        </a>
    </div>
`;

      jugadores.forEach(jugador => {
          html += `
        <div class="jugador-card">
            <img src="${jugador.foto || '../../assets/img/default-player.png'}" alt="${jugador.nombre}">
            <div class="jugador-info">
                <strong>${jugador.nombre}</strong><br>
                <span>${jugador.posicion || ''}</span>
            </div>
            <div class="jugador-actions">
                <a href="../jugadores/detalle.html?id=${jugador.id}" class="btn btn-outline btn-sm">Ver perfil</a>
                <button class="btn btn-danger btn-sm eliminar-jugador" data-id="${jugador.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
});

jugadoresContainer.innerHTML = html

      // Agregar eventos para eliminar jugadores
      const botonesEliminar = jugadoresContainer.querySelectorAll(".eliminar-jugador")
      botonesEliminar.forEach((boton) => {
        boton.addEventListener("click", async (e) => {
          e.preventDefault()
          const jugadorId = boton.getAttribute("data-id")
          if (confirm("¿Seguro que deseas eliminar este jugador?")) {
            await window.FirebaseDataStore.deleteJugador(jugadorId)
            // Recargar jugadores después de eliminar
            this.cargarJugadoresEquipo(equipo)
          }
        })
      })
    } catch (error) {
      console.error("Error al cargar jugadores:", error)
      jugadoresContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al cargar los jugadores: ${error.message}
                </div>
            `
    }
  },

  // Cargar torneos de un equipo
  cargarTorneosEquipo: async (equipoId) => {
    const torneosContainer = document.getElementById("equipo-torneos")
    if (!torneosContainer) return

    try {
      const torneos = await window.FirebaseDataStore.getTorneos()
      const torneosConEquipo = torneos.filter(
        (torneo) => torneo.equipos && torneo.equipos.includes(Number.parseInt(equipoId)),
      )

      if (torneosConEquipo.length === 0) {
        torneosContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        Este equipo no participa en ningún torneo actualmente.
                    </div>
                `
        return
      }

      let html = '<div class="torneos-grid">'
      torneosConEquipo.forEach((torneo) => {
        let estadoClass = ""
        if (torneo.estado === "En curso") {
          estadoClass = "badge-primary"
        } else if (torneo.estado === "Finalizado") {
          estadoClass = "badge-danger"
        } else {
          estadoClass = "badge-warning"
        }

        html += `
                    <div class="torneo-card">
                        <div class="torneo-header">
                            <img src="${torneo.escudo || "../../assets/img/default-trophy.png"}" alt="${torneo.nombre}" class="torneo-escudo">
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
                `
      })
      html += "</div>"

      torneosContainer.innerHTML = html
    } catch (error) {
      console.error("Error al cargar torneos:", error)
      torneosContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al cargar los torneos.
                </div>
            `
    }
  },

  // Cargar estadísticas de un equipo
  cargarEstadisticasEquipo: async (equipoId) => {
    const estadisticasContainer = document.getElementById("equipo-estadisticas")
    if (!estadisticasContainer) return

    try {
      const partidos = await window.FirebaseDataStore.getPartidos()
      const partidosEquipo = partidos.filter(
        (partido) =>
          (partido.local === Number.parseInt(equipoId) || partido.visitante === Number.parseInt(equipoId)) &&
          partido.estado === "Finalizado" &&
          partido.resultado,
      )

      if (partidosEquipo.length === 0) {
        estadisticasContainer.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle"></i>
                        No hay estadísticas disponibles para este equipo.
                    </div>
                `
        return
      }

      // Calcular estadísticas
      let partidosJugados = 0
      let partidosGanados = 0
      let partidosEmpatados = 0
      let partidosPerdidos = 0
      let golesFavor = 0
      let golesContra = 0

      partidosEquipo.forEach((partido) => {
        partidosJugados++

        if (partido.local === Number.parseInt(equipoId)) {
          golesFavor += partido.resultado.golesLocal
          golesContra += partido.resultado.golesVisitante

          if (partido.resultado.golesLocal > partido.resultado.golesVisitante) {
            partidosGanados++
          } else if (partido.resultado.golesLocal < partido.resultado.golesVisitante) {
            partidosPerdidos++
          } else {
            partidosEmpatados++
          }
        } else {
          golesFavor += partido.resultado.golesVisitante
          golesContra += partido.resultado.golesLocal

          if (partido.resultado.golesVisitante > partido.resultado.golesLocal) {
            partidosGanados++
          } else if (partido.resultado.golesVisitante < partido.resultado.golesLocal) {
            partidosPerdidos++
          } else {
            partidosEmpatados++
          }
        }
      })

      const diferenciaGoles = golesFavor - golesContra
      const efectividad = Math.round((partidosGanados * 100) / partidosJugados)

      const html = `
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
                        <div class="estadistica-valor">${diferenciaGoles > 0 ? "+" + diferenciaGoles : diferenciaGoles}</div>
                        <div class="estadistica-label">Diferencia de Goles</div>
                    </div>
                    <div class="estadistica-item">
                        <div class="estadistica-valor">${efectividad}%</div>
                        <div class="estadistica-label">Efectividad</div>
                    </div>
                </div>
            `

      estadisticasContainer.innerHTML = html
    } catch (error) {
      console.error("Error al cargar estadísticas:", error)
      estadisticasContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i>
                    Error al cargar las estadísticas.
                </div>
            `
    }
  },
}

// Inicializar el módulo cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
  EquiposModule.init()
})
