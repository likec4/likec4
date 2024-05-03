import { invariant } from '@likec4/core'
import { useIsMounted } from '@react-hookz/web'
import { useLayoutEffect, useRef, useState } from 'react'

type UseImageResult = [undefined, 'loading' | 'failed'] | [HTMLImageElement, 'loaded']

const imageElements = new Map<string, HTMLImageElement>()

type ReferrerPolicy =
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url'

type CrossOrigin = 'anonymous' | 'use-credentials'

export default function useImageLoader(
  url: string | undefined,
  crossOrigin?: CrossOrigin,
  referrerpolicy?: ReferrerPolicy
): UseImageResult {
  const isMounted = useIsMounted()
  // lets use refs for image and status
  // so we can update them during render
  // to have instant update in status/image when new data comes in
  const imageRef = useRef(url ? imageElements.get(url) : undefined)
  const statusRef = useRef<UseImageResult[1]>(imageRef.current ? 'loaded' : 'loading')

  // we are not going to use token
  // but we need to just to trigger state update
  const [_, setStateToken] = useState(0)

  // keep track of old props to trigger changes
  const urlRef = useRef(url)
  const crossOriginRef = useRef(crossOrigin)
  const referrerPolicyRef = useRef(referrerpolicy)
  if (
    !url
    || urlRef.current !== url
    || crossOriginRef.current !== crossOrigin
    || referrerPolicyRef.current !== referrerpolicy
  ) {
    statusRef.current = 'loading'
    imageRef.current = undefined
    urlRef.current = url
    crossOriginRef.current = crossOrigin
    referrerPolicyRef.current = referrerpolicy
  }

  useLayoutEffect(() => {
    if (!url) {
      return
    }
    const urlClosure = url
    const imgCached = imageElements.get(url)
    if (imgCached) {
      statusRef.current = 'loaded'
      if (imageRef.current !== imgCached) {
        imageRef.current = imgCached
        setStateToken(Math.random())
      }
      return
    }

    const img = document.createElement('img')
    img.style.width = '100%'
    img.style.height = 'auto'

    function onload() {
      if (!isMounted()) return
      imageElements.set(urlClosure, img)
      if (urlRef.current === urlClosure) {
        statusRef.current = 'loaded'
        imageRef.current = img
        setStateToken(Math.random())
      }
    }

    function onerror() {
      if (!isMounted() || urlRef.current !== urlClosure) return
      statusRef.current = 'failed'
      imageRef.current = undefined
      setStateToken(Math.random())
    }

    img.addEventListener('load', onload)
    img.addEventListener('error', onerror)
    crossOrigin && (img.crossOrigin = crossOrigin)
    referrerpolicy && (img.referrerPolicy = referrerpolicy)
    img.src = url

    return () => {
      img.removeEventListener('load', onload)
      img.removeEventListener('error', onerror)
    }
  }, [url, crossOrigin ?? null, referrerpolicy ?? null])

  // return array because it is better to use in case of several useImage hooks
  // const [background, backgroundStatus] = useImage(url1);
  // const [patter] = useImage(url2);
  if (imageRef.current !== undefined) {
    statusRef.current = 'loaded'
    return [imageRef.current, 'loaded']
  }
  invariant(statusRef.current !== 'loaded', 'image status cant be loaded')
  return [imageRef.current, statusRef.current]
}
