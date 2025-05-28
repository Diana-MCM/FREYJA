import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { RadioButton, Checkbox, Button } from 'react-native-paper';
import { getDatabase, ref, push, set } from 'firebase/database';

const EncuestaHistorialITS = ({ setScreen, userId }) => {
  const [respuestas, setRespuestas] = useState({
    diagnosticoPrevios: null,
    itsDiagnosticadas: [],
    otraITS: '',
    tratamientoCompletado: null,
  });

  const [pasoActual, setPasoActual] = useState(1);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [loading, setLoading] = useState(false);

  const preguntas = [
    {
      id: 'diagnosticoPrevios',
      pregunta: '1. ¿Alguna vez te han diagnosticado una ITS?',
      opciones: [
        { value: 'una_vez', label: 'Sí, una vez' },
        { value: 'multiples', label: 'Sí, múltiples veces' },
        { value: 'no', label: 'No' },
        { value: 'no_contestar', label: 'Prefiero no responder' }
      ]
    },
    {
      id: 'itsDiagnosticadas',
      pregunta: '2. Si respondiste "Sí", ¿cuál(es)? (Marca las que apliquen)',
      opciones: [
        { value: 'clamidia', label: 'Clamidia' },
        { value: 'gonorrea', label: 'Gonorrea' },
        { value: 'vih', label: 'VIH' },
        { value: 'vph', label: 'VPH (virus del papiloma humano)' },
        { value: 'otra', label: 'Otra' }
      ],
      condicional: ['una_vez', 'multiples']
    },
    {
      id: 'tratamientoCompletado',
      pregunta: '3. ¿Completaste el tratamiento prescrito?',
      opciones: [
        { value: 'completo', label: 'Sí, totalmente' },
        { value: 'parcial', label: 'Solo parcialmente' },
        { value: 'no_iniciado', label: 'No lo inicié' },
        { value: 'no_aplica', label: 'No aplica' }
      ],
      condicional: ['una_vez', 'multiples']
    }
  ];

  const guardarEncuestaEnFirebase = async () => {
    try {
      setLoading(true);

      if (!userId) {
        Alert.alert('Error', 'No se encontró el usuario. Por favor, inicia sesión de nuevo.');
        setLoading(false);
        return;
      }

      const encuestaData = {
        userId,
        respuestas,
        fecha: new Date().toISOString(),
      };

      const db = getDatabase();
      const newEncuestaRef = push(ref(db, `usuarios/${userId}/historialITS`));
      await set(newEncuestaRef, encuestaData);

      console.log('Encuesta de historial ITS guardada en Firebase');
    } catch (error) {
      console.error('Error al guardar la encuesta:', error);
      Alert.alert('Error', 'No se pudo guardar la encuesta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (pregunta, value) => {
    setRespuestas({
      ...respuestas,
      [pregunta]: value
    });
  };

  const handleCheckboxChange = (value) => {
    const current = respuestas.itsDiagnosticadas;
    const newValue = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    
    setRespuestas({
      ...respuestas,
      itsDiagnosticadas: newValue
    });
  };

  const siguientePaso = () => {
    const preguntaActual = preguntas[pasoActual - 1];
    
    // Verificar si la pregunta es condicional y no aplica
    if (preguntaActual.condicional && 
        !preguntaActual.condicional.includes(respuestas.diagnosticoPrevios)) {
      setPasoActual(pasoActual + 1);
      return;
    }
    
    if (!respuestas[preguntaActual.id] || 
        (preguntaActual.id === 'itsDiagnosticadas' && respuestas.itsDiagnosticadas.length === 0)) {
      Alert.alert('Por favor responde esta pregunta antes de continuar');
      return;
    }
    
    if (pasoActual < preguntas.length) {
      setPasoActual(pasoActual + 1);
    }
  };

  const pasoAnterior = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };

  const handleSubmit = async () => {
    await guardarEncuestaEnFirebase();
    setMostrarResultado(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Guardando tus respuestas...</Text>
      </View>
    );
  }

  if (mostrarResultado) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.titulo}>Historial de ETS registrado</Text>
          
          <View style={styles.resultadoContainer}>
            {preguntas.map((pregunta) => {
              // Saltar preguntas condicionales que no aplican
              if (pregunta.condicional && 
                  !pregunta.condicional.includes(respuestas.diagnosticoPrevios)) {
                return null;
              }
              
              return (
                <View key={pregunta.id} style={styles.respuestaItem}>
                  <Text style={styles.preguntaTexto}>{pregunta.pregunta}</Text>
                  {pregunta.id === 'itsDiagnosticadas' ? (
                    <>
                      {respuestas.itsDiagnosticadas.map((its) => (
                        <Text key={its} style={styles.respuestaTexto}>
                          - {pregunta.opciones.find(op => op.value === its)?.label}
                        </Text>
                      ))}
                      {respuestas.itsDiagnosticadas.includes('otra') && (
                        <Text style={styles.respuestaTexto}>- Otra: {respuestas.otraITS}</Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.respuestaTexto}>
                      {pregunta.opciones.find(op => op.value === respuestas[pregunta.id])?.label}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
          
          <Button 
            mode="contained" 
            onPress={() => setScreen('Inicio')}
            style={styles.boton}
            labelStyle={styles.botonTexto}
          >
            Volver a inicio
          </Button>
          <Text style={styles.notaImportante}>
            NOTA: Esta información es confidencial y solo compartida con profesionales de salud cuando tú lo autorices.
          </Text>
        </ScrollView>
      </View>
    );
  }

  const preguntaActual = preguntas[pasoActual - 1];
  const esPreguntaCondicional = preguntaActual.condicional && 
                               !preguntaActual.condicional.includes(respuestas.diagnosticoPrevios);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.titulo}>Historial de Infecciones de Transmisión Sexual</Text>
        <Text style={styles.subtitulo}>Pregunta {pasoActual} de {preguntas.length}</Text>
        
        {esPreguntaCondicional ? (
          <View style={styles.preguntaContainer}>
            <Text style={styles.preguntaTexto}>{preguntaActual.pregunta}</Text>
            <Text style={styles.textoCondicional}>No aplica según tus respuestas anteriores</Text>
          </View>
        ) : (
          <View style={styles.preguntaContainer}>
            <Text style={styles.preguntaTexto}>{preguntaActual.pregunta}</Text>
            
            {preguntaActual.id === 'itsDiagnosticadas' ? (
              <>
                {preguntaActual.opciones.map((opcion) => (
                  <View key={opcion.value} style={styles.opcionContainer}>
                    <Checkbox.Android
                      status={respuestas.itsDiagnosticadas.includes(opcion.value) ? 'checked' : 'unchecked'}
                      onPress={() => handleCheckboxChange(opcion.value)}
                      color="#3498db"
                    />
                    <Text style={styles.opcionTexto}>{opcion.label}</Text>
                  </View>
                ))}
                {respuestas.itsDiagnosticadas.includes('otra') && (
                  <TextInput
                    placeholder="Especifica otra ITS"
                    value={respuestas.otraITS}
                    onChangeText={(text) => setRespuestas({...respuestas, otraITS: text})}
                    style={styles.input}
                  />
                )}
              </>
            ) : (
              <RadioButton.Group
                onValueChange={(value) => handleChange(preguntaActual.id, value)}
                value={respuestas[preguntaActual.id]}
              >
                {preguntaActual.opciones.map((opcion) => (
                  <View key={opcion.value} style={styles.opcionContainer}>
                    <RadioButton value={opcion.value} color="#3498db" />
                    <Text style={styles.opcionTexto}>{opcion.label}</Text>
                  </View>
                ))}
              </RadioButton.Group>
            )}
          </View>
        )}
        
        <View style={[styles.botonesNavegacion, { justifyContent: pasoActual > 1 ? 'space-between' : 'flex-end' }]}>
          {pasoActual > 1 && (
            <Button 
              mode="outlined" 
              onPress={pasoAnterior}
              style={styles.botonSecundario}
              labelStyle={styles.botonSecundarioTexto}
            >
              Anterior
            </Button>
          )}

          {pasoActual < preguntas.length ? (
            <Button 
              mode="contained" 
              onPress={siguientePaso}
              style={styles.boton}
              labelStyle={styles.botonTexto}
            >
              Siguiente
            </Button>
          ) : (
            <Button 
              mode="contained" 
              onPress={handleSubmit}
              style={styles.boton}
              labelStyle={styles.botonTexto}
            >
              Enviar respuestas
            </Button>
          )}
        </View>
        
        <Button
          mode="outlined"
          onPress={() => setScreen('Inicio')}
          style={styles.botonSecundario}
          labelStyle={styles.botonSecundarioTexto}
        >
          Volver al inicio
        </Button>
        <Button 
                           mode="outlined" 
                           onPress={() => setScreen('Encuestas')}
                           style={styles.botonSecundario}
                           labelStyle={styles.botonSecundarioTexto}
                         >
                           Cancelar
                         </Button>
        
        <Text style={styles.notaPrivacidad}>
          Esta información es confidencial y solo será compartida con los amigos que tienes agregados.
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6200EE'
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20
  },
  subtitulo: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 20
  },
  preguntaContainer: {
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
  textoCondicional: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginTop: 10
  },
  preguntaTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15
  },
  opcionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  opcionTexto: {
    fontSize: 16,
    marginLeft: 8
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    backgroundColor: 'white'
  },
  botonesNavegacion: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  boton: {
    backgroundColor: '#6200EE',
    borderRadius: 5,
    paddingVertical: 5,
    minWidth: 120,
    marginHorizontal: 5,
  },
  botonTexto: {
    color: 'white',
    fontSize: 16
  },
  botonSecundario: {
    borderColor: '#6200EE',
    borderRadius: 5,
    paddingVertical: 5,
    minWidth: 120,
    marginHorizontal: 5,
    marginTop: 10,
  },
  botonSecundarioTexto: {
    color: '#6200EE',
    fontSize: 16
  },
  notaPrivacidad: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 30
  },
  resultadoContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  respuestaItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  },
  respuestaTexto: {
    fontSize: 15,
    color: '#3498db',
    marginTop: 5
  },
  notaImportante: {
    fontSize: 12,
    color: '#e74c3c',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic'
  }
});

export default EncuestaHistorialITS;