/**
 * Ugly hack to make Vite HMR work with the virtual module HMR.
 * (I don't know, but virtual module IDs in my case can't be used to subscribe to HMR updates)
 */
import { LikeC4Views } from 'virtual:likec4/views'

export { LikeC4Views }
