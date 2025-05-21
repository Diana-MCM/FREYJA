import React from 'react';
import { View, Text, StyleSheet, Button,TouchableOpacity } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, onValue } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons';

const QRusuarios = ({ setScreen, nombreUsuario, params = {} }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  const [userId10digitos, setUserId10digitos] = React.useState(null);

  // Obtener el ID de 10 dígitos de la base de datos
  React.useEffect(() => {
    if (user) {
      const db = getDatabase();
      const userRef = ref(db, `usuarios/${user.uid}`);
      
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.userId) {
          setUserId10digitos(userData.userId);
        }
      });
    }
  }, [user]);

  // Datos que se codificarán en el QR
  const qrData = JSON.stringify({
    type: 'friend_request',
    userId: userId10digitos || user?.uid, // Usar el ID de 10 dígitos o el UID como fallback
    userName: params.userName || 'Usuario'
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Código de Amigo</Text>
      
      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={250}
          color='#6200EE'
          backgroundColor="white"
        />
      </View>
      
      <Text style={styles.infoText}>Comparte este código para recibir solicitudes de amistad</Text>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setScreen('Inicio')}
      >
        <MaterialIcons name="arrow-back" size={20} color="white" />
        <Text style={styles.backButtonText}>Volver al Inicio</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(171, 163, 247, 0.89)' 
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: 'white'
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 30
  },
  infoText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10
  },
  userIdText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200EE',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
});

export default QRusuarios;