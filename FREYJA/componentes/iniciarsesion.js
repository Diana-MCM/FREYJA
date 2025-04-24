import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { getDatabase, ref, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
//import GestionMedicamentos from './GestionMedicamentos';

const PantallaInicio = ({ setScreen, nombreUsuario }) => {
  // Comentado todo lo relacionado con medicamentos
  // const [showMedicamentos, setShowMedicamentos] = useState(false);
  // const [listaMedicamentos, setListaMedicamentos] = useState([]);

  // const cargarMedicamentos = async () => {
  //   try {
  //     const auth = getAuth();
  //     const user = auth.currentUser;
      
  //     if (user) {
  //       const db = getDatabase();
  //       const snapshot = await get(ref(db, `usuarios/${user.uid}/medicamentos`));
        
  //       if (snapshot.exists()) {
  //         const medicamentosData = snapshot.val();
          
  //         const medicamentosArray = Object.keys(medicamentosData).map(key => ({
  //           id: key,
  //           ...medicamentosData[key]
  //         }));
  //         setListaMedicamentos(medicamentosArray);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error al cargar medicamentos:", error);
  //   }
  // };

  useEffect(() => {
    // cargarMedicamentos();
  }, []);

  const verificarUsuarios = async () => {
    try {
      const db = getDatabase();
      const snapshot = await get(ref(db, 'usuarios'));
      const usuarios = snapshot.val();
      
      if (!usuarios) {
        Alert.alert("Info", "No hay usuarios registrados");
        return;
      }
  
      const listaUsuarios = Object.entries(usuarios).map(([uid, user]) => (
        `• ${user.nombre} (${user.email})\nRegistrado: ${new Date(user.fechaRegistro).toLocaleDateString()}`
      )).join('\n\n');
  
      Alert.alert(
        "Usuarios Registrados",
        listaUsuarios,
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los usuarios");
      console.error("Error fetching users:", error);
    }
  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: 'rgba(157, 190, 187, 0.7)',
      padding: 20
    }}>
      <TouchableOpacity 
        onPress={() => setScreen('VistaDatos')}
        style={styles.botonPerfil}
      >
        <Icon name="account-circle" size={30} color="#243573" />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => setScreen('Busqueda')}
        style={styles.botonbusqueda}
      >
        <Icon name="search" size={30} color="#243573" />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => setScreen('ListaAmigos')}
        style={styles.botonamigos}
      >
        <Icon name="group" size={30} color="#243573" />
      </TouchableOpacity>

      <View style={styles.contenedorPrincipal}>
        <Text style={styles.tituloBienvenida}>
          Bienvenido {nombreUsuario}
        </Text>

        <View style={styles.contenidoCentrado}>
          {/* Comentado el botón de medicamentos
          <TouchableOpacity 
            onPress={() => setShowMedicamentos(true)}
            style={styles.botonMedicamentos}
          >
            <Icon name="medication" size={24} color="white" style={styles.iconoBoton} />
            <Text style={styles.textoBotonMedicamentos}>Agregar Medicamentos</Text>
          </TouchableOpacity> */}

          {/* Comentada la vista previa de medicamentos
          {listaMedicamentos.length > 0 ? (
            <View style={styles.vistaPreviaMedicamentos}>
              <Text style={styles.subtitulo}>Tus Medicamentos:</Text>
              {listaMedicamentos.slice(0, 3).map((item, index) => (
                <Text key={index} style={styles.itemMedicamento}>
                  • {item.nombre} - {item.dosis}
                </Text>
              ))}
              {listaMedicamentos.length > 3 && (
                <Text style={styles.masItems}>+ {listaMedicamentos.length - 3} más</Text>
              )}
            </View>
          ) : (
            <View style={styles.vistaPreviaMedicamentos}>
              <Text style={styles.subtitulo}>No tienes medicamentos registrados</Text>
            </View>
          )} */}
          <TouchableOpacity 
            style={styles.botonSubirInformacion}
            onPress={() => setScreen('Subirinformacion')}
          >
            <Icon name="upload" size={30} color="white" />
            <Text style={[styles.textoBotonAgregar, { color: "white" }]}>Subir informacion</Text>
          </TouchableOpacity>
          <View style={styles.contenedorBotones}>
            <View style={styles.botonContainer}>
              <Button
                title="Ver usuarios"
                onPress={verificarUsuarios}
                color="#6200ee"
              />
            </View>

            <View style={styles.botonContainer}>
              <Button
                title="Cerrar sesión"
                onPress={() => setScreen('IniciarSesion')}
                color="#FF6B6B"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// Mantenemos todos los estilos por si se necesitan más adelante
const styles = StyleSheet.create({
  contenedorPrincipal: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 20
  },
  tituloBienvenida: {
    fontSize: 30,
    marginBottom: 20,
    color: '#2E4053',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5
  },
  contenidoCentrado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50
  },
  botonContainer: {
    height: 40,
    width: 200,
    marginBottom: 15
  },
  contenedorBotones: {
    marginTop: 20
  },
  botonPerfil: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: '#F0F8FF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4682B4',
    zIndex: 1
  },
  botonamigos: {
    position: 'absolute',
    top: 40,
    right: 80,
    backgroundColor: '#F0F8FF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4682B4',
    zIndex: 1
  },
  botonMedicamentos: {
    backgroundColor: '#4682B4',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: '80%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4
  },
  iconoBoton: {
    marginRight: 10
  },
  textoBotonMedicamentos: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  vistaPreviaMedicamentos: {
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  botonbusqueda: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: '#F0F8FF',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4682B4',
    zIndex: 1
  },
  botonSubirInformacion: {
    flexDirection: 'row',
    backgroundColor: '#4f784f',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2E4053',
    textAlign: 'center'
  },
  itemMedicamento: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333'
  },
  masItems: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginTop: 5
  }
});

export default PantallaInicio;