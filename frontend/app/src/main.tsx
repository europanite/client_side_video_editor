import React from "react";
import ReactDOM from "react-dom/client";
import "./style.css";
import App from "./App";

let rootElement = document.getElementById("app");
if (!rootElement) {
  rootElement = document.createElement("div");
  rootElement.id = "app";
  document.body.appendChild(rootElement);
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
