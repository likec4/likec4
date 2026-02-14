declare const router: any;
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}
export declare function Routes(): import("react").JSX.Element;
export {};
