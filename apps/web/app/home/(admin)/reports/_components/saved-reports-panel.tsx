'use client';

import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Loader2, Trash2, Share2 } from 'lucide-react';
import { useSavedReports, useDeleteReport } from '../_lib/report-queries';
import type { ReportType } from '../_lib/types';
import { REPORT_TYPE_CONFIG } from '../_lib/types';

interface SavedReportsPanelProps {
  onLoad: (type: ReportType, filters: Record<string, string>) => void;
}

export function SavedReportsPanel({ onLoad }: SavedReportsPanelProps) {
  const { data: reports = [], isLoading } = useSavedReports();
  const deleteReport = useDeleteReport();

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No tienes reportes guardados
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => {
        const config = REPORT_TYPE_CONFIG[report.report_type as ReportType];
        return (
          <div
            key={report.id}
            className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() =>
              onLoad(
                report.report_type as ReportType,
                (report.filters || {}) as Record<string, string>,
              )
            }
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{report.name}</p>
                {report.is_shared && <Share2 className="w-3 h-3 text-muted-foreground" />}
              </div>
              <Badge variant="outline" className="text-[10px] mt-0.5">
                {config?.label || report.report_type}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                deleteReport.mutate(report.id);
              }}
              disabled={deleteReport.isPending}
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
