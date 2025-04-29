// componentes/Calendario.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Button, Modal, Keyboard,TouchableWithoutFeedback,ScrollView,Platform,SafeAreaView,Alert} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ref, get, set, remove } from 'firebase/database';
import { auth, db } from '../firebase/firebase';
import * as Notifications from 'expo-notifications';

// Configurar notificaciones
const setupNotifications = async () => {
  await Notifications.requestPermissionsAsync();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
};

const Calendario = ({ setScreen, nombreUsuario }) => {
  // Estados del componente
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    time: new Date(),
    description: '',
    reminder: true
  });

  // Formatear fecha como YYYY-MM-DD
  const formatDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Formatear hora como HH:MM
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Navegación entre meses
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Guardar cita en Firebase
  const saveAppointmentToFirebase = async (userId, dateKey, appointment) => {
    try {
      const appointmentRef = ref(db, `usuarios/${userId}/calendario/${dateKey}`);
      const existingAppointments = appointments[dateKey] || [];
      await set(appointmentRef, [...existingAppointments, appointment]);
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar la cita");
      console.error("Error saving appointment:", error);
    }
  };

  // Cargar citas desde Firebase
  const loadAppointmentsFromFirebase = async (userId) => {
    try {
      const appointmentsRef = ref(db, `usuarios/${userId}/calendario`);
      const snapshot = await get(appointmentsRef);
      return snapshot.exists() ? snapshot.val() : {};
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las citas");
      console.error("Error loading appointments:", error);
      return {};
    }
  };

  // Eliminar cita de Firebase
  const deleteAppointmentFromFirebase = async (userId, dateKey, appointmentId) => {
    try {
      const appointmentsRef = ref(db, `usuarios/${userId}/calendario/${dateKey}`);
      const updatedAppointments = appointments[dateKey].filter(app => app.id !== appointmentId);
      
      if (updatedAppointments.length === 0) {
        await remove(appointmentsRef);
      } else {
        await set(appointmentsRef, updatedAppointments);
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo eliminar la cita");
      console.error("Error deleting appointment:", error);
    }
  };

  // Programar notificación
  const scheduleNotification = async (appointmentDate, title) => {
    try {
      const reminderDate = new Date(appointmentDate);
      reminderDate.setDate(reminderDate.getDate() - 1); // Notificar 1 día antes
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Recordatorio de cita",
          body: `Tienes una cita mañana: ${title}`,
          data: { url: 'freyja://calendar' },
        },
        trigger: {
          date: reminderDate,
        },
      });
    } catch (error) {
      console.error("Error scheduling notification:", error);
    }
  };

  // Cargar citas al montar el componente
  useEffect(() => {
    setupNotifications(); // Agregar esta línea
    
    const fetchAppointments = async () => {
      const userId = auth.currentUser?.uid;
      if (userId) {
        const loadedAppointments = await loadAppointmentsFromFirebase(userId);
        setAppointments(loadedAppointments);
      }
    };

    fetchAppointments();
  }, []);

  // Renderizar encabezado del mes
  const renderHeader = () => {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                       "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButtonContainer}>
          <Text style={styles.navButton}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButtonContainer}>
          <Text style={styles.navButton}>{'>'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Renderizar nombres de días de la semana
  const renderDayNames = () => {
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return (
      <View style={styles.dayNamesContainer}>
        {dayNames.map((day) => (
          <View key={day} style={styles.dayNameContainer}>
            <Text style={styles.dayName}>{day}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Renderizar los días del mes
  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
  
    // Ajustar para que la semana comience en Lunes (0=Lunes, 6=Domingo)
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6; // Si es Domingo (0-1=-1), lo convertimos a 6
  
    const days = [];
    const totalDays = lastDay.getDate();
  
    // Crear celdas vacías al inicio
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<View key={`empty-start-${i}`} style={styles.emptyDay} />);
    }
  
    // Crear celdas para los días del mes
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      const dayAppointments = appointments[dateKey] || [];
  
      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={styles.day}
          onPress={() => {
            setSelectedDate(dateKey);
            setNewAppointment({
              title: '',
              time: new Date(date.setHours(12, 0)),
              description: '',
              reminder: true
            });
            setModalVisible(true);
          }}
        >
          <Text style={styles.dayNumber}>{day}</Text>
          {dayAppointments.length > 0 && (
            <View style={styles.appointmentIndicator}>
              <Text style={styles.appointmentIndicatorText}>{dayAppointments.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }
  
    // Crear celdas vacías al final
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<View key={`empty-end-${i}`} style={styles.emptyDay} />);
    }
  
    // Dividir los días en filas de 7 días
    const rows = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(
        <View key={`row-${i}`} style={styles.weekRow}>
          {days.slice(i, i + 7)}
        </View>
      );
    }
  
    return <View style={styles.daysContainer}>{rows}</View>;
  };

  // Manejar cambio de hora
  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setNewAppointment({...newAppointment, time: selectedTime});
    }
  };

  // Guardar cita
  const saveAppointment = async () => {
    if (!newAppointment.title.trim()) {
      Alert.alert("Error", "Por favor ingresa un título para la cita");
      return;
    }

    if (!selectedDate) {
      Alert.alert("Error", "No se ha seleccionado una fecha");
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "No se pudo identificar al usuario");
        return;
      }

      const appointmentWithTime = {
        ...newAppointment,
        id: Date.now().toString(),
        timeString: formatTime(newAppointment.time),
        date: selectedDate
      };

      // Actualizar estado local
      const updatedAppointments = {
        ...appointments,
        [selectedDate]: [...(appointments[selectedDate] || []), appointmentWithTime]
      };
      setAppointments(updatedAppointments);

      // Guardar en Firebase
      await saveAppointmentToFirebase(userId, selectedDate, appointmentWithTime);

      // Programar notificación si está activado
      if (newAppointment.reminder) {
        const appointmentDate = new Date(selectedDate);
        appointmentDate.setHours(newAppointment.time.getHours(), newAppointment.time.getMinutes());
        await scheduleNotification(appointmentDate, newAppointment.title);
      }

      setModalVisible(false);
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error al guardar la cita");
      console.error("Error saving appointment:", error);
    }
  };

  // Eliminar cita
  const deleteAppointment = async (dateKey, appointmentId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "No se pudo identificar al usuario");
        return;
      }

      // Actualizar estado local
      const updatedAppointments = {
        ...appointments,
        [dateKey]: appointments[dateKey].filter(app => app.id !== appointmentId)
      };
      
      if (updatedAppointments[dateKey].length === 0) {
        delete updatedAppointments[dateKey];
      }
      
      setAppointments(updatedAppointments);

      // Eliminar de Firebase
      await deleteAppointmentFromFirebase(userId, dateKey, appointmentId);

      // Cancelar notificación (si se implementara)
      // await cancelNotification(appointmentId);
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error al eliminar la cita");
      console.error("Error deleting appointment:", error);
    }
  };

  // Renderizar modal de citas
  const renderAppointmentsModal = () => {
    const dayAppointments = selectedDate ? (appointments[selectedDate] || []) : [];
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          Keyboard.dismiss();
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Citas para el {selectedDate}</Text>
              
              {/* Lista de citas existentes */}
              <ScrollView style={styles.appointmentsListContainer}>
                {dayAppointments.map((item) => (
                  <View key={item.id} style={styles.appointmentItem}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.appointmentTime}>{item.timeString}</Text>
                      <Text style={styles.appointmentTitle}>{item.title}</Text>
                      <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => deleteAppointment(selectedDate, item.id)}
                      >
                        <Text style={styles.deleteButtonText}>X</Text>
                      </TouchableOpacity>
                    </View>
                    {item.description && (
                      <Text style={styles.appointmentDescription}>{item.description}</Text>
                    )}
                    <Text style={styles.reminderText}>
                      {item.reminder ? 'Recordatorio activado' : 'Sin recordatorio'}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              
              <Text style={styles.sectionTitle}>Agregar Nueva Cita</Text>
              
              <ScrollView 
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Título de la cita*"
                  value={newAppointment.title}
                  onChangeText={(text) => setNewAppointment({...newAppointment, title: text})}
                  returnKeyType="next"
                />
                
                <TouchableOpacity 
                  style={styles.timePickerButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowTimePicker(true);
                  }}
                >
                  <Text>Hora: {formatTime(newAppointment.time)}</Text>
                </TouchableOpacity>
                
                {showTimePicker && (
                  <DateTimePicker
                    value={newAppointment.time}
                    mode="time"
                    display="default"
                    onChange={handleTimeChange}
                  />
                )}
                
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Descripción (opcional)"
                  value={newAppointment.description}
                  onChangeText={(text) => setNewAppointment({...newAppointment, description: text})}
                  multiline
                  blurOnSubmit={true}
                />
                
                <View style={styles.reminderContainer}>
                  <Text style={styles.reminderLabel}>Recordatorio 1 día antes:</Text>
                  <TouchableOpacity
                    onPress={() => setNewAppointment({...newAppointment, reminder: !newAppointment.reminder})}
                    style={styles.reminderToggle}
                  >
                    <View style={[
                      styles.toggleCircle,
                      newAppointment.reminder ? styles.toggleOn : styles.toggleOff
                    ]} />
                  </TouchableOpacity>
                </View>
              </ScrollView>
              
              <View style={styles.modalButtons}>
                <Button 
                  title="Guardar Cita" 
                  onPress={saveAppointment} 
                  color="#A89CC8"
                />
                <Button 
                  title="Cerrar" 
                  onPress={() => {
                    setModalVisible(false);
                    Keyboard.dismiss();
                  }} 
                  color="#999"
                />
              </View>
            </View>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Calendario de {nombreUsuario}</Text>
      
      {renderHeader()}
      {renderDayNames()}
      {renderDays()}
      
      {renderAppointmentsModal()}
      
      <Button 
        title="Volver al Inicio" 
        onPress={() => setScreen('Inicio')} 
        color="#050505"
      />
    </SafeAreaView>
  );
};

// Estilos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(172, 163, 247, 0.89)',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  dayNameContainer: {
    width: '14%',
    alignItems: 'center',
  },
  dayName: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#555',
    fontSize: 14,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  day: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 5,
    margin: 1,
    paddingTop: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  emptyDay: {
    width: '14%',
    aspectRatio: 1,
    margin: 1,
    backgroundColor: 'transparent',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  navButtonContainer: {
    padding: 10,
  },
  navButton: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#050505',
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  dayNames: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayName: {
    width: 40,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#555',
  },
  daysContainer: {
    flexDirection: 'column',
    marginTop: 10,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  day: {
    width: '13%', // Ajusta para que quepan 7 días en una fila
    aspectRatio: 1, // Hace que las celdas sean cuadradas
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 5,
    margin: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  emptyDay: {
    width: '13%',
    aspectRatio: 1,
    margin: 2,
    backgroundColor: 'transparent',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  appointmentIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#A89CC8',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appointmentIndicatorText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    maxHeight: '80%',
  },
  scrollContent: {
    paddingHorizontal: 10,
  },
  appointmentsListContainer: {
    maxHeight: 150,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#A89CC8',
    paddingTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#555',
  },
  appointmentItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    marginBottom: 8,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  appointmentTime: {
    fontWeight: 'bold',
    marginRight: 10,
    color: '#A89CC8',
    width: 60,
  },
  appointmentTitle: {
    flex: 1,
    fontWeight: 'bold',
  },
  appointmentDescription: {
    color: '#666',
    fontSize: 14,
    marginLeft: 70,
    marginTop: 5,
  },
  reminderText: {
    fontSize: 12,
    color: '#888',
    marginLeft: 70,
    marginTop: 3,
    fontStyle: 'italic',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  reminderLabel: {
    flex: 1,
    color: '#555',
  },
  reminderToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
  },
  toggleOn: {
    alignSelf: 'flex-end',
    backgroundColor: '#A89CC8',
  },
  toggleOff: {
    alignSelf: 'flex-start',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingBottom: 10,
  },
});

export default Calendario;