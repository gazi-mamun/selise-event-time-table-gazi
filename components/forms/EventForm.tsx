"use client";

import { useForm, Controller } from "react-hook-form";
import { useCalendarStore } from "@/lib/store";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TimeSelect } from "@/components/ui/time-select";

type FormData = {
  title: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
};

export default function EventForm() {
  const { venues, addEvent } = useCalendarStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
    },
  });

  const onSubmit = (data: FormData) => {
    const start = new Date(`${data.date}T${data.startTime}:00`);
    const end = new Date(`${data.date}T${data.endTime}:00`);

    addEvent({
      title: data.title,
      venueId: data.venueId,
      start: start.toISOString(),
      end: end.toISOString(),
    });

    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-md p-4 rounded border bg-white"
    >
      {/* Title */}
      <div className="space-y-2">
        <Label>Event Title</Label>
        <Input
          {...register("title", { required: "Title is required" })}
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && (
          <p className="text-red-500 text-sm">{errors.title.message}</p>
        )}
      </div>

      {/* Venue */}
      <div className="space-y-2">
        <Label>Venue</Label>
        <select
          {...register("venueId", { required: "Venue is required" })}
          className={`border p-2 rounded w-full ${
            errors.venueId ? "border-red-500" : ""
          }`}
        >
          <option value="">Select venue</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.title}
            </option>
          ))}
        </select>
        {errors.venueId && (
          <p className="text-red-500 text-sm">{errors.venueId.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label>Date</Label>
        <Input
          type="date"
          {...register("date", { required: "Date is required" })}
          className={errors.date ? "border-red-500" : ""}
        />
        {errors.date && (
          <p className="text-red-500 text-sm">{errors.date.message}</p>
        )}
      </div>

      {/* Start Time */}
      <div className="space-y-2">
        <Label>Start Time</Label>
        <Controller
          control={control}
          name="startTime"
          rules={{ required: "Start time is required" }}
          render={({ field }) => (
            <TimeSelect
              value={field.value}
              onChange={field.onChange}
              placeholder="Select start time"
              className={errors.startTime ? "border-red-500" : ""}
            />
          )}
        />
        {errors.startTime && (
          <p className="text-red-500 text-sm">{errors.startTime.message}</p>
        )}
      </div>

      {/* End Time */}
      <div className="space-y-2">
        <Label>End Time</Label>
        <Controller
          control={control}
          name="endTime"
          rules={{
            required: "End time is required",
            validate: (value) => {
              const start = getValues("startTime");
              if (!start) return true;
              return value > start || "End time must be later than start time";
            },
          }}
          render={({ field }) => (
            <TimeSelect
              value={field.value}
              onChange={field.onChange}
              placeholder="Select end time"
              className={errors.endTime ? "border-red-500" : ""}
            />
          )}
        />
        {errors.endTime && (
          <p className="text-red-500 text-sm">{errors.endTime.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Add Event
      </Button>
    </form>
  );
}
