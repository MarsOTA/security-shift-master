import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAppStore, ACTIVITY_TYPES, type ActivityType } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Users, Crown, UserPlus, Plus, Trash2, Edit2, Save, X, FileText, ArrowUpDown, ArrowUp, ArrowDown, ListChecks, Clock } from "lucide-react";
import OperatorAssignDialog from "@/components/events/OperatorAssignDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { TimePicker } from "@/components/ui/time-picker";
const EventDetail = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const event = useAppStore(s => s.getEventById(id!));
  const clients = useAppStore(s => s.clients);
  const brands = useAppStore(s => s.brands);
  const operators = useAppStore(s => s.operators);
  const createShift = useAppStore(s => s.createShift);
  const assignOperators = useAppStore(s => s.assignOperators);
  const setOperatorSlot = useAppStore(s => s.setOperatorSlot);
  const removeOperator = useAppStore(s => s.removeOperator);
  const updateEventAddress = useAppStore(s => s.updateEventAddress);
  const updateEventActivityCode = useAppStore(s => s.updateEventActivityCode);
  const setTeamLeader = useAppStore(s => s.setTeamLeader);
  const updateShiftNotes = useAppStore(s => s.updateShiftNotes);
  const updateShiftTime = useAppStore(s => s.updateShiftTime);
  const updateShiftActivityType = useAppStore(s => s.updateShiftActivityType);
  const deleteShift = useAppStore(s => s.deleteShift);
  
  // State for individual row time editing - each row has its own independent times
  const [rowTimes, setRowTimes] = useState<{[key: string]: {startTime: string, endTime: string}}>({});
  const [editingTimes, setEditingTimes] = useState<string | null>(null);
  const shifts = useAppStore(s => s.getShiftsByEvent(id!));
  const clientName = useMemo(() => clients.find(c => c.id === event?.clientId)?.name, [clients, event]);
  const brandName = useMemo(() => brands.find(b => b.id === event?.brandId)?.name, [brands, event]);
  const [date, setDate] = useState<Date | undefined>();
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [activityType, setActivityType] = useState<ActivityType | "">("");
  const [numOperators, setNumOperators] = useState<number>(1);
  
  const [assignOpen, setAssignOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<string | null>(null);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");
  const [editingAddress, setEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(event?.address || "");
  const [activityCode, setActivityCode] = useState(event?.activityCode || "");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);
  if (!event) return <main className="container py-8">
      <p className="text-muted-foreground">Evento non trovato.</p>
    </main>;
  const onAssign = (selectedIds: string[]) => {
    if (currentShift && currentSlotIndex !== null) {
      // Assegnare operatore a slot specifico di turno esistente
      if (selectedIds.length > 0) {
        setOperatorSlot(currentShift, currentSlotIndex, selectedIds[0]);
      }
    } else if (!currentShift) {
      // Creare nuovo turno con operatori assegnati
      if (!date || !start || !end || numOperators <= 0) return;
      const d = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      
      // Create shift with proper operator assignments
      const operatorSlots = Array(numOperators).fill("");
      selectedIds.forEach((operatorId, index) => {
        if (index < numOperators) {
          operatorSlots[index] = operatorId;
        }
      });
      
      createShift({
        eventId: event.id,
        date: d,
        startTime: start,
        endTime: end,
        operatorIds: operatorSlots,
        activityType: (activityType || undefined) as any,
        requiredOperators: numOperators,
        notes: notes || undefined
      });
    }
    setAssignOpen(false);
    setCurrentShift(null);
    setCurrentSlotIndex(null);
    if (!currentShift) {
      setNotes("");
      setDate(undefined);
      setStart("");
      setEnd("");
      setActivityType("");
      setNumOperators(1);
    }
  };
  const handleSaveAddress = () => {
    updateEventAddress(event.id, tempAddress);
    setEditingAddress(false);
  };
  const handleCancelEditAddress = () => {
    setTempAddress(event?.address || "");
    setEditingAddress(false);
  };
  const getOperatorName = (id: string) => operators.find(o => o.id === id)?.name || id;
  const handleSaveNotes = (shiftId: string) => {
    updateShiftNotes(shiftId, tempNotes);
    setEditingNotes(null);
  };
  const handleCancelEditNotes = () => {
    setTempNotes("");
    setEditingNotes(null);
  };
  const handleToggleTeamLeader = (shiftId: string, operatorId: string, isCurrentLeader: boolean) => {
    if (isCurrentLeader) {
      // Remove team leader
      setTeamLeader(shiftId, "");
    } else {
      // Set as team leader
      setTeamLeader(shiftId, operatorId);
    }
  };

  // Ordinamento tabella turni
  const [sort, setSort] = useState<{ key: 'date' | 'startTime' | 'endTime'; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'asc' });
  const toggleSort = (key: 'date' | 'startTime' | 'endTime') =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const sortedShifts = useMemo(() => {
    const arr = [...shifts];
    arr.sort((a, b) => {
      let va = '', vb = '';
      if (sort.key === 'date') { va = a.date; vb = b.date; }
      if (sort.key === 'startTime') { va = a.startTime; vb = b.startTime; }
      if (sort.key === 'endTime') { va = a.endTime; vb = b.endTime; }
      const comp = va.localeCompare(vb);
      return sort.dir === 'asc' ? comp : -comp;
    });
    return arr;
  }, [shifts, sort]);

  return <main className="container py-8">
      <Helmet>
        <title>{event.title} | Evento</title>
        <meta name="description" content={`Dettaglio evento ${event.title}. Pianifica turni e assegna operatori.`} />
        <link rel="canonical" href={`/events/${event.id}`} />
      </Helmet>

      {/* Event info at top left, dashboards side by side */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <h1 className="font-semibold mb-2 text-4xl">{event.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-muted-foreground">Indirizzo:</span>
            {editingAddress ? <div className="flex items-center gap-2">
                <Input value={tempAddress} onChange={e => setTempAddress(e.target.value)} className="max-w-md" placeholder="Inserisci indirizzo evento" />
                <Button size="sm" variant="ghost" onClick={handleSaveAddress}>
                  <Save className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEditAddress}>
                  <X className="h-4 w-4" />
                </Button>
              </div> : <div className="flex items-center gap-2">
                <span>{event.address || "Non specificato"}</span>
                <Button size="sm" variant="ghost" onClick={() => setEditingAddress(true)} aria-label="Modifica indirizzo">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-muted-foreground">Codice attività:</span>
            <Input 
              placeholder="Inserisci codice attività" 
              className="w-32" 
              value={activityCode}
              onChange={(e) => {
                setActivityCode(e.target.value);
                updateEventActivityCode(event.id, e.target.value);
              }}
            />
          </div>
          
          {/* Note turno moved here */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-muted-foreground">Note turno:</span>
            {notes ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">{notes.length > 50 ? notes.slice(0, 50) + "..." : notes}</span>
                <Button size="sm" variant="ghost" onClick={() => setNotesOpen(true)} aria-label="Modifica note turno">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setNotesOpen(true)} aria-label="Aggiungi note turno">
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border p-6 max-w-5xl">
            <h2 className="text-lg font-medium mb-6">Pianifica Turno</h2>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end mb-6">
              <div className="space-y-2">
                <Label>Data turno</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={date ? "outline" : "outline"} className={cn("justify-start font-normal", !date && "text-muted-foreground")}>
                      <CalendarIcon />
                      {date ? date.toLocaleDateString() : <span>Seleziona data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Ora inizio</Label>
                <TimePicker value={start} onChange={setStart} />
              </div>
              <div className="space-y-2">
                <Label>Ora fine</Label>
                <TimePicker value={end} onChange={setEnd} />
              </div>
              <div className="space-y-2">
                <Label>Tipologia attività</Label>
                <Select value={activityType} onValueChange={v => setActivityType(v as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleziona tipologia" />
                  </SelectTrigger>
                  <SelectContent className="pointer-events-auto">
                    {ACTIVITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>N° operatori</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="20" 
                  value={numOperators} 
                  onChange={e => setNumOperators(parseInt(e.target.value) || 1)} 
                />
              </div>
              <div className="flex md:justify-end">
                <Button onClick={() => onAssign([])} className="w-full md:w-auto" variant="default">
                  <Plus className="h-4 w-4" />
                  Aggiungi
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="font-bold text-2xl">
            {event.startDate && event.endDate ? 
              `Turni evento dal ${event.startDate.split("-").reverse().join("/")} al ${event.endDate.split("-").reverse().join("/")}` :
              "Turni evento"
            }
          </h2>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('date')} className="px-0">
                    <span className="mr-2">Data</span>
                    {sort.key !== 'date' ? <ArrowUpDown className="h-4 w-4 text-muted-foreground" /> : (sort.dir === 'asc' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> : <ArrowDown className="h-4 w-4 text-muted-foreground" />)}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('startTime')} className="px-0">
                    <span className="mr-2">Ora Inizio</span>
                    {sort.key !== 'startTime' ? <ArrowUpDown className="h-4 w-4 text-muted-foreground" /> : (sort.dir === 'asc' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> : <ArrowDown className="h-4 w-4 text-muted-foreground" />)}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => toggleSort('endTime')} className="px-0">
                    <span className="mr-2">Ora Fine</span>
                    {sort.key !== 'endTime' ? <ArrowUpDown className="h-4 w-4 text-muted-foreground" /> : (sort.dir === 'asc' ? <ArrowUp className="h-4 w-4 text-muted-foreground" /> : <ArrowDown className="h-4 w-4 text-muted-foreground" />)}
                  </Button>
                </TableHead>
                <TableHead>Tipologia Attività</TableHead>
                <TableHead>Operatore</TableHead>
                <TableHead>TL</TableHead>
                <TableHead>Note</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedShifts.map(s => {
                // Only show rows for assigned operators (non-empty operatorIds)
                const assignedOperators = s.operatorIds.filter(id => id && id.trim() !== "");
                
                // Count assigned operators for this shift (real count from actual data)
                const assignedOperatorsCount = assignedOperators.length;
                
                // If no operators assigned, show one empty row for the shift
                if (assignedOperators.length === 0) {
                  return (
                    <TableRow 
                      key={`${s.id}-empty`}
                      id={`turn-${s.id}`}
                      className="even:bg-muted transition-all duration-300 hover:bg-muted/80"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{`${s.date.split("-").reverse().join("/")}`}</span>
                          <span className="operator-count text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            0/{s.requiredOperators}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <input
                          type="time"
                          value={s.startTime}
                          readOnly
                          className="px-3 py-1 border border-input rounded text-sm bg-background"
                        />
                      </TableCell>
                      <TableCell>
                        <input
                          type="time"
                          value={s.endTime}
                          readOnly
                          className="px-3 py-1 border border-input rounded text-sm bg-background"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-2 rounded">
                          {s.activityType || "Non specificato"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setCurrentShift(s.id);
                            setCurrentSlotIndex(0);
                            setAssignOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                          Assegna
                        </Button>
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        {editingNotes === s.id ? (
                          <div className="flex items-center gap-2">
                            <Textarea
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              className="min-h-[60px] max-w-md"
                              placeholder="Inserisci note per il turno"
                            />
                            <div className="flex flex-col gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleSaveNotes(s.id)}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={handleCancelEditNotes}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{s.notes || "Nessuna nota"}</span>
                            <Button size="sm" variant="ghost" onClick={() => {
                              setEditingNotes(s.id);
                              setTempNotes(s.notes || "");
                            }}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteShift(s.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }
                
                return assignedOperators.map((operatorId, operatorIndex) => {
                  // Find the actual slot index for this operator in the shift
                  const originalSlotIndex = s.operatorIds.findIndex(id => id === operatorId);
                  const assignmentId = `${s.id}-${originalSlotIndex}`;
                  const rowKey = assignmentId;
                  // Each row has independent times, fallback to shift times if not set
                  const currentStartTime = rowTimes[rowKey]?.startTime ?? s.startTime;
                  const currentEndTime = rowTimes[rowKey]?.endTime ?? s.endTime;
                  const hasUncoveredHours = !operatorId || (operatorId && currentEndTime < s.endTime);
                  
                  return (
                  <TableRow 
                    key={`${s.id}-slot-${originalSlotIndex}`}
                    data-child-id={assignmentId}
                    data-parent-id={s.id}
                    id={`turn-${s.id}`}
                    className={cn(
                      "even:bg-muted transition-all duration-300",
                      hasUncoveredHours && "bg-orange-50 hover:bg-orange-100",
                      "hover:bg-muted/80"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{`${s.date.split("-").reverse().join("/")}`}</span>
                        {operatorIndex === 0 && (
                          <span className="operator-count text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                            {assignedOperatorsCount}/{s.requiredOperators}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <input
                        type="time"
                        value={currentStartTime}
                        onChange={(e) => {
                          setRowTimes(prev => ({
                            ...prev,
                            [rowKey]: { ...prev[rowKey], startTime: e.target.value, endTime: currentEndTime }
                          }));
                        }}
                        className="px-3 py-1 border border-input rounded text-sm bg-background"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="time"
                        value={currentEndTime}
                        onChange={(e) => {
                          setRowTimes(prev => ({
                            ...prev,
                            [rowKey]: { ...prev[rowKey], startTime: currentStartTime, endTime: e.target.value }
                          }));
                        }}
                        className="px-3 py-1 border border-input rounded text-sm bg-background"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-2 rounded">
                        {s.activityType || "Non specificato"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {operatorId ? getOperatorName(operatorId) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setCurrentShift(s.id);
                            setCurrentSlotIndex(originalSlotIndex);
                            setAssignOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      {operatorId ? (
                        <Checkbox 
                          checked={s.teamLeaderId === operatorId} 
                          onCheckedChange={() => handleToggleTeamLeader(s.id, operatorId, s.teamLeaderId === operatorId)} 
                          className="bg-[transparent72AD97] bg-[#72ad97]" 
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.notes ? <Button variant="ghost" size="sm" onClick={() => {
                        setEditingNotes(s.id);
                        setTempNotes(s.notes || "");
                      }}>
                          <FileText className="h-4 w-4" />
                        </Button> : <span className="text-muted-foreground">-</span>}
                    </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-2">
                          {operatorId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCurrentShift(s.id);
                                setCurrentSlotIndex(originalSlotIndex);
                                setAssignOpen(true);
                              }}
                              className="h-8 w-8 p-0"
                              aria-label={`Riassegna operatore per slot ${originalSlotIndex + 1}`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          )}
                          {operatorId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const rowElement = document.querySelector(`[data-child-id="${assignmentId}"]`) as HTMLElement;
                                
                                if (rowElement) {
                                  // Add fade-out animation
                                  rowElement.style.opacity = "0";
                                  rowElement.style.transform = "translateY(-10px)";
                                  rowElement.style.transition = "all 0.3s ease-out";
                                  
                                  setTimeout(() => {
                                    // Remove this specific operator assignment (only this slot)
                                    setOperatorSlot(s.id, originalSlotIndex, "");
                                    
                                    // Check if the shift becomes completely empty after removal
                                    setTimeout(() => {
                                      const currentShift = shifts.find(shift => shift.id === s.id);
                                      if (currentShift) {
                                        const hasAssignedOperators = currentShift.operatorIds.some(id => id && id.trim() !== "");
                                        if (!hasAssignedOperators) {
                                          // Delete the entire shift if no operators remain
                                          deleteShift(s.id);
                                         } else {
                                           // Update operator count in remaining rows for this shift
                                           setTimeout(() => {
                                             const remainingRows = document.querySelectorAll(`[data-parent-id="${s.id}"] .operator-count`);
                                             const newCount = currentShift.operatorIds.filter(id => id && id.trim() !== "").length;
                                             remainingRows.forEach(countEl => {
                                               countEl.textContent = `${newCount}/${s.requiredOperators}`;
                                             });
                                           }, 100);
                                         }
                                      }
                                    }, 50);
                                  }, 300);
                                }
                              }}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              aria-label={`Rimuovi operatore da slot ${originalSlotIndex + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          
                        </div>
                      </TableCell>
                  </TableRow>
                  );
                });
              })}
              {sortedShifts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nessun turno pianificato. Crea il primo turno.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Dialog per modificare note */}
      <Dialog open={!!editingNotes} onOpenChange={() => setEditingNotes(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Note Turno</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea value={tempNotes} onChange={e => setTempNotes(e.target.value)} placeholder="Inserisci note per il turno" rows={4} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelEditNotes}>
                Annulla
              </Button>
              <Button onClick={() => editingNotes && handleSaveNotes(editingNotes)}>
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog per note turno generali */}
      <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{notes ? "Modifica Note Turno" : "Aggiungi Note Turno"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Inserisci note per il turno (opzionale)" 
              rows={4} 
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNotesOpen(false)}>
                Annulla
              </Button>
              <Button onClick={() => setNotesOpen(false)}>
                Salva
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <OperatorAssignDialog open={assignOpen} onOpenChange={setAssignOpen} operators={currentShift ? operators.filter(op => !shifts.find(s => s.id === currentShift)?.operatorIds.includes(op.id)) : operators} onConfirm={onAssign} />
    </main>;
};
export default EventDetail;