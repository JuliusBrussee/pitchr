'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';

export interface UseDeckSlidesReturn {
  pdfDoc: PDFDocumentProxy | null;
  currentSlide: number;
  slideCount: number;
  isLoading: boolean;
  error: string | null;
  goToSlide: (n: number) => void;
  nextSlide: () => void;
  prevSlide: () => void;
  renderSlideToCanvas: (canvas: HTMLCanvasElement) => Promise<void>;
}

export function useDeckSlides(pdfUrl: string | null): UseDeckSlidesReturn {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [slideCount, setSlideCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef(0);

  // Load PDF document
  useEffect(() => {
    if (!pdfUrl) {
      setPdfDoc(null);
      setSlideCount(0);
      setCurrentSlide(1);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs',
          import.meta.url,
        ).toString();

        const doc = await pdfjsLib.getDocument(pdfUrl).promise;
        if (cancelled) return;

        setPdfDoc(doc);
        setSlideCount(doc.numPages);
        setCurrentSlide(1);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load PDF');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  const goToSlide = useCallback(
    (n: number) => {
      if (n >= 1 && n <= slideCount) setCurrentSlide(n);
    },
    [slideCount],
  );

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1);
  }, [currentSlide, goToSlide]);

  const renderSlideToCanvas = useCallback(
    async (canvas: HTMLCanvasElement) => {
      if (!pdfDoc) return;

      const taskId = ++renderTaskRef.current;
      const page = await pdfDoc.getPage(currentSlide);

      // Check if this render is still current
      if (taskId !== renderTaskRef.current) return;

      const containerWidth = canvas.parentElement?.clientWidth ?? canvas.width;
      const containerHeight = canvas.parentElement?.clientHeight ?? canvas.height;
      const viewport = page.getViewport({ scale: 1 });

      // Scale to fit container while maintaining aspect ratio
      const scale = Math.min(
        containerWidth / viewport.width,
        containerHeight / viewport.height,
      );
      const scaledViewport = page.getViewport({ scale });

      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      await page.render({ canvas, viewport: scaledViewport }).promise;
    },
    [pdfDoc, currentSlide],
  );

  return {
    pdfDoc,
    currentSlide,
    slideCount,
    isLoading,
    error,
    goToSlide,
    nextSlide,
    prevSlide,
    renderSlideToCanvas,
  };
}
