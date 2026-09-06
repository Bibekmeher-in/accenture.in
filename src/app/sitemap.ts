import { MetadataRoute } from 'next'
import { getBlogPosts } from '@/data/blog'
import { getProjects } from '@/data/projects'
import { services } from '@/data/services' // Assuming services is static as per earlier phases

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getBlogPosts()
  const portfolioProjects = await getProjects()

  // Static routes
  const routes = [
    '',
    '/about',
    '/services',
    '/portfolio',
    '/blog',
    '/contact',
    '/privacy-policy',
    '/terms-and-conditions',
    '/cookie-policy',
  ].map((route) => ({
    url: `${baseUrl}${route}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic Blog Routes
  const blogRoutes = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}/`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Dynamic Service Routes
  const serviceRoutes = services.map((service) => ({
    url: `${baseUrl}/services/${service.slug}/`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Dynamic Portfolio Routes
  const portfolioRoutes = portfolioProjects.map(() => ({
    url: `${baseUrl}/portfolio/`, // Should ideally be /portfolio/[slug] but projects only have IDs right now. We'll point to /portfolio
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...routes, ...blogRoutes, ...serviceRoutes, ...portfolioRoutes]
}
