const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

export function formatDistance(date: Date, baseDate: Date = new Date()): string {
  const seconds = Math.round(Math.abs(baseDate.getTime() - date.getTime()) / 1000);
  const isPast = date < baseDate;
  const suffix = isPast ? 'ago' : 'from now';
  
  let value;
  let unit;
  
  if (seconds < MINUTE) {
    return isPast ? 'just now' : 'in a few seconds';
  } else if (seconds < HOUR) {
    value = Math.floor(seconds / MINUTE);
    unit = value === 1 ? 'minute' : 'minutes';
  } else if (seconds < DAY) {
    value = Math.floor(seconds / HOUR);
    unit = value === 1 ? 'hour' : 'hours';
  } else if (seconds < WEEK) {
    value = Math.floor(seconds / DAY);
    unit = value === 1 ? 'day' : 'days';
  } else if (seconds < MONTH) {
    value = Math.floor(seconds / WEEK);
    unit = value === 1 ? 'week' : 'weeks';
  } else if (seconds < YEAR) {
    value = Math.floor(seconds / MONTH);
    unit = value === 1 ? 'month' : 'months';
  } else {
    value = Math.floor(seconds / YEAR);
    unit = value === 1 ? 'year' : 'years';
  }
  
  return `${value} ${unit} ${suffix}`;
}