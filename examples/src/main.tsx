import { ReactDOM } from "../which-react";
import './index.css';
import { HookTestExample } from "./examples/hook";

const jsx = (
    <div>
        <HookTestExample></HookTestExample>
    </div>
);

// JSX → React Element → Fiber Node → DOM Node
ReactDOM
    .createRoot(document.getElementById('root')!)
    .render(jsx as any);
