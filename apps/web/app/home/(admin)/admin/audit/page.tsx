'use client';

import { useState } from 'react';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Button } from '@kit/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Badge } from '@kit/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@kit/ui/collapsible';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';

interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  changes: any;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function AuditLogPage() {
  const supabase = useSupabase();
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Fetch audit logs
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: [
      'admin',
      'audit-logs',
      entityTypeFilter,
      actionFilter,
      dateFromFilter,
      dateToFilter,
    ],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select(
          `
          *,
          profile:profiles!audit_logs_user_id_fkey(
            full_name,
            email
          )
        `,
        )
        .order('created_at', { ascending: false })
        .limit(100);

      // Apply filters
      if (entityTypeFilter !== 'all') {
        query = query.eq('entity_type', entityTypeFilter);
      }

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      if (dateFromFilter) {
        query = query.gte('created_at', dateFromFilter);
      }

      if (dateToFilter) {
        // Add one day to include the entire end date
        const endDate = new Date(dateToFilter);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as AuditLog[];
    },
  });

  // Get unique entity types and actions for filters
  const entityTypes = Array.from(
    new Set(auditLogs?.map((log) => log.entity_type) || []),
  );
  const actions = Array.from(
    new Set(auditLogs?.map((log) => log.action) || []),
  );

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const clearFilters = () => {
    setEntityTypeFilter('all');
    setActionFilter('all');
    setDateFromFilter('');
    setDateToFilter('');
  };

  const hasActiveFilters =
    entityTypeFilter !== 'all' ||
    actionFilter !== 'all' ||
    dateFromFilter ||
    dateToFilter;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'created':
        return 'default';
      case 'update':
      case 'updated':
        return 'secondary';
      case 'delete':
      case 'deleted':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return <div className="py-8 text-center">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Audit Log</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="entity-type" className="text-sm">
              Entity Type
            </Label>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger id="entity-type">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="action" className="text-sm">
              Action
            </Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger id="action">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date-from" className="text-sm">
              Date From
            </Label>
            <Input
              id="date-from"
              type="date"
              value={dateFromFilter}
              onChange={(e) => setDateFromFilter(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date-to" className="text-sm">
              Date To
            </Label>
            <Input
              id="date-to"
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs && auditLogs.length > 0 ? (
              auditLogs.map((log) => (
                <Collapsible
                  key={log.id}
                  open={expandedRows.has(log.id)}
                  onOpenChange={() => toggleRowExpansion(log.id)}
                  asChild
                >
                  <>
                    <TableRow className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {expandedRows.has(log.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {log.profile?.full_name || 'Unknown User'}
                          </span>
                          {log.profile?.email && (
                            <span className="text-xs text-muted-foreground">
                              {log.profile.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.entity_type}</span>
                          {log.entity_id && (
                            <code className="text-xs text-muted-foreground">
                              {log.entity_id.substring(0, 8)}...
                            </code>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ip_address || 'N/A'}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <CollapsibleContent asChild>
                          <div className="border-t bg-muted/30 p-4">
                            <div className="space-y-3">
                              <div>
                                <h4 className="mb-2 text-sm font-semibold">
                                  Details
                                </h4>
                                <pre className="overflow-x-auto rounded bg-background p-3 text-xs">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </div>
                              {log.user_agent && (
                                <div>
                                  <h4 className="mb-1 text-sm font-semibold">
                                    User Agent
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {log.user_agent}
                                  </p>
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Log ID: {log.id}
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </TableCell>
                    </TableRow>
                  </>
                </Collapsible>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  {hasActiveFilters
                    ? 'No audit logs found matching the filters.'
                    : 'No audit logs available.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {auditLogs && auditLogs.length >= 100 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing the most recent 100 entries. Use filters to narrow down the
          results.
        </div>
      )}
    </div>
  );
}
