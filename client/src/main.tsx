import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { FilterProvider } from "./context/FilterContext";

createRoot(document.getElementById("root")!).render(
  <FilterProvider>
    <App />
  </FilterProvider>
);
