import { Clock } from 'lucide-react';

interface WorkedHoursDisplayProps {
  checkInTime: string | null;
  checkOutTime: string | null;
}

export const WorkedHoursDisplay = ({ checkInTime, checkOutTime }: WorkedHoursDisplayProps) => {
  if (!checkInTime) return <span className="text-muted-foreground">-</span>;
  if (!checkOutTime) return <span className="text-orange-600 flex items-center gap-1"><Clock className="h-3 w-3" />In corso</span>;

  const start = new Date(checkInTime);
  const end = new Date(checkOutTime);
  const diffMs = end.getTime() - start.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <span className="font-medium text-foreground">
      {hours}h {minutes}m
    </span>
  );
};

export const calculateWorkedHours = (checkIn: string, checkOut: string | null): string | null => {
  if (!checkOut) return null;

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffMs = end.getTime() - start.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
};
