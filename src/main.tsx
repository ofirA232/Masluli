import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/redesign.css";

// Set before the first render so [data-reveal] content starts hidden instead
// of flashing in and then animating. Under reduced motion the CSS keeps the
// fade but drops the movement.
document.documentElement.setAttribute("data-motion", "");

createRoot(document.getElementById("root")!).render(<App />);
