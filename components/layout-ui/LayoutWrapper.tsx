import { cn } from "@/lib/utils";

export default function LayoutWrapper({
  children,
  className,
}: Readonly<{
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn("w-full max-w-7xl mx-auto px-4", className)}>
      {children}
    </div>
  );
}
