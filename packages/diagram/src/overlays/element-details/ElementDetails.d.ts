import type { ElementDetailsActorRef } from './actor';
export type ElementDetailsProps = {
    actorRef: ElementDetailsActorRef;
    onClose: () => void;
};
export declare function ElementDetails({ actorRef, onClose, }: ElementDetailsProps): import("react").JSX.Element;
