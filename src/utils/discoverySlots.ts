import { CallAvailability } from "../data/cmsData";

// Ghana (Africa/Accra) is UTC+0 year-round with no daylight saving, so all
// slot math is done in UTC and the results read directly as Accra time.
// A slot id is the UTC start time truncated to minutes: "YYYY-MM-DDTHH:mm".

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const slotIdFromDate = (d: Date) => d.toISOString().slice(0, 16);

export const slotIdToDate = (slotId: string) => new Date(`${slotId}:00Z`);

export const slotDateKey = (slotId: string) => slotId.slice(0, 10);

// All bookable slot ids from the availability rules, ignoring ones already taken.
export const generateSlotIds = (availability: CallAvailability, now: Date = new Date()): string[] => {
  const slotMinutes = Math.max(5, availability.slotMinutes || 30);
  const earliest = now.getTime() + Math.max(0, availability.minNoticeHours || 0) * 3600_000;
  const blocked = new Set(availability.blockedDates || []);
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const ids: string[] = [];

  for (let d = 0; d <= Math.max(0, availability.daysAhead || 0); d++) {
    const dayStart = todayUtc + d * 86400_000;
    const day = new Date(dayStart);
    const hours = availability.weekly?.[day.getUTCDay()];
    if (!hours?.enabled || blocked.has(day.toISOString().slice(0, 10))) continue;

    const end = toMinutes(hours.end);
    for (let t = toMinutes(hours.start); t + slotMinutes <= end; t += slotMinutes) {
      const start = dayStart + t * 60_000;
      if (start >= earliest) ids.push(slotIdFromDate(new Date(start)));
    }
  }
  return ids;
};

export const formatSlotDay = (slotId: string) =>
  slotIdToDate(slotId).toLocaleDateString("en-GB", {
    timeZone: "Africa/Accra",
    weekday: "short",
    day: "numeric",
    month: "short"
  });

export const formatSlotTime = (slotId: string, timeZone = "Africa/Accra") =>
  slotIdToDate(slotId).toLocaleTimeString("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit"
  });

export const formatSlotFull = (slotId: string) =>
  `${formatSlotDay(slotId)}, ${formatSlotTime(slotId)} GMT`;

// True when the viewer's browser is not on Ghana time, so we should also show local times.
export const viewerIsOffGmt = () => new Date().getTimezoneOffset() !== 0;
