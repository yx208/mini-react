import { ReactDOM } from "../which-react";
import './index.css';

const jsx = (
    <div className="outer">
        <div className="inner">Hello world</div>
    </div>
);

ReactDOM.createRoot(document.getElementById('root')!).render(jsx as any)
