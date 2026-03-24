import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
}

export function getReminderTime(dateString: string, value: number, unit: 'minutes' | 'hours' | 'days') {
  const date = new Date(dateString);
  const reminderDate = new Date(date);
  
  if (unit === 'minutes') reminderDate.setMinutes(date.getMinutes() - value);
  if (unit === 'hours') reminderDate.setHours(date.getHours() - value);
  if (unit === 'days') reminderDate.setDate(date.getDate() - value);
  
  return reminderDate;
}