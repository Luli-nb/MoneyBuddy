import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

type Feedback = (message: string, error?: boolean) => void
const FeedbackContext = createContext<Feedback>(() => {})
export const useFeedback = () => useContext(FeedbackContext)

// Focus stays inside the active dialog and returns to the invoking control.
export function useDialogFocus(onClose: () => void) {
  const ref = useRef<HTMLElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    const previous = document.activeElement as HTMLElement | null
    const background = [
      ...document.querySelectorAll<HTMLElement>("[data-app-content]"),
    ]
    background.forEach((node) => {
      node.inert = true
    })
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const focusable = () =>
      [
        ...dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]',
        ),
      ].filter((node) => node.getClientRects().length > 0)
    ;(
      dialog.querySelector<HTMLElement>("[autofocus]") ??
      focusable()[0] ??
      dialog
    ).focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        close.current()
        return
      }
      if (event.key !== "Tab") return
      const nodes = focusable()
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (!first) {
        event.preventDefault()
        dialog.focus()
        return
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !dialog.contains(document.activeElement))
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !dialog.contains(document.activeElement))
      ) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", keydown)
    return () => {
      document.removeEventListener("keydown", keydown)
      background.forEach((node) => {
        node.inert = false
      })
      document.body.style.overflow = oldOverflow
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  return ref
}

export default function AccessibilityFeedback({
  children,
  voice,
  sound,
  vibration,
}: {
  children: ReactNode
  voice: boolean
  sound: boolean
  vibration: boolean
}) {
  const [notice, setNotice] = useState({ message: "", error: false, id: 0 })
  const audioRef = useRef<AudioContext | null>(null)
  const announce = useCallback<Feedback>(
    (message, error = false) => {
      setNotice({ message, error, id: Date.now() })
      if (voice && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
        const speech = new SpeechSynthesisUtterance(message)
        speech.lang = "pt-BR"
        window.speechSynthesis.speak(speech)
      }
      if (sound) {
        try {
          const audio = audioRef.current ?? new AudioContext()
          audioRef.current = audio
          void audio
            .resume()
            .then(() => {
              const oscillator = audio.createOscillator()
              const gain = audio.createGain()
              oscillator.connect(gain)
              gain.connect(audio.destination)
              oscillator.frequency.setValueAtTime(
                error ? 220 : 660,
                audio.currentTime,
              )
              gain.gain.setValueAtTime(0.08, audio.currentTime)
              gain.gain.exponentialRampToValueAtTime(
                0.001,
                audio.currentTime + 0.18,
              )
              oscillator.start()
              oscillator.stop(audio.currentTime + 0.2)
            })
            .catch(() => {})
        } catch {
          /* Text feedback remains available when audio is blocked. */
        }
      }
      if (vibration && "vibrate" in navigator)
        navigator.vibrate(error ? [100, 60, 100] : 60)
    },
    [voice, sound, vibration],
  )

  useEffect(() => {
    if (!voice && "speechSynthesis" in window) window.speechSynthesis.cancel()
  }, [voice])
  useEffect(
    () => () => {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel()
      void audioRef.current?.close()
    },
    [],
  )
  return (
    <FeedbackContext.Provider value={announce}>
      {children}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {!notice.error && <span key={notice.id}>{notice.message}</span>}
      </div>
      <div className="sr-only" role="alert" aria-atomic="true">
        {notice.error && <span key={notice.id}>{notice.message}</span>}
      </div>
      {notice.message && (
        <div className="feedback-notice fixed bottom-5 left-5 z-[100] flex max-w-[min(32rem,calc(100%-2.5rem))] items-start gap-4 rounded-2xl border border-line bg-white p-4 text-sm text-ink shadow-floating">
          <div>
            <strong>{notice.error ? "Atenção" : "Money Buddy"}</strong>
            <p className="mt-1">{notice.message}</p>
          </div>
          <button
            type="button"
            className="rounded-lg border border-line px-2 py-1"
            aria-label="Dispensar mensagem"
            onClick={() =>
              setNotice((current) => ({ ...current, message: "" }))
            }
          >
            Fechar
          </button>
        </div>
      )}
    </FeedbackContext.Provider>
  )
}

export function ReadingText({
  children,
  id,
  marked,
  toggle,
}: {
  children: ReactNode
  id: string
  marked: boolean
  toggle: (id: string) => void
}) {
  return (
    <div className="reading-passage">
      <p className={`leading-relaxed ${marked ? "user-highlight" : ""}`}>
        {children}
      </p>
      <button
        type="button"
        className="mt-2 rounded-lg border border-current px-2 py-1 text-xs font-bold text-green"
        aria-pressed={marked}
        onClick={() => toggle(id)}
      >
        {marked ? "Remover destaque" : "Destacar trecho"}
      </button>
    </div>
  )
}

export function ImageZoom({
  src,
  onClose,
}: {
  src: string
  onClose: () => void
}) {
  const dialogRef = useDialogFocus(onClose)
  const [scale, setScale] = useState(1)
  const pointers = useRef(new Map<number, {
    x: number
    y: number
  }>())
  const previousDistance = useRef(0)
  const clamp = (value: number) => Math.max(1, Math.min(4, value))
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-overlay p-4">
      <section
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-zoom-title"
        className="w-full max-w-4xl rounded-card bg-white p-5 text-ink shadow-floating"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="image-zoom-title" className="text-lg font-bold">
            Conheça o Buddy de perto
          </h2>
          <button className="a11y-control" onClick={onClose}>
            Fechar imagem
          </button>
        </div>
        <p className="my-3 text-sm text-muted">
          Use os botões ou dois dedos para ampliar. Role a área para explorar os
          detalhes.
        </p>
        <div
          className="mb-3 flex flex-wrap items-center gap-3"
          role="group"
          aria-label="Ampliação da imagem"
        >
          <button
            className="a11y-control"
            aria-label="Reduzir imagem"
            disabled={scale <= 1}
            onClick={() => setScale((s) => clamp(s - 0.25))}
          >
            −
          </button>
          <output aria-live="polite">{Math.round(scale * 100)}%</output>
          <button
            className="a11y-control"
            aria-label="Ampliar imagem"
            disabled={scale >= 4}
            onClick={() => setScale((s) => clamp(s + 0.25))}
          >
            +
          </button>
          <button className="a11y-control" onClick={() => setScale(1)}>
            Tamanho original
          </button>
        </div>
        <div
          className="image-zoom-viewport max-h-[55vh] overflow-auto rounded-xl bg-surface"
          tabIndex={0}
          role="region"
          aria-label="Imagem ampliada; use as setas para rolar"
          onPointerDown={(event) => {
            pointers.current.set(event.pointerId, {
              x: event.clientX,
              y: event.clientY,
            })
            event.currentTarget.setPointerCapture(event.pointerId)
            previousDistance.current = 0
          }}
          onPointerMove={(event) => {
            if (!pointers.current.has(event.pointerId)) return
            pointers.current.set(event.pointerId, {
              x: event.clientX,
              y: event.clientY,
            })
            const points = [...pointers.current.values()]
            if (points.length !== 2) return
            const distance = Math.hypot(
              points[0].x - points[1].x,
              points[0].y - points[1].y,
            )
            if (previousDistance.current > 0)
              setScale((s) => clamp((s * distance) / previousDistance.current))
            previousDistance.current = distance
          }}
          onPointerUp={(event) => {
            pointers.current.delete(event.pointerId)
            previousDistance.current = 0
          }}
          onPointerCancel={(event) => {
            pointers.current.delete(event.pointerId)
            previousDistance.current = 0
          }}
        >
          <img
            src={src}
            alt="Buddy, a capivara mascote do Money Buddy, em uma paisagem tranquila"
            draggable={false}
            style={{ width: `${scale * 100}%`, maxWidth: "none" }}
          />
        </div>
      </section>
    </div>
  )
}
