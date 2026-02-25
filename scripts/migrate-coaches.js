const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const teams = await p.team.findMany()
  let migrated = 0
  for (const t of teams) {
    if (t.coachName && t.coachName.trim()) {
      const existing = await p.coach.findFirst({ where: { teamId: t.id } })
      if (!existing) {
        await p.coach.create({
          data: {
            name: t.coachName,
            description: t.coachBio || null,
            photo: t.coachPhoto || null,
            order: 0,
            teamId: t.id,
          },
        })
        console.log('Migrated coach for ' + t.grupa + ': ' + t.coachName)
        migrated++
      } else {
        console.log('Coach already exists for ' + t.grupa + ', skipping')
      }
    } else {
      console.log(t.grupa + ': no coach data to migrate')
    }
  }
  console.log('\nTotal migrated: ' + migrated)

  // Verify
  const coaches = await p.coach.findMany({ include: { team: true }, orderBy: { order: 'asc' } })
  console.log('\nAll coaches in DB:')
  coaches.forEach(c => console.log('  ' + c.team.grupa + ': ' + c.name + ' (id=' + c.id + ')'))
}

main().catch(console.error).finally(() => p.$disconnect())
