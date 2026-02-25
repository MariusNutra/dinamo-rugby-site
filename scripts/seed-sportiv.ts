import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const children = await prisma.child.findMany({
    include: { team: true },
  })

  console.log(`Found ${children.length} children to seed sportiv data for.`)

  for (const child of children) {
    // 1. Physical profiles (3 profiles, 3 months apart)
    const now = new Date()
    const baseHeight = 120 + Math.random() * 40 // 120-160cm
    const baseWeight = 25 + Math.random() * 25 // 25-50kg
    const positions = ['Pilar', 'Talonator', 'A doua linie', 'Flanker', 'Nr. 8', 'Mijlocas de grămadă', 'Mijlocas de deschidere', 'Centru', 'Aripa', 'Fundas']

    for (let i = 2; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i * 3)
      await prisma.physicalProfile.create({
        data: {
          childId: child.id,
          date,
          height: Math.round((baseHeight + (2 - i) * 1.5) * 10) / 10,
          weight: Math.round((baseWeight + (2 - i) * 0.8) * 10) / 10,
          position: positions[Math.floor(Math.random() * positions.length)],
        },
      })
    }
    console.log(`  [${child.name}] 3 physical profiles created`)

    // 2. Evaluations (3-4 per quarter, with ascending trend)
    const periods = ['T3 2025', 'T4 2025', 'T1 2026']
    for (let i = 0; i < periods.length; i++) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - (2 - i) * 3)
      const base = 4 + i * 1 + Math.random() * 2
      await prisma.evaluation.create({
        data: {
          childId: child.id,
          date,
          period: periods[i],
          physical: Math.min(10, Math.round(base + Math.random() * 2)),
          technical: Math.min(10, Math.round(base + Math.random() * 2)),
          tactical: Math.min(10, Math.round(base - 0.5 + Math.random() * 2)),
          mental: Math.min(10, Math.round(base + Math.random() * 2)),
          social: Math.min(10, Math.round(base + 0.5 + Math.random() * 2)),
          comments: i === 2 ? 'Progres bun in ultimul trimestru.' : null,
        },
      })
    }
    // Extra eval for some kids
    if (Math.random() > 0.5) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - 1)
      const base = 6 + Math.random() * 2
      await prisma.evaluation.create({
        data: {
          childId: child.id,
          date,
          period: 'Ianuarie 2026',
          physical: Math.min(10, Math.round(base + Math.random() * 2)),
          technical: Math.min(10, Math.round(base + Math.random() * 2)),
          tactical: Math.min(10, Math.round(base + Math.random() * 2)),
          mental: Math.min(10, Math.round(base + Math.random() * 2)),
          social: Math.min(10, Math.round(base + Math.random() * 2)),
        },
      })
    }
    console.log(`  [${child.name}] evaluations created`)

    // 3. Attendances (last 3 months, ~85% rate)
    const attStart = new Date(now)
    attStart.setMonth(attStart.getMonth() - 3)
    let attCount = 0
    for (let d = new Date(attStart); d <= now; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay()
      // Training on Tue, Thu, Sat (1-indexed: 2, 4, 6)
      if (dayOfWeek === 2 || dayOfWeek === 4 || dayOfWeek === 6) {
        const present = Math.random() < 0.85
        await prisma.attendance.create({
          data: {
            childId: child.id,
            date: new Date(d),
            type: dayOfWeek === 6 ? 'meci' : 'antrenament',
            present,
            teamId: child.teamId,
          },
        })
        attCount++
      }
    }
    console.log(`  [${child.name}] ${attCount} attendance records created`)

    // 4. Medical records (1-2: one resolved injury + one active visa)
    await prisma.medicalRecord.create({
      data: {
        childId: child.id,
        date: new Date(now.getFullYear(), now.getMonth() - 2, 15),
        type: 'Accidentare',
        description: 'Entorsa glezna dreapta la antrenament',
        severity: 'Usoara',
        returnDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        resolved: true,
      },
    })

    await prisma.medicalRecord.create({
      data: {
        childId: child.id,
        date: new Date(now.getFullYear(), now.getMonth(), 1),
        type: 'Viza medicala',
        description: 'Viza medicala anuala - valabila pana la ' + new Date(now.getFullYear() + 1, now.getMonth(), 1).toLocaleDateString('ro-RO'),
        severity: null,
        returnDate: null,
        resolved: false,
      },
    })
    console.log(`  [${child.name}] 2 medical records created`)

    // 5. Photos (2-3 placeholders only if photoConsent)
    if (child.photoConsent) {
      const events = ['Turneu Mini Rugby', 'Antrenament', 'Festival Rugby']
      for (let i = 0; i < 2 + (Math.random() > 0.5 ? 1 : 0); i++) {
        await prisma.childPhoto.create({
          data: {
            childId: child.id,
            url: `/uploads/placeholder-${(i + 1)}.jpg`,
            caption: `${events[i % events.length]} - ${child.name}`,
            event: events[i % events.length],
            date: new Date(now.getFullYear(), now.getMonth() - i, 10),
          },
        })
      }
      console.log(`  [${child.name}] photos created (has consent)`)
    } else {
      console.log(`  [${child.name}] skipped photos (no consent)`)
    }
  }

  console.log('\nSeed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
