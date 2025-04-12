import { View, Text } from "react-native";
export default function About() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>About This App</Text>
            <Text style={{ marginTop: 20, paddingHorizontal: 20, textAlign: 'center' }}>
                This app is designed to help you identify and learn about various cards.
                It uses advanced image recognition technology to provide accurate results.
            </Text>
            <Text style={{ marginTop: 20, paddingHorizontal: 20, textAlign: 'center' }}>
                Version 1.0.0
            </Text>
        </View>
    );
}