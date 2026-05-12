import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';

interface ComparisonSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  pageNumber: number;
}

export function ComparisonSlide({ slide, template, pageNumber }: ComparisonSlideProps) {
  const baseStyles = StyleSheet.create({
    headline: {
      fontSize: template.layout.headlineSize,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
      marginBottom: 8,
    },
    subheadline: {
      fontSize: template.layout.bodySize,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      marginBottom: 24,
    },
  });
  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: template.colors.backgroundSecondary,
      paddingVertical: 12,
      alignItems: 'center',
    },
    labelCol: {
      width: '35%',
      fontSize: template.layout.bulletSize,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
    },
    detailCol: {
      width: '65%',
      fontSize: template.layout.bulletSize - 1,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
    },
    moatRow: {
      flexDirection: 'row',
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: template.colors.backgroundSecondary,
      borderRadius: 6,
      paddingHorizontal: 12,
      marginTop: 8,
    },
    moatLabel: {
      width: '35%',
      fontSize: template.layout.bulletSize,
      fontFamily: template.fonts.headline,
      color: template.colors.accent,
    },
    moatDetail: {
      width: '65%',
      fontSize: template.layout.bulletSize - 1,
      fontFamily: template.fonts.body,
      color: template.colors.text,
    },
  });

  // Last bullet is typically "our moat" — style it differently
  const competitors = slide.bullets.slice(0, -1);
  const moat = slide.bullets[slide.bullets.length - 1];

  return (
    <SlideBase template={template} pageNumber={pageNumber}>
      <Text style={baseStyles.headline}>{slide.headline}</Text>
      {slide.subheadline && (
        <Text style={baseStyles.subheadline}>{slide.subheadline}</Text>
      )}
      <View style={{ marginTop: 16 }}>
        {competitors.map((bullet, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.labelCol}>{bullet.text}</Text>
            <Text style={styles.detailCol}>{bullet.detail}</Text>
          </View>
        ))}
        {moat && (
          <View style={styles.moatRow}>
            <Text style={styles.moatLabel}>{moat.text}</Text>
            <Text style={styles.moatDetail}>{moat.detail}</Text>
          </View>
        )}
      </View>
    </SlideBase>
  );
}
