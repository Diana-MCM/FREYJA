import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, StyleSheet, TouchableOpacity,ImageBackground } from 'react-native';
import { getDatabase, ref, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth } from '../firebase/firebase';
import Modal from "react-native-modal";
import { onValue } from 'firebase/database';
import Subirinformacion from './Subirinformacion';
import GestionMedicamentos from './GestionMedicamentos';
import imagenFondo from './imagenes/Freyjaa.png';

const PantallaInicio = ({ setScreen, nombreUsuario, cerrarSesion  }) => {
  const [modalVisible, setModalVisible] = useState(false); // Estado para controlar el modal
  const abrirModal = () => setModalVisible(true);
  const cerrarModal = () => setModalVisible(false);
  const [tieneNotificaciones, setTieneNotificaciones] = useState(false);
  const [numeroNotificaciones, setNumeroNotificaciones] = useState(0);

  // Comentado todo lo relacionado con medicamentos
  const [showMedicamentos, setShowMedicamentos] = useState(false);
  const [listaMedicamentos, setListaMedicamentos] = useState([]);

  const cargarMedicamentos = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        const db = getDatabase();
        const snapshot = await get(ref(db, `usuarios/${user.uid}/medicamentos`)); 
        
        if (snapshot.exists()) {
          const medicamentosData = snapshot.val();
          const medicamentosArray = Object.keys(medicamentosData).map(key => ({
            id: key,
            ...medicamentosData[key]
          }));
          setListaMedicamentos(medicamentosArray);
        } else {
          setListaMedicamentos([]); // Limpiar si no hay datos
        }
      }
    } catch (error) {
      console.error("Error al cargar medicamentos:", error);
    }
  };

  useEffect(() => {
    cargarMedicamentos();
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error("Usuario no autenticado");
      return () => {};
    }

    const db = getDatabase();
    const notificacionesRef = ref(db, `usuarios/${user.uid}/notificaciones`);

    const unsubscribe = onValue(notificacionesRef, (snapshot) => {
      const data = snapshot.val();
      const totalNotificaciones = data ? Object.keys(data).length : 0;
      setNumeroNotificaciones(totalNotificaciones);
    });

    return () => unsubscribe();
  }, []);
  
  return (
    <ImageBackground 
      source={imagenFondo}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
    <View style={{ 
      flex: 1, 
      backgroundColor: 'rgba(171, 163, 247, 0.73)',
      padding: 20
    }}>
      <TouchableOpacity 
        onPress={abrirModal}
        style={styles.botonMenu}
      >
        <Icon name="menu" size={30} color="#243573" />
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onBackdropPress={cerrarModal}
        onRequestClose={cerrarModal}
        animationIn="slideInRight" // Animación de entrada desde la derecha
        animationOut="slideOutRight" // Animación de salida hacia la derecha
        backdropOpacity={0.5} // Opacidad del fondo oscuro
        useNativeDriver={true}
        style={styles.modalOverlay}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Menú</Text>

            <TouchableOpacity 
             style={styles.modalButton}
             onPress={() => {
              setScreen('VistaDatos');
              cerrarModal();
             }}
            >
            <Icon name="account-circle" size={20} color="white" style={styles.modalButtonIcon} />
            <Text style={styles.modalButtonText}>Ver Datos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
             style={styles.modalButton}
             onPress={() => {
              setScreen('Busqueda');
              cerrarModal();
             }}
            >
            <Icon name="search" size={20} color="white" style={styles.modalButtonIcon} />
            <Text style={styles.modalButtonText}>Buscar Amigos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
             style={styles.modalButton}
             onPress={() => {
              setScreen('Encuestas');
              cerrarModal();
             }}
            >
            <Icon name="assignment" size={20} color="white" style={styles.modalButtonIcon} />
            <Text style={styles.modalButtonText}>Encuesta</Text>
            </TouchableOpacity>

            <TouchableOpacity 
             style={styles.modalButton}
             onPress={() => {
              setScreen('Chequeo');
              cerrarModal();
             }}
            >
            <Icon name="list" size={20} color="white" style={styles.modalButtonIcon} />
            <Text style={styles.modalButtonText}>Revisar encuesta</Text>
            </TouchableOpacity>

            <TouchableOpacity 
             style={styles.modalButton}
             onPress={() => {
              setScreen('ListaAmigos');
              cerrarModal();
             }}
            >
            <Icon name="group" size={20} color="white" style={styles.modalButtonIcon} />
            <Text style={styles.modalButtonText}>Lista de Amigos</Text>
            </TouchableOpacity>

            <TouchableOpacity 
             style={styles.modalButton}
             onPress={() => {
              setScreen('Calendario');
              cerrarModal();
             }}
            >
            <Icon name="calendar-today" size={20} color="white" style={styles.modalButtonIcon} />
            <Text style={styles.modalButtonText}>Calendario</Text>
            </TouchableOpacity>

            <TouchableOpacity 
             style={styles.modalButton}
             onPress={() => {
              cerrarSesion();
              cerrarModal();
             }}
            >
            <Icon name="logout" size={20} color="white" style={styles.modalButtonIcon} />
            <Text style={styles.modalButtonText}>Cerrar Sesión</Text>
            </TouchableOpacity>

            <Button title="Cerrar Menú" onPress={cerrarModal} color="#FF6B6B" />
          </View>
        </View>
      </Modal>

      <TouchableOpacity 
        onPress={() => setScreen('Notificaciones')}
        style={styles.botonNotificaciones}
      >
        <Icon 
          name="notifications" 
          size={30} 
          color= "#243573" 
       />
        {numeroNotificaciones > 0 && (
          <View style={styles.indicadorNotificaciones}>
            <Text style={styles.textoIndicador}>{numeroNotificaciones}</Text>
          </View>
     )}
      </TouchableOpacity>
      <GestionMedicamentos
          visible={showMedicamentos}
          onClose={() => setShowMedicamentos(false)}
          onSave={(nuevaLista) => {
            setListaMedicamentos(nuevaLista);
            setShowMedicamentos(false);
          }}
      />
      <View style={styles.contenedorPrincipal}>
        <Text style={styles.tituloBienvenida}>
          Bienvenido {nombreUsuario}
        </Text>

        <View style={styles.contenidoCentrado}>
          <TouchableOpacity 
            onPress={() => setShowMedicamentos(true)}
            style={styles.botonMedicamentos}
          >
            <Icon name="medication" size={24} color="white" style={styles.iconoBoton} />
            <Text style={styles.textoBotonMedicamentos}>Agregar Medicamentos</Text>
          </TouchableOpacity>

          {listaMedicamentos.length > 0 ? (
            <View style={styles.vistaPreviaMedicamentos}>
              <Text style={styles.subtitulo}>Tus Medicamentos:</Text>
              {listaMedicamentos.slice(0, 3).map((item) => (
                <Text key={item.id} style={styles.itemMedicamento}>
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
          )}
  <View style={styles.contenedorBotones}>
  <View style={styles.botonContainer}>
    <Button
      title="Subir Información"
      onPress={() => setScreen('Subirinformacion')} // Cambia la pantalla a 'SubirInformacion'
      color="#6200ee"
              />
          <View style={styles.contenedorBotones}>
            <View style={styles.botonContainer}>
            </View>
            </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  </ImageBackground>
  );
};

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
  botonNotificaciones: {
    position: 'absolute',
    top: 40,
    right: 80,
    backgroundColor: 'transparent',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor:'transparent' ,
    zIndex: 1
  },
  botonMedicamentos: {
    backgroundColor: 	'#0033CC',
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
  },
  botonMenu: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'transparent',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    zIndex: 1,
  },
  modalOverlay: {
    flex: 1,
    margin: 0, 
    justifyContent: 'flex-start',
    alignItems: 'flex-end', 
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  },
  modalContent: {
    width: '70%',
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 60,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  modalButton: {
     flexDirection: 'row',
     alignItems: 'center',
     paddingVertical: 12,
     paddingHorizontal: 15,
     backgroundColor: '#6200EE',
     borderRadius: 10,
     marginBottom: 15,
  },
  modalButtonIcon: {
    marginRight: 15, 
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  botonNotificaciones: {
    position: 'absolute',
    top: 40,
    right: 80,
    backgroundColor: 'transparent',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    zIndex: 1,
  },
  indicadorNotificaciones: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoIndicador: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default PantallaInicio;