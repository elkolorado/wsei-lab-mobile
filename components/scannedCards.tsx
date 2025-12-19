import { ScrollView } from "react-native";
import FoundCardDetails from "./foundCardDetails";
import style from "./style";
import { Text, View } from 'react-native';
import Badge from "./badge";
import { colors } from "@/constants/themeColors";
type Props = {
    results: any[];
}



const ScannedCards: React.FC<Props> = ({ results }) => {
    function spinner() {
        return <Text style={styles.message}>Loading...</Text>;
    }
    return (
        <View style={{ flex: 1, width: '100%', paddingTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, color: colors.primary }}>Scanned Cards</Text>
                <Badge
                    label={results.length.toString()}
                    bgColor=""
                    textColor={colors.primary}
                    borderColor={colors.primary}
                />
            </View>


            <View style={styles.scannedCardsContainer}>
            {results.length === 0 ? (
                <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsMessage}>No scanned cards yet</Text>
                    <Text style={styles.noResultsSubMessage}>Scan cards to see them listed here</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingTop: 8 }}>
                    {results.map((item, index) => (
                        <FoundCardDetails
                            key={index}
                            cardName={item.cardName}
                            cardInfo={item.cardInfo}
                            photoUri={item.photoUri}
                            result={item.result}
                            spinner={spinner}
                        />
                    ))}
                </ScrollView>
            )}
            </View>

        </View>


    );
}

const styles = style();

export default ScannedCards;