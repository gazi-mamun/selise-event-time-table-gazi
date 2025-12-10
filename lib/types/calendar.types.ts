export type Venue = {
  id: string;
  title: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  venueId: string;
  start: string; // ISO
  end: string; // ISO
};

export type SimpleEvent = {
  id: number | string;
  title: string;
  start: Date; // original base date (we'll generate per-day)
  end: Date;
  resourceId: string | number;
};
