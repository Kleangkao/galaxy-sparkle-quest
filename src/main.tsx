import { createRoot } from "react-dom/client";
import "@fontsource-variable/fredoka";
import "@fontsource-variable/nunito";
import "@fontsource-variable/baloo-2";
import "@fontsource/k2d/400.css";
import "@fontsource/k2d/500.css";
import "@fontsource/k2d/600.css";
import "@fontsource/k2d/700.css";
import "@fontsource/noto-sans-thai/400.css";
import "@fontsource/noto-sans-thai/500.css";
import "@fontsource/noto-sans-thai/600.css";
import "@fontsource/noto-sans-thai/700.css";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
