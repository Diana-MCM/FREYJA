import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Notificaciones = ({ setScreen }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión primero");
      setLoading(false);
      return;
    }

    const db = getDatabase();
    const notificacionesRef = ref(db, `usuarios/${user.uid}/notificaciones`);

    const unsubscribe = onValue(notificacionesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const listaNotificaciones = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setNotificaciones(listaNotificaciones);
      } else {
        setNotificaciones([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const eliminarNotificacion = async (id) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión primero");
        return;
      }

      const db = getDatabase();
      const notificacionRef = ref(db, `usuarios/${user.uid}/notificaciones/${id}`);
      await remove(notificacionRef);

      Alert.alert("Éxito", "Notificación eliminada");
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
      Alert.alert("Error", "No se pudo eliminar la notificación");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.notificacion}>
      <View style={styles.infoNotificacion}>
        <Text style={styles.titulo}>{item.titulo}</Text>
        <Text style={styles.mensaje}>{item.mensaje}</Text>
        <Text style={styles.fecha}>{new Date(item.fecha).toLocaleString()}</Text>
      </View>
      <TouchableOpacity
        style={styles.botonEliminar}
        onPress={() => eliminarNotificacion(item.id)}
      >
        <Icon name="delete" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.tituloPantalla}>Bandeja de Entrada</Text>

      {loading ? (
        <Text style={styles.cargando}>Cargando notificaciones...</Text>
      ) : notificaciones.length === 0 ? (
        <Text style={styles.sinNotificaciones}>No tienes notificaciones</Text>
      ) : (
        <FlatList
          data={notificaciones}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
        />
      )}

      <TouchableOpacity
        style={styles.botonVolver}
        onPress={() => setScreen('Inicio')}
      >
        <Text style={styles.textoBotonVolver}>Volver al Inicio</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  tituloPantalla: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    color: '#333',
    textAlign: 'center',
  },
  cargando: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#757575',
  },
  sinNotificaciones: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#757575',
    fontSize: 16,
  },
  lista: {
    paddingBottom: 20,
  },
  notificacion: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoNotificacion: {
    flex: 1,
  },
  titulo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#2E4053',
  },
  mensaje: {
    fontSize: 14,
    color: '#555',
    marginBottom: 3,
  },
  fecha: {
    fontSize: 12,
    color: '#757575',
  },
  botonEliminar: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonVolver: {
    marginTop: 20,
    backgroundColor: '#A89CC8',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  textoBotonVolver: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Notificaciones;