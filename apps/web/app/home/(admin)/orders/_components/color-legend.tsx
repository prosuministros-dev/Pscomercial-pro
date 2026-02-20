'use client';

import { Card } from '@kit/ui/card';
import { Info } from 'lucide-react';
import { RESPONSABLE_COLORS } from '../_lib/schemas';

export function ColorLegend() {
  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex items-start gap-2 mb-3">
        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium mb-1">Sistema de Colores por Responsabilidad</p>
          <p className="text-[11px] text-muted-foreground">
            Cada columna representa un proceso independiente. Una fila puede tener múltiples colores simultáneamente.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        {Object.entries(RESPONSABLE_COLORS).map(([key, config]) => (
          <div key={key} className="flex items-start gap-2 text-xs">
            <div className={`h-3 w-3 rounded-full ${config.solid} flex-shrink-0 mt-0.5`} />
            <div>
              <p className="font-medium text-[11px]">{config.label}</p>
              <p className="text-[10px] text-muted-foreground">{config.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
