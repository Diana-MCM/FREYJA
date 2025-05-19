import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Modal, ScrollView, Button } from 'react-native';
import { getDatabase, ref, onValue, off } from 'firebase/database';

const Chequeoamigos = ({ route, setScreen }) => {
  const { amigoId, nombreAmigo } = route.params || {};
  const [chequeos, setChequeos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Para el modal de detalle
  const [modalVisible, setModalVisible] = useState(false);
  const [chequeoSeleccionado, setChequeoSeleccionado] = useState(null);

  useEffect(() => {
    if (!amigoId) {
      setLoading(false);
      return;
    }
    const db = getDatabase();
    const rutas = [
      { nombre: 'Chequeo de ETS', path: `usuarios/${amigoId}/chequeos` },
      { nombre: 'Historial de ETS', path: `usuarios/${amigoId}/historialITS` },
      { nombre: 'Preferencias Íntimas', path: `usuarios/${amigoId}/consentimiento` },
      { nombre: 'Intereses Sexuales', path: `usuarios/${amigoId}/interesesSexuales` },
      { nombre: 'Preferencias BDSM', path: `usuarios/${amigoId}/preferenciasBDSM` }
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
        setChequeos([...allResults]);
        setLoading(false);
      });
      return { refRuta, listener };
    });

    return () => {
      isMounted = false;
      listeners.forEach(({ refRuta, listener }) => off(refRuta, 'value', listener));
    };
  }, [amigoId]);

  // Función para obtener color según riesgo (solo para Chequeo de ETS)
  const getColorByRisk = (nivel) => {
    switch((nivel || '').toUpperCase()) {
      case 'ALTO': return '#e74c3c';
      case 'MODERADO': return '#f39c12';
      default: return '#27ae60';
    }
  };

  // Función para obtener color del borde según tipo de encuesta
  const getBorderColor = (tipo, nivelRiesgo) => {
    // Para Chequeo de ETS, usamos los colores de riesgo
    if (tipo === 'Chequeo de ETS') {
      return getColorByRisk(nivelRiesgo);
    }
    
    // Asignamos colores fijos para los otros tipos
    const coloresPorTipo = {
      'Historial de ETS': '#3498db', // Morado
      'Preferencias Íntimas': '#8A2BE2', // Azul
      'Intereses Sexuales': '#4B0082', // Naranja
      'Preferencias BDSM': '#dkf402'  // Verde turquesa
    };
    
    return coloresPorTipo[tipo] || '#95a5a6'; // Gris por defecto
  };

  // Funciones auxiliares para mostrar preguntas y respuestas
  const obtenerTextoPregunta = (idPregunta) => {
    const preguntas = {
      actividadSexual: '1. ¿Has tenido actividad sexual en los últimos 6 meses?',
      parejasRecientes: '2. ¿Has tenido más de una pareja sexual en el último año?',
      proteccion: '3. ¿Utilizas protección (preservativo) en tus relaciones sexuales?',
      sintomas: '4. ¿Has experimentado alguno de estos síntomas recientemente? (Secreción inusual, dolor al orinar, llagas o verrugas genitales, picazón)',
      historialETS: '5. ¿Te han diagnosticado alguna ETS anteriormente?',
      chequeosPrevios: '6. ¿Cuándo fue tu último chequeo de ETS?',
      // Preguntas BDSM
      rolIdentificacion: 'Rol con el que te identificas:',
      practicasInteres: 'Prácticas de interés:',
      limiteAbsoluto: 'Límites absolutos:',
      conocimientoSSC: 'Conocimiento de SSC/RACK:',
      elementosImportantes: 'Elementos importantes en una escena BDSM:',
      necesidadAftercare: 'Necesidad de aftercare:',
      participacionComunidades: 'Participación en comunidades BDSM:'
    };
    return preguntas[idPregunta] || idPregunta;
  };

  const obtenerTextoRespuesta = (idPregunta, respuesta) => {
    const opciones = {
      actividadSexual: { si: 'Sí', no: 'No' },
      parejasRecientes: { si: 'Sí', no: 'No' },
      proteccion: { siempre: 'Siempre', a_veces: 'A veces', nunca: 'Nunca' },
      sintomas: { si: 'Sí', no: 'No' },
      historialETS: { si: 'Sí', no: 'No' },
      chequeosPrevios: {
        menos_6_meses: 'Hace menos de 6 meses',
        "6_a_12_meses": 'Hace 6 a 12 meses',
        mas_1_ano: 'Hace más de 1 año',
        nunca: 'Nunca me he hecho uno'
      },
      // Opciones BDSM
      rolIdentificacion: {
        dominante: 'Dominante/Domme',
        sumiso: 'Sumiso/a',
        switch: 'Switch (ambos roles)',
        curioso: 'Curioso/a (explorando)'
      },
      conocimientoSSC: {
        si_aplico: 'Sí, los aplico siempre.',
        he_oido: 'He oído hablar, pero necesito aprender más.',
        no_conozco: 'No los conozco.'
      },
      necesidadAftercare: {
        si: 'Sí (ej: abrazos, hablar, hidratación).',
        no_siempre: 'No siempre.',
        no_seguro: 'No estoy seguro/a.'
      },
      participacionComunidades: {
        si_activamente: 'Sí, activamente.',
        solo_online: 'Solo en línea.',
        no_pero_interes: 'No, pero me interesa.'
      }
    };

    // Manejar arrays (como practicasInteres)
    if (Array.isArray(respuesta)) {
      if (idPregunta === 'practicasInteres') {
        const practicas = {
          amarres: 'Amarres (shibari, cuerdas)',
          juego_poder: 'Juego de poder (humillación leve, órdenes)',
          impacto: 'Impacto (azotes, palmas, fustas)',
          sensacion: 'Sensación (cera caliente, hielo, texturas)',
          roleplay: 'Roleplay (juegos de roles: profesor/alumno, etc.)',
          otro: 'Otra práctica'
        };
        return respuesta.map(p => practicas[p] || p).join(', ');
      }
      return respuesta.join(', ');
    }

    return opciones[idPregunta]?.[respuesta] || respuesta;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.chequeoCard,
        { borderLeftColor: getBorderColor(item.tipo, item.nivelRiesgo) }
      ]}
      onPress={() => { setChequeoSeleccionado(item); setModalVisible(true); }}
    >
      <Text style={styles.fecha}>
        {item.fecha ? new Date(item.fecha).toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : 'Sin fecha'}
      </Text>
      <View style={styles.detallesContainer}>
        <Text style={[styles.nivelRiesgo, { color: getBorderColor(item.tipo, item.nivelRiesgo) }]}>
          {item.tipo}
        </Text>
        {/* Mostrar puntaje y nivel de riesgo solo para Chequeo de ETS */}
        {item.tipo === 'Chequeo de ETS' && item.puntaje && (
          <Text style={styles.puntaje}>Puntaje: {item.puntaje} ({item.nivelRiesgo})</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderRespuestas = (respuestas) => {
    if (!respuestas) return null;

    // Caso especial para BDSM que tiene estructura diferente
    if (respuestas.respuestas) {
      return Object.entries(respuestas.respuestas).map(([pregunta, respuesta]) => (
        <View key={pregunta} style={styles.respuestaItem}>
          <Text style={styles.preguntaTexto}>{obtenerTextoPregunta(pregunta)}</Text>
          <Text style={styles.respuestaTexto}>{obtenerTextoRespuesta(pregunta, respuesta)}</Text>
        </View>
      ));
    }

    // Para otros tipos de cuestionarios
    return Object.entries(respuestas).map(([pregunta, respuesta]) => (
      <View key={pregunta} style={styles.respuestaItem}>
        <Text style={styles.preguntaTexto}>{obtenerTextoPregunta(pregunta)}</Text>
        <Text style={styles.respuestaTexto}>{obtenerTextoRespuesta(pregunta, respuesta)}</Text>
      </View>
    ));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          <Text style={styles.titulo}>Chequeos de {nombreAmigo}</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#6200EE" />
            </View>
          ) : chequeos.length === 0 ? (
            <Text style={styles.sinResultados}>No hay chequeos registrados</Text>
          ) : (
            chequeos.map(item => renderItem({ item }))
          )}
        </ScrollView>
        <Button
          title="Volver"
          onPress={() => setScreen('ListaAmigos')}
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
              {chequeoSeleccionado && (
                <>
                  <Text style={styles.modalTitulo}>{chequeoSeleccionado.tipo}</Text>
                  <Text style={styles.modalFecha}>
                    Fecha: {chequeoSeleccionado.fecha ? new Date(chequeoSeleccionado.fecha).toLocaleString() : 'Sin fecha'}
                  </Text>
                  <ScrollView style={styles.modalScroll}>
                    {renderRespuestas(chequeoSeleccionado.respuestas || chequeoSeleccionado)}
                    {/* Mostrar nivel de riesgo solo para Chequeo de ETS */}
                    {chequeoSeleccionado.tipo === 'Chequeo de ETS' && chequeoSeleccionado.nivelRiesgo && (
                      <View style={styles.respuestaItem}>
                        <Text style={styles.preguntaTexto}>Nivel de riesgo:</Text>
                        <Text style={[styles.respuestaTexto, { color: getColorByRisk(chequeoSeleccionado.nivelRiesgo) }]}>
                          {chequeoSeleccionado.nivelRiesgo}
                        </Text>
                      </View>
                    )}
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
    </SafeAreaView>
  );
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

export default Chequeoamigos;