import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';
import { createSlideStyles } from './styles';

interface MetricsSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  pageNumber: number;
}

export function MetricsSlide({ slide, template, pageNumber }: MetricsSlideProps) {
  const baseStyles = createSlideStyles(template);
  const styles = StyleSheet.create({
    twoColumn: {
      flexDirection: 'row',
      flex: 1,
      marginTop: 16,
    },
    left: {
      width: '40%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    right: {
      width: '60%',
      paddingLeft: 24,
    },
    bigCalloutValue: {
      fontSize: 48,
      fontFamily: template.fonts.headline,
      color: template.colors.accent,
    },
    bigCalloutLabel: {
      fontSize: 14,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      marginTop: 6,
    },
  });

  return (
    <SlideBase template={template} pageNumber={pageNumber}>
      <Text style={baseStyles.headline}>{slide.headline}</Text>
      {slide.subheadline && (
        <Text style={baseStyles.subheadline}>{slide.subheadline}</Text>
      )}
      <View style={styles.twoColumn}>
        {slide.callout && (
          <View style={styles.left}>
            <Text style={styles.bigCalloutValue}>{slide.callout.value}</Text>
            <Text style={styles.bigCalloutLabel}>{slide.callout.label}</Text>
          </View>
        )}
        <View style={slide.callout ? styles.right : { width: '100%' }}>
          <View style={baseStyles.bulletContainer}>
            {slide.bullets.map((bullet, i) => (
              <View key={i} style={baseStyles.bulletRow}>
                <View style={baseStyles.bulletDot} />
                <View style={baseStyles.bulletTextGroup}>
                  <Text style={baseStyles.bulletText}>{bullet.text}</Text>
                  {bullet.detail && (
                    <Text style={baseStyles.bulletDetail}>{bullet.detail}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </SlideBase>
  );
}
