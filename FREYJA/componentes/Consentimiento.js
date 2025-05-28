import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Checkbox, Button, RadioButton } from 'react-native-paper';
import { getDatabase, ref, push, set } from 'firebase/database';

const EncuestaPreferenciasIntimas = ({ setScreen, userId }) => {
  // Estado para todas las respuestas
  const [respuestas, setRespuestas] = useState({
    manejoConsentimiento: [],
    otroManejo: '',
    reaccionIncomodidad: [],
    otraReaccion: '',
    limites: [],
    otrosLimites: '',
    manejoAlcoholDrogas: null,
    otroManejoSustancias: ''
  });

  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [loading, setLoading] = useState(false);

  // Opciones para cada pregunta
  const opcionesConsentimiento = [
    { value: 'verbal', label: 'Preguntar verbalmente antes de cada paso' },
    { value: 'no_verbal', label: 'Usar señales no verbales (ej. quitar la mano si algo no gusta)' },
    { value: 'confianza', label: 'Confío en que dirás "no" si es necesario' },
    { value: 'otro_consentimiento', label: 'Otro' }
  ];

  const opcionesReaccion = [
    { value: 'parar', label: 'Parar inmediatamente sin preguntas' },
    { value: 'preguntar', label: 'Preguntarte si quieres cambiar de actividad' },
    { value: 'espacio', label: 'Darme espacio para calmarme' },
    { value: 'otro_reaccion', label: 'Otro' }
  ];

  const opcionesLimites = [
    { value: 'oral', label: 'Sexo oral (dar/recibir)' },
    { value: 'penetracion', label: 'Penetración (vaginal/anal)' },
    { value: 'juegos_rol', label: 'Juegos de rol (fantasías, disfraces)' },
    { value: 'grabaciones', label: 'Grabaciones (fotos, videos, audio)' },
    { value: 'bdsm', label: 'BDSM leve (ataduras, sumisión, juegos de poder)' },
    { value: 'fluidos', label: 'Contacto con fluidos corporales (saliva, semen, etc.)' },
    { value: 'otro_limite', label: 'Otros' }
  ];

  const opcionesSustancias = [
    { value: 'evitar', label: 'Evitamos relaciones sexuales' },
    { value: 'caricias', label: 'Solo caricias/masturbación' },
    { value: 'confianza', label: 'Confiamos en el criterio del otro' },
    { value: 'otro_sustancias', label: 'Otra forma de manejo' }
  ];

  // Guardar en Firebase
  const guardarEncuesta = async () => {
    try {
      setLoading(true);
      
      if (!userId) {
        Alert.alert('Error', 'Usuario no identificado');
        return;
      }

      const db = getDatabase();
      const encuestaRef = push(ref(db, `usuarios/${userId}/consentimiento`));
      
      await set(encuestaRef, {
        respuestas: { ...respuestas },
        fecha: new Date().toISOString()
      });

      setMostrarResultado(true);
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', 'No se pudo guardar la encuesta');
    } finally {
      setLoading(false);
    }
  };

  // Handlers para cambios
  const toggleOpcion = (campo, value) => {
    const current = respuestas[campo];
    const newValue = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    
    setRespuestas({
      ...respuestas,
      [campo]: newValue
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Guardando tus preferencias...</Text>
      </View>
    );
  }

  // Pantalla de resultados
  if (mostrarResultado) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.titulo}>Tus Preferencias Íntimas</Text>
          
          {/* Consentimiento */}
          <View style={styles.respuestaContainer}>
            <Text style={styles.preguntaResumen}>¿Cómo prefieres que manejemos el consentimiento?</Text>
            {respuestas.manejoConsentimiento.map(opcion => (
              <Text key={opcion} style={styles.respuesta}>
                • {opcionesConsentimiento.find(o => o.value === opcion)?.label}
              </Text>
            ))}
            {respuestas.manejoConsentimiento.includes('otro_consentimiento') && (
              <Text style={styles.respuesta}>• Otro: {respuestas.otroManejo}</Text>
            )}
          </View>

          {/* Reacción a incomodidad */}
          <View style={styles.respuestaContainer}>
            <Text style={styles.preguntaResumen}>Si algo te incomoda, ¿cómo quieres que reaccione?</Text>
            {respuestas.reaccionIncomodidad.map(opcion => (
              <Text key={opcion} style={styles.respuesta}>
                • {opcionesReaccion.find(o => o.value === opcion)?.label}
              </Text>
            ))}
            {respuestas.reaccionIncomodidad.includes('otro_reaccion') && (
              <Text style={styles.respuesta}>• Otro: {respuestas.otraReaccion}</Text>
            )}
          </View>

          {/* Límites */}
          <View style={styles.respuestaContainer}>
            <Text style={styles.preguntaResumen}>¿Hay algo que definitivamente NO quieras hacer?</Text>
            {respuestas.limites.length === 0 ? (
              <Text style={styles.respuesta}>• No tengo límites definidos</Text>
            ) : (
              <>
                {respuestas.limites.map(opcion => (
                  <Text key={opcion} style={styles.respuesta}>
                    • {opcionesLimites.find(o => o.value === opcion)?.label}
                  </Text>
                ))}
                {respuestas.limites.includes('otro_limite') && (
                  <Text style={styles.respuesta}>• Otros: {respuestas.otrosLimites}</Text>
                )}
              </>
            )}
          </View>

          {/* Manejo con sustancias */}
          <View style={styles.respuestaContainer}>
            <Text style={styles.preguntaResumen}>Si uno está bajo efectos de alcohol/drogas:</Text>
            <Text style={styles.respuesta}>
              • {opcionesSustancias.find(o => o.value === respuestas.manejoAlcoholDrogas)?.label || 'No especificado'}
            </Text>
            {respuestas.manejoAlcoholDrogas === 'otro_sustancias' && (
              <Text style={styles.respuesta}>• {respuestas.otroManejoSustancias}</Text>
            )}
          </View>

          {/* Botón para volver a Encuestas */}
          <Button 
            mode="contained" 
            onPress={() => setScreen('Encuestas')}
            style={styles.botonPrincipal}
            labelStyle={styles.botonTexto}
          >
            Volver a Encuestas
          </Button>

          {/* Botón existente para volver al inicio */}
          <Button 
            mode="contained" 
            onPress={() => setScreen('Inicio')}
            style={styles.botonPrincipal}
            labelStyle={styles.botonTexto}
          >
            Volver al inicio
          </Button>

          <Text style={styles.notaImportante}>
            Puedes actualizar estas preferencias en cualquier momento desde tu perfil.
          </Text>
          <Text style={styles.notaImportante}>
            "La mejor intimidad empieza con una conversación incómoda pero necesaria."
          </Text>
        </ScrollView>
      </View>
    );
  }

  // Formulario principal
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.titulo}>Preferencias Íntimas</Text>
        <Text style={styles.subtitulo}>
          Estas respuestas nos ayudarán a tener una relación más satisfactoria y segura
        </Text>

        {/* Sección 1: Consentimiento */}
        <View style={styles.seccion}>
          <Text style={styles.pregunta}>
            ¿Cómo prefieres que manejemos el consentimiento durante el acto?
          </Text>
          <Text style={styles.instruccion}>(Marca todas las que apliquen)</Text>
          
          {opcionesConsentimiento.map(opcion => (
            <View key={opcion.value} style={styles.opcionContainer}>
              <Checkbox.Android
                status={respuestas.manejoConsentimiento.includes(opcion.value) ? 'checked' : 'unchecked'}
                onPress={() => toggleOpcion('manejoConsentimiento', opcion.value)}
                color="#6200EE"
              />
              <Text style={styles.opcionTexto}>{opcion.label}</Text>
            </View>
          ))}
          
          {respuestas.manejoConsentimiento.includes('otro_consentimiento') && (
            <TextInput
              placeholder="Describe tu preferencia..."
              value={respuestas.otroManejo}
              onChangeText={text => handleTextChange('otroManejo', text)}
              style={styles.input}
              multiline
            />
          )}
        </View>

        {/* Sección 2: Reacción a incomodidad */}
        <View style={styles.seccion}>
          <Text style={styles.pregunta}>
            Si algo te incomoda, ¿cómo quieres que reaccione yo?
          </Text>
          <Text style={styles.instruccion}>(Marca todas las que apliquen)</Text>
          
          {opcionesReaccion.map(opcion => (
            <View key={opcion.value} style={styles.opcionContainer}>
              <Checkbox.Android
                status={respuestas.reaccionIncomodidad.includes(opcion.value) ? 'checked' : 'unchecked'}
                onPress={() => toggleOpcion('reaccionIncomodidad', opcion.value)}
                color="#6200EE"
              />
              <Text style={styles.opcionTexto}>{opcion.label}</Text>
            </View>
          ))}
          
          {respuestas.reaccionIncomodidad.includes('otro_reaccion') && (
            <TextInput
              placeholder="Describe cómo prefieres que reaccione..."
              value={respuestas.otraReaccion}
              onChangeText={text => handleTextChange('otraReaccion', text)}
              style={styles.input}
              multiline
            />
          )}
        </View>

        {/* Sección 3: Límites */}
        <View style={styles.seccion}>
          <Text style={styles.pregunta}>
            ¿Hay algo que definitivamente NO quieras hacer en la intimidad?
          </Text>
          <Text style={styles.instruccion}>(Marca todas las que apliquen)</Text>
          
          {opcionesLimites.map(opcion => (
            <View key={opcion.value} style={styles.opcionContainer}>
              <Checkbox.Android
                status={respuestas.limites.includes(opcion.value) ? 'checked' : 'unchecked'}
                onPress={() => toggleOpcion('limites', opcion.value)}
                color="#6200EE"
              />
              <Text style={styles.opcionTexto}>{opcion.label}</Text>
            </View>
          ))}
          
          {respuestas.limites.includes('otro_limite') && (
            <TextInput
              placeholder="Especifica otros límites..."
              value={respuestas.otrosLimites}
              onChangeText={text => handleTextChange('otrosLimites', text)}
              style={styles.input}
              multiline
            />
          )}
        </View>

        {/* Sección 4: Manejo con sustancias */}
        <View style={styles.seccion}>
          <Text style={styles.pregunta}>
            ¿Cómo manejamos estas situaciones si uno está bajo efectos del alcohol/drogas?
          </Text>
          
          {opcionesSustancias.map(opcion => (
            <View key={opcion.value} style={styles.opcionContainer}>
              <RadioButton.Android
                value={opcion.value}
                status={respuestas.manejoAlcoholDrogas === opcion.value ? 'checked' : 'unchecked'}
                onPress={() => handleRadioChange('manejoAlcoholDrogas', opcion.value)}
                color="#6200EE"
              />
              <Text style={styles.opcionTexto}>{opcion.label}</Text>
            </View>
          ))}
          
          {respuestas.manejoAlcoholDrogas === 'otro_sustancias' && (
            <TextInput
              placeholder="Describe cómo prefieres manejarlo..."
              value={respuestas.otroManejoSustancias}
              onChangeText={text => handleTextChange('otroManejoSustancias', text)}
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
          disabled={!respuestas.manejoAlcoholDrogas}
        >
          Guardar Preferencias
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
          Esta información es completamente privada y solo será compartida con personas que tú autorices explícitamente.
        </Text>
      </ScrollView>
    </View>
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
    color: '#6200EE'
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 20,
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
  pregunta: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8
  },
  instruccion: {
    fontSize: 14,
    color: '#95a5a6',
    fontStyle: 'italic',
    marginBottom: 16
  },
  opcionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  opcionTexto: {
    fontSize: 16,
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
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  botonPrincipal: {
    backgroundColor: '#6200EE',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 12
  },
  botonSecundario: {
    borderColor: '#6200EE',
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
    color: '#6200EE',
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
    color: '#3498db',
    marginBottom: 8,
    marginLeft: 8
  },
  notaImportante: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic'
  }
});

export default EncuestaPreferenciasIntimas;