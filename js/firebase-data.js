// Módulo para la gestión de datos en Firebase
const FirebaseDataStore = {
    // Inicializar el módulo
    init: function() {
        if (!this.db) {
            this.db = window.firebase.firestore();
        }
    },
    
    // Guardar torneo
    saveTorneo: async function(torneo) {
        if (!this.db) this.init();

        let torneoId = torneo.id;
        const torneoData = { ...torneo };
        delete torneoData.id;

        if (!torneoId) {
            // Nuevo torneo
            const docRef = await this.db.collection('torneos').add(torneoData);
            // Aquí guardas el id generado dentro del documento
            await docRef.update({ id: docRef.id });
            torneoId = docRef.id;
        } else {
            // Actualizar torneo existente
            await this.db.collection('torneos').doc(String(torneoId)).set(torneoData, { merge: true });
        }

        // Devuelve el torneo con el id
        return { ...torneoData, id: torneoId };
    },
    
    // Obtener todos los torneos
    getTorneos: async function() {
        if (!this.db) this.init();
        const snapshot = await this.db.collection('torneos').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    
    // Obtener torneo por ID
    getTorneo: async function(torneoId) {
        try {
            if (!this.db) this.init();
            
            const doc = await this.db.collection('torneos').doc(torneoId).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error al obtener torneo:", error);
            return null;
        }
    },
    
    // Eliminar torneo
    deleteTorneo: async function(torneoId) {
        try {
            if (!this.db) this.init();
            
            await this.db.collection('torneos').doc(torneoId).delete();
            return true;
        } catch (error) {
            console.error("Error al eliminar torneo:", error);
            return false;
        }
    },
    
    // Guardar equipo
    saveEquipo: async function(equipo) {
        try {
            if (!this.db) this.init();
            
            let equipoId = equipo.id;
            
            // Eliminar el id del objeto para evitar duplicación en Firestore
            const equipoData = { ...equipo };
            delete equipoData.id;
            
            // Añadir el ID del usuario creador si no existe
            if (!equipoData.creador) {
                const user = window.firebase.auth().currentUser; // Use window.firebase
                if (user) {
                    equipoData.creador = user.uid;
                }
            }
            
            // Añadir timestamps de creación/actualización
            if (!equipoId) {
                // Nuevo equipo
                equipoData.fechaCreacion = new Date();
            }
            equipoData.fechaActualizacion = new Date();
            
            if (equipoId) {
                // Actualizar equipo existente
                await this.db.collection('equipos').doc(equipoId).update(equipoData);
            } else {
                // Crear nuevo equipo
                const docRef = await this.db.collection('equipos').add(equipoData);
                equipoId = docRef.id;
            }
            
            return {
                id: equipoId,
                ...equipoData
            };
        } catch (error) {
            console.error("Error al guardar equipo:", error);
            return null;
        }
    },
    
    // Obtener todos los equipos
    getEquipos: async function() {
        try {
            if (!this.db) this.init();
            
            const snapshot = await this.db.collection('equipos').get();
            const equipos = [];
            
            snapshot.forEach(doc => {
                equipos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return equipos;
        } catch (error) {
            console.error("Error al obtener equipos:", error);
            return [];
        }
    },
    
    // Obtener equipo por ID
    getEquipo: async function(equipoId) {
        try {
            if (!this.db) this.init();
            
            const doc = await this.db.collection('equipos').doc(equipoId).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error al obtener equipo:", error);
            return null;
        }
    },
    
    // Eliminar equipo
    deleteEquipo: async function(equipoId) {
        try {
            if (!this.db) this.init();
            
            await this.db.collection('equipos').doc(equipoId).delete();
            return true;
        } catch (error) {
            console.error("Error al eliminar equipo:", error);
            return false;
        }
    },
    
    // Guardar jugador
    saveJugador: async function(jugador) {
        if (!this.db) this.init();

        let jugadorId = jugador.id;
        const jugadorData = { ...jugador };
        delete jugadorData.id;

        if (!jugadorId) {
            // Nuevo jugador
            const docRef = await this.db.collection('jugadores').add(jugadorData);
            await docRef.update({ id: docRef.id }); // Guarda el id en el documento
            jugadorId = docRef.id;
        } else {
            // Actualizar jugador existente
            await this.db.collection('jugadores').doc(String(jugadorId)).set(jugadorData, { merge: true });
        }

        return { ...jugadorData, id: jugadorId };
    },
    
    // Obtener todos los jugadores
    getJugadores: async function() {
        try {
            if (!this.db) this.init();
            
            const snapshot = await this.db.collection('jugadores').get();
            const jugadores = [];
            
            snapshot.forEach(doc => {
                jugadores.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return jugadores;
        } catch (error) {
            console.error("Error al obtener jugadores:", error);
            return [];
        }
    },
    
    // Obtener jugador por ID
    getJugador: async function(jugadorId) {
        try {
            if (!this.db) this.init();
            
            const doc = await this.db.collection('jugadores').doc(jugadorId).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error al obtener jugador:", error);
            return null;
        }
    },
    
    // Obtener jugadores por equipo
    getJugadoresPorEquipo: async function(equipoId) {
        if (!this.db) this.init();
        const snapshot = await this.db.collection('jugadores').where('equipo', '==', String(equipoId)).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    
    // Eliminar jugador
    deleteJugador: async function(jugadorId) {
        if (!this.db) this.init();
        await this.db.collection('jugadores').doc(jugadorId).delete();
    },
    
    // Guardar partido
    savePartido: async function(partido) {
        try {
            if (!this.db) this.init();
            
            let partidoId = partido.id;
            
            // Eliminar el id del objeto para evitar duplicación en Firestore
            const partidoData = { ...partido };
            delete partidoData.id;
            
            // Añadir el ID del usuario creador si no existe
            if (!partidoData.creador) {
                const user = window.firebase.auth().currentUser; // Use window.firebase
                if (user) {
                    partidoData.creador = user.uid;
                }
            }
            
            // Añadir timestamps de creación/actualización
            if (!partidoId) {
                // Nuevo partido
                partidoData.fechaCreacion = new Date();
            }
            partidoData.fechaActualizacion = new Date();
            
            if (partidoId) {
                // Actualizar partido existente
                await this.db.collection('partidos').doc(partidoId).update(partidoData);
            } else {
                // Crear nuevo partido
                const docRef = await this.db.collection('partidos').add(partidoData);
                partidoId = docRef.id;
            }
            
            return {
                id: partidoId,
                ...partidoData
            };
        } catch (error) {
            console.error("Error al guardar partido:", error);
            return null;
        }
    },
    
    // Obtener todos los partidos
    getPartidos: async function() {
        if (!this.db) this.init();
        const snapshot = await this.db.collection('partidos').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    
    // Obtener partido por ID
    getPartido: async function(partidoId) {
        try {
            if (!this.db) this.init();
            
            const doc = await this.db.collection('partidos').doc(partidoId).get();
            
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            } else {
                return null;
            }
        } catch (error) {
            console.error("Error al obtener partido:", error);
            return null;
        }
    },
    
    // Obtener partidos por torneo
    getPartidosPorTorneo: async function(torneoId) {
        if (!this.db) this.init();
        const snapshot = await this.db.collection('partidos').where('torneo', '==', torneoId).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    
    // Eliminar partido
    deletePartido: async function(partidoId) {
        try {
            if (!this.db) this.init();
            
            await this.db.collection('partidos').doc(partidoId).delete();
            return true;
        } catch (error) {
            console.error("Error al eliminar partido:", error);
            return false;
        }
    },

    // Generar calendario
    generarCalendario: async function(torneoId, formato, fechaInicio, opciones) {
        if (!this.db) this.init();

        // Obtener equipos del torneo
        const equiposSnapshot = await this.db.collection('equipos').where('torneo', '==', torneoId).get();
        const equipos = equiposSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (equipos.length < 2) return false;

        // Ejemplo: todos contra todos ida y vuelta
        let partidos = [];
        for (let i = 0; i < equipos.length; i++) {
            for (let j = i + 1; j < equipos.length; j++) {
                partidos.push({
                    torneo: torneoId,
                    local: equipos[i].id,
                    visitante: equipos[j].id,
                    fecha: fechaInicio, // Aquí deberías calcular la fecha real según el fixture
                    estado: 'Próximo'
                });
                if (formato === 'ida-vuelta') {
                    partidos.push({
                        torneo: torneoId,
                        local: equipos[j].id,
                        visitante: equipos[i].id,
                        fecha: fechaInicio,
                        estado: 'Próximo'
                    });
                }
            }
        }

        // Guardar partidos en Firebase
        for (const partido of partidos) {
            await this.db.collection('partidos').add(partido);
        }

        return true;
    },

    // Actualizar torneo de un equipo
    updateEquipoTorneo: async function(equipoId, torneoId) {
        if (!this.db) this.init();
        await this.db.collection('equipos').doc(equipoId).update({ torneo: torneoId });
    },

    // Actualizar fecha de un partido
    updateFechaPartido: async function(partidoId, nuevaFecha) {
        if (!this.db) this.init();
        await this.db.collection('partidos').doc(partidoId).update({ fecha: nuevaFecha });
    },

    // Registrar resultado de partido
    registrarResultado: async function(partidoId, golesLocal, golesVisitante, observaciones) {
        if (!this.db) this.init();
        const resultado = {
            golesLocal: parseInt(golesLocal),
            golesVisitante: parseInt(golesVisitante),
            observaciones: observaciones || ""
        };
        await this.db.collection('partidos').doc(partidoId).update({ resultado, estado: "Finalizado" });
        return true;
    },

    // Calcular posiciones
    calcularPosiciones: async function(torneoId) {
        if (!this.db) this.init();

        // Obtener equipos del torneo
        const equiposSnapshot = await this.db.collection('equipos').where('torneo', '==', torneoId).get();
        const equipos = equiposSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            puntos: 0,
            pj: 0,
            pg: 0,
            pe: 0,
            pp: 0,
            gf: 0,
            gc: 0,
            dif: 0
        }));

        // Map para acceso rápido por id
        const equiposMap = {};
        equipos.forEach(e => equiposMap[e.id] = e);

        // Obtener partidos finalizados del torneo
        const partidosSnapshot = await this.db.collection('partidos')
            .where('torneo', '==', torneoId)
            .where('estado', '==', 'Finalizado')
            .get();

        partidosSnapshot.forEach(doc => {
            const partido = doc.data();
            if (!partido.resultado) return;

            const local = equiposMap[partido.local];
            const visitante = equiposMap[partido.visitante];
            if (!local || !visitante) return;

            const gl = parseInt(partido.resultado.golesLocal);
            const gv = parseInt(partido.resultado.golesVisitante);

            // Partidos jugados
            local.pj += 1;
            visitante.pj += 1;

            // Goles a favor y en contra
            local.gf += gl;
            local.gc += gv;
            visitante.gf += gv;
            visitante.gc += gl;

            // Diferencia de goles
            local.dif = local.gf - local.gc;
            visitante.dif = visitante.gf - visitante.gc;

            // Resultado
            if (gl > gv) {
                // Gana local
                local.pg += 1;
                local.puntos += 3;
                visitante.pp += 1;
            } else if (gl < gv) {
                // Gana visitante
                visitante.pg += 1;
                visitante.puntos += 3;
                local.pp += 1;
            } else {
                // Empate
                local.pe += 1;
                visitante.pe += 1;
                local.puntos += 1;
                visitante.puntos += 1;
            }
        });

        // Ordenar por puntos, diferencia de goles, goles a favor
        const posiciones = Object.values(equiposMap)
            .sort((a, b) => 
                b.puntos - a.puntos ||
                b.dif - a.dif ||
                b.gf - a.gf
            )
            .map((equipo, idx) => ({
                ...equipo,
                posicion: idx + 1
            }));

        return posiciones;
    },
};

window.FirebaseDataStore = FirebaseDataStore;

// Ejemplo de uso de la función generarCalendario
// Asumiendo que este archivo ya existe, agregamos o modificamos la función getJugadoresPorEquipo

// Función para obtener jugadores por equipo
window.FirebaseDataStore.getJugadoresPorEquipo = async (equipoId) => {
  try {
    console.log("Buscando jugadores para el equipo ID:", equipoId)

    // Asegurarse de que el ID del equipo sea un string para la comparación
    const equipoIdStr = String(equipoId)

    // Obtener la colección de jugadores
    const firebase = window.firebase // Declare the firebase variable
    const jugadoresRef = firebase.firestore().collection("jugadores")
    const snapshot = await jugadoresRef.where("equipoId", "==", equipoIdStr).get()

    if (snapshot.empty) {
      console.log("No se encontraron jugadores para este equipo")
      return []
    }

    // Convertir los documentos a objetos
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
}
