import { type ReactNode } from 'react';
export declare function MetadataProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
interface MetadataValueProps {
    label: string;
    value: string | string[];
}
export declare function MetadataValue({ label, value }: MetadataValueProps): import("react").JSX.Element;
export {};
