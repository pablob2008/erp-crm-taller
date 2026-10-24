import type { PrintFormat } from "./print/PrintableInvoice"
import { SegmentedControl, type SegmentedOption } from "@/components/ui/segmented-control"
import { FileText, Receipt } from "lucide-react"

interface PrintFormatToggleProps {
  value: PrintFormat
  onChange: (format: PrintFormat) => void
}

const formatOptions: SegmentedOption<PrintFormat>[] = [
  { value: "ticket", label: "Ticket 80mm", icon: <Receipt className="w-3.5 h-3.5" /> },
  { value: "A4", label: "Hoja A4", icon: <FileText className="w-3.5 h-3.5" /> },
]

export function PrintFormatToggle({ value, onChange }: PrintFormatToggleProps) {
  return (
    <SegmentedControl
      options={formatOptions}
      value={value}
      onChange={onChange}
      size="sm"
    />
  )
}
