import { useEffect, useState } from "react";

export function useCountUp(target, duration = 500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (duration <= 0) { setValue(target); return; }
    let current = 0;
    const steps = Math.max(1, Math.round(duration / 16));
    const increment = target / steps;
    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      current = frame >= steps ? target : Math.round(increment * frame);
      setValue(current);
      if (frame >= steps) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [target, duration]);

  return value;
}
