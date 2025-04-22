import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet } from 'react-native';
import { getDatabase, ref, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const VistaDatos = ({ setScreen }) => {
  const [datosUsuario, setDatosUsuario] = useState({
    nombrecompleto: '',
    edad: '',
    genero: '',
    estatura: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        
        if (!user) {
          Alert.alert("Error", "Debes iniciar sesión primero");
          setLoading(false);
          return;
        }

        const db = getDatabase();
        const userRef = ref(db, `usuarios/${user.uid}`);
        const snapshot = await get(userRef);

        const personalDataRef = ref(db, `usuarios/${user.uid}/datos_personales`);
        const personalDataSnapshot = await get(personalDataRef);

        if (snapshot.exists() || personalDataSnapshot.exists()) {
            const userData = snapshot.exists() ? snapshot.val() : {};
            const personalData = personalDataSnapshot.exists() ? personalDataSnapshot.val() : {};

          setDatosUsuario({
            nombrecompleto: personalData.nombrecompleto || 'No registrado',
            userId: userData.userId || 'No asignado',
            edad: personalData.edad || 'No registrado',
            genero: personalData.genero || 'No registrado',
            estatura: personalData.estatura ? `${personalData.estatura} cm` : 'No registrado'
          });
        } else {
          Alert.alert("Información", "No se encontraron datos personales");
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        Alert.alert("Error", "No se pudieron cargar los datos");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tus Datos Personales</Text>
      
      <View style={styles.datosContainer}>
        <Text style={styles.label}>Nombre Completo:</Text>
        <Text style={styles.dato}>{datosUsuario.nombrecompleto}</Text>

        <Text style={styles.label}>Tu ID de usuario:</Text>
        <Text style={[styles.dato, styles.userId]}>{datosUsuario.userId}</Text>
        
        <Text style={styles.label}>Edad:</Text>
        <Text style={styles.dato}>{datosUsuario.edad}</Text>
        
        <Text style={styles.label}>Género:</Text>
        <Text style={styles.dato}>{datosUsuario.genero}</Text>
        
        <Text style={styles.label}>Estatura:</Text>
        <Text style={styles.dato}>{datosUsuario.estatura}</Text>
      </View>

      <Button
        title="Volver al Inicio"
        onPress={() => setScreen('Inicio')}
        color="#4682B4"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F8FF' 
  },
  datosContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    marginBottom: 20
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2E4053'
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#2E4053'
  },
  dato: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8FF'
  }
});

export default VistaDatos;