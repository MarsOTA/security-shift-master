import React, { useEffect, useMemo, useState } from "react";
import {
  MapPin,
  Phone,
  Clock,
  Calendar,
  User,
  Navigation,
  CheckCircle2,
  LogIn,
  LogOut,
  Send,
  AlertTriangle,
  WifiOff,
  NotebookText,
  Users,
  Stamp,
} from "lucide-react";

// --- Helpers
function classNames(...cn: (string | false | null | undefined)[]) {
  return cn.filter(Boolean).join(" ");
}

type ShiftState =
  | "scheduled" // fuori finestra
  | "window_open" // finestra check-in aperta
  | "on_duty" // in turno
  | "offline_pending" // check-in/out in coda
  | "closed"; // turno chiuso

export default function OperatorShiftView() {
  // Mock data (puoi collegare poi a backend)
  const event = {
    id: "EV-2025-10-01-MIL-045",
    day: "01/10/2025",
    start: "19:00",
    end: "22:00",
    duration: "3h",
    address: "via Padova 10, Milano",
    coords: { lat: 45.5013, lng: 9.2352 },
    notes:
      "Accesso da cancello laterale. Dress code: black. Contattare portineria se il varco è chiuso.",
    windowOpenMinutesBefore: 15,
    windowCloseMinutesAfter: 30,
  };

  const referente = {
    name: "Rino Baldini",
    role: "Referente evento",
    phone: "+39 339 4930201",
    whatsapp: "393394930201",
  };

  const colleagues = [
    { name: "Marcello", surname: "Landini", phone: "334920202", role: "Addetto", status: "pending" },
    { name: "Rino", surname: "Gaetano", phone: "3340303001", role: "Caposquadra", status: "checked_in" },
  ];

  // --- State machine demo
  const [state, setState] = useState<ShiftState>("window_open");
  const [offline, setOffline] = useState(false);

  // Countdown demo (finto, basato sull'orario start)
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const startAt = useMemo(() => {
    const d = new Date();
    const [h, m] = event.start.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  }, [event.start]);

  const endAt = useMemo(() => {
    const d = new Date();
    const [h, m] = event.end.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  }, [event.end]);

  const timeToStartMs = startAt.getTime() - now.getTime();
  const timeToEndMs = endAt.getTime() - now.getTime();

  function fmt(ms: number) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  // Actions
  const [lastPunch, setLastPunch] = useState<string | null>(null);

  function doCheckIn() {
    if (offline) {
      setState("offline_pending");
      setLastPunch(`Check-in in coda • ${new Date().toLocaleTimeString()}`);
      return;
    }
    setState("on_duty");
    setLastPunch(`Check-in effettuato alle ${new Date().toLocaleTimeString()}`);
  }

  function doCheckOut() {
    if (offline) {
      setState("offline_pending");
      setLastPunch(`Check-out in coda • ${new Date().toLocaleTimeString()}`);
      return;
    }
    setState("closed");
    setLastPunch(`Check-out effettuato alle ${new Date().toLocaleTimeString()}`);
  }

  // UI helpers
  const stateBadge = {
    scheduled: { label: "Non in turno", color: "bg-gray-100 text-gray-800" },
    window_open: { label: "Finestra check-in aperta", color: "bg-amber-100 text-amber-800" },
    on_duty: { label: "In turno", color: "bg-emerald-100 text-emerald-800" },
    offline_pending: { label: "In attesa di invio", color: "bg-blue-100 text-blue-800" },
    closed: { label: "Turno concluso", color: "bg-slate-200 text-slate-800" },
  }[state];

  const canCheckIn = state === "window_open";
  const canCheckOut = state === "on_duty";

  return (
    <div className="w-full min-h-screen bg-zinc-50 text-zinc-900 flex justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <header className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Security Operator</h1>
            <p className="text-sm text-zinc-600">Le tue attività di oggi</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={classNames("px-2 py-1 rounded-full text-xs font-medium", stateBadge.color)}>
              {stateBadge.label}
            </span>
          </div>
        </header>

        {/* Alerts */}
        {state === "offline_pending" && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 mb-3">
            <WifiOff className="w-5 h-5 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Timbratura in coda</p>
              <p className="text-xs text-zinc-600">Sei offline. L'evento verrà inviato automaticamente appena torna la rete.</p>
            </div>
          </div>
        )}

        {state === "window_open" && timeToStartMs > 0 && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-3">
            <AlertTriangle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Check-in disponibile</p>
              <p className="text-xs text-zinc-600">La finestra è aperta. Inizio turno tra {fmt(timeToStartMs)}.</p>
            </div>
          </div>
        )}

        {state === "on_duty" && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 mb-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Sei in turno</p>
              <p className="text-xs text-zinc-600">Tempo rimanente: {fmt(timeToEndMs)}</p>
            </div>
          </div>
        )}

        {/* Sticky Action Bar (primary CTA spostato in alto) */}
        <section className="sticky top-0 z-40 -mx-4 px-4 pt-2 pb-3 bg-zinc-50/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-50/60">
          <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl p-2">
            <div className="grid grid-cols-1 gap-2">
              {canCheckIn && (
                <button
                  onClick={doCheckIn}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-black text-white text-base font-medium active:scale-[.99]"
                >
                  <LogIn className="w-5 h-5" /> Check-in
                </button>
              )}
              {canCheckOut && (
                <button
                  onClick={doCheckOut}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 bg-black text-white text-base font-medium active:scale-[.99]"
                >
                  <LogOut className="w-5 h-5" /> Check-out
                </button>
              )}
              {lastPunch && (
                <p className="text-xs text-zinc-500 text-center">{lastPunch}</p>
              )}
            </div>
          </div>
        </section>

        {/* Event Card */}
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 mb-4">
          <div className="flex items-center gap-2 text-zinc-700">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Giorno</span>
            <span className="text-sm ml-auto">{event.day}</span>
          </div>
          <div className="h-px bg-zinc-100 my-3" />
          <div className="flex items-center gap-2 text-zinc-700">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Orario</span>
            <span className="text-sm ml-auto">
              {event.start} – {event.end} <span className="text-zinc-400">({event.duration})</span>
            </span>
          </div>
          <div className="h-px bg-zinc-100 my-3" />
          <div className="flex items-center gap-2 text-zinc-700">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">Luogo</span>
            <div className="ml-auto text-right">
              <p className="text-sm">{event.address}</p>
              <div className="mt-2 flex justify-end gap-2">
                <a
                  className="text-xs px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
                  target="_blank"
                >
                  Apri in Mappe
                </a>
                <a
                  className="text-xs px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center gap-1"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(event.address)}`}
                  target="_blank"
                >
                  <Navigation className="w-3 h-3" />
                  Naviga
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Note operative — box separato */}
        {event.notes && (
          <section className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 mb-4">
            <div className="flex items-center gap-2 text-zinc-700 mb-2">
            <NotebookText className="w-4 h-4" />
            <span className="text-sm font-medium">Note operative</span>
          </div>
            <p className="text-sm text-zinc-600 mt-1">{event.notes}</p>
          </section>
        )}

        {/* Referente */}
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 mb-4">
          <div className="flex items-center gap-2 text-zinc-700 mb-2">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Referente dell'evento</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{referente.name}</p>
              <p className="text-xs text-zinc-500">{referente.role}</p>
            </div>
            <div className="flex items-center gap-2">
              <a className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-sm flex items-center gap-2" href={`tel:${referente.phone}`}>
                <Phone className="w-4 h-4" /> Chiama
              </a>
              <a
                className="px-3 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-sm"
                href={`https://wa.me/${referente.whatsapp}`}
                target="_blank"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* Colleghi */}
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 mb-4">
          <div className="flex items-center gap-2 text-zinc-700 mb-2">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">Colleghi evento</span>
        </div>
          <ul className="divide-y divide-zinc-100">
            {colleagues.map((c, i) => (
              <li key={i} className="py-2 flex items-center">
                <div>
                  <p className="font-medium">{c.name} {c.surname}</p>
                  <p className="text-xs text-zinc-500">{c.role}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span
                    className={classNames(
                      "text-xs px-2 py-1 rounded-full",
                      c.status === "checked_in" && "bg-emerald-100 text-emerald-700",
                      c.status === "pending" && "bg-zinc-100 text-zinc-700"
                    )}
                  >
                    {c.status === "checked_in" ? "check-in ok" : "in attesa"}
                  </span>
                  <a className="text-xs px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200" href={`tel:${c.phone}`}>
                    Chiama
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Timbrature & informazioni */}
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 mb-4">
          <div className="flex items-center gap-2 text-zinc-700">
          <Stamp className="w-4 h-4" />
          <span className="text-sm font-medium">Timbrature</span>
        </div>
          <p className="text-sm text-zinc-600 mt-1">Il pulsante principale è sempre in alto. Qui trovi lo storico e le note.</p>
          <ul className="mt-3 list-disc pl-5 text-sm text-zinc-700">
            {lastPunch ? (
              <li>{lastPunch}</li>
            ) : (
              <li>Nessuna timbratura effettuata.</li>
            )}
          </ul>
        </section>

        {/* Developer tools (solo per demo) */}
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Sandbox stati (rimuovere in produzione)</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["scheduled", "window_open", "on_duty", "offline_pending", "closed"] as ShiftState[]).map((s) => (
              <button
                key={s}
                className={classNames(
                  "px-3 py-1.5 rounded-xl text-sm border",
                  state === s ? "bg-black text-white border-black" : "bg-zinc-50 text-zinc-700 border-zinc-200"
                )}
                onClick={() => setState(s)}
              >
                {s}
              </button>
            ))}
            <button
              className={classNames(
                "px-3 py-1.5 rounded-xl text-sm border",
                offline ? "bg-amber-100 border-amber-300" : "bg-zinc-50 border-zinc-200"
              )}
              onClick={() => setOffline((v) => !v)}
            >
              {offline ? "Offline ON" : "Offline OFF"}
            </button>
          </div>
        </section>

        <footer className="py-8 text-center text-xs text-zinc-400">
          v0.1 — UI mockup per validazione funzionale
        </footer>
      </div>
    </div>
  );
}
