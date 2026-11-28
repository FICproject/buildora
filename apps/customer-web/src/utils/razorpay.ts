let loadPromise: Promise<boolean> | null = null;

/**
 * Dynamically ensures the official Razorpay Checkout script (checkout.js) is loaded.
 * Returns true if window.Razorpay is ready, false otherwise.
 */
export function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (typeof (window as any).Razorpay === 'function') return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      const checkTimer = window.setInterval(() => {
        if (typeof (window as any).Razorpay === 'function') {
          window.clearInterval(checkTimer);
          resolve(true);
        }
      }, 100);
      window.setTimeout(() => {
        window.clearInterval(checkTimer);
        resolve(typeof (window as any).Razorpay === 'function');
      }, 8000);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(typeof (window as any).Razorpay === 'function');
    script.onerror = () => {
      loadPromise = null;
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
