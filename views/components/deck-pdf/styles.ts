import { StyleSheet } from '@react-pdf/renderer';
import type { DeckTemplate } from '@/types/deckGeneration';

export function createSlideStyles(template: DeckTemplate) {
  return StyleSheet.create({
    page: {
      backgroundColor: template.colors.background,
      padding: template.layout.padding,
      position: 'relative',
    },
    accentBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: template.colors.accent,
    },
    pageNumber: {
      position: 'absolute',
      bottom: 16,
      right: 24,
      fontSize: 10,
      color: template.colors.textSecondary,
      fontFamily: template.fonts.body,
    },
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
    accentRule: {
      height: 3,
      width: 48,
      backgroundColor: template.colors.accent,
      marginBottom: 16,
      borderRadius: 2,
    },
    bulletContainer: {
      marginTop: 12,
    },
    bulletRow: {
      flexDirection: 'row',
      marginBottom: 16,
      alignItems: 'flex-start',
    },
    bulletDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: template.colors.accent,
      marginTop: 5,
      marginRight: 12,
    },
    bulletTextGroup: {
      flex: 1,
    },
    bulletText: {
      fontSize: template.layout.bulletSize,
      fontFamily: template.fonts.headline,
      color: template.colors.text,
    },
    bulletDetail: {
      fontSize: template.layout.bulletSize - 2,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      marginTop: 3,
    },
    calloutBox: {
      backgroundColor: template.colors.backgroundSecondary,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginBottom: 20,
      borderLeftWidth: 3,
      borderLeftColor: template.colors.accent,
    },
    calloutValue: {
      fontSize: 32,
      fontFamily: template.fonts.headline,
      color: template.colors.accent,
    },
    calloutLabel: {
      fontSize: 11,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      marginTop: 4,
    },
    bannerCallout: {
      backgroundColor: template.colors.backgroundSecondary,
      borderRadius: 8,
      padding: 20,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
      borderLeftWidth: 4,
      borderLeftColor: template.colors.accent,
    },
    bannerCalloutValue: {
      fontSize: 36,
      fontFamily: template.fonts.headline,
      color: template.colors.accent,
      marginRight: 16,
    },
    bannerCalloutLabel: {
      fontSize: 13,
      fontFamily: template.fonts.body,
      color: template.colors.textSecondary,
      flex: 1,
    },
  });
}
