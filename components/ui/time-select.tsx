import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { generateTimeSlots } from "@/lib/time-utils";
import { cn } from "@/lib/utils";

export function TimeSelect({
  value,
  onChange,
  placeholder = "Select time",
  className,
}: Readonly<{
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}>) {
  const times = generateTimeSlots();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent className="max-h-64">
        {times.map((time) => (
          <SelectItem key={time} value={time}>
            {time}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
