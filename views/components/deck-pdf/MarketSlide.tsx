import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';
import { createSlideStyles } from './styles';

interface MarketSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  pageNumber: number;
}

export function MarketSlide({ slide, template, pageNumber }: MarketSlideProps) {
  const baseStyles = createSlideStyles(template);
  const styles = StyleSheet.create({
    topSection: {
      marginBottom: 20,
    },
    calloutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: template.colors.backgroundSecondary,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      borderLeftWidth: 4,
      borderLeftColor: template.colors.accent,
    },
    calloutValue: {
      fontSize: 48,
      fontFamily: template.fonts.headline,
      color: template.colors.accent,
      marginRight: 16,
    },
    calloutLabel: {
      fontSize: 13,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      flex: 1,
    },
    compactRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: template.colors.backgroundSecondary,
      paddingVertical: 10,
      alignItems: 'flex-start',
    },
    compactDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: template.colors.accent,
      marginTop: 5,
      marginRight: 10,
    },
    compactText: {
      fontSize: template.layout.bulletSize,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
      width: '30%',
    },
    compactDetail: {
      fontSize: template.layout.bulletSize - 1,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      flex: 1,
    },
  });

  return (
    <SlideBase template={template} pageNumber={pageNumber}>
      <Text style={baseStyles.headline}>{slide.headline}</Text>
      <View style={baseStyles.accentRule} />
      {slide.subheadline && (
        <Text style={baseStyles.subheadline}>{slide.subheadline}</Text>
      )}

      {/* Prominent callout for key market number */}
      {slide.callout && (
        <View style={styles.calloutRow}>
          <Text style={styles.calloutValue}>{slide.callout.value}</Text>
          <Text style={styles.calloutLabel}>{slide.callout.label}</Text>
        </View>
      )}

      {/* Compact rows for market sizing + competitor breakdown */}
      <View>
        {slide.bullets.map((bullet, i) => (
          <View key={i} style={styles.compactRow}>
            <View style={styles.compactDot} />
            <Text style={styles.compactText}>{bullet.text}</Text>
            <Text style={styles.compactDetail}>{bullet.detail}</Text>
          </View>
        ))}
      </View>
    </SlideBase>
  );
}
