import type { Viewport } from '@xyflow/react';
export declare const ProjectsOverviewViewportPersistence: {
    read(): Viewport;
    write(viewport: Viewport | null): void;
};
