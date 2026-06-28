import type { Toast } from '../_types'

interface ToastStackProps {
  toasts: Toast[]
}

export default function ToastStack({ toasts }: ToastStackProps) {
  return (
    <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-xl text-sm font-medium animate-[slideUp_0.3s_ease-out] max-w-sm ${
            toast.type === 'error'
              ? 'bg-red-600 text-white'
              : toast.type === 'info'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-900 text-white'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  )
}
