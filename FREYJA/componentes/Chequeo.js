import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Button, Modal, TouchableOpacity } from 'react-native';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { app } from '../firebase/firebase';

const db = getDatabase(app);

const HistorialChequeos = ({ userId, setScreen }) => {
  const [chequeos, setChequeos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [encuestaSeleccionada, setEncuestaSeleccionada] = useState(null);

  useEffect(() => {
    const chequeosRef = ref(db, `usuarios/${userId}/chequeos`);

    const onDataChange = (snapshot) => {
      const chequeosData = [];
      
      snapshot.forEach((childSnapshot) => {
        chequeosData.push({
          id: childSnapshot.key,
          ...childSnapshot.val()
        });
      });

      setChequeos(chequeosData);
      setLoading(false);
    };

    const onError = (error) => {
      console.error("Error al cargar historial:", error);
      setLoading(false);
    };

    const unsubscribe = onValue(chequeosRef, onDataChange, onError);

    return () => off(chequeosRef, 'value', onDataChange);
  }, [userId]);

  const abrirModal = (chequeo) => {
    setEncuestaSeleccionada(chequeo);
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
        <Text style={styles.titulo}>Historial de Chequeos</Text>
        
        {chequeos.length === 0 ? (
          <Text style={styles.sinResultados}>No hay chequeos registrados</Text>
        ) : (
          chequeos.map(chequeo => (
            <TouchableOpacity 
              key={chequeo.id} 
              style={[
                styles.chequeoCard,
                { borderLeftColor: getColorByRisk(chequeo.nivelRiesgo) }
              ]}
              onPress={() => abrirModal(chequeo)}
            >
              <Text style={styles.fecha}>
                {new Date(chequeo.fecha).toLocaleDateString('es-MX', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              <View style={styles.detallesContainer}>
                <Text style={[
                  styles.nivelRiesgo, 
                  { color: getColorByRisk(chequeo.nivelRiesgo) }
                ]}>
                  {chequeo.nivelRiesgo}
                </Text>
                <Text style={styles.puntaje}>Puntaje: {chequeo.puntaje}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Button
        title="Volver al Inicio"
        onPress={() => setScreen('Inicio')}
        color="#757575"
      />

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
                <Text style={styles.modalTitulo}>Detalles de la Encuesta</Text>
                <Text style={styles.modalFecha}>
                  Fecha: {new Date(encuestaSeleccionada.fecha).toLocaleString()}
                </Text>
                
                <ScrollView style={styles.modalScroll}>
                  {Object.entries(encuestaSeleccionada.respuestas).map(([pregunta, respuesta]) => (
                    <View key={pregunta} style={styles.respuestaItem}>
                      <Text style={styles.preguntaTexto}>{obtenerTextoPregunta(pregunta)}</Text>
                      <Text style={styles.respuestaTexto}>{obtenerTextoRespuesta(pregunta, respuesta)}</Text>
                    </View>
                  ))}
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

// Funciones auxiliares para mostrar preguntas y respuestas
const obtenerTextoPregunta = (idPregunta) => {
  const preguntas = {
    actividadSexual: '1. ¿Has tenido actividad sexual en los últimos 6 meses?',
    parejasRecientes: '2. ¿Has tenido más de una pareja sexual en el último año?',
    proteccion: '3. ¿Utilizas protección (preservativo) en tus relaciones sexuales?',
    sintomas: '4. ¿Has experimentado alguno de estos síntomas recientemente? (Secreción inusual, dolor al orinar, llagas o verrugas genitales, picazón)',
    historialETS: '5. ¿Te han diagnosticado alguna ETS anteriormente?',
    chequeosPrevios: '6. ¿Cuándo fue tu último chequeo de ETS?'
  };
  return preguntas[idPregunta] || idPregunta;
};

const obtenerTextoRespuesta = (idPregunta, respuesta) => {
  const opciones = {
    actividadSexual: {
      si: 'Sí',
      no: 'No'
    },
    parejasRecientes: {
      si: 'Sí',
      no: 'No',
    },
    proteccion: {
      siempre: 'Siempre',
      a_veces: 'A veces',
      nunca: 'Nunca'
    },
    sintomas: {
      si: 'Sí',
      no: 'No',
    },
    historialETS: {
      si: 'Sí',
      no: 'No',
    },
    chequeosPrevios: {
      menos_6_meses: 'Hace menos de 6 meses',
      "6_a_12_meses": 'Hace 6 a 12 meses',
      mas_1_ano: 'Hace más de 1 año',
      nunca: 'Nunca me he hecho uno'
    }
  };
  
  return opciones[idPregunta]?.[respuesta] || respuesta;
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
    textAlign: 'center'
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
  }
});

export default HistorialChequeos;