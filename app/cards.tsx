import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import CardItem from '@/components/CardItem';
import { Linking } from 'react-native';
import { fetchExpansions, fetchCardsWithPrices, fetchCards } from '@/actions/cardsApi';

const CardsView: React.FC = () => {
  const [expansions, setExpansions] = useState<string[]>([]);
  const [selectedExpansion, setSelectedExpansion] = useState<string | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [rarities, setRarities] = useState<string[]>(['All']);
  const [rarityFilter, setRarityFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'price' | 'availability' | 'name'>('price');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Try to load expansions on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const exps = await fetchExpansions('riftbound');
        if (!mounted) return;
        if (Array.isArray(exps)) {
          setExpansions(exps.map((e: any) => e.name || e.title || String(e)));
          setSelectedExpansion((exps[0] && (exps[0].name || exps[0].title || exps[0])) || null);
        } else {
          // fallback: use keys if object
          setExpansions([]);
        }
      } catch (err) {
        console.warn('Could not fetch expansions, using empty list', err);
        setExpansions([]);
      }
    })();
    return () => { mounted = false };
  }, []);

  // Fetch cards once on mount. We'll filter client-side when user switches expansions.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        // prefer cards with prices endpoint if available
        const result = await fetchCardsWithPrices('riftbound');
        if (!mounted) return;
        const cardsArray = Array.isArray(result) ? result : (result && result.cards) ? result.cards : [];
        setCards(cardsArray);

        // derive rarities from the API result
        const raritySet = new Set<string>();
        cardsArray.forEach((c: any) => {
          const r = (c.rarity || c.rarity_name || (c.rarity && c.rarity.name) || '').toString().trim();
          if (r) raritySet.add(r);
        });
        const rarityList = ['All', ...Array.from(raritySet).sort((a, b) => a.localeCompare(b))];
        setRarities(rarityList);
        setRarityFilter('All');
      } catch (err) {
        console.warn('fetchCardsWithPrices failed, trying fetchCards', err);
        try {
          const result = await fetchCards('riftbound');
          if (!mounted) return;
          const cardsArray = Array.isArray(result) ? result : [];
          setCards(cardsArray);

          const raritySet = new Set<string>();
          cardsArray.forEach((c: any) => {
            const r = (c.rarity || c.rarity_name || (c.rarity && c.rarity.name) || '').toString().trim();
            if (r) raritySet.add(r);
          });
          const rarityList = ['All', ...Array.from(raritySet).sort((a, b) => a.localeCompare(b))];
          setRarities(rarityList);
          setRarityFilter('All');
        } catch (err2) {
          console.error('Could not fetch cards', err2);
          setCards([]);
          setRarities(['All']);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false };
  }, []);

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
    } else if (sortBy === 'availability') {
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
      <Text style={styles.header}>Cards Gallery</Text>

      {/* Filters bar */}
      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          placeholder="Search cards by name"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.expansionsRow}>
          {['All', ...expansions].map((exp) => (
            <TouchableOpacity key={exp} onPress={() => setSelectedExpansion(exp === 'All' ? null : exp)} style={[styles.expansionButton, (selectedExpansion === exp || (exp === 'All' && !selectedExpansion)) && styles.expansionActive]}>
              <Text style={[styles.expansionText, (selectedExpansion === exp || (exp === 'All' && !selectedExpansion)) && styles.expansionTextActive]}>{exp}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.rowControls}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
            {rarities.map((r: string) => (
              <TouchableOpacity key={r} onPress={() => setRarityFilter(r)} style={[styles.rarityButton, rarityFilter === r && styles.rarityActive]}>
                <Text style={rarityFilter === r ? styles.rarityTextActive : styles.rarityText}>{r}</Text>
              </TouchableOpacity>
            ))}
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
              <Text style={sortBy === 'price' ? styles.sortTextActive : styles.sortText}>Price {sortBy === 'price' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</Text>
            </TouchableOpacity>

            <TouchableOpacity
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
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 20, fontWeight: '700', padding: 12 },
  filters: { paddingHorizontal: 12 },
  search: { height: 40, borderColor: '#ddd', borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, marginBottom: 8 },
  expansionsRow: { marginBottom: 8 },
  expansionButton: { paddingVertical: 6, paddingHorizontal: 10, marginRight: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd' },
  expansionActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
  expansionText: { color: '#333' },
  expansionTextActive: { color: '#fff' },
  rowControls: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rarityButton: { paddingVertical: 6, paddingHorizontal: 10, marginRight: 8, borderRadius: 16, borderWidth: 1, borderColor: '#ddd' },
  rarityActive: { backgroundColor: '#f0f0f0' },
  rarityText: { color: '#333' },
  rarityTextActive: { color: '#000', fontWeight: '700' },
  sortButtons: { flexDirection: 'row', marginLeft: 8 },
  sortButton: { paddingVertical: 6, paddingHorizontal: 10, marginRight: 6, borderRadius: 6, borderWidth: 1, borderColor: '#ddd' },
  sortActive: { backgroundColor: '#007bff', borderColor: '#007bff' },
  sortText: { color: '#333' },
  sortTextActive: { color: '#fff' },
});

export default CardsView;
