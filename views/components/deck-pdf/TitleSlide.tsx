import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';

interface TitleSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  companyName: string;
}

export function TitleSlide({ slide, template, companyName }: TitleSlideProps) {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    companyName: {
      fontSize: 14,
      fontFamily: template.fonts.body,
      color: template.colors.accent,
      marginBottom: 16,
      letterSpacing: 3,
    },
    headline: {
      fontSize: 44,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    subheadline: {
      fontSize: 18,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      textAlign: 'center',
      maxWidth: 500,
    },
  });

  return (
    <SlideBase template={template} pageNumber={1}>
      <View style={styles.container}>
        <Text style={styles.companyName}>{companyName.toUpperCase()}</Text>
        <Text style={styles.headline}>{slide.headline}</Text>
        {slide.subheadline && (
          <Text style={styles.subheadline}>{slide.subheadline}</Text>
        )}
      </View>
    </SlideBase>
  );
}
