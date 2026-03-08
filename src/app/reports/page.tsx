import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/MainLayout";
import { BarChart, Download, Calendar, LineChart, TrendingUp, Search, Filter } from "lucide-react";

export default function ReportsPage() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Reports</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search reports..."
                className="pl-9 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button size="sm" className="h-9">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$24,563.85</div>
              <p className="text-xs text-muted-foreground">+12.5% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">452</div>
              <p className="text-xs text-muted-foreground">+7.2% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3.2%</div>
              <p className="text-xs text-muted-foreground">+0.5% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$54.32</div>
              <p className="text-xs text-muted-foreground">+$2.40 from last month</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Sales Overview</CardTitle>
              <CardDescription>
                Monthly revenue for the current year
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <div className="h-[300px] flex items-end gap-[2px]">
                {[60, 45, 75, 50, 65, 80, 90, 85, 70, 95, 75, 65].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="w-full mt-auto bg-primary h-[0%] hover:bg-primary/80 rounded-sm" style={{ height: `${height}%` }} />
                    <span className="text-xs text-muted-foreground mt-2">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>
                Best performing products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Premium Headphones', sales: 245, percent: 22 },
                  { name: 'Smartphone X', sales: 190, percent: 17 },
                  { name: 'Fitness Watch', sales: 175, percent: 15 },
                  { name: 'Ergonomic Chair', sales: 142, percent: 12 },
                  { name: 'Designer Backpack', sales: 132, percent: 10 },
                ].map((product, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-muted mr-3">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">{product.sales} sales</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{product.percent}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Sales by Category</CardTitle>
              <CardDescription>
                Revenue breakdown by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { category: 'Electronics', amount: 12450, percent: 38 },
                  { category: 'Clothing', amount: 8700, percent: 26 },
                  { category: 'Furniture', amount: 5300, percent: 16 },
                  { category: 'Wearables', amount: 3200, percent: 10 },
                  { category: 'Other', amount: 3100, percent: 10 },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">{item.category}</div>
                      <div className="text-sm font-medium">${item.amount}</div>
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
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>
                Where your customers are coming from
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { source: 'Direct', visits: 5320, percent: 35 },
                  { source: 'Organic Search', visits: 3840, percent: 25 },
                  { source: 'Social Media', visits: 3070, percent: 20 },
                  { source: 'Referrals', visits: 1540, percent: 10 },
                  { source: 'Email', visits: 1530, percent: 10 },
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">{item.source}</div>
                      <div className="text-sm font-medium">{item.visits}</div>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
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
              <CardTitle>Recent Report Downloads</CardTitle>
              <CardDescription>
                Reports accessed by admin users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Monthly Sales Report', user: 'Admin User', date: '15 Aug 2023' },
                  { name: 'Customer Analytics', user: 'Marketing Manager', date: '12 Aug 2023' },
                  { name: 'Inventory Status', user: 'Product Manager', date: '10 Aug 2023' },
                  { name: 'Revenue by Channel', user: 'Finance Director', date: '08 Aug 2023' },
                  { name: 'Conversion Metrics', user: 'Marketing Manager', date: '05 Aug 2023' },
                ].map((report, i) => (
                  <div key={i} className="flex items-center">
                    <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 mr-3">
                      <Download className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{report.name}</div>
                      <div className="text-xs text-muted-foreground">{report.user} • {report.date}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
} 