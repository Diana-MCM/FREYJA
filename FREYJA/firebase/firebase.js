import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
//import { getReactNativePersistence } from 'firebase/auth/react-native';//
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCRXgJSHTqTCaY8YNs8XJJrMAwu5I1qqtw",
  authDomain: "freyja-45b82.firebaseapp.com",
  projectId: "freyja-45b82",
  storageBucket: "freyja-45b82.firebasestorage.app",
  messagingSenderId: "12235686241",
  appId: "1:12235686241:web:22bfd18cc025ebb5d90520",
  databaseURL: "https://freyja-45b82-default-rtdb.firebaseio.com/"
};

// Inicialización
const app = initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  console.log('Usando getAuth como fallback');
  auth = getAuth(app);
}

const db = getDatabase(app);

export { auth, db };
