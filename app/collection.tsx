import React, { useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, Modal, Button, FlatList, useWindowDimensions, Platform } from 'react-native';
import CardItem from '@/components/CardItem';
import { API_ENDPOINT } from '@/constants/apiConfig';
import { CardProvider, useCardContext, CollectionItem } from '../context/CardContext';
import LoginScreen from './login';
import { useSession } from '@/hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/themeColors';
import { FontAwesome6 } from '@expo/vector-icons';

// using CollectionItem from context for collection rows



const Collection: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCard, setSelectedCard] = useState<CollectionItem | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const { cardCollectionData } = useCardContext();
    const { session } = useSession();
    const insets = useSafeAreaInsets();

    if (!session) return <LoginScreen />;

    const filteredCards = cardCollectionData.filter((card) => (card.name).toLowerCase().includes(searchQuery.toLowerCase()));

    const totalFromPrice = filteredCards.reduce((sum, card) => sum + (card.from_price ?? 0) * (card.quantity ?? 0), 0);
    const totalFromPriceFoil = filteredCards.reduce((sum, card) => sum + (card.low_foil ?? 0) * (card.quantity_foil ?? 0), 0);
    const totalValue = totalFromPrice + totalFromPriceFoil;
    const totalCards = filteredCards.reduce((sum, card) => sum + (card.quantity ?? 0) + (card.quantity_foil ?? 0), 0);


    const totalTrendPrice = filteredCards.reduce((sum, card) => sum + ((card.price_trend ? card.price_trend : (!card.avg && !card.avg_1d) ? card.trend_foil : 0) ?? 0) * (card.quantity ?? 0), 0);

    const totalTrendValue = totalTrendPrice;


    const WindowGrid: React.FC<{ data: any[]; renderCard: (item: any) => React.ReactNode }> = ({ data, renderCard }) => {
        const { width } = useWindowDimensions();

        const getColumnsForWidth = (w: number) => {
            if (w >= 3000) return 12;
            if (w >= 2400) return 10;
            if (w >= 1920) return 8;
            if (w >= 1400) return 6;
            if (w >= 1000) return 4;
            if (w >= 600) return 3;
            return 2;
        };

        const numColumns = Math.max(1, getColumnsForWidth(width));

        return (
            <FlatList
                data={data}
                keyExtractor={(item, idx) => String(item.user_collection_id ?? item.cardMarketId ?? item.card_id ?? idx)}
                numColumns={numColumns}
                renderItem={({ item }) => (
                    <View style={{ width: `${100 / numColumns}%`, padding: 4 }}>
                        {renderCard(item)}
                    </View>
                )}
                contentContainerStyle={{ padding: 8 }}
            />
        );
    };

    const handleCardPress = (card: CollectionItem) => {
        setSelectedCard(card);
        setModalVisible(true);
    };

    const closeModal = () => {
        setSelectedCard(null);
        setModalVisible(false);
    };

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={{ maxWidth: 1536, marginInline: 'auto', flex: 1, width: '100%' }}>

                {/* My collection 2 cards (dot) $77.98 total value */}


                {/* Filters bar - search */}
                <View style={styles.filters}>
                    <TextInput
                        style={{ outline: 'none', color: colors.foreground, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: 'rgba(255,255,255,0.05)' }}
                        placeholder="Search cards by name"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        selectionColor={colors.primary}
                        placeholderTextColor={colors.colorForeground}
                    />

                    <View>
                        {/* <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: 'bold', marginVertical: 16 }}>My Collection</Text> */}
                        <Text style={{ color: colors.mutedForeground, fontSize: 14, marginBottom: 12 }}>
                            {totalCards} cards · <Text style={{ color: colors.primary }}>{totalValue}€</Text> <Text><FontAwesome6 name="arrow-trend-up" size={14} /> {totalTrendValue ? `${Number(totalTrendValue)}€` : ''}</Text></Text>
                    </View>

                </View>



                {/* Card Gallery — responsive grid using same layout as cards.tsx */}
                <WindowGrid
                    data={filteredCards}
                    renderCard={(item: CollectionItem) => (
                        <CardItem
                            card={item}
                            showCollection={true}
                            onPress={() => handleCardPress(item)}
                        />
                    )}
                />

                {/* Modal for Fullscreen Image */}
                <Modal visible={isModalVisible} transparent={true} animationType="fade">
                    <View style={styles.modalContainer}>
                        <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
                            <Text style={styles.modalCloseText}>Close</Text>
                        </TouchableOpacity>
                        {selectedCard && (
                            <Image source={{ uri: selectedCard.image_url || `${API_ENDPOINT}/card-image/${selectedCard.tcg_id}/${selectedCard.cardMarketId}.png` }} style={styles.fullscreenImage} />
                        )}
                    </View>
                </Modal>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    filters: {
        paddingHorizontal: 16,
        gap: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
    },
    search: {
        height: 48,
        color: colors.foreground,
        fontSize: 16,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        ...Platform.select({ web: { outlineStyle: 'none' } }),
    },
    tabs: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    tab: {
        flex: 1,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginHorizontal: 5,
    },
    activeTab: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    tabText: {
        color: '#fff',
    },
    card: {
        flex: 1,
        margin: 5,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        alignItems: 'center',
    },
    cardImage: {
        width: 150,
        height: 210,
        marginBottom: 10,
    },
    cardName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    cardQuantity: {
        fontSize: 14,
        color: '#555',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 5,
    },
    modalCloseText: {
        color: '#000',
        fontWeight: 'bold',
    },
    fullscreenImage: {
        width: '90%',
        height: '80%',
        resizeMode: 'contain',
    },
});

export default Collection;