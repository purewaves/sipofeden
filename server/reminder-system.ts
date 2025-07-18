import { eq, and, gte, lte } from "drizzle-orm";
import { db } from "./db";
import { subscriptions, loyaltyCustomers } from "@shared/schema";

/**
 * Reminder System for Subscription Management
 * Tracks subscription renewals, payment reminders, and customer follow-ups
 */

export interface ReminderEvent {
  id: string;
  customerId: number;
  subscriptionId: number;
  type: 'renewal' | 'payment_due' | 'delivery' | 'feedback' | 'pause_reminder';
  scheduledDate: Date;
  message: string;
  isProcessed: boolean;
  customerInfo?: {
    name: string;
    email: string;
    phone?: string;
  };
}

export class ReminderSystem {
  private reminders: Map<string, ReminderEvent> = new Map();

  /**
   * Schedule a reminder for subscription renewal
   */
  async scheduleRenewalReminder(subscriptionId: number, daysBeforeRenewal: number = 3): Promise<string> {
    try {
      // Get subscription details
      const subscription = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.id, subscriptionId))
        .then(results => results[0]);

      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + daysBeforeRenewal);

      const reminderId = `renewal_${subscriptionId}_${Date.now()}`;
      
      const reminder: ReminderEvent = {
        id: reminderId,
        customerId: subscription.id,
        subscriptionId: subscriptionId,
        type: 'renewal',
        scheduledDate: reminderDate,
        message: `Your subscription will renew in ${daysBeforeRenewal} days. Delivery scheduled for ${subscription.nextDelivery}.`,
        isProcessed: false
      };

      this.reminders.set(reminderId, reminder);
      console.log(`[REMINDER] Scheduled renewal reminder for subscription ${subscriptionId} on ${reminderDate}`);
      
      return reminderId;
    } catch (error) {
      console.error('Error scheduling renewal reminder:', error);
      throw error;
    }
  }

  /**
   * Schedule a payment due reminder
   */
  async schedulePaymentReminder(subscriptionId: number, amount: number): Promise<string> {
    try {
      const subscription = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.id, subscriptionId))
        .then(results => results[0]);

      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + 1); // Payment due tomorrow

      const reminderId = `payment_${subscriptionId}_${Date.now()}`;
      
      const reminder: ReminderEvent = {
        id: reminderId,
        customerId: subscription.id,
        subscriptionId: subscriptionId,
        type: 'payment_due',
        scheduledDate: reminderDate,
        message: `Payment of $${amount.toFixed(2)} is due for your subscription. Please ensure your payment method is up to date.`,
        isProcessed: false
      };

      this.reminders.set(reminderId, reminder);
      console.log(`[REMINDER] Scheduled payment reminder for subscription ${subscriptionId} - $${amount}`);
      
      return reminderId;
    } catch (error) {
      console.error('Error scheduling payment reminder:', error);
      throw error;
    }
  }

  /**
   * Schedule a delivery reminder
   */
  async scheduleDeliveryReminder(subscriptionId: number, deliveryDate: string): Promise<string> {
    try {
      const subscription = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.id, subscriptionId))
        .then(results => results[0]);

      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      const reminderDate = new Date(deliveryDate);
      reminderDate.setDate(reminderDate.getDate() - 1); // Day before delivery

      const reminderId = `delivery_${subscriptionId}_${Date.now()}`;
      
      const reminder: ReminderEvent = {
        id: reminderId,
        customerId: subscription.id,
        subscriptionId: subscriptionId,
        type: 'delivery',
        scheduledDate: reminderDate,
        message: `Your juice delivery is scheduled for tomorrow (${deliveryDate}). Make sure someone is available to receive it!`,
        isProcessed: false
      };

      this.reminders.set(reminderId, reminder);
      console.log(`[REMINDER] Scheduled delivery reminder for subscription ${subscriptionId} on ${deliveryDate}`);
      
      return reminderId;
    } catch (error) {
      console.error('Error scheduling delivery reminder:', error);
      throw error;
    }
  }

  /**
   * Schedule a feedback reminder after delivery
   */
  async scheduleFeedbackReminder(subscriptionId: number, daysAfterDelivery: number = 2): Promise<string> {
    try {
      const subscription = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.id, subscriptionId))
        .then(results => results[0]);

      if (!subscription) {
        throw new Error(`Subscription ${subscriptionId} not found`);
      }

      const reminderDate = new Date();
      reminderDate.setDate(reminderDate.getDate() + daysAfterDelivery);

      const reminderId = `feedback_${subscriptionId}_${Date.now()}`;
      
      const reminder: ReminderEvent = {
        id: reminderId,
        customerId: subscription.id,
        subscriptionId: subscriptionId,
        type: 'feedback',
        scheduledDate: reminderDate,
        message: `How was your recent delivery? We'd love to hear your feedback and help improve your juice experience!`,
        isProcessed: false
      };

      this.reminders.set(reminderId, reminder);
      console.log(`[REMINDER] Scheduled feedback reminder for subscription ${subscriptionId} in ${daysAfterDelivery} days`);
      
      return reminderId;
    } catch (error) {
      console.error('Error scheduling feedback reminder:', error);
      throw error;
    }
  }

  /**
   * Process due reminders
   */
  async processDueReminders(): Promise<ReminderEvent[]> {
    const now = new Date();
    const dueReminders: ReminderEvent[] = [];

    for (const [id, reminder] of this.reminders.entries()) {
      if (!reminder.isProcessed && reminder.scheduledDate <= now) {
        // Mark as processed
        reminder.isProcessed = true;
        dueReminders.push(reminder);
        
        console.log(`[REMINDER] Processing due reminder: ${reminder.type} for subscription ${reminder.subscriptionId}`);
        
        // Here you would integrate with WhatsApp API, email service, or SMS
        // For now, we'll just log and prepare for future WhatsApp bot integration
        await this.logReminderAction(reminder);
      }
    }

    return dueReminders;
  }

  /**
   * Log reminder action for audit trail
   */
  private async logReminderAction(reminder: ReminderEvent): Promise<void> {
    console.log(`[REMINDER LOG] ${reminder.type.toUpperCase()}: ${reminder.message}`);
    console.log(`[REMINDER LOG] Customer ID: ${reminder.customerId}, Subscription ID: ${reminder.subscriptionId}`);
    console.log(`[REMINDER LOG] Scheduled: ${reminder.scheduledDate}, Processed: ${new Date()}`);
    
    // Future integration point for WhatsApp bots, email, SMS
    // await this.sendWhatsAppMessage(reminder);
    // await this.sendEmail(reminder);
    // await this.sendSMS(reminder);
  }

  /**
   * Get all reminders for a specific customer
   */
  getCustomerReminders(customerId: number): ReminderEvent[] {
    return Array.from(this.reminders.values()).filter(
      reminder => reminder.customerId === customerId
    );
  }

  /**
   * Get all reminders for a specific subscription
   */
  getSubscriptionReminders(subscriptionId: number): ReminderEvent[] {
    return Array.from(this.reminders.values()).filter(
      reminder => reminder.subscriptionId === subscriptionId
    );
  }

  /**
   * Cancel a specific reminder
   */
  cancelReminder(reminderId: string): boolean {
    return this.reminders.delete(reminderId);
  }

  /**
   * Get pending reminders count
   */
  getPendingRemindersCount(): number {
    return Array.from(this.reminders.values()).filter(
      reminder => !reminder.isProcessed
    ).length;
  }

  /**
   * Clean up processed reminders older than specified days
   */
  cleanupOldReminders(daysOld: number = 30): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let cleanedCount = 0;
    for (const [id, reminder] of this.reminders.entries()) {
      if (reminder.isProcessed && reminder.scheduledDate < cutoffDate) {
        this.reminders.delete(id);
        cleanedCount++;
      }
    }
    
    console.log(`[REMINDER] Cleaned up ${cleanedCount} old processed reminders`);
    return cleanedCount;
  }

  /**
   * Setup subscription reminders when a new subscription is created
   */
  async setupSubscriptionReminders(subscriptionId: number): Promise<string[]> {
    const reminderIds: string[] = [];
    
    try {
      // Schedule renewal reminder (3 days before)
      const renewalId = await this.scheduleRenewalReminder(subscriptionId, 3);
      reminderIds.push(renewalId);
      
      // Schedule delivery reminder (1 day before)
      const subscription = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.id, subscriptionId))
        .then(results => results[0]);
        
      if (subscription && subscription.nextDelivery) {
        const deliveryId = await this.scheduleDeliveryReminder(subscriptionId, subscription.nextDelivery);
        reminderIds.push(deliveryId);
        
        // Schedule feedback reminder (2 days after delivery)
        const feedbackId = await this.scheduleFeedbackReminder(subscriptionId, 2);
        reminderIds.push(feedbackId);
      }
      
      console.log(`[REMINDER] Setup complete for subscription ${subscriptionId} - ${reminderIds.length} reminders scheduled`);
      
    } catch (error) {
      console.error('Error setting up subscription reminders:', error);
    }
    
    return reminderIds;
  }
}

// Singleton instance
export const reminderSystem = new ReminderSystem();

/**
 * Auto-process reminders every hour
 */
setInterval(async () => {
  try {
    const dueReminders = await reminderSystem.processDueReminders();
    if (dueReminders.length > 0) {
      console.log(`[REMINDER] Processed ${dueReminders.length} due reminders`);
    }
  } catch (error) {
    console.error('Error in automatic reminder processing:', error);
  }
}, 60 * 60 * 1000); // Every hour

/**
 * Cleanup old reminders daily
 */
setInterval(() => {
  try {
    reminderSystem.cleanupOldReminders(30); // Clean up reminders older than 30 days
  } catch (error) {
    console.error('Error in reminder cleanup:', error);
  }
}, 24 * 60 * 60 * 1000); // Every 24 hours

console.log('[REMINDER SYSTEM] Initialized with automatic processing every hour');
