"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronUp, PlayCircle, FileText, Link as LinkIcon, Lock } from "lucide-react"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function CourseCurriculum({ modules }: { modules: any[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleModule = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (!modules || modules.length === 0) {
    return <p className="text-muted-foreground italic">Curriculum details coming soon.</p>
  }

  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {modules.map((module: any, index: number) => (
        <div key={module.id} className="border border-border rounded-xl bg-card overflow-hidden">
          <button 
            onClick={() => toggleModule(module.id)}
            className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
          >
            <div>
              <span className="text-sm font-bold text-muted-foreground mr-3">Module {index + 1}</span>
              <span className="font-bold text-foreground">{module.title}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <span className="text-sm mr-4">{module.lessons?.length || 0} lessons</span>
              {expanded[module.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>
          
          {expanded[module.id] && module.lessons?.length > 0 && (
            <div className="p-2 border-t border-border">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {module.lessons.map((lesson: any, lIndex: number) => (
                <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg hover:bg-muted/10 transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
                      {lesson.videoUrl ? <PlayCircle className="w-5 h-5" /> : 
                       lesson.externalResource ? <LinkIcon className="w-5 h-5" /> : 
                       <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">
                        <span className="text-muted-foreground mr-2">{index + 1}.{lIndex + 1}</span>
                        {lesson.title}
                      </p>
                      {lesson.content && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 pr-4">{lesson.content}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-0 pl-8 sm:pl-0">
                    <span className="inline-flex items-center text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                      <Lock className="w-3 h-3 mr-1" /> Locked
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
