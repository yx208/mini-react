import { ReactDOM } from "../which-react";
import './index.css';
import { BasePositionReconcile } from "./examples/reconcilation";

// JSX → React Element → Fiber Node → DOM Node
ReactDOM
    .createRoot(document.getElementById('root')!)
    .render((<BasePositionReconcile />) as any);
