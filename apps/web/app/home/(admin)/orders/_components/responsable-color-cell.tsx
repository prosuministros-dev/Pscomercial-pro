'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';
import { RESPONSABLE_COLORS } from '../_lib/schemas';
import type { ResponsableColor } from '../_lib/types';

interface ResponsableColorCellProps {
  color: ResponsableColor | null;
  content?: string;
}

export function ResponsableColorCell({ color, content }: ResponsableColorCellProps) {
  if (!color) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground">
        —
      </div>
    );
  }

  const config = RESPONSABLE_COLORS[color];
  if (!config) {
    return (
      <div className="flex items-center justify-center text-xs text-muted-foreground">
        —
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center justify-center cursor-help transition-all hover:scale-105 ${config.bg} ${config.border} border rounded px-2 py-1`}
          >
            <div className={`h-2 w-2 rounded-full ${config.solid}`} />
            {content && (
              <span className="ml-1.5 text-[11px] font-medium">{content}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[250px]">
          <p className="font-medium text-xs mb-1">{config.label}</p>
          <p className="text-[11px] text-muted-foreground">{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
