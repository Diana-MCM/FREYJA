import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal, Keyboard, Button, TouchableWithoutFeedback, ScrollView, Platform, SafeAreaView, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const reminderOptions = [
  { label: 'Sin recordatorio', value: 'none', icon: 'notifications-off' },
  { label: '30 minutos antes', value: '30 minutes', icon: 'access-time' },
  { label: '1 hora antes', value: '1 hour', icon: 'access-time' },
  { label: '3 horas antes', value: '3 hours', icon: 'access-time' },
  { label: '6 horas antes', value: '6 hours', icon: 'access-time' },
  { label: '1 día antes', value: '1 day', icon: 'today' },
  { label: '2 días antes', value: '2 days', icon: 'event' },
];

const CitasModal = ({ 
  visible, 
  onClose, 
  selectedDate, 
  appointments = [], 
  onSaveAppointment, 
  onDeleteAppointment 
}) => {
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    time: new Date(),
    description: '',
    reminder: true,
    reminderType: 'preset',
    reminderTime: '1 day',
    reminderDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReminderDateChange = (event, selectedDate) => {
    setShowReminderDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const currentTime = newAppointment.reminderDateTime;
      selectedDate.setHours(currentTime.getHours(), currentTime.getMinutes());
      setNewAppointment({...newAppointment, reminderDateTime: selectedDate});
    }
  };

  const handleReminderTimeChange = (event, selectedTime) => {
    setShowReminderTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const currentDate = newAppointment.reminderDateTime;
      currentDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setNewAppointment({...newAppointment, reminderDateTime: currentDate});
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setNewAppointment({...newAppointment, time: selectedTime});
    }
  };

  // Actualiza la función handleSave
const handleSave = () => {
  if (!newAppointment.title.trim()) {
    Alert.alert("Error", "Por favor ingresa un título para la cita");
    return;
  }

  // Calcular reminderDateTime para opciones predefinidas
  if (newAppointment.reminderType === 'preset' && newAppointment.reminderTime !== 'none') {
    const timeValue = parseInt(newAppointment.reminderTime) || 0;
    const timeUnit = newAppointment.reminderTime.replace(/[0-9]/g, '').trim();
    
    const reminderDate = new Date(newAppointment.time);
    
    if (timeUnit.includes('minute')) {
      reminderDate.setMinutes(reminderDate.getMinutes() - timeValue);
    } else if (timeUnit.includes('hour')) {
      reminderDate.setHours(reminderDate.getHours() - timeValue);
    } else if (timeUnit.includes('day')) {
      reminderDate.setDate(reminderDate.getDate() - timeValue);
    }
    
    newAppointment.reminderDateTime = reminderDate;
  }

  const appointmentToSave = {
    ...newAppointment,
    timeString: formatTime(newAppointment.time),
    id: Date.now().toString()
  };

  onSaveAppointment(appointmentToSave);
  
  // Restablecer el formulario
  setNewAppointment({
    title: '',
    time: new Date(),
    description: '',
    reminder: true,
    reminderType: 'preset',
    reminderTime: '1 day',
    reminderDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
  });
};
  const renderReminderPicker = () => (
    <View style={styles.reminderSection}>
      <Text style={styles.sectionSubtitle}>Configurar Recordatorio</Text>
      
      <View style={styles.reminderTypeContainer}>
        <TouchableOpacity 
          style={[
            styles.reminderTypeOption,
            newAppointment.reminderType === 'preset' && styles.reminderTypeOptionActive
          ]}
          onPress={() => setNewAppointment({...newAppointment, reminderType: 'preset'})}
        >
          <MaterialIcons 
            name="schedule" 
            size={20} 
            color={newAppointment.reminderType === 'preset' ? '#6200EE' : '#888'} 
          />
          <Text style={[
            styles.reminderTypeOptionText,
            newAppointment.reminderType === 'preset' && styles.reminderTypeOptionTextActive
          ]}>
            Predefinido
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.reminderTypeOption,
            newAppointment.reminderType === 'custom' && styles.reminderTypeOptionActive
          ]}
          onPress={() => setNewAppointment({...newAppointment, reminderType: 'custom'})}
        >
          <MaterialIcons 
            name="edit" 
            size={20} 
            color={newAppointment.reminderType === 'custom' ? '#6200EE' : '#888'} 
          />
          <Text style={[
            styles.reminderTypeOptionText,
            newAppointment.reminderType === 'custom' && styles.reminderTypeOptionTextActive
          ]}>
            Personalizado
          </Text>
        </TouchableOpacity>
      </View>

      {newAppointment.reminderType === 'preset' ? (
        <View style={styles.inputContainer}>
          <MaterialIcons name="notifications" size={20} color="#6200EE" style={styles.inputIcon} />
          <TouchableOpacity 
            style={styles.timeInput}
            onPress={() => setShowReminderPicker(!showReminderPicker)}
          >
            <Text style={styles.timeInputText}>
              {newAppointment.reminderTime === 'none' ? 
                'Sin recordatorio' : 
                `Recordatorio: ${reminderOptions.find(o => o.value === newAppointment.reminderTime)?.label}`
              }
            </Text>
          </TouchableOpacity>
          
          {showReminderPicker && (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={newAppointment.reminderTime}
                onValueChange={(itemValue) => {
                  setNewAppointment({...newAppointment, reminderTime: itemValue});
                  setShowReminderPicker(false);
                }}
                style={styles.picker}
                dropdownIconColor="#6200EE"
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
          )}
        </View>
      ) : (
        <View style={styles.customReminderContainer}>
          <View style={styles.inputContainer}>
            <MaterialIcons name="calendar-today" size={20} color="#6200EE" style={styles.inputIcon} />
            <TouchableOpacity 
              style={styles.timeInput}
              onPress={() => setShowReminderDatePicker(true)}
            >
              <Text style={styles.timeInputText}>
                {newAppointment.reminderDateTime.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            
            {showReminderDatePicker && (
              <DateTimePicker
                value={newAppointment.reminderDateTime}
                mode="date"
                display="default"
                onChange={handleReminderDateChange}
                minimumDate={new Date()}
                accentColor="#6200EE"
              />
            )}
          </View>
          
          <View style={styles.inputContainer}>
            <MaterialIcons name="access-time" size={20} color="#6200EE" style={styles.inputIcon} />
            <TouchableOpacity 
              style={styles.timeInput}
              onPress={() => setShowReminderTimePicker(true)}
            >
              <Text style={styles.timeInputText}>
                {newAppointment.reminderDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </Text>
            </TouchableOpacity>
            
            {showReminderTimePicker && (
              <DateTimePicker
                value={newAppointment.reminderDateTime}
                mode="time"
                display="default"
                onChange={handleReminderTimeChange}
                accentColor="#6200EE"
              />
            )}
          </View>
        </View>
      )}
    </View>
  );

 const formattedDate = selectedDate ? 
  selectedDate.toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  }) : '';

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {
        onClose();
        Keyboard.dismiss();
      }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Citas para {formattedDate}</Text>
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => {
                  onClose();
                  Keyboard.dismiss();
                }}
              >
                <MaterialIcons name="close" size={24} color="#6200EE" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.scrollContainer}>
              {appointments.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Citas Programadas</Text>
                  <View style={styles.appointmentsList}>
                    {appointments.map((item) => (
                      <View key={item.id} style={styles.appointmentCard}>
                        <View style={styles.appointmentHeader}>
                          <View style={styles.timeBadge}>
                            <Text style={styles.timeText}>{item.timeString}</Text>
                          </View>
                          <Text style={styles.appointmentTitle} numberOfLines={1}>{item.title}</Text>
                          <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => onDeleteAppointment(item.id)}
                          >
                            <MaterialIcons name="delete-outline" size={22} color="#FF6B6B" />
                          </TouchableOpacity>
                        </View>
                        
                        {item.description && (
                          <Text style={styles.appointmentDescription}>{item.description}</Text>
                        )}
                        
                        {item.reminder && (
                          <View style={styles.reminderBadge}>
                            <MaterialIcons 
                              name={item.reminderType === 'custom' ? 'notifications-active' : 'notifications'} 
                              size={16} 
                              color="#6200EE" 
                            />
                            <Text style={styles.reminderBadgeText}>
                              {item.reminderType === 'custom' 
                                ? `Recordatorio: ${new Date(item.reminderDateTime).toLocaleString()}`
                                : reminderOptions.find(o => o.value === item.reminderTime)?.label}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </>
              )}
              
              <Text style={styles.sectionTitle}>Agregar Nueva Cita</Text>
              
              <View style={styles.inputContainer}>
                <MaterialIcons name="title" size={20} color="#6200EE" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Título de la cita*"
                  placeholderTextColor="#999"
                  value={newAppointment.title}
                  onChangeText={(text) => setNewAppointment({...newAppointment, title: text})}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <MaterialIcons name="access-time" size={20} color="#6200EE" style={styles.inputIcon} />
                <TouchableOpacity 
                  style={styles.timeInput}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.timeInputText}>Hora: {formatTime(newAppointment.time)}</Text>
                </TouchableOpacity>
                
                {showTimePicker && (
                  <View style={styles.timePickerContainer}>
                    <DateTimePicker
                      value={newAppointment.time}
                      mode="time"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleTimeChange}
                      textColor="#6200EE"
                      accentColor="#6200EE"
                    />
                    {Platform.OS === 'ios' && (
                      <Button 
                        title="Confirmar" 
                        onPress={() => setShowTimePicker(false)} 
                        color="#6200EE"
                      />
                    )}
                  </View>
                )}
              </View>
              
              <View style={styles.inputContainer}>
                <MaterialIcons name="description" size={20} color="#6200EE" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Descripción (opcional)"
                  placeholderTextColor="#999"
                  value={newAppointment.description}
                  onChangeText={(text) => setNewAppointment({...newAppointment, description: text})}
                  multiline
                />
              </View>
              
              {renderReminderPicker()}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  onClose();
                  Keyboard.dismiss();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Guardar Cita</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: '90%',
    maxHeight: '85%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  closeModalButton: {
    padding: 4,
    marginLeft: 10,
  },
  scrollContainer: {
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 16,
    color: '#6200EE',
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#555',
  },
  appointmentsList: {
    marginBottom: 20,
  },
  appointmentCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginRight: 12,
  },
  timeText: {
    color: '#6200EE',
    fontWeight: '600',
    fontSize: 14,
  },
  appointmentTitle: {
    flex: 1,
    fontWeight: '500',
    color: '#333',
    fontSize: 16,
  },
  appointmentDescription: {
    color: '#666',
    fontSize: 14,
    marginLeft: 60,
    marginTop: 4,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  reminderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginTop: 8,
    marginLeft: 60,
  },
  reminderBadgeText: {
    fontSize: 12,
    color: '#6200EE',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#FFF',
    fontSize: 16,
    color: '#333',
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 14,
    backgroundColor: '#FFF',
  },
  timeInputText: {
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  timePickerContainer: {
    marginTop: 8,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: Platform.OS === 'ios' ? 12 : 0,
  },
  pickerContainer: {
    width: '100%',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 180,
    color: '#6200EE',
  },
  reminderSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  reminderTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: '#F5F5F7',
    borderRadius: 10,
    padding: 4,
  },
  reminderTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
  },
  reminderTypeOptionActive: {
    backgroundColor: '#FFF',
    shadowColor: '#6200EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderTypeOptionText: {
    marginLeft: 8,
    color: '#888',
    fontWeight: '500',
  },
  reminderTypeOptionTextActive: {
    color: '#6200EE',
  },
  customReminderContainer: {
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#6200EE',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CitasModal;