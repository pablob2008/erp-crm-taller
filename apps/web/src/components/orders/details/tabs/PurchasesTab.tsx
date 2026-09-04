import type { WorkOrderComposite } from "@/lib/services/work-order-details"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Pencil, Trash2, Check, X } from "lucide-react"
import { useState } from "react"
import { Label } from "@/components/ui/label"
import { PurchaseExpenseModal } from "@/components/purchases/PurchaseExpenseModal"
import type { UnifiedPurchaseItem } from "@/lib/services/purchases"

interface PurchasesTabProps {
  order: WorkOrderComposite;
  onAddItem: (itemId: string, quantity: number, unitPrice: number) => Promise<void>;
  onUpdateItem: (itemId: string, quantity: number, unitPrice: number) => Promise<void>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onMarkPurchased: (itemId: string, quantity: number, amount: number, method: string, note?: string) => Promise<void>;
}

export function PurchasesTab({ order, onAddItem, onUpdateItem, onDeleteItem, onMarkPurchased }: PurchasesTabProps) {
  const totalParts = order.work_order_items?.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0) || 0;

  const [newItemName, setNewItemName] = useState("")
  const [newItemQty, setNewItemQty] = useState(1)

  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editItemQty, setEditItemQty] = useState(0)
  const [editItemPrice, setEditItemPrice] = useState(0)

  // Purchase Modal State — holds a synthetic UnifiedPurchaseItem for the shared modal
  const [purchasingItem, setPurchasingItem] = useState<UnifiedPurchaseItem | null>(null)

  const handleAddItem = () => {
    if (newItemName.trim()) {
      onAddItem(newItemName, newItemQty, 0)
      setNewItemName("")
      setNewItemQty(1)
    }
  }

  const handleModalConfirm = async (
    _item: UnifiedPurchaseItem,
    amount: number,
    method: string,
    note: string
  ) => {
    if (purchasingItem?.id) {
      const woItem = order.work_order_items?.find((i) => i.id === purchasingItem.id);
      if (woItem) {
        await onMarkPurchased(purchasingItem.id, woItem.quantity, amount, method, note || undefined)
        setPurchasingItem(null)
      }
    }
  }

  return (
    <Card className="border border-border/40 backdrop-blur-md bg-background/40 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Lista de Compras</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add new item */}
        <div className="flex gap-2 mb-6 items-end p-4 bg-background/40 border border-border/40 shadow-sm backdrop-blur-md rounded-lg">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">ID / Nombre del Repuesto</Label>
            <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} placeholder="Ej. Pantalla OLED" className="bg-background/50 border border-border/40 shadow-sm" />
          </div>
          <div className="w-24">
            <Label className="text-xs text-muted-foreground mb-1 block">Cant.</Label>
            <Input type="number" min="1" value={newItemQty} onChange={e => setNewItemQty(Number(e.target.value))} className="bg-background/50 border border-border/40 shadow-sm" />
          </div>
          <Button onClick={handleAddItem} className="bg-primary shadow-sm hover:scale-105 transition-all hover:bg-primary/90">
            Agregar
          </Button>
        </div>

        <div className="rounded-md bg-background/40 border border-border/40 shadow-sm backdrop-blur-md mb-4 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Ítem</TableHead>
                <TableHead className="text-right">Cant.</TableHead>
                <TableHead className="text-right">P. Unitario</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.work_order_items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                    No hay repuestos registrados en la lista de compras.
                  </TableCell>
                </TableRow>
              ) : (
                order.work_order_items?.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell>
                      {item.status === 'purchased' ? (
                        <Badge className="bg-green-600">Comprado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.description || item.inventory_items?.name || 'Item Personalizado'}
                    </TableCell>
                    
                    {editingItemId === item.id ? (
                      <>
                        <TableCell className="text-right">
                          <Input type="number" value={editItemQty} onChange={e => setEditItemQty(Number(e.target.value))} className="w-20 inline-block h-8 bg-background/50 border border-border/40 shadow-sm" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Input type="number" value={editItemPrice} onChange={e => setEditItemPrice(Number(e.target.value))} className="w-24 inline-block h-8 bg-background/50 border border-border/40 shadow-sm" />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(editItemQty * editItemPrice).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={async () => {
                              await onUpdateItem(item.id, editItemQty, editItemPrice);
                              setEditingItemId(null);
                            }} className="h-8 w-8 text-green-600"><Check className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingItemId(null)} className="h-8 w-8 text-destructive"><X className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.status !== 'purchased' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs border-primary text-primary hover:bg-primary hover:text-white" onClick={() => {
                                setPurchasingItem({
                                  id: item.id,
                                  source: 'work_order_item',
                                  title: item.description || item.inventory_items?.name || 'Repuesto',
                                  quantity: item.quantity,
                                  estimatedCost: item.quantity * item.unit_price,
                                  status: item.status,
                                  workOrderId: order.id,
                                  workOrderCode: order.order_number,
                                  branchId: order.branch_id ?? '',
                                  createdAt: new Date().toISOString(),
                                })
                              }}>
                                Marcar Comprado
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => {
                              setEditingItemId(item.id);
                              setEditItemQty(item.quantity);
                              setEditItemPrice(item.unit_price);
                            }}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => {
                              if(confirm("¿Eliminar ítem?")) onDeleteItem(item.id);
                            }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex justify-end pr-4 text-lg">
          <span className="font-semibold mr-4">Total Repuestos:</span>
          <span className="font-bold text-primary">${totalParts.toFixed(2)}</span>
        </div>
      </CardContent>

      <PurchaseExpenseModal
        item={purchasingItem}
        onConfirm={handleModalConfirm}
        onClose={() => setPurchasingItem(null)}
      />
    </Card>
  )
}
