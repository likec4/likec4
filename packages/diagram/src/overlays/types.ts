// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import type {
  AIChatActorRef,
  AIChatInput,
  AIChatLogic,
} from '../ai-chat/actor'
import type {
  ElementDetailsActorRef,
  ElementDetailsInput,
  ElementDetailsLogic,
} from './element-details/actor'
import type {
  RelationshipDetailsActorRef,
  RelationshipDetailsInput,
  RelationshipDetailsLogic,
} from './relationship-details/actor'
import type {
  RelationshipsBrowserActorRef,
  RelationshipsBrowserInput,
  RelationshipsBrowserLogic,
} from './relationships-browser/actor'
export namespace Overlays {
  export namespace ElementDetails {
    export interface Input extends ElementDetailsInput {}
    export interface Logic extends ElementDetailsLogic {}
    export interface ActorRef extends ElementDetailsActorRef {}
  }

  export namespace RelationshipDetails {
    export type Input = RelationshipDetailsInput
    export interface Logic extends RelationshipDetailsLogic {}
    export interface ActorRef extends RelationshipDetailsActorRef {}
  }

  export namespace RelationshipsBrowser {
    export interface Input extends RelationshipsBrowserInput {}
    export interface Logic extends RelationshipsBrowserLogic {}
    export interface ActorRef extends RelationshipsBrowserActorRef {}
  }

  export namespace AIChat {
    export interface Input extends AIChatInput {}
    export interface Logic extends AIChatLogic {}
    export interface ActorRef extends AIChatActorRef {}
  }
}
