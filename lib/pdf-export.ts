import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function setupDoc(title: string): jsPDF {
  const doc = new jsPDF()
  // Header
  doc.setFontSize(18)
  doc.setTextColor(0, 51, 102) // dinamo blue
  doc.text('Dinamo Rugby Juniori', 14, 15)
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(title, 14, 23)
  doc.setFontSize(8)
  doc.text(`Generat: ${new Date().toLocaleDateString('ro-RO')} ${new Date().toLocaleTimeString('ro-RO')}`, 14, 29)
  doc.setDrawColor(200, 0, 0) // dinamo red
  doc.setLineWidth(0.5)
  doc.line(14, 32, 196, 32)
  return doc
}

export function exportFisaSportiv(data: {
  name: string
  birthYear: number
  team: string
  parent: string
  evaluations: { date: string; period: string; physical: number; technical: number; tactical: number; mental: number; social: number }[]
  attendanceStats: { total: number; present: number; percent: number }
}) {
  const doc = setupDoc(`Fisa Sportiv: ${data.name}`)

  let y = 38
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Nume: ${data.name}`, 14, y); y += 6
  doc.text(`An nastere: ${data.birthYear}`, 14, y); y += 6
  doc.text(`Echipa: ${data.team}`, 14, y); y += 6
  doc.text(`Parinte: ${data.parent}`, 14, y); y += 10

  // Attendance summary
  doc.setFontSize(12)
  doc.setTextColor(0, 51, 102)
  doc.text('Prezente', 14, y); y += 6
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.text(`Total sesiuni: ${data.attendanceStats.total} | Prezent: ${data.attendanceStats.present} | Procent: ${data.attendanceStats.percent}%`, 14, y)
  y += 10

  // Evaluations table
  if (data.evaluations.length > 0) {
    doc.setFontSize(12)
    doc.setTextColor(0, 51, 102)
    doc.text('Evaluari', 14, y); y += 2

    autoTable(doc, {
      startY: y,
      head: [['Data', 'Perioada', 'Fizic', 'Tehnic', 'Tactic', 'Mental', 'Social', 'Media']],
      body: data.evaluations.map(e => [
        new Date(e.date).toLocaleDateString('ro-RO'),
        e.period,
        e.physical,
        e.technical,
        e.tactical,
        e.mental,
        e.social,
        ((e.physical + e.technical + e.tactical + e.mental + e.social) / 5).toFixed(1),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 51, 102] },
    })
  }

  doc.save(`fisa-sportiv-${data.name.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

export function exportPrezente(data: {
  team: string
  month: string
  records: { name: string; dates: string[]; presentDates: string[] }[]
}) {
  const doc = setupDoc(`Raport Prezente: ${data.team} - ${data.month}`)

  const allDates = Array.from(new Set(data.records.flatMap(r => r.dates))).sort()

  autoTable(doc, {
    startY: 38,
    head: [['Sportiv', ...allDates.map(d => new Date(d).getDate().toString())]],
    body: data.records.map(r => [
      r.name,
      ...allDates.map(d => r.presentDates.includes(d) ? 'P' : 'A'),
    ]),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [0, 51, 102], fontSize: 6 },
    columnStyles: { 0: { cellWidth: 35 } },
  })

  doc.save(`prezente-${data.team}-${data.month}.pdf`)
}

export function exportListaEchipa(data: {
  team: string
  players: { name: string; birthYear: number; parent: string; phone: string }[]
}) {
  const doc = setupDoc(`Lista Echipa: ${data.team}`)

  autoTable(doc, {
    startY: 38,
    head: [['#', 'Nume Sportiv', 'An nastere', 'Parinte', 'Telefon']],
    body: data.players.map((p, i) => [i + 1, p.name, p.birthYear, p.parent, p.phone]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [0, 51, 102] },
  })

  doc.save(`lista-echipa-${data.team}.pdf`)
}

export function exportRaportPlati(data: {
  title: string
  payments: { name: string; child: string; amount: number; type: string; status: string; date: string }[]
  totalPaid: number
  totalPending: number
}) {
  const doc = setupDoc(data.title)

  let y = 38
  doc.setFontSize(10)
  doc.text(`Total incasat: ${data.totalPaid.toLocaleString('ro-RO')} RON`, 14, y); y += 6
  doc.text(`Total restante: ${data.totalPending.toLocaleString('ro-RO')} RON`, 14, y); y += 8

  autoTable(doc, {
    startY: y,
    head: [['Parinte', 'Sportiv', 'Suma (RON)', 'Tip', 'Status', 'Data']],
    body: data.payments.map(p => [
      p.name,
      p.child,
      p.amount.toLocaleString('ro-RO'),
      p.type,
      p.status === 'paid' ? 'Platit' : p.status === 'pending' ? 'In asteptare' : p.status,
      new Date(p.date).toLocaleDateString('ro-RO'),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 51, 102] },
  })

  doc.save(`raport-plati-${new Date().toISOString().split('T')[0]}.pdf`)
}
