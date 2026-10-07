import { CheckCircle2, CloudOff, Loader2, Menu, X } from 'lucide-react';

import { ThemeToggle } from '@/components/shared/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useInventory } from '@/state/use-inventory';

interface TopbarProps {
  onToggleMobileNav: () => void;
  isMobileNavOpen: boolean;
}

export function Topbar({ onToggleMobileNav, isMobileNavOpen }: TopbarProps) {
  const { persistenceStatus, storageError, retrySave } = useInventory();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-card/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onToggleMobileNav}
          aria-label={isMobileNavOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <h1 className="text-base font-semibold text-foreground sm:text-lg">
          Inventory Management System
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {persistenceStatus === 'pending' && (
          <Badge variant="secondary" className="flex items-center gap-1.5 py-1">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span className="hidden sm:inline">Saving changes...</span>
          </Badge>
        )}

        {persistenceStatus === 'saved' && (
          <Badge variant="success" className="hidden items-center gap-1.5 py-1 sm:flex">
            <CheckCircle2 className="h-3 w-3" />
            <span>Saved to storage</span>
          </Badge>
        )}

        {persistenceStatus === 'error' && (
          <div className="flex items-center gap-2">
            <Badge
              variant="destructive"
              className="flex items-center gap-1.5 py-1"
              title={storageError?.message}
            >
              <CloudOff className="h-3 w-3" />
              <span>Storage Error</span>
            </Badge>
            <Button variant="outline" size="sm" onClick={retrySave} className="h-7 text-xs">
              Retry
            </Button>
          </div>
        )}

        <ThemeToggle />
      </div>
    </header>
  );
}
