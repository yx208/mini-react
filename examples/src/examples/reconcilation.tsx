import { useReducer, useState } from "../../which-react";

const countReducer = (state: number, action: number) => {
    return state + action;
};

function BasePositionReconcile() {
    const [flag, setFlag] = useReducer(countReducer, 0);
    const [count, setCount] = useState(0);
    const sortArr = flag % 2 === 0 ? [0, 1, 2, 3, 4] : [6, 0, 3, 1, 2];

    return (
        <div>
            <div>{ flag }</div>
            <button onClick={() => setFlag(1)}>Click Me</button>
            <button onClick={() => setCount(count + 1)}>{ count }</button>
            <ul>
                {sortArr.map((item) => (
                    <li key={"li" + item}>{ item }</li>
                ))}
            </ul>
        </div>
    );
}

export {
    BasePositionReconcile
};
