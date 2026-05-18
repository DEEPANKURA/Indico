import { createClient } from '@/utils/supabase/server';
import { adminResolveReportAction } from '@/app/actions/admin';
import { ShieldCheck, AlertOctagon, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ status?: string }> 
}) {
  const resolvedParams = await searchParams;
  const filterStatus = resolvedParams.status || 'pending';

  const supabase = await createClient();

  // Query reports with standard filters
  let dbQuery = supabase.from('reports').select('*, posts(*)').order('created_at', { ascending: false });

  if (filterStatus !== 'all') {
    dbQuery = dbQuery.eq('status', filterStatus);
  }

  const { data: rawReports } = await dbQuery.limit(40);
  const reports = (rawReports || []) as any[];


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
            Moderation Reports
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Review user-submitted complaints, investigate policy violations, and issue immediate takedowns.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
        {[
          { label: 'Pending Reviews', value: 'pending' },
          { label: 'Resolved Tickets', value: 'resolved' },
          { label: 'All Reports', value: 'all' }
        ].map((tab) => (
          <Link
            key={tab.value}
            href={`/admin/reports?status=${tab.value}`}
            style={{
              padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700',
              textDecoration: 'none', transition: 'all 0.2s',
              background: filterStatus === tab.value ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              border: filterStatus === tab.value ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
              color: filterStatus === tab.value ? '#8b5cf6' : '#64748b'
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Reports Table / List */}
      {reports.length === 0 ? (
        <div style={{ padding: '64px', textAlign: 'center', background: '#0a0a0d', borderRadius: '24px', color: '#64748b' }}>
          No reports found under the "{filterStatus}" filter. Moderation is fully caught up! ✅
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reports.map((report) => {
            const approveAction = adminResolveReportAction.bind(null, report.id, 'approved');
            const rejectAction = adminResolveReportAction.bind(null, report.id, 'rejected');

            return (
              <div 
                key={report.id}
                style={{
                  background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px'
                }}
              >
                {/* Report Meta Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertOctagon size={18} style={{ color: '#ef4444' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'white' }}>
                      Reason: {report.reason.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '0.75rem', fontWeight: '800',
                      color: report.status === 'pending' ? '#eab308' : '#10b981',
                      background: report.status === 'pending' ? 'rgba(234,179,8,0.1)' : 'rgba(16,185,129,0.1)',
                      padding: '4px 8px', borderRadius: '6px'
                    }}>
                      {report.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Ticket Ref: {report.id.substring(0, 8)}
                    </span>
                  </div>
                </div>

                {/* Reason Details */}
                {report.details && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px', fontWeight: '700' }}>REPORTER CONTEXT / COMMENTS</div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>
                      "{report.details}"
                    </p>
                  </div>
                )}

                {/* Reported Post details */}
                {report.posts && (
                  <div style={{
                    padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '8px'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>REPORTED CONTENT BODY</div>
                    <div style={{ fontSize: '0.85rem', color: 'white', lineHeight: '1.5' }}>
                      {report.posts.content || '[Media Only Post]'}
                    </div>
                    {report.posts.media_urls?.[0] && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.7rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                          Media Attachment Available
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Form Action Controls */}
                {report.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    
                    <form action={approveAction} style={{ flex: 1 }}>
                      <button 
                        type="submit" 
                        style={{
                          width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)',
                          background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.85rem', fontWeight: '700',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        <CheckCircle size={16} /> Keep & Dismiss Report
                      </button>
                    </form>

                    <form action={rejectAction} style={{ flex: 1 }}>
                      <button 
                        type="submit" 
                        style={{
                          width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)',
                          background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.85rem', fontWeight: '700',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                        }}
                      >
                        <XCircle size={16} /> Wipe Content & Ban
                      </button>
                    </form>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
