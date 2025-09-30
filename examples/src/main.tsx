import { ReactDOM } from "../which-react";
// import * as ReactDOM from "react-dom/client";

import './index.css';

const jsxFragment = (
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

function FunctionComponentDeclared() {
    return (
        <div>Function component</div>
    )
}

const jsx = (
    <div>
        {jsxFragment}
        <FunctionComponentDeclared></FunctionComponentDeclared>
    </div>
);

// JSX → React Element → Fiber Node → DOM Node
ReactDOM
    .createRoot(document.getElementById('root')!)
    .render(jsx as any);
