import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, Modal, Button } from 'react-native';
import { CardProvider, useCardContext } from '../context/CardContext';
import LoginScreen from './login';
import { useSession } from '@/hooks/useAuth';

interface Card {
    id: string;
    name: string;
    image: string;
    set: string;
}



const Collection: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSet, setActiveSet] = useState('Set 1');
    const [selectedCard, setSelectedCard] = useState<Card | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const { cardData } = useCardContext();
    const { session } = useSession();
    const { addCard, removeCard } = useCardContext();
    if (!session) {
        return <LoginScreen />;
    }

    const filteredCards = cardData.filter(
        (card) =>
            // card.set === activeSet &&
            card.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCardPress = (card: Card) => {
        setSelectedCard(card);
        setModalVisible(true);
    };

    const closeModal = () => {
        setSelectedCard(null);
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            {/* Search Bar */}
            <TextInput
                style={styles.searchBar}
                placeholder="Search by name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            {/* Tabs for Card Sets */}
            {/* <View style={styles.tabs}>
                {['Set 1', 'Set 2'].map((set) => (
                    <TouchableOpacity
                        key={set}
                        style={[styles.tab, activeSet === set && styles.activeTab]}
                        onPress={() => setActiveSet(set)}
                    >
                        <Text style={styles.tabText}>{set}</Text>
                    </TouchableOpacity>
                ))}
            </View> */}

            {/* Card Gallery */}
            <FlatList
                data={filteredCards}
                keyExtractor={(item) => item.id}
                numColumns={4}
                columnWrapperStyle={filteredCards.length % 4 !== 0 ? { justifyContent: 'flex-start' } : null}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} onPress={() => handleCardPress(item)}>
                        <View>
                            <Image source={{ uri: 'https://www.dbs-cardgame.com/fw/images/cards/card/en/' + item.name }} style={styles.cardImage} />
                            <Text style={styles.cardName}>{item.name}</Text>
                            <View style={{ flexDirection: 'row', marginTop: 5, justifyContent: 'space-between', alignItems: 'center', zIndex: 9999 }}>

                                <Button
                                    title="-"
                                    color="red"
                                    onPress={() => removeCard(item.name.split('.webp')[0])}
                                />

                                <Text style={styles.cardQuantity}>Quantity: {item.quantity}</Text>
                                <Button
                                    title="+"
                                    onPress={() => addCard({...item, name: item.name.split('.webp')[0]})}
                                />
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />

            {/* Modal for Fullscreen Image */}
            <Modal visible={isModalVisible} transparent={true} animationType="fade">
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.modalCloseButton} onPress={closeModal}>
                        <Text style={styles.modalCloseText}>Close</Text>
                    </TouchableOpacity>
                    {selectedCard && (
                        <Image source={{ uri: 'https://www.dbs-cardgame.com/fw/images/cards/card/en/' + selectedCard.name }} style={styles.fullscreenImage} />
                    )}
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#fff',
    },
    searchBar: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
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