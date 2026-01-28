import React, { useMemo } from 'react';
import { 
  Tooltip, ResponsiveContainer, 
  AreaChart, Area, Cell, PieChart, Pie,
  CartesianGrid, XAxis, YAxis
} from 'recharts';
import { TrackingRecord, ApplicationStatus } from '../types';
import { Card } from './Shared';
import { CheckCircle, Clock, Send, Target, TrendingUp, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  applications: TrackingRecord[];
}

const Dashboard: React.FC<Props> = ({ applications = [] }) => {
  const stats = useMemo(() => {
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

    // Order matters for the chart visual balance
    const desiredOrder = [
      ApplicationStatus.OFFER,
      ApplicationStatus.INTERVIEWING,
      ApplicationStatus.SENT,
      ApplicationStatus.REJECTED,
      ApplicationStatus.GHOSTED,
      ApplicationStatus.WITHDRAWN,
      ApplicationStatus.DRAFT
    ];

    const pieData = desiredOrder
      .map(status => ({ name: status, value: statusCounts[status] || 0 }))
      .filter(d => d.value > 0);

    // Calculate response rate
    const responseRate = total > 0 ? Math.round((replies / total) * 100) : 0;

    // Velocity
    const now = Date.now();
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const velocityData = Array.from({length: 8}).map((_, i) => {
      const weekStart = now - (8 - i) * msPerWeek;
      const weekEnd = now - (7 - i) * msPerWeek;
      const count = safeApps.filter(a => {
        const d = a.createdAt || 0;
        return d >= weekStart && d < weekEnd;
      }).length;
      return { week: `Week ${i + 1}`, count };
    });

    return { total, active, offers, replies, pieData, velocityData, responseRate };
  }, [applications]);

  const BentoCard = ({ title, value, subtext, icon: Icon, className = '', visual = 'default' }: any) => {
    const visuals = {
      default: "bg-white",
      primary: "bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-600/30",
      dark: "bg-slate-900 text-white",
      glass: "bg-white/60 backdrop-blur-xl border border-white/50"
    };

    return (
      <div className={`rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group ${visuals[visual as keyof typeof visuals]} ${className}`}>
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2.5 rounded-2xl ${visual === 'primary' || visual === 'dark' ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
              <Icon size={20} />
            </div>
            {visual === 'primary' && <Sparkles size={16} className="text-primary-200 animate-pulse" />}
          </div>
          <div>
             <h3 className={`text-3xl font-black tracking-tight mb-1 ${visual === 'default' ? 'text-slate-900' : 'text-white'}`}>{value}</h3>
             <p className={`text-[11px] font-bold uppercase tracking-widest ${visual === 'default' ? 'text-slate-400' : 'text-white/60'}`}>{title}</p>
             {subtext && <p className={`text-xs mt-2 font-medium ${visual === 'default' ? 'text-emerald-600' : 'text-primary-200'}`}>{subtext}</p>}
          </div>
        </div>
        {/* Decorative Elements */}
        {visual === 'primary' && (
           <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        )}
      </div>
    );
  };

  const COLORS = ['#10b981', '#d946ef', '#8b5cf6', '#f43f5e', '#64748b', '#f97316', '#cbd5e1'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Top Row Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <BentoCard 
          title="Active Pursuit" 
          value={stats.active} 
          icon={Target} 
          visual="primary"
          subtext="Current Pipeline"
        />
        <BentoCard 
          title="Total Initiated" 
          value={stats.total} 
          icon={Send} 
          subtext="+12% from last month"
        />
        <BentoCard 
          title="Response Rate" 
          value={`${stats.responseRate}%`} 
          icon={CheckCircle} 
          subtext={`${stats.replies} Total Replies`}
        />
        <BentoCard 
          title="Offers Secured" 
          value={stats.offers} 
          icon={Sparkles} 
          visual="dark"
          className="shadow-2xl shadow-primary-500/20"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-96">
        
        {/* Activity Chart - Spans 2 cols */}
        <Card className="lg:col-span-2 flex flex-col h-96 lg:h-auto relative overflow-hidden" noPadding>
          <div className="p-6 pb-0 flex justify-between items-center z-10 relative">
             <div>
               <h3 className="text-lg font-black text-slate-900 tracking-tight">Velocity Matrix</h3>
               <p className="text-xs text-slate-500 font-medium">Application throughput over time</p>
             </div>
             <div className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide">
               8 Week Trail
             </div>
          </div>
          <div className="flex-1 w-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={stats.velocityData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4}/>
                     <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <Tooltip 
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}
                   itemStyle={{ color: '#1e293b', fontWeight: 'bold', fontSize: '12px' }}
                   labelStyle={{ display: 'none' }}
                 />
                 <Area 
                   type="monotone" 
                   dataKey="count" 
                   stroke="#7c3aed" 
                   strokeWidth={4} 
                   fillOpacity={1} 
                   fill="url(#colorCount)" 
                 />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Breakdown - Spans 1 col */}
        <Card className="flex flex-col relative" noPadding>
          <div className="p-6 pb-0">
             <h3 className="text-lg font-black text-slate-900 tracking-tight">Distribution</h3>
             <p className="text-xs text-slate-500 font-medium">Current status split</p>
          </div>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  cornerRadius={6}
                >
                  {stats.pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                   itemStyle={{ color: '#1e293b', fontWeight: 'bold', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                 <span className="block text-2xl font-black text-slate-900">{stats.total}</span>
                 <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
              </div>
            </div>
          </div>
          <div className="p-6 pt-0 flex flex-wrap gap-2 justify-center">
             {stats.pieData.slice(0, 4).map((d, i) => (
               <div key={i} className="flex items-center text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                 <div className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                 {d.name}
               </div>
             ))}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;