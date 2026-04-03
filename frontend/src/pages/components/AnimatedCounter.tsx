import { useState, useEffect, useRef } from 'react'

interface AnimatedCounterProps {
  value: number
  suffix?: string
  reduceMotion: boolean
}

export default function AnimatedCounter({ value, suffix = '', reduceMotion }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const previousValueRef = useRef(value)

  useEffect(() => {
    if (reduceMotion) {
      setDisplayValue(value)
      previousValueRef.current = value
      return
    }

    const startValue = previousValueRef.current
    const endValue = value

    if (startValue === endValue) {
      setDisplayValue(endValue)
      return
    }

    let frameId = 0
    let startTime = 0
    const duration = 700

    const animateValue = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp
      }

      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const nextValue = Math.round(startValue + (endValue - startValue) * eased)
      setDisplayValue(nextValue)

      if (progress < 1) {
        frameId = window.requestAnimationFrame(animateValue)
      } else {
        previousValueRef.current = endValue
      }
    }

    frameId = window.requestAnimationFrame(animateValue)
    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [reduceMotion, value])

  return (
    <>
      {displayValue}
      {suffix}
    </>
  )
}
