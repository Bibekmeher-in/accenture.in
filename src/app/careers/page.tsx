import { Metadata } from "next"
import { CareersClient } from "./CareersClient"

export const metadata: Metadata = {
  title: "Careers | TEKNIXX",
  description: "Join our talent network. Upload your resume and we will contact you if a suitable position becomes available.",
}

export default function CareersPage() {
  return <CareersClient />
}
