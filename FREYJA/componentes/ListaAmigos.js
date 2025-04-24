import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { getDatabase, ref, onValue, off, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Button } from 'react-native';

const ListaAmigos = ({ setScreen }) => {
  const [amigos, setAmigos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión primero");
      setLoading(false);
      return;
    }

    const db = getDatabase();
    const amigosRef = ref(db, `usuarios/${user.uid}/amigos`);
    
    const fetchAmigos = onValue(amigosRef, (snapshot) => {
      const amigosData = snapshot.val();
      if (amigosData) {
        const listaAmigos = Object.keys(amigosData).map(key => ({
          id: key,
          ...amigosData[key]
        }));
        setAmigos(listaAmigos);
      } else {
        setAmigos([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error al cargar amigos:", error);
      setLoading(false);
    });

    return () => off(amigosRef, 'value', fetchAmigos);
  }, []);

  const eliminarAmigo = async (amigoId) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "Debes iniciar sesión primero");
        return;
      }

      const db = getDatabase();
      const updates = {};
      updates[`usuarios/${user.uid}/amigos/${amigoId}`] = null;
      
      await update(ref(db), updates);
      Alert.alert("Amigo eliminado", "El amigo ha sido eliminado de tu lista");
    } catch (error) {
      console.error("Error al eliminar amigo:", error);
      Alert.alert("Error", "No se pudo eliminar al amigo");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.tarjetaAmigo}>
      <View style={styles.infoAmigo}>
        <Text style={styles.nombreAmigo}>{item.nombre}</Text>
        <Text style={styles.userIdAmigo}>ID: {item.userId}</Text>
        <Text style={styles.fechaAgregado}>
          Agregado: {new Date(item.fechaAgregado).toLocaleDateString()}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.botonEliminar}
        onPress={() => eliminarAmigo(item.id)}
      >
        <Icon name="delete" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
         <SafeAreaView>
      <Text style={styles.titulo}>Mis Amigos</Text>
      
      {loading ? (
        <Text style={styles.cargando}>Cargando lista de amigos...</Text>
      ) : amigos.length === 0 ? (
        <Text style={styles.sinAmigos}>No tienes amigos agregados todavía</Text>
      ) : (
        <FlatList
          data={amigos}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.lista}
        />
      )}

      <TouchableOpacity 
        style={styles.botonBuscar}
        onPress={() => setScreen('Busqueda')}
      >
        <Icon name="person-search" size={20} color="white" />
        <Text style={styles.textoBotonBuscar}>Buscar Amigos</Text>
      </TouchableOpacity>
      
      <Button
        title="Volver a Inicio"
        onPress={() => setScreen('Inicio')}
        color="#757575"
      />
         </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5'
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center'
  },
  cargando: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#757575'
  },
  sinAmigos: {
    textAlign: 'center',
    marginVertical: 20,
    color: '#757575',
    fontSize: 16
  },
  lista: {
    paddingBottom: 20
  },
  tarjetaAmigo: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  infoAmigo: {
    flex: 1
  },
  nombreAmigo: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3,
    color: '#2E4053'
  },
  userIdAmigo: {
    fontSize: 14,
    color: '#1E88E5',
    marginBottom: 3
  },
  fechaAgregado: {
    fontSize: 12,
    color: '#757575'
  },
  botonEliminar: {
    backgroundColor: '#F44336',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10
  },
  botonBuscar: {
    flexDirection: 'row',
    backgroundColor: '#6200EE',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15
  },
  textoBotonBuscar: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default ListaAmigos;