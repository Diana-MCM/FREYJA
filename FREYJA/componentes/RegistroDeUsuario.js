import React, { useState } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native';
import { registrarUsuario } from './Auth_api.js';
import { getAuth, updateProfile } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';

const RegistroDeUsuario = ({ setScreen, setNombreUsuario }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      Alert.alert("Error", "Todos los campos son obligatorios");
      return;
    }

    try {
      const resultado = await registrarUsuario(email, password);
      
      if (!resultado.success) {
        Alert.alert("Error", resultado.error);
        return;
      }

      const auth = getAuth();
      const db = getDatabase();

      // Función para generar un ID único de 10 dígitos
      const generarUserIdUnico = async () => {
        let userIdGenerado;
        let existe = true;

        while (existe) {
          userIdGenerado = Math.floor(1000000000 + Math.random() * 9000000000).toString();
          const snapshot = await get(ref(db, 'usuarios'));
          
          if (snapshot.exists()) {
            const usuarios = snapshot.val();
            const ids = Object.values(usuarios).map(u => u.userId);
            existe = ids.includes(userIdGenerado);
          } else {
            existe = false;
          }
        }

        return userIdGenerado;
      };

      // Actualizar perfil con nombre
      await updateProfile(auth.currentUser, {
        displayName: nombre
      });

      // Obtener userId único
      const userId = await generarUserIdUnico();

      // Guardar en base de datos
      await set(ref(db, 'usuarios/' + auth.currentUser.uid), {
        nombre,
        email,
        userId,
        fechaRegistro: new Date().toISOString()
      });

      Alert.alert("Éxito", "Usuario registrado correctamente");
      setNombreUsuario(nombre);
      setScreen('DatosPersonales'); 
      
    } catch (error) {
      console.error("Error completo:", error);
      Alert.alert("Error", "Ocurrió un problema durante el registro");
    }
  };

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: 'rgba(157, 190, 187, 0.7)',
      padding: 20
    }}>
      <Text style={{ marginBottom: 20 }}>Registrarse para poder ingresar</Text>
      <TextInput
        placeholder="Nombre de Usuario"
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
      <View style={{ marginBottom: 10 }}>
        <Button title="Registrar" onPress={handleRegister} />
      </View>
      <Button title="Volver" onPress={() => setScreen('IniciarSesion')} />
    </View>
  );
};

export default RegistroDeUsuario;
