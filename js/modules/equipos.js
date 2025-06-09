// Módulo para la gestión de equipos
const EquiposModule = {
  // Inicializar el módulo
  init: async function () {
    console.log("Inicializando EquiposModule...")

    // Esperar a que Firebase esté listo
    await this.waitForFirebase()

    if (document.getElementById("equipos-list")) {
      this.cargarEquipos()
      this.initBusqueda()
    }
    if (document.getElementById("equipo-form")) {
      this.initForm()
      this.initFileUpload()
    }
  },

  // Función para esperar a que Firebase esté listo
  waitForFirebase: () =>
    new Promise((resolve) => {
      console.log("EquiposModule: Esperando a que FirebaseDataStore esté listo...")

      // Verificar si ya está listo
      if (window.FirebaseDataStore && window.FirebaseDataStore.isReady && window.FirebaseDataStore.isReady()) {
        console.log("EquiposModule: FirebaseDataStore ya está listo")
        resolve()
        return
      }

      // Si no está listo, esperar
      const checkFirebase = setInterval(() => {
        if (window.FirebaseDataStore && window.FirebaseDataStore.isReady && window.FirebaseDataStore.isReady()) {
          clearInterval(checkFirebase)
          console.log("EquiposModule: FirebaseDataStore está listo")
          resolve()
        }
      }, 200)

      // Timeout después de 10 segundos
      setTimeout(() => {
        clearInterval(checkFirebase)
        console.error("EquiposModule: Timeout esperando a FirebaseDataStore")
        resolve() // Resolver de todos modos para no bloquear la aplicación
      }, 10000)
    }),

  // Verificar que todas las funciones necesarias estén disponibles
  verificarFunciones: () => {
    const funcionesNecesarias = [
      "getEquipo",
      "getJugadoresPorEquipo",
      "getTorneos",
      "getPartidos",
      "deleteJugador",
      "saveTorneo",
      "deletePartido",
      "deleteEquipo",
    ]

    const funcionesFaltantes = funcionesNecesarias.filter(
      (func) => !window.FirebaseDataStore || typeof window.FirebaseDataStore[func] !== "function",
    )

    if (funcionesFaltantes.length > 0) {
      console.error("Funciones faltantes en FirebaseDataStore:", funcionesFaltantes)
      return false
    }

    console.log("Todas las funciones necesarias están disponibles")
    return true
  },

  // Cargar la lista de equipos
  cargarEquipos: async () => {
    const equiposList = document.getElementById("equipos-list")
    equiposList.innerHTML = '<div class="loading-spinner">Cargando equipos...</div>'

    try {
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
          if (equipoId) {
            await EquiposModule.confirmarEliminarEquipo(equipoId)
          }
        })
      })
    } catch (error) {
      console.error("Error al cargar equipos:", error)
      equiposList.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar los equipos: ${error.message}
        </div>
      `
    }
  },

  // Confirmar eliminación de equipo - FUNCIÓN CORREGIDA
  confirmarEliminarEquipo: async (equipoId) => {
    try {
      // Verificar que FirebaseDataStore esté disponible y tenga todas las funciones
      if (!window.FirebaseDataStore || !EquiposModule.verificarFunciones()) {
        console.error("FirebaseDataStore no está disponible o le faltan funciones")
        alert("Error: Sistema no inicializado correctamente. Por favor, recarga la página.")
        return
      }

      console.log("Obteniendo equipo con ID:", equipoId)
      const equipo = await window.FirebaseDataStore.getEquipo(equipoId)

      if (!equipo) {
        alert("Error: No se pudo encontrar el equipo.")
        return
      }

      // Verificar si el equipo tiene jugadores
      const jugadores = await window.FirebaseDataStore.getJugadoresPorEquipo(equipoId)

      // Verificar si el equipo participa en torneos
      const torneos = await window.FirebaseDataStore.getTorneos()
      const torneosConEquipo = torneos.filter(
        (torneo) => torneo.equipos && torneo.equipos.some((id) => String(id) === String(equipoId)),
      )

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
    } catch (error) {
      console.error("Error en confirmarEliminarEquipo:", error)
      alert("Error al procesar la eliminación del equipo. Por favor, inténtalo de nuevo.")
    }
  },

  // Eliminar equipo - FUNCIÓN CORREGIDA
  eliminarEquipo: async function (equipoId) {
    try {
      console.log("Intentando eliminar equipo con ID:", equipoId)

      // Verificar que FirebaseDataStore esté disponible
      if (!window.FirebaseDataStore || !this.verificarFunciones()) {
        throw new Error("FirebaseDataStore no está disponible o le faltan funciones")
      }

      // Eliminar jugadores del equipo
      console.log("Eliminando jugadores del equipo...")
      const jugadores = await window.FirebaseDataStore.getJugadoresPorEquipo(equipoId)
      for (let i = 0; i < jugadores.length; i++) {
        const jugador = jugadores[i]
        await window.FirebaseDataStore.deleteJugador(jugador.id)
      }
      console.log(`${jugadores.length} jugadores eliminados`)

      // Remover equipo de torneos
      console.log("Removiendo equipo de torneos...")
      const torneos = await window.FirebaseDataStore.getTorneos()
      for (let i = 0; i < torneos.length; i++) {
        const torneo = torneos[i]
        if (torneo.equipos && torneo.equipos.some((id) => String(id) === String(equipoId))) {
          torneo.equipos = torneo.equipos.filter((id) => String(id) !== String(equipoId))
          await window.FirebaseDataStore.saveTorneo(torneo)
        }
      }
      console.log("Equipo removido de torneos")

      // Eliminar partidos donde participa el equipo
      console.log("Eliminando partidos del equipo...")
      const partidos = await window.FirebaseDataStore.getPartidos()
      console.log(`Se encontraron ${partidos.length} partidos en total`)

      let partidosEliminados = 0
      for (let i = 0; i < partidos.length; i++) {
        const partido = partidos[i]
        if (String(partido.local) === String(equipoId) || String(partido.visitante) === String(equipoId)) {
          await window.FirebaseDataStore.deletePartido(partido.id)
          partidosEliminados++
        }
      }
      console.log(`${partidosEliminados} partidos eliminados`)

      // Eliminar el equipo
      console.log("Eliminando el equipo...")
      const resultado = await window.FirebaseDataStore.deleteEquipo(equipoId)
      console.log("Resultado de eliminación en Firebase:", resultado)

      if (resultado) {
        if (window.showNotification) {
          window.showNotification("Equipo eliminado correctamente", "success")
        } else {
          alert("Equipo eliminado correctamente")
        }
        this.cargarEquipos()
      } else {
        throw new Error("No se pudo eliminar el equipo de la base de datos")
      }
    } catch (error) {
      console.error("Error al eliminar equipo:", error)
      if (window.showNotification) {
        window.showNotification("Error al eliminar el equipo: " + error.message, "error")
      } else {
        alert("Error al eliminar el equipo: " + error.message)
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
      try {
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
      } catch (error) {
        console.error("Error al cargar datos del equipo:", error)
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault()
      await this.guardarEquipo(equipoId)
    })

    // Cargar jugadores para el select de portero
    if (equipoId) {
      try {
        const jugadoresEquipo = await window.FirebaseDataStore.getJugadoresPorEquipo(equipoId)
        const porteroSelect = document.getElementById("portero")
        if (porteroSelect && jugadoresEquipo.length > 0) {
          let opciones = '<option value="">Selecciona un portero</option>'
          jugadoresEquipo.forEach((jugador) => {
            opciones += `<option value="${jugador.id}">${jugador.nombre} ${jugador.apellido || ""}</option>`
          })
          porteroSelect.innerHTML = opciones

          // Seleccionar el portero guardado si existe
          const equipo = await window.FirebaseDataStore.getEquipo(equipoId)
          if (equipo && equipo.portero) {
            porteroSelect.value = equipo.portero
          }
        }
      } catch (error) {
        console.error("Error al cargar jugadores:", error)
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
    try {
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

      const resultado = await window.FirebaseDataStore.saveEquipo(equipo)

      if (resultado) {
        // Actualizar el portero en el documento del equipo en Firestore
        const porteroId = document.getElementById("portero")?.value
        if (porteroId && equipoId) {
          await window.FirebaseDataStore.db.collection("equipos").doc(equipoId).update({ portero: porteroId })
        }

        window.location.href = "index.html"
      } else {
        throw new Error("No se pudo guardar el equipo")
      }
    } catch (error) {
      console.error("Error al guardar equipo:", error)
      alert("Error al guardar el equipo: " + error.message)
    }
  },

  // Cargar detalle de un equipo
  cargarDetalleEquipo: async (equipoId) => {
    if (!equipoId) {
      window.location.href = "index.html"
      return
    }

    try {
      const equipo = await window.FirebaseDataStore.getEquipo(equipoId)
      if (!equipo) {
        window.location.href = "index.html"
        return
      }

      // Mostrar información del equipo
      const nombreElement = document.getElementById("equipo-nombre")
      if (nombreElement) nombreElement.textContent = equipo.nombre

      const ciudadElement = document.getElementById("equipo-ciudad")
      if (ciudadElement && equipo.ciudad) ciudadElement.textContent = equipo.ciudad

      const fundacionElement = document.getElementById("equipo-fundacion")
      if (fundacionElement && equipo.fundacion) fundacionElement.textContent = equipo.fundacion

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
    } catch (error) {
      console.error("Error al cargar detalle del equipo:", error)
      window.location.href = "index.html"
    }
  },

  // Cargar jugadores de un equipo
  cargarJugadoresEquipo: async function (equipo) {
    let jugadoresContainer = document.getElementById("jugadores-lista")
    if (!jugadoresContainer) {
      jugadoresContainer = document.getElementById("equipo-jugadores")
    }
    if (!jugadoresContainer) {
      console.error("No se encontró el contenedor de jugadores")
      return
    }
    try {
      if (!equipo || !equipo.id) throw new Error("ID de equipo no válido")
      const jugadores = await window.FirebaseDataStore.getJugadoresPorEquipo(equipo.id)
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
      let html = `
        <div class="text-right mb-3">
          <a href="../jugadores/crear.html?equipoId=${equipo.id}" class="btn btn-primary">
            <i class="fas fa-plus"></i> Añadir Jugador
          </a>
        </div>
      `
      jugadores.forEach((jugador) => {
        html += `
          <div class="jugador-card">
            <img src="${jugador.foto || "../../assets/img/default-player.png"}" alt="${jugador.nombre}">
            <div class="jugador-info">
              <strong>${jugador.nombre}</strong><br>
              <span>${jugador.posicion || ""}</span>
            </div>
            <div class="jugador-actions">
              <a href="../jugadores/detalle.html?id=${jugador.id}" class="btn btn-outline btn-sm">Ver perfil</a>
              <button class="btn btn-danger btn-sm eliminar-jugador" data-id="${jugador.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `
      })
      jugadoresContainer.innerHTML = html
      // Agregar eventos para eliminar jugadores
      const botonesEliminar = jugadoresContainer.querySelectorAll(".eliminar-jugador")
      botonesEliminar.forEach((boton) => {
        boton.addEventListener("click", async (e) => {
          e.preventDefault()
          const jugadorId = boton.getAttribute("data-id")
          if (confirm("¿Seguro que deseas eliminar este jugador?")) {
            await window.FirebaseDataStore.deleteJugador(jugadorId)
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
        (torneo) => torneo.equipos && torneo.equipos.some((id) => String(id) === String(equipoId)),
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
          (String(partido.local) === String(equipoId) || String(partido.visitante) === String(equipoId)) &&
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
      let partidosJugados = 0
      let partidosGanados = 0
      let partidosEmpatados = 0
      let partidosPerdidos = 0
      let golesFavor = 0
      let golesContra = 0
      partidosEquipo.forEach((partido) => {
        partidosJugados++
        if (String(partido.local) === String(equipoId)) {
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
  console.log("DOM cargado, inicializando EquiposModule")
  EquiposModule.init().catch((error) => {
    console.error("Error al inicializar EquiposModule:", error)
  })
})
