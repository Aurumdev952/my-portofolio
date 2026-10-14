import { createServerFn } from '@tanstack/react-start'

export type ContactInput = { name: string; email: string; message: string; company?: string }
export type ContactResult = { ok: true } | { ok: false; error: string }

function clean(v: unknown, max: number) {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export const sendContact = createServerFn({ method: 'POST' })
  .validator((input: unknown): ContactInput => {
    const d = (input ?? {}) as Record<string, unknown>
    return {
      name: clean(d.name, 120),
      email: clean(d.email, 200),
      message: clean(d.message, 5000),
      company: clean(d.company, 200),
    }
  })
  .handler(async ({ data }): Promise<ContactResult> => {
    // Honeypot: real people never fill the hidden field.
    if (data.company) return { ok: true }
    if (!data.name || !data.message) return { ok: false, error: 'Please add your name and a message.' }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { ok: false, error: 'That email address does not look right.' }

    const key = process.env.RESEND_API_KEY
    if (!key) {
      return {
        ok: false,
        error: 'The contact form is not connected yet. Please email me directly at benjamugi20072@gmail.com.',
      }
    }
    const { Resend } = await import('resend')
    const resend = new Resend(key)
    const to = process.env.CONTACT_TO ?? 'benjamugi20072@gmail.com'
    const from = process.env.CONTACT_FROM ?? 'Portfolio <onboarding@resend.dev>'
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: data.email,
      subject: `Portfolio message from ${data.name}`,
      text: `${data.message}\n\nFrom: ${data.name} <${data.email}>`,
    })
    if (error) return { ok: false, error: 'Sending failed. Please try again, or email me directly.' }
    return { ok: true }
  })
