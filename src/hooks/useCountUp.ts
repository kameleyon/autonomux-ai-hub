import { useState, useEffect, useRef, useCallback } from "react";

export function useCountUp(end: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const hasBeenVisible = useRef(false);
  const prevEnd = useRef(end);

  const animate = useCallback((target: number) => {
    const startVal = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + eased * (target - startVal)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [duration]);

  // Re-animate when end value changes (data loaded)
  useEffect(() => {
    if (prevEnd.current !== end && hasBeenVisible.current) {
      prevEnd.current = end;
      animate(end);
    }
  }, [end, animate]);

  // Intersection observer for initial visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasBeenVisible.current) {
          hasBeenVisible.current = true;
          prevEnd.current = end;
          animate(end);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, animate]);

  return { value, ref };
}
