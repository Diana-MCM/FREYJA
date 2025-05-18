import { initializeAuth, getReactNativePersistence, createUserWithEmailAndPassword } from "firebase/auth";
import { getDatabase, ref, set } from "firebase/database";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { app } from "../firebase/firebase.js";

// Configuración mejorada de autenticación con persistencia
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getDatabase(app);

export const registrarUsuario = async (email, password, nombre) => {
  try {
    // Validaciones mejoradas
    if (!email || !password || !nombre) {
      throw new Error("Todos los campos son obligatorios");
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      throw new Error("El correo no es válido");
    }
    
    if (password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }
    
    if (nombre.length < 2) {
      throw new Error("El nombre debe tener al menos 2 caracteres");
    }

    // Crear usuario en Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Crear estructura inicial en Realtime Database
    await set(ref(db, `usuarios/${userCredential.user.uid}`), {
      userId: userCredential.user.uid,
      email: email,
      nombre: nombre,
      fechaRegistro: new Date().toISOString(),
      datos_personales: {
        nombreCompleto: nombre,
        fechaRegistro: new Date().toISOString()
      }
    });

    return { 
      success: true, 
      user: {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        nombre: nombre
      }
    };
    
  } catch (error) {
    // Manejo mejorado de errores
    let errorMsg;
    
    switch(error.code) {
      case 'auth/email-already-in-use':
        errorMsg = "El correo ya está registrado. ¿Quieres iniciar sesión?";
        break;
      case 'auth/invalid-email':
        errorMsg = "El formato del correo no es válido";
        break;
      case 'auth/weak-password':
        errorMsg = "La contraseña debe tener al menos 6 caracteres";
        break;
      case 'PERMISSION_DENIED':
        errorMsg = "Error de permisos. Contacta al administrador";
        break;
      default:
        errorMsg = error.message.replace("Firebase: ", "");
    }

    return { 
      success: false, 
      error: errorMsg,
      code: error.code || 'unknown'
    };
  }
};