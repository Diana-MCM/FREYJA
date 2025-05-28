import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Citasmodal from './Citasmodal';
import { ref, get, set, remove } from 'firebase/database';
import { auth, db } from '../firebase/firebase';

// Configuración de notificaciones
const notificationHandler = {
  handleNotification: async () => {
    const behavior = {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
    
    if (Platform.OS === 'ios' && Platform.Version >= 14) {
      return {
        ...behavior,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    }
    
    return behavior;
  },
};

Notifications.setNotificationHandler(notificationHandler);

const Calendario = ({ setScreen, nombreUsuario }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [appointments, setAppointments] = useState([]);

  // Cargar citas desde Firebase
  const loadAppointmentsFromFirebase = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const appointmentsRef = ref(db, `usuarios/${userId}/calendario`);
      const snapshot = await get(appointmentsRef);
      
      if (snapshot.exists()) {
        const allAppointments = [];
        Object.entries(snapshot.val()).forEach(([dateKey, dateAppointments]) => {
          dateAppointments.forEach(appointment => {
            allAppointments.push({
              ...appointment,
              time: new Date(appointment.time),
              reminderDateTime: new Date(appointment.reminderDateTime)
            });
          });
        });
        setAppointments(allAppointments);
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
      Alert.alert("Error", "No se pudieron cargar las citas");
    }
  };

  // Guardar cita en Firebase
  const saveAppointmentToFirebase = async (appointment) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "No se pudo identificar al usuario");
        return;
      }

      const dateKey = formatDateKey(appointment.time);
      const appointmentRef = ref(db, `usuarios/${userId}/calendario/${dateKey}`);
      
      // Obtener citas existentes para esta fecha
      const existingAppointments = appointments.filter(app => 
        formatDateKey(app.time) === dateKey
      );
      
      // Convertir fechas a strings para Firebase
      const appointmentForFirebase = {
        ...appointment,
        time: appointment.time.toISOString(),
        reminderDateTime: appointment.reminderDateTime.toISOString()
      };
      
      await set(appointmentRef, [...existingAppointments.map(app => ({
        ...app,
        time: app.time.toISOString(),
        reminderDateTime: app.reminderDateTime.toISOString()
      })), appointmentForFirebase]);
      
      return true;
    } catch (error) {
      console.error("Error saving appointment:", error);
      Alert.alert("Error", "No se pudo guardar la cita");
      return false;
    }
  };

  // Eliminar cita de Firebase
  const deleteAppointmentFromFirebase = async (appointmentId) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert("Error", "No se pudo identificar al usuario");
        return false;
      }

      const appointment = appointments.find(app => app.id === appointmentId);
      if (!appointment) return false;

      const dateKey = formatDateKey(appointment.time);
      const appointmentRef = ref(db, `usuarios/${userId}/calendario/${dateKey}`);
      
      // Obtener citas existentes para esta fecha y filtrar
      const updatedAppointments = appointments
        .filter(app => formatDateKey(app.time) === dateKey && app.id !== appointmentId)
        .map(app => ({
          ...app,
          time: app.time.toISOString(),
          reminderDateTime: app.reminderDateTime.toISOString()
        }));
      
      if (updatedAppointments.length === 0) {
        await remove(appointmentRef);
      } else {
        await set(appointmentRef, updatedAppointments);
      }
      
      return true;
    } catch (error) {
      console.error("Error deleting appointment:", error);
      Alert.alert("Error", "No se pudo eliminar la cita");
      return false;
    }
  };

  useEffect(() => {
    registerForPushNotificationsAsync();
    loadAppointmentsFromFirebase();
    
    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificación recibida:', notification);
    });

    return () => subscription.remove();
  }, []);

  async function registerForPushNotificationsAsync() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('Error', 'No se otorgaron permisos para notificaciones');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  }

  async function schedulePushNotification(appointment) {
    let reminderDate;
    
    if (appointment.reminderType === 'preset') {
      const timeValue = parseInt(appointment.reminderTime) || 0;
      const timeUnit = appointment.reminderTime.replace(/[0-9]/g, '').trim();
      
      reminderDate = new Date(appointment.time.getTime());
      
      if (timeUnit.includes('minute')) {
        reminderDate.setMinutes(reminderDate.getMinutes() - timeValue);
      } else if (timeUnit.includes('hour')) {
        reminderDate.setHours(reminderDate.getHours() - timeValue);
      } else if (timeUnit.includes('day')) {
        reminderDate.setDate(reminderDate.getDate() - timeValue);
      }
    } else {
      reminderDate = new Date(appointment.reminderDateTime.getTime());
    }

    const timezoneOffset = reminderDate.getTimezoneOffset() * 60000;
    const localReminderDate = new Date(reminderDate.getTime() - timezoneOffset);
    
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);

    if (localReminderDate > localNow) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Recordatorio de cita",
            body: `Tienes una cita: ${appointment.title}`,
            data: { appointmentId: appointment.id },
            sound: 'default',
          },
          trigger: {
            date: localReminderDate,
          },
        });
      } catch (error) {
        console.error("Error al programar notificación:", error);
        Alert.alert("Error", "No se pudo programar el recordatorio");
      }
    } else {
      Alert.alert("Aviso", "La fecha del recordatorio ya ha pasado");
    }
  }

  const handleSaveAppointment = async (newAppointment) => {
    const appointmentWithId = {
      ...newAppointment,
      id: Date.now().toString(),
      timeString: formatTime(newAppointment.time),
      time: new Date(newAppointment.time),
      reminderDateTime: new Date(newAppointment.reminderDateTime)
    };
    
    try {
      const savedToFirebase = await saveAppointmentToFirebase(appointmentWithId);
      if (!savedToFirebase) return;

      setAppointments(prev => [...prev, appointmentWithId]);
      setModalVisible(false);
      
      if (newAppointment.reminder) {
        try {
          await schedulePushNotification(appointmentWithId);
          Alert.alert('Éxito', 'Cita y recordatorio guardados correctamente');
        } catch (error) {
          console.error("Error al programar notificación:", error);
          Alert.alert('Éxito', 'Cita guardada, pero hubo un error con el recordatorio');
        }
      } else {
        Alert.alert('Éxito', 'Cita guardada correctamente');
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      Alert.alert('Error', 'No se pudo guardar la cita');
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDeleteAppointment = async (id) => {
    try {
      // Cancelar la notificación asociada
      const appointment = appointments.find(app => app.id === id);
      if (appointment) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      
      const deletedFromFirebase = await deleteAppointmentFromFirebase(id);
      if (!deletedFromFirebase) return;
      
      setAppointments(prev => prev.filter(app => app.id !== id));
      Alert.alert('Éxito', 'Cita eliminada correctamente');
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
      Alert.alert('Error', 'No se pudo eliminar la cita');
    }
  };

  const formatDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const createFullDate = (dateString, time) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    newDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
    return newDate;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const renderHeader = () => {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                       "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return (
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButtonContainer}>
          <MaterialIcons name="chevron-left" size={28} color="#6200EE" />
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Text>
        <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButtonContainer}>
          <MaterialIcons name="chevron-right" size={28} color="#6200EE" />
        </TouchableOpacity>
      </View>
    );
  };

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
      const isToday = date.toDateString() === new Date().toDateString();
      const dayAppointments = appointments.filter(app => 
        formatDateKey(app.time) === dateKey
      );
  
      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.day, 
            isToday && styles.todayDay
          ]}
          onPress={() => {
            setSelectedDate(dateKey);
            setModalVisible(true);
          }}
        >
          <Text style={[
            styles.dayNumber,
            isToday && styles.todayDayNumber
          ]}>
            {day}
          </Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Calendario de {nombreUsuario}</Text>
      </View>
      
      {renderHeader()}
      {renderDayNames()}
      {renderDays()}
      
      <Citasmodal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)}
        selectedDate={selectedDate ? new Date(selectedDate) : null}
        appointments={appointments.filter(app => {
          const appDate = new Date(app.time);
          return formatDateKey(appDate) === selectedDate;
        })}
        onSaveAppointment={(appointment) => {
          const fullDate = createFullDate(selectedDate, appointment.time);
          const fullReminder = new Date(appointment.reminderDateTime);
          handleSaveAppointment({
            ...appointment,
            time: fullDate,
            reminderDateTime: fullReminder,
          });
        }}
        onDeleteAppointment={handleDeleteAppointment}
      />
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setScreen('Inicio')}
      >
        <MaterialIcons name="arrow-back" size={20} color="white" />
        <Text style={styles.backButtonText}>Volver al Inicio</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(171, 163, 247, 0.89)',
  },
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  dayNamesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  dayNameContainer: {
    width: '14%',
    alignItems: 'center',
  },
  dayName: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#555',
    fontSize: 14,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  day: {
    width: '14%',
    aspectRatio: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  todayDay: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#6200EE',
  },
  todayDayNumber: {
    color: '#6200EE',
    fontWeight: 'bold',
  },
  emptyDay: {
    width: '14%',
    aspectRatio: 1,
    margin: 1,
    backgroundColor: 'transparent',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  navButtonContainer: {
    padding: 8,
  },
  monthText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  daysContainer: {
    flexDirection: 'column',
    marginTop: 8,
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
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  appointmentIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#6200EE',
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
});

export default Calendario;