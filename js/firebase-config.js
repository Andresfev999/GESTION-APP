// Configuración de Firebase (sin imports, usando scripts CDN)
const firebaseConfig = {
  apiKey: "AIzaSyC1wZKkmthD1nLzYa5hLKYVggN2qIkXFgA",
  authDomain: "legion-deportiva-9363c.firebaseapp.com",
  projectId: "legion-deportiva-9363c",
  storageBucket: "legion-deportiva-9363c.firebasestorage.app",
  messagingSenderId: "795189789462",
  appId: "1:795189789462:web:7a8b4adaf803739870c637",
  measurementId: "G-CKRFJJZLL0",
}

// Función para inicializar Firebase
function initializeFirebase() {
  try {
    // Verificar si Firebase está disponible
    if (typeof window.firebase === "undefined") {
      console.error("Firebase no está disponible. Verifica que los scripts de Firebase estén cargados.")
      return false
    }

    // Verificar si ya está inicializado
    if (window.firebase.apps && window.firebase.apps.length > 0) {
      console.log("Firebase ya está inicializado")
      return true
    }

    // Inicializar Firebase
    window.firebase.initializeApp(firebaseConfig)
    console.log("Firebase inicializado correctamente")

    // Inicializar Analytics si está disponible
    if (window.firebase.analytics) {
      window.firebase.analytics()
      console.log("Firebase Analytics inicializado")
    }

    return true
  } catch (error) {
    console.error("Error al inicializar Firebase:", error)
    return false
  }
}

// Función para verificar si Firebase está listo
function isFirebaseReady() {
  return typeof window.firebase !== "undefined" && window.firebase.apps && window.firebase.apps.length > 0
}

// Función para obtener la instancia de Firestore
function getFirestore() {
  if (isFirebaseReady()) {
    return window.firebase.firestore()
  }
  return null
}

// Inicializar Firebase cuando el script se carga
document.addEventListener("DOMContentLoaded", () => {
  initializeFirebase()
})

// También intentar inicializar inmediatamente si el DOM ya está cargado
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeFirebase)
} else {
  initializeFirebase()
}

// Exportar funciones para uso global
window.FirebaseUtils = {
  initializeFirebase,
  isFirebaseReady,
  getFirestore,
}
