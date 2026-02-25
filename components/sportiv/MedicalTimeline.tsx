'use client'

interface MedicalRecord {
  id: string
  date: string
  type: string
  description: string
  severity: string | null
  returnDate: string | null
  resolved: boolean
}

interface Props {
  records: MedicalRecord[]
  onResolve?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function MedicalTimeline({ records, onResolve, onDelete }: Props) {
  if (records.length === 0) return <p className="text-gray-400 text-sm text-center py-8">Nu exista inregistrari medicale.</p>

  const getBadge = (record: MedicalRecord) => {
    if (record.resolved) return { color: 'bg-green-100 text-green-800', label: 'Rezolvat' }
    if (record.returnDate && new Date(record.returnDate) > new Date()) return { color: 'bg-yellow-100 text-yellow-800', label: 'Recuperare' }
    return { color: 'bg-red-100 text-red-800', label: 'Activ' }
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="space-y-4">
        {records.map(record => {
          const badge = getBadge(record)
          return (
            <div key={record.id} className="relative pl-10">
              <div className={`absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 border-white ${record.resolved ? 'bg-green-500' : 'bg-red-500'}`} />
              <div className="bg-white border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{record.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>{badge.label}</span>
                    {record.severity && (
                      <span className="text-xs text-gray-500">({record.severity})</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(record.date).toLocaleDateString('ro-RO')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{record.description}</p>
                {record.returnDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Data revenire: {new Date(record.returnDate).toLocaleDateString('ro-RO')}
                  </p>
                )}
                {(onResolve || onDelete) && (
                  <div className="flex gap-2 mt-2">
                    {onResolve && !record.resolved && (
                      <button onClick={() => onResolve(record.id)} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100">
                        Marcheaza rezolvat
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(record.id)} className="text-xs text-red-500 px-2 py-1 rounded hover:bg-red-50">
                        Sterge
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
