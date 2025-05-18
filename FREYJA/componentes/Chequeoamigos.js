import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import { Button,SafeAreaView  } from 'react-native';

const ChequeosAmigo = ({ route, setScreen }) => {
  const { amigoId, nombreAmigo } = route.params;
  const [chequeos, setChequeos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const db = getDatabase();
  const chequeosRef = ref(db, `usuarios/${amigoId}/chequeos`);

  const fetchChequeos = onValue(chequeosRef, (snapshot) => {
    const chequeosArray = [];
    snapshot.forEach(child => {
      chequeosArray.push({
        id: child.key,
        ...child.val()
      });
    });
    setChequeos(chequeosArray);
    setLoading(false);
  });

  return () => off(chequeosRef, 'value', fetchChequeos);
}, [amigoId]);

  const getRiskColor = (nivelRiesgo) => {
    switch(nivelRiesgo?.toLowerCase()) {
      case 'alto':
        return '#e74c3c';
      case 'moderado':
        return '#f39c12';
      case 'bajo':
        return '#27ae60';
      default:
        return '#3498db';
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.tarjetaChequeo}>
      <Text style={styles.fechaChequeo}>
        {new Date(item.fecha).toLocaleDateString()}
      </Text>
      <Text style={[styles.nivelRiesgo, { color: getRiskColor(item.nivelRiesgo) }]}>
        Nivel de riesgo: {item.nivelRiesgo}
      </Text>
      <Text style={styles.detalleChequeo}>Puntaje: {item.puntaje}</Text>
      {item.recomendacion && (
        <Text style={styles.recomendacion}>{item.recomendacion}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f9fc' }}>
    <View style={styles.container}>
      <Text style={styles.titulo}>Chequeos de {nombreAmigo}</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      ) : chequeos.length === 0 ? (
        <Text style={styles.sinChequeos}>No hay chequeos registrados</Text>
      ) : (
        <FlatList
          data={chequeos}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      <Button
        title="Volver"
        onPress={() => setScreen('ListaAmigos')}
        color="#3498db"
      />
    </View>
   </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor:' #7193ad',
  },
  listContainer: {
    paddingBottom: 20,
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  tarjetaChequeo: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fechaChequeo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    marginBottom: 5,
  },
  nivelRiesgo: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  detalleChequeo: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 5,
  },
  recomendacion: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#7f8c8d',
    marginTop: 5,
  },
  sinChequeos: {
    textAlign: 'center',
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChequeosAmigo;