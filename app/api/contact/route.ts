import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: {
    rejectUnauthorized: false,
  },
})

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Toate câmpurile sunt obligatorii' }, { status: 400 })
  }

  try {
    await transporter.sendMail({
      from: `"Formular Contact dinamorugby.ro" <contact@dinamorugby.ro>`,
      to: 'contact@dinamorugby.ro',
      replyTo: email,
      subject: `Mesaj nou de la ${name}`,
      text: `Nume: ${name}\nEmail: ${email}\n\nMesaj:\n${message}`,
      html: `
        <h2>Mesaj nou din formularul de contact</h2>
        <p><strong>Nume:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <hr />
        <p><strong>Mesaj:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr />
        <p style="color: #888; font-size: 12px;">Trimis prin formularul de contact de pe dinamorugby.ro</p>
      `,
    })

    return NextResponse.json({ success: true, message: 'Mesajul a fost trimis cu succes!' })
  } catch (error) {
    console.error('Email send error:', error)
    return NextResponse.json({ error: 'Eroare la trimiterea mesajului' }, { status: 500 })
  }
}
