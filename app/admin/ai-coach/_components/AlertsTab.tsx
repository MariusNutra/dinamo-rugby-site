import type { OverviewAlert } from '../_types'
import { getSeverityStyles } from './severityStyles'

interface AlertsTabProps {
  loadingAlerts: boolean
  alerts: OverviewAlert[]
  onAnalyze: (childId: string) => void
}

export function AlertsTab({ loadingAlerts, alerts, onAnalyze }: AlertsTabProps) {
  return (
    <div>
      {loadingAlerts ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700">Totul este in regula!</h3>
          <p className="text-gray-500 mt-1">Nu exista alerte active in acest moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Group by severity */}
          {['high', 'medium', 'low'].map(severity => {
            const severityAlerts = alerts.filter(a => a.severity === severity)
            if (severityAlerts.length === 0) return null
            const severityLabels: Record<string, string> = {
              high: 'Alerte Critice',
              medium: 'Avertizari',
              low: 'Informatii',
            }
            return (
              <div key={severity}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {severityLabels[severity]} ({severityAlerts.length})
                </h3>
                <div className="space-y-2 mb-4">
                  {severityAlerts.map((alert, idx) => {
                    const styles = getSeverityStyles(alert.severity)
                    return (
                      <div
                        key={idx}
                        className={`border-l-4 ${styles.border} ${styles.bg} rounded-r-lg p-4 flex items-start gap-3`}
                      >
                        <div className={`w-8 h-8 rounded-full ${styles.iconBg} ${styles.iconColor} flex items-center justify-center flex-shrink-0`}>
                          {styles.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm">{alert.title}</p>
                          <p className="text-gray-600 text-sm mt-0.5">{alert.message}</p>
                        </div>
                        {alert.childId && (
                          <button
                            onClick={() => onAnalyze(alert.childId!)}
                            className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors flex-shrink-0"
                          >
                            Analizeaza
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
