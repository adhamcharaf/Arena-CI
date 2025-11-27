import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_WIDTH = SCREEN_WIDTH - spacing.xl * 2;
const CAROUSEL_HEIGHT = 180;

interface CarouselImage {
  id: string;
  source: ImageSourcePropType;
  alt?: string;
}

interface ImageCarouselProps {
  images?: CarouselImage[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  // Si pas d'images, afficher un placeholder
  if (!images || images.length === 0) {
    return (
      <View style={styles.placeholder}>
        <View style={styles.placeholderContent}>
          <Ionicons name="images-outline" size={48} color={colors.text.tertiary} />
          <Text style={styles.placeholderText}>Photos bientôt disponibles</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {images.map((image) => (
          <View key={image.id} style={styles.imageContainer}>
            <Image
              source={image.source}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      {/* Indicateurs de pagination */}
      {images.length > 1 && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === 0 && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_HEIGHT,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // Contenu du carousel
  },
  imageContainer: {
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  pagination: {
    position: 'absolute',
    bottom: spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: colors.neutral[0],
    width: 24,
  },
  // Placeholder styles
  placeholder: {
    width: CAROUSEL_WIDTH,
    height: CAROUSEL_HEIGHT,
    borderRadius: borderRadius.card,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
  },
  placeholderContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  placeholderText: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
});
