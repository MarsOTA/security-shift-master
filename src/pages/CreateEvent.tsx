import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const FormSchema = z.object({
  clientId: z.string().min(1, "Seleziona un cliente"),
  brandId: z.string().min(1, "Seleziona un brand"),
  address: z.string().min(3, "Inserisci un indirizzo valido"),
});

type FormValues = z.infer<typeof FormSchema>;

const CreateEvent = () => {
  const navigate = useNavigate();
  const clients = useAppStore((s) => s.clients);
  const brands = useAppStore((s) => s.brands);
  const createEvent = useAppStore((s) => s.createEvent);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { clientId: "", brandId: "", address: "" },
  });

  const onSubmit = (values: FormValues) => {
    const clientName = clients.find((c) => c.id === values.clientId)?.name || "Cliente";
    const brandName = brands.find((b) => b.id === values.brandId)?.name || "Brand";
    const title = `${brandName} - ${clientName}`;
    const ev = createEvent({ title, clientId: values.clientId, brandId: values.brandId, address: values.address });

    toast({ title: "Evento creato", description: `${title} salvato correttamente` });
    navigate(`/events/${ev.id}`);
  };

  return (
    <main className="container py-8">
      <Helmet>
        <title>Crea Evento | Gestionale Sicurezza</title>
        <meta name="description" content="Crea un nuovo evento selezionando cliente, brand e indirizzo." />
        <link rel="canonical" href="/events/new" />
      </Helmet>

      <section className="max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6">Crea evento</h1>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div className="pt-2">
            <Button type="submit">Salva evento</Button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default CreateEvent;
