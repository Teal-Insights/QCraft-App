/**
 * Track a container's size so a chart can fill it exactly.
 *
 * Both dimensions, not just width. The Explorer's chart measures width and
 * takes its height from a prop, which is right for a scrolling document. It is
 * wrong here: a widget is a fixed-height grid, the chart's row is whatever the
 * viewport has left over, and an SVG drawn at a prop height either leaves a gap
 * under itself or spills over the controls beneath it and swallows their
 * clicks. That second failure is not hypothetical; it is what happened, and it
 * is invisible to a typecheck and to a screenshot.
 *
 * A ResizeObserver rather than a scaling viewBox, so text stays at a real pixel
 * size instead of shrinking on a projector. Zero sizes (a hidden element) are
 * ignored, and sub-pixel changes are dropped so an SVG sized from the box it
 * lives in cannot feed back into that box's own measurement.
 */

import { useEffect, useRef, useState } from 'react';

interface Size {
  width: number;
  height: number;
}

export function useChartSize(initial: Size = { width: 760, height: 300 }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<Size>(initial);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box || box.width <= 0 || box.height <= 0) return;
      setSize((prev) =>
        Math.abs(prev.width - box.width) < 1 && Math.abs(prev.height - box.height) < 1
          ? prev
          : { width: box.width, height: box.height },
      );
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { ref, width: size.width, height: size.height };
}
