'use client';

import { useCallback, useRef, useState } from 'react';

export type SharePlatform = 'linkedin' | 'x' | 'instagram' | 'download';

export interface ShareCardData {
  score: number;
  bandLabel: string;
  verdict: string;
  rubricScores: { category: string; score: number; maxScore: number }[];
  sessionDelta?: { points: number; sessions: number } | null;
  mode: string;
}

interface ShareCardState {
  isGenerating: boolean;
  isSharing: boolean;
  error: string | null;
  lastSharedPlatform: SharePlatform | null;
}

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1080;

const COLORS = {
  bgDark: '#0a0a0a',
  bgCard: '#141414',
  bgCardInner: '#1a1a1a',
  coral: '#ff5941',
  orange: '#ffaa33',
  darkCoral: '#e63b26',
  textPrimary: '#ededec',
  textSecondary: '#9a9a98',
  textMuted: '#5c5c5a',
  border: 'rgba(255,255,255,0.08)',
};

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#ffaa33';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawScoreRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  score: number,
  color: string,
) {
  const lineWidth = 10;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (2 * Math.PI * score) / 100;

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  // Progress
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Glow
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines) break;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  // Truncate last line if needed
  if (lines.length === maxLines) {
    const lastLine = lines[maxLines - 1];
    const remaining = words.slice(
      lines.slice(0, -1).join(' ').split(' ').length + lastLine.split(' ').length,
    );
    if (remaining.length > 0) {
      lines[maxLines - 1] = lastLine + '...';
    }
  }

  return lines;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function drawGlowOrb(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  alpha: number,
) {
  const rgb = hexToRgb(color);
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`);
  grad.addColorStop(0.5, `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha * 0.3})`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
}

function drawNoiseOverlay(ctx: CanvasRenderingContext2D, w: number, h: number, opacity: number) {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 2 * opacity * 255;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

async function renderCardToCanvas(data: ShareCardData): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const scoreColor = getScoreColor(data.score);
  const scoreRgb = hexToRgb(scoreColor);

  // ── Layer 1: Deep dark background ──
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // ── Layer 2: Ambient glow orbs ──
  drawGlowOrb(ctx, CARD_WIDTH * 0.2, CARD_HEIGHT * 0.15, 400, COLORS.coral, 0.06);
  drawGlowOrb(ctx, CARD_WIDTH * 0.8, CARD_HEIGHT * 0.3, 350, scoreColor, 0.05);
  drawGlowOrb(ctx, CARD_WIDTH * 0.5, CARD_HEIGHT * 0.85, 300, COLORS.orange, 0.04);

  // ── Layer 3: Main card with glass effect ──
  const padding = 40;
  const cardX = padding;
  const cardY = padding;
  const cardW = CARD_WIDTH - padding * 2;
  const cardH = CARD_HEIGHT - padding * 2;

  // Card shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 10;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28);
  ctx.fillStyle = 'rgba(12,12,15,0.85)';
  ctx.fill();
  ctx.restore();

  // Card border gradient
  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 28);
  const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  borderGrad.addColorStop(0, `rgba(${scoreRgb.r},${scoreRgb.g},${scoreRgb.b},0.25)`);
  borderGrad.addColorStop(0.5, 'rgba(255,255,255,0.06)');
  borderGrad.addColorStop(1, `rgba(255,89,65,0.15)`);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Inner glow on card
  drawGlowOrb(ctx, CARD_WIDTH / 2, cardY + 340, 280, scoreColor, 0.08);

  const innerPad = 52;
  const contentX = cardX + innerPad;
  const contentW = cardW - innerPad * 2;
  const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // ── Header: Brand + Mode ──
  // Brand name
  ctx.font = `bold 32px ${FONT}`;
  ctx.fillStyle = COLORS.coral;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('pitchr', contentX, cardY + 68);

  // Dot separator
  const brandWidth = ctx.measureText('pitchr').width;
  ctx.fillStyle = COLORS.textMuted;
  ctx.font = `18px ${FONT}`;
  ctx.fillText('\u00B7', contentX + brandWidth + 10, cardY + 68);
  ctx.font = `500 16px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText('AI Pitch Coach', contentX + brandWidth + 24, cardY + 68);

  // Mode badge (right-aligned)
  const modeLabel = data.mode === 'elevator' ? 'Elevator Pitch' : 'VC Pitch';
  ctx.font = `600 13px ${FONT}`;
  const modeMetrics = ctx.measureText(modeLabel);
  const modePadX = 16;
  const modePadY = 8;
  const modeW = modeMetrics.width + modePadX * 2;
  const modeH = 28;
  const modeX = contentX + contentW - modeW;
  const modeY = cardY + 50;

  drawRoundedRect(ctx, modeX, modeY, modeW, modeH, modeH / 2);
  ctx.fillStyle = `rgba(255,89,65,0.12)`;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,89,65,0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = COLORS.coral;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(modeLabel, modeX + modeW / 2, modeY + modeH / 2);

  // ── Subtle header divider ──
  const divY = cardY + 96;
  const divGrad = ctx.createLinearGradient(contentX, divY, contentX + contentW, divY);
  divGrad.addColorStop(0, 'rgba(255,255,255,0)');
  divGrad.addColorStop(0.3, 'rgba(255,255,255,0.06)');
  divGrad.addColorStop(0.7, 'rgba(255,255,255,0.06)');
  divGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.moveTo(contentX, divY);
  ctx.lineTo(contentX + contentW, divY);
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Score Ring (hero element) ──
  const ringCx = CARD_WIDTH / 2;
  const ringCy = divY + 180;
  const ringRadius = 110;

  // Outer glow behind ring
  drawGlowOrb(ctx, ringCx, ringCy, ringRadius + 60, scoreColor, 0.12);

  // Draw score ring with thick stroke and glow
  const ringLineWidth = 12;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (2 * Math.PI * data.score) / 100;

  // Track (background)
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = ringLineWidth;
  ctx.stroke();

  // Gradient arc
  ctx.save();
  ctx.shadowColor = scoreColor;
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringRadius, startAngle, endAngle);
  ctx.strokeStyle = scoreColor;
  ctx.lineWidth = ringLineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Inner bright arc (highlights the progress)
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringRadius, startAngle, endAngle);
  ctx.strokeStyle = `rgba(${scoreRgb.r},${scoreRgb.g},${scoreRgb.b},0.4)`;
  ctx.lineWidth = ringLineWidth + 8;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Re-draw crisp arc on top
  ctx.beginPath();
  ctx.arc(ringCx, ringCy, ringRadius, startAngle, endAngle);
  ctx.strokeStyle = scoreColor;
  ctx.lineWidth = ringLineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Score number
  ctx.font = `bold 80px ${FONT}`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Text shadow
  ctx.save();
  ctx.shadowColor = scoreColor;
  ctx.shadowBlur = 20;
  ctx.fillText(String(data.score), ringCx, ringCy - 8);
  ctx.restore();
  ctx.fillText(String(data.score), ringCx, ringCy - 8);

  ctx.font = `500 18px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('/ 100', ringCx, ringCy + 42);

  // ── Band badge ──
  ctx.font = `700 15px ${FONT}`;
  const bandMetrics = ctx.measureText(data.bandLabel);
  const bandPadX = 20;
  const bandW = bandMetrics.width + bandPadX * 2;
  const bandH = 34;
  const bandX = ringCx - bandW / 2;
  const bandY = ringCy + ringRadius + 28;

  drawRoundedRect(ctx, bandX, bandY, bandW, bandH, bandH / 2);
  ctx.fillStyle = `rgba(${scoreRgb.r},${scoreRgb.g},${scoreRgb.b},0.15)`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${scoreRgb.r},${scoreRgb.g},${scoreRgb.b},0.3)`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = scoreColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(data.bandLabel, ringCx, bandY + bandH / 2);

  // ── Delta badge ──
  let nextY = bandY + bandH + 20;
  if (data.sessionDelta && data.sessionDelta.points !== 0) {
    const sign = data.sessionDelta.points > 0 ? '+' : '';
    const arrow = data.sessionDelta.points > 0 ? '\u2191' : '\u2193';
    const deltaColor = data.sessionDelta.points > 0 ? '#22c55e' : '#ef4444';
    const deltaRgb = hexToRgb(deltaColor);
    const deltaText = `${arrow} ${sign}${data.sessionDelta.points} points in ${data.sessionDelta.sessions} session${data.sessionDelta.sessions !== 1 ? 's' : ''}`;

    ctx.font = `bold 18px ${FONT}`;
    const deltaMetrics = ctx.measureText(deltaText);
    const deltaPadX = 20;
    const deltaW = deltaMetrics.width + deltaPadX * 2;
    const deltaH = 38;
    const deltaX = ringCx - deltaW / 2;
    const deltaY = nextY;

    drawRoundedRect(ctx, deltaX, deltaY, deltaW, deltaH, deltaH / 2);
    ctx.fillStyle = `rgba(${deltaRgb.r},${deltaRgb.g},${deltaRgb.b},0.1)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${deltaRgb.r},${deltaRgb.g},${deltaRgb.b},0.25)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = deltaColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(deltaText, ringCx, deltaY + deltaH / 2);
    nextY = deltaY + deltaH + 16;
  }

  // ── Verdict ──
  ctx.font = `400 17px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const verdictLines = wrapText(ctx, `"${data.verdict}"`, contentW - 60, 2);
  for (const line of verdictLines) {
    ctx.fillText(line, CARD_WIDTH / 2, nextY);
    nextY += 24;
  }

  // ── Rubric section ──
  nextY += 20;

  // Section label
  ctx.font = `600 11px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '2px';
  ctx.fillText('S C O R E   B R E A K D O W N', contentX, nextY);
  ctx.letterSpacing = '0px';
  nextY += 28;

  const barHeight = 6;
  const barGap = 40;
  const barWidth = contentW;
  const categoryLabels: Record<string, string> = {
    structure: 'Structure',
    clarity: 'Clarity',
    evidence: 'Evidence',
    market: 'Market',
    delivery: 'Delivery',
  };

  const rubrics = data.rubricScores.filter((r) => !r.category.startsWith('deck_'));
  rubrics.forEach((rubric, i) => {
    const y = nextY + i * barGap;
    const pct = rubric.maxScore > 0 ? rubric.score / rubric.maxScore : 0;
    const catColor = getScoreColor(pct * 100);
    const catRgb = hexToRgb(catColor);
    const label = categoryLabels[rubric.category] || rubric.category.replace(/_/g, ' ');

    // Label
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, contentX, y);

    // Score
    ctx.font = `700 14px ${FONT}`;
    ctx.fillStyle = catColor;
    ctx.textAlign = 'right';
    ctx.fillText(`${rubric.score}`, contentX + barWidth - 28, y);
    ctx.font = `400 14px ${FONT}`;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText(`/${rubric.maxScore}`, contentX + barWidth, y);
    ctx.textAlign = 'left';

    // Bar track
    const barY = y + 22;
    drawRoundedRect(ctx, contentX, barY, barWidth, barHeight, barHeight / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();

    // Bar fill with gradient
    const fillWidth = Math.max(barWidth * pct, barHeight);
    drawRoundedRect(ctx, contentX, barY, fillWidth, barHeight, barHeight / 2);
    const barGrad = ctx.createLinearGradient(contentX, barY, contentX + fillWidth, barY);
    barGrad.addColorStop(0, `rgba(${catRgb.r},${catRgb.g},${catRgb.b},0.6)`);
    barGrad.addColorStop(1, catColor);
    ctx.fillStyle = barGrad;
    ctx.fill();

    // Subtle glow on bar
    ctx.save();
    ctx.shadowColor = catColor;
    ctx.shadowBlur = 8;
    drawRoundedRect(ctx, contentX, barY, fillWidth, barHeight, barHeight / 2);
    ctx.fillStyle = `rgba(${catRgb.r},${catRgb.g},${catRgb.b},0.3)`;
    ctx.fill();
    ctx.restore();
  });

  // ── Footer ──
  const footerY = CARD_HEIGHT - padding - 60;

  // Footer divider
  const footGrad = ctx.createLinearGradient(contentX, footerY, contentX + contentW, footerY);
  footGrad.addColorStop(0, 'rgba(255,255,255,0)');
  footGrad.addColorStop(0.2, 'rgba(255,255,255,0.06)');
  footGrad.addColorStop(0.8, 'rgba(255,255,255,0.06)');
  footGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.moveTo(contentX, footerY);
  ctx.lineTo(contentX + contentW, footerY);
  ctx.strokeStyle = footGrad;
  ctx.lineWidth = 1;
  ctx.stroke();

  // CTA text
  ctx.font = `500 15px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('Score your pitch at', CARD_WIDTH / 2 - 50, footerY + 32);
  ctx.fillStyle = COLORS.coral;
  ctx.font = `700 15px ${FONT}`;
  ctx.fillText('pitchr.live', CARD_WIDTH / 2 + 58, footerY + 32);

  // ── Noise overlay for texture ──
  drawNoiseOverlay(ctx, CARD_WIDTH, CARD_HEIGHT, 0.012);

  ctx.textBaseline = 'alphabetic';
  return canvas;
}

function getShareUrl(): string {
  return 'https://pitchr.live';
}

function getShareText(data: ShareCardData): string {
  const parts = [`I scored ${data.score}/100 on Pitchr`];
  if (data.sessionDelta && data.sessionDelta.points > 0) {
    parts[0] += ` (+${data.sessionDelta.points} pts in ${data.sessionDelta.sessions} sessions)`;
  }
  parts.push('AI pitch coach that scores your pitch like an investor.');
  parts.push(getShareUrl());
  return parts.join('\n\n');
}

export function useShareCard() {
  const [state, setState] = useState<ShareCardState>({
    isGenerating: false,
    isSharing: false,
    error: null,
    lastSharedPlatform: null,
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const generateImage = useCallback(async (data: ShareCardData): Promise<Blob> => {
    setState((s) => ({ ...s, isGenerating: true, error: null }));
    try {
      const canvas = await renderCardToCanvas(data);
      canvasRef.current = canvas;
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              setState((s) => ({ ...s, isGenerating: false }));
              resolve(blob);
            } else {
              reject(new Error('Failed to generate image'));
            }
          },
          'image/png',
          1.0,
        );
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Image generation failed';
      setState((s) => ({ ...s, isGenerating: false, error: msg }));
      throw err;
    }
  }, []);

  const downloadImage = useCallback(async (data: ShareCardData) => {
    const blob = await generateImage(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pitchr-score-${data.score}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setState((s) => ({ ...s, lastSharedPlatform: 'download' }));
  }, [generateImage]);

  const shareToLinkedIn = useCallback(async (data: ShareCardData) => {
    await generateImage(data);
    const text = encodeURIComponent(getShareText(data));
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getShareUrl())}&summary=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
    setState((s) => ({ ...s, lastSharedPlatform: 'linkedin' }));
  }, [generateImage]);

  const shareToX = useCallback(async (data: ShareCardData) => {
    await generateImage(data);
    const text = encodeURIComponent(getShareText(data));
    const url = `https://x.com/intent/tweet?text=${text}`;
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=600');
    setState((s) => ({ ...s, lastSharedPlatform: 'x' }));
  }, [generateImage]);

  const shareNative = useCallback(async (data: ShareCardData) => {
    try {
      const blob = await generateImage(data);
      const file = new File([blob], `pitchr-score-${data.score}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `I scored ${data.score}/100 on Pitchr`,
          text: getShareText(data),
          files: [file],
        });
        setState((s) => ({ ...s, lastSharedPlatform: 'instagram' }));
      } else {
        // Fallback: download the image
        await downloadImage(data);
      }
    } catch (err) {
      // User cancelled share — not an error
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Share failed';
      setState((s) => ({ ...s, error: msg }));
    }
  }, [generateImage, downloadImage]);

  const share = useCallback(async (platform: SharePlatform, data: ShareCardData) => {
    setState((s) => ({ ...s, isSharing: true, error: null }));
    try {
      switch (platform) {
        case 'linkedin':
          await shareToLinkedIn(data);
          break;
        case 'x':
          await shareToX(data);
          break;
        case 'instagram':
          await shareNative(data);
          break;
        case 'download':
          await downloadImage(data);
          break;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Share failed';
      setState((s) => ({ ...s, error: msg }));
    } finally {
      setState((s) => ({ ...s, isSharing: false }));
    }
  }, [shareToLinkedIn, shareToX, shareNative, downloadImage]);

  return {
    ...state,
    share,
    generateImage,
    canvasRef,
  };
}
