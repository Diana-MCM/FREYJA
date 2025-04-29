import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, deleteObject, listAll } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { Dimensions } from 'react-native';

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

const Subirinformacion = ({ setScreen }) => {
  // State Management
  const [folders, setFolders] = useState([]);
  const [hasGalleryPermission, setHasGalleryPermission] = useState(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [tempName, setTempName] = useState('');

  // Firebase Initialization
  const storage = getStorage();
  const auth = getAuth();
  const user = auth.currentUser;

  // Initial Setup and Permissions
  useEffect(() => {
    (async () => {
      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasGalleryPermission(galleryStatus.status === 'granted');

      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      setHasCameraPermission(cameraStatus.status === 'granted');

      const mediaLibraryStatus = await MediaLibrary.requestPermissionsAsync();
      setHasMediaLibraryPermission(mediaLibraryStatus.status === 'granted');

      loadFolders();
    })();
  }, []);

  // Firebase Folder Management
  const loadFolders = async () => {
    try {
      const foldersRef = ref(storage, `users/${user.uid}/folders/`);
      const folderList = await listAll(foldersRef);
      const rawFolderNames = folderList.prefixes.map((prefix) => prefix.name);
      console.log('Nombres de carpetas crudos desde Firebase:', rawFolderNames);

      // Depuración adicional: inspeccionar cada nombre de carpeta
      rawFolderNames.forEach((name, index) => {
        console.log(`Carpeta ${index}: "${name}" (longitud: ${name.length}, tipo: ${typeof name})`);
        if (name) {
          console.log(`Caracteres de "${name}":`, name.split('').map((char, i) => `${i}:${char.charCodeAt(0)}-${char}`));
        }
      });

      // Ignorar carpetas no deseadas como "images" o "files" (insensible a mayúsculas)
      const ignoredFolders = ['images', 'files'];
      const folderNames = rawFolderNames
        .filter((name) => {
          if (!name || name.trim() === '' || name === 'undefined') {
            console.log('Carpeta ignorada por ser inválida:', name);
            return false;
          }
          const trimmedName = name.trim();
          const lowerName = trimmedName.toLowerCase();
          if (ignoredFolders.includes(lowerName)) {
            console.log('Carpeta ignorada por estar en la lista de ignorados:', trimmedName);
            return false;
          }
          return true;
        })
        .map((name) => name.trim());
      console.log('Carpetas filtradas finales:', folderNames);

      setFolders(folderNames);
    } catch (error) {
      console.error('Error cargando carpetas:', error);
      Alert.alert('Error', 'No se pudieron cargar las carpetas');
    }
  };

  const createFolder = async (folderName) => {
    if (!folderName || folderName.trim() === '') {
      Alert.alert('Error', 'El nombre de la carpeta no puede estar vacío');
      return;
    }

    const sanitizedFolderName = sanitizeFileName(folderName, `folder_${Date.now()}`);
    if (!sanitizedFolderName || sanitizedFolderName === 'undefined') {
      console.error('Nombre de carpeta sanitizado inválido:', sanitizedFolderName);
      Alert.alert('Error', 'No se pudo generar un nombre válido para la carpeta');
      return;
    }

    // Evitar nombres de carpetas que coincidan con subcarpetas reservadas
    const reservedNames = ['images', 'files'];
    const lowerSanitizedName = sanitizedFolderName.toLowerCase();
    if (reservedNames.includes(lowerSanitizedName)) {
      Alert.alert('Error', `El nombre "${sanitizedFolderName}" está reservado. Por favor, elige otro nombre.`);
      return;
    }

    try {
      const dummyRef = ref(storage, `users/${user.uid}/folders/${sanitizedFolderName}/.keep`);
      await uploadBytes(dummyRef, new Blob(['']));
      await deleteObject(dummyRef);

      setFolders((prev) => {
        const newFolders = [...prev, sanitizedFolderName];
        console.log('Carpetas actualizadas:', newFolders);
        return newFolders;
      });
      Alert.alert('Éxito', `Carpeta "${sanitizedFolderName}" creada`);
    } catch (error) {
      console.error('Error creando carpeta:', error);
      Alert.alert('Error', `No se pudo crear la carpeta: ${error.message}`);
    }
  };

  const deleteFolder = async (folderName) => {
    setIsDeleting(true);
    try {
      const folderRef = ref(storage, `users/${user.uid}/folders/${folderName}`);
      const folderList = await listAll(folderRef);

      // Eliminar todas las subcarpetas y archivos dentro de la carpeta
      const deletePromises = folderList.prefixes.map(async (prefix) => {
        const subList = await listAll(prefix);
        return Promise.all(subList.items.map((item) => deleteObject(item)));
      });

      await Promise.all(deletePromises);
      // También eliminar los archivos directamente dentro de la carpeta
      await Promise.all(folderList.items.map((item) => deleteObject(item)));

      setFolders((prev) => prev.filter((folder) => folder !== folderName));
      Alert.alert('Éxito', `Carpeta "${folderName}" eliminada`);
    } catch (error) {
      console.error('Error eliminando carpeta:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      Alert.alert('Error', `No se pudo eliminar la carpeta: ${error.message}`);
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

  // UI Interaction Handlers
  const promptForFolderName = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Nombre de la carpeta',
        'Ingresa el nombre para la nueva carpeta:',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Crear',
            onPress: (name) => {
              if (!name || name.trim() === '') {
                Alert.alert('Error', 'El nombre de la carpeta no puede estar vacío');
                return;
              }
              createFolder(name);
            },
          },
        ],
        'plain-text'
      );
    } else {
      setTempName('');
      setShowFolderInput(true);
    }
  };

  const handleFolderNameSubmit = async () => {
    if (!tempName || tempName.trim() === '') {
      Alert.alert('Error', 'El nombre de la carpeta no puede estar vacío');
      setShowFolderInput(false);
      setTempName('');
      return;
    }
    await createFolder(tempName);
    setShowFolderInput(false);
    setTempName('');
  };

  const confirmDeleteFolder = (folderName) => {
    Alert.alert(
      'Confirmar eliminación de carpeta',
      `¿Estás seguro que deseas eliminar la carpeta "${folderName}" y todo su contenido?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          onPress: () => deleteFolder(folderName),
        },
      ]
    );
  };

  // Render UI
  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView>
        <View style={styles.header}>
          <Text style={styles.headerText}>Archivos</Text>
        </View>
      </SafeAreaView>

      <ScrollView style={styles.content}>
        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
            onPress={promptForFolderName}
            disabled={isUploading || isDeleting}
          >
            <Ionicons name="folder-open" size={24} color={COLORS.lightAccent} />
            <Text style={styles.actionButtonText}>Crear Carpeta</Text>
          </TouchableOpacity>
        </View>

        {/* Loading Indicator */}
        {isDeleting && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Eliminando...</Text>
          </View>
        )}

        {/* Folder Name Input Modal */}
        {showFolderInput && (
          <View style={styles.inputModal}>
            <View style={styles.inputModalContent}>
              <Text style={styles.inputModalTitle}>Ingresa el nombre de la carpeta:</Text>
              <TextInput
                style={styles.input}
                value={tempName}
                onChangeText={setTempName}
                placeholder="Nombre de la carpeta"
                autoFocus
              />
              <View style={styles.inputModalButtons}>
                <TouchableOpacity
                  style={[styles.inputModalButton, { backgroundColor: COLORS.danger }]}
                  onPress={() => setShowFolderInput(false)}
                >
                  <Text style={styles.inputModalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputModalButton, { backgroundColor: COLORS.primary }]}
                  onPress={handleFolderNameSubmit}
                >
                  <Text style={styles.inputModalButtonText}>Crear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Folders Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Carpetas ({folders.length})</Text>
          {folders.length === 0 ? (
            <Text style={styles.emptyText}>No hay carpetas aún</Text>
          ) : (
            <View style={styles.grid}>
              {folders.map((folder, index) => (
                <View key={`folder-${index}`} style={styles.gridItemContainer}>
                  <TouchableOpacity
                    style={styles.gridItem}
                    onPress={() => {
                      console.log('Intentando navegar a carpeta con folderName:', folder);
                      console.log('Tipo de folder:', typeof folder);
                      console.log('Longitud de folder:', folder.length);
                      if (folder) {
                        console.log('Caracteres de folder:', folder.split('').map((char, i) => `${i}:${char.charCodeAt(0)}-${char}`));
                      }
                      // Validación más estricta antes de navegar
                      if (!folder || folder.trim() === '' || folder === 'undefined' || typeof folder !== 'string') {
                        console.log('Navegación cancelada: folderName no válido:', folder);
                        Alert.alert('Error', 'Nombre de carpeta no válido. Por favor, intenta de nuevo.');
                        return;
                      }
                      const trimmedFolder = folder.trim();
                      const reservedNames = ['images', 'files'];
                      if (reservedNames.includes(trimmedFolder.toLowerCase())) {
                        console.log('Navegación cancelada: folderName reservado:', trimmedFolder);
                        Alert.alert('Error', `El nombre "${trimmedFolder}" es un nombre reservado y no puede ser usado.`);
                        return;
                      }
                      console.log('Navegación permitida a:', trimmedFolder);
                      setScreen('Carpetas', { folderName: trimmedFolder });
                    }}
                  >
                    <Ionicons name="folder" size={30} color={COLORS.primary} />
                    <Text style={styles.gridItemText} numberOfLines={1}>
                      {folder || 'Carpeta sin nombre'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteIcon}
                    onPress={() => confirmDeleteFolder(folder)}
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

      {/* Back to Home Button */}
      <TouchableOpacity
        style={[styles.actionButton, styles.backButton]}
        onPress={() => setScreen('Inicio')}
        disabled={isUploading || isDeleting}
      >
        <Ionicons name="home" size={24} color={COLORS.lightAccent} />
        <Text style={styles.actionButtonText}>Volver a Inicio</Text>
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
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightAccent,
    shadowColor: COLORS.darkAccent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  gridItemText: {
    fontSize: FONTS.caption,
    color: COLORS.text,
    textAlign: 'center',
    marginTop: SPACING.xs,
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
});

export default Subirinformacion;