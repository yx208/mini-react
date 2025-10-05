function FragmentTestExample() {
    return (
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
}

function FunctionTestExample() {
    return (
        <div>Function component</div>
    );
}

export {
    FunctionTestExample,
    FragmentTestExample,
}
