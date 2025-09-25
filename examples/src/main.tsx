import { ReactDOM } from "../which-react";
// import * as ReactDOM from "react-dom/client";
import './index.css';

const jsx = (
    <div className="outer">
        <>
            <>
                <div>A</div>
                <div>B</div>
            </>
            <div>
                <div>C</div>
                <div>D</div>
            </div>
            <>E</>
        </>
        <div className="first">Hello</div>
        <div className="second">world</div>
    </div>
);

ReactDOM
    .createRoot(document.getElementById('root')!)
    .render(jsx as any);
