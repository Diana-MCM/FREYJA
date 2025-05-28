import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Button } from 'react-native';
import { getDatabase, ref, onValue, off, update, remove,set, push, get} from 'firebase/database';
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

    // 1. Eliminar la solicitud original
    await remove(ref(db, `usuarios/${user.uid}/solicitudes/${solicitud.id}`));

    // 2. Agregar solo en tu propio nodo de amigos
    const amistadParaUsuarioActual = {
      userId: solicitud.userId,
      nombre: solicitud.nombre,
      fechaAgregado: new Date().toISOString()
    };

    await set(ref(db, `usuarios/${user.uid}/amigos/${solicitud.userId}`), amistadParaUsuarioActual);

    // 3. Notificación para el amigo (esto sí está permitido)
    await set(ref(db, `usuarios/${solicitud.userId}/notificaciones/${Date.now()}`), {
      titulo: "Solicitud aceptada",
      mensaje: `Un usuario aceptó tu solicitud de amistad`,
      fecha: new Date().toISOString(),
      tipo: "amistad_aceptada",
      userIdOrigen: user.uid,
      leida: false
    });
    // 4. Solicitud inversa (evitar bucle y mostrar nombre correcto)
    const solicitudInversaRef = ref(db, `usuarios/${solicitud.userId}/solicitudes`);
    const snapshot = await get(solicitudInversaRef);
    let yaExiste = false;
    if (snapshot.exists()) {
     const solicitudes = snapshot.val();
    // Evita crear inversa si ya existe una solicitud de este usuario o si la solicitud original ya era inversa
     yaExiste = Object.values(solicitudes).some(s => s.userId === user.uid);
}
    if (!yaExiste && !solicitud.esInversa) {
     const userRef = ref(db, `usuarios/${user.uid}/nombre`);
     const userSnapshot = await get(userRef);
     const miNombre = userSnapshot.exists() ? userSnapshot.val() : (user.displayName || 'Usuario');
     const nuevaSolicitudId = push(ref(db, 'solicitudes')).key;
     await set(ref(db, `usuarios/${solicitud.userId}/solicitudes/${nuevaSolicitudId}`), {
      nombre: miNombre,
      userId: user.uid,
      fechaSolicitud: new Date().toISOString(),
      estado: "pendiente",
      esInversa: true // Marca esta solicitud como inversa
   });

  // Notificación para la solicitud inversa
  await set(ref(db, `usuarios/${solicitud.userId}/notificaciones/${Date.now() + 1}`), {
    titulo: "Nueva solicitud de amistad",
    mensaje: `${miNombre} te ha enviado una solicitud de amistad`,
    fecha: new Date().toISOString(),
    tipo: "solicitud_amistad",
    userIdOrigen: user.uid,
    leida: false,
    metadata: {
      action: "friendship_request",
      solicitudId: nuevaSolicitudId
    }
  });
}

    Alert.alert("¡Éxito!", "Solicitud de amistad aceptada");
  } catch (error) {
    console.error("Error al aceptar solicitud:", error);
    Alert.alert("Error", "No se pudo completar la operación");
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
    textAlign: 'center',
    marginTop: 20,
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