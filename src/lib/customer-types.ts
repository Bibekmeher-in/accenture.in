import { ObjectId } from "mongodb"

export interface CustomerAddress {
  id: string
  fullName: string
  phone: string
  streetAddress: string
  city: string
  state: string
  pinCode: string
  isDefault?: boolean
}

export interface CustomerAuthProvider {
  provider: "email" | "google"
  providerId?: string
  linkedAt: string
}

export interface CustomerDoc {
  _id?: ObjectId
  name: string
  email: string
  passwordHash?: string
  phone?: string
  authProviders: CustomerAuthProvider[]
  addresses: CustomerAddress[]
  status: "Active" | "Disabled"
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  resetPasswordToken?: string
  resetPasswordExpires?: string
  emailVerified?: boolean
}

export interface CustomerOrderSummary {
  orderId: string
  createdAt: string
  itemCount: number
  total: number
  orderStatus: string
  paymentStatus: string
  currency: string
}

export type CareerApplicationStatus = 
  | "Pending Review" 
  | "Under Consideration" 
  | "Interviewing" 
  | "Archived" 
  | "Rejected"

export interface CareerApplicationNote {
  author: string
  text: string
  timestamp: string
}

export interface CareerApplicationDoc {
  _id?: ObjectId
  customerId: string
  name: string
  email: string
  phone?: string
  coverNote?: string
  originalFilename: string
  storageKey: string
  filePath: string
  mimeType: string
  fileSize: number
  status: CareerApplicationStatus
  notes: CareerApplicationNote[]
  createdAt: string
  updatedAt: string
}

