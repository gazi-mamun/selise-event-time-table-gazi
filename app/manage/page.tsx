"use client";

import VenueForm from "@/components/forms/VenueForm";
import EventForm from "@/components/forms/EventForm";
import { Button } from "@/components/ui/button";
import { useCalendarStore } from "@/lib/store";
import moment from "moment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LayoutWrapper from "@/components/layout-ui/LayoutWrapper";
import Link from "next/link";

export default function ManagePage() {
  const { venues, deleteVenue, events, deleteEvent } = useCalendarStore();

  return (
    <LayoutWrapper className="p-6 space-y-6">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-xl font-bold">Calendar Administration</h1>
        <Link href={`/`}>
          <p>Show in Calendar</p>
        </Link>
      </div>

      <Tabs defaultValue="venues" className="w-full">
        <TabsList>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* ---------------- VENUES TAB ---------------- */}
        <TabsContent value="venues">
          <div className="space-y-6">
            <VenueForm />

            <div className="space-y-2">
              {venues.length === 0 && (
                <p className="text-sm text-gray-500">No venues added yet.</p>
              )}

              {venues.map((v) => (
                <div
                  key={v.id}
                  className="p-3 border rounded flex justify-between items-center"
                >
                  <span className="font-medium">{v.title}</span>

                  <Button
                    variant="destructive"
                    onClick={() => deleteVenue(v.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ---------------- EVENTS TAB ---------------- */}
        <TabsContent value="events">
          <div className="space-y-6">
            <EventForm />

            <div className="space-y-2">
              {events.length === 0 && (
                <p className="text-sm text-gray-500">No events added yet.</p>
              )}

              {events.map((e) => {
                const venue = venues.find((v) => v.id === e.venueId);

                return (
                  <div
                    key={e.id}
                    className="p-3 border rounded flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{e.title}</div>

                      <div className="text-sm text-gray-600">
                        {venue?.title ?? "Unknown Venue"} —{" "}
                        <span className="font-semibold">
                          {moment(e.start).format("YYYY-MM-DD")}
                        </span>{" "}
                        {moment(e.start).format("HH:mm")} to{" "}
                        {moment(e.end).format("HH:mm")}
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      onClick={() => deleteEvent(e.id)}
                    >
                      Delete
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </LayoutWrapper>
  );
}
