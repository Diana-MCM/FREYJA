import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ImageBackground, TouchableOpacity, Modal } from 'react-native';
import { 
  createUserWithEmailAndPassword, 
  updateProfile,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { getDatabase, ref, set, get } from 'firebase/database';
import imagenFondo from './imagenes/Freyjaa.png';

const RegistroDeUsuario = ({ setScreen }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [tempUserData, setTempUserData] = useState(null);

  // Función para generar código de 6 dígitos
  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Función para enviar el código por correo (simulado)
  const sendVerificationEmail = async (email, code) => {
    // En una aplicación real, aquí usarías un servicio de correo o Firebase Cloud Functions
    console.log(`Código de verificación enviado a ${email}: ${code}`);
    // Simulamos el envío del correo
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  // Función para generar ID único de 10 dígitos
  const generarYReservarIdUnico = async (db, uid) => {
    const MAX_INTENTOS = 10;
    
    for (let i = 0; i < MAX_INTENTOS; i++) {
      try {
        const idCandidato = Math.floor(1000000000 + Math.random() * 9000000000).toString();
        const idRef = ref(db, `ids_usuarios/${idCandidato}`);
        
        const snapshot = await get(idRef);
        if (snapshot.exists()) continue;
        
        await set(idRef, uid);
        return idCandidato;
        
      } catch (error) {
        console.log("Intento fallido de generación de ID:", error.message);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    throw new Error("No se pudo generar ID único después de varios intentos");
  };

  const handleRegister = async () => {
    try {
      // Validación básica de campos
      if (!nombre.trim() || !email.trim() || !password) {
        Alert.alert("Error", "Por favor completa todos los campos");
        return;
      }

      if (password.length < 6) {
        Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
        return;
      }

      setLoading(true);
      
      // Generar código de verificación
      const verificationCode = generateVerificationCode();
      setGeneratedCode(verificationCode);
      
      // Enviar código por correo (simulado)
      await sendVerificationEmail(email, verificationCode);
      
      // Guardar datos temporales del usuario
      setTempUserData({
        email,
        password,
        nombre: nombre.trim()
      });
      
      setVerificationModalVisible(true);
      
      Alert.alert(
        "Verificación requerida", 
        "Hemos enviado un código de verificación de 6 dígitos a tu correo electrónico. Por favor ingrésalo para completar el registro."
      );
      
    } catch (error) {
      console.error("Error en registro:", error);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    try {
      setLoading(true);
      
      // Verificar que el código ingresado coincida
      if (verificationCode !== generatedCode) {
        Alert.alert("Error", "El código de verificación es incorrecto");
        return;
      }
      
      // Si el código es correcto, proceder con el registro
      const { email, password, nombre } = tempUserData;
      
      // 1. Crear usuario en Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // 2. Generar ID único seguro
      const db = getDatabase();
      const userId10digitos = await generarYReservarIdUnico(db, user.uid);
      
      // 3. Crear estructura de usuario
      await set(ref(db, `usuarios/${user.uid}`), {
        nombre: nombre,
        correo: email,
        userId: userId10digitos,
        fechaRegistro: new Date().toISOString(),
        datos_personales: {
          nombrecompleto: nombre,
          fechaRegistro: new Date().toISOString()
        }
      });
      
      // 4. Actualizar perfil del usuario
      await updateProfile(user, {
        displayName: nombre
      });
      
      Alert.alert("Registro exitoso", `Tu ID de usuario es: ${userId10digitos}`);
      setVerificationModalVisible(false);
      setScreen('DatosPersonales');
      
    } catch (error) {
      console.error("Error en verificación:", error);
      Alert.alert("Error", error.message);
      // Si hay error, regresar al inicio
      setVerificationModalVisible(false);
      setScreen('IniciarSesion');
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async () => {
    try {
      setLoading(true);
      const newCode = generateVerificationCode();
      setGeneratedCode(newCode);
      await sendVerificationEmail(tempUserData.email, newCode);
      Alert.alert("Código reenviado", "Se ha enviado un nuevo código de verificación a tu correo electrónico.");
    } catch (error) {
      console.error("Error al reenviar código:", error);
      Alert.alert("Error", "No se pudo reenviar el código de verificación. Por favor intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={imagenFondo}
      style={{ flex: 1, width: '100%', height: '100%' }}
      resizeMode="cover"
    >
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',  
        backgroundColor: 'rgba(171, 163, 247, 0.73)',
        padding: 20
      }}>
        <Text style={{ fontSize: 60, fontWeight: 'bold', marginBottom: 50 }}>REGISTRO</Text>
        <TextInput
          placeholder="Usuario"
          value={nombre}
          onChangeText={setNombre}
          style={{ 
            borderWidth: 1, 
            borderRadius: 15,
            marginBottom: 10, 
            width: 300, 
            padding: 20, 
            backgroundColor: 'white' 
          }}
        />
        <TextInput
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{ 
            borderWidth: 1, 
            borderRadius: 15,
            marginBottom: 10, 
            width: 300, 
            padding: 20, 
            backgroundColor: 'white' 
          }}
        />
        <TextInput
          placeholder="Contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={{ 
            borderWidth: 1, 
            borderRadius: 15,
            marginBottom: 10, 
            width: 300, 
            padding: 20, 
            backgroundColor: 'white' 
          }}
        />
        <TouchableOpacity
          onPress={handleRegister}
          disabled={loading}
          style={{
            backgroundColor: '#6200EE',
            paddingVertical: 10,
            paddingHorizontal: 60,
            borderRadius: 10,
            marginTop: 70,
            marginBottom: 40,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 5
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
            {loading ? 'Procesando...' : 'Registrarse'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setScreen('IniciarSesion')} 
          disabled={loading}
          style={{
            backgroundColor: '#6200EE',
            paddingVertical: 10,
            paddingHorizontal: 60,
            borderRadius: 10,
            marginBottom: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
            elevation: 5
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
            Volver 
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de verificación */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={verificationModalVisible}
        onRequestClose={() => {
          setVerificationModalVisible(false);
          setScreen('IniciarSesion');
        }}
      >
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: 'rgba(0,0,0,0.5)' 
        }}>
          <View style={{
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 10,
            width: '80%'
          }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
              Verificación de Correo
            </Text>
            <Text style={{ marginBottom: 20 }}>
              Por favor ingresa el código de 6 dígitos que enviamos a {email}
            </Text>
            
            <TextInput
              placeholder="Código de 6 dígitos"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
              maxLength={6}
              style={{ 
                borderWidth: 1, 
                borderRadius: 5,
                marginBottom: 20, 
                padding: 10, 
                backgroundColor: 'white',
                textAlign: 'center',
                fontSize: 18
              }}
            />
            
            <TouchableOpacity
              onPress={handleVerification}
              disabled={loading}
              style={{
                backgroundColor: '#6200EE',
                padding: 10,
                borderRadius: 5,
                marginBottom: 10
              }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>
                {loading ? 'Verificando...' : 'Verificar'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={resendVerificationCode}
              disabled={loading}
            >
              <Text style={{ color: '#6200EE', textAlign: 'center' }}>
                Reenviar código
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
};

export default RegistroDeUsuario;
