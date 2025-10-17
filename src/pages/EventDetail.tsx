import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { useAppStore, ACTIVITY_TYPES, type ActivityType } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Users, Crown, UserPlus, Plus, Trash2, Edit2, Save, X, FileText, ArrowUpDown, ArrowUp, ArrowDown, ListChecks, Clock, Building2, MapPin, Calendar, Badge, Phone, StickyNote, Lock, Unlock, User, NotebookPen, Pencil } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import OperatorDetailsDialog from "@/components/events/OperatorDetailsDialog";
import OperatorAssignDialog from "@/components/events/OperatorAssignDialog";
import ShiftPlanningForm from "@/components/events/ShiftPlanningForm";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn, formatDateToDDMMYY, parseDateFromDDMMYY } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { NotificationService } from "@/services/notificationService";
import { Card } from "@/components/ui/card";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const event = useAppStore(s => s.getEventById(id!));
  const clients = useAppStore(s => s.clients);
  const brands = useAppStore(s => s.brands);
  const operators = useAppStore(s => s.operators);
  const createShift = useAppStore(s => s.createShift);
  const assignOperators = useAppStore(s => s.assignOperators);
  const setOperatorSlot = useAppStore(s => s.setOperatorSlot);
  const removeOperator = useAppStore(s => s.removeOperator);
  const updateEvent = useAppStore(s => s.updateEvent);
  const setTeamLeader = useAppStore(s => s.setTeamLeader);
  const updateShiftNotes = useAppStore(s => s.updateShiftNotes);
  const updateShiftTime = useAppStore(s => s.updateShiftTime);
  const updateShiftDate = useAppStore(s => s.updateShiftDate);
  const updateShiftActivityType = useAppStore(s => s.updateShiftActivityType);
  const updateShiftPauseHours = useAppStore(s => s.updateShiftPauseHours);
  const updateShiftRole = useAppStore(s => s.updateShiftRole);
  const deleteShift = useAppStore(s => s.deleteShift);
  
  const shifts = useAppStore(s => s.getShiftsByEvent(id!));
  
  const [assignOpen, setAssignOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState<string | null>(null);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [slotTimes, setSlotTimes] = useState<Record<string, { startTime: string; endTime: string }>>({});
  const [editingPhones, setEditingPhones] = useState<Record<string, string>>({});
  const [slotNotes, setSlotNotes] = useState<Record<string, string>>({});
  const [pauseHours, setPauseHours] = useState<Record<string, number>>({});
  
  // Initialize row edit state: unassigned rows start in edit mode
  const initializeRowEdit = (shifts: any[]) => {
    const initialState: Record<string, boolean> = {};
    shifts.forEach(shift => {
      shift.operatorIds.forEach((operatorId: any, slotIndex: number) => {
        const rowKey = `${shift.id}-${slotIndex}`;
        const isAssigned = operatorId && operatorId.trim() !== "";
        initialState[rowKey] = !isAssigned; // Unassigned rows start in edit mode
      });
    });
    return initialState;
  };

  // Initialize rowEdit state - unassigned operators start in edit mode
  const [rowEdit, setRowEdit] = useState<Record<string, boolean>>(() => initializeRowEdit(shifts));

  // Update rowEdit when new shifts are added (ensure unassigned ones start in edit mode)
  useEffect(() => {
    const newRowEdit = initializeRowEdit(shifts);
    setRowEdit(prev => {
      // Only update new rows that don't exist in current state
      const updated = { ...prev };
      Object.keys(newRowEdit).forEach(key => {
        if (!(key in updated)) {
          updated[key] = newRowEdit[key];
        }
      });
      return updated;
    });
  }, [shifts.length]); // Only trigger when shifts array length changes (new shifts added)
  
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedShiftForEmail, setSelectedShiftForEmail] = useState<any>(null);
  const [operatorDetailsOpen, setOperatorDetailsOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<any>(null);
  const [notePopoverOpen, setNotePopoverOpen] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // Inline editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  const handleStartEdit = (field: string, currentValue: any) => {
    setEditingField(field);
    setTempValues({ ...tempValues, [field]: currentValue });
  };

  const handleSaveField = (field: string) => {
    const value = tempValues[field];
    if (field === 'address') {
      updateEvent(event.id, { address: value });
    } else if (field === 'startDate') {
      // Convert DD/MM/YY to YYYY-MM-DD for storage
      const isoDate = parseDateFromDDMMYY(value);
      updateEvent(event.id, { startDate: isoDate });
    } else if (field === 'endDate') {
      // Convert DD/MM/YY to YYYY-MM-DD for storage
      const isoDate = parseDateFromDDMMYY(value);
      updateEvent(event.id, { endDate: isoDate });
    } else if (field === 'activityCode') {
      updateEvent(event.id, { activityCode: value });
    } else if (field === 'notes') {
      updateEvent(event.id, { notes: value });
    }
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValues({});
  };

  const handleStartTitleEdit = () => {
    setIsEditingTitle(true);
    setTempTitle(event.title);
  };

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      updateEvent(event.id, { title: tempTitle.trim() });
    }
    setIsEditingTitle(false);
    setTempTitle("");
  };

  const handleCancelTitleEdit = () => {
    setIsEditingTitle(false);
    setTempTitle("");
  };

  if (!event) return (
    <main className="container py-8">
      <p className="text-muted-foreground">Evento non trovato.</p>
    </main>
  );

  const handleShiftSubmit = (values: any) => {
    const d = `${values.date.getFullYear()}-${String(values.date.getMonth() + 1).padStart(2, "0")}-${String(values.date.getDate()).padStart(2, "0")}`;
    
    // Crea array di slot vuoti per il numero di operatori specificato
    const operatorIds = Array(values.numOperators).fill("");
    
    createShift({
      eventId: event.id,
      date: d,
      startTime: values.startTime,
      endTime: values.endTime,
      operatorIds: operatorIds,
      activityType: values.activityType as ActivityType,
      role: values.role,
      requiredOperators: values.numOperators,
      notes: values.notes || undefined
    });
  };

  const onAssign = (selectedIds: string[]) => {
    if (currentShift && currentSlotIndex !== null) {
      const shift = shifts.find(s => s.id === currentShift);
      const previousOperatorId = shift?.operatorIds[currentSlotIndex] || "";
      
      if (selectedIds.length === 0 || selectedIds[0] === "") {
        setOperatorSlot(currentShift, currentSlotIndex, "");
        // No notification needed for removal
      } else {
        const newOperatorId = selectedIds[0];
        setOperatorSlot(currentShift, currentSlotIndex, newOperatorId);
        
        // Send notification to newly assigned operator
        if (newOperatorId !== previousOperatorId && newOperatorId) {
          const store = useAppStore.getState();
          const notificationService = new NotificationService(store);
          notificationService.sendShiftAssignmentNotification(newOperatorId, currentShift);
        }
      }
    }
    setAssignOpen(false);
    setCurrentShift(null);
    setCurrentSlotIndex(null);
  };

  const getOperatorName = (id: string) => {
    const operator = operators.find(o => o.id === id);
    if (!operator) return id;
    
    // Convert "Nome Cognome" to "Cognome Nome" format
    const nameParts = operator.name.split(' ');
    if (nameParts.length >= 2) {
      const firstName = nameParts.slice(0, -1).join(' ');
      const lastName = nameParts[nameParts.length - 1];
      return `${lastName} ${firstName}`;
    }
    return operator.name;
  };

  const getOperatorPhone = (id: string) => {
    const operator = operators.find(o => o.id === id);
    return operator?.phone || "-";
  };

  const calculateHours = (startTime: string, endTime: string, pauseHours: number = 0) => {
    const start = new Date(`2000-01-01T${startTime}`);
    let end = new Date(`2000-01-01T${endTime}`);
    
    // Handle overnight shifts (e.g., 20:00 to 03:00)
    if (end.getTime() < start.getTime()) {
      end = new Date(`2000-01-02T${endTime}`); // Add one day to end time
    }
    
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const effectiveHours = Math.max(0, hours - pauseHours);
    return effectiveHours.toFixed(1);
  };

  const handleSaveNotes = (noteKey: string) => {
    if (noteKey.includes('-')) {
      // It's a slot-specific note
      setSlotNotes(prev => ({ ...prev, [noteKey]: tempNotes }));
    } else {
      // It's a shift note
      updateShiftNotes(noteKey, tempNotes);
    }
    setEditingNotes(null);
    setTempNotes("");
    // Close the popover
    setNotePopoverOpen(prev => ({ ...prev, [noteKey]: false }));
  };

  const handleCancelEditNotes = (noteKey?: string) => {
    setTempNotes("");
    setEditingNotes(null);
    // Close the popover if noteKey is provided
    if (noteKey) {
      setNotePopoverOpen(prev => ({ ...prev, [noteKey]: false }));
    }
  };

  const handleToggleTeamLeader = (shiftId: string, operatorId: string, isCurrentLeader: boolean) => {
    if (isCurrentLeader) {
      setTeamLeader(shiftId, "");
    } else {
      setTeamLeader(shiftId, operatorId);
    }
  };

  const handleSendEmail = (shift: any) => {
    setSelectedShiftForEmail(shift);
    setEmailModalOpen(true);
  };

  const confirmSendEmail = () => {
    if (selectedShiftForEmail && selectedShiftForEmail.isAssigned) {
      const operatorName = getOperatorName(selectedShiftForEmail.operatorId);
      const slotKey = `${selectedShiftForEmail.id}-${selectedShiftForEmail.slotIndex}`;
      const actualStartTime = slotTimes[slotKey]?.startTime || selectedShiftForEmail.startTime;
      const actualEndTime = slotTimes[slotKey]?.endTime || selectedShiftForEmail.endTime;
      
      // Simulate email sending (can be replaced with real email service integration)
      console.log("Invio email a:", {
        operatore: operatorName,
        data: selectedShiftForEmail.date,
        oraInizio: actualStartTime,
        oraFine: actualEndTime,
        attivita: selectedShiftForEmail.activityType,
        note: slotNotes[slotKey] || selectedShiftForEmail.notes || "Nessuna nota"
      });
      
      toast({
        title: "Email inviata!",
        description: `Email di notifica turno inviata a ${operatorName}`,
      });
      
      setEmailModalOpen(false);
      setSelectedShiftForEmail(null);
    }
  };

  // Ordinamento tabella turni per cognome operatore
  const [sort, setSort] = useState<{ key: 'date' | 'activityType' | 'operator' | 'startTime' | 'endTime' | 'hours'; dir: 'asc' | 'desc' }>({ key: 'date', dir: 'asc' });
  
  const toggleSort = (key: 'date' | 'activityType' | 'operator' | 'startTime' | 'endTime' | 'hours') =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  // Flatten shifts to individual rows for each operator
  const flattenedShifts = useMemo(() => {
    const rows: any[] = [];
    shifts.forEach(shift => {
      shift.operatorIds.forEach((operatorId, slotIndex) => {
        rows.push({
          ...shift,
          operatorId,
          slotIndex,
          isAssigned: operatorId && operatorId.trim() !== ""
        });
      });
    });
    return rows;
  }, [shifts]);

  const sortedShifts = useMemo(() => {
    const arr = [...flattenedShifts];
    arr.sort((a, b) => {
      let va = '', vb = '';
      if (sort.key === 'date') { va = a.date; vb = b.date; }
      if (sort.key === 'activityType') { va = a.activityType || ''; vb = b.activityType || ''; }
      if (sort.key === 'operator') { 
        va = a.isAssigned ? getOperatorName(a.operatorId) : '';
        vb = b.isAssigned ? getOperatorName(b.operatorId) : '';
      }
      if (sort.key === 'startTime') { va = a.startTime; vb = b.startTime; }
      if (sort.key === 'endTime') { va = a.endTime; vb = b.endTime; }
      if (sort.key === 'hours') { 
        va = calculateHours(a.startTime, a.endTime, shifts.find(s => s.id === a.id)?.pauseHours || 0);
        vb = calculateHours(b.startTime, b.endTime, shifts.find(s => s.id === b.id)?.pauseHours || 0);
      }
      const comp = va.localeCompare(vb);
      return sort.dir === 'asc' ? comp : -comp;
    });
    return arr;
  }, [flattenedShifts, sort, operators]);

  // Calculate totals
  const totalHours = useMemo(() => {
    return sortedShifts.reduce((total, row) => {
      const slotKey = `${row.id}-${row.slotIndex}`;
      const hours = parseFloat(calculateHours(
        slotTimes[slotKey]?.startTime || row.startTime,
        slotTimes[slotKey]?.endTime || row.endTime,
        pauseHours[slotKey] || shifts.find(s => s.id === row.id)?.pauseHours || 0
      ));
      return total + hours;
    }, 0);
  }, [sortedShifts, slotTimes, pauseHours]);

  const totalAssignedHours = useMemo(() => {
    return sortedShifts.reduce((total, row) => {
      if (row.isAssigned) {
        const slotKey = `${row.id}-${row.slotIndex}`;
        const hours = parseFloat(calculateHours(
          slotTimes[slotKey]?.startTime || row.startTime,
          slotTimes[slotKey]?.endTime || row.endTime,
          pauseHours[slotKey] || shifts.find(s => s.id === row.id)?.pauseHours || 0
        ));
        return total + hours;
      }
      return total;
    }, 0);
  }, [sortedShifts, slotTimes, pauseHours]);

  // Get client and brand info
  const client = clients.find(c => c.id === event.clientId);
  const brand = brands.find(b => b.id === event.brandId);

  // Format date range
  const formatDateRange = () => {
    if (!event.startDate) return "";
    
    const startFormatted = formatDateToDDMMYY(event.startDate);
    
    if (event.endDate && event.endDate !== event.startDate) {
      const endFormatted = formatDateToDDMMYY(event.endDate);
      return `dal ${startFormatted} al ${endFormatted}`;
    }
    
    return `il ${startFormatted}`;
  };

  return (
    <main className="container py-8 font-mulish">
      <Helmet>
        <title>{event.title} | Evento</title>
        <meta name="description" content={`Dettaglio evento ${event.title}. Pianifica turni e assegna operatori.`} />
        <link rel="canonical" href={`/events/${event.id}`} />
      </Helmet>

      {/* Title with hover edit */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="text-3xl font-bold h-12 border-0 border-b-2 border-primary rounded-none focus:border-primary bg-transparent text-[#72AD97]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') handleCancelTitleEdit();
                }}
              />
              <Button variant="ghost" size="sm" onClick={handleSaveTitle}>
                <Save className="h-4 w-4 text-[#72AD97]" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCancelTitleEdit}>
                <X className="h-4 w-4 text-[#72AD97]" />
              </Button>
            </div>
          ) : (
            <div className="group flex items-center gap-2 flex-1">
              <h1 className="text-3xl font-bold text-[#72AD97]">{event.title}</h1>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleStartTitleEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
              >
                <Pencil className="h-4 w-4 text-[#72AD97]" />
              </Button>
            </div>
          )}
          
          {/* Tags */}
          <div className="flex gap-2">
            {client && (
              <span className="px-3 py-1 bg-[#E8F5F0] text-[#72AD97] rounded-full text-sm font-medium">
                {client.name}
              </span>
            )}
            {brand && (
              <span className="px-3 py-1 bg-[#E8F5F0] text-[#72AD97] rounded-full text-sm font-medium">
                {brand.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Layout: Event Info (50%) and Shift Form (50%) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Event Info */}
        <Card className="p-6" style={{ backgroundColor: 'hsl(var(--info-background))' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5" style={{ color: 'hsl(var(--primary-green))' }} />
              <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--primary-green))' }}>Informazioni Evento</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (editingField) {
                  // Save all changes and exit edit mode
                  Object.keys(tempValues).forEach(field => {
                    if (field === 'address') {
                      updateEvent(event.id, { address: tempValues[field] });
                    } else if (field === 'startDate') {
                      const isoDate = parseDateFromDDMMYY(tempValues[field]);
                      updateEvent(event.id, { startDate: isoDate });
                    } else if (field === 'endDate') {
                      const isoDate = parseDateFromDDMMYY(tempValues[field]);
                      updateEvent(event.id, { endDate: isoDate });
                    } else if (field === 'activityCode') {
                      updateEvent(event.id, { activityCode: tempValues[field] });
                    } else if (field === 'notes') {
                      updateEvent(event.id, { notes: tempValues[field] });
                    }
                  });
                  setEditingField(null);
                  setTempValues({});
                } else {
                  // Enter edit mode and initialize values
                  setEditingField('global');
                  setTempValues({
                    activityCode: event.activityCode || "",
                    startDate: formatDateToDDMMYY(event.startDate || ""),
                    endDate: formatDateToDDMMYY(event.endDate || ""),
                    address: event.address || "",
                    notes: event.notes || ""
                  });
                }
              }}
              className="h-8 w-8 p-0"
            >
              {editingField ? (
                <Unlock className="h-4 w-4 text-green-600" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          
          <div className="space-y-4">
            {/* Activity Code field */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary-green))' }}>
                <MapPin className="h-4 w-4 text-white" />
              </div>
              <Label className="font-medium min-w-0 flex-shrink-0">Codice attività:</Label>
              {editingField ? (
                <Input
                  value={tempValues.activityCode || ""}
                  onChange={(e) => setTempValues({ ...tempValues, activityCode: e.target.value })}
                  className="flex-1"
                />
              ) : (
                <span className="text-muted-foreground">{event.activityCode || "Non specificato"}</span>
              )}
            </div>

            {/* Date field */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary-green))' }}>
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <Label className="font-medium min-w-0 flex-shrink-0">Periodo:</Label>
              {editingField ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={tempValues.startDate || ""}
                    onChange={(e) => setTempValues({ ...tempValues, startDate: e.target.value })}
                    placeholder="DD/MM/YY"
                    className="flex-1"
                  />
                  <span>-</span>
                  <Input
                    value={tempValues.endDate || ""}
                    onChange={(e) => setTempValues({ ...tempValues, endDate: e.target.value })}
                    placeholder="DD/MM/YY"
                    className="flex-1"
                  />
                </div>
              ) : (
                <span className="text-muted-foreground">{formatDateRange()}</span>
              )}
            </div>

            {/* Address field */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary-green))' }}>
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <Label className="font-medium min-w-0 flex-shrink-0">Indirizzo:</Label>
              {editingField ? (
                <Input
                  value={tempValues.address || ""}
                  onChange={(e) => setTempValues({ ...tempValues, address: e.target.value })}
                  className="flex-1"
                />
              ) : (
                <span className="text-muted-foreground">{event.address || "Non specificato"}</span>
              )}
            </div>

            {/* Referente evento field */}
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--primary-green))' }}>
                <Phone className="h-4 w-4 text-white" />
              </div>
              <Label className="font-medium min-w-0 flex-shrink-0">Referente evento:</Label>
              <span className="text-muted-foreground">
                {event.contactName || "Non specificato"}
                {event.contactName && event.contactPhone && ` - ${event.contactPhone}`}
              </span>
            </div>

            {/* Notes field */}
            <div className="flex items-start gap-2">
              <div className="h-6 w-6 rounded flex items-center justify-center mt-1" style={{ backgroundColor: 'hsl(var(--primary-green))' }}>
                <StickyNote className="h-4 w-4 text-white" />
              </div>
              <Label className="font-medium min-w-0 flex-shrink-0 mt-1">Note:</Label>
              {editingField ? (
                <Textarea
                  value={tempValues.notes || ""}
                  onChange={(e) => setTempValues({ ...tempValues, notes: e.target.value })}
                  className="flex-1 min-h-[60px]"
                />
              ) : (
                <span className="text-muted-foreground whitespace-pre-wrap">{event.notes || "Nessuna nota"}</span>
              )}
            </div>
          </div>
        </Card>

        {/* Shift Planning Form */}
        <div>
          <ShiftPlanningForm onSubmit={handleShiftSubmit} />
        </div>
      </div>
      
      {/* Divider */}
      <div className="border-t border-muted mb-6"></div>

      {/* Shifts Table */}
      <div className="space-y-6">
        {sortedShifts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nessun turno pianificato per questo evento.</p>
            <p className="text-sm mt-2">Utilizza il form sopra per aggiungere il primo turno.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader style={{ backgroundColor: 'hsl(var(--light-green-bg))' }}>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Data</span>
                      {sort.key === 'date' && (
                        sort.dir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                      {sort.key !== 'date' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => toggleSort('startTime')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Ora inizio</span>
                      {sort.key === 'startTime' && (
                        sort.dir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                      {sort.key !== 'startTime' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => toggleSort('endTime')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Ora fine</span>
                      {sort.key === 'endTime' && (
                        sort.dir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                      {sort.key !== 'endTime' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                   <TableHead 
                     className="cursor-pointer hover:bg-muted/50 select-none"
                     onClick={() => toggleSort('activityType')}
                   >
                     <div className="flex items-center gap-2">
                       <span>Tipologia</span>
                       {sort.key === 'activityType' && (
                         sort.dir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                       )}
                       {sort.key !== 'activityType' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                     </div>
                   </TableHead>
                   <TableHead>Mansione</TableHead>
                   <TableHead 
                     className="cursor-pointer hover:bg-muted/50 select-none"
                     onClick={() => toggleSort('operator')}
                   >
                     <div className="flex items-center gap-2">
                       <span>Operatore</span>
                       {sort.key === 'operator' && (
                         sort.dir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                       )}
                       {sort.key !== 'operator' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                     </div>
                   </TableHead>
                   <TableHead>Ore Pausa</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => toggleSort('hours')}
                  >
                    <div className="flex items-center gap-2">
                      <span>Ore</span>
                      {sort.key === 'hours' && (
                        sort.dir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      )}
                      {sort.key !== 'hours' && <ArrowUpDown className="h-4 w-4 opacity-50" />}
                    </div>
                  </TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedShifts.map((shift) => {
                  const slotKey = `${shift.id}-${shift.slotIndex}`;
                  const isEditing = rowEdit[slotKey] || false;
                  const slotStartTime = slotTimes[slotKey]?.startTime || shift.startTime;
                  const slotEndTime = slotTimes[slotKey]?.endTime || shift.endTime;
                  const slotPauseHours = pauseHours[slotKey] ?? shifts.find(s => s.id === shift.id)?.pauseHours ?? 0;
                  const calculatedHours = calculateHours(slotStartTime, slotEndTime, slotPauseHours);
                  const shiftTeamLeader = shifts.find(s => s.id === shift.id)?.teamLeaderId;
                  const isTeamLeader = shiftTeamLeader === shift.operatorId;
                  const currentSlotNote = slotNotes[slotKey] || shifts.find(s => s.id === shift.id)?.notes || "";
                  const hasUnassignedWarning = !shift.isAssigned;
                  const hasPhoneWarning = shift.isAssigned && getOperatorPhone(shift.operatorId) === "-";
                  
                  return (
                    <TableRow 
                      key={slotKey}
                      className={cn(
                        "transition-colors",
                        hasUnassignedWarning && "bg-orange-50 hover:bg-orange-100",
                        hasPhoneWarning && "bg-yellow-50 hover:bg-yellow-100"
                      )}
                    >
                      {/* Data */}
                      <TableCell className="whitespace-nowrap">
                        {isEditing ? (
                          <Input
                            type="date"
                            value={shift.date}
                            onChange={(e) => updateShiftDate(shift.id, e.target.value)}
                            className="h-8 w-32"
                          />
                        ) : (
                          new Date(shift.date).toLocaleDateString('it-IT')
                        )}
                      </TableCell>
                      
                      {/* Ora inizio */}
                      <TableCell className="whitespace-nowrap">
                        {isEditing ? (
                          <Input
                            type="time"
                            value={slotStartTime}
                            onChange={(e) => {
                              setSlotTimes(prev => ({
                                ...prev,
                                [slotKey]: { ...prev[slotKey], startTime: e.target.value }
                              }));
                              updateShiftTime(shift.id, { startTime: e.target.value });
                            }}
                            className="h-8 w-20"
                          />
                        ) : (
                          slotStartTime
                        )}
                      </TableCell>
                      
                      {/* Ora fine */}
                      <TableCell className="whitespace-nowrap">
                        {isEditing ? (
                          <Input
                            type="time"
                            value={slotEndTime}
                            onChange={(e) => {
                              setSlotTimes(prev => ({
                                ...prev,
                                [slotKey]: { ...prev[slotKey], endTime: e.target.value }
                              }));
                              updateShiftTime(shift.id, { endTime: e.target.value });
                            }}
                            className="h-8 w-20"
                          />
                        ) : (
                          slotEndTime
                        )}
                      </TableCell>
                      
                       {/* Tipologia */}
                       <TableCell className="whitespace-nowrap">
                         {isEditing ? (
                           <Select
                             value={shift.activityType || ""}
                             onValueChange={(value) => updateShiftActivityType(shift.id, value as ActivityType)}
                           >
                             <SelectTrigger className="h-8 w-32">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               {ACTIVITY_TYPES.map(type => (
                                 <SelectItem key={type} value={type}>{type}</SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         ) : (
                           shift.activityType || "-"
                         )}
                       </TableCell>

                       {/* Mansione */}
                       <TableCell className="whitespace-nowrap">
                         {isEditing ? (
                           <Select
                             value={shift.role || ""}
                             onValueChange={(value) => updateShiftRole && updateShiftRole(shift.id, value)}
                           >
                             <SelectTrigger className="h-8 w-32">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="Doorman">Doorman</SelectItem>
                               <SelectItem value="Security">Security</SelectItem>
                               <SelectItem value="Host">Host</SelectItem>
                               <SelectItem value="Supervisor">Supervisor</SelectItem>
                             </SelectContent>
                           </Select>
                         ) : (
                           shift.role || "-"
                         )}
                       </TableCell>
                       
                       {/* Operatore */}
                       <TableCell className={cn(
                         "whitespace-nowrap",
                         hasUnassignedWarning && "font-semibold text-orange-800"
                       )}>
                         <div className="flex items-center gap-2">
                           {shift.isAssigned ? (
                             <>
                               <span>{getOperatorName(shift.operatorId)}</span>
                               {isTeamLeader && (
                                 <Crown className="h-4 w-4 text-yellow-500" />
                               )}
                             </>
                           ) : (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 setCurrentShift(shift.id);
                                 setCurrentSlotIndex(shift.slotIndex);
                                 setAssignOpen(true);
                               }}
                               className="h-8 text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                             >
                               <UserPlus className="h-3 w-3 mr-1" />
                               Assegna operatore
                             </Button>
                           )}
                         </div>
                       </TableCell>
                       
                       {/* Ore Pausa */}
                       <TableCell className="whitespace-nowrap">
                         {isEditing ? (
                           <Input
                             type="number"
                             min="0"
                             max="24"
                             step="0.5"
                             value={slotPauseHours}
                             onChange={(e) => {
                               const value = parseFloat(e.target.value) || 0;
                               setPauseHours(prev => ({ ...prev, [slotKey]: value }));
                               updateShiftPauseHours(shift.id, value);
                             }}
                             className="h-8 w-16"
                           />
                         ) : (
                           slotPauseHours || "0"
                         )}
                       </TableCell>
                      
                      {/* Ore */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{calculatedHours}</span>
                          {isEditing && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Clock className="h-3 w-3" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-48">
                                <div className="space-y-2">
                                  <Label className="text-xs">Ore di pausa</Label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="24"
                                    step="0.5"
                                    value={slotPauseHours}
                                    onChange={(e) => {
                                      const value = parseFloat(e.target.value) || 0;
                                      setPauseHours(prev => ({ ...prev, [slotKey]: value }));
                                      updateShiftPauseHours(shift.id, value);
                                    }}
                                    className="h-8"
                                  />
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Note */}
                      <TableCell>
                        <Popover
                          open={notePopoverOpen[slotKey] || false}
                          onOpenChange={(open) => setNotePopoverOpen(prev => ({ ...prev, [slotKey]: open }))}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-8 w-8 p-0",
                                currentSlotNote && "text-primary"
                              )}
                            >
                              <StickyNote className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            {editingNotes === slotKey ? (
                              <div className="space-y-2">
                                <Label>Note turno</Label>
                                <Textarea
                                  value={tempNotes}
                                  onChange={(e) => setTempNotes(e.target.value)}
                                  className="min-h-[80px]"
                                  placeholder="Inserisci note per questo turno..."
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveNotes(slotKey)}>
                                    <Save className="h-4 w-4 mr-1" />
                                    Salva
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => handleCancelEditNotes(slotKey)}>
                                    Annulla
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Label>Note turno</Label>
                                <p className="text-sm text-muted-foreground min-h-[60px] whitespace-pre-wrap">
                                  {currentSlotNote || "Nessuna nota"}
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setEditingNotes(slotKey);
                                    setTempNotes(currentSlotNote);
                                  }}
                                >
                                  <Edit2 className="h-4 w-4 mr-1" />
                                  Modifica
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      
                      {/* Azioni */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider>
                            {/* Toggle edit mode */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setRowEdit(prev => ({ ...prev, [slotKey]: !prev[slotKey] }));
                                  }}
                                  className="h-8 w-8 p-0"
                                >
                                  {isEditing ? (
                                    <Unlock className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Lock className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{isEditing ? "Blocca modifica" : "Abilita modifica"}</p>
                              </TooltipContent>
                            </Tooltip>


                            {/* Team leader toggle (if assigned) */}
                            {shift.isAssigned && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleTeamLeader(shift.id, shift.operatorId, isTeamLeader)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Crown className={cn("h-4 w-4", isTeamLeader ? "text-yellow-500" : "text-muted-foreground")} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{isTeamLeader ? "Rimuovi team leader" : "Imposta come team leader"}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Send email (if assigned) */}
                            {shift.isAssigned && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSendEmail(shift)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Invia email</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Delete shift */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteShift(shift.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Elimina turno</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              
              {/* Table footer with totals */}
               <tfoot style={{ backgroundColor: 'hsl(var(--accent-light))' }}>
                 <TableRow>
                   <TableCell colSpan={7} className="text-right font-bold" style={{ color: 'hsl(var(--primary-green))' }}>
                     Totale ore fatturate:
                   </TableCell>
                   <TableCell className="font-bold" style={{ color: 'hsl(var(--primary-green))' }}>
                     {totalHours.toFixed(1)}
                   </TableCell>
                   <TableCell colSpan={2}></TableCell>
                 </TableRow>
                 <TableRow>
                   <TableCell colSpan={7} className="text-right font-bold" style={{ color: 'hsl(var(--primary-green))' }}>
                     Totale ore assegnate:
                   </TableCell>
                   <TableCell className="font-bold" style={{ color: 'hsl(var(--primary-green))' }}>
                     {totalAssignedHours.toFixed(1)}
                   </TableCell>
                   <TableCell colSpan={2}></TableCell>
                 </TableRow>
               </tfoot>
            </Table>
          </div>
        )}
      </div>

      {/* Dialogs and Modals */}
      <OperatorAssignDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        operators={operators}
        onConfirm={onAssign}
      />

      <OperatorDetailsDialog
        open={operatorDetailsOpen}
        onOpenChange={setOperatorDetailsOpen}
        operator={selectedOperator}
      />

      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conferma invio email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Confermi l'invio dell'email di notifica turno?</p>
            {selectedShiftForEmail && (
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Operatore:</strong> {selectedShiftForEmail.isAssigned ? getOperatorName(selectedShiftForEmail.operatorId) : "Non assegnato"}</p>
                <p><strong>Data:</strong> {new Date(selectedShiftForEmail.date).toLocaleDateString('it-IT')}</p>
                <p><strong>Orario:</strong> {selectedShiftForEmail.startTime} - {selectedShiftForEmail.endTime}</p>
                <p><strong>Attività:</strong> {selectedShiftForEmail.activityType}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEmailModalOpen(false)}>
                Annulla
              </Button>
              <Button onClick={confirmSendEmail}>
                Invia Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default EventDetail;