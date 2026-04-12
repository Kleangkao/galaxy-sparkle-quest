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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, this.props.fallbackScreen || "component");
    console.warn("[SelfHealing] Caught error:", error.message);

    // Start auto-recovery countdown
    this.timer = setInterval(() => {
      this.setState((prev) => {
        if (prev.countdown <= 1) {
          this.handleReload();
          return prev;
        }
        return { ...prev, countdown: prev.countdown - 1 };
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
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/95 backdrop-blur-md">
          <div className="text-center space-y-6 p-8 max-w-sm mx-auto animate-fade-in">
            {/* Friendly animated icon */}
            <div className="text-6xl animate-bounce">🛸</div>

            <h2
              className="text-2xl font-bold text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              มีปัญหานิดหน่อย
            </h2>
            <p className="text-muted-foreground text-sm">
              กำลังแก้ให้อยู่...
            </p>
            <p className="text-xs text-muted-foreground/60">
              Oops! Something went wrong. Fixing it...
            </p>

            {/* Countdown */}
            <div className="text-muted-foreground text-sm">
              ⏳ Auto-reload in{" "}
              <span className="font-bold text-accent">{this.state.countdown}s</span>
            </div>

            {/* Manual reload button */}
            <button
              onClick={this.handleReload}
              className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-lg shadow-lg hover:scale-105 active:scale-95 transition-transform"
              style={{ fontFamily: "var(--font-display)" }}
            >
              🔄 โหลดเกมใหม่
            </button>
            <p className="text-xs text-muted-foreground/50">Reload Game</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
