'use client'

import { useState } from 'react'

interface Video {
  id: number
  title: string
  youtubeUrl: string
  description: string | null
  grupa: string | null
  createdAt: string
}

interface Team {
  grupa: string
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (watchMatch) return watchMatch[1]
  const embedMatch = url.match(/\/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return embedMatch[1]
  const vMatch = url.match(/\/v\/([a-zA-Z0-9_-]{11})/)
  if (vMatch) return vMatch[1]
  return null
}

export default function VideoHighlightsClient({ videos: allVideos, teams }: { videos: Video[]; teams: Team[] }) {
  const [selectedTeam, setSelectedTeam] = useState('')

  const videos = selectedTeam ? allVideos.filter(v => v.grupa === selectedTeam) : allVideos

  return (
    <>
      <section className="bg-dinamo-blue text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center fade-in">
          <h1 className="font-heading font-extrabold text-4xl md:text-5xl mb-2">Video Highlights</h1>
          <p className="text-lg opacity-80">Cele mai bune momente de pe teren</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Team filter */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <select
              value={selectedTeam}
              onChange={e => setSelectedTeam(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-5 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-dinamo-red focus:border-dinamo-red outline-none cursor-pointer"
            >
              <option value="">Toate echipele</option>
              {teams.map(team => (
                <option key={team.grupa} value={team.grupa}>
                  {team.grupa}
                </option>
              ))}
            </select>
            <svg className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>
            </div>
            <h2 className="font-heading text-xl font-bold text-dinamo-blue mb-2">Niciun video disponibil</h2>
            <p className="text-gray-500">
              {selectedTeam
                ? `Nu există video-uri pentru echipa ${selectedTeam}. Încearcă altă echipă.`
                : 'Video-urile vor fi adăugate în curând. Reveniți pentru noutăți!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {videos.map(video => {
              const videoId = extractYouTubeId(video.youtubeUrl)
              return (
                <div
                  key={video.id}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-gray-900">
                    {videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={video.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-heading font-bold text-lg text-gray-900">{video.title}</h3>
                      {video.grupa && (
                        <span className="flex-shrink-0 px-2.5 py-0.5 bg-dinamo-blue text-white text-xs font-bold rounded-full">
                          {video.grupa}
                        </span>
                      )}
                    </div>
                    {video.description && (
                      <p className="text-gray-500 text-sm line-clamp-2">{video.description}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
