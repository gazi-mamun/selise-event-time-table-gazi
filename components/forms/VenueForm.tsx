"use client";

import { useForm } from "react-hook-form";
import { useCalendarStore } from "@/lib/store";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function VenueForm() {
  const addVenue = useCalendarStore((s) => s.addVenue);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ title: string }>({
    defaultValues: { title: "" },
  });

  const onSubmit = (data: { title: string }) => {
    addVenue(data);
    reset();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-md p-4 rounded border"
    >
      <div className="space-y-2">
        <Label>Venue Name</Label>
        <Input
          {...register("title", { required: "Venue name is required" })}
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && (
          <p className="text-red-500 text-sm">{errors.title.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Add Venue
      </Button>
    </form>
  );
}
