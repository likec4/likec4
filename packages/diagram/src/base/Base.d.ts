type WithDimmed = {
    data: {
        dimmed?: Base.Dimmed;
    };
};
type WithHovered = {
    data: {
        hovered?: boolean;
    };
};
declare function setDimmed<T extends WithDimmed>(value: T, dimmed: 'immediate' | boolean): T;
declare function setDimmed(dimmed: 'immediate' | boolean): <T extends WithDimmed>(value: T) => T;
declare function setHovered<T extends WithHovered>(value: T, hovered: boolean): T;
declare function setHovered(hovered: boolean): <T extends WithHovered>(value: T) => T;
type WithData<D> = {
    data: D;
};
declare function setData<E extends WithData<any>>(value: E, state: Partial<E['data']>): E;
declare function setData<E extends WithData<any>>(state: Partial<NoInfer<E['data']>>): (value: E) => E;
export declare const Base: {
    setDimmed: typeof setDimmed;
    setHovered: typeof setHovered;
    setData: typeof setData;
};
export declare namespace Base {
    type Dimmed = 'immediate' | boolean;
}
export {};
