import { ReactDOM } from "../which-react";
// import * as ReactDOM from "react-dom/client";
import './index.css';

const jsx = (
    <div className="outer">
        <div className="inner">Hello</div>
        <div>world</div>
        Good
    </div>
);

ReactDOM
    .createRoot(document.getElementById('root')!)
    .render(jsx as any);
