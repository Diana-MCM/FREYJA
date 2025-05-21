import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ImageBackground,TouchableOpacity} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import {  getDatabase, ref, set, get, runTransaction} from 'firebase/database';
import imagenFondo from './imagenes/Freyjaa.png';

const RegistroDeUsuario = ({ setScreen }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  // Función para generar ID único de 10 dígitos
const generarYReservarIdUnico = async (db, uid) => {
  const MAX_INTENTOS = 10;
  
  for (let i = 0; i < MAX_INTENTOS; i++) {
    try {
      const idCandidato = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const idRef = ref(db, `ids_usuarios/${idCandidato}`);
      
      // Verificar existencia
      const snapshot = await get(idRef);
      if (snapshot.exists()) continue;
      
      // Intentar reservar con transacción
      await set(idRef, uid);
      return idCandidato;
      
    } catch (error) {
      console.log("Intento fallido de generación de ID:", error.message);
      await new Promise(resolve => setTimeout(resolve, 100)); // Pequeña pausa
    }
  }
  
  throw new Error("No se pudo generar ID único después de varios intentos");
};

const handleRegister = async () => {
  try {
    setLoading(true);
    
    // 1. Crear usuario en Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // 2. Generar ID único seguro con transacción
    const db = getDatabase();
    const userId10digitos = await generarYReservarIdUnico(db, user.uid);
    
    // 3. Crear estructura de usuario
    await set(ref(db, `usuarios/${user.uid}`), {
      nombre: nombre.trim(),
      correo: email.trim(),
      userId: userId10digitos,
      fechaRegistro: new Date().toISOString(),
      datos_personales: {
        nombrecompleto: nombre.trim(),
        fechaRegistro: new Date().toISOString()
      }
    });
    
    Alert.alert("Registro exitoso", `Tu ID de usuario es: ${userId10digitos}`);
    setScreen('DatosPersonales');
  } catch (error) {
    console.error("Error en registro:", error);
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <ImageBackground 
          source={imagenFondo}
          style={{ flex: 1, width: '100%', height: '100%' }}
          resizeMode="cover"
      >
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',  
      backgroundColor: 'rgba(171, 163, 247, 0.73)',
      padding: 20
    }}>
      <Text style={{ fontSize: 60, fontWeight: 'bold', marginBottom: 50 }}>REGISTRO</Text>
      <TextInput
        placeholder="Usuario"
        value={nombre}
        onChangeText={setNombre}
        style={{ 
          borderWidth: 1, 
          borderRadius: 15,
          marginBottom: 10, 
          width: 300, 
          padding: 20, 
          backgroundColor: 'white' 
        }}
      />
      <TextInput
        placeholder="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ 
          borderWidth: 1, 
          borderRadius: 15,
          marginBottom: 10, 
          width: 300, 
          padding: 20, 
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
          borderRadius: 15,
          marginBottom: 10, 
          width: 300, 
          padding: 20, 
          backgroundColor: 'white' 
        }}
      />
      <TouchableOpacity
        onPress={handleRegister}
        disabled={loading}
        style={{
          backgroundColor: '#6200EE',
          paddingVertical: 10,
          paddingHorizontal: 60,
          borderRadius: 10,
          marginTop: 70,
          marginBottom: 40,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 5
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
          Entrar
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => setScreen('IniciarSesion')} 
        disabled={loading}
        style={{
          backgroundColor: '#6200EE',
          paddingVertical: 10,
          paddingHorizontal: 60,
          borderRadius: 10,
          marginBottom: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
          elevation: 5
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
          Volver 
        </Text>
      </TouchableOpacity>
    </View>
    </ImageBackground>
  );
};

export default RegistroDeUsuario;