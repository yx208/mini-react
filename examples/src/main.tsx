import { ReactDOM } from "../which-react";
import './index.css';
import { HookTestExample } from "./examples/hook";

// JSX → React Element → Fiber Node → DOM Node
ReactDOM
    .createRoot(document.getElementById('root')!)
    .render((<HookTestExample />) as any);
