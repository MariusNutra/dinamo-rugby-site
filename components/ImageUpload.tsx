'use client'

import { useState, useCallback, useId } from 'react'

interface ImageUploadProps {
  onUpload: (files: File[]) => void
  multiple?: boolean
  label?: string
}

export default function ImageUpload({ onUpload, multiple = true, label = 'Încarcă imagini' }: ImageUploadProps) {
  const inputId = useId()
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) onUpload(files)
  }, [onUpload])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) onUpload(files)
  }

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragActive ? 'border-dinamo-red bg-red-50' : 'border-gray-300 hover:border-dinamo-red'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById(inputId)?.click()}
    >
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      <div className="text-4xl mb-2">📸</div>
      <p className="font-medium text-gray-700">{label}</p>
      <p className="text-sm text-gray-500 mt-1">Trage și plasează sau click pentru a selecta</p>
      <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 1920px, compresie automată</p>
    </div>
  )
}
