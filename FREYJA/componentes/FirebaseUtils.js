import { getDatabase, ref, update } from 'firebase/database';

export const inicializarEstructuraNotificaciones = async (userId) => {
  try {
    const db = getDatabase();
    await update(ref(db, `usuarios/${userId}/notificaciones`), {});
    console.log("✅ Estructura de notificaciones creada para usuario:", userId);
    return true;
  } catch (error) {
    console.error("❌ Error al crear estructura:", error);
    return false;
  }
};