import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Operator } from "@/store/appStore";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  operators: Operator[];
  onConfirm: (selectedIds: string[]) => void;
}

const OperatorAssignDialog = ({ open, onOpenChange, operators, onConfirm }: Props) => {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return operators.filter((o) =>
      o.name.toLowerCase().includes(q) || o.role.toLowerCase().includes(q)
    );
  }, [operators, query]);

  const toggleOperator = (id: string) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(opId => opId !== id)
        : [...prev, id]
    );
  };

const confirm = () => {
  onConfirm(selected);
  setSelected([]);
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assegna operatori</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Cerca operatore per nome o ruolo"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">✓</TableHead>
                  <TableHead>Nome Operatore</TableHead>
                  <TableHead>Ruolo</TableHead>
                  <TableHead>Disponibilità</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Opzione "Non assegnato" */}
                <TableRow 
                  className={cn(
                    "cursor-pointer hover:bg-muted/80 transition-colors",
                    selected.length === 0 && "bg-primary/10 border-l-4 border-l-primary"
                  )}
                  onClick={() => setSelected([])}
                >
                  <TableCell>
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                      selected.length === 0 ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {selected.length === 0 && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground">Non assegnato</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                </TableRow>
                {filtered.map((op, idx) => (
                  <TableRow 
                    key={op.id} 
                    className={cn(
                      "cursor-pointer hover:bg-muted/80 transition-colors",
                      selected.includes(op.id) && "bg-primary/10 border-l-4 border-l-primary"
                    )}
                    onClick={() => toggleOperator(op.id)}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selected.includes(op.id)}
                        onCheckedChange={() => toggleOperator(op.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{op.name}</TableCell>
                    <TableCell>{op.role}</TableCell>
                    <TableCell>{op.availability}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">
                      Nessun operatore trovato.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Annulla</Button>
            <Button onClick={confirm}>Assegna selezionati</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OperatorAssignDialog;
