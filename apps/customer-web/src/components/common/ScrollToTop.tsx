import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

interface ScrollToTopProps {
  /** Optional custom scroll target or container element ref */
  targetRef?: React.RefObject<HTMLElement>;
}

/**
 * Global Scroll-to-Top Navigation Handler for BUILDORA 60
 * 
 * Ensures every route transition reliably opens at the top of the destination page,
 * eliminates scroll retention across all routes, and prevents race conditions with async rendering
 * while preserving filter/query parameter interactions on the same page.
 */
export const ScrollToTop: React.FC<ScrollToTopProps> = ({ targetRef }) => {
  const location = useLocation();
  const navigationType = useNavigationType(); // 'POP' | 'PUSH' | 'REPLACE'
  const prevPathnameRef = useRef<string>(location.pathname);

  useEffect(() => {
    const isNewPath = location.pathname !== prevPathnameRef.current;
    prevPathnameRef.current = location.pathname;

    // 1. If only search/query parameters changed on the same pathname, do NOT reset scroll
    // (Preserves filter, sorting, and tab UX on the same page as per Phase 3-G)
    if (!isNewPath && !location.hash) {
      return;
    }

    // 2. If it's a browser Back/Forward (POP) navigation without a hash, let browser/ScrollRestoration restore position
    if (navigationType === 'POP' && !location.hash) {
      return;
    }

    // 3. If there is an anchor hash in the URL, scroll to the target element
    if (location.hash) {
      const hashTarget = location.hash.replace('#', '');
      const element = document.getElementById(hashTarget) || document.querySelector(location.hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }

    // 4. For new route navigation (PUSH or REPLACE): reset scroll immediately and reliably
    const performScrollReset = () => {
      // Primary window scroll
      window.scrollTo(0, 0);

      // Explicit document elements reset
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }

      // Optional target container reset
      if (targetRef?.current) {
        targetRef.current.scrollTop = 0;
      }
    };

    // Immediate execution
    performScrollReset();

    // Use requestAnimationFrame to enforce scroll-to-top after DOM render and layout paint
    // (Prevents race conditions caused by async hydration, skeleton transitions, or dynamic image loading)
    const rafId1 = requestAnimationFrame(() => {
      performScrollReset();
      const rafId2 = requestAnimationFrame(() => {
        performScrollReset();
      });
      return () => cancelAnimationFrame(rafId2);
    });

    return () => {
      cancelAnimationFrame(rafId1);
    };
  }, [location.pathname, location.hash, navigationType, targetRef]);

  return null;
};
