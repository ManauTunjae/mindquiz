import { useEffect, useState } from 'react';

// Types a text letter by letter. With `instant` the whole text is shown at once.
export function useTyped(
  text: string,
  {
    delay = 300,
    speed = 50,
    instant = false,
  }: { delay?: number; speed?: number; instant?: boolean } = {},
) {
  const [count, setCount] = useState(instant ? text.length : 0);

  useEffect(() => {
    if (instant) return;
    let typed = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        typed += 1;
        setCount(typed);
        if (typed >= text.length) window.clearInterval(interval);
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [text, delay, speed, instant]);

  return { text: text.slice(0, count), done: count >= text.length };
}

// Counts from 0 up to a number.
export function useCountUp(target: number, { delay = 300, duration = 900, instant = false } = {}) {
  const [value, setValue] = useState(instant ? target : 0);

  useEffect(() => {
    if (instant) return;
    let interval: number | undefined;
    const steps = Math.max(1, Math.round(duration / 40));
    const start = window.setTimeout(() => {
      let step = 0;
      interval = window.setInterval(() => {
        step += 1;
        setValue(Math.round((target * step) / steps));
        if (step >= steps) window.clearInterval(interval);
      }, 40);
    }, delay);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(interval);
    };
  }, [target, delay, duration, instant]);

  return value;
}
