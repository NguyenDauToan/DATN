import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./data/AuthContext.tsx";
import { BrowserRouter } from "react-router-dom";
import "sweetalert2/dist/sweetalert2.min.css";
createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
