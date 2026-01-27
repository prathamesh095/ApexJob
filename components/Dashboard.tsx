
import React, { useMemo } from 'react';
import { 
  Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie,
  CartesianGrid, XAxis, YAxis
} from 'recharts';
import { TrackingRecord, ApplicationStatus } from '../types';
import { Card } from './Shared';
import { CheckCircle, Clock, Send, Target } from 'lucide-react';

interface Props {
  applications: TrackingRecord[];
}

const Dashboard: React.FC<Props> = ({ applications = [] }) => {
  const stats = useMemo(() => {
    // Safety check for array existence
    const safeApps = Array.isArray(applications) ? applications : [];

    const total = safeApps.length;
    const active = safeApps.filter(a => [ApplicationStatus.SENT, ApplicationStatus.INTERVIEWING].includes(a.status)).length;
    const offers = safeApps.filter(a => a.status === ApplicationStatus.OFFER).length;
    const replies = safeApps.filter(a => a.replyReceived).length;

    const statusCounts = safeApps.reduce((acc, app) => {
      const status = app.status || 'UNKNOWN';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Real velocity data: Count of applications per week for the last 12 weeks
    const now = Date.now();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const velocityData = Array.from({length: 12}).map((_, i) => {
      const weekStart = now - (12 - i) * msPerWeek;
      const weekEnd = now - (11 - i) * msPerWeek;
      const count = safeApps.filter(a => {
        const d = a.createdAt || 0;
        return d >= weekStart && d < weekEnd;
      }).length;
      return { week: `W${i + 1}`, count };
    });

    return { total, active, offers, replies, pieData, velocityData };
  }, [applications]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Entities', value: stats.total, icon: <Target className="text-indigo-600" /> },
          { label: 'Active Pipeline', value: stats.active, icon: <Clock className="text-blue-600" /> },
          { label: 'Replies Secured', value: stats.replies, icon: <Send className="text-purple-600" /> },
          { label: 'Offers Released', value: stats.offers, icon: <CheckCircle className="text-emerald-600" /> },
        ].map((item, i) => (
          <Card key={i} className="p-6 flex items-center space-x-5 border-none shadow-sm bg-white hover:-translate-y-1 transition-transform">
            <div className="p-4 bg-slate-50 rounded-2xl">{item.icon}</div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-3xl font-black text-slate-900">{item.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 border-none shadow-sm">
          <h3 className="text-xs font-black text-slate-400 mb-8 uppercase tracking-[0.2em]">Matrix Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#64748b'][index % 7]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} 
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {stats.pieData.map((d, i) => (
              <div key={i} className="flex items-center text-xs font-bold text-slate-600">
                <div className="w-3 h-3 rounded-md mr-3 shadow-sm" style={{ backgroundColor: ['#6366f1', '#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#64748b'][i % 7] }} />
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 border-none shadow-sm">
          <h3 className="text-xs font-black text-slate-400 mb-8 uppercase tracking-[0.2em]">Operational Growth Velocity</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={stats.velocityData}>
                 <defs>
                   <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                     <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                 <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                 <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                 />
                 <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={4} />
               </AreaChart>
             </ResponsiveContainer>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-50">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Data aggregated over trailing 12-week period</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
