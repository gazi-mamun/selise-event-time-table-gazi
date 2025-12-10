"use client";

import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import moment from "moment";
import { Tab, Tabs, Box } from "@mui/material";
import { useCalendarStore } from "@/lib/store";
import { SimpleEvent } from "@/lib/types/calendar.types";

type PositionedEvent = {
  ev: SimpleEvent;
  topPx: number;
  heightPx: number;
  leftPercent: number;
  widthPercent: number;
};

export default function EventCalendarWithVenues() {
  const venues = useCalendarStore((s) => s.venues);
  const events = useCalendarStore((s) => s.events);

  // control current selected day (7-day tab bar)
  const [startDate, setStartDate] = useState<Date>(
    moment().startOf("week").toDate()
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(
    moment().weekday()
  );

  // pixels per 15 minutes (kept from original logic)
  const PIXELS_PER_15 = 48;

  const timeGutterRef = useRef<HTMLDivElement | null>(null);
  const venueAreaRef = useRef<HTMLDivElement | null>(null);
  const eventsGridRef = useRef<HTMLDivElement | null>(null);
  const venueHeaderRef = useRef<HTMLDivElement | null>(null);

  const dayScrollRef = useRef<HTMLDivElement>(null);

  // Dynamic infinite day list centered around selected day
  const TAB_WINDOW = 7; // total number of tabs visible at once
  const days = useMemo(() => {
    const centerDate = moment(startDate).add(selectedDayIndex, "day");
    const half = Math.floor(TAB_WINDOW / 2);
    return Array.from({ length: TAB_WINDOW }).map((_, i) =>
      centerDate.clone().subtract(half, "day").add(i, "day")
    );
  }, [startDate, selectedDayIndex]);

  // sync scroll: when user scrolls the venue area, update time gutter scrollTop, and vice versa
  useEffect(() => {
    const timeEl = timeGutterRef.current;
    const venueEl = venueAreaRef.current;
    if (!timeEl || !venueEl) return;

    let isSyncing = false;

    const onVenueScroll = () => {
      if (isSyncing) return;
      isSyncing = true;
      timeEl.scrollTop = venueEl.scrollTop;
      globalThis.requestAnimationFrame(() => (isSyncing = false));
    };

    const onTimeScroll = () => {
      if (isSyncing) return;
      isSyncing = true;
      venueEl.scrollTop = timeEl.scrollTop;
      globalThis.requestAnimationFrame(() => (isSyncing = false));
    };

    venueEl.addEventListener("scroll", onVenueScroll);
    timeEl.addEventListener("scroll", onTimeScroll);

    return () => {
      venueEl.removeEventListener("scroll", onVenueScroll);
      timeEl.removeEventListener("scroll", onTimeScroll);
    };
  }, []);

  useLayoutEffect(() => {
    function updateHeight() {
      const h = venueHeaderRef.current?.clientHeight || 0;
      document.documentElement.style.setProperty(
        "--venue-header-height",
        `${h}px`
      );
    }

    updateHeight();

    // Recalculate after layout stabilizes
    requestAnimationFrame(updateHeight);
    setTimeout(updateHeight, 50);
    setTimeout(updateHeight, 200);

    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [venues]);

  function eventsForDay(dayMoment: moment.Moment) {
    const dayDate = dayMoment.format("YYYY-MM-DD");

    const realEvents = events
      .filter((ev) => moment(ev.start).format("YYYY-MM-DD") === dayDate)
      .map((ev) => ({
        id: ev.id,
        title: ev.title,
        start: new Date(ev.start),
        end: new Date(ev.end),
        resourceId: ev.venueId,
      }));

    return realEvents;
  }

  // compute active date
  const activeDateMoment = days[selectedDayIndex].clone();

  // build per-venue events for the active date
  const perVenueEvents = useMemo(() => {
    const dayEvents = eventsForDay(activeDateMoment);
    const map: Record<string, typeof dayEvents> = {} as Record<
      string,
      typeof dayEvents
    >;
    venues.forEach((v) => (map[String(v.id)] = []));
    dayEvents.forEach((ev) => {
      const key = String(ev.resourceId);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    });

    // For each venue we arrange overlapping events into columns
    const arranged: Record<string, PositionedEvent[]> = {};

    Object.entries(map).forEach(([venueId, evs]) => {
      // sort by start
      const sorted = evs
        .slice()
        .sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf());

      // assign columns greedily
      const columns: Array<{ end: moment.Moment }> = [];
      const placed: Array<{
        ev: SimpleEvent;
        col: number;
        start: moment.Moment;
        end: moment.Moment;
      }> = [];

      sorted.forEach((ev) => {
        const s = moment(ev.start);
        const e = moment(ev.end);
        let placedCol = -1;
        for (let i = 0; i < columns.length; i++) {
          if (s.isSameOrAfter(columns[i].end)) {
            placedCol = i;
            columns[i].end = e.clone();
            break;
          }
        }
        if (placedCol === -1) {
          columns.push({ end: e.clone() });
          placedCol = columns.length - 1;
        }
        placed.push({ ev, col: placedCol, start: s, end: e });
      });

      const totalCols = Math.max(1, columns.length);

      arranged[venueId] = placed.map((p) => {
        const minutesFromTop = p.start.hours() * 60 + p.start.minutes();
        const durationMinutes = p.end.diff(p.start, "minutes");
        const topPx = (minutesFromTop / 15) * PIXELS_PER_15;
        const heightPx = (durationMinutes / 15) * PIXELS_PER_15;
        const widthPercent = 100 / totalCols;
        return {
          ev: p.ev,
          topPx,
          heightPx,
          leftPercent: p.col * widthPercent,
          widthPercent,
        };
      });
    });

    return arranged;
  }, [activeDateMoment]);

  // on mount and when selectedDayIndex changes, scroll to current time if viewing current day
  // Updated behavior: scroll to containing event if exists, otherwise next upcoming event, otherwise fallback to current time position
  useEffect(() => {
    const venueEl = venueAreaRef.current;
    if (!venueEl) return;

    const today = moment();
    const activeIsToday = activeDateMoment.isSame(today, "day");

    if (!activeIsToday) {
      // Get that day's events sorted by start time
      const dayEvents = eventsForDay(activeDateMoment)
        .map((ev) => ({
          ...ev,
          startM: moment(ev.start),
          endM: moment(ev.end),
        }))
        .sort((a, b) => a.startM.valueOf() - b.startM.valueOf());

      const earliest = dayEvents[0];

      const headerHeight = venueHeaderRef.current?.clientHeight || 0;
      const offset = headerHeight + 8;

      if (earliest) {
        const minutesFromTop =
          earliest.startM.hours() * 60 + earliest.startM.minutes();

        const topPx = (minutesFromTop / 15) * PIXELS_PER_15;

        venueEl.scrollTop = Math.max(0, topPx - offset);
      } else {
        // fallback: no events → scroll to top
        venueEl.scrollTop = 0;
      }

      return;
    }

    // get all events for active day (flatten)
    const dayEvents = eventsForDay(activeDateMoment)
      .map((ev) => ({
        ...ev,
        startM: moment(ev.start),
        endM: moment(ev.end),
      }))
      .sort((a, b) => a.startM.valueOf() - b.startM.valueOf());

    const nowM = today;

    // 1) find an event that contains now
    let targetEvent = dayEvents.find((ev) =>
      nowM.isBetween(ev.startM, ev.endM, null, "[]")
    );

    // 2) if none, find the next upcoming event (start > now)
    targetEvent ??= dayEvents.find((ev) => ev.startM.isAfter(nowM));

    const headerHeight = venueHeaderRef.current?.clientHeight || 0;
    const offset = headerHeight + 8;

    if (targetEvent) {
      // compute topPx for the event (based on its start)
      const minutesFromTop =
        targetEvent.startM.hours() * 60 + targetEvent.startM.minutes();
      const topPx = (minutesFromTop / 15) * PIXELS_PER_15;
      // scroll so the event's top appears just below the header
      venueEl.scrollTop = Math.max(0, topPx - offset);
    } else {
      // fallback: scroll to current time position (same as before)
      const minutesNow = nowM.hours() * 60 + nowM.minutes();
      const topPx = (minutesNow / 15) * PIXELS_PER_15;
      venueEl.scrollTop = Math.max(0, topPx - offset);
    }
  }, [selectedDayIndex, activeDateMoment]);

  // Sync: handle tab change
  // const handleTabChange = (e: React.SyntheticEvent, newIndex: number) => {
  //   setSelectedDayIndex(newIndex);
  // };

  const handleTabChange = (e: React.SyntheticEvent, newIndex: number) => {
    const currentCenter = Math.floor(days.length / 2);
    const shift = newIndex - currentCenter;
    setStartDate((prev) => moment(prev).add(shift, "day").toDate());
  };

  useEffect(() => {
    if (!dayScrollRef.current) return;

    const scrollEl =
      dayScrollRef.current.querySelector<HTMLDivElement>(".MuiTabs-scroller");
    if (!scrollEl) return;

    const handleScroll = () => {
      const scrollLeft = scrollEl.scrollLeft;
      const clientWidth = scrollEl.clientWidth;
      const scrollWidth = scrollEl.scrollWidth;
      const threshold = 50;

      // prepend previous days
      if (scrollLeft < threshold) {
        setStartDate((prev) => moment(prev).subtract(3, "days").toDate());
        scrollEl.scrollLeft += 3 * 100; // approximate width of 3 tabs
      }

      // append next days
      if (scrollLeft + clientWidth > scrollWidth - threshold) {
        setStartDate((prev) => moment(prev).add(3, "days").toDate());
        scrollEl.scrollLeft -= 3 * 100; // adjust to maintain smooth scroll
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [days]);

  return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col">
      {/* Top tabbar: 7 days, scrollable using Material UI default behavior */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }} ref={dayScrollRef}>
        <Tabs
          value={selectedDayIndex}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {days.map((d, i) => (
            <Tab
              key={i}
              label={
                <div className="flex flex-col text-center">
                  <span className="text-sm">{d.format("dddd")}</span>
                  <span className="text-xs font-medium">{`Date: ${d.format(
                    "YYYY-MM-DD"
                  )}`}</span>
                </div>
              }
              aria-label={`Day ${i}`}
              className="flex-1"
            />
          ))}
        </Tabs>
      </Box>

      {/* Venue bar + Calendar area */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left time gutter - fixed/sticky */}
        <div className="w-20 shrink-0 bg-white z-30 border-r border-gray-200 pt-(--venue-header-height)">
          <div
            className="h-full overflow-auto border-t border-gray-200"
            id="time-gutter"
            ref={timeGutterRef}
          >
            <div className="relative">
              {Array.from({ length: 24 * 4 }).map((_, i) => {
                const hour = Math.floor(i / 4);
                const minute = (i % 4) * 15;
                // show every 15-minute label in 24-hour format
                const label = moment()
                  .hour(hour)
                  .minute(minute)
                  .format("HH:mm");
                return (
                  <div
                    key={i}
                    className="h-12 w-full border-b border-gray-100 flex items-center justify-center px-2 text-[11px] text-gray-600"
                  >
                    <span className="">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right area: venues header + events — this scrolls horizontally and vertically */}
        <div
          className="flex-1 overflow-auto"
          id="venue-area"
          ref={venueAreaRef}
        >
          {/* Venue header bar (sticky on vertical scroll) */}
          <div
            className="sticky top-0 z-20 bg-white border-b border-gray-200"
            ref={venueHeaderRef}
          >
            <div className="min-w-full flex">
              {/* Venue boxes — each has same width */}
              <div className="flex flex-1 overflow-x-auto" id="venue-bar">
                {venues.map((v) => (
                  <div
                    key={v.id}
                    className="min-w-[220px] shrink-0 border-l border-gray-100 px-4 py-3"
                  >
                    <div className="text-sm font-medium text-center">
                      {v.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Events grid: we'll render a simple grid that lines up to 15-minute slots */}
          <div className="min-w-full flex">
            <div
              className="flex flex-1 overflow-x-auto"
              id="events-grid"
              ref={eventsGridRef}
            >
              {/* Each venue column */}
              {venues.map((v) => (
                <div
                  key={v.id}
                  className="min-w-[220px] shrink-0 border-l border-gray-100 relative"
                >
                  {/* Empty background slots (24h * 4 slots) */}
                  <div>
                    {Array.from({ length: 24 * 4 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-12 border-b border-gray-100"
                      ></div>
                    ))}
                  </div>

                  {/* Render events for this venue with overlap handling */}
                  <div className="absolute left-0 top-0 right-0 pointer-events-none">
                    {(perVenueEvents[String(v.id)] || []).map((p, index) => {
                      const { ev, topPx, heightPx, leftPercent, widthPercent } =
                        p;
                      // reduce width slightly for spacing
                      const widthCalc = `calc(${widthPercent}% - 8px)`;
                      const leftCalc = `calc(${leftPercent}% + 4px)`;

                      return (
                        <div
                          key={`${ev.id}-${index}`}
                          className="absolute bg-blue-600 text-white shadow pointer-events-auto p-1 overflow-hidden flex items-center justify-center text-center"
                          style={{
                            top: topPx,
                            height: heightPx,
                            left: leftCalc,
                            width: widthCalc,
                          }}
                          title={`${ev.title} (${moment(ev.start).format(
                            "HH:mm"
                          )} - ${moment(ev.end).format("HH:mm")})`}
                        >
                          <div className="w-max h-max">
                            <div className="text-xs font-semibold truncate">
                              {ev.title}
                            </div>
                            <div className="text-[11px] opacity-80 truncate">{`${moment(
                              ev.start
                            ).format("HH:mm")} - ${moment(ev.end).format(
                              "HH:mm"
                            )}`}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notes:
          - slot height remains 20px per 15 minutes (PIXELS_PER_15). Change in one place if necessary.
          - events are arranged per-venue with a greedy column algorithm to avoid visual overlap — overlapping events are shown side-by-side.
          - time labels are 24-hour and show every 15-minute label (HH:mm).
          - event tooltips and times are in 24-hour format.
          - venue header height is subtracted when auto-scrolling to current time so it won't hide the event.
          - different days now generate deterministic event sets so each day shows different events per venue.
      */}
    </div>
  );
}
