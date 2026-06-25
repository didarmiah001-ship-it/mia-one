import { useEffect, useCallback } from 'react';

export function RippleEffect() {
  const handleClick = useCallback((e: MouseEvent) => {
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${e.clientX - 75}px`;
    ripple.style.top = `${e.clientY - 75}px`;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [handleClick]);

  return null;
}
