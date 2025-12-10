import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CalendarEvent, Venue } from "./types/calendar.types";

interface CalendarStore {
  venues: Venue[];
  events: CalendarEvent[];

  addVenue: (data: Omit<Venue, "id">) => void;
  deleteVenue: (id: string) => void;

  addEvent: (data: Omit<CalendarEvent, "id">) => void;
  deleteEvent: (id: string) => void;
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      venues: [],
      events: [],

      addVenue: ({ title }) => {
        const newVenue: Venue = {
          id: crypto.randomUUID(),
          title,
        };
        set({ venues: [...get().venues, newVenue] });
      },

      deleteVenue: (id) => {
        set({
          venues: get().venues.filter((v) => v.id !== id),
          events: get().events.filter((e) => e.venueId !== id),
        });
      },

      addEvent: (data) => {
        const newEvent: CalendarEvent = {
          id: crypto.randomUUID(),
          ...data,
        };
        set({ events: [...get().events, newEvent] });
      },

      deleteEvent: (id) => {
        set({
          events: get().events.filter((e) => e.id !== id),
        });
      },
    }),
    { name: "calendar-store" }
  )
);
