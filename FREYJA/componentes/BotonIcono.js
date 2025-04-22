import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons'; // o FontAwesome, Ionicons, etc.

const BotonPerfil = ({ onPress }) => (
  <TouchableOpacity 
    onPress={onPress}
    style={styles.botonContainer}
  >
    <Icon name="account-circle" size={24} color="#4682B4" />
    <Text style={styles.textoBoton}>Ver Perfil</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  botonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4682B4'
  },
  textoBoton: {
    marginLeft: 8,
    color: '#4682B4',
    fontWeight: 'bold'
  }
});