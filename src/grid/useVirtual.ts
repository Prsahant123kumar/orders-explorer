import { useCallback, useEffect, useRef, useState } from 'react';

export function useVirtual(total: number, rowHeight: number, overscan = 8) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(600);

  const onScroll = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      if (ref.current) setScrollTop(ref.current.scrollTop);
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setViewport(el.clientHeight);
    const observer = new ResizeObserver(() => setViewport(el.clientHeight));
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(total, Math.ceil((scrollTop + viewport) / rowHeight) + overscan);

  return { ref, onScroll, start, end, totalHeight: total * rowHeight };
}