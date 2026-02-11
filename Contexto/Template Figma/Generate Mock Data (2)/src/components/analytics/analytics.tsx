import { motion } from 'motion/react';
import { TrendingUp, Users, Eye, MousePointer } from 'lucide-react';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { revenueChartData, trafficSourceData } from '../../lib/mock-data';

const COLORS = ['#00C8CF', '#161052', '#00E5ED', '#2E2680', '#00A8B8'];

export function Analytics() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-accent p-3">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1>Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Deep insights into your business performance
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: 'Page Views', value: '124.5K', icon: Eye, change: '+12.3%' },
          { label: 'Unique Visitors', value: '45.2K', icon: Users, change: '+8.1%' },
          { label: 'Click Rate', value: '4.2%', icon: MousePointer, change: '+2.4%' },
          { label: 'Avg. Time', value: '3m 42s', icon: TrendingUp, change: '+15.7%' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
                <h2>{stat.value}</h2>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  {stat.change} vs last period
                </p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="p-6">
          <Tabs defaultValue="revenue" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="revenue">Revenue & Users</TabsTrigger>
              <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="revenue">
              <div className="space-y-4">
                <div>
                  <h3>Revenue & User Growth</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Monthly comparison over the last 7 months
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#00C8CF" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="users" fill="#161052" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="traffic">
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <h3>Traffic Distribution</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Breakdown by source
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={trafficSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {trafficSourceData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3>Top Sources</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ranked by volume
                    </p>
                  </div>
                  <div className="space-y-3">
                    {trafficSourceData.map((source, index) => (
                      <div key={source.name} className="flex items-center gap-4">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        >
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p>{source.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {source.value.toLocaleString()} visits
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trends">
              <div className="space-y-4">
                <div>
                  <h3>Growth Trends</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    7-month trajectory analysis
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#00C8CF"
                      strokeWidth={3}
                      dot={{ fill: '#00C8CF', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#161052"
                      strokeWidth={3}
                      dot={{ fill: '#161052', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </motion.div>
    </div>
  );
}
