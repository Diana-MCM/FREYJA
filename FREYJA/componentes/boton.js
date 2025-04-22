import { Text, TouchableOpacity, View } from "react-native";

const MiBoton = ({texto, onClick, stylo, colorf}) => {
    return (
        <TouchableOpacity onPress={onClick} style={stylo}>
            <Text style={{ color: colorf , fontSize: 22 }}>{texto}</Text>
        </TouchableOpacity>
    )

}

export default MiBoton;