import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';

const QRusuarios = ({ setScreen, nombreUsuario, params = {} }) => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  // Datos que se codificarán en el QR
  const qrData = JSON.stringify({
    type: 'friend_request',
    userId: user.uid,
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#A89CC8'
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
    marginBottom: 30
  }
});

export default QRusuarios;