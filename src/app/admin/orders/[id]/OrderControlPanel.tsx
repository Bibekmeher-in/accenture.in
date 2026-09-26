"use client"

import React, { useState, useTransition } from "react"
import { updateOrderStatus, recordManualOfflinePayment, recordPaymentRefund } from "../actions"
import { AlertCircle, CheckCircle2, ShieldAlert, CreditCard, RefreshCw, Truck } from "lucide-react"

interface ManualPaymentInfo {
  channel?: string
  reference?: string
  notes?: string
  recordedBy?: string
  recordedAt?: string
}

interface RefundInfo {
  reason?: string
  reference?: string
  refundedBy?: string
  refundedAt?: string
}

export function OrderControlPanel({
  orderId,
  currentStatus,
  currentPayment,
  paymentMethod,
  manualPaymentInfo,
  refundInfo,
}: {
  orderId: string
  currentStatus: string
  currentPayment: string
  paymentMethod?: string
  manualPaymentInfo?: ManualPaymentInfo
  refundInfo?: RefundInfo
}) {
  // Fulfillment state
  const [orderStatus, setOrderStatus] = useState(currentStatus)
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isUpdatingStatus, startStatusTransition] = useTransition()

  // Manual payment override state
  const [showManualPayModal, setShowManualPayModal] = useState(false)
  const [payChannel, setPayChannel] = useState("Direct Bank Transfer (NEFT/RTGS/IMPS)")
  const [payReference, setPayReference] = useState("")
  const [payNotes, setPayNotes] = useState("")
  const [payConfirmed, setPayConfirmed] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isUpdatingPayment, startPaymentTransition] = useTransition()

  // Refund state
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState("")
  const [refundRef, setRefundRef] = useState("")
  const [refundConfirmed, setRefundConfirmed] = useState(false)

  const handleUpdateFulfillment = (e: React.FormEvent) => {
    e.preventDefault()
    setStatusMessage(null)

    startStatusTransition(async () => {
      const res = await updateOrderStatus(orderId, orderStatus)
      if (res.error) {
        setStatusMessage({ type: "error", text: res.error })
      } else {
        setStatusMessage({ type: "success", text: "Fulfillment status updated successfully." })
        setTimeout(() => window.location.reload(), 800)
      }
    })
  }

  const handleRecordManualPayment = (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentMessage(null)

    if (!payReference.trim()) {
      setPaymentMessage({ type: "error", text: "Reference / Transaction ID is required." })
      return
    }

    if (!payConfirmed) {
      setPaymentMessage({ type: "error", text: "Please confirm that you have verified this offline payment." })
      return
    }

    startPaymentTransition(async () => {
      const res = await recordManualOfflinePayment(orderId, {
        channel: payChannel,
        reference: payReference,
        notes: payNotes,
      })

      if (res.error) {
        setPaymentMessage({ type: "error", text: res.error })
      } else {
        setPaymentMessage({ type: "success", text: "Manual offline payment recorded in audit log." })
        setShowManualPayModal(false)
        setTimeout(() => window.location.reload(), 800)
      }
    })
  }

  const handleRecordRefund = (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentMessage(null)

    if (!refundReason.trim()) {
      setPaymentMessage({ type: "error", text: "Refund reason is required." })
      return
    }

    if (!refundConfirmed) {
      setPaymentMessage({ type: "error", text: "Please confirm the refund authorization." })
      return
    }

    startPaymentTransition(async () => {
      const res = await recordPaymentRefund(orderId, {
        reason: refundReason,
        reference: refundRef,
      })

      if (res.error) {
        setPaymentMessage({ type: "error", text: res.error })
      } else {
        setPaymentMessage({ type: "success", text: "Refund recorded in audit log." })
        setShowRefundModal(false)
        setTimeout(() => window.location.reload(), 800)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* 1. Fulfillment Lifecycle Control */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Fulfillment Status</h3>
          </div>
          <span className="text-xs text-muted-foreground">Order Lifecycle</span>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === "error"
                ? "bg-destructive/10 border border-destructive/20 text-destructive"
                : "bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
            }`}
          >
            {statusMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateFulfillment} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-semibold text-muted-foreground">Transition Fulfillment Status</label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold focus:ring-2 focus:ring-primary/50"
            >
              <option value="Pending">Pending (Awaiting Confirmation)</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Processing">Processing (Packaging / Prep)</option>
              <option value="Shipped">Shipped (In Transit)</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isUpdatingStatus || orderStatus === currentStatus}
            className="px-5 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:bg-primary/90 transition-all shadow disabled:opacity-40 whitespace-nowrap"
          >
            {isUpdatingStatus ? "Updating..." : "Update Fulfillment Status"}
          </button>
        </form>
      </div>

      {/* 2. Payment Status & Protected Audit Control */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Payment Verification & Gateway State</h3>
          </div>
          <div className="flex items-center gap-2">
            {paymentMethod && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                {paymentMethod === "manual_offline"
                  ? "Manual Offline"
                  : paymentMethod === "online_gateway_pending"
                  ? "Online Checkout"
                  : paymentMethod}
              </span>
            )}
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                currentPayment === "Paid"
                  ? "bg-green-500/10 text-green-600"
                  : currentPayment === "Refunded"
                  ? "bg-purple-500/10 text-purple-600"
                  : currentPayment === "Failed"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-500/10 text-amber-600"
              }`}
            >
              {currentPayment}
            </span>
          </div>
        </div>

        {paymentMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              paymentMessage.type === "error"
                ? "bg-destructive/10 border border-destructive/20 text-destructive"
                : "bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400"
            }`}
          >
            {paymentMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{paymentMessage.text}</span>
          </div>
        )}

        {/* Informational Gateway Notice */}
        <div className="p-3.5 bg-muted/30 border border-border rounded-xl text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Online Gateway Policy (Razorpay Integration Pending)</span>
          </div>
          <p>
            Online store purchases default to <span className="font-semibold text-foreground">Pending</span> payment status.
            Once live payment gateway webhooks are enabled, online transactions will be automatically transitioned to Paid via verified provider callbacks.
          </p>
        </div>

        {/* Existing Payment Details */}
        {currentPayment === "Paid" && manualPaymentInfo && (
          <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-xl space-y-2 text-xs">
            <p className="font-bold text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Manual Offline Payment Recorded
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-muted-foreground pt-1">
              <p><span className="text-foreground font-semibold">Channel:</span> {manualPaymentInfo.channel}</p>
              <p><span className="text-foreground font-semibold">Reference:</span> {manualPaymentInfo.reference}</p>
              <p><span className="text-foreground font-semibold">Authorized By:</span> {manualPaymentInfo.recordedBy}</p>
              <p><span className="text-foreground font-semibold">Date:</span> {new Date(manualPaymentInfo.recordedAt || "").toLocaleString()}</p>
            </div>
            {manualPaymentInfo.notes && (
              <p className="text-muted-foreground pt-1"><span className="text-foreground font-semibold">Notes:</span> {manualPaymentInfo.notes}</p>
            )}
          </div>
        )}

        {currentPayment === "Refunded" && refundInfo && (
          <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-2 text-xs">
            <p className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> Refund Record
            </p>
            <div className="text-muted-foreground space-y-1">
              <p><span className="text-foreground font-semibold">Reason:</span> {refundInfo.reason}</p>
              {refundInfo.reference && <p><span className="text-foreground font-semibold">Ref:</span> {refundInfo.reference}</p>}
              <p><span className="text-foreground font-semibold">Processed By:</span> {refundInfo.refundedBy} on {new Date(refundInfo.refundedAt || "").toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Actions for Payment Override */}
        <div className="pt-2 flex flex-wrap gap-3">
          {currentPayment === "Pending" && !showManualPayModal && (
            <button
              type="button"
              onClick={() => setShowManualPayModal(true)}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl border border-border transition-colors flex items-center gap-2"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              Record Manual Offline Payment (Admin Override)
            </button>
          )}

          {currentPayment === "Paid" && !showRefundModal && (
            <button
              type="button"
              onClick={() => setShowRefundModal(true)}
              className="px-4 py-2 bg-muted hover:bg-muted/80 text-destructive font-bold text-xs rounded-xl border border-border transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Record Manual Refund
            </button>
          )}
        </div>

        {/* Manual Payment Override Form */}
        {showManualPayModal && (
          <form onSubmit={handleRecordManualPayment} className="p-4 bg-background border border-amber-500/30 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Explicit Manual Payment Record
              </h4>
              <button
                type="button"
                onClick={() => setShowManualPayModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              This will transition payment to <span className="font-semibold text-foreground">Paid (Manual Offline)</span> with full audit traceability.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Payment Channel / Method *</label>
                <select
                  value={payChannel}
                  onChange={(e) => setPayChannel(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs"
                >
                  <option value="Direct Bank Transfer (NEFT/RTGS/IMPS)">Direct Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                  <option value="Cheque / Demand Draft">Cheque / Demand Draft</option>
                  <option value="In-Store / POS Terminal">In-Store / POS Terminal</option>
                  <option value="Other Offline Verification">Other Offline Verification</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Transaction / Reference ID *</label>
                <input
                  type="text"
                  placeholder="e.g., UTR-9823741 or Receipt #049"
                  value={payReference}
                  onChange={(e) => setPayReference(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Internal Notes (Optional)</label>
              <input
                type="text"
                placeholder="Additional audit details or invoice reference"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-foreground cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={payConfirmed}
                onChange={(e) => setPayConfirmed(e.target.checked)}
                className="rounded border-border mt-0.5 text-primary focus:ring-primary/50"
              />
              <span>
                I confirm that I have verified receipt of this payment through the specified offline channel and authorize this permanent audit log entry.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManualPayModal(false)}
                className="px-3 py-1.5 bg-muted text-muted-foreground font-semibold text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingPayment || !payConfirmed || !payReference.trim()}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow disabled:opacity-40 transition-colors"
              >
                {isUpdatingPayment ? "Recording..." : "Confirm & Record Manual Payment"}
              </button>
            </div>
          </form>
        )}

        {/* Refund Form */}
        {showRefundModal && (
          <form onSubmit={handleRecordRefund} className="p-4 bg-background border border-destructive/30 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-destructive flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Issue Manual Refund Record
              </h4>
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Reason for Refund *</label>
                <input
                  type="text"
                  placeholder="e.g., Customer requested cancellation / defective item"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Refund Reference ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Bank Refund Ref / Voucher"
                  value={refundRef}
                  onChange={(e) => setRefundRef(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-foreground cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={refundConfirmed}
                onChange={(e) => setRefundConfirmed(e.target.checked)}
                className="rounded border-border mt-0.5 text-destructive focus:ring-destructive/50"
              />
              <span>
                I confirm this refund has been processed and authorize the status change to Refunded.
              </span>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="px-3 py-1.5 bg-muted text-muted-foreground font-semibold text-xs rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatingPayment || !refundConfirmed || !refundReason.trim()}
                className="px-4 py-1.5 bg-destructive text-destructive-foreground font-bold text-xs rounded-lg shadow disabled:opacity-40 transition-colors"
              >
                {isUpdatingPayment ? "Processing..." : "Confirm Refund"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

