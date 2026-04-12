import { Component, ErrorInfo, ReactNode } from "react";
import { logError } from "@/lib/selfHealing";

interface Props {
  children: ReactNode;
  screenName: string;
  onFallback: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * Per-screen error boundary that auto-recovers by navigating back.
 * Shows a brief friendly message then calls onFallback.
 */
export default class ScreenErrorBoundary extends Component<Props, State> {
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    logError(error, this.props.screenName);
    console.warn(`[SelfHealing] ${this.props.screenName} crashed, recovering...`);

    // Auto-recover after 2 seconds
    this.timer = setTimeout(() => {
      this.setState({ hasError: false });
      this.props.onFallback();
    }, 2000);
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center space-y-4 p-6 animate-fade-in">
            <div className="text-5xl animate-pulse">🔧</div>
            <p
              className="text-lg font-bold text-foreground"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ลองใหม่อีกครั้งนะ!
            </p>
            <p className="text-sm text-muted-foreground">Let's try again!</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
