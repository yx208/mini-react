import { ReactDOM } from "../which-react";
// import * as ReactDOM from "react-dom/client";
import './index.css';

const jsx = (
    <div className="outer">
        <div className="inner">Hello world</div>
    </div>
);

const root = ReactDOM
    .createRoot(document.getElementById('root')!);
root.render(jsx as any);
