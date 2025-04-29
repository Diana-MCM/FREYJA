import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Button } from 'react-native';
import { getDatabase, ref, onValue, off, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SolicitudesAmistad = ({ setScreen }) => {
  const [solicitudes, setSolicitudes] = useState([]);
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
    const solicitudesRef = ref(db, `usuarios/${user.uid}/solicitudes`);
  
    const unsubscribe = onValue(
      solicitudesRef,
      (snapshot) => {
        const solicitudesData = snapshot.val();
        if (solicitudesData) {
          const listaSolicitudes = Object.keys(solicitudesData).map((key) => ({
            id: key,
            ...solicitudesData[key],
          }));
          setSolicitudes(listaSolicitudes);
        } else {
          setSolicitudes([]);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error al cargar solicitudes:", error);
        Alert.alert("Error", "No se pudieron cargar las solicitudes");
        setLoading(false);
      }
    );
  
    return () => off(solicitudesRef);
  }, []);

  const aceptarSolicitud = async (solicitud) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión primero");
        return;
      }

      const db = getDatabase();
      
      // Actualizar la estructura de datos
      const updates = {};
      
      // Agregar como amigos mutuamente
      updates[`usuarios/${user.uid}/amigos/${solicitud.id}`] = {
        nombre: solicitud.nombre,
        userId: solicitud.id,
        fechaAmistad: new Date().toISOString()
      };
      
      updates[`usuarios/${solicitud.id}/amigos/${user.uid}`] = {
        nombre: user.displayName || 'Usuario',
        userId: user.uid,
        fechaAmistad: new Date().toISOString()
      };
      
      // Eliminar la solicitud
      updates[`usuarios/${user.uid}/solicitudes/${solicitud.id}`] = null;
      
      // Crear notificación de amistad aceptada
      const notificacionId = Date.now().toString();
      updates[`usuarios/${solicitud.id}/notificaciones/${notificacionId}`] = {
        titulo: "Solicitud de amistad aceptada",
        mensaje: `${user.displayName || 'Usuario'} ha aceptado tu solicitud de amistad.`,
        fecha: new Date().toISOString(),
        tipo: "amistad_aceptada",
        userIdOrigen: user.uid,
        leida: false,
      };
      
      await update(ref(db), updates);
      
      Alert.alert("¡Éxito!", `Ahora eres amigo de ${solicitud.nombre}`);
    } catch (error) {
      console.error("Error al aceptar solicitud:", error);
      Alert.alert("Error", "No se pudo aceptar la solicitud");
    }
  };

  const rechazarSolicitud = async (solicitudId, nombreRemitente) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión primero");
        return;
      }

      const db = getDatabase();
      
      // Eliminar la solicitud
      const updates = {};
      updates[`usuarios/${user.uid}/solicitudes/${solicitudId}`] = null;
      
      // Opcional: Notificar al remitente sobre el rechazo
      const notificacionId = Date.now().toString();
      updates[`usuarios/${solicitudId}/notificaciones/${notificacionId}`] = {
        titulo: "Solicitud de amistad rechazada",
        mensaje: `${user.displayName || 'Usuario'} ha rechazado tu solicitud de amistad.`,
        fecha: new Date().toISOString(),
        tipo: "amistad_rechazada",
        userIdOrigen: user.uid,
        leida: false,
      };
      
      await update(ref(db), updates);
      
      Alert.alert("Solicitud rechazada", `Has rechazado la solicitud de ${nombreRemitente}`);
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
      Alert.alert("Error", "No se pudo rechazar la solicitud");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.tarjetaSolicitud}>
      <View style={styles.infoSolicitud}>
        <Text style={styles.nombreSolicitud}>{item.nombre}</Text>
        <Text style={styles.userIdSolicitud}>ID: {item.userId}</Text>
        <Text style={styles.fechaSolicitud}>
          Solicitado: {new Date(item.fechaSolicitud).toLocaleDateString()}
        </Text>
      </View>
      
      <View style={styles.botonesAccion}>
        <TouchableOpacity 
          style={styles.botonAceptar}
          onPress={() => aceptarSolicitud(item)}
        >
          <Icon name="check" size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.botonRechazar}
          onPress={() => rechazarSolicitud(item.id, item.nombre)}
        >
          <Icon name="close" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Solicitudes de Amistad</Text>
      
      {loading ? (
        <Text style={styles.cargando}>Cargando solicitudes...</Text>
      ) : solicitudes.length === 0 ? (
        <View style={styles.sinSolicitudesContainer}>
          <Icon name="group" size={50} color="#757575" style={styles.iconoSinSolicitudes} />
          <Text style={styles.sinSolicitudes}>No tienes solicitudes pendientes</Text>
        </View>
      ) : (
        <FlatList
          data={solicitudes}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.lista}
        />
      )}

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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center'
  },
  cargando: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#757575'
  },
  sinSolicitudesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20
  },
  iconoSinSolicitudes: {
    marginBottom: 15
  },
  sinSolicitudes: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 16
  },
  lista: {
    paddingBottom: 20
  },
  tarjetaSolicitud: {
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
    elevation: 3
  },
  infoSolicitud: {
    flex: 1
  },
  nombreSolicitud: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#2E4053'
  },
  userIdSolicitud: {
    fontSize: 14,
    color: '#1E88E5',
    marginBottom: 3
  },
  fechaSolicitud: {
    fontSize: 12,
    color: '#757575'
  },
  botonesAccion: {
    flexDirection: 'row',
    gap: 10
  },
  botonAceptar: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  botonRechazar: {
    backgroundColor: '#F44336',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default SolicitudesAmistad;