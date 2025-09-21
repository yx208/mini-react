export type ReactElement = {
    $$typeof: symbol;
    key: string | number;
    props: any;
};

export type ReactEmpty = null | void | boolean;

export type ReactNode = ReactElement | Array<ReactElement>;

export type ReactNodeList = ReactNode | ReactEmpty;


