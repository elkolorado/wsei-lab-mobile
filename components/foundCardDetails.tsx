import { useCardContext } from '@/context/CardContext';
import { API_ENDPOINT } from '../constants/apiConfig';
import React, { useState, JSX } from 'react';
import { View, Text, Image, StyleSheet, Button } from 'react-native';
import { Linking } from 'react-native';
import { colors } from '@/constants/themeColors';

export type CardMarketCard = {
    id: number;
    expansion_id: number;
    cardMarketId: number;
    name: string;
    number: string;
    rarity: string;
    image_url: string;
    card_url: string;
    last_updated: string;
    tcg_id: number;
    card_id: number;
    available: number | null;
    price: number | null;
    available_foil: number | null;
    price_foil: number | null;
    from_price: number | null;
    price_trend: number | null;
    avg_30d: number | null;
    avg_7d: number | null;
    avg_1d: number | null;
    avg: number | null;
    low_foil: number | null;
    trend_foil: number | null;
    avg1_foil: number | null;
    avg7_foil: number | null;
    avg30_foil: number | null;
    versions_url: string;
    printed_in: string;
    reprints: string;
    chart_data: {
        date: string;
        price: number;
    }[];
};

interface FoundCardDetailsProps {
    cardName?: string;
    cardInfo?: CardMarketCard;
    photoUri?: string;
    result?: string;
    spinner: () => JSX.Element;
}

const FoundCardDetails: React.FC<FoundCardDetailsProps> = ({ cardName, cardInfo, photoUri, result, spinner }) => {
    const { addCard, removeCard } = useCardContext();
    const [isCardAdded, setIsCardAdded] = useState(false);
    const [addedCardId, setAddedCardId] = useState<string | null>(null);

    const handleAddCard = async () => {
        if (result) {
            const newCard = {
                id: Date.now().toString(),
                name: cardName || 'Unknown Card',
                image: 'https://www.dbs-cardgame.com/fw/images/cards/card/en/' + (JSON.parse(result).best_match || ''),
                quantity: 1,
                set: 'Set 1',
            };

            await addCard(newCard);
            setAddedCardId(newCard.name);
            setIsCardAdded(true);
        }
    };

    const handleRemoveCard = async () => {
        if (addedCardId) {
            await removeCard(addedCardId);
            setIsCardAdded(false);
            setAddedCardId(null);
        }
    };

    return (
        <View style={styles.container}>
            {/* 1. Name Row: Flexible height, will push the rest down */}
            <View style={styles.nameRow}>
                <Text
                    style={styles.nameText}
                    onPress={() => {
                        if (cardInfo?.card_url) Linking.openURL(cardInfo.card_url);
                    }}
                // Removed numberOfLines to allow it to be multi-line
                >
                    {cardInfo?.name?.replace?.("[Fusion World]", "") || spinner()}
                </Text>
            </View>

            {/* 2. Content Row: This expands to fill the remaining 175px */}
            <View style={styles.contentRow}>

                {/* 3. Photos Column: Flex 1 so it shrinks/grows to fit space */}
                <View style={styles.photosColumn}>
                    {result && (
                        <Image
                            source={{
                                uri: `${API_ENDPOINT}/card-image/${cardInfo?.tcg_id}/${JSON.parse(result).best_match}`,
                            }}
                            style={[styles.cardImageResult, styles.cardImage]}
                        />
                    )}
                    {photoUri && (
                        <Image source={{ uri: photoUri }} style={[styles.cardImageTaken, styles.cardImage]} />
                    )}

                </View>

                {/* 4. Prices Column: Fixed width / wrap-content to ensure visibility */}
                <View style={styles.pricesColumn}>
                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Price</Text>
                        <Text style={styles.priceValue}>
                            {cardInfo?.price != null ? `${cardInfo.price}€` : 'N/A'} / {cardInfo?.price_foil != null ? `${cardInfo.price_foil}€` : 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.priceContainer}>
                        <Text style={styles.priceLabel}>Trend</Text>
                        <Text style={styles.priceValue}>
                            {cardInfo?.price_trend != null ? `${cardInfo.price_trend}€` : 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.actionWrapper}>
                        <Button title="💾 Save" onPress={handleAddCard} />
                        {isCardAdded && (
                            <View style={styles.undoButton}>
                                <Button title="↩️" onPress={handleRemoveCard} color="red" />
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 175, // Lock the height
        borderColor: "#d4af374d",
        borderRadius: 16,
        borderWidth: 2,
        padding: 10,
        backgroundColor: "#af85960d",
        overflow: 'hidden',
    },
    nameRow: {
        width: '100%',
        marginBottom: 8,
        flexShrink: 0, // Ensure name doesn't get cut off by images
    },
    nameText: {
        fontSize: 15,
        fontWeight: 'bold',
        textDecorationLine: 'underline',
        color: colors.mutedForeground,
    },
    contentRow: {
        flex: 1, // Takes all space left after NameRow
        flexDirection: 'row',
        alignItems: 'stretch', // Stretch children vertically
        gap: 10,
    },
    photosColumn: {
        flex: 1, // Shrink or grow images to fill what's left
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardImageResult: {
        borderColor: colors.gold,
        borderWidth: 2,
    },
    cardImage: {
        height: '100%',
        aspectRatio: 0.71,
        resizeMode: 'contain',
        borderRadius: 6,
    },
    pricesColumn: {
        width: 100, // Fixed width ensures prices are always visible and aligned
        justifyContent: 'center',
        flexShrink: 0, // Prevents price column from disappearing
    },
    priceContainer: {
        marginBottom: 4,
    },
    priceLabel: {
        fontSize: 10,
        color: colors.mutedForeground,
        textTransform: 'uppercase',
    },
    priceValue: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    actionWrapper: {
        marginTop: 4,
        flexDirection: 'row',
        gap: 4,
    },
    undoButton: {
        flex: 0.4,
    },
});

export default FoundCardDetails;