import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet, TouchableOpacity, PermissionsAndroid, Modal, Platform } from 'react-native';
import { getDatabase, ref, query, orderByChild, equalTo, get, update, push, set  } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Camera from 'expo-camera';



const BuscarAmigos = ({ setScreen }) => {
  const [userIdBusqueda, setUserIdBusqueda] = useState('');
  const [amigoEncontrado, setAmigoEncontrado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión primero");
      return false;
   }
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const buscarAmigo = async (userId) => {
    if (!userId || userId.length !== 10 || !/^\d+$/.test(userId)) {
      Alert.alert("Error", "ID de usuario inválido. Debe tener 10 dígitos numéricos");
      return false;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión primero");
        return false;
      }

      const db = getDatabase();
      const usersRef = ref(db, 'usuarios');
      const queryRef = query(usersRef, orderByChild('userId'), equalTo(userId));
      const snapshot = await get(queryRef);

      if (snapshot.exists()) {
        const datos = snapshot.val();
        const amigoData = Object.values(datos)[0];
        const amigoId = Object.keys(datos)[0];

        if (amigoId === user.uid) {
          Alert.alert("Oops", "¡Este es tu propio ID de usuario!");
          return false;
        }

        const amigosRef = ref(db, `usuarios/${user.uid}/amigos/${amigoId}`);
        const amigosSnapshot = await get(amigosRef);
        if (amigosSnapshot.exists()) {
          Alert.alert("Info", "Ya eres amigo de este usuario");
          return false;
        }

        const solicitudesRef = ref(db, `usuarios/${amigoId}/solicitudes/${user.uid}`);
        const solicitudSnapshot = await get(solicitudesRef);
        if (solicitudSnapshot.exists()) {
          Alert.alert("Info", "Ya has enviado una solicitud a este usuario");
          return false;
        }

        setAmigoEncontrado({
          id: amigoId,
          nombre: amigoData.nombre,
          userId: amigoData.userId,
          fechaRegistro: amigoData.fechaRegistro
        });
        setMensaje('');
        return true;
      } else {
        setMensaje("No se encontró ningún usuario con ese ID");
        return false;
      }
    } catch (error) {
      console.error("Error en búsqueda:", error);
      Alert.alert("Error", "No se pudo completar la búsqueda");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleBuscarPorId = async () => {
    await buscarAmigo(userIdBusqueda);
  };

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    try {
      const scannedData = JSON.parse(data);
      setShowQRScanner(false);
      if (scannedData.type === 'friend_request' && scannedData.userId) {
        const success = await buscarAmigo(scannedData.userId);
        if (success) {
          Alert.alert("Usuario encontrado", `Se encontró a ${scannedData.userName || 'el usuario'}`);
        }
      } else {
        Alert.alert("Error", "El código QR no contiene información válida de amistad");
      }
    } catch (error) {
      console.error("Error al procesar QR:", error);
      Alert.alert("Error", "No se pudo leer el código QR");
    } finally {
      setScanned(false);
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
    const solicitudId = push(ref(db, 'solicitudes')).key;
    
    const userRef = ref(db, `usuarios/${user.uid}/nombre`);
const userSnapshot = await get(userRef);
const miNombre = userSnapshot.exists() ? userSnapshot.val() : 'Usuario';

const solicitudData = {
  nombre: miNombre,
  userId: user.uid,
  fechaSolicitud: new Date().toISOString(),
  estado: "pendiente"
};

const notificacionData = {
  titulo: "Nueva solicitud de amistad",
  mensaje: `${miNombre} te ha enviado una solicitud de amistad`,
  fecha: new Date().toISOString(),
  tipo: "solicitud_amistad",
  userIdOrigen: user.uid,
  leida: false,
  metadata: {
    action: "friendship_request",
    solicitudId: solicitudId
  }
};

    // Preparamos todas las actualizaciones
    const updates = {};
    
    // 1. Añadir solicitud al receptor
    updates[`usuarios/${amigoEncontrado.id}/solicitudes/${solicitudId}`] = solicitudData;
    
    // 2. Añadir notificación al receptor
    updates[`usuarios/${amigoEncontrado.id}/notificaciones/${Date.now()}`] = notificacionData;
    
    // Ejecutamos todas las actualizaciones atómicamente
    await update(ref(db), updates);

    Alert.alert("¡Éxito!", `Solicitud enviada a ${amigoEncontrado.nombre}`);
    setAmigoEncontrado(null);
    setUserIdBusqueda('');
  } catch (error) {
    console.error("Error al enviar solicitud:", error);
    Alert.alert("Error", "No se pudo enviar la solicitud. Verifica tu conexión.");
  }
};

  return (
    
    <View style={styles.container}>
      <Text style={styles.titulo}>Buscar Amigos</Text>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, !showQRScanner && styles.activeTab]}
          onPress={() => setShowQRScanner(false)}
        >
          <Text style={[styles.tabText, !showQRScanner && styles.activeTabText]}>Por ID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, showQRScanner && styles.activeTab]}
          onPress={() => setShowQRScanner(true)}
        >
          <Text style={[styles.tabText, showQRScanner && styles.activeTabText]}>Escanear QR</Text>
        </TouchableOpacity>
      </View>

      {showQRScanner && (
        <Modal
          animationType="slide"
          transparent={false}
          visible={showQRScanner}
          onRequestClose={() => setShowQRScanner(false)}
        >
          <View style={styles.qrScannerContainer}>
            {hasPermission ? (
              <Camera
                style={styles.camera}
                onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
                barCodeScannerSettings={{
                barCodeTypes: ['qr'],
                 }}
              >

                <View style={styles.overlay}>
                  <View style={styles.border} />
                  <Text style={styles.scanText}>Escanea un código QR de amigo</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowQRScanner(false)}
                >
                  <Icon name="close" size={30} color="white" />
                </TouchableOpacity>
              </Camera>
            ) : (
              <View style={styles.permissionDenied}>
                <Text style={styles.permissionText}>Permiso de cámara no concedido</Text>
                <Button title="Cerrar" onPress={() => setShowQRScanner(false)} />
              </View>
            )}
          </View>
        </Modal>
      )}

      {!showQRScanner && (
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
            onPress={handleBuscarPorId}
            color="#6200EE"
            disabled={loading}
          />
        </View>
      )}

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
          <TouchableOpacity style={styles.botonSolicitud} onPress={enviarSolicitud}>
            <Icon name="send" size={20} color="white" />
            <Text style={styles.textoBotonSolicitud}>Enviar Solicitud</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Button title="Volver al Inicio" onPress={() => setScreen('Inicio')} color="#757575" />
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
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0'
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: '#6200EE'
  },
  tabText: {
    color: '#757575',
    fontWeight: 'bold'
  },
  activeTabText: {
    color: 'white'
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
  },
  qrScannerContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'black'
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  border: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent',
    borderRadius: 10
  },
  scanText: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10
  },
  permissionDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black'
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20
  }

});

export default BuscarAmigos;