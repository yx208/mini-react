import { useReducer } from "../../which-react";

const countReducer = (_initState: number, action: number) => {
    return action;
};

function HookTestExample() {
    const [count, dispatch] = useReducer(countReducer, 0);

    const handleIncrement = () => {
        dispatch(count + 1);
    };

    return (
        <div>
            <button onClick={handleIncrement}>{ count }</button>
        </div>
    );
}

export {
    HookTestExample
};
