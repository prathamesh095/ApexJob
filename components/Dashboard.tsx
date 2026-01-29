
import React, { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Tooltip
} from 'recharts';
import { TrackingRecord, ApplicationStatus } from '../types';
import { 
  CheckCircle, Send, Target, Sparkles, Activity, Layers, 
  BarChart3, AlertCircle, Clock, Calendar, ArrowRight, 
  Briefcase, Mail, MessageSquare 
} from 'lucide-react';
import { Card, Button, Badge } from './Shared';
import { STATUS_STYLES } from '../constants';

interface Props {
  applications: TrackingRecord[];
  onOpenRecord: (record: TrackingRecord) => void;
}

// Helper to determine urgency level
const getUrgency = (record: TrackingRecord) => {
  const today = new Date().toISOString().split('T')[0];
  if (record.status === ApplicationStatus.INTERVIEWING) return 'critical';
  if (record.nextFollowUpDate && record.nextFollowUpDate < today && !record.followUpSent) return 'overdue';
  if (record.nextFollowUpDate === today && !record.followUpSent) return 'due_today';
  return 'normal';
};

const ActionItem = ({ record, reason, type, onOpen }: { record: TrackingRecord; reason: string; type: 'critical' | 'overdue' | 'info'; onOpen: () => void }) => {
  const urgencyColors = {
    critical: 'border-l-4 border-l-purple-500 bg-purple-500/5',
    overdue: 'border-l-4 border-l-red-500 bg-red-500/5',
    info: 'border-l-4 border-l-primary-500 bg-primary-500/5'
  };

  const icons = {
    critical: <Calendar className="text-purple-400" size={16} />,
    overdue: <AlertCircle className="text-red-400" size={16} />,
    info: <Clock className="text-primary-400" size={16} />
  };

  return (
    <div className={`p-4 rounded-lg border border-border flex items-center justify-between group hover:border-border-strong transition-all ${urgencyColors[type]}`}>
      <div className="flex items-start gap-4">
        <div className="mt-1">{icons[type]}</div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-text-primary">{record.company}</h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border text-text-muted font-medium">{record.roleTitle}</span>
          </div>
          <p className="text-xs text-text-secondary">{reason}</p>
        </div>
      </div>
      <Button size="xs" variant="secondary" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={onOpen}>
        Open
      </Button>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, trend, color = "text-primary-400" }: any) => (
  <div className="p-5 bg-surface border border-border rounded-xl flex items-center justify-between hover:border-border-strong transition-colors">
    <div>
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-text-primary tracking-tight">{value}</h3>
      {trend && <p className="text-[10px] text-text-secondary mt-1">{trend}</p>}
    </div>
    <div className={`p-3 rounded-lg bg-surface-highlight border border-border ${color}`}>
      <Icon size={20} />
    </div>
  </div>
);

const Dashboard: React.FC<Props> = ({ applications = [], onOpenRecord }) => {
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const safeApps = Array.isArray(applications) ? applications : [];
    
    // ACTIONABLE ITEMS
    const overdue = safeApps.filter(a => 
      [ApplicationStatus.SENT, ApplicationStatus.INTERVIEWING].includes(a.status) && 
      a.nextFollowUpDate && a.nextFollowUpDate < today && !a.followUpSent
    );
    
    const dueToday = safeApps.filter(a => 
      [ApplicationStatus.SENT, ApplicationStatus.INTERVIEWING].includes(a.status) && 
      a.nextFollowUpDate === today && !a.followUpSent
    );

    const interviewing = safeApps.filter(a => a.status === ApplicationStatus.INTERVIEWING);
    
    const recentReplies = safeApps.filter(a => a.replyReceived && a.replyDate && a.replyDate >= new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]);

    // METRICS
    const total = safeApps.length;
    const active = safeApps.filter(a => [ApplicationStatus.SENT, ApplicationStatus.INTERVIEWING].includes(a.status)).length;
    const offers = safeApps.filter(a => a.status === ApplicationStatus.OFFER).length;
    const replies = safeApps.filter(a => a.replyReceived).length;
    const responseRate = total > 0 ? Math.round((replies / total) * 100) : 0;

    // CHARTS
    const statusCounts = safeApps.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pieData = [
      ApplicationStatus.OFFER, ApplicationStatus.INTERVIEWING, ApplicationStatus.SENT,
      ApplicationStatus.REJECTED, ApplicationStatus.GHOSTED
    ].map(status => ({ name: status, value: statusCounts[status] || 0 })).filter(d => d.value > 0);

    // Recent Activity Feed
    const recentActivity = [...safeApps]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);

    return { 
      total, active, offers, responseRate, 
      overdue, dueToday, interviewing, recentReplies,
      pieData, recentActivity 
    };
  }, [applications]);

  const PIE_COLORS = ['#10b981', '#a855f7', '#6366f1', '#ef4444', '#71717a'];

  const hasActionItems = stats.interviewing.length > 0 || stats.dueToday.length > 0 || stats.overdue.length > 0 || stats.recentReplies.length > 0;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      
      {/* 1. FOCUS ZONE - ACTIONABLE INTELLIGENCE */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-1.5 bg-primary-500/10 rounded text-primary-400">
            <Target size={18} />
          </div>
          <h2 className="text-lg font-bold text-text-primary tracking-tight">Focus Zone</h2>
          <span className="text-xs text-text-muted font-medium ml-auto">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {hasActionItems ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.interviewing.map(rec => (
              <ActionItem key={rec.id} record={rec} type="critical" reason="Active Interview Phase" onOpen={() => onOpenRecord(rec)} />
            ))}
            {stats.dueToday.map(rec => (
              <ActionItem key={rec.id} record={rec} type="info" reason="Follow-up scheduled for today" onOpen={() => onOpenRecord(rec)} />
            ))}
            {stats.overdue.map(rec => (
              <ActionItem key={rec.id} record={rec} type="overdue" reason={`Overdue by ${Math.floor((Date.now() - new Date(rec.nextFollowUpDate!).getTime()) / 86400000)} days`} onOpen={() => onOpenRecord(rec)} />
            ))}
            {stats.recentReplies.map(rec => (
              <ActionItem key={rec.id} record={rec} type="info" reason="New reply received recently" onOpen={() => onOpenRecord(rec)} />
            ))}
          </div>
        ) : (
          <div className="bg-surface/50 border border-border border-dashed rounded-xl p-8 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-surface-highlight rounded-full flex items-center justify-center text-text-muted mb-3">
              <CheckCircle size={20} />
            </div>
            <h3 className="text-sm font-bold text-text-primary">All caught up</h3>
            <p className="text-xs text-text-muted mt-1 max-w-xs">No urgent follow-ups or pending actions for today. Great job keeping the pipeline clean.</p>
          </div>
        )}
      </section>

      {/* 2. PIPELINE SNAPSHOT */}
      <section>
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Pipeline Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Active Applications" value={stats.active} icon={Activity} color="text-primary-400" />
          <StatCard label="Offers Secured" value={stats.offers} icon={Sparkles} color="text-emerald-400" />
          <StatCard label="Response Rate" value={`${stats.responseRate}%`} icon={MessageSquare} color="text-purple-400" />
          <StatCard label="Total Volume" value={stats.total} icon={Layers} color="text-text-muted" />
        </div>
      </section>

      {/* 3. TRENDS & ACTIVITY GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* RECENT ACTIVITY FEED */}
        <div className="lg:col-span-2 space-y-4">
           <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">Recent Momentum</h3>
           </div>
           <div className="bg-surface border border-border rounded-xl overflow-hidden">
              {stats.recentActivity.length > 0 ? (
                <div className="divide-y divide-border">
                  {stats.recentActivity.map(rec => (
                    <div key={rec.id} onClick={() => onOpenRecord(rec)} className="p-4 flex items-center justify-between hover:bg-surface-highlight/50 transition-colors group cursor-pointer">
                       <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${rec.status === ApplicationStatus.OFFER ? 'bg-emerald-500' : 'bg-primary-500'}`}></div>
                          <div>
                             <h4 className="text-sm font-bold text-text-primary">{rec.roleTitle}</h4>
                             <p className="text-xs text-text-secondary">{rec.company} • <span className="text-text-muted">{new Date(rec.updatedAt).toLocaleDateString()}</span></p>
                          </div>
                       </div>
                       <Badge className={`${STATUS_STYLES[rec.status]} opacity-70 group-hover:opacity-100`}>{rec.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-text-muted">No recent activity recorded.</div>
              )}
           </div>
        </div>

        {/* STATUS DISTRIBUTION (Compact) */}
        <div>
           <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Distribution</h3>
           <div className="bg-surface border border-border rounded-xl p-6 flex flex-col items-center justify-center h-[280px]">
              <div className="w-full h-40 relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie 
                          data={stats.pieData} 
                          innerRadius={50} 
                          outerRadius={70} 
                          paddingAngle={4} 
                          dataKey="value" 
                          stroke="none"
                       >
                          {stats.pieData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                       </Pie>
                       <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} 
                          itemStyle={{ color: '#fff' }}
                       />
                    </PieChart>
                 </ResponsiveContainer>
                 {/* Center Label */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-text-primary">{stats.total}</span>
                    <span className="text-[9px] uppercase font-bold text-text-muted">Apps</span>
                 </div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-2 mt-4 w-full">
                 {stats.pieData.slice(0, 4).map((d, i) => (
                    <div key={i} className="flex items-center text-[10px] text-text-secondary bg-surface-highlight px-2 py-1 rounded border border-border">
                       <div className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: PIE_COLORS[i] }}></div>
                       {d.name}
                    </div>
                 ))}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
