import type { DynamicStep, DynamicViewIncludeRule, ElementViewPredicate } from '../../../types';
import { type $Aux, type FakeElementIds } from '../../element-view/__test__/fixture';
type StepExpr = `${FakeElementIds} ${'->' | '<-'} ${FakeElementIds}`;
type StepProps = Omit<DynamicStep, 'source' | 'target' | 'isBackward'>;
export declare function $step(expr: StepExpr, props?: string | Partial<StepProps>): DynamicStep;
export declare function compute(stepsAndRules: (DynamicStep<$Aux> | ElementViewPredicate<$Aux> | DynamicViewIncludeRule<$Aux>)[]): any;
export {};
