import { useEffect, useState } from 'react'

/**
 * True when the device's primary input is a finger.
 *
 * `(pointer: coarse)` is the right question to ask — far better than sniffing
 * the user agent or checking for `ontouchstart`, which is also true on plenty
 * of touch-capable laptops that people still drive with a trackpad.
 *
 * It is evaluated in an effect rather than during render so that server or
 * pre-rendered output (and the very first client paint) never disagree about
 * what is on screen.
 */
export default function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    if (typeof matchMedia !== 'function') return

    const query = matchMedia('(pointer: coarse)')
    const update = () => setIsTouch(query.matches)

    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return isTouch
}
