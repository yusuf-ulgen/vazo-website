export type NotificationType = 'order' | 'stock' | 'wholesale' | 'contact' | 'payment';

export interface AdminNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  timestamp: string;
  read: boolean;
}
