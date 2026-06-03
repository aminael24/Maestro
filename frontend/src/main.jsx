import React from "react";
import ReactDOM from "react-dom/client";
import AppRouter from "./app/router/AppRouter";
import "./index.css";
import { assertEnv } from "./utils/env";

assertEnv();

const root = document.getElementById("root");
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);