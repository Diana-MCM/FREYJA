import { auth, db } from "../firebase/firebase.js";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";

export const registrarUsuario = async (email, password) => {
  try {
    if (!email || !password) throw new Error("Todos los campos son obligatorios");
    if (!/\S+@\S+\.\S+/.test(email)) throw new Error("El correo no es válido");
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