import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { getDatabase, ref, query, orderByChild, equalTo, get, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BuscarAmigos = ({ setScreen }) => {
  const [userIdBusqueda, setUserIdBusqueda] = useState('');
  const [amigoEncontrado, setAmigoEncontrado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const buscarAmigo = async () => {
    if (!userIdBusqueda || userIdBusqueda.length !== 10 || !/^\d+$/.test(userIdBusqueda)) {
      Alert.alert("Error", "Por favor ingresa un ID de usuario válido de 10 dígitos");
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const db = getDatabase();
      const usersRef = ref(db, 'usuarios');
      const queryRef = query(usersRef, orderByChild('userId'), equalTo(userIdBusqueda));
      
      const snapshot = await get(queryRef);
      
      if (snapshot.exists()) {
        const datos = snapshot.val();
        const amigoData = Object.values(datos)[0];
        const amigoId = Object.keys(datos)[0];
        
        setAmigoEncontrado({
          id: amigoId,
          nombre: amigoData.nombre,
          userId: amigoData.userId,
          fechaRegistro: amigoData.fechaRegistro
        });
        setMensaje('');
      } else {
        setAmigoEncontrado(null);
        setMensaje("No se encontró ningún usuario con ese ID");
      }
    } catch (error) {
      console.error("Error en búsqueda:", error);
      Alert.alert("Error", "No se pudo completar la búsqueda");
    } finally {
      setLoading(false);
    }
  };

  const agregarAmigo = async () => {
    if (!amigoEncontrado) return;

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const db = getDatabase();
      
      // Actualizar la lista de amigos del usuario actual
      const updates = {};
      updates[`usuarios/${user.uid}/amigos/${amigoEncontrado.id}`] = {
        nombre: amigoEncontrado.nombre,
        userId: amigoEncontrado.userId,
        fechaAgregado: new Date().toISOString()
      };

      await update(ref(db), updates);
      
      Alert.alert("¡Éxito!", `${amigoEncontrado.nombre} ha sido agregado a tu lista de amigos`);
      setAmigoEncontrado(null);
      setUserIdBusqueda('');
    } catch (error) {
      console.error("Error al agregar amigo:", error);
      Alert.alert("Error", "No se pudo agregar al amigo");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Buscar Amigos</Text>
      
      <View style={styles.busquedaContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ingresa ID de 10 dígitos"
          keyboardType="numeric"
          maxLength={10}
          value={userIdBusqueda}
          onChangeText={setUserIdBusqueda}
        />
        <Button
          title="Buscar"
          onPress={buscarAmigo}
          color="#6200EE"
          disabled={loading}
        />
      </View>

      {loading && <Text style={styles.cargando}>Buscando usuario...</Text>}
      
      {mensaje ? (
        <Text style={styles.mensaje}>{mensaje}</Text>
      ) : amigoEncontrado ? (
        <View style={styles.tarjetaAmigo}>
          <Text style={styles.nombreAmigo}>{amigoEncontrado.nombre}</Text>
          <Text style={styles.userIdAmigo}>ID: {amigoEncontrado.userId}</Text>
          <Text style={styles.fechaRegistro}>
            Miembro desde: {new Date(amigoEncontrado.fechaRegistro).toLocaleDateString()}
          </Text>
          
          <TouchableOpacity 
            style={styles.botonAgregar}
            onPress={agregarAmigo}
          >
            <Icon name="person-add" size={20} color="white" />
            <Text style={styles.textoBotonAgregar}>Agregar Amigo</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Button
        title="Volver al Inicio"
        onPress={() => setScreen('Inicio')}
        color="#757575"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5'
  },
  titulo: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
    textAlign: 'center'
  },
  busquedaContainer: {
    marginBottom: 20,
    gap: 10
  },
  input: {
    height: 50,
    borderColor: '#BDBDBD',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: 'white'
  },
  cargando: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#757575'
  },
  mensaje: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#757575',
    fontSize: 16
  },
  tarjetaAmigo: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  nombreAmigo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#2E4053'
  },
  userIdAmigo: {
    fontSize: 16,
    color: '#1E88E5',
    marginBottom: 5
  },
  fechaRegistro: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 15
  },
  botonAgregar: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  textoBotonAgregar: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default BuscarAmigos;