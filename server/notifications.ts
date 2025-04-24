import { webPush } from './webPush';
import { db } from './db';
import { eq } from 'drizzle-orm';
import { adminNotificationSubscriptions, Order, CartItem, Juice } from '@shared/schema';

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
  icon: string = '/assets/icons/icon-192x192.png',
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
      badge: '/assets/icons/badge-72x72.png',
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

/**
 * Send a notification when a customer adds an item to their cart
 * @param cartItem The cart item that was added
 * @param juice The juice that was added to the cart
 */
export async function sendCartAddedNotification(cartItem: CartItem, juice: Juice) {
  try {
    console.log(`[CART NOTIFICATION] Starting to send cart notification for ${juice.name}`);
    
    let title = '🛒 New Item Added to Cart';
    let body = `A customer just added ${cartItem.quantity}x ${juice.name} to their cart!`;
    let icon = undefined;
    
    // Special notification for detox juices
    if (juice.category && juice.category.toLowerCase().includes('detox')) {
      console.log(`[CART NOTIFICATION] Using special detox notification for ${juice.name}`);
      title = '🌿 Detox Juice Added to Cart!';
      body = `A health-conscious customer just added ${cartItem.quantity}x ${juice.name} to their cart. Detox juices are trending today!`;
      // We could use a special icon for detox juices if we had one
    }
    
    const url = '/admin/dashboard';
    
    console.log(`[CART NOTIFICATION] Preparing to send notification with title: ${title}`);
    
    const notificationData = {
      cartItemId: cartItem.id,
      juiceId: juice.id,
      juiceName: juice.name,
      juiceCategory: juice.category || 'Unknown',
      price: juice.price,
      quantity: cartItem.quantity,
      sessionId: cartItem.sessionId,
      notificationType: 'cart_item_added',
      isDetox: juice.category && juice.category.toLowerCase().includes('detox')
    };
    
    console.log(`[CART NOTIFICATION] Notification data prepared:`, notificationData);
    
    const result = await sendAdminNotification(title, body, url, icon, notificationData);
    console.log(`[CART NOTIFICATION] Notification process complete for ${juice.name}`);
    return result;
  } catch (error) {
    console.error(`[CART NOTIFICATION ERROR] Failed to send cart notification for ${juice.name}:`, error);
    // Don't throw so the cart operation can still succeed even if notification fails
    return null;
  }
}