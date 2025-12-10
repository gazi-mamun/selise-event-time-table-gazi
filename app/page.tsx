import Link from "next/link";
import EventCalendarWithVenues from "../components/calendar-ui/EventCalendarWithVenues";

export default function Home() {
  return (
    <>
      <EventCalendarWithVenues />;{/* manage button */}
      <Link href={`/manage`}>
        <div className="px-2 pb-1.5 pt-1 rounded-md fixed bottom-10 right-10 bg-green-400 z-50">
          <p>Manage</p>
        </div>
      </Link>
    </>
  );
}
