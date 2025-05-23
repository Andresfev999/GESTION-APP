// Módulo para la gestión de autenticación
const AuthModule = {
    // Propiedades
    currentUser: null,
    userProfile: null,
    authStateListeners: [],

    // Inicializar el módulo
    init: function() {
        console.log('Inicializando módulo de autenticación...');
        
        // Verificar si Firebase está disponible
        const firebase = window.firebase; // Declare the firebase variable
        if (typeof firebase === 'undefined') {
            console.error("Firebase no está disponible. Verifica que los scripts de Firebase estén cargados correctamente.");
            return;
        }
        
        // Verificar si el usuario está autenticado
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                // Usuario autenticado
                this.currentUser = user;
                console.log('Usuario autenticado:', user.email);
                
                // Obtener perfil del usuario
                this.getUserProfile(user.uid);
                
                // Actualizar último acceso
                this.updateLastLogin(user.uid);
                
                // Notificar a los listeners
                this.notifyAuthStateListeners(true, user);
                
                // Actualizar UI
                this.updateUI(true, user);
            } else {
                // Usuario no autenticado
                this.currentUser = null;
                this.userProfile = null;
                console.log('Usuario no autenticado');
                
                // Notificar a los listeners
                this.notifyAuthStateListeners(false, null);
                
                // Actualizar UI
                this.updateUI(false);
                
                // Verificar si estamos en una página protegida
                this.checkProtectedPage();
            }
        });
        
        // Inicializar formularios de autenticación
        this.initLoginForm();
        this.initRegisterForm();
        this.initLogoutButton();
    },
    
    // Obtener perfil del usuario
    getUserProfile: function(userId) {
        const firebase = window.firebase; // Declare the firebase variable
        const db = firebase.firestore();
        
        db.collection('usuarios').doc(userId).get()
            .then(doc => {
                if (doc.exists) {
                    this.userProfile = doc.data();
                    console.log('Perfil de usuario cargado:', this.userProfile);
                    
                    // Actualizar UI con datos del perfil
                    this.updateUIWithProfile();
                } else {
                    console.log('No existe perfil para este usuario');
                    
                    // Crear perfil básico
                    this.createUserProfile(userId);
                }
            })
            .catch(error => {
                console.error('Error al obtener perfil de usuario:', error);
            });
    },
    
    // Crear perfil básico de usuario
    createUserProfile: function(userId) {
        const firebase = window.firebase; // Declare the firebase variable
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        const db = firebase.firestore();
        const profileData = {
            nombre: user.displayName || '',
            email: user.email,
            photoURL: user.photoURL || '',
            fechaRegistro: new Date(),
            ultimoAcceso: new Date(),
            rol: 'usuario' // Rol por defecto
        };
        
        db.collection('usuarios').doc(userId).set(profileData)
            .then(() => {
                console.log('Perfil de usuario creado');
                this.userProfile = profileData;
                this.updateUIWithProfile();
            })
            .catch(error => {
                console.error('Error al crear perfil de usuario:', error);
            });
    },
    
    // Actualizar último acceso
    updateLastLogin: function(userId) {
        const firebase = window.firebase; // Declare the firebase variable
        const db = firebase.firestore();
        
        db.collection('usuarios').doc(userId).update({
            ultimoAcceso: new Date()
        })
        .catch(error => {
            console.error('Error al actualizar último acceso:', error);
        });
    },
    
    // Actualizar la interfaz según el estado de autenticación
    updateUI: function(isLoggedIn, user = null) {
        const authContainer = document.getElementById('auth-container');
        const userContainer = document.getElementById('user-container');
        const protectedContent = document.querySelectorAll('.protected-content');
        const adminContent = document.querySelectorAll('.admin-content');
        const navbarUserSection = document.getElementById('navbar-user-section');
        const navbarAuthButtons = document.getElementById('navbar-auth-buttons');
        const guestContent = document.getElementById('guest-content');
        
        if (isLoggedIn && user) {
            // Mostrar información del usuario
            if (authContainer) authContainer.style.display = 'none';
            if (userContainer) userContainer.style.display = 'block';
            if (guestContent) guestContent.style.display = 'none';
            
            // Mostrar contenido protegido
            protectedContent.forEach(element => {
                element.style.display = 'block';
            });
            
            // Actualizar navbar
            if (navbarUserSection) navbarUserSection.style.display = 'flex';
            if (navbarAuthButtons) navbarAuthButtons.style.display = 'none';
            
            // Guardar estado de autenticación
            localStorage.setItem('user-authenticated', 'true');
        } else {
            // Mostrar formulario de login
            if (authContainer) authContainer.style.display = 'block';
            if (userContainer) userContainer.style.display = 'none';
            if (guestContent) guestContent.style.display = 'block';
            
            // Ocultar contenido protegido
            protectedContent.forEach(element => {
                element.style.display = 'none';
            });
            
            // Ocultar contenido de administrador
            adminContent.forEach(element => {
                element.style.display = 'none';
            });
            
            // Actualizar navbar
            if (navbarUserSection) navbarUserSection.style.display = 'none';
            if (navbarAuthButtons) navbarAuthButtons.style.display = 'flex';
            
            // Limpiar estado de autenticación
            localStorage.removeItem('user-authenticated');
        }
    },
    
    // Actualizar UI con datos del perfil
    updateUIWithProfile: function() {
        if (!this.userProfile) return;
        
        const userNameElement = document.getElementById('user-name');
        const userEmailElement = document.getElementById('user-email');
        const userAvatarElement = document.getElementById('user-avatar');
        const userInitialsElement = document.getElementById('user-initials');
        const adminContent = document.querySelectorAll('.admin-content');
        
        // Actualizar nombre y email
        if (userNameElement) userNameElement.textContent = this.userProfile.nombre || 'Usuario';
        if (userEmailElement) userEmailElement.textContent = this.userProfile.email;
        
        // Actualizar avatar
        if (userAvatarElement && userInitialsElement) {
            if (this.userProfile.photoURL) {
                userAvatarElement.src = this.userProfile.photoURL;
                userAvatarElement.style.display = 'block';
                userInitialsElement.style.display = 'none';
            } else {
                // Usar iniciales como avatar
                const initials = this.getInitials(this.userProfile.nombre || this.userProfile.email);
                userAvatarElement.style.display = 'none';
                userInitialsElement.textContent = initials;
                userInitialsElement.style.display = 'flex';
            }
        }
        
        // Mostrar contenido de administrador si corresponde
        if (this.userProfile.rol === 'admin') {
            adminContent.forEach(element => {
                element.style.display = 'block';
            });
        }
    },
    
    // Obtener iniciales del nombre
    getInitials: function(name) {
        if (!name) return '?';
        
        const parts = name.split(' ');
        if (parts.length === 1) {
            return name.charAt(0).toUpperCase();
        }
        
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    },
    
    // Verificar si estamos en una página protegida
    checkProtectedPage: function() {
        const protectedPages = [
            '/admin/',
            '/torneos/crear.html',
            '/torneos/editar.html',
            '/equipos/crear.html',
            '/equipos/editar.html',
            '/jugadores/crear.html',
            '/jugadores/editar.html',
            '/partidos/crear.html',
            '/partidos/editar.html'
        ];
        
        const currentPath = window.location.pathname;
        
        // Verificar si la página actual es protegida
        const isProtected = protectedPages.some(page => 
            currentPath.includes(page) || 
            currentPath.endsWith(page)
        );
        
        if (isProtected && !this.currentUser) {
            // Redirigir a la página de login
            const returnUrl = encodeURIComponent(window.location.href);
            window.location.href = `/login.html?returnUrl=${returnUrl}`;
        }
    },
    
    // Inicializar formulario de login
    initLoginForm: function() {
        const loginForm = document.getElementById('login-form');
        if (!loginForm) return;
        
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorMessage = document.getElementById('login-error');
            const rememberMe = document.getElementById('remember-me')?.checked || false;
            
            // Limpiar mensaje de error
            if (errorMessage) errorMessage.textContent = '';
            
            const firebase = window.firebase; // Declare the firebase variable
            // Configurar persistencia
            const persistence = rememberMe 
                ? firebase.auth.Auth.Persistence.LOCAL 
                : firebase.auth.Auth.Persistence.SESSION;
            
            firebase.auth().setPersistence(persistence)
                .then(() => {
                    // Iniciar sesión
                    return firebase.auth().signInWithEmailAndPassword(email, password);
                })
                .then(userCredential => {
                    // Login exitoso
                    console.log('Usuario autenticado:', userCredential.user);
                    
                    // Redirigir a la página de retorno o a la principal
                    const urlParams = new URLSearchParams(window.location.search);
                    const returnUrl = urlParams.get('returnUrl');
                    
                    if (returnUrl) {
                        window.location.href = decodeURIComponent(returnUrl);
                    } else {
                        window.location.href = 'index.html';
                    }
                })
                .catch(error => {
                    // Error en login
                    console.error('Error en login:', error);
                    if (errorMessage) {
                        switch (error.code) {
                            case 'auth/user-not-found':
                                errorMessage.textContent = 'Usuario no encontrado';
                                break;
                            case 'auth/wrong-password':
                                errorMessage.textContent = 'Contraseña incorrecta';
                                break;
                            case 'auth/too-many-requests':
                                errorMessage.textContent = 'Demasiados intentos fallidos. Intenta más tarde';
                                break;
                            default:
                                errorMessage.textContent = error.message;
                        }
                    }
                });
        });
    },
    
    // Inicializar formulario de registro
    initRegisterForm: function() {
        const registerForm = document.getElementById('register-form');
        if (!registerForm) return;
        
        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const termsAccepted = document.getElementById('terms-checkbox')?.checked || false;
            const errorMessage = document.getElementById('register-error');
            
            // Limpiar mensaje de error
            if (errorMessage) errorMessage.textContent = '';
            
            // Verificar que las contraseñas coincidan
            if (password !== confirmPassword) {
                if (errorMessage) errorMessage.textContent = 'Las contraseñas no coinciden';
                return;
            }
            
            // Verificar aceptación de términos
            if (!termsAccepted) {
                if (errorMessage) errorMessage.textContent = 'Debes aceptar los términos y condiciones';
                return;
            }
            
            const firebase = window.firebase; // Declare the firebase variable
            // Crear cuenta
            firebase.auth().createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    // Registro exitoso
                    console.log('Usuario registrado:', userCredential.user);
                    
                    // Actualizar perfil del usuario
                    return userCredential.user.updateProfile({
                        displayName: name
                    });
                })
                .then(() => {
                    // Guardar información adicional del usuario en Firestore
                    const user = firebase.auth().currentUser;
                    const db = firebase.firestore();
                    
                    return db.collection('usuarios').doc(user.uid).set({
                        nombre: name,
                        email: user.email,
                        photoURL: user.photoURL || '',
                        fechaRegistro: new Date(),
                        ultimoAcceso: new Date(),
                        rol: 'usuario' // Rol por defecto
                    });
                })
                .then(() => {
                    // Enviar email de verificación
                    return firebase.auth().currentUser.sendEmailVerification();
                })
                .then(() => {
                    // Redirigir a la página principal
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    // Error en registro
                    console.error('Error en registro:', error);
                    if (errorMessage) {
                        switch (error.code) {
                            case 'auth/email-already-in-use':
                                errorMessage.textContent = 'El email ya está en uso';
                                break;
                            case 'auth/weak-password':
                                errorMessage.textContent = 'La contraseña es demasiado débil';
                                break;
                            case 'auth/invalid-email':
                                errorMessage.textContent = 'El email no es válido';
                                break;
                            default:
                                errorMessage.textContent = error.message;
                        }
                    }
                });
        });
    },
    
    // Inicializar botón de logout
    initLogoutButton: function() {
        const logoutButtons = document.querySelectorAll('.logout-button');
        if (logoutButtons.length === 0) return;
        
        const firebase = window.firebase; // Declare the firebase variable
        logoutButtons.forEach(button => {
            button.addEventListener('click', e => {
                e.preventDefault();
                
                firebase.auth().signOut()
                    .then(() => {
                        // Logout exitoso
                        console.log('Usuario desconectado');
                        
                        // Redirigir a la página de login
                        window.location.href = 'login.html';
                    })
                    .catch(error => {
                        // Error en logout
                        console.error('Error en logout:', error);
                    });
            });
        });
    },
    
    // Verificar si el usuario está autenticado
    isAuthenticated: function() {
        return this.currentUser !== null;
    },
    
    // Obtener usuario actual
    getCurrentUser: function() {
        return this.currentUser;
    },
    
    // Obtener perfil del usuario actual
    getUserProfile: function() {
        return this.userProfile;
    },
    
    // Verificar si el usuario tiene rol de administrador
    isAdmin: function() {
        return this.userProfile && this.userProfile.rol === 'admin';
    },
    
    // Añadir listener para cambios en el estado de autenticación
    addAuthStateListener: function(callback) {
        this.authStateListeners.push(callback);
    },
    
    // Notificar a los listeners sobre cambios en el estado de autenticación
    notifyAuthStateListeners: function(isLoggedIn, user) {
        this.authStateListeners.forEach(callback => {
            callback(isLoggedIn, user);
        });
    }
};

// Inicializar el módulo cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si Firebase está disponible antes de inicializar
    const firebase = window.firebase; // Declare the firebase variable
    if (typeof firebase !== 'undefined') {
        AuthModule.init();
    } else {
        console.error("Firebase no está disponible. Verifica que los scripts de Firebase estén cargados correctamente.");
    }
});

// Hacer disponible el AuthModule globalmente
window.AuthModule = AuthModule;