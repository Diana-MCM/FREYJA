import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { RadioButton, Button } from 'react-native-paper';
import { getDatabase, ref, push, set } from 'firebase/database';
import { app } from '../firebase/firebase'; // Ajusta la ruta según tu proyecto

const EncuestaChequeoETS = ({ onSubmit, setScreen, userId }) => {
  const [respuestas, setRespuestas] = useState({
    actividadSexual: null,
    parejasRecientes: null,
    proteccion: null,
    sintomas: null,
    historialETS: null,
    chequeosPrevios: null
  });

  const [pasoActual, setPasoActual] = useState(1);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [loading, setLoading] = useState(false);

  const preguntas = [
    {
      id: 'actividadSexual',
      pregunta: '1. ¿Has tenido actividad sexual en los últimos 6 meses?',
      opciones: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' }
      ]
    },
    {
      id: 'parejasRecientes',
      pregunta: '2. ¿Has tenido más de una pareja sexual en el último año?',
      opciones: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' },
      ]
    },
    {
      id: 'proteccion',
      pregunta: '3. ¿Has protección (preservativo) en tus relaciones sexuales en los ultimos 6 meses?',
      opciones: [
        { value: 'siempre', label: 'Siempre' },
        { value: 'a_veces', label: 'A veces' },
        { value: 'nunca', label: 'Nunca' }
      ]
    },
    {
      id: 'sintomas',
      pregunta: '4. ¿Has experimentado alguno de estos síntomas recientemente?\n(Secreción inusual, dolor al orinar, llagas o verrugas genitales, picazón)',
      opciones: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' },
      ]
    },
    {
      id: 'historialETS',
      pregunta: '5. ¿Te han diagnosticado alguna ETS en los ultimos 6 meses?',
      opciones: [
        { value: 'si', label: 'Sí' },
        { value: 'no', label: 'No' },
      ]
    },
    {
      id: 'chequeosPrevios',
      pregunta: '6. ¿Cuándo fue tu último chequeo de ETS?',
      opciones: [
        { value: 'menos_6_meses', label: 'Hace menos de 6 meses' },
        { value: '6_a_12_meses', label: 'Hace 6 a 12 meses' },
        { value: 'mas_1_ano', label: 'Hace más de 1 año' },
        { value: 'nunca', label: 'Nunca me he hecho uno' }
      ]
    }
  ];

const guardarEncuestaEnFirebase = async (resultado) => {
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
      puntaje: resultado.puntaje,
      nivelRiesgo: resultado.recomendacion.nivel,
      fecha: new Date().toISOString(),
    };

    const db = getDatabase(app);
    const newEncuestaRef = push(ref(db, `usuarios/${userId}/chequeos`));
    await set(newEncuestaRef, encuestaData);

    console.log('Encuesta guardada en Firebase Realtime Database');
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

  const siguientePaso = () => {
    if (!respuestas[preguntas[pasoActual - 1].id]) {
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

  const calcularRiesgo = () => {
    let puntaje = 0;

    if (respuestas.actividadSexual === 'si') puntaje += 1;
    if (respuestas.parejasRecientes === 'si') puntaje += 2;
    if (respuestas.proteccion === 'a_veces') puntaje += 1;
    if (respuestas.proteccion === 'nunca') puntaje += 2;
    if (respuestas.sintomas === 'si') puntaje += 3;
    if (respuestas.historialETS === 'si') puntaje += 2;
    if (respuestas.chequeosPrevios === 'mas_1_ano') puntaje += 1;
    if (respuestas.chequeosPrevios === 'nunca') puntaje += 2;

    return puntaje;
  };

  const obtenerRecomendacion = (puntaje) => {
    if (puntaje >= 7) {
      return {
        nivel: 'ALTO',
        mensaje: 'Tienes varios factores de riesgo. Se recomienda hacerte pruebas de ETS lo antes posible y consultar con un profesional de salud.',
        color: '#e74c3c'
      };
    } else if (puntaje >= 4) {
      return {
        nivel: 'MODERADO',
        mensaje: 'Tienes algunos factores de riesgo. Sería recomendable hacerte pruebas preventivas y considerar el uso consistente de protección.',
        color: '#f39c12'
      };
    } else {
      return {
        nivel: 'BAJO',
        mensaje: 'Tienes bajo riesgo actualmente, pero recuerda que las pruebas periódicas son importantes para mantener tu salud sexual.',
        color: '#27ae60'
      };
    }
  };

  const handleSubmit = async () => {
    const puntaje = calcularRiesgo();
    const recomendacion = obtenerRecomendacion(puntaje);
    
    await guardarEncuestaEnFirebase({ puntaje, recomendacion });
    
    if (onSubmit) {
      onSubmit({ respuestas, puntaje, recomendacion });
    }
    
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
    const puntaje = calcularRiesgo();
    const { nivel, mensaje, color } = obtenerRecomendacion(puntaje);
    
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.titulo}>Resultado de tu evaluación</Text>
          
          <View style={[styles.resultadoContainer, { borderColor: color }]}>
            <Text style={[styles.nivelRiesgo, { color }]}>Nivel de riesgo: {nivel}</Text>
            <Text style={styles.mensajeResultado}>{mensaje}</Text>
            
            <Text style={styles.subtitulo}>Tus respuestas:</Text>
            {preguntas.map((pregunta) => (
              <View key={pregunta.id} style={styles.respuestaItem}>
                <Text style={styles.preguntaTexto}>{pregunta.pregunta}</Text>
                <Text style={styles.respuestaTexto}>
                  {pregunta.opciones.find(op => op.value === respuestas[pregunta.id])?.label}
                </Text>
              </View>
            ))}
          </View>
          
          <Button 
            mode="contained" 
            onPress={() => setMostrarResultado(false)}
            style={styles.boton}
            labelStyle={styles.botonTexto}
          >
            Volver a evaluar
          </Button>
          <View style={{ height: 12 }} /> 
          <Button 
            mode="contained" 
            onPress={() => setScreen('Inicio')}
            style={styles.boton}
            labelStyle={styles.botonTexto}
          >
            Volver a inicio
          </Button>
          <Text style={styles.notaImportante}>
            NOTA: Esta evaluación no sustituye un diagnóstico médico. Si tienes dudas o síntomas, consulta a un profesional de salud.
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.titulo}>Evaluación de Riesgo de ETS</Text>
        <Text style={styles.subtitulo}>Pregunta {pasoActual} de {preguntas.length}</Text>
        
        <View style={styles.preguntaContainer}>
          <Text style={styles.preguntaTexto}>{preguntas[pasoActual - 1].pregunta}</Text>
          
          <RadioButton.Group
            onValueChange={(value) => handleChange(preguntas[pasoActual - 1].id, value)}
            value={respuestas[preguntas[pasoActual - 1].id]}
          >
            {preguntas[pasoActual - 1].opciones.map((opcion) => (
              <View key={opcion.value} style={styles.opcionContainer}>
                <RadioButton value={opcion.value} color="#3498db" />
                <Text style={styles.opcionTexto}>{opcion.label}</Text>
              </View>
            ))}
          </RadioButton.Group>
        </View>
        
        <View
          style={[styles.botonesNavegacion,{ justifyContent: pasoActual > 1 ? 'space-between' : 'flex-end' }]}
          >
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
            <>
             <Button 
               mode="contained" 
               onPress={siguientePaso}
               style={styles.boton}
               labelStyle={styles.botonTexto}
             >
              Siguiente
             </Button>
            </>
           ) : (
             <Button 
              mode="contained" 
               onPress={handleSubmit}
               style={styles.boton}
               labelStyle={styles.botonTexto}
             >
              Ver resultados
             </Button>
           )}
         </View>
         <View style={{ height: 12 }} />
         <Button
                mode="outlined"
                onPress={() => setScreen('Inicio')}
                style={styles.botonSecundario}
                labelStyle={styles.botonSecundarioTexto}
         >
          Volver al inicio
         </Button>
        <Text style={styles.notaPrivacidad}>
          Estas respuestas las podrán ver tus amigos.
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  nivelRiesgo: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10
  },
  mensajeResultado: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24
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

export default EncuestaChequeoETS;