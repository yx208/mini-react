import { useReducer } from "../../which-react";

const countReducer = (_initState: number, _action: number) => {
    return 0;
};

function HookTestExample() {
    const [count, dispatch] = useReducer(countReducer, 0);

    const handleIncrement = () => {
        dispatch(count + 1);
    };

    return (
        <div>
            <div>{ count }</div>
            <button onClick={handleIncrement}>Click Me</button>
        </div>
    );
}

export {
    HookTestExample
};
