import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const FormSchema = z.object({
  clientId: z.string().min(1, "Seleziona un cliente"),
  brandId: z.string().min(1, "Seleziona un brand"),
  address: z.string().min(3, "Inserisci un indirizzo valido"),
  startDate: z.string().min(1, "Seleziona data di inizio"),
  endDate: z.string().min(1, "Seleziona data di fine"),
});

type FormValues = z.infer<typeof FormSchema>;

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateEventModal = ({ open, onOpenChange }: CreateEventModalProps) => {
  const navigate = useNavigate();
  const clients = useAppStore((s) => s.clients);
  const brands = useAppStore((s) => s.brands);
  const createEvent = useAppStore((s) => s.createEvent);
  const createTask = useAppStore((s) => s.createTask);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { clientId: "", brandId: "", address: "", startDate: "", endDate: "" },
  });

  const onSubmit = (values: FormValues) => {
    const clientName = clients.find((c) => c.id === values.clientId)?.name || "Cliente";
    const brandName = brands.find((b) => b.id === values.brandId)?.name || "Brand";
    const title = `${brandName} - ${clientName}`;
    const ev = createEvent({ 
      title, 
      clientId: values.clientId, 
      brandId: values.brandId, 
      address: values.address,
      startDate: values.startDate,
      endDate: values.endDate 
    });

    toast({ title: "Evento creato", description: `${title} salvato correttamente` });
    onOpenChange(false);
    form.reset();
    navigate(`/events/${ev.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crea evento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select onValueChange={(v) => form.setValue("clientId", v)}>
                <SelectTrigger aria-label="Cliente">
                  <SelectValue placeholder="Seleziona cliente" />
                </SelectTrigger>
                <SelectContent className="pointer-events-auto">
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.clientId && (
                <p className="text-sm text-destructive">{form.formState.errors.clientId.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Brand</Label>
              <Select onValueChange={(v) => form.setValue("brandId", v)}>
                <SelectTrigger aria-label="Brand">
                  <SelectValue placeholder="Seleziona brand" />
                </SelectTrigger>
                <SelectContent className="pointer-events-auto">
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.brandId && (
                <p className="text-sm text-destructive">{form.formState.errors.brandId.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Indirizzo</Label>
            <Input
              placeholder="Via Roma 1, Milano"
              {...form.register("address")}
            />
            {form.formState.errors.address && (
              <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Inizio Evento</Label>
              <Input
                type="date"
                {...form.register("startDate")}
              />
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data Fine Evento</Label>
              <Input
                type="date"
                {...form.register("endDate")}
              />
              {form.formState.errors.endDate && (
                <p className="text-sm text-destructive">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>


          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button type="submit">Salva evento</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;