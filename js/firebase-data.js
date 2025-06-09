// Módulo para la gestión de datos en Firebase
const FirebaseDataStore = {
  // Inicializar el módulo
  init: function () {
    try {
      if (!this.db && window.firebase && window.firebase.firestore) {
        console.log("Inicializando Firestore...")
        this.db = window.firebase.firestore()
        console.log("Firestore inicializado correctamente")
      } else if (!window.firebase) {
        console.error("Error: Firebase no está disponible")
      } else if (!window.firebase.firestore) {
        console.error("Error: Firestore no está disponible")
      }
    } catch (error) {
      console.error("Error al inicializar Firestore:", error)
    }
  },

  // Verificar si Firebase está listo
  isReady: function () {
    return (
      window.firebase && window.firebase.apps && window.firebase.apps.length > 0 && window.firebase.firestore && this.db
    )
  },

  // Guardar torneo
  saveTorneo: async function (torneo) {
    if (!this.db) this.init()

    let torneoId = torneo.id
    const torneoData = { ...torneo }
    delete torneoData.id

    if (!torneoId) {
      // Nuevo torneo
      const docRef = await this.db.collection("torneos").add(torneoData)
      // Aquí guardas el id generado dentro del documento
      await docRef.update({ id: docRef.id })
      torneoId = docRef.id
    } else {
      // Actualizar torneo existente
      await this.db.collection("torneos").doc(String(torneoId)).set(torneoData, { merge: true })
    }

    // Devuelve el torneo con el id
    return { ...torneoData, id: torneoId }
  },

  // Obtener todos los torneos
  getTorneos: async function () {
    try {
      if (!this.db) this.init()
      const snapshot = await this.db.collection("torneos").get()
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error al obtener torneos:", error)
      return []
    }
  },

  // Obtener torneo por ID
  getTorneo: async function (torneoId) {
    try {
      if (!this.db) this.init()

      const doc = await this.db.collection("torneos").doc(torneoId).get()

      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data(),
        }
      } else {
        return null
      }
    } catch (error) {
      console.error("Error al obtener torneo:", error)
      return null
    }
  },

  // Eliminar torneo
  deleteTorneo: async function (torneoId) {
    try {
      if (!this.db) this.init()

      await this.db.collection("torneos").doc(torneoId).delete()
      return true
    } catch (error) {
      console.error("Error al eliminar torneo:", error)
      return false
    }
  },

  // Guardar equipo
  saveEquipo: async function (equipo) {
    try {
      if (!this.db) this.init()

      const equipoData = { ...equipo }
      delete equipoData.id // Nunca guardes el id como campo
      if (equipo.id) {
        // Editar equipo existente
        await this.db.collection("equipos").doc(equipo.id).set(equipoData, { merge: true })
        return { ...equipoData, id: equipo.id }
      } else {
        // Crear nuevo equipo
        const docRef = await this.db.collection("equipos").add(equipoData)
        return { ...equipoData, id: docRef.id }
      }
    } catch (error) {
      console.error("Error al guardar equipo:", error)
      return null
    }
  },

  // Obtener todos los equipos
  getEquipos: async function () {
    try {
      if (!this.db) this.init()
      const snapshot = await this.db.collection("equipos").get()
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error al obtener equipos:", error)
      return []
    }
  },

  // Obtener equipos de un torneo específico
  getEquiposTorneo: async function (torneoId) {
    try {
      if (!this.db) this.init()

      console.log("Obteniendo equipos para el torneo:", torneoId)

      // Obtener el torneo
      const torneo = await this.getTorneo(torneoId)
      if (!torneo || !torneo.equipos || torneo.equipos.length === 0) {
        console.log("El torneo no tiene equipos asignados")
        return []
      }

      console.log("Equipos en el torneo:", torneo.equipos)

      // Obtener todos los equipos
      const todosLosEquipos = await this.getEquipos()

      // Filtrar solo los equipos que están en el torneo
      const equiposDelTorneo = todosLosEquipos.filter((equipo) =>
        torneo.equipos.some((equipoId) => String(equipoId) === String(equipo.id)),
      )

      console.log(`Se encontraron ${equiposDelTorneo.length} equipos para el torneo ${torneoId}`)
      return equiposDelTorneo
    } catch (error) {
      console.error("Error al obtener equipos del torneo:", error)
      return []
    }
  },

  // Obtener equipo por ID - FUNCIÓN CORREGIDA
  getEquipo: async function (equipoId) {
    try {
      if (!this.db) this.init()

      if (!equipoId) {
        console.error("ID de equipo no proporcionado")
        return null
      }

      const doc = await this.db.collection("equipos").doc(String(equipoId)).get()

      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data(),
        }
      } else {
        console.log("No se encontró el equipo con ID:", equipoId)
        return null
      }
    } catch (error) {
      console.error("Error al obtener equipo:", error)
      return null
    }
  },

  // Eliminar equipo
  deleteEquipo: async function (equipoId) {
    try {
      if (!this.db) this.init()

      if (!equipoId) {
        console.error("ID de equipo no proporcionado para eliminación")
        return false
      }

      console.log("Eliminando documento en Firestore con ID:", equipoId)
      await this.db.collection("equipos").doc(String(equipoId)).delete()
      return true
    } catch (error) {
      console.error("Error al eliminar equipo:", error)
      return false
    }
  },

  // Guardar jugador
  saveJugador: async function (jugador) {
    try {
      if (!this.db) this.init()

      let jugadorId = jugador.id
      const jugadorData = { ...jugador }
      delete jugadorData.id

      if (!jugadorId) {
        // Nuevo jugador
        const docRef = await this.db.collection("jugadores").add(jugadorData)
        await docRef.update({ id: docRef.id }) // Guarda el id en el documento
        jugadorId = docRef.id
      } else {
        // Actualizar jugador existente
        await this.db.collection("jugadores").doc(String(jugadorId)).set(jugadorData, { merge: true })
      }

      return { ...jugadorData, id: jugadorId }
    } catch (error) {
      console.error("Error al guardar jugador:", error)
      return null
    }
  },

  // Obtener todos los jugadores
  getJugadores: async function () {
    try {
      if (!this.db) this.init()

      const snapshot = await this.db.collection("jugadores").get()
      const jugadores = []

      snapshot.forEach((doc) => {
        jugadores.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      return jugadores
    } catch (error) {
      console.error("Error al obtener jugadores:", error)
      return []
    }
  },

  // Obtener jugador por ID
  getJugador: async function (jugadorId) {
    try {
      if (!this.db) this.init()

      const doc = await this.db.collection("jugadores").doc(jugadorId).get()

      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data(),
        }
      } else {
        return null
      }
    } catch (error) {
      console.error("Error al obtener jugador:", error)
      return null
    }
  },

  // Obtener jugadores por equipo
  getJugadoresPorEquipo: async function (equipoId) {
    try {
      if (!this.db) this.init()

      console.log("Buscando jugadores para el equipo ID:", equipoId)

      const equipoIdStr = String(equipoId)

      // Usar el campo correcto: 'equipo'
      const snapshot = await this.db.collection("jugadores").where("equipo", "==", equipoIdStr).get()

      if (snapshot.empty) {
        console.log("No se encontraron jugadores para este equipo")
        return []
      }

      const jugadores = []
      snapshot.forEach((doc) => {
        jugadores.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      console.log(`Se encontraron ${jugadores.length} jugadores para el equipo ${equipoId}`)
      return jugadores
    } catch (error) {
      console.error("Error al obtener jugadores por equipo:", error)
      return []
    }
  },

  // Eliminar jugador
  deleteJugador: async function (jugadorId) {
    try {
      if (!this.db) this.init()
      await this.db.collection("jugadores").doc(jugadorId).delete()
      return true
    } catch (error) {
      console.error("Error al eliminar jugador:", error)
      return false
    }
  },

  // Guardar partido
  savePartido: async function (partido) {
    try {
      if (!this.db) this.init()

      let partidoId = partido.id

      // Eliminar el id del objeto para evitar duplicación en Firestore
      const partidoData = { ...partido }
      delete partidoData.id

      // Añadir el ID del usuario creador si no existe
      if (!partidoData.creador) {
        const user = window.firebase.auth().currentUser // Use window.firebase
        if (user) {
          partidoData.creador = user.uid
        }
      }

      // Añadir timestamps de creación/actualización
      if (!partidoId) {
        // Nuevo partido
        partidoData.fechaCreacion = new Date()
      }
      partidoData.fechaActualizacion = new Date()

      if (partidoId) {
        // Actualizar partido existente
        await this.db.collection("partidos").doc(partidoId).update(partidoData)
      } else {
        // Crear nuevo partido
        const docRef = await this.db.collection("partidos").add(partidoData)
        partidoId = docRef.id
      }

      return {
        id: partidoId,
        ...partidoData,
      }
    } catch (error) {
      console.error("Error al guardar partido:", error)
      return null
    }
  },

  // Obtener todos los partidos - FUNCIÓN CORREGIDA
  getPartidos: async function () {
    try {
      if (!this.db) this.init()
      console.log("Obteniendo todos los partidos...")
      const snapshot = await this.db.collection("partidos").get()
      const partidos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      console.log(`Se encontraron ${partidos.length} partidos`)
      return partidos
    } catch (error) {
      console.error("Error al obtener partidos:", error)
      return []
    }
  },

  // Obtener partido por ID
  getPartido: async function (partidoId) {
    try {
      if (!this.db) this.init()

      const doc = await this.db.collection("partidos").doc(partidoId).get()

      if (doc.exists) {
        return {
          id: doc.id,
          ...doc.data(),
        }
      } else {
        return null
      }
    } catch (error) {
      console.error("Error al obtener partido:", error)
      return null
    }
  },

  // Obtener partidos por torneo
  getPartidosPorTorneo: async function (torneoId) {
    try {
      if (!this.db) this.init()
      const snapshot = await this.db.collection("partidos").where("torneo", "==", torneoId).get()
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    } catch (error) {
      console.error("Error al obtener partidos por torneo:", error)
      return []
    }
  },

  // Eliminar partido
  deletePartido: async function (partidoId) {
    try {
      if (!this.db) this.init()

      await this.db.collection("partidos").doc(partidoId).delete()
      return true
    } catch (error) {
      console.error("Error al eliminar partido:", error)
      return false
    }
  },

  // Generar calendario
  generarCalendario: async function (torneoId, formato, fechaInicio, opciones) {
    try {
      if (!this.db) this.init()

      // Obtener equipos del torneo
      const equiposSnapshot = await this.db.collection("equipos").where("torneo", "==", torneoId).get()
      const equipos = equiposSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))

      if (equipos.length < 2) return false

      // Ejemplo: todos contra todos ida y vuelta
      const partidos = []
      for (let i = 0; i < equipos.length; i++) {
        for (let j = i + 1; j < equipos.length; j++) {
          partidos.push({
            torneo: torneoId,
            local: equipos[i].id,
            visitante: equipos[j].id,
            fecha: fechaInicio, // Aquí deberías calcular la fecha real según el fixture
            estado: "Próximo",
          })
          if (formato === "ida-vuelta") {
            partidos.push({
              torneo: torneoId,
              local: equipos[j].id,
              visitante: equipos[i].id,
              fecha: fechaInicio,
              estado: "Próximo",
            })
          }
        }
      }

      // Guardar partidos en Firebase
      for (const partido of partidos) {
        await this.db.collection("partidos").add(partido)
      }

      return true
    } catch (error) {
      console.error("Error al generar calendario:", error)
      return false
    }
  },

  // Actualizar torneo de un equipo
  updateEquipoTorneo: async function (equipoId, torneoId) {
    try {
      if (!this.db) this.init()
      await this.db.collection("equipos").doc(equipoId).update({ torneo: torneoId })
      return true
    } catch (error) {
      console.error("Error al actualizar torneo del equipo:", error)
      return false
    }
  },

  // Actualizar fecha de un partido
  updateFechaPartido: async function (partidoId, nuevaFecha) {
    try {
      if (!this.db) this.init()
      await this.db.collection("partidos").doc(partidoId).update({ fecha: nuevaFecha })
      return true
    } catch (error) {
      console.error("Error al actualizar fecha del partido:", error)
      return false
    }
  },

  // Registrar resultado de partido
  registrarResultado: async function (
    partidoId,
    golesLocal,
    golesVisitante,
    observaciones,
    goleadoresLocal = [],
    goleadoresVisitante = [],
  ) {
    try {
      if (!this.db) this.init()
      const resultado = {
        golesLocal: Number.parseInt(golesLocal),
        golesVisitante: Number.parseInt(golesVisitante),
        observaciones: observaciones || "",
      }
      // Unifica los arrays de goleadores
      const goleadores = [
        ...goleadoresLocal.map((g) => ({ ...g, equipo: "local" })),
        ...goleadoresVisitante.map((g) => ({ ...g, equipo: "visitante" })),
      ]
      await this.db.collection("partidos").doc(partidoId).update({ resultado, estado: "Finalizado", goleadores })

      // Sumar goles a cada jugador
      for (const gol of goleadores) {
        if (gol.jugadorId && gol.goles) {
          const jugadorRef = this.db.collection("jugadores").doc(gol.jugadorId)
          // Usa FieldValue.increment para sumar los goles
          await jugadorRef.update({
            goles: window.firebase.firestore.FieldValue.increment(gol.goles),
          })
        }
      }

      return true
    } catch (error) {
      console.error("Error al registrar resultado:", error)
      return false
    }
  },

  // Calcular posiciones usando el array de equipos del torneo
  calcularPosiciones: async function (torneoId) {
    try {
      if (!this.db) this.init()

      const torneo = await this.getTorneo(torneoId)
      if (!torneo || !Array.isArray(torneo.equipos) || torneo.equipos.length === 0) return []

      // Inicializa los equipos con todos los campos en 0
      const equipos = (await Promise.all(torneo.equipos.map((id) => this.getEquipo(id))))
        .filter((e) => e)
        .map((e) => ({
          ...e,
          puntos: 0,
          pj: 0,
          pg: 0,
          pe: 0,
          pp: 0,
          gf: 0,
          gc: 0,
          dif: 0,
        }))

      // Mapa para acceso rápido
      const equiposMap = {}
      equipos.forEach((e) => (equiposMap[e.id] = e))

      // Obtener partidos finalizados
      const partidos = await this.getPartidosPorTorneo(torneoId)
      partidos
        .filter(
          (p) =>
            p.estado === "Finalizado" &&
            p.resultado &&
            !isNaN(Number.parseInt(p.resultado.golesLocal)) &&
            !isNaN(Number.parseInt(p.resultado.golesVisitante)),
        )
        .forEach((partido) => {
          const local = equiposMap[partido.local]
          const visitante = equiposMap[partido.visitante]
          if (!local || !visitante) return

          const gl = Number.parseInt(partido.resultado.golesLocal) || 0
          const gv = Number.parseInt(partido.resultado.golesVisitante) || 0

          // Partidos jugados
          local.pj += 1
          visitante.pj += 1

          // Goles a favor y en contra
          local.gf += gl
          local.gc += gv
          visitante.gf += gv
          visitante.gc += gl

          // Diferencia de goles
          local.dif = local.gf - local.gc
          visitante.dif = visitante.gf - visitante.gc

          // Resultado
          if (gl > gv) {
            local.pg += 1
            local.puntos += 3
            visitante.pp += 1
          } else if (gl < gv) {
            visitante.pg += 1
            visitante.puntos += 3
            local.pp += 1
          } else {
            local.pe += 1
            visitante.pe += 1
            local.puntos += 1
            visitante.puntos += 1
          }
        })

      // Ordenar por puntos, diferencia de goles, goles a favor
      const posiciones = Object.values(equiposMap)
        .sort((a, b) => b.puntos - a.puntos || b.dif - a.dif || b.gf - a.gf)
        .map((equipo, idx) => ({
          ...equipo,
          posicion: idx + 1,
        }))

      return posiciones
    } catch (error) {
      console.error("Error al calcular posiciones:", error)
      return []
    }
  },
}

// Función para esperar a que Firebase esté listo
function waitForFirebase() {
  return new Promise((resolve) => {
    console.log("Esperando a que Firebase esté listo...")

    // Verificar si Firebase ya está disponible
    if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
      console.log("Firebase ya está inicializado")
      FirebaseDataStore.init()
      resolve()
      return
    }

    // Si no está disponible, esperar
    const checkInterval = setInterval(() => {
      console.log("Verificando si Firebase está listo...")
      if (window.firebase && window.firebase.apps && window.firebase.apps.length > 0) {
        clearInterval(checkInterval)
        console.log("Firebase está listo, inicializando FirebaseDataStore")
        FirebaseDataStore.init()
        resolve()
      }
    }, 200)

    // Timeout después de 10 segundos
    setTimeout(() => {
      clearInterval(checkInterval)
      console.error("Timeout esperando a Firebase")
      resolve() // Resolver de todos modos para no bloquear la aplicación
    }, 10000)
  })
}

// Asignar a window inmediatamente
window.FirebaseDataStore = FirebaseDataStore

// Inicializar cuando el documento esté listo
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM cargado, esperando a Firebase")
  waitForFirebase().then(() => {
    console.log("FirebaseDataStore inicializado después de esperar")
    // Reasignar a window para asegurar que esté disponible
    window.FirebaseDataStore = FirebaseDataStore

    // Verificar que todas las funciones estén disponibles
    console.log("Funciones disponibles en FirebaseDataStore:", Object.keys(FirebaseDataStore))
  })
})
