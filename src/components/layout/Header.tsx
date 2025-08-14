import { Link, useLocation } from "react-router-dom";
import { Shield, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Header = () => {
  const { pathname } = useLocation();
  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="text-primary" />
          <span className="font-semibold">SecureOps</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            to="/events"
            className={cn(
              "text-sm transition-colors hover:text-primary",
              isActive("/events") ? "text-primary" : "text-muted-foreground"
            )}
          >
            Eventi
          </Link>
          <Button asChild variant="soft">
            <Link to="/events/new" className="inline-flex items-center gap-2">
              <Plus />
              Crea evento
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
