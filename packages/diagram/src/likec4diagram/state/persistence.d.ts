import type { EnabledFeatures } from '../../context/DiagramFeatures';
export declare const DiagramToggledFeaturesPersistence: {
    read(): Partial<EnabledFeatures>;
    write<F extends Partial<EnabledFeatures>>(toggledFeatures: F): F;
};
