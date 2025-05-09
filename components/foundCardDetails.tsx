import { useCardContext } from '@/app/context/CardContext';
import React from 'react';
import { View, Text, Image, StyleSheet, Button } from 'react-native';
import { Linking } from 'react-native';

interface FoundCardDetailsProps {
    cardName?: string;
    cardInfo?: {
        availability?: string;
        price?: string;
        link?: string;
    };
    photoUri?: string;
    result?: string;
    spinner: () => JSX.Element;

}

const FoundCardDetails: React.FC<FoundCardDetailsProps> = ({ cardName, cardInfo, photoUri, result, spinner }) => {
    const { addCard } = useCardContext();
    return (
        <View style={{ flexDirection: 'row', padding: 20, backgroundColor: 'rgba(255,255,255,1)', borderRadius: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 3 }}>
            <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>Name: <span style={{ fontWeight: 'normal' }}>{cardName || spinner()}</span></Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>Availability: <span style={{ fontWeight: 'normal' }}>{cardInfo?.availability || spinner()}</span></Text>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>Price: <span style={{ fontWeight: 'normal' }}>{cardInfo?.price || spinner()}</span></Text>
                <Text
                    style={{ fontSize: 14, textDecorationLine: 'underline', color: 'blue' }}
                    onPress={() => Linking.openURL(cardInfo?.link || '')}
                >
                    Card Market Link
                </Text>
            </View>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                {photoUri && (
                    <Image source={{ uri: photoUri }} style={[styles.capturedImage, { marginRight: 10, borderRadius: 10 }]} />
                )}
                {result && (
                    <Image
                        source={{
                            uri: 'https://www.dbs-cardgame.com/fw/images/cards/card/en/' + JSON.parse(result).best_match,
                        }}
                        style={[styles.capturedImage, { borderRadius: 10 }]}
                    />
                )}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <View style={{ flexDirection: 'row' }}>
                    <View style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                            <Button
                                title="✏️ Correction"
                                onPress={() => {
                                    console.log('Edit button pressed');
                                }}>
                            </Button>

                        </View> */}
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Button
                                title="💾 Save to my collection"
                                onPress={() => {
                                    if (result) {
                                        const newCard = {
                                            id: Date.now().toString(),
                                            name: cardName || 'Unknown Card',
                                            image: 'https://www.dbs-cardgame.com/fw/images/cards/card/en/' + JSON.parse(result).best_match || '',
                                            quantity: 1,
                                            set: 'Set 1',
                                        };
                                        addCard(newCard);
                                    }
                                    // Use the context to add the card
                                }} />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    capturedImage: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
        margin: 10,
    },
});

export default FoundCardDetails;