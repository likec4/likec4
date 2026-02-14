import type { AnyEventObject, CallbackActorLogic, NonReducibleUnknown } from 'xstate';
export type HotKeyEvent = {
    type: 'undo';
};
export interface HotkeyActorLogic extends CallbackActorLogic<AnyEventObject, NonReducibleUnknown, HotKeyEvent> {
}
export declare const hotkeyActorLogic: HotkeyActorLogic;
