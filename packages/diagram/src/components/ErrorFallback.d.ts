import { type ErrorBoundaryProps, type FallbackProps } from 'react-error-boundary';
export declare function ErrorFallback({ error, resetErrorBoundary }: FallbackProps): import("react").JSX.Element;
export declare function ErrorBoundary(props: Pick<ErrorBoundaryProps, 'onReset' | 'onError' | 'children'>): import("react").JSX.Element;
