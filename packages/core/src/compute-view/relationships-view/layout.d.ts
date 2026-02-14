import { type DiagramView } from '../../types';
import type { RelationshipsViewData } from './_types';
export declare function layoutRelationshipsView(data: RelationshipsViewData): Pick<DiagramView, 'nodes' | 'edges' | 'bounds'>;
