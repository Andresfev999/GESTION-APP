// Módulo para la gestión de torneos
const TorneosModule = {
  // Inicializar el módulo
  init: async function () {
    console.log("Inicializando TorneosModule...")

    // Esperar a que Firebase esté listo
    await this.waitForFirebase()

    if (document.getElementById("torneo-detalle")) {
      await this.cargarDetalleTorneo()
    }
    // Cargar la lista de torneos si estamos en la página de torneos
    if (document.getElementById("torneos-list")) {
      await this.cargarTorneos()
      this.initBusqueda()
    }

    // Inicializar el formulario de creación/edición
    if (document.getElementById("torneo-form")) {
      await this.initForm()
      this.initFileUpload()
      await this.initEquiposSelect()
    }

    // Inicializar la vista de posiciones
    if (document.getElementById("posiciones-table")) {
      await this.cargarPosiciones()
    }
  },

  // Función para esperar a que Firebase esté listo
  waitForFirebase: () =>
    new Promise((resolve) => {
      console.log("TorneosModule: Esperando a que FirebaseDataStore esté listo...")

      // Verificar si ya está listo
      if (window.FirebaseDataStore && window.FirebaseDataStore.isReady && window.FirebaseDataStore.isReady()) {
        console.log("TorneosModule: FirebaseDataStore ya está listo")
        resolve()
        return
      }

      // Si no está listo, esperar
      const checkFirebase = setInterval(() => {
        if (window.FirebaseDataStore && window.FirebaseDataStore.isReady && window.FirebaseDataStore.isReady()) {
          clearInterval(checkFirebase)
          console.log("TorneosModule: FirebaseDataStore está listo")
          resolve()
        }
      }, 200)

      // Timeout después de 10 segundos
      setTimeout(() => {
        clearInterval(checkFirebase)
        console.error("TorneosModule: Timeout esperando a FirebaseDataStore")
        resolve() // Resolver de todos modos para no bloquear la aplicación
      }, 10000)
    }),

  // Verificar que todas las funciones necesarias estén disponibles
  verificarFunciones: () => {
    const funcionesNecesarias = [
      "getTorneo",
      "getTorneos",
      "getEquipos",
      "getEquiposTorneo",
      "getPartidosPorTorneo",
      "saveTorneo",
      "deleteTorneo",
      "deletePartido",
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

  // Cargar la lista de torneos
  cargarTorneos: async function () {
    const torneosList = document.getElementById("torneos-list")
    if (!torneosList) {
      console.error("No se encontró el contenedor de torneos")
      return
    }

    try {
      console.log("Iniciando carga de torneos...")

      // Verificar que FirebaseDataStore esté disponible
      if (!window.FirebaseDataStore || !this.verificarFunciones()) {
        throw new Error("FirebaseDataStore no está disponible o le faltan funciones")
      }

      torneosList.innerHTML =
        '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando torneos...</div>'

      const torneos = await window.FirebaseDataStore.getTorneos()
      console.log("Torneos obtenidos:", torneos)

      if (torneos.length === 0) {
        torneosList.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            No hay torneos registrados. ¡Crea el primero!
          </div>
        `
        return
      }

      let html = ""
      for (const torneo of torneos) {
        let estadoClass = ""
        if (torneo.estado === "En curso") {
          estadoClass = "badge-primary"
        } else if (torneo.estado === "Finalizado") {
          estadoClass = "badge-danger"
        } else {
          estadoClass = "badge-warning"
        }

        // Contar equipos participantes
        const equipos = torneo.equipos ? torneo.equipos.length : 0

        // Contar partidos del torneo
        const partidos = await window.FirebaseDataStore.getPartidosPorTorneo(torneo.id)

        html += `
          <div class="card torneo-card" data-id="${torneo.id}">
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
                <span>${torneo.categoria || "No especificada"}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Equipos:</span>
                <span>${equipos}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Partidos:</span>
                <span>${partidos.length}</span>
              </div>
            </div>
            <div class="card-footer">
              <a href="detalle.html?id=${torneo.id}" class="btn btn-outline">Ver detalles</a>
              <a href="crear.html?id=${torneo.id}" class="btn btn-sm btn-warning">
                <i class="fas fa-edit"></i> Editar
              </a>
              <button class="btn btn-sm btn-danger eliminar-torneo" data-id="${torneo.id}">
                <i class="fas fa-trash"></i> Eliminar
              </button>
            </div>
          </div>
        `
      }

      torneosList.innerHTML = html

      // Agregar eventos para eliminar torneos
      const botonesEliminar = document.querySelectorAll(".eliminar-torneo")
      botonesEliminar.forEach((boton) => {
        boton.addEventListener("click", async (e) => {
          e.preventDefault()
          const torneoId = boton.getAttribute("data-id")
          if (torneoId) {
            await TorneosModule.confirmarEliminarTorneo(torneoId)
          }
        })
      })

      console.log(`Se cargaron ${torneos.length} torneos correctamente`)
    } catch (error) {
      console.error("Error al cargar torneos:", error)
      torneosList.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar los torneos: ${error.message}
        </div>
      `
    }
  },

  // Confirmar eliminación de torneo
  confirmarEliminarTorneo: async function (torneoId) {
    try {
      const torneo = await window.FirebaseDataStore.getTorneo(torneoId)
      if (!torneo) {
        alert("Error: No se pudo encontrar el torneo.")
        return
      }

      // Verificar si el torneo tiene partidos
      const partidos = await window.FirebaseDataStore.getPartidosPorTorneo(torneoId)

      let mensaje = `¿Estás seguro de que deseas eliminar el torneo "${torneo.nombre}"?`

      if (partidos.length > 0) {
        mensaje += `\n\nEste torneo tiene ${partidos.length} partido(s) que también serán eliminados.`
      }

      if (confirm(mensaje)) {
        await this.eliminarTorneo(torneoId)
      }
    } catch (error) {
      console.error("Error al confirmar eliminación:", error)
      alert("Error al procesar la eliminación del torneo.")
    }
  },

  // Eliminar torneo
  eliminarTorneo: async function (torneoId) {
    try {
      console.log("Eliminando torneo con ID:", torneoId)

      // Eliminar partidos del torneo
      const partidos = await window.FirebaseDataStore.getPartidosPorTorneo(torneoId)
      for (const partido of partidos) {
        await window.FirebaseDataStore.deletePartido(partido.id)
      }

      // Eliminar el torneo
      const resultado = await window.FirebaseDataStore.deleteTorneo(torneoId)

      if (resultado) {
        // Mostrar mensaje de éxito
        if (window.showNotification) {
          window.showNotification("Torneo eliminado correctamente", "success")
        } else {
          alert("Torneo eliminado correctamente")
        }

        // Recargar la lista de torneos
        await this.cargarTorneos()
      } else {
        throw new Error("No se pudo eliminar el torneo")
      }
    } catch (error) {
      console.error("Error al eliminar torneo:", error)
      if (window.showNotification) {
        window.showNotification("Error al eliminar el torneo: " + error.message, "error")
      } else {
        alert("Error al eliminar el torneo: " + error.message)
      }
    }
  },

  // Inicializar búsqueda de torneos
  initBusqueda: () => {
    const buscarInput = document.getElementById("buscar-torneo")
    if (!buscarInput) return

    buscarInput.addEventListener("input", () => {
      const termino = buscarInput.value.toLowerCase()
      const torneos = document.querySelectorAll("#torneos-list .torneo-card")

      torneos.forEach((torneo) => {
        const nombre = torneo.querySelector(".card-title").textContent.toLowerCase()
        if (nombre.includes(termino)) {
          torneo.style.display = "block"
        } else {
          torneo.style.display = "none"
        }
      })
    })

    const buscadorEquipos = document.getElementById("buscador-equipos")
    if (buscadorEquipos) {
      buscadorEquipos.addEventListener("input", function () {
        const filtro = this.value.toLowerCase()
        document.querySelectorAll("#equipos-container .equipo-checkbox-label").forEach((label) => {
          const nombre = label.textContent.toLowerCase()
          label.style.display = nombre.includes(filtro) ? "" : "none"
        })
      })
    }
  },

  // Inicializar el formulario de creación/edición
  initForm: async function () {
    const form = document.getElementById("torneo-form")
    if (!form) return

    const urlParams = new URLSearchParams(window.location.search)
    const torneoId = urlParams.get("id")

    let equiposTorneo = []
    if (torneoId) {
      // Cargar datos del torneo para edición
      const torneo = await window.FirebaseDataStore.getTorneo(torneoId)
      if (torneo) {
        const tituloElement = document.getElementById("torneo-title")
        if (tituloElement) tituloElement.textContent = "Editar Torneo"

        document.getElementById("nombre").value = torneo.nombre || ""
        document.getElementById("tipo").value = torneo.tipo || ""
        document.getElementById("descripcion").value = torneo.descripcion || ""
        document.getElementById("fechaInicio").value = torneo.fechaInicio || ""
        document.getElementById("fechaFin").value = torneo.fechaFin || ""
        document.getElementById("estado").value = torneo.estado || ""
        document.getElementById("categoria").value = torneo.categoria || ""
        equiposTorneo = torneo.equipos || []

        // Mostrar escudo si existe
        if (torneo.escudo) {
          const preview = document.getElementById("escudo-preview")
          if (preview) {
            preview.innerHTML = `<img src="${torneo.escudo}" alt="Escudo" style="max-width:100px;max-height:100px;">`
            preview.dataset.base64 = torneo.escudo
          }
        }
      }
    }

    // Espera a que los equipos estén cargados en el checklist
    await this.initEquiposSelect()

    // Marca los equipos ya asociados si es edición
    if (equiposTorneo.length > 0) {
      equiposTorneo.forEach((id) => {
        const checkbox = document.querySelector(`#equipos-container input[type="checkbox"][value="${id}"]`)
        if (checkbox) checkbox.checked = true
      })
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault()
      await TorneosModule.guardarTorneo(torneoId) // Pasa el id para actualizar si existe
    })

    const escudoInput = document.getElementById("escudo")
    if (escudoInput) {
      escudoInput.addEventListener("change", (e) => {
        const file = e.target.files[0]
        const preview = document.getElementById("escudo-preview")
        if (file && preview) {
          const reader = new FileReader()
          reader.onload = (evt) => {
            preview.innerHTML = `<img src="${evt.target.result}" alt="Escudo" style="max-width:100px;max-height:100px;">`
            // Guarda el base64 en un atributo para usarlo al guardar
            preview.dataset.base64 = evt.target.result
          }
          reader.readAsDataURL(file)
        } else if (preview) {
          preview.innerHTML = ""
          preview.dataset.base64 = ""
        }
      })
    }

    const buscadorEquipos = document.getElementById("buscador-equipos")
    if (buscadorEquipos) {
      buscadorEquipos.addEventListener("input", function () {
        const filtro = this.value.toLowerCase()
        document.querySelectorAll("#equipos-container .equipo-checkbox-label").forEach((label) => {
          const nombre = label.textContent.toLowerCase()
          label.style.display = nombre.includes(filtro) ? "" : "none"
        })
      })
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
        // Eliminar vista previa anterior si existe
        const existingPreview = document.querySelector(".file-preview")
        if (existingPreview) {
          existingPreview.remove()
        }

        // Crear nueva vista previa
        const previewContainer = document.querySelector(".file-input-container")
        if (previewContainer) {
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

          // Agregar evento para eliminar la vista previa
          const removeBtn = preview.querySelector(".file-preview-remove")
          removeBtn.addEventListener("click", () => {
            preview.remove()
            fileInput.value = ""
          })
        }
      }

      reader.readAsDataURL(file)
    })
  },

  // Inicializar selección de equipos
  initEquiposSelect: async () => {
    const equiposContainer = document.getElementById("equipos-container")
    if (!equiposContainer) {
      console.error("Error: No se encontró el contenedor de equipos.")
      return
    }

    try {
      // Obtener equipos desde Firebase
      const equipos = await window.FirebaseDataStore.getEquipos()

      if (!equipos || equipos.length === 0) {
        equiposContainer.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle"></i> No hay equipos registrados. Crea uno primero.
          </div>
        `
        return
      }

      let html = ""
      equipos.forEach((equipo) => {
        html += `
          <label class="equipo-checkbox-label" style="display:block; margin-bottom: 8px;">
            <input type="checkbox" id="equipo-${equipo.id}" value="${equipo.id}" style="margin-right: 8px;">
            ${equipo.nombre}
          </label>
        `
      })

      equiposContainer.innerHTML = html

      // Depuración: Verificar si los equipos se han cargado correctamente
      console.log("Equipos cargados en la vista de creación:", equipos)
    } catch (error) {
      console.error("Error al cargar equipos:", error)
      equiposContainer.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle"></i>
          Error al cargar los equipos.
        </div>
      `
    }
  },

  // Guardar torneo
  guardarTorneo: async (torneoId) => {
    try {
      // Obtén los valores del formulario
      const nombre = document.getElementById("nombre").value
      const tipo = document.getElementById("tipo").value
      const descripcion = document.getElementById("descripcion").value
      const fechaInicio = document.getElementById("fechaInicio").value
      const fechaFin = document.getElementById("fechaFin").value
      const estado = document.getElementById("estado").value
      const categoria = document.getElementById("categoria").value

      // Obtén los equipos seleccionados
      const equipos = Array.from(document.querySelectorAll('#equipos-container input[type="checkbox"]:checked')).map(
        (e) => e.value,
      )

      // Si tienes escudo en base64
      let escudo = ""
      const escudoPreview = document.getElementById("escudo-preview")
      if (escudoPreview && escudoPreview.dataset.base64) {
        escudo = escudoPreview.dataset.base64
      }

      // Si el formato es "copa", obtén los grupos
      const grupos = {}
      if (tipo.toLowerCase() === "copa") {
        // Toma los equipos de los selects de grupo
        const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        const numGrupos = Number.parseInt(document.getElementById("num-grupos")?.value, 10) || 2
        for (let g = 1; g <= numGrupos; g++) {
          const grupoLetra = letras[g - 1]
          grupos[grupoLetra] = []
          // Busca los selects de este grupo
          const selects = document.querySelectorAll(`#asignacion-grupos select[name^="grupo${g}-equipo"]`)
          selects.forEach((select) => {
            if (select.value && !grupos[grupoLetra].includes(select.value)) {
              grupos[grupoLetra].push(select.value)
            }
          })
        }
      }

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
        equipos, // puedes dejarlo vacío si es copa
        escudo,
      }

      // Si hay grupos, agrégalos al objeto torneo
      if (Object.keys(grupos).length > 0) {
        torneo.grupos = grupos
      }

      // Guarda el torneo en Firebase
      const resultado = await window.FirebaseDataStore.saveTorneo(torneo)

      if (resultado && resultado.id) {
        if (window.showNotification) {
          window.showNotification("Torneo guardado correctamente", "success")
        } else {
          alert("Torneo guardado correctamente")
        }
        window.location.href = "detalle.html?id=" + resultado.id
      } else {
        throw new Error("No se pudo guardar el torneo")
      }
    } catch (error) {
      console.error("Error al guardar torneo:", error)
      if (window.showNotification) {
        window.showNotification("Error al guardar el torneo: " + error.message, "error")
      } else {
        alert("Error al guardar el torneo: " + error.message)
      }
    }
  },

  // Cargar detalle de un torneo
  cargarDetalleTorneo: async () => {
    const urlParams = new URLSearchParams(window.location.search)
    const torneoId = urlParams.get("id")
    if (!torneoId) return

    try {
      const torneo = await window.FirebaseDataStore.getTorneo(torneoId)
      if (!torneo) return

      // Cabecera
      const elementos = {
        "torneo-nombre": torneo.nombre || "-",
        "torneo-tipo": torneo.tipo || "-",
        "torneo-fecha-inicio": torneo.fechaInicio || "-",
        "torneo-fecha-fin": torneo.fechaFin || "-",
        "torneo-estado": torneo.estado || "-",
        "info-nombre": torneo.nombre || "-",
        "info-tipo": torneo.tipo || "-",
        "info-estado": torneo.estado || "-",
        "info-fecha-inicio": torneo.fechaInicio || "-",
        "info-fecha-fin": torneo.fechaFin || "-",
        "info-equipos": torneo.equipos ? torneo.equipos.length + " equipo(s)" : "-",
      }

      // Actualizar elementos del DOM
      for (const [id, valor] of Object.entries(elementos)) {
        const elemento = document.getElementById(id)
        if (elemento) elemento.textContent = valor
      }

      // Mostrar escudo si existe
      const escudoImg = document.getElementById("torneo-escudo")
      if (escudoImg && torneo.escudo) {
        escudoImg.src = torneo.escudo
        escudoImg.style.display = "block"
      }
    } catch (error) {
      console.error("Error al cargar detalle del torneo:", error)
    }
  },

  // Cargar equipos de un torneo - FUNCIÓN ACTUALIZADA CON TUS ESTILOS CSS
  cargarEquiposTorneo: async function (torneoId) {
    const equiposContainer = document.getElementById("torneo-equipos")
    if (!equiposContainer) {
      console.error("No se encontró el contenedor de equipos")
      return
    }

    try {
      console.log("Cargando equipos para el torneo:", torneoId)

      // Verificar que FirebaseDataStore esté disponible
      if (!window.FirebaseDataStore || !this.verificarFunciones()) {
        throw new Error("FirebaseDataStore no está disponible o le faltan funciones")
      }

      // Mensaje visual de carga usando tus clases CSS
      equiposContainer.innerHTML = `
      <div class="loading-spinner">
        <i class="fas fa-spinner fa-spin"></i> Cargando equipos...
      </div>
    `

      // Obtener los equipos del torneo
      const equipos = await window.FirebaseDataStore.getEquiposTorneo(torneoId)
      console.log("Equipos obtenidos:", equipos)

      // Si no hay equipos, mostrar mensaje usando tus clases CSS
      if (!equipos || equipos.length === 0) {
        equiposContainer.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          No se encontraron equipos para este torneo.
        </div>
      `
        return
      }

      // Renderizar equipos usando tus clases CSS
      let html = '<div class="cards-grid">'

      equipos.forEach((equipo) => {
        html += `
        <div class="card equipo-card">
          <div class="card-img">
            <img src="${equipo.escudo || "../../assets/img/default-shield.png"}" 
                 alt="${equipo.nombre}" 
                 class="escudo-lista">
          </div>
          <div class="card-content">
            <h4 class="card-title">${equipo.nombre}</h4>
            <p class="card-text">${equipo.ciudad || "Sin ciudad"}</p>
            
          </div>
        </div>
      `
      })

      html += "</div>"

      equiposContainer.innerHTML = html
      console.log(`Se renderizaron ${equipos.length} equipos correctamente`)
    } catch (error) {
      console.error("Error al cargar equipos del torneo:", error)
      equiposContainer.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-triangle"></i>
        Error al cargar los equipos: ${error.message}
      </div>
    `
    }
  },
}

// Asignar a window para uso global
window.TorneosModule = TorneosModule

// Inicializar el módulo cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado, inicializando TorneosModule")
  TorneosModule.init().catch((error) => {
    console.error("Error al inicializar TorneosModule:", error)
  })
})
