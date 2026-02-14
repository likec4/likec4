import { BigBankExample } from './bigbank';
import { BlankExample } from './blank';
import { DemoRankExample } from './demo-rank';
import { DeploymentExample } from './deployment';
import { DynamicViewExample } from './dynamic';
import { TutorialExample } from './tutorial';
export * from './bigbank';
export * from './blank';
export const Examples = {
    'bigbank': {
        isCustom: false,
        title: 'Big Bank',
        ...BigBankExample,
    },
    'tutorial': {
        isCustom: false,
        title: 'Getting Started tutorial',
        ...TutorialExample,
    },
    'blank': {
        isCustom: false,
        title: 'Blank playground',
        ...BlankExample,
    },
    'dynamic': {
        isCustom: false,
        title: 'Dynamic View playground',
        ...DynamicViewExample,
    },
    'deployment': {
        isCustom: false,
        title: 'Deployment playground',
        ...DeploymentExample,
    },
    'demo-rank': {
        isCustom: false,
        title: 'Ranks',
        ...DemoRankExample,
    },
};
