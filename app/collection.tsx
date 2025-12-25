import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, useWindowDimensions, Platform } from 'react-native';
import CardItem from '@/components/CardItem';

import { useCardContext, CollectionItem } from '../context/CardContext';
import { useSession } from '@/hooks/useAuth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/constants/themeColors';
import { ActivityIndicator } from 'react-native';
import { FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
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
    const [filterMode, setFilterMode] = useState<'all' | 'owned' | 'unowned'>('owned');
    const [sortBy, setSortBy] = useState<'price' | 'availability' | 'name' | 'priceTrend' | 'dateAdded'>('price');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const [showFilters, setShowFilters] = useState(false);
    const [showSorts, setShowSorts] = useState(false);

    const { session } = useSession();
    const { cardCollectionData, allCards } = useCardContext();
    const insets = useSafeAreaInsets();

    const SORT_LABELS: Record<string, string> = {
        price: 'Price',
        priceTrend: 'Trend',
        name: 'Name',
        dateAdded: 'Date',
    };

    // 1. Memoize Unowned Cards calculation
    const unownedCards = useMemo(() => {
        const ownedIds = new Set(cardCollectionData.map(cc => cc.cardMarketId));
        return allCards.filter(ac => !ownedIds.has(ac.cardMarketId));
    }, [allCards, cardCollectionData]);

    const unownedAndOwnedCards = useMemo(() => {
        return [...unownedCards, ...cardCollectionData];
    }, [unownedCards, cardCollectionData]);

    // 2. Memoize the Filtered and Sorted list
    // This will NOT re-run when showFilters or showSorts changes
    const memoizedCards = useMemo(() => {
        let list: CollectionItem[] = filterMode === 'unowned' ? unownedCards : cardCollectionData;
        if (filterMode === 'all') {
            list = unownedAndOwnedCards;
        }

        // Search Filter
        const q = searchQuery.trim().toLowerCase();
        if (q) {
            list = list.filter((c: any) =>
                ((c.card_name || c.name || '') as string).toLowerCase().includes(q)
            );
        }

        // Owned Filter
        if (filterMode === 'owned') {
            list = list.filter((c: any) => (c.quantity ?? 0) > 0);
        }

        // Sorting
        const dir = sortDir === 'asc' ? 1 : -1;
        list.sort((a, b) => {
            if (sortBy === 'price') return dir * (Number(a.from_price ?? 0) - Number(b.from_price ?? 0));
            if (sortBy === 'name') return dir * String(a.name || '').localeCompare(String(b.name || ''));
            if (sortBy === 'dateAdded') {
                return dir * (new Date(a.collection_last_updated || 0).getTime() - new Date(b.collection_last_updated || 0).getTime());
            }
            if (sortBy === 'priceTrend') {
                const aTrend = Number(a.price_trend ? a.price_trend : (!a.avg && !a.avg_1d) ? a.trend_foil : 0);
                const bTrend = Number(b.price_trend ? b.price_trend : (!b.avg && !b.avg_1d) ? b.trend_foil : 0);
                return dir * (aTrend - bTrend);
            }
            return 0;
        });

        return list;
    }, [filterMode, searchQuery, sortBy, sortDir, unownedCards, cardCollectionData]);

    // 3. Memoize Stats
    const { totalValue, totalCards, totalTrendValue } = useMemo(() => {


        const totalFromPrice = memoizedCards.reduce((sum, card) => sum + (card.from_price ?? 0) * (card.quantity ?? 0), 0);
        const totalFromPriceFoil = memoizedCards.reduce((sum, card) => sum + (card.low_foil ?? 0) * (card.quantity_foil ?? 0), 0);
        const totalValue = totalFromPrice + totalFromPriceFoil;
        const totalCards = memoizedCards.reduce((sum, card) => sum + (card.quantity ?? 0) + (card.quantity_foil ?? 0), 0);
        const totalTrendPrice = memoizedCards.reduce((sum, card) => sum + ((card.price_trend ? card.price_trend : (!card.avg && !card.avg_1d) ? card.trend_foil : 0) ?? 0) * (card.quantity ?? 0), 0);

        const totalTrendValue = totalTrendPrice;
        return {
            totalValue: totalValue,
            totalCards: totalCards,
            totalTrendValue: totalTrendValue

        };
    }, [memoizedCards]);




    const handleSortPress = (id: string) => {
        if (sortBy === id) {
            setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(id as any);
            setSortDir('desc');
        }
        setShowSorts(false);
    };

    if (!session) return <Redirect href="/login" />;

    return (
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <View style={styles.contentWrapper}>
                <View style={styles.headerControls}>
                    <View style={styles.searchWrapper}>
                        <FontAwesome6 name="magnifying-glass" size={14} color={colors.mutedForeground} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search cards..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={colors.mutedForeground}
                        />
                    </View>

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                showFilters && styles.buttonOpen,
                                !showFilters && styles.buttonHasActiveState
                            ]}
                            onPress={() => { setShowFilters(!showFilters); setShowSorts(false); }}
                        >
                            <View style={{ position: 'relative' }}>
                                <MaterialCommunityIcons
                                    name="filter-variant"
                                    size={18}
                                    color={showFilters ? "#000" : colors.foreground}
                                />
                            </View>
                            <Text style={[styles.actionButtonText, showFilters && styles.textActive]}>
                                {filterMode.charAt(0).toUpperCase() + filterMode.slice(1)}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                showSorts && styles.buttonOpen,
                                !showSorts && styles.buttonHasActiveState
                            ]}
                            onPress={() => { setShowSorts(!showSorts); setShowFilters(false); }}
                        >
                            <View style={{ position: 'relative' }}>
                                <MaterialCommunityIcons
                                    name="sort-variant"
                                    size={18}
                                    color={showSorts ? "#000" : colors.foreground}
                                />
                            </View>
                            <Text style={[styles.actionButtonText, showSorts && styles.textActive]}>
                                {SORT_LABELS[sortBy]} {!showSorts && (sortDir === 'asc' ? '↑' : '↓')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Dropdowns... (same as before) */}
                {showFilters && (
                    <View style={styles.dropdownMenu}>
                        <Text style={styles.menuLabel}>Show Cards:</Text>
                        <View style={styles.optionRow}>
                            {['all', 'owned', 'unowned'].map((mode) => (
                                <TouchableOpacity
                                    key={mode}
                                    style={[styles.menuOption, filterMode === mode && styles.menuOptionActive]}
                                    onPress={() => { setFilterMode(mode as any); setShowFilters(false); }}
                                >
                                    <Text style={[styles.optionText, filterMode === mode && styles.textActive]}>
                                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {showSorts && (
                    <View style={styles.dropdownMenu}>
                        <Text style={styles.menuLabel}>Sort By:</Text>
                        <View style={styles.sortGrid}>
                            {Object.entries(SORT_LABELS).map(([id, label]) => (
                                <TouchableOpacity
                                    key={id}
                                    style={[styles.menuOption, sortBy === id && styles.menuOptionActive]}
                                    onPress={() => handleSortPress(id)}
                                >
                                    <Text style={[styles.optionText, sortBy === id && styles.textActive]}>
                                        {label} {sortBy === id ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.statsBar}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 14, marginBottom: 12 }}>
                        {totalCards} cards · <Text style={{ color: colors.primary }}>{totalValue.toFixed(2)}€</Text> <Text style={{ color: colors.primary }}><FontAwesome6 name="arrow-trend-up" size={14} /> {totalTrendValue ? `${Number(totalTrendValue).toFixed(2)}€` : ''}</Text></Text>
                </View>

                <WindowGrid
                    data={memoizedCards}
                    renderCard={(item) => (
                        <CardItem
                            card={item}
                            showCollection={true}
                            dimmed={filterMode === 'unowned' || (item.quantity ?? 0) === 0}
                            onPress={(c) => Linking.openURL(c?.card_url).catch(() => { })}
                        />
                    )}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    contentWrapper: { maxWidth: 1536, marginHorizontal: 'auto', flex: 1, width: '100%' },
    headerControls: {
        padding: 16,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        zIndex: 10,
    },
    searchWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: { marginRight: 8 },
    searchInput: {
        flex: 1,
        color: colors.foreground,
        fontSize: 14,
        ...Platform.select({ web: { outlineStyle: 'none' } }),
    },
    buttonGroup: { flexDirection: 'row', gap: 8 },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 6,
    },
    buttonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    actionButtonText: { color: colors.foreground, fontSize: 14, fontWeight: '600' },
    textActive: { color: '#000' },

    // Dropdown Styles
    dropdownMenu: {
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    menuLabel: { color: colors.mutedForeground, fontSize: 12, marginBottom: 12, fontWeight: '700', textTransform: 'uppercase' },
    optionRow: { flexDirection: 'row', gap: 8 },
    sortGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    menuOption: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    menuOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    optionText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },

    statsBar: { paddingHorizontal: 16, marginBottom: 8 },
    statsText: { color: colors.mutedForeground, fontSize: 13 },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        gap: 8,
        position: 'relative', // Necessary for absolute positioning of dot
    },
    buttonOpen: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    buttonHasActiveState: {
        borderColor: colors.primary, // Highlight border to show something is active
        backgroundColor: 'rgba(59, 130, 246, 0.1)', // Very subtle tint
    },
    indicatorDot: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary,
        borderWidth: 1,
        borderColor: colors.background, // Creates a small gap so it stands out
    },

});

export default Collection;