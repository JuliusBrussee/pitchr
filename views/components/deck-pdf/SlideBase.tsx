import { Page, View, Text } from '@react-pdf/renderer';
import React from 'react';
import type { DeckTemplate } from '@/types/deckGeneration';
import { createSlideStyles } from './styles';

interface SlideBaseProps {
  template: DeckTemplate;
  pageNumber: number;
  children: React.ReactNode;
}

export function SlideBase({ template, pageNumber, children }: SlideBaseProps) {
  const styles = createSlideStyles(template);

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      {children}
      <View style={styles.accentBar} />
      <Text style={styles.pageNumber}>{pageNumber}</Text>
    </Page>
  );
}
