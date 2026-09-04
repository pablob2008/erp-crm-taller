import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UnifiedPurchaseItem } from "@/lib/services/purchases";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PurchaseExpenseModalProps {
  /** The item to fulfil. null/undefined means the modal is closed. */
  item: UnifiedPurchaseItem | null;
  /** Called when the user confirms the purchase with payment details. */
  onConfirm: (item: UnifiedPurchaseItem, amount: number, method: string, note: string) => Promise<void>;
  /** Called when the user cancels or closes the dialog. */
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Shared modal for capturing payment details when fulfilling any purchase.
 * Used by both the Purchases Board (InventoryPage) and the PurchasesTab inside
 * work order details.
 */
export function PurchaseExpenseModal({ item, onConfirm, onClose }: PurchaseExpenseModalProps) {
  const isOpen = item != null;

  const [amount, setAmount] = useState<number>(item?.estimatedCost ?? 0);
  const [method, setMethod] = useState<string>("cash");
  const [note, setNote] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Reset state whenever a new item is opened
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setAmount(0);
      setMethod("cash");
      setNote("");
    }
  };

  // Sync amount default when item changes
  const defaultAmount = item?.estimatedCost ?? 0;

  const handleConfirm = async () => {
    if (!item) return;
    setLoading(true);
    try {
      await onConfirm(item, amount || defaultAmount, method, note);
      // Parent is responsible for closing via onClose after success
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {item?.source === "work_order_item"
              ? "Registrar Compra de Repuesto"
              : "Registrar Compra Recibida"}
          </DialogTitle>
          {item && (
            <p className="text-sm text-muted-foreground pt-1 leading-snug">
              <span className="font-medium text-foreground">{item.title}</span>
              {item.workOrderCode && (
                <> &mdash; Orden <span className="font-mono">{item.workOrderCode}</span></>
              )}
            </p>
          )}
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="expense-amount">Costo ($)</Label>
            <Input
              id="expense-amount"
              type="number"
              step="0.01"
              min="0"
              className="shadow-neu-inset bg-background/50 border border-border/40"
              value={amount === 0 ? "" : amount}
              placeholder={defaultAmount > 0 ? String(defaultAmount) : "0.00"}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>

          {/* Payment method */}
          <div className="grid gap-2">
            <Label htmlFor="expense-method">Método de Pago</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger
                id="expense-method"
                className="w-full shadow-neu-inset bg-background/50 border border-border/40"
              >
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Efectivo</SelectItem>
                <SelectItem value="card">Tarjeta</SelectItem>
                <SelectItem value="transfer">Transferencia</SelectItem>
                <SelectItem value="qr">QR</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional note */}
          <div className="grid gap-2">
            <Label htmlFor="expense-note">Nota (Opcional)</Label>
            <Textarea
              id="expense-note"
              placeholder="Ej. Factura #1234, comprado en Tienda XYZ"
              className="shadow-neu-inset bg-background/50 border border-border/40 resize-none"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Compra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
