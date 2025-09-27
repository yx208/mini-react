import { ReactDOM } from "../which-react";
// import * as ReactDOM from "react-dom/client";

import './index.css';

const jsx = (
    <>
        <div className="outer">
            <>
                <>
                    <div>
                        <>
                            <div>A</div>
                            <div>B</div>
                        </>
                    </div>
                    <div>C</div>
                </>
                <div>
                    <div>D</div>
                    <div>E</div>
                </div>
                <>F</>
            </>
            <div className="first">Hello</div>
            <div className="second">world</div>
        </div>
    </>
);

ReactDOM
    .createRoot(document.getElementById('root')!)
    .render(jsx as any);
