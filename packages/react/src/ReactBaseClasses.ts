// function Component(props: any) {
//     this.props = props;
// }
//
// Component.prototype.isReactComponent = {};

class ReactClassComponent {
    static isReactComponent = true;
    props: any;

    constructor(props: any) {
        this.props = props;
    }
}

export {
    ReactClassComponent
};
