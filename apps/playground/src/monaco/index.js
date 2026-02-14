import { Loader } from '@mantine/core';
import { lazy, Suspense } from 'react';
const LazyMonacoEditor = lazy(async () => {
    return await import('./MonacoEditor');
});
export function MonacoEditor(props) {
    return (<Suspense fallback={<Loader size={'sm'}/>}>
      <LazyMonacoEditor {...props}/>
    </Suspense>);
}
