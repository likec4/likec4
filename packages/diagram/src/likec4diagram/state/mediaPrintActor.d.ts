import { type AnyEventObject, type CallbackActorLogic, type NonReducibleUnknown } from 'xstate';
export type MediaPrintEvent = {
    type: 'media.print.on';
} | {
    type: 'media.print.off';
};
export interface MediaPrintActorLogic extends CallbackActorLogic<AnyEventObject, NonReducibleUnknown, MediaPrintEvent> {
}
/**
 * Actor logic to listen for media print events.
 */
export declare const mediaPrintActorLogic: MediaPrintActorLogic;
