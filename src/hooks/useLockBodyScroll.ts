import { useEffect } from "react";

/**
 * Freezes the background page scrollbar when a modal, popup, or drawer is open.
 * Automatically compensates for scrollbar width to prevent content layout shifts.
 */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Calculate scrollbar width on the current viewport
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    // Freeze background scroll
    document.body.style.overflow = "hidden";
    document.body.classList.add("no-scroll");

    // Compensate scrollbar width to avoid sudden layout shift
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
      document.body.classList.remove("no-scroll");
    };
  }, [locked]);
}
