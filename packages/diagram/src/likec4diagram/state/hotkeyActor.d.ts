import { type AnyEventObject, type CallbackActorLogic, type NonReducibleUnknown } from 'xstate';
export type HotKeyEvent = {
    type: 'key.esc' | `key.arrow.${'left' | 'right' | 'up' | 'down'}`;
};
export interface HotkeyActorLogic extends CallbackActorLogic<AnyEventObject, NonReducibleUnknown, HotKeyEvent> {
}
export declare const hotkeyActorLogic: HotkeyActorLogic;
