import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image } from 'react-native';
import { Button } from 'react-native';

const Subirinformacion = ({ setScreen, nombreUsuario }) => {
 
  return (
    <View style={styles.container}>
      <SafeAreaView>
     
      <View style={styles.header}>
        <Text style={styles.headerText}>Archivos</Text>
      </View>
      </SafeAreaView>
      
      <View style={styles.content} />

          <Button
            title="Volver a inicio"
            onPress={() => setScreen('Inicio')}
            color="#FF6B6B"
          />
       </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#aed0ec',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  botoninicio: {
    flexDirection: 'row',
    backgroundColor: '#4f784f',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default Subirinformacion;