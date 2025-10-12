import { useReducer } from "../../which-react";

const countReducer = (state: number, action: number) => {
    return state + action;
};

function BasePositionReconcile() {
    const [count, setCount] = useReducer(countReducer, 0);
    const sortArr = count % 2 === 0 ? [0, 1, 2, 3, 4] : [6, 0, 3, 1, 2];

    return (
        <div>
            <div>{ count }</div>
            <button onClick={() => setCount(1)}>Click Me</button>
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
