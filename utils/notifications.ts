import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return true; // Skip permissions on web
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  async scheduleInspectionReminder(vehicleId: string, licensePlate: string, dueDate: Date): Promise<void> {
    if (Platform.OS === 'web') {
      console.log(`Would schedule reminder for ${licensePlate} due ${dueDate.toLocaleDateString()}`);
      return;
    }

    try {
      // Schedule notification 30 days before due date
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(reminderDate.getDate() - 30);

      if (reminderDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Vehicle Inspection Due Soon',
            body: `Your vehicle ${licensePlate} inspection is due on ${dueDate.toLocaleDateString()}`,
            data: { vehicleId, type: 'inspection_reminder' },
          },
          trigger: {
            date: reminderDate,
          },
        });
      }

      // Schedule notification 7 days before due date
      const urgentReminderDate = new Date(dueDate);
      urgentReminderDate.setDate(urgentReminderDate.getDate() - 7);

      if (urgentReminderDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Vehicle Inspection Due This Week',
            body: `URGENT: Your vehicle ${licensePlate} inspection is due on ${dueDate.toLocaleDateString()}`,
            data: { vehicleId, type: 'urgent_reminder' },
          },
          trigger: {
            date: urgentReminderDate,
          },
        });
      }
    } catch (error) {
      console.error('Error scheduling inspection reminder:', error);
    }
  },

  async sendInspectionResult(licensePlate: string, status: 'pass' | 'fail' | 'conditional'): Promise<void> {
    if (Platform.OS === 'web') {
      console.log(`Would send inspection result for ${licensePlate}: ${status}`);
      return;
    }

    try {
      const title = status === 'pass' ? 'Inspection Passed!' : 'Inspection Failed';
      const body = status === 'pass' 
        ? `Your vehicle ${licensePlate} has passed inspection.`
        : `Your vehicle ${licensePlate} has failed inspection. Please address the violations and re-inspect.`;

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { licensePlate, status, type: 'inspection_result' },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending inspection result notification:', error);
    }
  },

  async sendSystemAnnouncement(title: string, message: string): Promise<void> {
    if (Platform.OS === 'web') {
      console.log(`Would send announcement: ${title}`);
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `DTRIS: ${title}`,
          body: message,
          data: { type: 'announcement' },
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending system announcement:', error);
    }
  },

  // Store device token for push notifications
  async registerDeviceToken(userId: string): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync();
      
      // Store token in Supabase for server-side notifications
      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: userId,
          token: token.data,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error storing device token:', error);
      }
    } catch (error) {
      console.error('Error registering device token:', error);
    }
  },
  async cancelVehicleNotifications(vehicleId: string): Promise<void> {
    if (Platform.OS === 'web') {
      return;
    }

    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const vehicleNotifications = scheduledNotifications.filter(
        notification => notification.content.data?.vehicleId === vehicleId
      );

      for (const notification of vehicleNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.error('Error canceling vehicle notifications:', error);
    }
  },
};