import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const Encuestas = ({ setScreen, nombreUsuario, userId }) => {
  const cuestionarios = [
    {
      id: 'chequeo',
      titulo: 'Chequeo de ETS',
      frase: 'Conoce tu riesgo y cuida tu salud sexual',
      color: '#3498db',
      screen: 'Regularchequeo'
    },
    {
      id: 'historial',
      titulo: 'Historial de ITS',
      frase: 'Tu salud es importante, lleva un registro',
      color: '#6200EE',
      screen: 'Historialits'
    },
    {
      id: 'preferencias',
      titulo: 'Preferencias Íntimas',
      frase: 'Comunica tus límites y deseos con confianza',
      color: '#8A2BE2',
      screen: 'Consentimiento'
    },
    {
      id: 'fetiches',
      titulo: 'Intereses Sexuales',
      frase: 'Explora tus fantasías de manera segura',
      color: '#4B0082',
      screen: 'Interesessexuales'
    },
    {
      id: 'BDSM',
      titulo: 'Preferencias BDSM',
      frase: 'Explora tus fantasías de manera segura',
      color: '#dkf402',
      screen: 'BDSM'
    },
    
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.tituloPrincipal}>Cuestionarios de Salud Sexual</Text>
        <Text style={styles.subtitulo}>Selecciona el que deseas completar</Text>
        
        {cuestionarios.map((cuestionario) => (
          <TouchableOpacity 
            key={cuestionario.id}
            style={[
              styles.cuestionarioCard,
              { borderLeftColor: cuestionario.color }
            ]}
            onPress={() => setScreen(cuestionario.screen, { userId })}
          >
            <Text style={styles.tituloBoton}>{cuestionario.titulo}</Text>
            <Text style={styles.fraseBoton}>{cuestionario.frase}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setScreen('Inicio')}
      >
        <MaterialIcons name="arrow-back" size={20} color="white" />
        <Text style={styles.backButtonText}>Volver al Inicio</Text>
      </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  scrollContainer: {
    paddingBottom: 20
  },
  tituloPrincipal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 16
  },
  subtitulo: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 24
  },
  cuestionarioCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2
  },
  tituloBoton: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8
  },
  fraseBoton: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic'
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6200EE',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
});

export default Encuestas;