import { useReducer } from "../../which-react";

const countReducer = (state: number, action: string) => {
    if (action === "increment") {
        return state + 1;
    }

    throw Error('Unknown action.');
};

function HookTestExample() {
    const [count, setCountIncrement] = useReducer(countReducer, 0);

    const handleIncrement = () => {
        setCountIncrement("increment");
    };

    return (
        <div>
            {count % 2 === 0
                ? <button className="first" onClick={handleIncrement}>{count}</button>
                : <button className="second" onClick={handleIncrement}>{count + 1000}</button>
            }
        </div>
    );
}

export {
    HookTestExample
};
