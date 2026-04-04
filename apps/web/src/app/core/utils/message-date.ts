import { MessageDTO } from '@shared/models';

export function formatMessageDate(dateInput: string | Date): string {
  const date = new Date(dateInput);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffTime = today.getTime() - targetDay.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  const timeString = date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();

  if (diffDays === 0) {
    return timeString;
  }

  if (diffDays === 1) {
    return `Yesterday at ${timeString}`;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);

  return `${day}/${month}/${year}, ${timeString}`;
}

export function normalizeMessageDates(message: MessageDTO): MessageDTO {
  const createdAtSource = message.createdAt ?? new Date();
  const updatedAtSource = message.updatedAt ?? createdAtSource;

  return {
    ...message,
    createdAt: formatMessageDate(createdAtSource),
    updatedAt: formatMessageDate(updatedAtSource),
  };
}
