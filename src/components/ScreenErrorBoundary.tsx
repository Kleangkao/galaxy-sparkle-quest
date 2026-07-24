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
    console.warn(`[Recovery] ${this.props.screenName} crashed; returning to safety.`);
    this.timer = setTimeout(() => {
      this.setState({ hasError: false });
      this.props.onFallback();
    }, 2500);
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
        <div className="space-y-4 p-6 text-center" role="alert">
          <div className="text-5xl" aria-hidden="true">⚠</div>
          <p className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Returning to a safe screen
          </p>
          <p className="text-sm text-muted-foreground">
            กำลังกลับไปหน้าที่ปลอดภัย ข้อมูลที่บันทึกไว้จะไม่หาย
          </p>
        </div>
      </div>
    );
  }
}
