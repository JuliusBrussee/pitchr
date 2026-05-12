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
      flexDirection: 'row',
      alignItems: 'center',
    },
    accentBar: {
      width: 5,
      height: '60%',
      backgroundColor: template.colors.accent,
      borderRadius: 3,
      marginRight: 32,
    },
    content: {
      flex: 1,
      maxWidth: '65%',
    },
    companyName: {
      fontSize: 12,
      fontFamily: template.fonts.body,
      color: template.colors.accent,
      letterSpacing: 2.5,
      marginBottom: 14,
    },
    headline: {
      fontSize: 52,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
      lineHeight: 1.1,
      marginBottom: 14,
    },
    subheadline: {
      fontSize: 17,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      lineHeight: 1.5,
    },
  });

  return (
    <SlideBase template={template} pageNumber={1}>
      <View style={styles.container}>
        <View style={styles.accentBar} />
        <View style={styles.content}>
          <Text style={styles.companyName}>{companyName.toUpperCase()}</Text>
          <Text style={styles.headline}>{slide.headline}</Text>
          {slide.subheadline && (
            <Text style={styles.subheadline}>{slide.subheadline}</Text>
          )}
        </View>
      </View>
    </SlideBase>
  );
}
