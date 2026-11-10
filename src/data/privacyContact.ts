const controller = import.meta.env.VITE_PRIVACY_CONTROLLER?.trim();
const address = import.meta.env.VITE_PRIVACY_ADDRESS?.trim();
const email = import.meta.env.VITE_PRIVACY_EMAIL?.trim();

export const privacyContact =
  controller && address && email && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)
    ? { controller, address, email }
    : null;
