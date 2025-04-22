import { webPush } from './webPush';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { adminNotificationSubscriptions, Order } from '@shared/schema';

/**
 * Send a notification to all subscribed admins
 * @param title Notification title
 * @param body Notification body content
 * @param url URL to open when notification is clicked
 * @param icon Icon to display in the notification
 * @param data Additional data to include with the notification
 */
export async function sendAdminNotification(
  title: string,
  body: string,
  url: string = '/admin/orders',
  icon: string = '/icons/icon-192x192.png',
  data: Record<string, any> = {}
) {
  try {
    // Get all active notification subscriptions
    const subscriptions = await db.select().from(adminNotificationSubscriptions)
      .where(eq(adminNotificationSubscriptions.active, true));
    
    if (!subscriptions.length) {
      console.log('No active subscription found for sending push notification');
      return;
    }
    
    console.log(`Sending push notification to ${subscriptions.length} subscriptions`);
    
    // Prepare the notification payload
    const payload = JSON.stringify({
      title,
      body,
      icon,
      badge: '/icons/icon-72x72.png',
      url,
      timestamp: new Date().getTime(),
      ...data
    });
    
    // Send to all subscriptions in parallel
    const notificationPromises = subscriptions.map(async (subscription) => {
      try {
        await webPush.sendNotification(
          JSON.parse(subscription.subscription),
          payload
        );
        return { success: true, subscription };
      } catch (error) {
        console.error(`Error sending notification to subscription ${subscription.id}:`, error);
        
        // Check if the subscription is no longer valid (gone)
        if (typeof error === 'object' && error !== null && 'statusCode' in error && error.statusCode === 410) {
          console.log(`Subscription ${subscription.id} is no longer valid, marking as inactive`);
          await db.update(adminNotificationSubscriptions)
            .set({ active: false })
            .where(eq(adminNotificationSubscriptions.id, subscription.id));
        }
        
        return { success: false, subscription, error };
      }
    });
    
    // Wait for all notifications to be sent
    const results = await Promise.all(notificationPromises);
    
    // Log results
    const successful = results.filter(r => r.success).length;
    console.log(`Successfully sent ${successful} of ${results.length} notifications`);
    
    return results;
  } catch (error) {
    console.error('Error in sendAdminNotification:', error);
    throw error;
  }
}

/**
 * Send a notification about a new order
 * @param order The new order
 */
export async function sendNewOrderNotification(order: Order) {
  const title = 'New Order Received';
  const body = `Order #${order.id} for ₦${order.total.toLocaleString()} from ${order.customerName}`;
  const url = `/admin/orders/${order.id}`;
  
  return sendAdminNotification(title, body, url, undefined, { 
    orderId: order.id,
    orderTotal: order.total,
    orderType: 'new'
  });
}

/**
 * Send a notification about an order status change
 * @param order The updated order
 * @param previousStatus The previous status
 */
export async function sendOrderStatusNotification(order: Order, previousStatus: string) {
  const title = 'Order Status Updated';
  const body = `Order #${order.id} status changed from ${previousStatus} to ${order.status}`;
  const url = `/admin/orders/${order.id}`;
  
  return sendAdminNotification(title, body, url, undefined, {
    orderId: order.id,
    orderStatus: order.status,
    previousStatus,
    orderType: 'status_update'
  });
}