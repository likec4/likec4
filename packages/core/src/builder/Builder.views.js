import { _type, } from '../types';
import { $deploymentExpr } from './Builder.view-deployment';
import { $expr, } from './Builder.view-element';
export function views(...ops) {
    return (input) => {
        let builder = input;
        for (const op of ops) {
            builder = op(builder);
        }
        return builder;
    };
}
export function mkViewBuilder(view) {
    const viewBuilder = {
        $expr: view[_type] === 'deployment' ? $deploymentExpr : $expr,
        autoLayout(autoLayout) {
            view.rules.push({
                direction: autoLayout,
            });
            return viewBuilder;
        },
        exclude(expr) {
            view.rules.push({
                exclude: [expr],
            });
            return viewBuilder;
        },
        include(expr) {
            view.rules.push({
                include: [expr],
            });
            return viewBuilder;
        },
        style(rule) {
            view.rules.push(rule);
            return viewBuilder;
        },
        // title(title: string) {
        //   view.title = title
        //   return viewBuilder
        // },
        // description(description: string) {
        //   view.description = description
        //   return viewBuilder
        // }
    };
    return viewBuilder;
}
