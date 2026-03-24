export interface Meeting {
  id: string;
  title: string;
  description: string;
  date: string;
  advanceReminderValue: number;
  advanceReminderUnit: 'minutes' | 'hours' | 'days';
  remindedAdvance: boolean;
  remindedActual: boolean;
  createdAt: string;
  color: string;
}