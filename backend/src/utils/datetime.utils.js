const TZ = 'Africa/Casablanca';
const BUSINESS_START = 9;
const BUSINESS_END = 17;

function getHourMinuteInTZ(dateInput, tz) {
  try {
    const parts = new Intl.DateTimeFormat('fr-MA', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: tz || TZ
    }).formatToParts(new Date(dateInput));
    const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
    return { hour, minute };
  } catch {
    return { hour: NaN, minute: NaN };
  }
}

function isOutsideBusinessHoursTZ(dateInput) {
  const { hour, minute } = getHourMinuteInTZ(dateInput, TZ);
  if (isNaN(hour)) return true;
  if (hour < BUSINESS_START) return true;
  if (hour > BUSINESS_END) return true;
  if (hour === BUSINESS_END && minute > 0) return true;
  return false;
}

function resolveDateParams(params) {
  const dateDebut = params.date_debut || params.start || params.start_date || params.startDate || params['start date'];
  const dateFin = params.date_fin || params.end || params.end_date || params.endDate || params['end date'];
  return { dateDebut, dateFin };
}

function normalizeDatetime(input, isStart = true) {
  if (!input) return null;
  const hasTime = typeof input === 'string' && (input.includes('T') || /\d{2}:\d{2}/.test(input));
  if (hasTime) {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  const base = typeof input === 'string' ? input : new Date(input).toISOString().split('T')[0];
  const hh = isStart ? String(BUSINESS_START).padStart(2, '0') : String(BUSINESS_END).padStart(2, '0');
  const composedLocal = new Date(`${base}T${hh}:00:00`);
  return isNaN(composedLocal.getTime()) ? null : composedLocal.toISOString();
}

function toTZTimestamp(dateInput, tz) {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
  const parts = new Intl.DateTimeFormat('fr-MA', {
    timeZone: tz || TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(d);
  const get = (t) => parseInt(parts.find(p => p.type === t)?.value || '0', 10);
  const year = get('year');
  const month = get('month');
  const day = get('day');
  const hour = get('hour');
  const minute = get('minute');
  const second = get('second');
  return Date.UTC(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, second || 0);
}

module.exports = {
  TZ,
  BUSINESS_START,
  BUSINESS_END,
  getHourMinuteInTZ,
  isOutsideBusinessHoursTZ,
  resolveDateParams,
  normalizeDatetime,
  toTZTimestamp
};
