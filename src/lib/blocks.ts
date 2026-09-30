import clientPromise from "@/lib/mongodb"

export type BlockType = "cta" | "banner" | "hero" | "announcement" | "html"
export type BlockPlacement = "global" | "home" | "services" | "about" | "portfolio" | "blog" | "careers" | "store" | "learning"
export type BlockStatus = "Published" | "Draft" | "Archived" | "Disabled"

export interface ContentBlockAction {
  label: string
  href: string
}

export interface ContentBlockDoc {
  _id?: string
  identifier: string
  title: string
  type: BlockType
  placement: BlockPlacement
  heading: string
  description: string
  badge?: string
  primaryAction: ContentBlockAction
  secondaryAction?: ContentBlockAction
  customHtml?: string
  imageUrl?: string
  status: BlockStatus
  orderRank: number
  isProtected?: boolean
  createdAt: string
  updatedAt: string
}

export const FALLBACK_BLOCKS: ContentBlockDoc[] = [
  {
    identifier: "home-cta",
    title: "Home Page Primary Call to Action",
    type: "cta",
    placement: "home",
    heading: "Have a project in mind?",
    description: "Let's discuss what you need and determine the right approach.",
    badge: "GET STARTED",
    primaryAction: {
      label: "Start a Project",
      href: "/contact/",
    },
    secondaryAction: {
      label: "View Our Services",
      href: "/services/",
    },
    status: "Published",
    orderRank: 1,
    isProtected: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    identifier: "services-cta",
    title: "Services Tailored Solution Callout",
    type: "cta",
    placement: "services",
    heading: "Need a tailored solution?",
    description: "Every business is unique. Let's discuss your specific requirements and architect the right approach together.",
    badge: "CUSTOM ARCHITECTURE",
    primaryAction: {
      label: "Contact Us",
      href: "/contact/",
    },
    secondaryAction: {
      label: "View Portfolio",
      href: "/portfolio/",
    },
    status: "Published",
    orderRank: 1,
    isProtected: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    identifier: "portfolio-cta",
    title: "Portfolio Consultation Callout",
    type: "cta",
    placement: "portfolio",
    heading: "Discuss your next project",
    description: "Reviewing our work is just the first step. Contact us to see how these approaches translate to your specific business requirements.",
    badge: "CASE STUDIES",
    primaryAction: {
      label: "Contact Us",
      href: "/contact/",
    },
    secondaryAction: {
      label: "Explore Services",
      href: "/services/",
    },
    status: "Published",
    orderRank: 1,
    isProtected: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    identifier: "about-cta",
    title: "About Us Ready to Discuss CTA",
    type: "cta",
    placement: "about",
    heading: "Ready to discuss your project?",
    description: "Let's talk about your business requirements and explore how we can help.",
    badge: "LET'S TALK",
    primaryAction: {
      label: "Start a Project",
      href: "/contact/",
    },
    secondaryAction: {
      label: "View Services",
      href: "/services/",
    },
    status: "Published",
    orderRank: 1,
    isProtected: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    identifier: "blog-cta",
    title: "Blog & Insights Engagement Block",
    type: "cta",
    placement: "blog",
    heading: "Looking for technical expertise?",
    description: "Our team translates complex technical concepts into reliable business solutions.",
    badge: "EXPERT PERSPECTIVES",
    primaryAction: {
      label: "Contact Us",
      href: "/contact/",
    },
    secondaryAction: {
      label: "Read More Insights",
      href: "/blog/",
    },
    status: "Published",
    orderRank: 1,
    isProtected: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
  {
    identifier: "global-talent-banner",
    title: "Talent & Careers Announcement Banner",
    type: "banner",
    placement: "careers",
    heading: "We are expanding our core engineering network",
    description: "Submit your resume to get matched with upcoming high-impact technical initiatives.",
    badge: "HIRING",
    primaryAction: {
      label: "Join Talent Network",
      href: "/careers/",
    },
    status: "Published",
    orderRank: 1,
    isProtected: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  }
]

export async function getContentBlocks(options?: {
  placement?: string
  type?: string
  status?: string
}): Promise<ContentBlockDoc[]> {
  try {
    const client = await clientPromise
    const db = client.db("accenture")

    const query: Record<string, unknown> = {}
    if (options?.placement && options.placement !== "all") query.placement = options.placement
    if (options?.type && options.type !== "all") query.type = options.type
    if (options?.status && options.status !== "all") query.status = options.status

    const blocks = await db
      .collection("contentBlocks")
      .find(query)
      .sort({ orderRank: 1, createdAt: -1 })
      .toArray()

    if (blocks.length === 0 && (!options?.status || options.status === "Published" || options.status === "all")) {
      return FALLBACK_BLOCKS.filter((b) => {
        if (options?.placement && options.placement !== "all" && b.placement !== options.placement) return false
        if (options?.type && options.type !== "all" && b.type !== options.type) return false
        if (options?.status && options.status !== "all" && b.status !== options.status) return false
        return true
      })
    }

    return blocks.map((b) => ({
      _id: b._id.toString(),
      identifier: b.identifier,
      title: b.title,
      type: b.type,
      placement: b.placement,
      heading: b.heading,
      description: b.description,
      badge: b.badge,
      primaryAction: b.primaryAction,
      secondaryAction: b.secondaryAction,
      customHtml: b.customHtml,
      imageUrl: b.imageUrl,
      status: b.status,
      orderRank: b.orderRank || 0,
      isProtected: b.isProtected || false,
      createdAt: b.createdAt || new Date().toISOString(),
      updatedAt: b.updatedAt || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Failed to fetch content blocks from DB:", error)
    return FALLBACK_BLOCKS
  }
}

export async function getBlockByIdentifier(identifier: string): Promise<ContentBlockDoc | null> {
  try {
    const client = await clientPromise
    const db = client.db("accenture")

    const block = await db.collection("contentBlocks").findOne({ identifier })
    if (block) {
      if (block.status === "Disabled" || block.status === "Archived") {
        return null
      }
      return {
        _id: block._id.toString(),
        identifier: block.identifier,
        title: block.title,
        type: block.type,
        placement: block.placement,
        heading: block.heading,
        description: block.description,
        badge: block.badge,
        primaryAction: block.primaryAction,
        secondaryAction: block.secondaryAction,
        customHtml: block.customHtml,
        imageUrl: block.imageUrl,
        status: block.status,
        orderRank: block.orderRank || 0,
        isProtected: block.isProtected || false,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      }
    }

    const fallback = FALLBACK_BLOCKS.find((b) => b.identifier === identifier)
    return fallback || null
  } catch (error) {
    console.error("Failed to fetch block by identifier:", error)
    return FALLBACK_BLOCKS.find((b) => b.identifier === identifier) || null
  }
}
