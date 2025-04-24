import app from './firebase';
import { get, ref, getDatabase, set, update, remove, onValue } from "firebase/database";

//databaseURL: "https://progra-95d00-default-rtdb.firebaseio.com"

const db = getDatabase(app);
const createRef = (path) => ref(db,path);

async function guardarInfo(path, info) {
    let confirmacion= await set(createRef(path), info).then(()=>{
        return(true)
    }).catch((error)=>{
        alert(error.message)
        return(false)
    })
    return(confirmacion)
}
async function leerInfo(path) {
    let respuesta = await get(createRef(path)).then((snapShot)=>{
       return(snapShot)
    }).catch((error)=>{
        alert(error.message)
        return(false)
    })
    return(respuesta)
}

const cambiosInfo = (path, onDataChange) => {   
    const unsubscribe = onValue(createRef(path), (snapShot)=>{
        const data = snapShot.val();
        onDataChange(data);   
    })
    return () => unsubscribe();

}
async function eliminarInfo(path) {
    let confirmacion = await remove(createRef(path)).then(() => {
        return true;
    }).catch((error) => {
        alert(error.message);
        return false;
    });
    return confirmacion;
}

export {
    guardarInfo,
    leerInfo,
    cambiosInfo,
    eliminarInfo 
}