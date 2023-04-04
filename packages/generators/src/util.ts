/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { GeneratorNode } from 'langium'
import { CompositeGeneratorNode, NL } from 'langium'


export function generatedHeader(): GeneratorNode {
  const node = new CompositeGeneratorNode()
  node.contents.push(
    '/******************************************************************************', NL,
    ' * This file was generated', NL,
    ' * DO NOT EDIT MANUALLY!', NL,
    ' ******************************************************************************/', NL, NL,
    '/* eslint-disable */', NL
  )
  return node
}
