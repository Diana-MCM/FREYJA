import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Citasmodal from './Citasmodal';

// Configuración de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Calendario = ({ setScreen, nombreUsuario }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    registerForPushNotificationsAsync();
    
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
  }

  // Actualiza la función schedulePushNotification
async function schedulePushNotification(appointment) {
  let reminderDate;
  
  // Calcular la fecha de recordatorio basada en el tipo seleccionado
  if (appointment.reminderType === 'preset') {
    const timeValue = parseInt(appointment.reminderTime) || 0;
    const timeUnit = appointment.reminderTime.replace(/[0-9]/g, '').trim();
    
    reminderDate = new Date(appointment.time);
    
    if (timeUnit.includes('minute')) {
      reminderDate.setMinutes(reminderDate.getMinutes() - timeValue);
    } else if (timeUnit.includes('hour')) {
      reminderDate.setHours(reminderDate.getHours() - timeValue);
    } else if (timeUnit.includes('day')) {
      reminderDate.setDate(reminderDate.getDate() - timeValue);
    }
  } else {
    // Usar la fecha personalizada directamente
    reminderDate = new Date(appointment.reminderDateTime);
  }

  const now = new Date();

  if (reminderDate > now) {
    console.log("✅ Programando recordatorio para:", reminderDate.toString());
    try {
      // Convertir a timestamp en segundos (requerido por Expo)
      const triggerTimestamp = Math.floor(reminderDate.getTime() / 1000);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Recordatorio de cita",
          body: `Tienes una cita: ${appointment.title}`,
          data: { appointmentId: appointment.id },
          sound: 'default',
        },
        trigger: {
          date: triggerTimestamp,
        },
      });
    } catch (error) {
      console.error("Error al programar notificación:", error);
      Alert.alert("Error", "No se pudo programar el recordatorio");
    }
  } else {
    console.log("⚠️ Recordatorio NO programado. Fecha ya pasó:", reminderDate.toString());
    Alert.alert("Aviso", "La fecha del recordatorio ya ha pasado");
  }
}

// Actualiza la función handleSaveAppointment
const handleSaveAppointment = async (newAppointment) => {
  const appointmentWithId = {
    ...newAppointment,
    id: Date.now().toString(),
    timeString: formatTime(newAppointment.time) // Asegúrate de incluir esto
  };
  
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
};

// Añade esta función de formato de hora si no existe
const formatTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
  const handleDeleteAppointment = async (id) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      setAppointments(prev => prev.filter(app => app.id !== id));
      Alert.alert('Éxito', 'Cita eliminada correctamente');
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
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
        selectedDate={selectedDate}
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
});

export default Calendario;