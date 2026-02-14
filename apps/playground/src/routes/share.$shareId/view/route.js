import { api } from '$/api';
import { LikeC4Model } from '@likec4/core/model';
import { LikeC4ModelProvider } from '@likec4/diagram';
import { createFileRoute, Navigate, Outlet } from '@tanstack/react-router';
import { useMemo } from 'react';
export const Route = createFileRoute('/share/$shareId/view')({
    component: RouteComponent,
    loader: async ({ params: { shareId } }) => {
        const sharedPlayground = await api.share.get(shareId);
        // const likec4model = LikeC4Model.create(sharedPlayground.model)
        return sharedPlayground;
    },
    // 5 minutes
    staleTime: 5 * 60 * 1000,
    // 5 minutes
    gcTime: 5 * 60 * 1000,
    notFoundComponent: () => {
        const { shareId } = Route.useParams();
        return (<Navigate to={'/share/$shareId/not-found/'} params={{ shareId }}/>);
    },
});
function RouteComponent() {
    console.log('RouteComponent');
    const sharedPlayground = Route.useLoaderData();
    const likec4model = useMemo(() => LikeC4Model.create(sharedPlayground.model), [
        sharedPlayground.model,
    ]);
    return (<LikeC4ModelProvider likec4model={likec4model}>
      <Outlet />
    </LikeC4ModelProvider>);
}
