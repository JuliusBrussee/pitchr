import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';
import { createSlideStyles } from './styles';

interface AskSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  pageNumber: number;
}

export function AskSlide({ slide, template, pageNumber }: AskSlideProps) {
  const baseStyles = createSlideStyles(template);
  const styles = StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    askAmount: {
      fontSize: 64,
      fontFamily: template.fonts.headline,
      color: template.colors.accent,
      marginBottom: 8,
    },
    askLabel: {
      fontSize: 14,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      marginBottom: 36,
    },
    useFundsContainer: {
      width: '70%',
    },
    useFundsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: template.colors.backgroundSecondary,
    },
    useFundsLabel: {
      fontSize: 15,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
    },
    useFundsDetail: {
      fontSize: 13,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      maxWidth: '60%',
      textAlign: 'right',
    },
  });

  return (
    <SlideBase template={template} pageNumber={pageNumber}>
      <View style={styles.center}>
        <Text style={baseStyles.headline}>{slide.headline}</Text>
        {slide.callout && (
          <>
            <Text style={styles.askAmount}>{slide.callout.value}</Text>
            <Text style={styles.askLabel}>{slide.callout.label}</Text>
          </>
        )}
        <View style={styles.useFundsContainer}>
          {slide.bullets.map((item, i) => (
            <View key={i} style={styles.useFundsRow}>
              <Text style={styles.useFundsLabel}>{item.text}</Text>
              <Text style={styles.useFundsDetail}>{item.detail}</Text>
            </View>
          ))}
        </View>
      </View>
    </SlideBase>
  );
}
