// SugerenciasScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { getDatabase, ref, push } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { app } from '../firebase/firebase';

const SugerenciasScreen = ({ setScreen }) => {
  const [tipo, setTipo] = useState('duda');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  
  const auth = getAuth();
  const user = auth.currentUser;
  const db = getDatabase(app);

  const enviarSugerencia = async () => {
    if (!mensaje.trim()) {
      Alert.alert('Error', 'Por favor escribe tu mensaje');
      return;
    }

    setLoading(true);
    
    try {
      await push(ref(db, 'dudas'), {
        usuarioId: user.uid,
        email: user.email,
        nombre: user.displayName || 'Anónimo',
        tipo,
        mensaje,
        fecha: new Date().toISOString(),
        estado: 'pendiente'
      });
      
      Alert.alert('Éxito', 'Tu mensaje ha sido enviado. Te responderemos pronto.');
      setMensaje('');
    } catch (error) {
      console.error('Error al enviar:', error);
      Alert.alert('Error', 'No se pudo enviar tu mensaje. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sugerencias, Quejas o Dudas</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tipo de mensaje:</Text>
        <View style={styles.radioGroup}>
          <Button 
            title="Duda" 
            onPress={() => setTipo('duda')} 
            color={tipo === 'duda' ? '#6200EE' : '#757575'}
          />
          <Button 
            title="Sugerencia" 
            onPress={() => setTipo('sugerencia')} 
            color={tipo === 'sugerencia' ? '#6200EE' : '#757575'}
          />
          <Button 
            title="Queja" 
            onPress={() => setTipo('queja')} 
            color={tipo === 'queja' ? '#6200EE' : '#757575'}
          />
        </View>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tu mensaje:</Text>
        <TextInput
          style={styles.input}
          multiline
          numberOfLines={4}
          placeholder="Describe tu duda, sugerencia o queja..."
          value={mensaje}
          onChangeText={setMensaje}
        />
      </View>
      
      <Button
        title="Enviar"
        onPress={enviarSugerencia}
        disabled={loading}
        color="#6200EE"
      />
      
      <Button
        title="Volver"
        onPress={() => setScreen('Inicio')}
        color="#757575"
        style={styles.backButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c3e50',
    paddingTop: 20
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#34495e'
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  backButton: {
    marginTop: 20
  }
});

export default SugerenciasScreen;