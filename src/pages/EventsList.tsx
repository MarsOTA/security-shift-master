import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import CreateEventModal from "@/components/events/CreateEventModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { Shift } from "@/store/appStore";
import EventsDateFilter from "@/components/events/EventsDateFilter";

const calcEffectiveHours = (start: string, end: string, pauseHours: number = 0): number => {
  try {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    let diff = (endMin - startMin) / 60;
    if (diff < 0) diff = 0;
    return Math.max(0, diff - pauseHours);
  } catch {
    return 0;
  }
};

const safeItDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("it-IT");
  } catch {
    return iso;
  }
};

const formatDateHeader = (dateStr: string): string => {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = d.toLocaleDateString("it-IT", { weekday: "long" });
    const day = d.getDate();
    const month = d.toLocaleDateString("it-IT", { month: "long" });
    const year = d.getFullYear();
    return `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} ${day} ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  } catch {
    return dateStr;
  }
};

const EventsList = () => {
  const navigate = useNavigate();
  const events = useAppStore((s) => s.events);
  const brands = useAppStore((s) => s.brands);
  const clients = useAppStore((s) => s.clients);
  const operators = useAppStore((s) => s.operators);
  const getShiftsByEvent = useAppStore((s) => s.getShiftsByEvent);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });

  const dayData = useMemo(() => {
    // Step 1: Estrarre tutti i turni con le loro date e eventi
    const allShiftsWithEvents = events.flatMap((ev) => {
      const client = clients.find((c) => c.id === ev.clientId)?.name || "";
      const brand = brands.find((b) => b.id === ev.brandId)?.name || "";
      const committente = client && brand ? `${client} - ${brand}` : client || brand || "—";
      const shifts = getShiftsByEvent(ev.id);
      
      return shifts.map((shift) => ({
        shift,
        event: {
          id: ev.id,
          title: ev.title,
          committente,
        },
        date: shift.date,
      }));
    });

    // Step 2: Raggruppare per data
    const shiftsByDate = allShiftsWithEvents.reduce((acc, item) => {
      if (!acc[item.date]) acc[item.date] = [];
      acc[item.date].push(item);
      return acc;
    }, {} as Record<string, typeof allShiftsWithEvents>);

    // Step 3: Raggruppare per evento all'interno di ogni giorno
    const result = Object.entries(shiftsByDate).map(([date, items]) => {
      // Raggruppiamo per evento
      const eventGroups = items.reduce((acc, item) => {
        if (!acc[item.event.id]) {
          acc[item.event.id] = {
            event: item.event,
            shifts: [],
          };
        }
        acc[item.event.id].shifts.push(item.shift);
        return acc;
      }, {} as Record<string, { event: typeof items[0]["event"]; shifts: Shift[] }>);

      // Calcoliamo le statistiche per ogni evento nel giorno
      const eventsWithStats = Object.values(eventGroups).map((eventGroup) => {
        const shifts = eventGroup.shifts.sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        const totalOperators = shifts.reduce((sum, shift) => sum + shift.operatorIds.length, 0);
        const totalBilledHours = shifts.reduce((sum, shift) => {
          const hours = calcEffectiveHours(shift.startTime, shift.endTime, shift.pauseHours ?? 0);
          return sum + hours;
        }, 0);
        const totalAssignedHours = shifts.reduce((sum, shift) => {
          const hours = calcEffectiveHours(shift.startTime, shift.endTime, shift.pauseHours ?? 0);
          return sum + (hours * shift.operatorIds.length);
        }, 0);

        return {
          ...eventGroup.event,
          shifts,
          totalOperators,
          totalBilledHours: totalBilledHours.toFixed(2),
          totalAssignedHours: totalAssignedHours.toFixed(2),
        };
      });

      // Calcoliamo le statistiche totali per il giorno
      const totalEventsInDay = eventsWithStats.length;
      const totalOperatorsInDay = eventsWithStats.reduce((sum, ev) => sum + ev.totalOperators, 0);
      const totalBilledHoursInDay = eventsWithStats.reduce((sum, ev) => sum + parseFloat(ev.totalBilledHours), 0);

      return {
        date,
        dateFormatted: formatDateHeader(date),
        events: eventsWithStats,
        totalEvents: totalEventsInDay,
        totalOperators: totalOperatorsInDay,
        totalBilledHours: totalBilledHoursInDay.toFixed(2),
      };
    }).sort((a, b) => a.date.localeCompare(b.date)); // Ordine cronologico

    return result;
  }, [events, brands, clients, getShiftsByEvent]);

  // Filtra i dati per data
  const filteredDayData = useMemo(() => {
    if (!dateFilter.startDate && !dateFilter.endDate) {
      return dayData;
    }

    return dayData.filter((day) => {
      const dayDate = new Date(day.date + "T00:00:00");

      if (dateFilter.startDate && !dateFilter.endDate) {
        return dayDate >= dateFilter.startDate;
      }

      if (!dateFilter.startDate && dateFilter.endDate) {
        return dayDate <= dateFilter.endDate;
      }

      return (
        dateFilter.startDate &&
        dateFilter.endDate &&
        dayDate >= dateFilter.startDate &&
        dayDate <= dateFilter.endDate
      );
    });
  }, [dayData, dateFilter]);

  return (
    <main className="container py-8">
      <Helmet>
        <title>Lista Eventi | Gestionale Sicurezza</title>
        <meta name="description" content="Elenco eventi con cliente e data. Crea e gestisci eventi dell'agenzia di sicurezza." />
        <link rel="canonical" href="/events" />
      </Helmet>

      <section className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Lista Eventi</h1>
          {(dateFilter.startDate || dateFilter.endDate) && (
            <Badge variant="secondary" className="gap-1">
              <CalendarIcon className="h-3 w-3" />
              Filtrato
            </Badge>
          )}
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus />
          Crea evento
        </Button>
      </section>

      <EventsDateFilter
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
      />

      {filteredDayData.length === 0 ? (
        <section className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          {dateFilter.startDate || dateFilter.endDate
            ? "Nessun evento trovato per le date selezionate."
            : "Nessun evento programmato. Crea il primo evento."}
        </section>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {filteredDayData.map((day) => (
            <AccordionItem 
              key={day.date} 
              value={day.date} 
              className="rounded-lg border-2 border-primary/20 overflow-hidden"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline bg-primary/5 hover:bg-primary/10 transition-colors [&[data-state=open]]:bg-primary/15">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full pr-2">
                  <div className="font-semibold text-base flex-1 text-left">
                    📅 {day.dateFormatted}
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="whitespace-nowrap">
                      <span className="font-medium text-foreground">{day.totalEvents}</span> {day.totalEvents === 1 ? "evento" : "eventi"}
                    </span>
                    <span className="whitespace-nowrap">
                      <span className="font-medium text-foreground">{day.totalOperators}</span> {day.totalOperators === 1 ? "operatore" : "operatori"}
                    </span>
                    <span className="whitespace-nowrap">
                      <span className="font-medium text-foreground">{day.totalBilledHours}</span> ore fatt.
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 pt-2 bg-background">
                <Accordion type="multiple" className="space-y-2">
                  {day.events.map((ev) => (
                    <AccordionItem 
                      key={ev.id} 
                      value={ev.id} 
                      className="rounded-lg border border-border overflow-hidden"
                    >
                      <AccordionTrigger className="px-4 py-2 hover:no-underline bg-accent/30 hover:bg-accent/50 transition-colors [&[data-state=open]]:bg-accent">
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 w-full items-center text-sm pr-2">
                          <div className="font-medium text-left truncate">{ev.title}</div>
                          <div className="w-48 text-left text-muted-foreground truncate">{ev.committente}</div>
                          <div className="w-24 text-center">{ev.totalOperators}</div>
                          <div className="w-24 text-center">{ev.totalBilledHours}</div>
                          <div className="w-24 text-center">{ev.totalAssignedHours}</div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-2">
                        {ev.shifts.length === 0 ? (
                          <div className="text-sm text-muted-foreground py-4 text-center">
                            Nessun turno per questo evento.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-md border">
                            <table className="w-full text-sm">
                              <thead className="bg-muted">
                                <tr className="[&>th]:px-3 [&>th]:py-2 text-left">
                                  <th>Data</th>
                                  <th>Ora inizio</th>
                                  <th>Ora fine</th>
                                  <th>Tipologia attività</th>
                                  <th>Mansione</th>
                                  <th>Operatore</th>
                                  <th className="text-center">Ore pausa</th>
                                  <th className="text-right">Ore eff.</th>
                                </tr>
                              </thead>
                              <tbody>
                                {ev.shifts.flatMap((shift) => {
                                  const isUnassigned = shift.operatorIds.length === 0;
                                  const effectiveHours = calcEffectiveHours(shift.startTime, shift.endTime, shift.pauseHours ?? 0);
                                  
                                  if (isUnassigned) {
                                    return (
                                      <tr 
                                        key={shift.id} 
                                        className="[&>td]:px-3 [&>td]:py-2 border-t transition-colors bg-orange-100 hover:bg-orange-200"
                                      >
                                        <td className="whitespace-nowrap">{safeItDate(shift.date)}</td>
                                        <td className="whitespace-nowrap">{shift.startTime}</td>
                                        <td className="whitespace-nowrap">{shift.endTime}</td>
                                        <td className="whitespace-nowrap">{shift.activityType ?? "—"}</td>
                                        <td className="whitespace-nowrap">{shift.role ?? "—"}</td>
                                        <td className="font-semibold text-orange-800">
                                          <span className="text-xs text-orange-600">(non assegnato)</span>
                                        </td>
                                        <td className="text-center">{shift.pauseHours ?? 0}</td>
                                        <td className="text-right">{effectiveHours.toFixed(2)}</td>
                                      </tr>
                                    );
                                  }
                                  
                                  return shift.operatorIds.map((operatorId) => {
                                    const operatorName = operators.find(op => op.id === operatorId)?.name || "—";
                                    return (
                                      <tr 
                                        key={`${shift.id}-${operatorId}`} 
                                        className="[&>td]:px-3 [&>td]:py-2 border-t transition-colors hover:bg-muted/50"
                                      >
                                        <td className="whitespace-nowrap">{safeItDate(shift.date)}</td>
                                        <td className="whitespace-nowrap">{shift.startTime}</td>
                                        <td className="whitespace-nowrap">{shift.endTime}</td>
                                        <td className="whitespace-nowrap">{shift.activityType ?? "—"}</td>
                                        <td className="whitespace-nowrap">{shift.role ?? "—"}</td>
                                        <td>{operatorName}</td>
                                        <td className="text-center">{shift.pauseHours ?? 0}</td>
                                        <td className="text-right">{effectiveHours.toFixed(2)}</td>
                                      </tr>
                                    );
                                  });
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                        <div className="mt-3 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/events/${ev.id}`)}
                          >
                            Vedi dettagli evento
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
      
      <CreateEventModal 
        open={createModalOpen} 
        onOpenChange={setCreateModalOpen} 
      />
    </main>
  );
};

export default EventsList;
