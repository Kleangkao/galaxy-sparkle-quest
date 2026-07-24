import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import ErrorBoundary from "@/components/ErrorBoundary";
import { installGlobalErrorHandlers } from "@/lib/selfHealing";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [updateReady, setUpdateReady] = useState(false);
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
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            {updateReady && (
              <div className="version-update" role="alertdialog" aria-modal="true" aria-labelledby="version-update-title">
                <div>
                  <strong id="version-update-title">Game updated · เกมมีเวอร์ชันใหม่</strong>
                  <p>Your progress is safe. Reload once to continue with the newest version.</p>
                  <p>เซฟของคุณยังอยู่ กดโหลดใหม่หนึ่งครั้งเพื่อเล่นเวอร์ชันล่าสุด</p>
                  <button onClick={() => window.location.reload()}>Reload game · โหลดเกมใหม่</button>
                </div>
              </div>
            )}
          </TooltipProvider>
        </I18nProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
