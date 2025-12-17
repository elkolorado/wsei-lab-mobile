import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  card: any;
  onPress?: (card: any) => void;
}

import { API_ENDPOINT } from '@/constatns/apiConfig';

const CardItem: React.FC<Props> = ({ card, onPress }) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  // prefer image_url from API; fallback to constructed card-image endpoint
  const imageUrl = `${API_ENDPOINT}/card-image/${card.tcg_id}/${card.cardMarketId}.jpg`;
  const name = card.name || card.title || 'Unknown';
  const price = (card.from_price ?? card.fromPrice ?? card.price ?? card.avg_price ?? card.avgPrice);
  const price_foil = (card.price_foil ?? card.priceFoil ?? card.price_foil ?? null);
  const availability = card.available ?? card.available_foil ?? card.availableFoil ?? card.stock ?? '-';
  const availability_foil = card.available_foil ?? card.availableFoil ?? null;
  const rarity = card.rarity ?? '-';

  useEffect(() => {
    let mounted = true;
  const uri = imageUrl; // imageUrl already points to a full URL in many cases
    // Try to get remote image dimensions so we can preserve aspect ratio
    Image.getSize(
      uri,
      (width, height) => {
        if (!mounted) return;
        if (width && height) setAspectRatio(width / height);
      },
      (err) => {
        // ignore errors; leave aspectRatio null to use fallback height
        // console.warn('Image.getSize failed for', uri, err);
      }
    );

    return () => {
      mounted = false;
    };
  }, [imageUrl]);
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress && onPress(card)}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={[styles.image, aspectRatio ? { aspectRatio } : styles.imageFallback]} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Text style={styles.placeholderText}>No Image</Text>
        </View>
      )}
      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.name}>{name}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>{typeof price === 'number' ? `${price.toFixed(2)}€` : (price ? String(price) : '-')}{price_foil ? ` / ${Number(price_foil).toFixed(2)}€` : ''}</Text>
          <Text style={styles.rarity}>{rarity}</Text>
        </View>
        <Text style={styles.availability}>Avail: {String(availability)}{availability_foil ? ` / ${String(availability_foil)}` : ''}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    // when aspectRatio is known we will use that; this provides base styling
    resizeMode: 'contain',
    backgroundColor: '#f6f6f6',
  },
  imageFallback: {
    width: '100%',
    height: 160,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
  },
  meta: {
    padding: 8,
  },
  name: {
    fontWeight: '600',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    color: '#2b8a3e',
    fontWeight: '700',
  },
  rarity: {
    fontSize: 12,
    color: '#555',
  },
  availability: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
});

export default CardItem;
