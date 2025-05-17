// componentes/Calendario.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Button, Modal, Keyboard, TouchableWithoutFeedback, ScrollView, Platform, SafeAreaView, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
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

// Opciones de recordatorio
const reminderOptions = [
  { label: 'No recordatorio', value: 'none' },
  { label: '30 minutos antes', value: '30 minutes' },
  { label: '1 hora antes', value: '1 hour' },
  { label: '3 horas antes', value: '3 hours' },
  { label: '6 horas antes', value: '6 hours' },
  { label: '1 día antes', value: '1 day' },
  { label: '2 días antes', value: '2 days' },
];

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
    reminder: true,
    reminderTime: '1 day' // Nueva propiedad para el tiempo de recordatorio
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

  // Programar notificación con tiempo personalizado
  const scheduleNotification = async (appointmentDate, title, reminderTime) => {
    try {
      const now = new Date();
      const appointment = new Date(appointmentDate);
      const reminderDate = new Date(appointment);
      
      // Calcular el recordatorio según la opción seleccionada
      const [value, unit] = reminderTime.split(' ');
      
      if (unit === 'minutes') {
        reminderDate.setMinutes(appointment.getMinutes() - parseInt(value));
      } else if (unit === 'hour' || unit === 'hours') {
        reminderDate.setHours(appointment.getHours() - parseInt(value));
      } else if (unit === 'day' || unit === 'days') {
        reminderDate.setDate(appointment.getDate() - parseInt(value));
      }
      
      // Verificar que el recordatorio sea en el futuro
      if (reminderDate <= now) {
        console.log("El recordatorio sería en el pasado");
        Alert.alert("Recordatorio no programado", "La hora del recordatorio ya pasó");
        return;
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Recordatorio de cita",
          body: `Próxima cita: ${title} (en ${reminderTime})`,
          data: { url: 'freyja://calendar' },
        },
        trigger: {
          date: reminderDate,
        },
      });
      
      console.log(`Notificación programada para: ${reminderDate}`);
    } catch (error) {
      console.error("Error programando notificación:", error);
      Alert.alert("Error", "No se pudo programar el recordatorio");
    }
  };

  // Cargar citas al montar el componente
  useEffect(() => {
    setupNotifications();
    
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
  
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6;
  
    const days = [];
    const totalDays = lastDay.getDate();
  
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<View key={`empty-start-${i}`} style={styles.emptyDay} />);
    }
  
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
              reminder: true,
              reminderTime: '1 day'
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
  
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<View key={`empty-end-${i}`} style={styles.emptyDay} />);
    }
  
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

      // Programar notificación si está activado y no es "none"
      if (newAppointment.reminder && newAppointment.reminderTime !== 'none') {
        const appointmentDate = new Date(selectedDate);
        appointmentDate.setHours(newAppointment.time.getHours(), newAppointment.time.getMinutes());
        await scheduleNotification(appointmentDate, newAppointment.title, newAppointment.reminderTime);
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
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error al eliminar la cita");
      console.error("Error deleting appointment:", error);
    }
  };

  // Renderizar selector de recordatorios
  const renderReminderPicker = () => (
  <View style={styles.reminderContainer}>
    <Text style={styles.reminderLabel}>Recordatorio:</Text>
    <View style={styles.pickerContainer}>
      <Picker
        selectedValue={newAppointment.reminderTime}
        onValueChange={(itemValue) => 
          setNewAppointment({...newAppointment, reminderTime: itemValue})
        }
        style={styles.picker}
        dropdownIconColor="#A89CC8"
        mode="dropdown" // Esto hace que en Android se vea como un dropdown
      >
        {reminderOptions.map(option => (
          <Picker.Item 
            key={option.value} 
            label={option.label} 
            value={option.value} 
          />
        ))}
      </Picker>
    </View>
  </View>
);
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
            
            <ScrollView style={styles.scrollContainer}>
              {/* Lista de citas existentes */}
              {dayAppointments.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Citas Programadas</Text>
                  <View style={styles.appointmentsListContainer}>
                    {dayAppointments.map((item) => (
                      <View key={item.id} style={styles.appointmentItem}>
                        {/* ... contenido existente ... */}
                      </View>
                    ))}
                  </View>
                </>
              )}
              
              <Text style={styles.sectionTitle}>Agregar Nueva recordatorio</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Título del recordatorio*"
                value={newAppointment.title}
                onChangeText={(text) => setNewAppointment({...newAppointment, title: text})}
              />
              
              <TouchableOpacity 
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text>Hora: {formatTime(newAppointment.time)}</Text>
              </TouchableOpacity>
              
              {showTimePicker && (
                <View style={styles.timePickerContainer}>
                  <DateTimePicker
                    value={newAppointment.time}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                    onChange={handleTimeChange}
                  />
                  {Platform.OS === 'ios' && (
                    <Button 
                      title="Seleccionar" 
                      onPress={() => setShowTimePicker(false)} 
                      color="#A89CC8"
                    />
                  )}
                </View>
              )}
              
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Descripción (opcional)"
                value={newAppointment.description}
                onChangeText={(text) => setNewAppointment({...newAppointment, description: text})}
                multiline
              />
              
              {renderReminderPicker()}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <Button 
                title="Guardar Cita" 
                onPress={saveAppointment} 
                color="#A89CC8"
              />
              <Button 
                title="Cerrar" 
                onPress={() => setModalVisible(false)} 
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
  daysContainer: {
    flexDirection: 'column',
    marginTop: 10,
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
  backgroundColor: '#FFF',
  borderRadius: 10,
  width: '90%',
  maxHeight: '80%',
  padding: 20,
  margin: 20,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
},
  reminderContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 15,
  paddingHorizontal: 5,
},
pickerWrapper: {
  flex: 2,
  borderWidth: 1,
  borderColor: '#CCC',
  borderRadius: 5,
  overflow: 'hidden', // Importante para contener el Picker
},
reminderPicker: {
  width: '100%',
  height: 50,
  backgroundColor: '#FFF',
},
timePickerContainer: {
  marginVertical: 10,
  backgroundColor: '#FFF',
  borderRadius: 5,
  padding: Platform.OS === 'ios' ? 10 : 0,
},
timePicker: {
  width: '100%',
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
    paddingHorizontal: 10,
  },
  reminderLabel: {
    flex: 1,
    color: '#555',
    fontSize: 16,
  },
  reminderPicker: {
    flex: 2,
    height: 50,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingBottom: 10,
  },
});

export default Calendario;