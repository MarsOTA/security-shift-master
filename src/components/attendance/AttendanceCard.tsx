import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, MapPin, Clock, CheckCircle, XCircle, MessageSquare, ExternalLink } from 'lucide-react';
import { WorkedHoursDisplay } from './WorkedHoursDisplay';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

type AttendanceStatus = 'completed' | 'in_progress' | 'missed';

interface AttendanceCardProps {
  eventTitle: string;
  clientName: string;
  brandName: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  address: string;
  checkInTime: string | null;
  checkInLat: number | null;
  checkInLng: number | null;
  checkOutTime: string | null;
  checkOutLat: number | null;
  checkOutLng: number | null;
  notes: string | null;
  status: AttendanceStatus;
}

const statusConfig = {
  completed: {
    label: 'Completato',
    variant: 'default' as const,
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
  },
  in_progress: {
    label: 'In corso',
    variant: 'secondary' as const,
    icon: Clock,
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
  },
  missed: {
    label: 'Mancato',
    variant: 'destructive' as const,
    icon: XCircle,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
  }
};

export const AttendanceCard = ({
  eventTitle,
  clientName,
  brandName,
  shiftDate,
  startTime,
  endTime,
  address,
  checkInTime,
  checkInLat,
  checkInLng,
  checkOutTime,
  checkOutLat,
  checkOutLng,
  notes,
  status
}: AttendanceCardProps) => {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const openInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold">{eventTitle}</CardTitle>
          <Badge className={config.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {clientName} - {brandName}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(new Date(shiftDate), 'dd MMMM yyyy', { locale: it })} | {startTime} - {endTime}
          </span>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <span>{address}</span>
        </div>

        <div className="border-t pt-3 space-y-2">
          {checkInTime && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Check-in: {format(new Date(checkInTime), 'HH:mm', { locale: it })}</span>
              </div>
              {checkInLat && checkInLng && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openInMaps(checkInLat, checkInLng)}
                  className="h-6 px-2"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Mappa
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          )}

          {checkOutTime && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span>Check-out: {format(new Date(checkOutTime), 'HH:mm', { locale: it })}</span>
              </div>
              {checkOutLat && checkOutLng && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openInMaps(checkOutLat, checkOutLng)}
                  className="h-6 px-2"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Mappa
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          )}

          {checkInTime && (
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Ore lavorate:</span>
              <WorkedHoursDisplay checkInTime={checkInTime} checkOutTime={checkOutTime} />
            </div>
          )}
        </div>

        {notes && (
          <div className="border-t pt-3">
            <div className="flex items-start gap-2 text-sm">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-muted-foreground italic">"{notes}"</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
