import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Button, Modal, TouchableOpacity } from 'react-native';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { app } from '../firebase/firebase';
import { MaterialIcons } from '@expo/vector-icons';

const db = getDatabase(app);

const HistorialChequeos = ({ userId, setScreen }) => {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);

  useEffect(() => {
    const rutas = [
      { nombre: 'Chequeo de ETS', path: `usuarios/${userId}/chequeos` },
      { nombre: 'Historial de ETS', path: `usuarios/${userId}/historialITS` },
      { nombre: 'Preferencias Íntimas', path: `usuarios/${userId}/consentimiento` },
      { nombre: 'Intereses Sexuales', path: `usuarios/${userId}/interesesSexuales` },
      { nombre: 'Preferencias BDSM', path: `usuarios/${userId}/preferenciasBDSM` }
    ];

    let isMounted = true;
    let allResults = [];

    setLoading(true);

    const listeners = rutas.map(({ nombre, path }) => {
      const refRuta = ref(db, path);
      const listener = onValue(refRuta, (snapshot) => {
        if (!isMounted) return;
        let data = [];
        snapshot.forEach((child) => {
          data.push({
            id: child.key,
            ...child.val(),
            tipo: nombre
          });
        });
        // Elimina resultados anteriores de este tipo y agrega los nuevos
        allResults = allResults.filter(r => r.tipo !== nombre).concat(data);
        setResultados([...allResults]);
        setLoading(false);
      });
      return { refRuta, listener };
    });

    return () => {
      isMounted = false;
      listeners.forEach(({ refRuta, listener }) => off(refRuta, 'value', listener));
    };
  }, [userId]);

  const abrirModal = (encuesta) => {
    setEncuestaSeleccionada(encuesta);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.titulo}>Historial de Cuestionarios</Text>
        {resultados.length === 0 ? (
          <Text style={styles.sinResultados}>No hay cuestionarios registrados</Text>
        ) : (
          resultados
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) // Más recientes primero
            .map((encuesta) => (
              <TouchableOpacity
                key={encuesta.id}
                style={[
                  styles.chequeoCard,
                  encuesta.tipo === 'Chequeo de ETS'
                    ? { borderLeftColor: getColorByRisk(encuesta.nivelRiesgo) }
                    : { borderLeftColor: getColorByTipo(encuesta.tipo) }
                ]}
                onPress={() => abrirModal(encuesta)}
              >
                <Text style={styles.fecha}>
                  {encuesta.fecha
                    ? new Date(encuesta.fecha).toLocaleDateString('es-MX', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                    : 'Sin fecha'}
                </Text>
                <View style={styles.detallesContainer}>
                  <Text
                    style={[
                      styles.nivelRiesgo,
                      encuesta.tipo === 'Chequeo de ETS'
                        ? { color: getColorByRisk(encuesta.nivelRiesgo) }
                        : { color: getColorByTipo(encuesta.tipo) }
                    ]}
                  >
                    {encuesta.tipo}
                  </Text>
                  {/* Mostrar nivel de riesgo solo para Chequeo de ETS */}
                  {encuesta.tipo === 'Chequeo de ETS' && encuesta.nivelRiesgo && (
                    <Text style={{
                      color: getColorByRisk(encuesta.nivelRiesgo),
                      fontWeight: 'bold',
                      marginLeft: 10
                    }}>
                      Riesgo: {encuesta.nivelRiesgo}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
        )}
      </ScrollView>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setScreen('Inicio')}
      >
        <MaterialIcons name="arrow-back" size={20} color="white" />
        <Text style={styles.backButtonText}>Volver al Inicio</Text>
      </TouchableOpacity>

      {/* Modal para mostrar detalles */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {encuestaSeleccionada && (
              <>
                <Text style={styles.modalTitulo}>Detalles de {encuestaSeleccionada.tipo}</Text>
                <Text style={styles.modalFecha}>
                  Fecha: {encuestaSeleccionada.fecha ? new Date(encuestaSeleccionada.fecha).toLocaleString() : 'Sin fecha'}
                </Text>
                {/* Banner de riesgo solo para Chequeo de ETS */}
                {encuestaSeleccionada.tipo === 'Chequeo de ETS' && encuestaSeleccionada.nivelRiesgo && (
                  <View style={[
                    styles.riesgoBanner,
                    { borderColor: getColorByRisk(encuestaSeleccionada.nivelRiesgo) }
                  ]}>
                    <Text style={[
                      styles.riesgoBannerText,
                      { color: getColorByRisk(encuestaSeleccionada.nivelRiesgo) }
                    ]}>
                      Riesgo: {encuestaSeleccionada.nivelRiesgo}
                    </Text>
                  </View>
                )}
                <ScrollView style={styles.modalScroll}>
                  {/* Aquí puedes mostrar las respuestas según el tipo */}
                  {encuestaSeleccionada.respuestas
                    ? Object.entries(encuestaSeleccionada.respuestas).map(([pregunta, respuesta]) => (
                        <View key={pregunta} style={styles.respuestaItem}>
                          <Text style={styles.preguntaTexto}>{pregunta}</Text>
                          <Text style={styles.respuestaTexto}>{JSON.stringify(respuesta)}</Text>
                        </View>
                      ))
                    : <Text>No hay respuestas registradas.</Text>
                  }
                </ScrollView>
                <View style={styles.modalFooter}>
                  <Button
                    title="Cerrar"
                    onPress={() => setModalVisible(false)}
                    color="#6200EE"
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Puedes personalizar los colores por tipo de cuestionario
const getColorByTipo = (tipo) => {
  switch (tipo) {
    case 'Chequeo de ETS': return '#27ae60';
    case 'Historial de ETS': return '#3498db';
    case 'Preferencias Íntimas': return '#8A2BE2';
    case 'Intereses Sexuales': return '#4B0082';
    case 'Preferencias BDSM': return '#dkf402';
    default: return '#757575';
  }
};

const getColorByRisk = (nivel) => {
  switch(nivel) {
    case 'ALTO': return '#e74c3c';
    case 'MODERADO': return '#f39c12';
    default: return '#27ae60';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
    textAlign: 'center',
    marginTop: 20
  },
  sinResultados: {
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: 20
  },
  chequeoCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2
  },
  fecha: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#34495e'
  },
  detallesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  nivelRiesgo: {
    fontWeight: 'bold',
    fontSize: 16
  },
  puntaje: {
    color: '#7f8c8d'
  },
  // Estilos del modal
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%'
  },
  modalTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2c3e50',
    textAlign: 'center'
  },
  modalFecha: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 15,
    textAlign: 'center'
  },
  riesgoBanner: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center'
  },
  riesgoBannerText: {
    fontWeight: 'bold',
    fontSize: 18
  },
  modalScroll: {
    maxHeight: '70%',
    marginBottom: 15
  },
  respuestaItem: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  },
  preguntaTexto: {
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5
  },
  respuestaTexto: {
    color: '#3498db'
  },
  modalFooter: {
    marginTop: 10
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200EE',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  }
});

export default HistorialChequeos;