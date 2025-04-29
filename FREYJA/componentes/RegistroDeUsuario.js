import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { inicializarEstructuraNotificaciones } from './FirebaseUtils';
import { getDatabase, ref, update } from 'firebase/database';

const RegistroDeUsuario = ({ setScreen }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Actualiza el perfil del usuario con un nombre
      await updateProfile(user, { displayName: nombre });

      // Inicializa la estructura de notificaciones
      const userId = user.uid;
      const resultado = await inicializarEstructuraNotificaciones(userId);

      if (resultado) {
        console.log("Estructura de notificaciones inicializada correctamente");
      } else {
        console.error("Error al inicializar la estructura de notificaciones");
      }

      const db = getDatabase();
      await update(ref(db, `usuarios/${userId}`), {
      nombre: nombre || "Usuario sin nombre", // Valor predeterminado si nombre está vacío
      correo: email,
      solicitudes: {}, // Inicializa solicitudes como un objeto vacío
      notificaciones: {}, // Inicializa notificaciones como un objeto vacío
      });

      Alert.alert("Registro exitoso", "Usuario registrado correctamente");
      setScreen('DatosPersonales');
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      Alert.alert("Error", "No se pudo registrar el usuario. Inténtalo de nuevo.");
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
      <Text style={{ fontSize: 30, fontWeight: 'bold', marginBottom: 10 }}>REGISTRO</Text>
      <TextInput
        placeholder="Nombre"
        value={nombre}
        onChangeText={setNombre}
        style={{ 
          borderWidth: 1, 
          marginBottom: 10, 
          width: 200, 
          padding: 5, 
          backgroundColor: 'white' 
        }}
      />
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
        title="Registrarse" 
        onPress={handleRegister}
        disabled={loading}
      />
      <Button 
        title="Volver" 
        onPress={() => setScreen('IniciarSesion')} 
        disabled={loading}
      />
    </View>
  );
};

export default RegistroDeUsuario;