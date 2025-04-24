import React, { useState } from 'react';
import { View, Text, Button, TextInput, Alert, SafeAreaView } from 'react-native';
import PantallaInicio from './componentes/iniciarsesion';
import RegistroDeUsuario from './componentes/RegistroDeUsuario';
import DatosPersonales from './componentes/DatosPersonales';
import VistaDatos from './componentes/VistaDatos';
import Busqueda from './componentes/Busqueda';
import ListaAmigos from './componentes/ListaAmigos';
import Subirinformacion from './componentes/Subirinformacion';

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
        style={{ 
          position: '',
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
      <Button title="Entrar" onPress={handleLogin}/>
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
      {screen === 'Inicio' && (
        <PantallaInicio 
          setScreen={setScreen} 
          nombreUsuario={nombreUsuario}
          //listaMedicamentos={listaMedicament
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
      {screen === 'Subirinformacion' && (
        <Subirinformacion
          setScreen={setScreen} 
          nombreUsuario={nombreUsuario} 
        />
      )}

    </View>
  );
}
