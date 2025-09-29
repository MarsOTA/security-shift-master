import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { useAppStore, ACTIVITY_TYPES, type ActivityType } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Users, Crown, UserPlus, Plus, Trash2, Edit2, Save, X, FileText, ArrowUpDown, ArrowUp, ArrowDown, ListChecks, Clock, Building2, MapPin, Calendar, Badge, Copy, Phone, StickyNote, Lock, Unlock, User, NotebookPen, Pencil } from "lucide-react";
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

  const handleDuplicateShift = (shift: any) => {
    // Get actual times from slot overrides or default shift times
    const slotKey = `${shift.id}-${shift.slotIndex}`;
    const actualStartTime = slotTimes[slotKey]?.startTime || shift.startTime;
    const actualEndTime = slotTimes[slotKey]?.endTime || shift.endTime;
    
    createShift({
      eventId: event.id,
      date: shift.date,
      startTime: actualStartTime,
      endTime: actualEndTime,
      operatorIds: [""], // No operator assigned to duplicate
      activityType: shift.activityType,
      requiredOperators: 1,
      notes: undefined // Don't copy notes
    });
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

      {/* Two column layout */}
      <div className="grid grid-cols-5 gap-8 mb-8">
        {/* Left column - Event info (60%) */}
        <div className="col-span-3">
          <div className="space-y-6">
            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 mt-0.5 text-[#72AD97] flex-shrink-0" />
              <div className="flex-1">
                {editingField === 'address' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempValues.address || ''}
                      onChange={(e) => setTempValues({ ...tempValues, address: e.target.value })}
                      className="flex-1 border-0 border-b border-border rounded-none focus:border-[#72AD97] bg-transparent"
                      autoFocus
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleSaveField('address')}>
                      <Save className="h-4 w-4 text-[#72AD97]" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 text-[#72AD97]" />
                    </Button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-2">
                    <span className="text-foreground">{event.address || 'Indirizzo non specificato'}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleStartEdit('address', event.address)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                    >
                      <Edit2 className="h-4 w-4 text-[#72AD97]" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Date range */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 mt-0.5 text-[#72AD97] flex-shrink-0" />
              <span className="text-foreground">{formatDateRange()}</span>
            </div>

            {/* Activity code */}
            <div className="flex items-start gap-3">
              <Badge className="h-5 w-5 mt-0.5 text-[#72AD97] flex-shrink-0" />
              <div className="flex-1">
                {editingField === 'activityCode' ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tempValues.activityCode || ''}
                      onChange={(e) => setTempValues({ ...tempValues, activityCode: e.target.value })}
                      className="flex-1 border-0 border-b border-border rounded-none focus:border-[#72AD97] bg-transparent"
                      autoFocus
                    />
                    <Button variant="ghost" size="sm" onClick={() => handleSaveField('activityCode')}>
                      <Save className="h-4 w-4 text-[#72AD97]" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 text-[#72AD97]" />
                    </Button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-2">
                    <span className="text-foreground">{event.activityCode || 'Codice attività non specificato'}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleStartEdit('activityCode', event.activityCode)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                    >
                      <Edit2 className="h-4 w-4 text-[#72AD97]" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Phone number */}
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 mt-0.5 text-[#72AD97] flex-shrink-0" />
              <span className="text-foreground">N°Telefono non specificato</span>
            </div>

            {/* Contact person */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 mt-0.5 text-[#72AD97] flex-shrink-0" />
              <span className="text-foreground">Referente per l'evento non specificato</span>
            </div>

            {/* Notes */}
            <div className="flex items-start gap-3">
              <NotebookPen className="h-5 w-5 mt-0.5 text-[#72AD97] flex-shrink-0" />
              <div className="flex-1">
                {editingField === 'notes' ? (
                  <div className="space-y-2">
                    <Textarea
                      value={tempValues.notes || ''}
                      onChange={(e) => setTempValues({ ...tempValues, notes: e.target.value })}
                      className="min-h-[80px] border-0 border-b border-border rounded-none focus:border-[#72AD97] bg-transparent resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleSaveField('notes')}>
                        <Save className="h-4 w-4 text-[#72AD97]" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                        <X className="h-4 w-4 text-[#72AD97]" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="group">
                    <div className="flex items-start gap-2">
                      <span className="text-foreground flex-1">{event.notes || 'Nessuna nota specificata'}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleStartEdit('notes', event.notes)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto flex-shrink-0"
                      >
                        <Edit2 className="h-4 w-4 text-[#72AD97]" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Shift planning form (40%) */}
        <div className="col-span-2">
          <Card className="p-6 bg-[#F0F8F5] border-[#E0F0EA]">
            <h2 className="text-lg font-bold mb-6 text-[#5A9B7A]">Inserimento turno</h2>
            
            <form className="space-y-4">
              {/* Data inizio turno */}
              <div>
                <Input
                  type="date"
                  placeholder="Data inizio turno"
                  className="w-full h-11"
                />
              </div>

              {/* Ora inizio e Ora fine */}
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="time"
                  placeholder="Ora inizio"
                  className="h-11"
                />
                <Input
                  type="time"
                  placeholder="Ora fine"
                  className="h-11"
                />
              </div>

              {/* N° operatori */}
              <div>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="N° operatori"
                  className="w-full h-11"
                  defaultValue="1"
                />
              </div>

              {/* Mansione */}
              <div>
                <Select>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Mansione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="steward">Steward</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="hostess">Hostess</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo evento */}
              <div>
                <Select>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Tipo evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Note per turno */}
              <div>
                <Textarea
                  placeholder="Note per turno..."
                  className="min-h-[60px] resize-none"
                />
              </div>

              {/* Submit button */}
              <Button 
                type="button"
                className="w-full h-12 bg-[#72AD97] hover:bg-[#5A9B7A] text-white font-medium"
              >
                AGGIUNGI TURNO
              </Button>
            </form>
          </Card>
        </div>
      </div>

      {/* Table section */}
      <section>
        <h2 className="text-xl font-bold mb-6 text-foreground">LISTA TURNI EVENTO</h2>
        
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="text-xs font-medium text-muted-foreground">Data turno</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Ora inizio</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Ora fine</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Mansione</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Turno tipo</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Operatore</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Pausa h.</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Turno h.</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">TL</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Note</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedShifts.map((shift, index) => {
                const rowKey = `${shift.id}-${shift.slotIndex}`;
                const isRowEdit = rowEdit[rowKey];
                const actualStartTime = slotTimes[rowKey]?.startTime || shift.startTime;
                const actualEndTime = slotTimes[rowKey]?.endTime || shift.endTime;
                const actualPauseHours = pauseHours[rowKey] || shifts.find(s => s.id === shift.id)?.pauseHours || 0;
                const hours = calculateHours(actualStartTime, actualEndTime, actualPauseHours);
                
                return (
                  <TableRow 
                    key={rowKey} 
                    className={cn(
                      "border-b",
                      !shift.isAssigned && "bg-yellow-50 border-yellow-200"
                    )}
                    data-unassigned={!shift.isAssigned ? "true" : "false"}
                  >
                    {/* Data turno */}
                    <TableCell className="text-sm">
                      {formatDateToDDMMYY(shift.date)}
                    </TableCell>
                    
                    {/* Ora inizio */}
                    <TableCell className="text-sm">
                      {isRowEdit ? (
                        <Input
                          type="time"
                          value={slotTimes[rowKey]?.startTime || shift.startTime}
                          onChange={(e) => setSlotTimes(prev => ({
                            ...prev,
                            [rowKey]: { ...prev[rowKey], startTime: e.target.value }
                          }))}
                          className="w-24 h-8 text-xs"
                        />
                      ) : (
                        actualStartTime
                      )}
                    </TableCell>
                    
                    {/* Ora fine */}
                    <TableCell className="text-sm">
                      {isRowEdit ? (
                        <Input
                          type="time"
                          value={slotTimes[rowKey]?.endTime || shift.endTime}
                          onChange={(e) => setSlotTimes(prev => ({
                            ...prev,
                            [rowKey]: { ...prev[rowKey], endTime: e.target.value }
                          }))}
                          className="w-24 h-8 text-xs"
                        />
                      ) : (
                        actualEndTime
                      )}
                    </TableCell>
                    
                    {/* Mansione */}
                    <TableCell className="text-sm">
                      {isRowEdit ? (
                        <Select value="" onValueChange={() => {}}>
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue placeholder="Mansione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="steward">Steward</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="hostess">Hostess</SelectItem>
                            <SelectItem value="supervisor">Supervisor</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    
                    {/* Turno tipo */}
                    <TableCell className="text-sm">
                      {isRowEdit ? (
                        <Select value={shift.activityType || ""} onValueChange={(value) => updateShiftActivityType(shift.id, value as ActivityType)}>
                          <SelectTrigger className="w-32 h-8 text-xs">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        shift.activityType || "-"
                      )}
                    </TableCell>
                    
                    {/* Operatore */}
                    <TableCell className="text-sm">
                      {shift.isAssigned ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCurrentShift(shift.id);
                            setCurrentSlotIndex(shift.slotIndex);
                            setAssignOpen(true);
                          }}
                          className="p-0 h-auto text-left justify-start"
                        >
                          {getOperatorName(shift.operatorId)}
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentShift(shift.id);
                            setCurrentSlotIndex(shift.slotIndex);
                            setAssignOpen(true);
                          }}
                          className="text-xs h-7"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Assegna
                        </Button>
                      )}
                    </TableCell>
                    
                    {/* Pausa h. */}
                    <TableCell className="text-sm">
                      {isRowEdit ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={pauseHours[rowKey] || 0}
                          onChange={(e) => setPauseHours(prev => ({
                            ...prev,
                            [rowKey]: parseFloat(e.target.value) || 0
                          }))}
                          className="w-20 h-8 text-xs"
                        />
                      ) : (
                        actualPauseHours.toFixed(1)
                      )}
                    </TableCell>
                    
                    {/* Turno h. */}
                    <TableCell className="text-sm font-medium">
                      {hours}
                    </TableCell>
                    
                    {/* TL */}
                    <TableCell className="text-sm">
                      {shift.isAssigned && (
                        <Checkbox
                          checked={shifts.find(s => s.id === shift.id)?.teamLeaderId === shift.operatorId}
                          onCheckedChange={() => handleToggleTeamLeader(
                            shift.id, 
                            shift.operatorId, 
                            shifts.find(s => s.id === shift.id)?.teamLeaderId === shift.operatorId
                          )}
                        />
                      )}
                    </TableCell>
                    
                    {/* Note */}
                    <TableCell className="text-sm">
                      <Popover 
                        open={notePopoverOpen[rowKey] || false}
                        onOpenChange={(open) => setNotePopoverOpen(prev => ({ ...prev, [rowKey]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-1 h-auto">
                            <StickyNote className="h-4 w-4 text-[#72AD97]" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Aggiungi nota..."
                              value={editingNotes === rowKey ? tempNotes : slotNotes[rowKey] || ""}
                              onChange={(e) => {
                                if (editingNotes !== rowKey) {
                                  setEditingNotes(rowKey);
                                  setTempNotes(e.target.value);
                                } else {
                                  setTempNotes(e.target.value);
                                }
                              }}
                              className="min-h-[80px] resize-none"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelEditNotes(rowKey)}
                              >
                                Annulla
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleSaveNotes(rowKey)}
                                className="bg-[#72AD97] hover:bg-[#5A9B7A]"
                              >
                                Salva
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                    
                    {/* Azioni */}
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setRowEdit(prev => ({ ...prev, [rowKey]: !prev[rowKey] }))}
                                className="p-1 h-auto"
                              >
                                {isRowEdit ? (
                                  <Unlock className="h-4 w-4 text-[#72AD97]" />
                                ) : (
                                  <Lock className="h-4 w-4 text-[#72AD97]" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{isRowEdit ? "Blocca modifiche" : "Abilita modifiche"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDuplicateShift(shift)}
                                className="p-1 h-auto"
                              >
                                <Copy className="h-4 w-4 text-[#72AD97]" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Duplica turno</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteShift(shift.id)}
                                className="p-1 h-auto"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
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
          </Table>

          {/* Footer with totals */}
          <div className="border-t bg-muted/30 p-4">
            <div className="flex justify-between text-sm font-medium">
              <span>Totale ore fatturate: {totalHours.toFixed(1)}</span>
              <span>Totale ore assegnate: {totalAssignedHours.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dialogs */}
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
            <p>Vuoi inviare una email di notifica turno all'operatore selezionato?</p>
            {selectedShiftForEmail && (
              <div className="bg-muted/50 p-4 rounded-md space-y-2">
                <p><strong>Operatore:</strong> {selectedShiftForEmail.isAssigned ? getOperatorName(selectedShiftForEmail.operatorId) : 'Non assegnato'}</p>
                <p><strong>Data:</strong> {formatDateToDDMMYY(selectedShiftForEmail.date)}</p>
                <p><strong>Orario:</strong> {selectedShiftForEmail.startTime} - {selectedShiftForEmail.endTime}</p>
                <p><strong>Attività:</strong> {selectedShiftForEmail.activityType}</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEmailModalOpen(false)}>
                Annulla
              </Button>
              <Button onClick={confirmSendEmail} className="bg-[#72AD97] hover:bg-[#5A9B7A]">
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