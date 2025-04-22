import React, { useState } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native';
//import PantallaInicio from './componentes/iniciarsesion';
//import RegistroDeUsuario from './componentes/RegistroDeUsuario';
//import DatosPersonales from './componentes/DatosPersonales';
//import VistaDatos from './componentes/VistaDatos';
//import GestionMedicamentos from './componentes/GestionMedicamentos';

const IniciarSesion = ({ setScreen, setNombreUsuario }) => { 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email && password) {
      setNombreUsuario(email.split('@')[0]); 
      setScreen('Inicio');
    } else {
      Alert.alert("Error", "Por favor ingrese correo y contraseña");
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <TextInput 
        placeholder="Correo" 
        value={email} 
        onChangeText={setEmail} 
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }} 
      />
      <TextInput 
        placeholder="Contraseña" 
        value={password} 
        onChangeText={setPassword} 
        secureTextEntry 
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }} 
      />
      <Button title="Iniciar Sesión" onPress={handleLogin} />
      <Button title="Registrarse" onPress={() => setScreen('RegistroDeUsuario')} />
    </View>
  );
};

export default function App() {
  const [screen, setScreen] = useState('IniciarSesion');
  const [nombreUsuario, setNombreUsuario] = useState('');
  //const [showMedicamentos, setShowMedicamentos] = useState(false);
  //const [listaMedicamentos, setListaMedicamentos] = useState([]);

  return (
    <View style={{ flex: 1 }}>
      {/* {screen === 'Inicio' && (
        <PantallaInicio 
          setScreen={setScreen} 
          nombreUsuario={nombreUsuario}
          listaMedicamentos={listaMedicamentos}
          onShowMedicamentos={() => setShowMedicamentos(true)}
        />
      )} */}
      {screen === 'IniciarSesion' && (
        <IniciarSesion 
          setScreen={setScreen} 
          setNombreUsuario={setNombreUsuario} 
        />
      )}
      {/* {screen === 'RegistroDeUsuario' && (
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
      )} */}
    </View>
  );
}