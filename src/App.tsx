import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/lib/i18n";
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
            {updateReady && (
              <AlertDialogPrimitive.Root open>
                <AlertDialogPrimitive.Portal>
                  <AlertDialogPrimitive.Overlay className="version-update" />
                  <AlertDialogPrimitive.Content className="version-update__panel">
                    <AlertDialogPrimitive.Title asChild>
                      <strong>Game updated · เกมมีเวอร์ชันใหม่</strong>
                    </AlertDialogPrimitive.Title>
                    <AlertDialogPrimitive.Description asChild>
                      <div>
                        <p>Your progress is safe. Reload once to continue with the newest version.</p>
                        <p>เซฟของคุณยังอยู่ กดโหลดใหม่หนึ่งครั้งเพื่อเล่นเวอร์ชันล่าสุด</p>
                      </div>
                    </AlertDialogPrimitive.Description>
                    <AlertDialogPrimitive.Action asChild>
                      <button onClick={() => window.location.reload()}>Reload game · โหลดเกมใหม่</button>
                    </AlertDialogPrimitive.Action>
                  </AlertDialogPrimitive.Content>
                </AlertDialogPrimitive.Portal>
              </AlertDialogPrimitive.Root>
            )}
          </TooltipProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
