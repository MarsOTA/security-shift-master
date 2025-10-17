import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { AttendanceCard } from '@/components/attendance/AttendanceCard';
import { AttendanceFilters } from '@/components/attendance/AttendanceFilters';
import { AttendanceSummary } from '@/components/attendance/AttendanceSummary';
import { exportAttendanceToCSV, AttendanceRecord } from '@/utils/csvExport';
import { calculateWorkedHours } from '@/components/attendance/WorkedHoursDisplay';
import { toast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import { subDays, format } from 'date-fns';

type AttendanceStatus = 'completed' | 'in_progress' | 'missed';

interface AttendanceData {
  id: string;
  check_in_time: string | null;
  check_out_time: string | null;
  location_lat: number | null;
  location_lng: number | null;
  notes: string | null;
  shifts: {
    id: string;
    date: string;
    start_time: string;
    end_time: string;
    events: {
      title: string;
      address: string;
      clients: { name: string } | null;
      brands: { name: string } | null;
    } | null;
  } | null;
}

export default function OperatorAttendance() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [operatorName, setOperatorName] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadAttendanceData();
  }, [user, dateRange]);

  const loadAttendanceData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('operator_id')
        .eq('id', user.id)
        .single();

      if (!profile?.operator_id) {
        toast({
          title: 'Errore',
          description: 'Profilo operatore non trovato',
          variant: 'destructive'
        });
        return;
      }

      const { data: operator } = await supabase
        .from('operators')
        .select('name')
        .eq('id', profile.operator_id)
        .single();

      if (operator) {
        setOperatorName(operator.name);
      }

      const { data: shiftsData } = await supabase
        .from('shifts')
        .select(`
          id,
          date,
          start_time,
          end_time,
          events (
            title,
            address,
            clients (name),
            brands (name)
          )
        `)
        .gte('date', dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '1970-01-01')
        .lte('date', dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '2100-12-31');

      if (!shiftsData) {
        throw new Error('Unable to load shifts');
      }

      const { data: checkinsData } = await supabase
        .from('shift_checkins')
        .select('*')
        .eq('operator_id', profile.operator_id)
        .order('check_in_time', { ascending: false });

      const attendanceWithShifts = (checkinsData || []).map(checkin => {
        const shift = shiftsData.find(s => s.id === checkin.shift_id);
        return {
          ...checkin,
          shifts: shift || null
        };
      });

      setAttendanceData(attendanceWithShifts as any);
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare il registro presenze',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatus = (
    shiftDate: string,
    checkIn: string | null,
    checkOut: string | null
  ): AttendanceStatus => {
    const now = new Date();
    const shiftDateTime = new Date(shiftDate);

    if (!checkIn && shiftDateTime < now) return 'missed';
    if (checkIn && checkOut) return 'completed';
    return 'in_progress';
  };

  const filteredData = attendanceData.filter(record => {
    if (!record.shifts) return false;
    
    const status = getAttendanceStatus(
      record.shifts.date,
      record.check_in_time,
      record.check_out_time
    );

    if (statusFilter !== 'all' && status !== statusFilter) return false;
    return true;
  });

  const calculateSummary = () => {
    const completed = filteredData.filter(r => 
      getAttendanceStatus(r.shifts!.date, r.check_in_time, r.check_out_time) === 'completed'
    );

    const totalHours = completed.reduce((sum, record) => {
      const hours = calculateWorkedHours(record.check_in_time!, record.check_out_time!);
      if (hours) {
        const [h, m] = hours.split('h ').map(s => parseInt(s));
        return sum + h + (m / 60);
      }
      return sum;
    }, 0);

    const completionRate = filteredData.length > 0 
      ? Math.round((completed.length / filteredData.length) * 100)
      : 0;

    return {
      totalShifts: completed.length,
      totalHours: Math.round(totalHours),
      completionRate
    };
  };

  const handleExportCSV = () => {
    const records: AttendanceRecord[] = filteredData
      .filter(record => record.shifts?.events)
      .map(record => ({
        eventTitle: record.shifts!.events!.title,
        clientName: record.shifts!.events!.clients?.name || 'N/A',
        brandName: record.shifts!.events!.brands?.name || 'N/A',
        shiftDate: record.shifts!.date,
        startTime: record.shifts!.start_time,
        endTime: record.shifts!.end_time,
        address: record.shifts!.events!.address,
        checkInTime: record.check_in_time,
        checkInLat: record.location_lat,
        checkInLng: record.location_lng,
        checkOutTime: record.check_out_time,
        checkOutLat: record.location_lat,
        checkOutLng: record.location_lng,
        workedHours: calculateWorkedHours(record.check_in_time!, record.check_out_time),
        status: getAttendanceStatus(record.shifts!.date, record.check_in_time, record.check_out_time),
        notes: record.notes
      }));

    if (records.length === 0) {
      toast({
        title: 'Attenzione',
        description: 'Nessun dato da esportare',
        variant: 'destructive'
      });
      return;
    }

    exportAttendanceToCSV(records, operatorName, {
      start: format(dateRange?.from || new Date(), 'yyyy-MM-dd'),
      end: format(dateRange?.to || new Date(), 'yyyy-MM-dd')
    });

    toast({
      title: 'Esportazione completata',
      description: `${records.length} record esportati in CSV`
    });
  };

  const handleQuickFilter = (days: number) => {
    setDateRange({
      from: subDays(new Date(), days),
      to: new Date()
    });
  };

  const summary = calculateSummary();

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Registro Presenze
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualizza e gestisci il tuo storico presenze
          </p>
        </div>
        <Button 
          onClick={handleExportCSV} 
          variant="default"
          disabled={filteredData.length === 0}
        >
          <Download className="h-4 w-4 mr-2" />
          Esporta CSV
        </Button>
      </div>

      <AttendanceSummary {...summary} />

      <AttendanceFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onQuickFilter={handleQuickFilter}
      />

      {filteredData.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nessuna presenza trovata</h3>
          <p className="text-muted-foreground">
            Non ci sono presenze registrate per il periodo selezionato
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredData.map(record => {
            if (!record.shifts?.events) return null;

            return (
              <AttendanceCard
                key={record.id}
                eventTitle={record.shifts.events.title}
                clientName={record.shifts.events.clients?.name || 'N/A'}
                brandName={record.shifts.events.brands?.name || 'N/A'}
                shiftDate={record.shifts.date}
                startTime={record.shifts.start_time}
                endTime={record.shifts.end_time}
                address={record.shifts.events.address}
                checkInTime={record.check_in_time}
                checkInLat={record.location_lat}
                checkInLng={record.location_lng}
                checkOutTime={record.check_out_time}
                checkOutLat={record.location_lat}
                checkOutLng={record.location_lng}
                notes={record.notes}
                status={getAttendanceStatus(
                  record.shifts.date,
                  record.check_in_time,
                  record.check_out_time
                )}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
