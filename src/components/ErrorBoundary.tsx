import { Component, ErrorInfo, ReactNode } from "react";
import { logError } from "@/lib/selfHealing";

interface Props {
  children: ReactNode;
  fallbackScreen?: string;
  onRecover?: () => void;
}

interface State {
  hasError: boolean;
  countdown: number;
}

export default class ErrorBoundary extends Component<Props, State> {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, countdown: 5 };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true, countdown: 5 };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    logError(error, this.props.fallbackScreen || "component");
    console.warn("[Recovery] Caught error:", error.message);
    this.timer = setInterval(() => {
      this.setState((previous) => {
        if (previous.countdown <= 1) {
          this.handleReload();
          return previous;
        }
        return { ...previous, countdown: previous.countdown - 1 };
      });
    }, 1000);
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer);
  }

  handleReload = () => {
    if (this.timer) clearInterval(this.timer);
    if (this.props.onRecover) {
      this.setState({ hasError: false, countdown: 5 });
      this.props.onRecover();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-sm space-y-5 p-8 text-center" role="alert">
          <div className="text-5xl" aria-hidden="true">⚠</div>
          <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Game paused safely
          </h2>
          <p className="text-sm text-muted-foreground">
            เกมหยุดชั่วคราวเพื่อป้องกันข้อมูลเสียหาย
          </p>
          <p className="text-xs text-muted-foreground/70">
            Progress saved in this browser remains safe. Reloading in{" "}
            <span className="font-bold text-accent">{this.state.countdown}s</span>
          </p>
          <button
            onClick={this.handleReload}
            className="rounded-2xl bg-primary px-6 py-3 text-lg font-bold text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Reload game · โหลดเกมใหม่
          </button>
          <p className="text-xs text-muted-foreground/50">
            If this repeats, tell the person who shared the game and include the page address.
          </p>
        </div>
      </div>
    );
  }
}
