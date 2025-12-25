import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/constants/themeColors';

export interface FilterOption {
  id: string;
  label: string;
}

interface FilterHeaderProps {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  // Sorting
  currentSort: string;
  sortDir: 'asc' | 'desc';
  sortOptions: Record<string, string>;
  onSortPress: (id: string) => void;
  // Primary Filter (e.g., Rarity or "Show Owned/Unowned")
  filterMode: string;
  filterOptions: FilterOption[];
  onFilterPress: (id: string) => void;
  filterLabel?: string;
  // Secondary Filter (e.g., Expansions) - Optional
  secondaryFilterMode?: string;
  secondaryFilterOptions?: FilterOption[];
  onSecondaryFilterPress?: (id: string) => void;
  secondaryLabel?: string;
  // Stats
  statsText?: string;
}

const FilterHeader: React.FC<FilterHeaderProps> = ({
  searchQuery, setSearchQuery,
  currentSort, sortDir, sortOptions, onSortPress,
  filterMode, filterOptions, onFilterPress, filterLabel = "Filter",
  secondaryFilterMode, secondaryFilterOptions, onSecondaryFilterPress, secondaryLabel = "Sets",
  statsText
}) => {
  const [activeTab, setActiveTab] = useState<'filter' | 'secondary' | 'sort' | null>(null);

  const toggleTab = (tab: 'filter' | 'secondary' | 'sort') => {
    setActiveTab(prev => prev === tab ? null : tab);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerControls}>
        <View style={styles.searchWrapper}>
          <FontAwesome6 name="magnifying-glass" size={14} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={styles.buttonGroup}>
          {/* Primary Filter */}
          <TouchableOpacity
            style={[styles.actionButton, activeTab === 'filter' && styles.buttonOpen]}
            onPress={() => toggleTab('filter')}
          >
            <MaterialCommunityIcons name="filter-variant" size={18} color={activeTab === 'filter' ? "#000" : colors.foreground} />
            <Text style={[styles.actionButtonText, activeTab === 'filter' && styles.textActive]}>
              {filterOptions.find(o => o.id === filterMode)?.label || filterLabel}
            </Text>
          </TouchableOpacity>

          {/* Secondary Filter (Expansions) */}
          {secondaryFilterOptions && (
            <TouchableOpacity
              style={[styles.actionButton, activeTab === 'secondary' && styles.buttonOpen]}
              onPress={() => toggleTab('secondary')}
            >
              <MaterialCommunityIcons name="layers-outline" size={18} color={activeTab === 'secondary' ? "#000" : colors.foreground} />
              <Text style={[styles.actionButtonText, activeTab === 'secondary' && styles.textActive]} numberOfLines={1}>
                {secondaryFilterOptions.find(o => o.id === secondaryFilterMode)?.label || secondaryLabel}
              </Text>
            </TouchableOpacity>
          )}

          {/* Sort Button */}
          <TouchableOpacity
            style={[styles.actionButton, activeTab === 'sort' && styles.buttonOpen]}
            onPress={() => toggleTab('sort')}
          >
            <MaterialCommunityIcons name="sort-variant" size={18} color={activeTab === 'sort' ? "#000" : colors.foreground} />
            <Text style={[styles.actionButtonText, activeTab === 'sort' && styles.textActive]}>
              {sortOptions[currentSort]} {activeTab !== 'sort' && (sortDir === 'asc' ? '↑' : '↓')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Menu */}
      {activeTab && (
        <View style={styles.dropdownMenu}>
          <Text style={styles.menuLabel}>
            {activeTab === 'filter' ? filterLabel : activeTab === 'secondary' ? secondaryLabel : 'Sort By'}
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
            {activeTab === 'filter' && filterOptions.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.menuOption, filterMode === opt.id && styles.menuOptionActive]}
                onPress={() => { onFilterPress(opt.id); setActiveTab(null); }}
              >
                <Text style={[styles.optionText, filterMode === opt.id && styles.textActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            {activeTab === 'secondary' && secondaryFilterOptions?.map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.menuOption, secondaryFilterMode === opt.id && styles.menuOptionActive]}
                onPress={() => { onSecondaryFilterPress?.(opt.id); setActiveTab(null); }}
              >
                <Text style={[styles.optionText, secondaryFilterMode === opt.id && styles.textActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            {activeTab === 'sort' && Object.entries(sortOptions).map(([id, label]) => (
              <TouchableOpacity
                key={id}
                style={[styles.menuOption, currentSort === id && styles.menuOptionActive]}
                onPress={() => { onSortPress(id); if(currentSort !== id) setActiveTab(null); }}
              >
                <Text style={[styles.optionText, currentSort === id && styles.textActive]}>
                  {label} {currentSort === id ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {statsText && (
        <View style={styles.statsBar}>
          <Text style={styles.statsMainText}>{statsText}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { zIndex: 10, backgroundColor: colors.background },
  headerControls: { padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center' },
  searchWrapper: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 44,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: colors.foreground, fontSize: 14, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  buttonGroup: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12, height: 44, borderRadius: 12, borderWidth: 1, borderColor: colors.border, gap: 6,
  },
  buttonOpen: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionButtonText: { color: colors.foreground, fontSize: 13, fontWeight: '600', maxWidth: 80 },
  textActive: { color: '#000' },
  dropdownMenu: {
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  menuLabel: { color: colors.mutedForeground, fontSize: 10, marginBottom: 12, fontWeight: '800', textTransform: 'uppercase' },
  optionRow: { flexDirection: 'row', gap: 8 },
  menuOption: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)',
  },
  menuOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.foreground, fontSize: 13, fontWeight: '600' },
  statsBar: { paddingHorizontal: 16, marginBottom: 8 },
  statsMainText: { color: colors.mutedForeground, fontSize: 13 },
});

export default FilterHeader;