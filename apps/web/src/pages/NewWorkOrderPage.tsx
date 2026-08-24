import { WorkOrderForm } from "@/components/work-orders/WorkOrderForm";

export default function NewWorkOrderPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Nueva Orden de Trabajo</h2>
        <p className="text-muted-foreground">
          Registre el ingreso de un nuevo equipo y asocie un cliente.
        </p>
      </div>

      <WorkOrderForm />
    </div>
  );
}
