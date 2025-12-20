import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import CardItem from '@/components/CardItem';
import { Linking } from 'react-native';
import { fetchExpansions, fetchCardsWithPrices, fetchCards, fetchTCGs } from '@/actions/cardsApi';
import { colors } from '@/constants/themeColors';
import { Picker } from '@react-native-picker/picker';

const CardsView: React.FC = () => {
  const [expansions, setExpansions] = useState<string[]>([]);
  const [selectedExpansion, setSelectedExpansion] = useState<string | null>(null);
  const [tcgs, setTCGs] = useState<string[]>([]);
  const [selectedTCG, setSelectedTCG] = useState<string | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [rarities, setRarities] = useState<string[]>(['All']);
  const [rarityFilter, setRarityFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'price' | 'availability' | 'name' | 'priceTrend'>('price');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const tcg_name = selectedTCG || 'riftbound';

  // 1. Keep TCG fetch on mount only
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tcgList = await fetchTCGs();
        if (!mounted) return;
        if (Array.isArray(tcgList)) {
          setTCGs(tcgList.map((t: any) => t.name));
        }
      } catch (err) {
        console.warn('Could not fetch TCGs', err);
      }
    })();
    return () => { mounted = false };
  }, []);

  // 2. Combined Effect for Expansions AND Cards
  // This triggers every time tcg_name (selectedTCG) changes
  useEffect(() => {
    let mounted = true;

    const loadTcgData = async () => {
      setLoading(true);
      // Reset filters and data when TCG changes to prevent UI ghosting
      setCards([]);
      setExpansions([]);
      setSelectedExpansion(null);

      try {
        // Fetch Expansions and Cards in parallel for better performance
        const [exps, cardResult] = await Promise.all([
          fetchExpansions(tcg_name),
          fetchCardsWithPrices(tcg_name).catch(() => fetchCards(tcg_name)) // Fallback if price fetch fails
        ]);

        if (!mounted) return;

        // Handle Expansions
        if (Array.isArray(exps)) {
          setExpansions(exps.map((e: any) => e.name || e.title || String(e)));
        }

        // Handle Cards
        const cardsArray = Array.isArray(cardResult)
          ? cardResult
          : (cardResult && cardResult.cards) ? cardResult.cards : [];

        setCards(cardsArray);

        // Derive Rarities
        const raritySet = new Set<string>();
        cardsArray.forEach((c: any) => {
          const r = (c.rarity || c.rarity_name || c.rarity?.name || '').toString().trim();
          if (r) raritySet.add(r);
        });
        setRarities(['All', ...Array.from(raritySet).sort()]);

      } catch (err) {
        console.error('Error loading TCG data:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadTcgData();

    return () => { mounted = false };
  }, [tcg_name]); // <--- Crucial: Effect runs whenever this changes

  const getCardExpansionName = (c: any) => {
    // attempt several possible fields the API might return
    if (!c) return '';
    if (typeof c.expansion === 'string') return c.expansion;
    if (c.expansion && typeof c.expansion === 'object') return c.expansion.name || c.expansion.title || '';
    if (c.expansion_name) return c.expansion_name;
    if (c.expansion_code) return c.expansion_code;
    if (c.expansion_id) return String(c.expansion_id);
    if (c.set && typeof c.set === 'string') return c.set;
    if (c.set && typeof c.set === 'object') return c.set.name || c.set.title || '';
    if (c.set_name) return c.set_name;
    if (c.series) return c.series;
    return '';
  };

  // Responsive grid helper using window width to determine number of columns
  const WindowGrid: React.FC<{ data: any[]; renderCard: (item: any) => React.ReactNode }> = ({ data, renderCard }) => {
    const { width } = useWindowDimensions();

    const getColumnsForWidth = (w: number) => {
      // breakpoints (px) - tune as needed
      if (w >= 3000) return 12; // ultra ultra-wide
      if (w >= 2400) return 10; // ultra-wide
      if (w >= 1920) return 8; // fullHD and above
      if (w >= 1400) return 6; // large desktop
      if (w >= 1000) return 4; // laptop / tablet landscape
      if (w >= 600) return 3; // tablet
      return 2; // mobile
    };

    const numColumns = Math.max(1, getColumnsForWidth(width));

    return (
      <FlatList
        data={data}
        keyExtractor={(item, idx) => String(item.id || item.cardMarketId || item.name || idx)}
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

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let out = cards.slice();
    if (selectedExpansion) {
      const sel = String(selectedExpansion).toLowerCase();
      out = out.filter((c) => {
        const setName = String(getCardExpansionName(c) || '').toLowerCase();
        return setName === sel;
      });
    }
    if (rarityFilter && rarityFilter !== 'All') {
      out = out.filter((c) => {
        const r = (c.rarity || c.rarity_name || (c.rarity && c.rarity.name) || '').toString().toLowerCase();
        return r === rarityFilter.toLowerCase();
      });
    }
    if (q) {
      out = out.filter((c) => (c.name || c.title || '').toLowerCase().includes(q));
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'price') {
      out.sort((a, b) => dir * (Number(a.from_price ?? a.price ?? a.avg_price ?? 0) - Number(b.from_price ?? b.price ?? b.avg_price ?? 0)));
    } else if (sortBy === 'priceTrend') {
      out.sort((a, b) => dir * (Number(a.price_trend ?? 0) - Number(b.price_trend ?? 0)));
    }
    else if (sortBy === 'availability') {
      out.sort((a, b) => dir * (Number(a.available ?? a.available_foil ?? a.stock ?? 0) - Number(b.available ?? b.available_foil ?? b.stock ?? 0)));
    } else {
      out.sort((a, b) => dir * String(a.name || '').localeCompare(String(b.name || '')));
    }

    return out;
  }, [cards, selectedExpansion, searchQuery, rarityFilter, sortBy, sortDir]);

  const renderCard = ({ item }: { item: any }) => (
    <CardItem card={item} onPress={(c) => console.log('Card press', c)} />
  );

  return (
    <View style={styles.container}>
      <View style={{ maxWidth: 1536, marginInline: 'auto', flex: 1, width: '100%' }}>
        <Text style={styles.header}>Cards Gallery</Text>

        {/* Filters bar */}
        <View style={styles.filters}>
          <TextInput
            style={styles.search}
            placeholder="Search cards by name"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <View style={styles.dropdownContainer}>
            <Picker
              selectedValue={selectedExpansion || 'All'}
              onValueChange={(itemValue) =>
                setSelectedExpansion(itemValue === 'All' ? null : itemValue)
              }
              // style={styles.picker}
              dropdownIconColor={colors.primary} // Matches your gold theme
              mode="dropdown" // Android specific
            >
              <Picker.Item label="All Expansions" value="All" color={Platform.OS === 'ios' ? colors.primary : undefined} />
              {expansions.map((exp) => (
                <Picker.Item
                  key={exp}
                  label={exp}
                  value={exp}
                  color={Platform.OS === 'ios' ? '#fff' : undefined}
                />
              ))}
            </Picker>

            <Picker
              selectedValue={selectedTCG || 'All'}
              onValueChange={(itemValue) =>
                setSelectedTCG(itemValue === 'All' ? null : itemValue)
              }
              // style={styles.picker}
              dropdownIconColor={colors.primary} // Matches your gold theme
              mode="dropdown" // Android specific
            >
              <Picker.Item label="All TCGs" value="All" color={Platform.OS === 'ios' ? colors.primary : undefined} />
              {tcgs.map((tcg) => (
                <Picker.Item
                  key={tcg}
                  label={tcg}
                  value={tcg}
                  color={Platform.OS === 'ios' ? '#fff' : undefined}
                />
              ))}
            </Picker>
          </View>

          <View style={styles.rowControls}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              {/* {rarities.map((r: string) => (
              <TouchableOpacity key={r} onPress={() => setRarityFilter(r)} style={[styles.rarityButton, rarityFilter === r && styles.rarityActive]}>
                <Text style={rarityFilter === r ? styles.rarityTextActive : styles.rarityText}>{r}</Text>
              </TouchableOpacity>
            ))} */}
            </ScrollView>

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
              {/* <TouchableOpacity
                onPress={() => {
                  if (sortBy === 'availability') setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                  else {
                    setSortBy('availability');
                    setSortDir('desc');
                  }
                }}
                style={[styles.sortButton, sortBy === 'availability' && styles.sortActive]}
              >
                <Text style={sortBy === 'availability' ? styles.sortTextActive : styles.sortText}>Availability {sortBy === 'availability' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</Text>
              </TouchableOpacity> */}

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
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : (
          <WindowGrid
            data={filtered}
            renderCard={(item: any) => (
              <CardItem
                card={item}
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
  header: { fontSize: 20, fontWeight: '700', padding: 12, color: colors.foreground },
  filters: { paddingHorizontal: 12 },
  search: { height: 40, borderColor: '#ddd', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, marginBottom: 8, color: colors.foreground, backgroundColor: colors.inputBackground },
  expansionsRow: { marginBottom: 8 },
  expansionButton: { paddingVertical: 6, paddingHorizontal: 10, marginRight: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', color: colors.foreground },
  expansionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  expansionText: { color: colors.foreground },
  expansionTextActive: { color: '#000', fontWeight: '700' },
  rowControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rarityButton: { paddingVertical: 6, paddingHorizontal: 10, marginRight: 8, borderRadius: 16, borderWidth: 1, borderColor: '#ddd' },
  rarityActive: { backgroundColor: '#f0f0f0' },
  rarityText: { color: colors.foreground },
  rarityTextActive: { color: '#000', fontWeight: '700' },
  sortButtons: { flexDirection: 'row', marginLeft: 8 },
  sortButton: { paddingVertical: 6, paddingHorizontal: 10, marginRight: 6, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  sortActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortText: { color: colors.foreground },
  sortTextActive: { color: '#000', fontWeight: '700' },
  dropdownContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginVertical: 10,
    overflow: 'hidden', // Ensures the picker doesn't bleed out of borders
  },
  picker: {
    height: 50,
    color: '#fff', // Text color for the selected item
    width: '100%',
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    ...Platform.select({
      // web: {
      //   outlineStyle: 'none',
      //   backgroundColor: 'transparent',
      //   cursor: 'pointer',
      // },
    }),
  },
});

export default CardsView;
