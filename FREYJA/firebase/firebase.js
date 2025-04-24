// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRXgJSHTqTCaY8YNs8XJJrMAwu5I1qqtw",
  authDomain: "freyja-45b82.firebaseapp.com",
  projectId: "freyja-45b82",
  storageBucket: "freyja-45b82.firebasestorage.app",
  messagingSenderId: "12235686241",
  appId: "1:12235686241:web:22bfd18cc025ebb5d90520",
  databaseURL: "https://freyja-45b82-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const App =  !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
export default App;

