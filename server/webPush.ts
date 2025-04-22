import webpush from 'web-push';

// VAPID keys should be generated using web-push generate-vapid-keys
// For development, we'll use hardcoded keys, but in production they should be environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BKn_GBJ8Zhl5H4T7dksYdcm0_b97IXfMjfK_KjXYRiAIONYGnNiwEJX3Szj5iD-6vH9kDFJpnr9uQ9sJ3xpcIyo';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'aNa-BX5oHhZZ1k_wU0f38hVTgVeCiaJw7y69DexFTuI';

// Email is required for VAPID
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'admin@sipofeden.com';

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  `mailto:${VAPID_EMAIL}`,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Export the configured web-push
export const webPush = webpush;

// Export the public key for clients to use when subscribing
export const getPublicVapidKey = () => VAPID_PUBLIC_KEY;