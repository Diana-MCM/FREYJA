import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator,Button } from 'react-native';
import { getDatabase, ref, query, orderByChild, equalTo, onValue, off } from 'firebase/database';
import { app } from '../firebase/firebase';

const db = getDatabase(app);

const HistorialChequeos = ({ userId,setScreen}) => {
  const [chequeos, setChequeos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Consulta para obtener solo los chequeos del usuario actual
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

    // Escuchar cambios en tiempo real
    const unsubscribe = onValue(chequeosRef, onDataChange, onError);

    // Limpiar suscripción al desmontar
    return () => off(chequeosRef, 'value', onDataChange);
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.titulo}>Historial de Chequeos</Text>
      
      {chequeos.length === 0 ? (
        <Text style={styles.sinResultados}>No hay chequeos registrados</Text>
      ) : (
        chequeos.map(chequeo => (
          <View key={chequeo.id} style={[
            styles.chequeoCard,
            { borderLeftColor: getColorByRisk(chequeo.nivelRiesgo) }
          ]}>
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
          </View>
        ))
      )}
      <Button
            title="Volver al Inicio"
            onPress={() => setScreen('Inicio')}
            color="#757575"
      />
    </ScrollView>
    
  );
};

// Función auxiliar para colores según riesgo
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
    padding: 20,
    backgroundColor: '#f5f5f5'
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
  }
});

export default HistorialChequeos;