import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { site } from '#/content/site'
import { sendContact } from '#/server/contact'

type State = { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string }

export function ContactForm() {
  const [state, setState] = useState<State>({ kind: 'idle' })
  const form = useRef<HTMLFormElement>(null)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    setState({ kind: 'sending' })
    try {
      const res = await sendContact({
        data: {
          name: String(fd.get('name') ?? ''),
          email: String(fd.get('email') ?? ''),
          message: String(fd.get('message') ?? ''),
          company: String(fd.get('company') ?? ''),
        },
      })
      if (res.ok) {
        setState({ kind: 'sent' })
        form.current?.reset()
      } else setState({ kind: 'error', message: res.error })
    } catch {
      setState({ kind: 'error', message: `Sending failed. Please email me directly at ${site.email}.` })
    }
  }

  const field =
    'w-full border border-[var(--line)] bg-[rgba(11,12,14,0.7)] px-4 py-3 text-[17px] text-[var(--ink)] placeholder:text-[#7d8087] transition-colors focus:border-[var(--heat)] focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--heat)]'

  return (
    <form ref={form} onSubmit={submit} className="grid gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="mono text-[var(--muted)]">Name</span>
          <input name="name" required autoComplete="name" className={field} />
        </label>
        <label className="grid gap-2">
          <span className="mono text-[var(--muted)]">Email</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="mono text-[var(--muted)]">What are you building?</span>
        <textarea name="message" required rows={5} className={`${field} resize-y`} />
      </label>
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button type="submit" className="heat" disabled={state.kind === 'sending'}>
          <span className="heat__label">{state.kind === 'sending' ? 'Sending' : 'Send message'}</span>
          <span className="heat__arrow" aria-hidden="true">
            →
          </span>
        </button>
        <p role="status" aria-live="polite" className="text-[15px]">
          {state.kind === 'sent' && <span className="text-[var(--ink)]">Received. Thank you, I will get back to you soon.</span>}
          {state.kind === 'error' && <span className="text-[var(--heat-soft)]">{state.message}</span>}
        </p>
      </div>
    </form>
  )
}
