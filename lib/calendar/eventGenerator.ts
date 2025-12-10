import moment from "moment";
import { SimpleEvent, Venue } from "@/lib/types/calendar.types";

export function generateRandomEventsForDay(
  dayMoment: moment.Moment,
  venues: Venue[]
): SimpleEvent[] {
  const seedStr = dayMoment.format("YYYYMMDD");
  let seed = Number.parseInt(seedStr, 10) || 1;

  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483647;
    return (seed % 1000000) / 1000000;
  };

  const titles = [
    "Client Meeting",
    "Workshop",
    "Team Sync",
    "Planning Session",
    "Training",
    "Strategy Call",
    "Review Session",
    "One-on-One",
    "Demo",
  ];

  const events: SimpleEvent[] = [];

  for (const v of venues) {
    const count = 1 + Math.floor(rand() * 4);

    for (let i = 0; i < count; i++) {
      const startHour = 8 + Math.floor(rand() * 10);
      const minutes = [0, 15, 30, 45];
      const minute = minutes[Math.floor(rand() * 4)];

      const dur =
        30 + Math.floor(rand() * 4) * 15 + Math.floor(rand() * 2) * 15;

      const start = dayMoment.clone().hour(startHour).minute(minute).second(0);
      let end = start.clone().add(dur, "minutes");

      if (end.isAfter(dayMoment.clone().endOf("day")))
        end = dayMoment.clone().endOf("day");

      events.push({
        id: `${dayMoment.format("YYYYMMDD")}-${v.id}-${i}`,
        title: titles[Math.floor(rand() * titles.length)],
        start: start.toDate(),
        end: end.toDate(),
        resourceId: v.id,
      });
    }
  }

  return events;
}
