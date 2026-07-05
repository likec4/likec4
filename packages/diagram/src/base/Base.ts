import { deepEqual } from 'fast-equals'
import { entries } from 'remeda'

const mergeData = <E extends WithData<any>>(v: E, data: Partial<E['data']>) =>
  Object.assign({}, v, {
    data: Object.assign({}, v.data, data),
  })

type WithDimmed = { data: { dimmed?: Base.Dimmed } }
type WithHovered = { data: { hovered?: boolean } }

const _setDimmed = <T extends WithDimmed>(v: T, dimmed: Base.Dimmed): T =>
  (v.data.dimmed ?? false) === dimmed ? v : mergeData(v, { dimmed })

function setDimmed<T extends WithDimmed>(value: T, dimmed: 'immediate' | boolean): T
function setDimmed(dimmed: 'immediate' | boolean): <T extends WithDimmed>(value: T) => T
function setDimmed<T extends WithDimmed>(arg1: T | Base.Dimmed, arg2?: Base.Dimmed) {
  if (arg2 !== undefined) {
    return _setDimmed(arg1 as T, arg2)
  }
  return (v: T) => _setDimmed(v, arg1 as Base.Dimmed)
}

const _setHovered = <T extends WithHovered>(v: T, hovered: boolean): T =>
  (v.data.hovered ?? false) === hovered ? v : mergeData(v, { hovered })

function setHovered<T extends WithHovered>(value: T, hovered: boolean): T
function setHovered(hovered: boolean): <T extends WithHovered>(value: T) => T
function setHovered<T extends WithHovered>(arg1: T | boolean, arg2?: boolean) {
  if (arg2 !== undefined) {
    return _setHovered(arg1 as T, arg2)
  }
  return (v: T) => _setHovered(v, arg1 as boolean)
}

export function hasSubObject<E>(value: E, subobl: Partial<E>) {
  return value === subobl || entries(subobl).every(([v, key]) => deepEqual((value as any)[key] ?? undefined, v))
}

type WithData<D> = { data: D }
function _setData<E extends WithData<any>>(value: E, data: Partial<E['data']>): E {
  if (hasSubObject(value.data, data)) {
    return value
  }
  return mergeData(value, data)
}
function setData<E extends WithData<any>>(value: E, data: Partial<E['data']>): E
function setData<E extends WithData<any>>(state: Partial<NoInfer<E>['data']>): (value: E) => E
function setData<E extends WithData<any>>(arg1: E | Partial<E['data']>, arg2?: any) {
  if (arg2 !== undefined) {
    return _setData(arg1 as E, arg2)
  }
  return (edge: E) => _setData(edge, arg1)
}

export const Base = {
  setDimmed,
  setHovered,
  setData,
}

export namespace Base {
  // 'immediate' means that the node is dimmed without delay
  export type Dimmed = 'immediate' | boolean
}
