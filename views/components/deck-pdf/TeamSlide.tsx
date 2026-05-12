import { View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate, GeneratedSlide } from '@/types/deckGeneration';
import { SlideBase } from './SlideBase';
import { createSlideStyles } from './styles';

interface TeamSlideProps {
  slide: GeneratedSlide;
  template: DeckTemplate;
  pageNumber: number;
}

export function TeamSlide({ slide, template, pageNumber }: TeamSlideProps) {
  const baseStyles = createSlideStyles(template);
  const styles = StyleSheet.create({
    memberList: {
      marginTop: 20,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 12,
      backgroundColor: template.colors.backgroundSecondary,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: template.colors.accent,
    },
    name: {
      fontSize: 16,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
      width: '35%',
    },
    credential: {
      fontSize: 13,
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
      <View style={styles.memberList}>
        {slide.bullets.map((member, i) => (
          <View key={i} style={styles.memberRow}>
            <Text style={styles.name}>{member.text}</Text>
            <Text style={styles.credential}>{member.detail}</Text>
          </View>
        ))}
      </View>
    </SlideBase>
  );
}
