import { useReducer } from "../../which-react";

const countReducer = (state: number, action: string) => {
    if (action === "increment") {
        return state + 1;
    }

    throw Error('Unknown action.');
};

function HookTestExample() {
    const [count, dispatch] = useReducer(countReducer, 0);

    const handleIncrement = () => {
        debugger;
        dispatch("increment");
    };

    return (
        <div>
            {count % 2 === 0
                ? <button onClick={handleIncrement}>偶数显示 { count }</button>
                : <button onClick={handleIncrement}>奇数显示 { count }</button>
            }
        </div>
    );
}

export {
    HookTestExample
};
