import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { Checkbox, Button, RadioButton } from 'react-native-paper';
import { getDatabase, ref, push, set } from 'firebase/database';

const CuestionarioBDSM = ({ setScreen, userId }) => {
  const [respuestas, setRespuestas] = useState({
    rolIdentificacion: '',
    practicasInteres: [],
    otraPractica: '',
    limiteAbsoluto: '',
    conocimientoSSC: '',
    elementosImportantes: '',
    necesidadAftercare: '',
    participacionComunidades: ''
  });

  const [pasoActual, setPasoActual] = useState(1);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [loading, setLoading] = useState(false);

  const preguntas = [
    {
      id: 'rolIdentificacion',
      pregunta: '¿Con qué rol te identificas más?',
      tipo: 'radio',
      opciones: [
        { value: 'dominante', label: 'Dominante/Domme' },
        { value: 'sumiso', label: 'Sumiso/a' },
        { value: 'switch', label: 'Switch (ambos roles)' },
        { value: 'curioso', label: 'Curioso/a (explorando)' }
      ]
    },
    {
      id: 'practicasInteres',
      pregunta: 'Marca las prácticas que te generan curiosidad o excitación:',
      tipo: 'checkbox',
      opciones: [
        { value: 'amarres', label: 'Amarres (shibari, cuerdas)' },
        { value: 'juego_poder', label: 'Juego de poder (humillación leve, órdenes)' },
        { value: 'impacto', label: 'Impacto (azotes, palmas, fustas)' },
        { value: 'sensacion', label: 'Sensación (cera caliente, hielo, texturas)' },
        { value: 'roleplay', label: 'Roleplay (juegos de roles: profesor/alumno, etc.)' },
        { value: 'otro', label: 'Otro' }
      ]
    },
    {
      id: 'limiteAbsoluto',
      pregunta: '¿Hay alguna práctica que consideres límite absoluto (hard limit)?',
      tipo: 'texto'
    },
    {
      id: 'conocimientoSSC',
      pregunta: '¿Conoces el concepto de SSC (Seguro, Sensato y Consensuado) o RACK (Risk-Aware Consensual Kink)?',
      tipo: 'radio',
      opciones: [
        { value: 'si_aplico', label: 'Sí, los aplico siempre.' },
        { value: 'he_oido', label: 'He oído hablar, pero necesito aprender más.' },
        { value: 'no_conozco', label: 'No los conozco.' }
      ]
    },
    {
      id: 'elementosImportantes',
      pregunta: '¿Qué elementos son importantes para ti en una escena BDSM? (Ej: ambientación, juguetes, verbalización)',
      tipo: 'texto'
    },
    {
      id: 'necesidadAftercare',
      pregunta: 'Después de una escena, ¿sueles necesitar aftercare (cuidados posteriores)?',
      tipo: 'radio',
      opciones: [
        { value: 'si', label: 'Sí (ej: abrazos, hablar, hidratación).' },
        { value: 'no_siempre', label: 'No siempre.' },
        { value: 'no_seguro', label: 'No estoy seguro/a.' }
      ]
    },
    {
      id: 'participacionComunidades',
      pregunta: '¿Has participado en comunidades BDSM (foros, eventos, talleres)?',
      tipo: 'radio',
      opciones: [
        { value: 'si_activamente', label: 'Sí, activamente.' },
        { value: 'solo_online', label: 'Solo en línea.' },
        { value: 'no_pero_interes', label: 'No, pero me interesa.' }
      ]
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
      const newEncuestaRef = push(ref(db, `usuarios/${userId}/preferenciasBDSM`));
      await set(newEncuestaRef, encuestaData);

      console.log('Encuesta BDSM guardada en Firebase');
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
    const current = respuestas.practicasInteres;
    const newValue = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    
    setRespuestas({
      ...respuestas,
      practicasInteres: newValue
    });
  };

  const siguientePaso = () => {
    const preguntaActual = preguntas[pasoActual - 1];
    
    if (preguntaActual.tipo !== 'checkbox' && preguntaActual.tipo !== 'texto' && 
        !respuestas[preguntaActual.id]) {
      Alert.alert('Por favor responde esta pregunta antes de continuar');
      return;
    }
    
    if (preguntaActual.id === 'practicasInteres' && respuestas.practicasInteres.length === 0) {
      Alert.alert('Por favor selecciona al menos una opción o marca "Otro"');
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
          <Text style={styles.titulo}>Preferencias BDSM registradas</Text>
          
          <View style={styles.resultadoContainer}>
            {preguntas.map((pregunta) => (
              <View key={pregunta.id} style={styles.respuestaItem}>
                <Text style={styles.preguntaTexto}>{pregunta.pregunta}</Text>
                
                {pregunta.tipo === 'checkbox' ? (
                  <>
                    {respuestas.practicasInteres.map((practica) => (
                      <Text key={practica} style={styles.respuestaTexto}>
                        - {pregunta.opciones.find(op => op.value === practica)?.label}
                      </Text>
                    ))}
                    {respuestas.practicasInteres.includes('otro') && (
                      <Text style={styles.respuestaTexto}>- Otro: {respuestas.otraPractica}</Text>
                    )}
                  </>
                ) : pregunta.tipo === 'texto' ? (
                  <Text style={styles.respuestaTexto}>{respuestas[pregunta.id] || 'No especificado'}</Text>
                ) : (
                  <Text style={styles.respuestaTexto}>
                    {pregunta.opciones.find(op => op.value === respuestas[pregunta.id])?.label}
                  </Text>
                )}
              </View>
            ))}
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
            NOTA: Esta información es confidencial y solo compartida con las personas que tú autorices.
          </Text>
        </ScrollView>
      </View>
    );
  }

  const preguntaActual = preguntas[pasoActual - 1];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.titulo}>Cuestionario de Preferencias BDSM</Text>
        <Text style={styles.subtitulo}>Pregunta {pasoActual} de {preguntas.length}</Text>
        
        <View style={styles.preguntaContainer}>
          <Text style={styles.preguntaTexto}>{preguntaActual.pregunta}</Text>
          
          {preguntaActual.tipo === 'checkbox' ? (
            <>
              {preguntaActual.opciones.map((opcion) => (
                <View key={opcion.value} style={styles.opcionContainer}>
                  <Checkbox.Android
                    status={respuestas.practicasInteres.includes(opcion.value) ? 'checked' : 'unchecked'}
                    onPress={() => handleCheckboxChange(opcion.value)}
                    color="#8e44ad"
                  />
                  <Text style={styles.opcionTexto}>{opcion.label}</Text>
                </View>
              ))}
              {respuestas.practicasInteres.includes('otro') && (
                <TextInput
                  placeholder="Especifica otra práctica"
                  value={respuestas.otraPractica}
                  onChangeText={(text) => setRespuestas({...respuestas, otraPractica: text})}
                  style={styles.input}
                />
              )}
            </>
          ) : preguntaActual.tipo === 'texto' ? (
            <TextInput
              placeholder="Escribe tu respuesta aquí..."
              value={respuestas[preguntaActual.id]}
              onChangeText={(text) => handleChange(preguntaActual.id, text)}
              style={[styles.input, { height: 100 }]}
              multiline
            />
          ) : (
            <RadioButton.Group
              onValueChange={(value) => handleChange(preguntaActual.id, value)}
              value={respuestas[preguntaActual.id]}
            >
              {preguntaActual.opciones.map((opcion) => (
                <View key={opcion.value} style={styles.opcionContainer}>
                  <RadioButton value={opcion.value} color="#8e44ad" />
                  <Text style={styles.opcionTexto}>{opcion.label}</Text>
                </View>
              ))}
            </RadioButton.Group>
          )}
        </View>
        
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
        
        <Text style={styles.notaPrivacidad}>
          Tus respuestas son completamente confidenciales y se almacenan de forma segura.
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
    color: '#8e44ad'
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
    marginLeft: 8,
    color: '#2c3e50'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    backgroundColor: 'white',
    color: '#2c3e50'
  },
  botonesNavegacion: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  boton: {
    backgroundColor: '#8e44ad',
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
    borderColor: '#8e44ad',
    borderRadius: 5,
    paddingVertical: 5,
    minWidth: 120,
    marginHorizontal: 5,
  },
  botonSecundarioTexto: {
    color: '#8e44ad',
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
    borderColor: '#8e44ad',
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
    color: '#8e44ad',
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

export default CuestionarioBDSM;