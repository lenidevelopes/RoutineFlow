/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function parse12hToMinutes(time12h: string): number {
  if (!time12h) return 0;
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (hours === 12) {
    hours = modifier === 'AM' ? 0 : 12;
  } else if (modifier === 'PM') {
    hours += 12;
  }
  
  return hours * 60 + minutes;
}

export function formatMinutesTo12h(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const modifier = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${modifier}`;
}

export function addMinutesTo12h(time12h: string, minutesToAdd: number): string {
  const currentMinutes = parse12hToMinutes(time12h);
  return formatMinutesTo12h(currentMinutes + minutesToAdd);
}

export function getDurationBetween12h(start12h: string, end12h: string): number {
  const start = parse12hToMinutes(start12h);
  const end = parse12hToMinutes(end12h);
  let diff = end - start;
  if (diff < 0) diff += 1440; // Handle overnight
  return diff;
}
