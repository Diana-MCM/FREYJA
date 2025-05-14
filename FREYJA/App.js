import React, { useState, useEffect } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import PantallaInicio from './componentes/iniciarsesion';
import RegistroDeUsuario from './componentes/RegistroDeUsuario';
import DatosPersonales from './componentes/DatosPersonales';
import VistaDatos from './componentes/VistaDatos';
import Busqueda from './componentes/Busqueda';
import ListaAmigos from './componentes/ListaAmigos';
import Calendario from './componentes/Calendario';
import { auth } from './firebase/firebase';
import Notificaciones from './componentes/Notificaciones';
import SolicitudesAmistad from './componentes/SolicitudesAmistad';
import Subirinformacion from './componentes/Subirinformacion';
import Carpetas from './componentes/Carpetas';

// Componente de carga inicial
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#A89CC8' }}>
    <Text>Cargando aplicación...</Text>
  </View>
);

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
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
  const [screenParams, setScreenParams] = useState(null);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [appReady, setAppReady] = useState(false);

  // Efecto para inicialización de Firebase y autenticación
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Marcar la aplicación como lista
      setAppReady(true);
      
      if (user) {
        setNombreUsuario(user.displayName || user.email?.split('@')[0] || 'Usuario');
        setScreen('Inicio');
      } else {
        setScreen('IniciarSesion');
      }
    });
    
    // Limpieza al desmontar
    return unsubscribe;
  }, []);

  const handleSetScreen = (screen, params = null) => {
    console.log('setScreen llamado con:', { screen, params });
    setScreen(screen);
    setScreenParams(params);
  };
  
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

  // Mostrar pantalla de carga hasta que la app esté lista
  if (!appReady) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      {screen === 'Inicio' && (
        <PantallaInicio 
          setScreen={handleSetScreen} 
          nombreUsuario={nombreUsuario}
          cerrarSesion={cerrarSesion}
        />
      )}
      {screen === 'IniciarSesion' && (
        <IniciarSesion 
          setScreen={handleSetScreen} 
          setNombreUsuario={setNombreUsuario} 
        />
      )}
      {screen === 'RegistroDeUsuario' && (
        <RegistroDeUsuario 
          setScreen={handleSetScreen} 
          setNombreUsuario={setNombreUsuario} 
        />
      )}
      {screen === 'DatosPersonales' && (
        <DatosPersonales 
          setScreen={handleSetScreen}
          nombreUsuario={nombreUsuario}
        />
      )}
      {screen === 'VistaDatos' && (
        <VistaDatos 
          setScreen={handleSetScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'Calendario' && (
        <Calendario 
          setScreen={handleSetScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'Busqueda' && (
        <Busqueda
          setScreen={handleSetScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'ListaAmigos' && (
        <ListaAmigos
          setScreen={handleSetScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'Notificaciones' && (
        <Notificaciones 
          setScreen={handleSetScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'SolicitudesAmistad' && (
        <SolicitudesAmistad
          setScreen={handleSetScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'Subirinformacion' && (
        <Subirinformacion
          setScreen={handleSetScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}
      {screen === 'Carpetas' && (
        <Carpetas
          setScreen={handleSetScreen} 
          nombreUsuario={nombreUsuario}
          params={screenParams} 
        />
      )}
    </View>
  );
}