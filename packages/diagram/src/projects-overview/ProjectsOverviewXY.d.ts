export type ProjectsOverviewXYProps = {
    /**
     * Background pattern
     * @default 'dots'
     */
    background?: 'dots' | 'lines' | 'cross' | 'transparent' | 'solid' | undefined;
    /**
     * @default - determined by the user's system preferences.
     */
    colorScheme?: 'light' | 'dark' | undefined;
};
export declare const ProjectsOverviewXY: import("react").NamedExoticComponent<ProjectsOverviewXYProps>;
