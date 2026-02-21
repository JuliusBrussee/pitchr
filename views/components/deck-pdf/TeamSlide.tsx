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
    cardRow: {
      flexDirection: 'row',
      marginTop: 20,
    },
    card: {
      flex: 1,
      backgroundColor: template.colors.backgroundSecondary,
      borderRadius: 8,
      padding: 16,
      marginRight: 16,
      alignItems: 'center',
    },
    cardLast: {
      flex: 1,
      backgroundColor: template.colors.backgroundSecondary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: template.colors.accent,
      marginBottom: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontFamily: template.fonts.headline,
      color: template.colors.background,
    },
    name: {
      fontSize: 14,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
      textAlign: 'center',
    },
    role: {
      fontSize: 11,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
  });

  return (
    <SlideBase template={template} pageNumber={pageNumber}>
      <Text style={baseStyles.headline}>{slide.headline}</Text>
      {slide.subheadline && (
        <Text style={baseStyles.subheadline}>{slide.subheadline}</Text>
      )}
      <View style={styles.cardRow}>
        {slide.bullets.map((member, i) => (
          <View
            key={i}
            style={i < slide.bullets.length - 1 ? styles.card : styles.cardLast}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {member.text.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.name}>{member.text}</Text>
            <Text style={styles.role}>{member.detail}</Text>
          </View>
        ))}
      </View>
    </SlideBase>
  );
}
