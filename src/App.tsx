import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider, useI18n } from "@/lib/i18n";
import ErrorBoundary from "@/components/ErrorBoundary";
import { installGlobalErrorHandlers } from "@/lib/selfHealing";
import { useEffect, useState } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [updateReady, setUpdateReady] = useState(false);
  const isGameRoute = window.location.pathname === "/";
  useEffect(() => {
    return installGlobalErrorHandlers();
  }, []);
  useEffect(() => {
    const handlePreloadError = (event: Event) => {
      event.preventDefault();
      setUpdateReady(true);
    };
    window.addEventListener("vite:preloadError", handlePreloadError);
    return () => window.removeEventListener("vite:preloadError", handlePreloadError);
  }, []);

  return (
    <ErrorBoundary fallbackScreen="app-root">
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {isGameRoute ? <Index /> : <NotFound />}
            {updateReady && <VersionUpdateDialog />}
          </TooltipProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

function VersionUpdateDialog() {
  const { tr } = useI18n();
  return (
    <AlertDialogPrimitive.Root open>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="version-update" />
        <AlertDialogPrimitive.Content className="version-update__panel">
          <AlertDialogPrimitive.Title asChild>
            <strong>{tr("A new game version is ready", "เกมมีเวอร์ชันใหม่แล้ว")}</strong>
          </AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description asChild>
            <p>{tr("Your progress is safe. Reload once to continue with the newest version.", "เซฟของคุณยังอยู่ โหลดหน้าใหม่หนึ่งครั้งเพื่อเล่นเวอร์ชันล่าสุด")}</p>
          </AlertDialogPrimitive.Description>
          <AlertDialogPrimitive.Action asChild>
            <button onClick={() => window.location.reload()}>{tr("Reload game", "โหลดเกมใหม่")}</button>
          </AlertDialogPrimitive.Action>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

export default App;
