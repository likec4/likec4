import { type Provider } from 'react';
import type { DiagramApi } from '../likec4diagram/state/diagram-api';
import type { DiagramActorRef } from '../likec4diagram/state/types';
export declare const DiagramActorContextProvider: Provider<DiagramActorRef>;
export declare const DiagramApiContextProvider: Provider<DiagramApi>;
export declare function useDiagramActorRef(): DiagramActorRef;
export declare function useDiagram(): DiagramApi;
