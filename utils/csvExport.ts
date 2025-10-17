import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export interface AttendanceRecord {
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
  workedHours: string | null;
  status: string;
  notes: string | null;
}

const formatDate = (dateStr: string): string => {
  return format(new Date(dateStr), 'dd/MM/yyyy', { locale: it });
};

const formatDateTime = (dateTimeStr: string): string => {
  return format(new Date(dateTimeStr), 'dd/MM/yyyy HH:mm', { locale: it });
};

const escapeCSV = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const exportAttendanceToCSV = (
  records: AttendanceRecord[],
  operatorName: string,
  dateRange: { start: string; end: string }
) => {
  const headers = [
    'Data',
    'Evento',
    'Cliente',
    'Brand',
    'Indirizzo',
    'Orario Programmato',
    'Check-in',
    'Coordinate Check-in',
    'Check-out',
    'Coordinate Check-out',
    'Ore Lavorate',
    'Stato',
    'Note'
  ];

  const rows = records.map(record => [
    formatDate(record.shiftDate),
    record.eventTitle,
    record.clientName,
    record.brandName,
    record.address,
    `${record.startTime} - ${record.endTime}`,
    record.checkInTime ? formatDateTime(record.checkInTime) : '-',
    record.checkInLat && record.checkInLng 
      ? `${record.checkInLat}, ${record.checkInLng}` 
      : '-',
    record.checkOutTime ? formatDateTime(record.checkOutTime) : '-',
    record.checkOutLat && record.checkOutLng 
      ? `${record.checkOutLat}, ${record.checkOutLng}` 
      : '-',
    record.workedHours || '-',
    record.status,
    record.notes || '-'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeCSV).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });

  const filename = `presenze_${operatorName.replace(/\s/g, '_')}_${formatDate(dateRange.start)}_${formatDate(dateRange.end)}.csv`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();

  URL.revokeObjectURL(link.href);
};
