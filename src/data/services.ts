import {
  Code,
  Layout,
  Server,
  Cloud,
  Zap,
  Wrench,
  Shield,
  Smartphone,
  Database,
  Cpu,
  Layers,
  Globe,
  Terminal,
  Settings,
  LayoutTemplate,
  LucideIcon
} from "lucide-react"

export type Service = {
  _id?: string
  slug: string
  title: string
  description: string
  icon: LucideIcon
  iconName?: string
  introduction: string
  covers: string[]
  benefits: string[]
  status?: "Published" | "Draft"
  orderRank?: number
  createdAt?: string
  updatedAt?: string
}

const ICON_MAP: Record<string, LucideIcon> = {
  Code,
  Layout,
  Server,
  Cloud,
  Zap,
  Wrench,
  Shield,
  Smartphone,
  Database,
  Cpu,
  Layers,
  Globe,
  Terminal,
  Settings,
  LayoutTemplate,
}

export function resolveIcon(name?: string): LucideIcon {
  if (!name) return LayoutTemplate
  return ICON_MAP[name] || LayoutTemplate
}

export const fallbackServices: Service[] = [
  {
    slug: "web-development",
    title: "Web Development",
    description: "Responsive, high-performance web applications built with modern frameworks and best practices.",
    icon: Code,
    iconName: "Code",
    introduction: "We build modern, scalable web applications designed to perform reliably across all devices. Our focus is on clean architecture, fast load times, and maintainable codebases.",
    covers: [
      "Custom Web Applications",
      "E-Commerce Platforms",
      "Progressive Web Apps (PWAs)",
      "Legacy System Modernization"
    ],
    benefits: [
      "Improved performance and load times",
      "Responsive experiences across all screen sizes",
      "Scalable architecture prepared for future growth",
      "Secure and maintainable code"
    ],
    status: "Published",
    orderRank: 1
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    description: "User-centric interface design focusing on clarity, accessibility, and professional aesthetics.",
    icon: Layout,
    iconName: "Layout",
    introduction: "Our design process bridges the gap between complex business requirements and intuitive user experiences. We prioritize clarity, accessibility, and functional aesthetics over unnecessary decoration.",
    covers: [
      "User Interface Design",
      "User Experience Strategy",
      "Design Systems & Pattern Libraries",
      "Prototyping & Wireframing"
    ],
    benefits: [
      "Intuitive and frictionless user journeys",
      "Consistent brand experience across platforms",
      "Accessible designs meeting WCAG standards",
      "Reduced development friction through clear specifications"
    ],
    status: "Published",
    orderRank: 2
  },
  {
    slug: "software-development",
    title: "Software Solutions",
    description: "Custom software development addressing specific business requirements and workflows.",
    icon: Server,
    iconName: "Server",
    introduction: "We engineer bespoke software solutions tailored to solve specific operational challenges. From internal tools to customer-facing platforms, we focus on robustness and business alignment.",
    covers: [
      "Custom Business Software",
      "API Design & Development",
      "System Integration",
      "Internal Tooling & Dashboards"
    ],
    benefits: [
      "Solutions exactly matched to your workflows",
      "Streamlined operations and data management",
      "Integration with existing business systems",
      "High reliability and test coverage"
    ],
    status: "Published",
    orderRank: 3
  },
  {
    slug: "cloud-infrastructure",
    title: "Cloud & Infrastructure",
    description: "Scalable, secure cloud environments configured for reliability and cost-efficiency.",
    icon: Cloud,
    iconName: "Cloud",
    introduction: "We design and implement modern cloud infrastructure that supports your applications securely and efficiently. We focus on automated deployments and resilient architectures.",
    covers: [
      "Cloud Architecture Design",
      "Deployment Automation (CI/CD)",
      "Serverless Architecture",
      "Infrastructure Migration"
    ],
    benefits: [
      "High availability and fault tolerance",
      "Automated and predictable deployments",
      "Optimized resource utilization and costs",
      "Enhanced security and compliance"
    ],
    status: "Published",
    orderRank: 4
  },
  {
    slug: "digital-solutions",
    title: "Digital Solutions",
    description: "End-to-end digital transformation strategies bringing traditional workflows online.",
    icon: Zap,
    iconName: "Zap",
    introduction: "We help organizations transition traditional processes into efficient digital workflows. Our approach ensures technology serves the business, not the other way around.",
    covers: [
      "Workflow Digitization",
      "Technical Consulting",
      "Platform Evaluation",
      "Digital Strategy Planning"
    ],
    benefits: [
      "Reduced manual operational overhead",
      "Centralized data and reporting",
      "Clear technological roadmaps",
      "Modernized business capabilities"
    ],
    status: "Published",
    orderRank: 5
  },
  {
    slug: "maintenance-support",
    title: "Maintenance & Support",
    description: "Ongoing technical support, performance optimization, and system maintenance.",
    icon: Wrench,
    iconName: "Wrench",
    introduction: "Software requires continuous attention to remain secure and performant. We provide structured maintenance and improvement services for existing digital products.",
    covers: [
      "Security Updates & Patching",
      "Performance Monitoring",
      "Codebase Refactoring",
      "Feature Enhancements"
    ],
    benefits: [
      "Minimized downtime and disruption",
      "Up-to-date security profiles",
      "Continuous optimization of performance",
      "Predictable technical overhead"
    ],
    status: "Published",
    orderRank: 6
  }
]

// Export static array for backward compatibility
export const services = fallbackServices
