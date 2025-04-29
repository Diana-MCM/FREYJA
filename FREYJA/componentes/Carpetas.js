import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  TextInput,
  Modal,
  Linking,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { PinchGestureHandler, State, GestureHandlerRootView } from 'react-native-gesture-handler';

// Constants for consistent styling with a purple-only palette
const COLORS = {
  primary: '#6B4EAA',
  secondary: '#A68BFF',
  background: '#F7F4FA',
  card: '#FFFFFF',
  text: '#3C2F5A',
  muted: '#7A6F99',
  darkAccent: '#4A3577',
  lightAccent: '#D4CCE8',
  danger: '#FF6B6B',
};

const SPACING = {
  xs: 5,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 30,
};

const FONTS = {
  title: 20,
  subtitle: 18,
  body: 16,
  caption: 14,
};

// Get screen width for responsive design
const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - SPACING.lg * 3) / 2; // For 2 items per row

const Carpetas = ({ setScreen, params }) => {
  const { folderName } = params || {};
  console.log('Params recibidos en Carpetas:', params);
  console.log('FolderName recibido:', folderName);
  if (folderName) {
    console.log('Tipo de folderName:', typeof folderName);
    console.log('Longitud de folderName:', folderName.length);
    console.log('Caracteres de folderName:', folderName.split('').map((char, i) => `${i}:${char.charCodeAt(0)}-${char}`));
  }

  // Estado para controlar si se puede renderizar el componente
  const [isValid, setIsValid] = useState(null);

  // Validar folderName después de que el componente se monte
  useEffect(() => {
    if (!folderName || folderName.trim() === '' || folderName === 'undefined' || typeof folderName !== 'string') {
      console.log('FolderName inválido:', folderName);
      Alert.alert('Error', 'No se proporcionó un nombre de carpeta válido');
      setScreen('Subirinformacion');
      setIsValid(false);
    } else {
      // También validar que folderName no sea una carpeta reservada
      const reservedNames = ['images', 'files'];
      const lowerFolderName = folderName.toLowerCase().trim();
      if (reservedNames.includes(lowerFolderName)) {
        console.log('FolderName reservado detectado:', folderName);
        Alert.alert('Error', `El nombre "${folderName}" es un nombre reservado y no puede ser usado como carpeta.`);
        setScreen('Subirinformacion');
        setIsValid(false);
      } else {
        console.log('FolderName válido:', folderName);
        setIsValid(true);
      }
    }
  }, [folderName, setScreen]);

  // State Management
  const [images, setImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState('');
  const [pendingUpload, setPendingUpload] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [scale, setScale] = useState(1);

  // Firebase Initialization
  const storage = getStorage();
  const auth = getAuth();
  const user = auth.currentUser;

  // Initial Setup and Permissions
  useEffect(() => {
    if (isValid) {
      (async () => {
        const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        setHasGalleryPermission(galleryStatus.status === 'granted');

        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        setHasCameraPermission(cameraStatus.status === 'granted');

        const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
        setHasMediaLibraryPermission(mediaLibraryStatus.status === 'granted');

        loadFolderContent();
      })();
    }
  }, [isValid]);

  // Firebase Folder Content Management
  const loadFolderContent = async () => {
    if (!folderName || !user?.uid) {
      console.error('No se puede cargar contenido: folderName o user.uid no están definidos', {
        folderName,
        userUid: user?.uid,
      });
      return;
    }

    try {
      const imagesRef = ref(storage, `users/${user.uid}/folders/${folderName}/images/`);
      const filesRef = ref(storage, `users/${user.uid}/folders/${folderName}/files/`);

      console.log('Cargando imágenes desde:', `users/${user.uid}/folders/${folderName}/images/`);
      const imageList = await listAll(imagesRef);
      console.log('Imágenes encontradas:', imageList.items.map(item => item.fullPath));

      console.log('Cargando archivos desde:', `users/${user.uid}/folders/${folderName}/files/`);
      const fileList = await listAll(filesRef);
      console.log('Archivos encontrados:', fileList.items.map(item => item.fullPath));

      const newImages = imageList.items.length > 0
        ? await Promise.all(
            imageList.items.map(async (itemRef) => {
              const downloadURL = await getDownloadURL(itemRef);
              return {
                uri: downloadURL,
                name: itemRef.name,
                type: 'image',
                storagePath: itemRef.fullPath,
                downloadURL,
              };
            })
          )
        : [];

      const newFiles = fileList.items.length > 0
        ? await Promise.all(
            fileList.items.map(async (itemRef) => {
              const downloadURL = await getDownloadURL(itemRef);
              return {
                uri: downloadURL,
                name: itemRef.name,
                type: 'file',
                storagePath: itemRef.fullPath,
                downloadURL,
              };
            })
          )
        : [];

      setImages(newImages);
      setFiles(newFiles);
    } catch (error) {
      console.error('Error cargando contenido de carpeta:', error);
      Alert.alert('Error', 'No se pudo cargar el contenido de la carpeta');
    }
  };

  const deleteItem = async (item, index) => {
    setIsDeleting(true);
    try {
      if (!item.storagePath || item.storagePath.split('/').length <= 2) {
        throw new Error('Ruta de almacenamiento no válida');
      }

      const itemRef = ref(storage, item.storagePath);
      await deleteObject(itemRef);

      // Verificar si la carpeta images o files está vacía
      const parentRef = ref(storage, item.storagePath).parent;
      const parentList = await listAll(parentRef);
      if (parentList.items.length === 0 && parentList.prefixes.length === 0) {
        console.log(`Carpeta ${parentRef.fullPath} está vacía, limpiando...`);
        const dummyRef = ref(parentRef, '.keep');
        await uploadBytes(dummyRef, new Blob(['']));
        await deleteObject(dummyRef);
      }

      if (item.type === 'image') {
        setImages((prev) => prev.filter((_, i) => i !== index));
      } else {
        setFiles((prev) => prev.filter((_, i) => i !== index));
      }

      Alert.alert('Éxito', 'Elemento eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando item:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      Alert.alert('Error', error.message || 'No se pudo eliminar el elemento');
    } finally {
      setIsDeleting(false);
    }
  };

  // File and Image Handling
  const sanitizeFileName = (name, defaultName, extension = '') => {
    if (!name || name.trim() === '') return `${defaultName}${extension}`;
    const sanitized = name.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
    return sanitized.length > 0 ? `${sanitized}${extension}` : `${defaultName}${extension}`;
  };

  const uploadImage = async (image) => {
    setIsUploading(true);
    try {
      console.log('Subiendo imagen a:', image.storagePath);
      const response = await fetch(image.uri);
      const blob = await response.blob();

      const imageRef = ref(storage, image.storagePath);
      await uploadBytes(imageRef, blob);

      const downloadURL = await getDownloadURL(imageRef);
      console.log('Imagen subida exitosamente. URL:', downloadURL);

      setImages((prev) =>
        prev.map((img) => (img.name === image.name ? { ...img, downloadURL } : img))
      );

      Alert.alert('Éxito', 'Imagen subida correctamente');
    } catch (error) {
      console.error('Error subiendo imagen:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      Alert.alert('Error', `No se pudo subir la imagen: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    try {
      console.log('Subiendo archivo a:', file.storagePath);
      let uri = file.uri;
      if (Platform.OS === 'android' && !uri.startsWith('file://')) {
        const cacheFile = `${FileSystem.cacheDirectory}${file.name}`;
        await FileSystem.copyAsync({ from: file.uri, to: cacheFile });
        uri = cacheFile;
      }

      const response = await fetch(uri);
      const blob = await response.blob();

      const fileRef = ref(storage, file.storagePath);
      await uploadBytes(fileRef, blob);

      const downloadURL = await getDownloadURL(fileRef);
      console.log('Archivo subido exitosamente. URL:', downloadURL);

      setFiles((prev) =>
        prev.map((f) => (f.name === file.name ? { ...f, downloadURL } : f))
      );

      Alert.alert('Éxito', 'Archivo subido correctamente');
    } catch (error) {
      console.error('Error subiendo archivo:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      Alert.alert('Error', `No se pudo subir el archivo: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadFile = async (file) => {
    try {
      const uri = file.downloadURL;
      const fileName = file.name;
      const downloadDest = `${FileSystem.documentDirectory}${fileName}`;

      const downloadResult = await FileSystem.downloadAsync(uri, downloadDest);
      if (downloadResult.status === 200) {
        Alert.alert('Éxito', `Archivo descargado en ${downloadDest}`);
      } else {
        throw new Error('Fallo en la descarga');
      }
    } catch (error) {
      console.error('Error descargando archivo:', error);
      Alert.alert('Error', `No se pudo descargar el archivo: ${error.message}`);
    }
  };

  const openFile = async (file) => {
    if (!file.downloadURL) {
      Alert.alert('Error', 'El archivo no está disponible para abrir');
      return;
    }

    try {
      await Linking.openURL(file.downloadURL);
    } catch (error) {
      console.error('Error abriendo archivo:', error);
      Alert.alert(
        'No se pudo abrir el archivo',
        '¿Deseas descargarlo en su lugar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Descargar',
            onPress: () => downloadFile(file),
          },
        ]
      );
    }
  };

  // UI Interaction Handlers
  const promptForName = (type, callback) => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        `Nombre del ${type}`,
        `Ingresa el nombre para el ${type}:`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => callback(null),
          },
          {
            text: 'Aceptar',
            onPress: (name) => {
              if (!name || name.trim() === '') {
                Alert.alert('Error', `El nombre del ${type} no puede estar vacío`);
                callback(null);
                return;
              }
              callback(name);
            },
          },
        ],
        'plain-text'
      );
    } else {
      setTempName('');
      setPendingUpload({ type, callback });
      setShowNameInput(true);
    }
  };

  const handleNameSubmit = () => {
    if (!tempName || tempName.trim() === '') {
      Alert.alert('Error', `El nombre del ${pendingUpload?.type} no puede estar vacío`);
      setShowNameInput(false);
      pendingUpload?.callback(null);
      setPendingUpload(null);
      return;
    }
    pendingUpload.callback(tempName);
    setShowNameInput(false);
    setPendingUpload(null);
    setTempName('');
  };

  const viewImage = (image) => {
    setSelectedImage(image);
    setShowImageModal(true);
    setScale(1);
  };

  const onPinchGestureEvent = (event) => {
    const newScale = Math.max(0.5, Math.min(event.nativeEvent.scale * scale, 3));
    setScale(newScale);
  };

  const onPinchHandlerStateChange = (event) => {
    if (event.nativeEvent.state === State.END) {
      setScale(Math.max(0.5, Math.min(scale, 3)));
    }
  };

  const confirmDelete = (item, index) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro que deseas eliminar este elemento?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: () => deleteItem(item, index),
        },
      ]
    );
  };

  const pickImage = async () => {
    if (hasGalleryPermission === false) {
      Alert.alert('Permisos requeridos', 'Necesitas conceder permisos para acceder a la galería');
      return;
    }

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        promptForName('imagen', async (customName) => {
          if (customName === null) return;
          const fileName = sanitizeFileName(customName, `gallery_${Date.now()}`, '.jpg');
          const newImage = {
            uri: selectedImage.uri,
            name: fileName,
            type: 'image',
            storagePath: `users/${user.uid}/folders/${folderName}/images/${fileName}`,
          };
          setImages([...images, newImage]);
          await uploadImage(newImage);
        });
      }
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      Alert.alert('Error', `No se pudo seleccionar la imagen: ${error.message}`);
    }
  };

  const takePhoto = async () => {
    if (hasCameraPermission === false) {
      Alert.alert('Permisos requeridos', 'Necesitas conceder permisos para acceder a la cámara');
      return;
    }

    try {
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const takenPhoto = result.assets[0];
        promptForName('foto', async (customName) => {
          if (customName === null) return;
          const fileName = sanitizeFileName(customName, `camera_${Date.now()}`, '.jpg');
          const newImage = {
            uri: takenPhoto.uri,
            name: fileName,
            type: 'image',
            storagePath: `users/${user.uid}/folders/${folderName}/images/${fileName}`,
          };
          setImages([...images, newImage]);

          if (hasMediaLibraryPermission) {
            try {
              await MediaLibrary.saveToLibraryAsync(takenPhoto.uri);
            } catch (error) {
              console.error('Error guardando en galería:', error);
            }
          }

          await uploadImage(newImage);
        });
      }
    } catch (error) {
      console.error('Error tomando foto:', error);
      Alert.alert('Error', `No se pudo tomar la foto: ${error.message}`);
    }
  };

  const pickDocument = async () => {
    if (hasMediaLibraryPermission === false) {
      Alert.alert('Permisos requeridos', 'Necesitas conceder permisos para acceder a archivos');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        promptForName('archivo', async (customName) => {
          if (customName === null) return;
          const originalExtension = file.name ? `.${file.name.split('.').pop()}` : '';
          const fileName = sanitizeFileName(customName, `file_${Date.now()}`, originalExtension);
          const newFile = {
            uri: file.uri,
            name: fileName,
            type: 'file',
            storagePath: `users/${user.uid}/folders/${folderName}/files/${fileName}`,
          };
          setFiles([...files, newFile]);
          await uploadFile(newFile);
        });
      } else {
        console.log('Document picker cancelled or invalid result:', result);
      }
    } catch (error) {
      console.error('Error seleccionando documento:', error);
      Alert.alert('Error', `No se pudo seleccionar el archivo: ${error.message}`);
    }
  };

  // Render UI
  if (isValid === null) {
    // Mostrar un indicador de carga mientras se valida
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isValid) {
    return null; // No renderizar nada si folderName es inválido (ya se redirigió)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <Text style={styles.headerText}>Archivos en {folderName}</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content}>
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
            onPress={takePhoto}
            disabled={isUploading || isDeleting}
          >
            <Ionicons name="camera" size={24} color={COLORS.lightAccent} />
            <Text style={styles.actionButtonText}>Tomar Foto</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
            onPress={pickImage}
            disabled={isUploading || isDeleting}
          >
            <Ionicons name="image" size={24} color={COLORS.lightAccent} />
            <Text style={styles.actionButtonText}>Elegir de Galería</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
            onPress={pickDocument}
            disabled={isUploading || isDeleting}
          >
            <Ionicons name="document" size={24} color={COLORS.lightAccent} />
            <Text style={styles.actionButtonText}>Subir Archivo</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {(isUploading || isDeleting) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>
              {isUploading ? 'Subiendo...' : 'Eliminando...'}
            </Text>
          </View>
        )}

        {/* Name Input Modal */}
        {showNameInput && (
          <View style={styles.inputModal}>
            <View style={styles.inputModalContent}>
              <Text style={styles.inputModalTitle}>
                Ingresa el nombre para el {pendingUpload?.type}:
              </Text>
              <TextInput
                style={styles.input}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Nombre del archivo"
                autoFocus
              />
              <View style={styles.inputModalButtons}>
                <TouchableOpacity
                  style={[styles.inputModalButton, { backgroundColor: COLORS.danger }]}
                  onPress={() => {
                    setShowNameInput(false);
                    pendingUpload?.callback(null);
                    setPendingUpload(null);
                  }}
                >
                  <Text style={styles.inputModalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputModalButton, { backgroundColor: COLORS.primary }]}
                  onPress={handleNameSubmit}
                >
                  <Text style={styles.inputModalButtonText}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Images Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imágenes ({images.length})</Text>
          {images.length === 0 ? (
            <Text style={styles.emptyText}>No hay imágenes en esta carpeta</Text>
          ) : (
            <View style={styles.grid}>
              {images.map((image, index) => (
                <View key={`image-${index}`} style={styles.gridItemContainer}>
                  <TouchableOpacity
                    style={styles.gridItem}
                    onPress={() => viewImage(image)}
                  >
                    <Image source={{ uri: image.uri }} style={styles.gridImage} />
                    <Text style={styles.gridItemText} numberOfLines={1}>
                      {image.name}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteIcon}
                    onPress={() => confirmDelete(image, index)}
                    disabled={isDeleting}
                  >
                    <Ionicons
                      name="trash"
                      size={24}
                      color={isDeleting ? COLORS.muted : COLORS.danger}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Files Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Archivos ({files.length})</Text>
          {files.length === 0 ? (
            <Text style={styles.emptyText}>No hay archivos en esta carpeta</Text>
          ) : (
            <View style={styles.grid}>
              {files.map((file, index) => (
                <View key={`file-${index}`} style={styles.gridItemContainer}>
                  <TouchableOpacity style={styles.gridItem} onPress={() => openFile(file)}>
                    <Ionicons name="document" size={30} color={COLORS.primary} />
                    <Text
                      style={[styles.gridItemText, styles.gridItemTextTouchable]}
                      numberOfLines={1}
                    >
                      {file.name}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteIcon}
                    onPress={() => confirmDelete(file, index)}
                    disabled={isDeleting}
                  >
                    <Ionicons
                      name="trash"
                      size={24}
                      color={isDeleting ? COLORS.muted : COLORS.danger}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.imageModal}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowImageModal(false)}
            >
              <Ionicons name="close" size={30} color={COLORS.lightAccent} />
            </TouchableOpacity>
            <PinchGestureHandler
              onGestureEvent={onPinchGestureEvent}
              onHandlerStateChange={onPinchHandlerStateChange}
            >
              <Image
                source={{ uri: selectedImage?.uri }}
                style={[styles.fullImage, { transform: [{ scale }] }]}
                resizeMode="contain"
              />
            </PinchGestureHandler>
          </View>
        </GestureHandlerRootView>
      </Modal>

      {/* Back to Root Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.backButton]}
        onPress={() => setScreen('Subirinformacion')}
        disabled={isUploading || isDeleting}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.lightAccent} />
        <Text style={styles.actionButtonText}>Volver a Archivos</Text>
      </TouchableOpacity>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
  },
  header: {
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightAccent,
    alignItems: 'center',
  },
  headerText: {
    fontSize: FONTS.title,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    width: '48%',
    shadowColor: COLORS.darkAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  actionButtonText: {
    color: COLORS.lightAccent,
    fontSize: FONTS.body,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    marginBottom: SPACING.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.text,
    fontSize: FONTS.caption,
  },
  inputModal: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputModalContent: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: 10,
    width: '80%',
    borderWidth: 1,
    borderColor: COLORS.lightAccent,
    shadowColor: COLORS.darkAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  inputModalTitle: {
    fontSize: FONTS.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightAccent,
    padding: SPACING.sm,
    borderRadius: 5,
    marginBottom: SPACING.sm,
    fontSize: FONTS.body,
    color: COLORS.text,
    backgroundColor: COLORS.background,
  },
  inputModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputModalButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
    shadowColor: COLORS.darkAccent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  inputModalButtonText: {
    color: COLORS.lightAccent,
    fontSize: FONTS.body,
    fontWeight: '600',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.subtitle,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItemContainer: {
    width: ITEM_WIDTH,
    marginBottom: SPACING.sm,
    position: 'relative',
  },
  gridItem: {
    backgroundColor: COLORS.card,
    padding: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightAccent,
    shadowColor: COLORS.darkAccent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  gridImage: {
    width: '100%',
    height: ITEM_WIDTH * 0.75,
    borderRadius: 5,
    marginBottom: SPACING.sm,
  },
  gridItemText: {
    fontSize: FONTS.caption,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  gridItemTextTouchable: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  deleteIcon: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    padding: SPACING.xs,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.lightAccent,
    shadowColor: COLORS.darkAccent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.muted,
    fontStyle: 'italic',
    fontSize: FONTS.caption,
    marginVertical: SPACING.sm,
  },
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.xl,
    right: SPACING.lg,
    zIndex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: SPACING.sm,
  },
});

export default Carpetas;