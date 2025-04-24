import React, { useState } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import PantallaInicio from './componentes/iniciarsesion';
import RegistroDeUsuario from './componentes/RegistroDeUsuario';
import DatosPersonales from './componentes/DatosPersonales';
import VistaDatos from './componentes/VistaDatos';
import Busqueda from './componentes/Busqueda';
import ListaAmigos from './componentes/ListaAmigos';
import Calendario from './componentes/Calendario';
import { auth } from './firebase/firebase';
import { signOut } from 'firebase/auth';
import Notificaciones from './componentes/Notificaciones';
import SolicitudesAmistad from './componentes/SolicitudesAmistad';
import Subirinformacion from './componentes/Subirinformacion';


const IniciarSesion = ({ setScreen, setNombreUsuario }) => { 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingrese correo y contraseña");
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Obtener el nombre del usuario desde Firebase
      const user = userCredential.user;
      const nombre = user.displayName || email.split('@')[0];
      
      setNombreUsuario(nombre);
      setScreen('Inicio');
    } catch (error) {
      let errorMessage = "Error al iniciar sesión";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "Usuario no encontrado";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Contraseña incorrecta";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Correo electrónico inválido";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Demasiados intentos. Cuenta temporalmente bloqueada";
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#A89CC8'
    }}>
      <Text style={{ fontSize: 30, fontWeight: 'bold', marginBottom: 10 }}>BIENVENIDO A FREYJA</Text>
      <Text style={{ fontSize: 15, marginBottom: 10, fontFamily: 'Courier New', textAlign: 'center' }}>
        Si ya cuenta con una cuenta, por favor inicie sesión.
      </Text>
      <Text style={{ fontSize: 15, marginBottom: 10, fontFamily: 'Courier New', textAlign: 'center' }}>
        En caso de que no, por favor regístrese para entrar.
      </Text>
      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ 
          borderWidth: 1, 
          marginBottom: 10, 
          width: 200, 
          padding: 5, 
          backgroundColor: 'white' 
        }}
      />
      <TextInput
        placeholder="Contraseña"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ 
          borderWidth: 1, 
          marginBottom: 10, 
          width: 200, 
          padding: 5, 
          backgroundColor: 'white' 
        }}
      />
      <Button 
        title="Entrar" 
        onPress={handleLogin}
        disabled={loading}
      />
      <Button 
        title="Registrarse" 
        onPress={() => setScreen('RegistroDeUsuario')} 
        disabled={loading}
      />
    </View>
  );
};

export default function App() {
  const [screen, setScreen] = useState('IniciarSesion');
  const [nombreUsuario, setNombreUsuario] = useState('');
  //const [showMedicamentos, setShowMedicamentos] = useState(false);
  //const [listaMedicamentos, setListaMedicamentos] = useState([]);
  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      setNombreUsuario('');
      setScreen('IniciarSesion');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      Alert.alert("Error", "No se pudo cerrar la sesión");
    }
  };
  return (
    <View style={{ flex: 1 }}>
      {screen === 'Inicio' && (
        <PantallaInicio 
          setScreen={setScreen} 
          nombreUsuario={nombreUsuario}
          cerrarSesion={cerrarSesion}
          //listaMedicamentos={listaMedicamentos}
          //onShowMedicamentos={() => setShowMedicamentos(true)}
        />
      )}
      {screen === 'IniciarSesion' && (
        <IniciarSesion 
          setScreen={setScreen} 
          setNombreUsuario={setNombreUsuario} 
        />
      )}
      {screen === 'RegistroDeUsuario' && (
        <RegistroDeUsuario 
          setScreen={setScreen} 
          setNombreUsuario={setNombreUsuario} 
        />
      )}
      {screen === 'DatosPersonales' && (
        <DatosPersonales 
          setScreen={setScreen}
          nombreUsuario={nombreUsuario}
        />
      )}
      {screen === 'VistaDatos' && (
        <VistaDatos 
          setScreen={setScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'Calendario' && (
        <Calendario 
          setScreen={setScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'Busqueda' && (
        <Busqueda
          setScreen={setScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'ListaAmigos' && (
        <ListaAmigos
          setScreen={setScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'Notificaciones' && (
        <Notificaciones 
          setScreen={setScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'SolicitudesAmistad' && (
        <SolicitudesAmistad
          setScreen={setScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'Subirinformacion' && (
        <Subirinformacion
          setScreen={setScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}

    </View>
  );
}