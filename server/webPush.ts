import webpush from 'web-push';

// VAPID keys generated using web-push generate-vapid-keys
// These are newly generated valid VAPID keys
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BGWlRKIsq_rmdo4yclmW-LWsuUH2WMSWJWXAp78oNYKakN8nV2q21pPQWeO1jqaK6G0KIe5xFAqRLS6Y3vraSYI';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '6BnsUON5SQa7Ba8kTAgCgrHngrc1ThKmcB5p5znfwrM';

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