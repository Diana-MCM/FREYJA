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
      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión primero");
        return;
      }

      const db = getDatabase();
      const usersRef = ref(db, 'usuarios');
      const queryRef = query(usersRef, orderByChild('userId'), equalTo(userIdBusqueda));
      
      const snapshot = await get(queryRef);
      
      if (snapshot.exists()) {
        const datos = snapshot.val();
        const amigoData = Object.values(datos)[0];
        const amigoId = Object.keys(datos)[0];
        
        // Verificar si no es el propio usuario
        if (amigoId === user.uid) {
          Alert.alert("Oops", "¡Este es tu propio ID de usuario!");
          setAmigoEncontrado(null);
          return;
        }

        // Verificar si ya son amigos
        const amigosRef = ref(db, `usuarios/${user.uid}/amigos/${amigoId}`);
        const amigosSnapshot = await get(amigosRef);
        
        if (amigosSnapshot.exists()) {
          Alert.alert("Info", "Ya eres amigo de este usuario");
          setAmigoEncontrado(null);
          return;
        }

        // Verificar si ya existe una solicitud pendiente
        const solicitudesRef = ref(db, `usuarios/${amigoId}/solicitudes/${user.uid}`);
        const solicitudSnapshot = await get(solicitudesRef);
        
        if (solicitudSnapshot.exists()) {
          Alert.alert("Info", "Ya has enviado una solicitud a este usuario");
          setAmigoEncontrado(null);
          return;
        }

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

  const enviarSolicitud = async () => {
    if (!amigoEncontrado) return;

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión primero");
        return;
      }

      const db = getDatabase();
      
      // Obtener datos del usuario actual
      const userRef = ref(db, `usuarios/${user.uid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val();
      
      // Crear la solicitud en el amigo
      const updates = {};
      updates[`usuarios/${amigoEncontrado.id}/solicitudes/${user.uid}`] = {
        nombre: userData.nombre,
        userId: userData.userId,
        fechaSolicitud: new Date().toISOString()
      };

      await update(ref(db), updates);
      
      Alert.alert("¡Éxito!", `Solicitud enviada a ${amigoEncontrado.nombre}`);
      setAmigoEncontrado(null);
      setUserIdBusqueda('');
    } catch (error) {
      console.error("Error al enviar solicitud:", error);
      Alert.alert("Error", "No se pudo enviar la solicitud");
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
            style={styles.botonSolicitud}
            onPress={enviarSolicitud}
          >
            <Icon name="send" size={20} color="white" />
            <Text style={styles.textoBotonSolicitud}>Enviar Solicitud</Text>
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
    marginTop: 15,
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
  botonSolicitud: {
    flexDirection: 'row',
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  textoBotonSolicitud: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default BuscarAmigos;