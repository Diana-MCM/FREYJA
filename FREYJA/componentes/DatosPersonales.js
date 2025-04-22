import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { getDatabase, ref, set, get } from 'firebase/database';
import { getAuth } from 'firebase/auth'; // Añadido para obtener el usuario actual

const RegistroDatos = ({ setScreen }) => {
  const [nombrecompleto, setNombrecompleto] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [estatura, setEstatura] = useState('');

  const guardarDatos = async () => {
    if (!nombrecompleto || !edad || !genero || !estatura) {
      Alert.alert("Error", "Por favor completa todos los campos");
      return;
    }

    try {
      const auth = getAuth(); // Obtiene la instancia de autenticación
      const user = auth.currentUser; // Usuario actual

      if (!user) {
        Alert.alert("Error", "No hay usuario autenticado. Inicia sesión primero.");
        return;
      }

      const db = getDatabase();
      // Guarda los datos en el nodo del usuario actual (usando su UID)
      await set(ref(db, `usuarios/${user.uid}/datos_personales`), { // Añadí una subruta "datos_personales" para organizar mejor
        nombrecompleto,
        edad,
        genero,
        estatura,
        fechaRegistro: new Date().toISOString()
      });

      // Verificación opcional (puedes quitarla si no la necesitas)
      const snapshot = await get(ref(db, `usuarios/${user.uid}/datos_personales`));
      
      if (snapshot.exists()) {
        Alert.alert(
          "Éxito",
          "Tus datos se guardaron correctamente:\n\n" +
          `Nombre: ${snapshot.val().nombrecompleto}\n` +
          `Edad: ${snapshot.val().edad}\n` +
          `Género: ${snapshot.val().genero}\n` +
          `Estatura: ${snapshot.val().estatura} cm`,
          [{ text: "OK", onPress: () => setScreen('Inicio') }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudieron guardar los datos");
      console.error("Error al guardar:", error);
    }
  };

  // El resto del código (UI) se mantiene igual ⬇️
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Registro de Datos Personales</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={nombrecompleto}
        onChangeText={setNombrecompleto}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Edad"
        keyboardType="numeric"
        value={edad}
        onChangeText={setEdad}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Género (Masculino/Femenino/Otro)"
        value={genero}
        onChangeText={setGenero}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Estatura (cm)"
        keyboardType="numeric"
        value={estatura}
        onChangeText={setEstatura}
      />

      <View style={styles.botonesContainer}>
        <View style={styles.botonWrapper}>
          <Button
            title="Guardar Datos"
            onPress={guardarDatos}
            color="#4682B4"
          />
        </View>
        
        <View style={styles.botonWrapper}>
          <Button
            title="Cancelar"
            onPress={() => setScreen('RegistroDeUsuario')}
            color="#FF6B6B"
          />
        </View>
      </View>
    </View>
  );
};

// Estilos (se mantienen igual) ⬇️
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#9DBEBB',
    borderRadius: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2E4053',
    textAlign: 'center'
  },
  input: {
    height: 40,
    borderColor: '#9DBEBB',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: 'white'
  },
  botonesContainer: {
    marginTop: 20
  },
  botonWrapper: {
    marginVertical: 8,
    borderRadius: 5,
    overflow: 'hidden'
  }
});

export default RegistroDatos;