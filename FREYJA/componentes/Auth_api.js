import App from "../firebase/firebase.js";
import { initializeAuth, getReactNativePersistence,createUserWithEmailAndPassword } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getDatabase, ref, set } from "firebase/database";
const auth = initializeAuth(App, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const db = getDatabase(App);

export const registrarUsuario = async (email, password) => {
  try {
    if (!email || !password) throw new Error("Todos los campos son obligatorios");
    if (!/\S+@\S+\.\S+/.test(email)) throw new Error("El correo no es válido");
    if (/\s/.test(email)) throw new Error("El correo no debe contener espacios en blanco");
    if (/\s/.test(password)) throw new Error("La contraseña no debe contener espacios en blanco");
    if (!/[a-zA-Z]/.test(password)) throw new Error("La contraseña debe contener al menos una letra");
    if (!/\d/.test(password)) throw new Error("La contraseña debe contener al menos un número");
    if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await set(ref(db, `usuarios/${userCredential.user.uid}`), {
      email: email,
      fechaRegistro: new Date().toISOString()
    });

    return { success: true, user: userCredential.user };
  } catch (error) {
    const errorMsg = error.code === 'auth/email-already-in-use' 
      ? "El correo ya está registrado. ¿Quieres iniciar sesión?"
      : error.message.replace("Firebase: ", "");

    return { success: false, error: errorMsg };
  }
};

export const iniciarSesion = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message.replace("Firebase: ", "") };
  }
};