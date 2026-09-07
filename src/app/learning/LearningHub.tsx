"use client"

import React, { useState } from "react"
import { Container } from "@/components/ui/Container"
import { Search, Filter, PlayCircle, Clock, BookOpen, User, BookMarked, ArrowRight } from "lucide-react"
import Link from "next/link"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function LearningHub({ initialCourses }: { initialCourses: any[] }) {
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [levelFilter, setLevelFilter] = useState("")

  const categories = Array.from(new Set(initialCourses.map(c => c.category))).filter(Boolean)
  const levels = Array.from(new Set(initialCourses.map(c => c.level))).filter(Boolean)

  const filteredCourses = initialCourses.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false
    if (categoryFilter && c.category !== categoryFilter) return false
    if (levelFilter && c.level !== levelFilter) return false
    return true
  }).sort((a, b) => (b.orderRank || 0) - (a.orderRank || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="bg-background min-h-screen pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-muted/10 border-b border-border py-20 md:py-32">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] bg-[size:32px]" />
        <Container className="relative">
          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm tracking-wide mb-6">
              TEKNIXX ACADEMY
            </span>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 text-foreground">
              Master the skills of tomorrow.
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
              Build practical expertise with our structured professional courses, tutorials, and technical resources.
            </p>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              placeholder="Search courses, skills, or topics..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg shadow-sm"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative min-w-[200px]">
              <Filter className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <select 
                value={categoryFilter} 
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none font-medium text-lg shadow-sm"
              >
                <option value="">All Categories</option>
                {categories.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
              </select>
            </div>
            <div className="relative min-w-[160px]">
              <select 
                value={levelFilter} 
                onChange={e => setLevelFilter(e.target.value)}
                className="w-full px-4 py-4 bg-card border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none font-medium text-lg shadow-sm"
              >
                <option value="">All Levels</option>
                {levels.map(l => <option key={l as string} value={l as string}>{l as string}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-32 bg-card border-2 border-dashed border-border rounded-3xl">
            <BookOpen className="w-20 h-20 mx-auto mb-6 text-muted-foreground/30" />
            <h3 className="text-3xl font-black mb-3">No courses found</h3>
            <p className="text-xl text-muted-foreground max-w-md mx-auto">
              We couldn&apos;t find any courses matching your current search or filters.
            </p>
            {(search || categoryFilter || levelFilter) && (
              <button 
                onClick={() => { setSearch(""); setCategoryFilter(""); setLevelFilter("") }}
                className="mt-8 px-6 py-3 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map(course => (
              <Link 
                href={`/learning/${course.slug}`} 
                key={course._id.toString()}
                className="group bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <div className="aspect-video bg-muted relative border-b border-border overflow-hidden">
                  {course.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground/30 group-hover:bg-muted/80 transition-colors">
                      <PlayCircle className="w-16 h-16" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1.5 text-xs font-black uppercase tracking-wider bg-background/90 backdrop-blur-md text-foreground rounded-lg shadow-sm">
                      {course.category}
                    </span>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-black leading-tight mb-3 group-hover:text-primary transition-colors">{course.title}</h3>
                  <p className="text-muted-foreground line-clamp-2 mb-6">
                    {course.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-muted-foreground mt-auto">
                    {course.level && (
                      <span className="flex items-center text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                        {course.level}
                      </span>
                    )}
                    {course.duration && (
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" /> {course.duration}
                      </span>
                    )}
                    {course.modules?.length > 0 && (
                      <span className="flex items-center">
                        <BookMarked className="w-4 h-4 mr-1.5" /> {course.modules.length} Modules
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-6 md:px-8 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
                  <div className="flex items-center text-sm font-bold text-muted-foreground">
                    {course.instructor ? (
                      <><User className="w-4 h-4 mr-2" /> {course.instructor}</>
                    ) : (
                      <><BookOpen className="w-4 h-4 mr-2" /> TEKNIXX</>
                    )}
                  </div>
                  <span className="flex items-center text-primary font-bold group-hover:translate-x-1 transition-transform">
                    View Course <ArrowRight className="w-4 h-4 ml-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}
