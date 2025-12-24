import React, { useState } from 'react';
import { View, Text, TextInput,  TouchableOpacity, StyleSheet, FlatList, useWindowDimensions, Platform } from 'react-native';
import CardItem from '@/components/CardItem';

import { useCardContext, CollectionItem } from '../context/CardContext';
import { useSession } from '@/hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/themeColors';
import { fetchCardsWithPrices } from '@/actions/cardsApi';
import { ActivityIndicator } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { Redirect } from 'expo-router';

// using CollectionItem from context for collection rows

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



const Collection: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    const [filterMode, setFilterMode] = useState<'all' | 'owned' | 'unowned'>('all');
    const [unownedCards, setUnownedCards] = useState<CollectionItem[]>([]);
    const [loadingUnowned, setLoadingUnowned] = useState(false);
    const [sortBy, setSortBy] = useState<'price' | 'availability' | 'name' | 'priceTrend' | 'dateAdded'>('price');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const { cardCollectionData, tcgName } = useCardContext();
    const { session } = useSession();
    const insets = useSafeAreaInsets();

    if (!session) {
        return <Redirect href="/login" />;
    }
    // Build base list depending on filter mode, then apply search/owned filters (when applicable) and sorting
    let baseList: CollectionItem[] = filterMode === 'unowned' ? unownedCards.slice() : cardCollectionData.slice();

    // Apply search and owned filter for collection lists; for unowned also apply search
    const q = (searchQuery || '').trim().toLowerCase();
    if (q) {
        baseList = baseList.filter((c: any) => ((c.card_name || c.name || '') as string).toLowerCase().includes(q));
    }
    if (filterMode === 'owned') {
        baseList = baseList.filter((c: any) => (c.quantity ?? 0) > 0);
    }

    // Sorting
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'price') {
        baseList.sort((a: CollectionItem, b: CollectionItem) => dir * (Number(a.from_price ?? 0) - Number(b.from_price ?? 0)));
    } else if (sortBy === 'priceTrend') {
        baseList.sort((a: CollectionItem, b: CollectionItem) => {
            const extractTrend = (card: CollectionItem) => {
                const trend = card?.price_trend ? card.price_trend : (!card?.avg && !card?.avg_1d) ? card.trend_foil : null;
                const n = Number(trend ?? 0);
                return Number.isFinite(n) ? n : 0;
            };
            return dir * (extractTrend(a) - extractTrend(b));
        });
    } else if (sortBy === 'availability') {
        baseList.sort((a: CollectionItem, b: CollectionItem) => dir * (Number(a.available ?? a.available_foil ?? 0) - Number(b.available ?? b.available_foil ?? 0)));

    }
    else if (sortBy === 'name') {
        baseList.sort((a: CollectionItem, b: CollectionItem) => dir * String(a.name || '').localeCompare(String(b.name || '')));
    } else if (sortBy === 'dateAdded') {
        baseList.sort((a: CollectionItem, b: CollectionItem) => {
            const dateA = new Date(a.collection_last_updated || 0).getTime();
            const dateB = new Date(b.collection_last_updated || 0).getTime();
            return dir * (dateA - dateB);
        });
    }
    const filteredCards = baseList;

    const totalFromPrice = filteredCards.reduce((sum, card) => sum + (card.from_price ?? 0) * (card.quantity ?? 0), 0);
    const totalFromPriceFoil = filteredCards.reduce((sum, card) => sum + (card.low_foil ?? 0) * (card.quantity_foil ?? 0), 0);
    const totalValue = totalFromPrice + totalFromPriceFoil;
    const totalCards = filteredCards.reduce((sum, card) => sum + (card.quantity ?? 0) + (card.quantity_foil ?? 0), 0);


    const totalTrendPrice = filteredCards.reduce((sum, card) => sum + ((card.price_trend ? card.price_trend : (!card.avg && !card.avg_1d) ? card.trend_foil : 0) ?? 0) * (card.quantity ?? 0), 0);

    const totalTrendValue = totalTrendPrice;




    // Fetch unowned cards list when user toggles to Unowned
    React.useEffect(() => {
        let mounted = true;
        const loadUnowned = async () => {
            if (filterMode !== 'unowned') return;
            setLoadingUnowned(true);
            try {
                const tcg = tcgName || 'dragon ball fusion world';
                const cardsResult = await fetchCardsWithPrices(tcg);
                if (!mounted) return;
                const cardsArray = Array.isArray(cardsResult) ? cardsResult : (cardsResult && cardsResult.cards) ? cardsResult.cards : [];
                // exclude cards that appear in user's collection (match by cardMarketId or id/card_id)
                const ownedMarketIds = new Set(cardCollectionData.map((c) => c.cardMarketId).filter(Boolean));
                const ownedIds = new Set(cardCollectionData.map((c) => c.card_id).filter(Boolean));
                const unowned = cardsArray.filter((c: any) => {
                    if (c.cardMarketId != null && ownedMarketIds.has(c.cardMarketId)) return false;
                    if (c.id != null && ownedIds.has(c.id)) return false;
                    return true;
                });
                setUnownedCards(unowned);
            } catch (err) {
                console.error('Failed to load unowned cards', err);
            } finally {
                if (mounted) setLoadingUnowned(false);
            }
        };
        loadUnowned();
        return () => { mounted = false };
    }, [filterMode, cardCollectionData, tcgName]);


    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={{ maxWidth: 1536, marginInline: 'auto', flex: 1, width: '100%' }}>

                {/* My collection 2 cards (dot) $77.98 total value */}


                {/* Filters bar - search */}
                <View style={styles.filters}>




                    <View style={styles.toggleRow}>
                        <TextInput
                            style={{ outline: 'none', color: colors.foreground, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 48, backgroundColor: 'rgba(255,255,255,0.05)' }}
                            placeholder="Search cards by name"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            selectionColor={colors.primary}
                            placeholderTextColor={colors.colorForeground}
                        />

                        <TouchableOpacity style={[styles.toggleButton, filterMode === 'all' && styles.toggleActive]} onPress={() => setFilterMode('all')}>
                            <Text style={filterMode === 'all' ? styles.toggleTextActive : styles.toggleText}>All</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.toggleButton, filterMode === 'owned' && styles.toggleActive]} onPress={() => setFilterMode('owned')}>
                            <Text style={filterMode === 'owned' ? styles.toggleTextActive : styles.toggleText}>Owned</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.toggleButton, filterMode === 'unowned' && styles.toggleActive]} onPress={() => setFilterMode('unowned')}>
                            <Text style={filterMode === 'unowned' ? styles.toggleTextActive : styles.toggleText}>Unowned</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.sortButtons}>
                        <TouchableOpacity
                            onPress={() => {
                                if (sortBy === 'price') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                                else {
                                    setSortBy('price');
                                    setSortDir('desc');
                                }
                            }}
                            style={[styles.sortButton, sortBy === 'price' && styles.sortActive]}
                        >
                            <Text style={sortBy === 'price' ? styles.sortTextActive : styles.sortText}>From Price {sortBy === 'price' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                if (sortBy === 'priceTrend') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                                else {
                                    setSortBy('priceTrend');
                                    setSortDir('desc');
                                }
                            }}
                            style={[styles.sortButton, sortBy === 'priceTrend' && styles.sortActive]}
                        >
                            <Text style={sortBy === 'priceTrend' ? styles.sortTextActive : styles.sortText}>Price Trend {sortBy === 'priceTrend' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                if (sortBy === 'name') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                                else {
                                    setSortBy('name');
                                    setSortDir('asc');
                                }
                            }}
                            style={[styles.sortButton, sortBy === 'name' && styles.sortActive]}
                        >
                            <Text style={sortBy === 'name' ? styles.sortTextActive : styles.sortText}>Name {sortBy === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                if (sortBy === 'dateAdded') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                                else {
                                    setSortBy('dateAdded');
                                    setSortDir('desc');
                                }
                            }}
                            style={[styles.sortButton, sortBy === 'dateAdded' && styles.sortActive]}
                        >
                            <Text style={sortBy === 'dateAdded' ? styles.sortTextActive : styles.sortText}>Date Added {sortBy === 'dateAdded' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: 4 }}>
                        <Text style={{ color: colors.mutedForeground, fontSize: 14, marginBottom: 12 }}>
                            {totalCards} cards · <Text style={{ color: colors.primary }}>{totalValue.toFixed(2)}€</Text> <Text style={{ color: colors.primary }}><FontAwesome6 name="arrow-trend-up" size={14} /> {totalTrendValue ? `${Number(totalTrendValue).toFixed(2)}€` : ''}</Text></Text>
                    </View>
                </View>





                {/* Card Gallery — responsive grid using same layout as cards.tsx */}
                {filterMode === 'unowned' && loadingUnowned ? (
                    <ActivityIndicator style={{ marginTop: 40 }} />
                ) : (
                    <WindowGrid
                        data={filteredCards}
                        renderCard={(item: any) => (
                            <CardItem
                                card={item}
                                showCollection={true}
                                dimmed={filterMode === 'unowned'}
                                onPress={(c: any) => {
                                    const url = c?.card_url || c?.cardUrl || c?.card_url;
                                    if (url) {
                                        Linking.openURL(String(url)).catch((err) => console.warn('Failed to open url', err));
                                    } else {
                                        console.log('No card_url for', c);
                                    }
                                }}
                            />
                        )}
                    />
                )}



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
    toggleRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    toggleButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.03)'
    },
    toggleActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    toggleText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
    toggleTextActive: { color: '#000', fontWeight: '700' },
    sortButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8
    },
    sortButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.03)'
    },
    sortActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    sortText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
    sortTextActive: { color: '#000', fontWeight: '700' },
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