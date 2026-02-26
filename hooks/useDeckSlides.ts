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
  renderSlideToCanvas: ((canvas: HTMLCanvasElement) => Promise<void>) | null;
}

export function useDeckSlides(pdfUrl: string | null): UseDeckSlidesReturn {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [slideCount, setSlideCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderTaskRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeRenderRef = useRef<any>(null);

  // Load PDF document
  useEffect(() => {
    if (!pdfUrl || pdfUrl.trim() === '') {
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
        // Load from CDN to avoid bundler conflict with pdfjs-dist's internal webpack runtime
        const PDFJS_VERSION = '5.4.624';
        const CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}`;
        const pdfjsLib = await import(
          /* webpackIgnore: true */
          `${CDN}/build/pdf.min.mjs`
        );

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `${CDN}/build/pdf.worker.min.mjs`;

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

      // Cancel any in-flight render on this canvas
      if (activeRenderRef.current) {
        activeRenderRef.current.cancel();
        activeRenderRef.current = null;
      }

      const taskId = ++renderTaskRef.current;

      try {
        const page = await pdfDoc.getPage(currentSlide);

        // Check if this render is still current
        if (taskId !== renderTaskRef.current) return;

        const viewport = page.getViewport({ scale: 1 });

        // Get container dimensions, falling back to reasonable defaults
        const containerWidth = canvas.parentElement?.clientWidth || 800;
        const containerHeight = canvas.parentElement?.clientHeight || 600;

        // Scale to fit container while maintaining aspect ratio
        const scale = Math.min(
          containerWidth / viewport.width,
          containerHeight / viewport.height,
        );
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const renderTask = page.render({
          canvasContext: ctx,
          canvas,
          viewport: scaledViewport,
        });
        activeRenderRef.current = renderTask;

        await renderTask.promise;
        activeRenderRef.current = null;
      } catch (e) {
        // Ignore cancellation errors
        if (e instanceof Error && e.message.includes('cancel')) return;
        // Only log if this is still the current render task
        if (taskId === renderTaskRef.current) {
          console.error('Failed to render slide:', e);
        }
      }
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
    renderSlideToCanvas: pdfDoc ? renderSlideToCanvas : null,
  };
}
