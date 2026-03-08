"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, Download, Filter, RefreshCcw, Search } from "lucide-react";
import { MainLayout } from "@/components/MainLayout";
import { useEffect, useMemo, useState } from "react";
import { inventoryService } from "@/services/inventoryService";
import { InventoryLog } from "@/types/inventory";

export default function LogsPage() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await inventoryService.getInventoryLogs();
        if (res.success) setLogs(res.data);
        else setError(res.error || 'Failed to load logs');
      } catch (e: any) {
        setError(e.message || 'Failed to load logs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">System Logs</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search logs..."
                className="pl-9 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button size="sm" className="h-9">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Logs Today</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">154</div>
              <p className="text-xs text-muted-foreground">+12 in the last hour</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">97.2%</div>
              <p className="text-xs text-muted-foreground">+0.5% from yesterday</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Error Logs</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">-2 from yesterday</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Warning Logs</CardTitle>
              <AlertCircle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>System Activity Logs</CardTitle>
            <CardDescription>
              Recent system activity and user actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[300px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Loading…</TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6}>{error}</TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>No logs found</TableCell>
                  </TableRow>
                ) : (
                  logs.slice(0, limit).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{new Date(log.createdAt).toISOString().replace('T',' ').slice(0,19)}</TableCell>
                      <TableCell className="font-medium">{log.product?.title || '—'}</TableCell>
                      <TableCell>{log.changeType}</TableCell>
                      <TableCell className="font-mono text-xs">{log.product?.sku || log.variant?.sku || '—'}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted">
                          {log.quantityChanged > 0 ? `+${log.quantityChanged}` : log.quantityChanged}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.note || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing <strong>10</strong> of <strong>154</strong> entries
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  1
                </Button>
                <Button variant="outline" size="sm">
                  2
                </Button>
                <Button variant="outline" size="sm">
                  3
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Log Types Distribution</CardTitle>
              <CardDescription>
                Breakdown of system log entries by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: "User Authentication", count: 45, percent: 30 },
                  { type: "Data Modifications", count: 36, percent: 24 },
                  { type: "System Operations", count: 30, percent: 20 },
                  { type: "API Interactions", count: 24, percent: 16 },
                  { type: "Security Events", count: 15, percent: 10 },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">{item.type}</div>
                      <div className="text-sm font-medium">{item.count}</div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${item.percent}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Log Retention Policy</CardTitle>
              <CardDescription>
                Current data retention settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { 
                    name: "System Logs", 
                    retention: "30 days", 
                    description: "Authentication, system events, and errors"
                  },
                  { 
                    name: "Security Logs", 
                    retention: "90 days", 
                    description: "User permissions, suspicious activity" 
                  },
                  { 
                    name: "Transaction Logs", 
                    retention: "365 days", 
                    description: "Order and payment processing events" 
                  },
                  { 
                    name: "Activity Logs", 
                    retention: "60 days", 
                    description: "User actions and data modifications" 
                  },
                ].map((policy, i) => (
                  <div key={i} className="flex items-start">
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-muted mt-1 mr-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">{policy.name}</div>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          {policy.retention}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{policy.description}</div>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-2">
                  Configure Retention Policy
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 