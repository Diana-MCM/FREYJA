import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { auth } from '../firebase/firebase';
import { getDatabase, ref, set, get } from 'firebase/database';
import Icon from 'react-native-vector-icons/MaterialIcons';

const db = getDatabase();
const GestionMedicamentos = ({ visible, onClose, onSave }) => {
  const [nombreMedicamento, setNombreMedicamento] = useState('');
  const [dosisMedicamento, setDosisMedicamento] = useState('');
  const [listaMedicamentos, setListaMedicamentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  useEffect(() => {
    const cargarMedicamentos = async () => {
      try {
        const user = auth.currentUser; 
        if (!user) return;
        const db = getDatabase();
        const snapshot = await get(ref(db, `usuarios/${user.uid}/medicamentos`));
        if (snapshot.exists()) {
          const medicamentosData = snapshot.val();
          const medicamentosArray = Object.keys(medicamentosData).map(key => ({
            id: key,
            ...medicamentosData[key]
          }));
          setListaMedicamentos(medicamentosArray);
        } else {
          setListaMedicamentos([]);
        }
      } catch (error) {
        console.error("Error al cargar medicamentos:", error);
        Alert.alert("Error", "No se pudieron cargar los medicamentos");
      } finally {
        setCargando(false);
      }
    };
    if (visible) {
      cargarMedicamentos();
    }
  }, [visible]);
  
  const agregarMedicamento = () => {
    if (nombreMedicamento.trim() === '' || dosisMedicamento.trim() === '') {
      Alert.alert("Error", "Por favor complete todos los campos");
      return;
    }
    const nuevoMedicamento = {id: Date.now().toString(), nombre: nombreMedicamento, dosis: dosisMedicamento, fecha: new Date().toISOString()};
    setListaMedicamentos([...listaMedicamentos, nuevoMedicamento]);
    setNombreMedicamento('');
    setDosisMedicamento('');
  };
  
  const guardarMedicamentos = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const db = getDatabase();
      const medicamentosObject = {};
      listaMedicamentos.forEach(med => {
        medicamentosObject[med.id] = {
          nombre: med.nombre,
          dosis: med.dosis,
          fecha: med.fecha
        };
      });
      
      await set(ref(db, `usuarios/${user.uid}/medicamentos`), medicamentosObject);
      onSave(listaMedicamentos);
      onClose();
      Alert.alert("Éxito", "Medicamentos guardados correctamente");
    } catch (error) {
      console.error("Error al guardar medicamentos:", error);
      Alert.alert("Error", "No se pudieron guardar los medicamentos");
    }
  };

  const eliminarMedicamento = (id) => {
    const nuevaLista = listaMedicamentos.filter(item => item.id !== id);
    setListaMedicamentos(nuevaLista);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Gestión de Medicamentos</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#B80000" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder="Nombre del medicamento"
              placeholderTextColor="#999" 
              value={nombreMedicamento}
              onChangeText={setNombreMedicamento}
            />
            <TextInput
              style={styles.input}
              placeholder="Dosis (ej: 500mg cada 8 horas)"
              placeholderTextColor="#999" 
              value={dosisMedicamento}
              onChangeText={setDosisMedicamento}
            />
            <TouchableOpacity 
              style={styles.botonAgregar}
              onPress={agregarMedicamento}
            >
              <Text style={styles.textoBotonAgregar}>
                <Icon name="add" size={20} color="white" /> Agregar
              </Text>
            </TouchableOpacity>
          </View>

          {cargando ? (
            <Text style={styles.cargandoTexto}>Cargando medicamentos...</Text>
          ) : listaMedicamentos.length === 0 ? (
            <Text style={styles.listaVaciaTexto}>No hay medicamentos registrados</Text>
          ) : (
            <ScrollView style={styles.listaContainer}>
              {listaMedicamentos.map((item) => (
                <View key={item.id} style={styles.itemMedicamento}>
                  <View style={styles.infoMedicamento}>
                    <Text style={styles.nombreMedicamento}>{item.nombre}</Text>
                    <Text style={styles.dosisMedicamento}>{item.dosis}</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => eliminarMedicamento(item.id)}
                  >
                    <Icon name="delete" size={20} color="#B80000" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.botonesFooter}>
            <TouchableOpacity 
              style={[styles.boton, styles.botonCancelar]}
              onPress={onClose}
            >
              <Text style={styles.textoBoton}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.boton, styles.botonGuardar]}
              onPress={guardarMedicamentos}
            >
              <Text style={styles.textoBoton}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#243573',
  },
  inputGroup: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  botonAgregar: {
    backgroundColor: '#6200EE',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  textoBotonAgregar: {
    color: 'white',
    fontWeight: 'bold',
  },
  listaContainer: {
    maxHeight: 200,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 5,
  },
  itemMedicamento: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  infoMedicamento: {
    flex: 1,
  },
  nombreMedicamento: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#243573',
  },
  dosisMedicamento: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  cargandoTexto: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  listaVaciaTexto: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
    fontStyle: 'italic',
  },
  botonesFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  boton: {
    borderRadius: 5,
    padding: 12,
    width: '48%',
    alignItems: 'center',
  },
  botonCancelar: {
    backgroundColor: '#B80000',
  },
  botonGuardar: {
    backgroundColor:'#0033CC',
  },
  textoBoton: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default GestionMedicamentos;