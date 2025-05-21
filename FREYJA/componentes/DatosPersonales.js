import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { getDatabase, ref, set, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import imagenFondo from './imagenes/Freyjaa.png';
import { Ionicons } from '@expo/vector-icons'; // Asegúrate de tener instalado @expo/vector-icons

const RegistroDatos = ({ setScreen }) => {
  const [nombrecompleto, setNombrecompleto] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('');
  const [estatura, setEstatura] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const generos = [
    { id: '1', label: 'Hombre', value: 'hombre' },
    { id: '2', label: 'Mujer', value: 'mujer' },
    { id: '3', label: 'No binario', value: 'no_binario' },
    { id: '4', label: 'Prefiero no decir', value: 'no_especificado' },
    { id: '5', label: 'Otro', value: 'otro' },
  ];

  const handleSelectGenero = (item) => {
    setGenero(item.value);
    setModalVisible(false);
  };

  const guardarDatos = async () => {
    if (!nombrecompleto || !edad || !genero || !estatura) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        Alert.alert('Error', 'No hay usuario autenticado. Inicia sesión primero.');
        return;
      }

      const db = getDatabase();

      await set(ref(db, `usuarios/${user.uid}/datos_personales`), {
        nombrecompleto,
        edad,
        genero,
        estatura,
        fechaRegistro: new Date().toISOString(),
      });

      const snapshot = await get(ref(db, `usuarios/${user.uid}/datos_personales`));

      if (snapshot.exists()) {
        Alert.alert('Éxito', 'Tus datos se guardaron correctamente', [
          { text: 'OK', onPress: () => setScreen('Inicio') },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los datos');
      console.error('Error al guardar:', error);
    }
  };

  const renderGeneroItem = ({ item }) => (
    <TouchableOpacity
      style={styles.optionItem}
      onPress={() => handleSelectGenero(item)}
    >
      <Text style={styles.optionText}>{item.label}</Text>
      {genero === item.value && (
        <Ionicons name="checkmark" size={20} color="#6200EE" />
      )}
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={imagenFondo}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
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

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setModalVisible(true)}
          >
            <Text style={genero ? styles.selectorText : styles.selectorPlaceholder}>
              {genero ? generos.find(g => g.value === genero)?.label : 'Selecciona tu género'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Estatura (cm)"
          keyboardType="numeric"
          value={estatura}
          onChangeText={setEstatura}
        />

        <TouchableOpacity onPress={guardarDatos} style={styles.boton}>
          <Text style={styles.textoBoton}>Guardar Datos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setScreen('RegistroDeUsuario')}
          style={[styles.boton, styles.botonCancelar]}
        >
          <Text style={styles.textoBoton}>Cancelar</Text>
        </TouchableOpacity>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecciona tu género</Text>
              <FlatList
                data={generos}
                renderItem={renderGeneroItem}
                keyExtractor={item => item.id}
              />
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(171, 163, 247, 0.73)',
    borderRadius: 10,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2E4053',
    textAlign: 'center',
  },
  input: {
    height: 60,
    borderColor: '#9DBEBB',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#2E4053',
    fontWeight: '500',
  },
  selector: {
    height: 60,
    borderColor: '#9DBEBB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    color: '#2E4053',
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  boton: {
    backgroundColor: '#6200EE',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  botonCancelar: {
    backgroundColor: '#757575',
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#6200EE',
  },
  optionItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#6200EE',
    borderRadius: 5,
    alignItems: 'center',
  },
  modalCloseText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default RegistroDatos;