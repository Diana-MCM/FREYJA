import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Checkbox, RadioButton, Button } from 'react-native-paper';
import { getDatabase, ref, push, set } from 'firebase/database';

const EncuestaFetiches = ({ setScreen, userId }) => {
  // Estado para todas las respuestas
  const [respuestas, setRespuestas] = useState({
    intereses: [],
    otroInteres: '',
    experienciaFetiches: null,
    limitesFetiches: null,
    descripcionLimite: '',
    comodidadHablando: null,
    importanteNuevoFetiche: [],
    palabraSeguridad: null,
    ejemploPalabra: '',
    contextoExploracion: null,
    otroContexto: ''
  });

  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [camposIncompletos, setCamposIncompletos] = useState(false);

  // Opciones para cada pregunta
  const opcionesIntereses = [
    { value: 'bdsm', label: 'Dominación/sumisión (BDSM leve)' },
    { value: 'roles', label: 'Juegos de roles (ej: policía/estudiante, médico/paciente)' },
    { value: 'partes_cuerpo', label: 'Fetiches con partes del cuerpo (pies, manos, etc.)' },
    { value: 'juguetes', label: 'Uso de juguetes sexuales (vibradores, esposas, etc.)' },
    { value: 'exhibicionismo', label: 'Exhibicionismo/voyeurismo (consensuado)' },
    { value: 'sensual', label: 'Prácticas sensuales (masajes, alimentación erótica)' },
    { value: 'otro_interes', label: 'Otro' }
  ];

  const opcionesExperiencia = [
    { value: 'si_gusto', label: 'Sí, y me gustó' },
    { value: 'si_no_gusto', label: 'Sí, pero no fue para mí' },
    { value: 'no_quiero', label: 'No, pero quiero intentarlo' },
    { value: 'no_interesa', label: 'No me interesa' }
  ];

  const opcionesLimites = [
    { value: 'si_limite', label: 'Sí' },
    { value: 'no_abierto', label: 'No, soy abierto/a a explorar' },
    { value: 'depende_confianza', label: 'Depende de la confianza con mi pareja' }
  ];

  const opcionesComodidad = [
    { value: 'comodo', label: 'Cómodo/a, me gusta la comunicación abierta' },
    { value: 'nervioso', label: 'Algo nervioso/a, pero lo intento' },
    { value: 'verguenza', label: 'Me da vergüenza' },
    { value: 'pareja_iniciativa', label: 'Prefiero que mi pareja tome la iniciativa' }
  ];

  const opcionesImportante = [
    { value: 'consentimiento', label: 'Consentimiento claro y seguro (palabra de seguridad, señales)' },
    { value: 'ambiente', label: 'Ambiente privado y relajado' },
    { value: 'investigar', label: 'Investigar primero (ej: tutoriales, artículos)' },
    { value: 'plan_b', label: 'Tener un "plan B" si algo sale mal' }
  ];

  const opcionesPalabraSeguridad = [
    { value: 'si_palabra', label: 'Sí, por ejemplo:' },
    { value: 'no_basta', label: 'No, con un "no" basta' },
    { value: 'solo_intensas', label: 'Solo para prácticas intensas' }
  ];

  const opcionesContexto = [
    { value: 'romantico', label: 'Romántico (ej: ataduras con velas y música)' },
    { value: 'sexual', label: 'Sexual (ej: juego rápido e intenso)' },
    { value: 'ambos', label: 'Ambos, depende del día' },
    { value: 'otro_contexto', label: 'Otro' }
  ];

  // Guardar en Firebase con validación
  const guardarEncuesta = async () => {
    try {
      setLoading(true);
      setCamposIncompletos(false);

      // Validar campos obligatorios
      const camposObligatorios = [
        respuestas.experienciaFetiches,
        respuestas.limitesFetiches,
        respuestas.comodidadHablando,
        respuestas.palabraSeguridad,
        respuestas.contextoExploracion
      ];

      if (camposObligatorios.some(campo => !campo)) {
        setCamposIncompletos(true);
        Alert.alert('Campos incompletos', 'Por favor, completa todas las preguntas obligatorias antes de guardar.');
        return;
      }

      if (!userId) {
        Alert.alert('Error', 'Usuario no identificado');
        return;
      }

      const db = getDatabase();
      const encuestaRef = push(ref(db, `usuarios/${userId}/interesesSexuales`));

      await set(encuestaRef, {
        respuestas: { ...respuestas },
        fecha: new Date().toISOString()
      });

      setMostrarResultado(true);
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'No se pudo guardar la encuesta. Verifica tu conexión o permisos.');
    } finally {
      setLoading(false);
    }
  };

  // Handlers para cambios
  const toggleInteres = (value) => {
    const current = respuestas.intereses;
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    setRespuestas({
      ...respuestas,
      intereses: newValue
    });
  };

  const handleRadioChange = (campo, value) => {
    setRespuestas({
      ...respuestas,
      [campo]: value
    });
  };

  const handleTextChange = (campo, text) => {
    setRespuestas({
      ...respuestas,
      [campo]: text
    });
  };

  // Pantalla de carga
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={styles.loadingText}>Guardando tus respuestas...</Text>
      </SafeAreaView>
    );
  }

  // Pantalla de resultados
  if (mostrarResultado) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.titulo}>Tus Preferencias de Fetiches</Text>

          {/* Intereses */}
          <View style={styles.respuestaContainer}>
            <Text style={styles.preguntaResumen}>Fantasías o fetiches que te generan curiosidad:</Text>
            {respuestas.intereses.length === 0 ? (
              <Text style={styles.respuesta}>• Ninguno especificado</Text>
            ) : (
              <>
                {respuestas.intereses.map(opcion => (
                  <Text key={opcion} style={styles.respuesta}>
                    • {opcionesIntereses.find(o => o.value === opcion)?.label}
                  </Text>
                ))}
                {respuestas.intereses.includes('otro_interes') && (
                  <Text style={styles.respuesta}>• Otro: {respuestas.otroInteres}</Text>
                )}
              </>
            )}
          </View>

          {/* Experiencia */}
          <View style={styles.respuestaContainer}>
            <Text style={styles.preguntaResumen}>Experiencia con fetiches:</Text>
            <Text style={styles.respuesta}>
              • {opcionesExperiencia.find(o => o.value === respuestas.experienciaFetiches)?.label || 'No especificado'}
            </Text>
          </View>

          {/* Límites */}
          <View style={styles.respuestaContainer}>
            <Text style={styles.preguntaResumen}>Límites con fetiches:</Text>
            <Text style={styles.respuesta}>
              • {opcionesLimites.find(o => o.value === respuestas.limitesFetiches)?.label || 'No especificado'}
            </Text>
            {respuestas.limitesFetiches === 'si_limite' && (
              <Text style={styles.respuesta}>• Descripción: {respuestas.descripcionLimite}</Text>
            )}
          </View>

          {/* Comodidad */}
          <View style={styles.respuestaContainer}>
            <Text style={styles.preguntaResumen}>Comodidad hablando de estos temas:</Text>
            <Text style={styles.respuesta}>
              • {opcionesComodidad.find(o => o.value === respuestas.comodidadHablando)?.label || 'No especificado'}
            </Text>
          </View>

          {/* Seguridad */}
          <View style={styles.respuestaContainer}>
            <Text style={styles.preguntaResumen}>Lo más importante al probar algo nuevo:</Text>
            {respuestas.importanteNuevoFetiche.length === 0 ? (
              <Text style={styles.respuesta}>• Ninguna preferencia especificada</Text>
            ) : (
              respuestas.importanteNuevoFetiche.map(opcion => (
                <Text key={opcion} style={styles.respuesta}>
                  • {opcionesImportante.find(o => o.value === opcion)?.label}
                </Text>
              ))
            )}
          </View>

          {/* Palabra de seguridad */}
          <View style={styles.respuestaContainer}>
            <Text style={styles.preguntaResumen}>Palabra de seguridad:</Text>
            <Text style={styles.respuesta}>
              • {opcionesPalabraSeguridad.find(o => o.value === respuestas.palabraSeguridad)?.label || 'No especificado'}
            </Text>
            {respuestas.palabraSeguridad === 'si_palabra' && (
              <Text style={styles.respuesta}>• Ejemplo: {respuestas.ejemploPalabra}</Text>
            )}
          </View>

          {/* Contexto */}
          <View style={styles.respuestaContainer}>
            <Text style={styles.preguntaResumen}>Contexto preferido para explorar:</Text>
            <Text style={styles.respuesta}>
              • {opcionesContexto.find(o => o.value === respuestas.contextoExploracion)?.label || 'No especificado'}
            </Text>
            {respuestas.contextoExploracion === 'otro_contexto' && (
              <Text style={styles.respuesta}>• Descripción: {respuestas.otroContexto}</Text>
            )}
          </View>

          <Button 
            mode="contained" 
            onPress={() => setScreen('Inicio')}
            style={styles.botonPrincipal}
            labelStyle={styles.botonTexto}
          >
            Volver al inicio
          </Button>

          <Text style={styles.notaImportante}>
            Recuerda que estas preferencias pueden evolucionar con el tiempo y siempre puedes actualizarlas.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Formulario principal
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.titulo}>Exploración de Fetiches y Preferencias</Text>
        <Text style={styles.subtitulo}>
          Esta encuesta nos ayudará a entender mejor tus gustos y límites en la intimidad
        </Text>

        {/* Sección 1: Intereses */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>🔹 1. Sobre Intereses y Curiosidades</Text>
          
          <Text style={styles.pregunta}>
            ¿Qué tipo de fantasías o fetiches te generan curiosidad? (Marca todos los que apliquen)
          </Text>
          
          {opcionesIntereses.map(opcion => (
            <View key={opcion.value} style={styles.opcionContainer}>
              <Checkbox.Android
                status={respuestas.intereses.includes(opcion.value) ? 'checked' : 'unchecked'}
                onPress={() => toggleInteres(opcion.value)}
                color="#8A2BE2"
              />
              <Text style={styles.opcionTexto}>{opcion.label}</Text>
            </View>
          ))}
          
          {respuestas.intereses.includes('otro_interes') && (
            <TextInput
              placeholder="Describe tu interés..."
              value={respuestas.otroInteres}
              onChangeText={text => handleTextChange('otroInteres', text)}
              style={styles.input}
              multiline
            />
          )}

          <Text style={[styles.pregunta, { marginTop: 20, fontWeight: 'bold' }]}>* ¿Alguna vez has experimentado con algún fetiche?</Text>
          
          {opcionesExperiencia.map(opcion => (
            <View key={opcion.value} style={styles.opcionContainer}>
              <RadioButton.Android
                value={opcion.value}
                status={respuestas.experienciaFetiches === opcion.value ? 'checked' : 'unchecked'}
                onPress={() => handleRadioChange('experienciaFetiches', opcion.value)}
                color="#8A2BE2"
              />
              <Text style={styles.opcionTexto}>{opcion.label}</Text>
            </View>
          ))}
        </View>

        {/* Sección 2: Límites */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>🔹 2. Sobre Límites y Comodidad</Text>
          
          <Text style={[styles.pregunta, { fontWeight: 'bold' }]}>* ¿Hay algún fetiche o práctica que NO estarías dispuesto/a a probar? (Ej: dolor, humillación, etc.)</Text>
          
          {opcionesLimites.map(opcion => (
            <View key={opcion.value} style={styles.opcionContainer}>
              <RadioButton.Android
                value={opcion.value}
                status={respuestas.limitesFetiches === opcion.value ? 'checked' : 'unchecked'}
                onPress={() => handleRadioChange('limitesFetiches', opcion.value)}
                color="#8A2BE2"
              />
              <Text style={styles.opcionTexto}>{opcion.label}</Text>
            </View>
          ))}
          
          {respuestas.limitesFetiches === 'si_limite' && (
            <TextInput
              placeholder="Describe qué no estarías dispuesto/a a probar..."
              value={respuestas.descripcionLimite}
              onChangeText={text => handleTextChange('descripcionLimite', text)}
              style={styles.input}
              multiline
            />
          )}

          <Text style={[styles.pregunta, { marginTop: 20, fontWeight: 'bold' }]}>* ¿Cómo te sientes al hablar de estos temas?</Text>
          
          {opcionesComodidad.map(opcion => (
            <View key={opcion.value} style={styles.opcionContainer}>
              <RadioButton.Android
                value={opcion.value}
                status={respuestas.comodidadHablando === opcion.value ? 'checked' : 'unchecked'}
                onPress={() => handleRadioChange('comodidadHablando', opcion.value)}
                color="#8A2BE2"
              />
              <Text style={styles.opcionTexto}>{opcion.label}</Text>
            </View>
          ))}
        </View>

        {/* Sección 3: Práctica y Seguridad */}
        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>🔹 3. Sobre Práctica y Seguridad</Text>
          
          <Text style={styles.pregunta}>
            Si probamos un fetiche nuevo, ¿qué es lo más importante para ti? (Marca todos los que apliquen)
          </Text>
          
          {opcionesImportante.map(opcion => (
            <View key={opcion.value} style={styles.opcionContainer}>
              <Checkbox.Android
                status={respuestas.importanteNuevoFetiche.includes(opcion.value) ? 'checked' : 'unchecked'}
                onPress={() => {
                  const current = respuestas.importanteNuevoFetiche;
                  const newValue = current.includes(opcion.value)
                    ? current.filter(v => v !== opcion.value)
                    : [...current, opcion.value];
                  handleTextChange('importanteNuevoFetiche', newValue);
                }}
                color="#8A2BE2"
              />
              <Text style={styles.opcionTexto}>{opcion.label}</Text>
            </View>
          ))}

          <Text style={[styles.pregunta, { marginTop: 20, fontWeight: 'bold' }]}>* ¿Te gustaría establecer un "código" o palabra segura para detener la actividad si es necesario?</Text>
          
          {opcionesPalabraSeguridad.map(opcion => (
            <View key={opcion.value} style={styles.opcionContainer}>
              <RadioButton.Android
                value={opcion.value}
                status={respuestas.palabraSeguridad === opcion.value ? 'checked' : 'unchecked'}
                onPress={() => handleRadioChange('palabraSeguridad', opcion.value)}
                color="#8A2BE2"
              />
              <Text style={styles.opcionTexto}>{opcion.label}</Text>
            </View>
          ))}
          
          {respuestas.palabraSeguridad === 'si_palabra' && (
            <TextInput
              placeholder="Ejemplo: 'pino' o 'rojo'..."
              value={respuestas.ejemploPalabra}
              onChangeText={text => handleTextChange('ejemploPalabra', text)}
              style={styles.input}
            />
          )}

          <Text style={[styles.pregunta, { marginTop: 20, fontWeight: 'bold' }]}>* ¿Prefieres explorar fetiches en un contexto romántico o solo sexual?</Text>
          
          {opcionesContexto.map(opcion => (
            <View key={opcion.value} style={styles.opcionContainer}>
              <RadioButton.Android
                value={opcion.value}
                status={respuestas.contextoExploracion === opcion.value ? 'checked' : 'unchecked'}
                onPress={() => handleRadioChange('contextoExploracion', opcion.value)}
                color="#8A2BE2"
              />
              <Text style={styles.opcionTexto}>{opcion.label}</Text>
            </View>
          ))}
          
          {respuestas.contextoExploracion === 'otro_contexto' && (
            <TextInput
              placeholder="Describe tu contexto preferido..."
              value={respuestas.otroContexto}
              onChangeText={text => handleTextChange('otroContexto', text)}
              style={styles.input}
              multiline
            />
          )}
        </View>

        {/* Botones */}
        <Button 
          mode="contained" 
          onPress={guardarEncuesta}
          style={styles.botonPrincipal}
          labelStyle={styles.botonTexto}
          disabled={!respuestas.experienciaFetiches || !respuestas.limitesFetiches || 
                    !respuestas.comodidadHablando || !respuestas.palabraSeguridad || 
                    !respuestas.contextoExploracion}
        >
          Guardar Preferencias
        </Button>

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
          Tus respuestas son completamente confidenciales y solo serán compartidas con quienes tú decidas.
        </Text>
        {camposIncompletos && (
          <Text style={styles.errorText}>
            Por favor, completa todas las preguntas marcadas con (*) antes de guardar.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16
  },
  scrollContainer: {
    paddingTop: 20,
    paddingBottom: 40
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#8A2BE2'
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4B0082',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitulo: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24
  },
  seccion: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8A2BE2',
    marginBottom: 16,
    marginTop: 20,
  },
  pregunta: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12
  },
  opcionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  opcionTexto: {
    fontSize: 15,
    marginLeft: 12,
    flex: 1,
    color: '#34495e'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    backgroundColor: 'white',
    fontSize: 16
  },
  botonPrincipal: {
    backgroundColor: '#8A2BE2',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 12
  },
  botonSecundario: {
    borderColor: '#8A2BE2',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 24
  },
  botonTexto: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  botonSecundarioTexto: {
    color: '#8A2BE2',
    fontSize: 16,
    fontWeight: '600'
  },
  notaPrivacidad: {
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 8
  },
  respuestaContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3
  },
  preguntaResumen: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12
  },
  respuesta: {
    fontSize: 15,
    color: '#4B0082',
    marginBottom: 8,
    marginLeft: 8
  },
  notaImportante: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic'
  },
  errorText: {
    fontSize: 14,
    color: 'red',
    textAlign: 'center',
    marginTop: 10
  }
});

export default EncuestaFetiches;