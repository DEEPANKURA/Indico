'use client';

import { useState, useEffect } from 'react';
import { 
  getMonetizationDataAction, 
  applyFriendReferralAction, 
  updateCommunitySubscriptionPriceAction, 
  updateProfileSubscriptionPriceAction,
  createRazorpayOrderAction, 
  verifyRazorpayPaymentAction, 
  boostReelWithCoinsAction,
  updatePayoutAccountAction,
  withdrawFundsAction
} from '@/app/actions/monetize';
import { 
  Coins, Gift, Users, Sparkles, Share2, CheckCircle2, 
  ArrowRight, Lock, ShieldCheck, TrendingUp, Wallet, 
  CreditCard, AlertCircle, Check, Loader2, IndianRupee,
  Layers, Flame, User
} from 'lucide-react';

export default function MonetizePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  
  // Forms & Inputs state
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [referralStatus, setReferralStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [applyingReferral, setApplyingReferral] = useState(false);
  
  const [communityPrices, setCommunityPrices] = useState<Record<string, number>>({});
  const [updatingPriceId, setUpdatingPriceId] = useState<string | null>(null);
  const [profilePrice, setProfilePrice] = useState<number | ''>('');
  const [updatingProfilePrice, setUpdatingProfilePrice] = useState(false);

  // Razorpay Checkout Simulation modal state
  const [rzpModal, setRzpModal] = useState<{
    show: boolean;
    amount: number;
    type: 'buy_coins' | 'subscribe_community' | 'boost_reel';
    targetId?: string;
    orderId?: string;
    processing: boolean;
    step: 'options' | 'success';
  }>({
    show: false,
    amount: 0,
    type: 'buy_coins',
    processing: false,
    step: 'options'
  });

  // Boosting state
  const [boostingPostId, setBoostingPostId] = useState<string | null>(null);
  const [boostCoinsAmount, setBoostCoinsAmount] = useState(100);

  // Payout state
  const [payoutAccountInput, setPayoutAccountInput] = useState('');
  const [updatingPayout, setUpdatingPayout] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | ''>('');
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const res = await getMonetizationDataAction();
    if (res.success) {
      setData(res);
      // init prices
      const prices: Record<string, number> = {};
      res.communities?.forEach((c: any) => {
        prices[c.id] = c.subscription_price || 0;
      });
      setCommunityPrices(prices);
      if (res.profile?.payout_account) {
        setPayoutAccountInput(res.profile.payout_account);
      }
      if (res.profile?.profile_subscription_price !== undefined) {
        setProfilePrice(res.profile.profile_subscription_price);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendCodeInput.trim()) return;
    setApplyingReferral(true);
    setReferralStatus(null);
    const res = await applyFriendReferralAction(friendCodeInput);
    setReferralStatus({ success: res.success, message: res.success ? res.message : res.error });
    if (res.success) {
      await fetchData();
      setFriendCodeInput('');
    }
    setApplyingReferral(false);
  };

  const handleUpdatePrice = async (communityId: string) => {
    const price = communityPrices[communityId] || 0;
    setUpdatingPriceId(communityId);
    const res = await updateCommunitySubscriptionPriceAction(communityId, price);
    if (res.success) {
      await fetchData();
    }
    setUpdatingPriceId(null);
  };

  const handleUpdateProfilePrice = async () => {
    setUpdatingProfilePrice(true);
    const res = await updateProfileSubscriptionPriceAction(Number(profilePrice) || 0);
    if (res.success) {
      alert(res.message);
      await fetchData();
    } else {
      alert(res.error);
    }
    setUpdatingProfilePrice(false);
  };

  const startRazorpayCheckout = async (amount: number, type: 'buy_coins' | 'subscribe_community' | 'subscribe_profile' | 'boost_reel', targetId?: string) => {
    // Call server action to create secure order
    const orderRes = await createRazorpayOrderAction(amount, type, targetId);
    if (orderRes.success) {
      // Launch rich simulated checkout flow
      setRzpModal({
        show: true,
        amount,
        type,
        targetId,
        orderId: orderRes.orderId,
        processing: false,
        step: 'options'
      });
    } else {
      alert('Failed to initialize Razorpay Order: ' + orderRes.error);
    }
  };

  const processRazorpaySimulatedPayment = async () => {
    if (!rzpModal.orderId) return;
    setRzpModal(prev => ({ ...prev, processing: true }));
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));
    
    // Call server verify action
    const verifyRes = await verifyRazorpayPaymentAction(rzpModal.orderId, 'pay_mock_' + Date.now());
    
    if (verifyRes.success) {
      setRzpModal(prev => ({ ...prev, step: 'success', processing: false }));
      await fetchData();
    } else {
      alert('Payment processing failed: ' + verifyRes.error);
      setRzpModal(prev => ({ ...prev, show: false }));
    }
  };

  const handleDirectCoinBoost = async (postId: string, coinsCost: number) => {
    setBoostingPostId(postId);
    const res = await boostReelWithCoinsAction(postId, coinsCost);
    if (res.success) {
      alert(res.message);
      await fetchData();
    } else {
      alert(res.error);
    }
    setBoostingPostId(null);
  };

  const handleUpdatePayoutAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAccountInput.trim()) return;
    setUpdatingPayout(true);
    const res = await updatePayoutAccountAction(payoutAccountInput);
    if (res.success) {
      alert(res.message);
      await fetchData();
    } else {
      alert(res.error);
    }
    setUpdatingPayout(false);
  };

  const handleWithdrawFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    setWithdrawing(true);
    const res = await withdrawFundsAction(Number(withdrawAmount));
    if (res.success) {
      alert(res.message);
      setWithdrawAmount('');
      await fetchData();
    } else {
      alert(res.error);
    }
    setWithdrawing(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="animate-spin" size={48} style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (!data || !data.profile) {
    return (
      <div className="container" style={{ paddingTop: '40px', textAlign: 'center' }}>
        <h2>Please login to view your Creator & Earning dashboard.</h2>
      </div>
    );
  }

  const { profile, communities, subscriptions, posts, subscriberCount } = data;
  const totalEarningsINR = profile.total_earnings || 0;
  const creatorShare = totalEarningsINR * 0.70;
  const indicoShare = totalEarningsINR * 0.30;

  return (
    <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', paddingTop: '24px', paddingBottom: '120px' }}>
      {/* Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', margin: 0 }}>Monetization Hub</h1>
            <span style={{ background: 'rgba(138,43,226,0.15)', color: 'var(--accent-neon)', fontSize: '0.75rem', fontWeight: '800', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(138,43,226,0.3)' }}>
              RAZORPAY INTEGRATED
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '4px', margin: 0 }}>
            Manage exclusive subscriptions, referral earnings, and boost active reels instantly.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}>
            <Coins size={20} style={{ color: '#f59e0b' }} />
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', lineHeight: '1' }}>Coins Balance</span>
              <strong style={{ fontSize: '1.1rem', color: '#f59e0b' }}>{profile.coins || 0}</strong>
            </div>
          </div>

          <button onClick={() => setActiveTab('Coins')} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
            Buy Coins
          </button>
        </div>
      </div>

      {/* Main Metric Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(138,43,226,0.1), rgba(0,255,255,0.05))', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.05 }}>
            <IndianRupee size={160} />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Total Revenue Generated</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IndianRupee size={32} className="text-gradient-primary" />
            <span style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-0.03em' }} className="text-gradient-primary">
              {totalEarningsINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
            <div><strong style={{ color: '#10b981' }}>70%</strong> Creator Share: ₹{creatorShare.toFixed(2)}</div>
            <div><strong style={{ color: 'var(--accent-secondary)' }}>30%</strong> Indico Share: ₹{indicoShare.toFixed(2)}</div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Fan Subscriptions</span>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {subscriberCount} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Active Fans</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Paying monthly for exclusive private community access</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-secondary)', fontSize: '0.85rem', fontWeight: '700' }}>
            <Users size={16} /> Secure auto-renewals enabled
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>My Shareable Referral Link</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <code style={{ fontSize: '0.8rem', fontWeight: '700', background: 'var(--bg-glass)', padding: '8px 12px', borderRadius: '10px', color: 'var(--accent-neon)', border: '1px dashed rgba(255,0,255,0.4)', wordBreak: 'break-all', display: 'block', width: '100%' }}>
                {typeof window !== 'undefined' ? `${window.location.origin}/auth?ref=${profile.referral_code}` : `https://indico.app/auth?ref=${profile.referral_code}`}
              </code>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Tapping redirects to signup; rewards 100 coins to both on login</p>
          </div>
          <button 
            onClick={() => { 
              const link = `${window.location.origin}/auth?ref=${profile.referral_code}`;
              navigator.clipboard.writeText(link); 
              alert('Individual direct signup referral link copied to clipboard!'); 
            }} 
            className="btn-secondary" 
            style={{ padding: '8px 12px', fontSize: '0.8rem', width: '100%', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Share2 size={14} /> Copy Direct Signup Link
          </button>
        </div>
      </div>

      {/* Modern Sub-navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', marginBottom: '32px', overflowX: 'auto', paddingBottom: '4px' }} className="no-scrollbar">
        {[
          { id: 'Overview', label: 'Dashboard & Split', icon: Layers },
          { id: 'Communities', label: 'Exclusive Content Pricing', icon: Lock },
          { id: 'Coins', label: 'Buy Coins', icon: Coins },
          { id: 'Referrals', label: 'Referral Rewards', icon: Gift },
          { id: 'Boost', label: 'Boost Reels', icon: Flame },
          { id: 'Payout', label: 'Withdraw', icon: Wallet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px',
                borderRadius: '12px 12px 0 0',
                fontWeight: '700',
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: isActive ? 'var(--accent-neon)' : 'var(--text-secondary)',
                borderBottom: `3px solid ${isActive ? 'var(--accent-neon)' : 'transparent'}`,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              className="hover-glass"
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '32px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp style={{ color: 'var(--accent-secondary)' }} /> Monetization Rules & Split Breakdown
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7', marginBottom: '24px' }}>
              Indico empowers creators with real premium monetization tools. Set a custom monthly price for your private communities. Fans pay seamlessly in Indian Rupees (INR) through authenticated Razorpay checkouts. 
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-glass)', borderLeft: '4px solid #10b981' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Creator Share</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981' }}>70%</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Direct transfer payout to linked creator account</p>
              </div>

              <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-glass)', borderLeft: '4px solid var(--accent-secondary)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Indico Platform Share</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--accent-secondary)' }}>30%</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Covers processing fees, hosting, and platform boost logic</p>
              </div>

              <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-glass)', borderLeft: '4px solid #f59e0b' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Reel Boosting Revenue</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#f59e0b' }}>100%</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Indico platform earns directly from user-boosted reels via purchased coins</p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '32px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px' }}>Fan Subscriptions Received</h3>
            {subscriptions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {subscriptions.map((sub: any) => (
                  <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'var(--bg-glass)' }}>
                    <div>
                      <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--accent-secondary)' }}>{sub.community?.name || 'Exclusive Tier'}</span>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Paid Subscription — Auto-renews on {new Date(sub.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#10b981' }}>₹{sub.amount}</span>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status: Active</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No exclusive subscribers yet. Share your private community link to begin monetization!</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Communities' && (
        <div className="glass-card" style={{ padding: '32px', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock style={{ color: 'var(--accent-primary)' }} /> Configure Private Community & Profile Pricing
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
            Fans will pay this recurring amount monthly via Razorpay to access your exclusive content. Set to ₹0 to keep access free.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Exclusive Profile Subscription */}
            <div style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-glass)', border: '1px solid var(--accent-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-primary)' }}>My Exclusive Profile</strong>
                  <span style={{ background: 'rgba(138,43,226,0.1)', color: 'var(--accent-primary)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>Exclusive Media</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '400px' }}>
                  Subscription price for users to view your exclusive profile uploads.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: '700' }}>₹</span>
                  <input 
                    type="number" 
                    value={profilePrice} 
                    onChange={(e) => setProfilePrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    style={{ padding: '10px 12px 10px 28px', width: '120px', borderRadius: '10px', border: '1px solid var(--accent-primary)', fontSize: '1rem', fontWeight: '700', textAlign: 'right' }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textAlign: 'right', marginTop: '4px' }}>/ month</span>
                </div>

                <button 
                  onClick={handleUpdateProfilePrice}
                  disabled={updatingProfilePrice}
                  className="btn-primary"
                  style={{ padding: '10px 20px', height: '44px' }}
                >
                  {updatingProfilePrice ? <Loader2 size={18} className="animate-spin" /> : 'Save Price'}
                </button>
              </div>
            </div>

            {/* Communities */}
            {communities.length > 0 && communities.map((comm: any) => (
                <div key={comm.id} style={{ padding: '20px', borderRadius: '16px', background: 'var(--bg-glass)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '1.1rem', fontWeight: '800' }}>{comm.name}</strong>
                      {!comm.is_public && <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>Private</span>}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '400px' }}>
                      {comm.description || 'Exclusive community channel'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: '700' }}>₹</span>
                      <input 
                        type="number" 
                        value={communityPrices[comm.id] ?? ''} 
                        onChange={(e) => setCommunityPrices(prev => ({ ...prev, [comm.id]: Number(e.target.value) }))}
                        placeholder="0"
                        style={{ padding: '10px 12px 10px 28px', width: '120px', borderRadius: '10px', border: '1px solid var(--border-glass)', fontSize: '1rem', fontWeight: '700', textAlign: 'right' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textAlign: 'right', marginTop: '4px' }}>/ month</span>
                    </div>

                    <button 
                      onClick={() => handleUpdatePrice(comm.id)}
                      disabled={updatingPriceId === comm.id}
                      className="btn-primary"
                      style={{ padding: '10px 20px', height: '44px' }}
                    >
                      {updatingPriceId === comm.id ? <Loader2 size={18} className="animate-spin" /> : 'Save Price'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Coins' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '32px', borderRadius: '20px', textAlign: 'center' }}>
            <Coins size={48} style={{ color: '#f59e0b', margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '1.6rem', fontWeight: '900', marginBottom: '8px' }}>Purchase Coins & Support Platforms</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 24px', fontSize: '0.95rem' }}>
              Coins let you instantly supercharge/boost your reels on the main trending feed. Indico platform earns directly from premium reel boosts. Standard Rate: <strong style={{ color: '#f59e0b' }}>₹80 for 100 Coins</strong>.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginTop: '16px' }}>
              {[
                { coins: 100, price: 80, popular: false, desc: 'Starter Value Pack' },
                { coins: 250, price: 200, popular: true, desc: 'Best Seller Deal' },
                { coins: 500, price: 400, popular: false, desc: 'Mega Creator Reach' },
              ].map((pack, idx) => (
                <div key={idx} style={{ 
                  padding: '28px 20px', 
                  borderRadius: '20px', 
                  background: pack.popular ? 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(138,43,226,0.05))' : 'var(--bg-glass)',
                  border: `2px solid ${pack.popular ? '#f59e0b' : 'var(--border-glass)'}`,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px'
                }} className="hover-scale">
                  {pack.popular && (
                    <span style={{ position: 'absolute', top: '-12px', background: '#f59e0b', color: '#000', fontSize: '0.75rem', fontWeight: '900', padding: '4px 12px', borderRadius: '12px', textTransform: 'uppercase' }}>
                      Most Popular
                    </span>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#f59e0b', fontWeight: '900', fontSize: '2rem' }}>
                      <Coins size={28} /> {pack.coins}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', display: 'block' }}>{pack.desc}</span>
                  </div>

                  <div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '12px' }}>
                      ₹{pack.price}
                    </div>
                    <button 
                      onClick={() => startRazorpayCheckout(pack.price, 'buy_coins')}
                      className="btn-primary" 
                      style={{ width: '100%', background: pack.popular ? 'linear-gradient(135deg, #f59e0b, #d97706)' : undefined }}
                    >
                      Buy via Razorpay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Referrals' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '32px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Gift style={{ color: 'var(--accent-neon)' }} /> Double-Sided Referral Bonus
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
              When a friend joins Indico and enters your invitation code, <strong style={{ color: '#10b981' }}>both of you instantly receive 100 Bonus Coins</strong>. Use these coins to boost content visibility!
            </p>

            <div style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-glass)', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Your Direct Signup Referral Link</span>
              <code style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-neon)', wordBreak: 'break-all', display: 'block', padding: '6px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {typeof window !== 'undefined' ? `${window.location.origin}/auth?ref=${profile.referral_code}` : `https://indico.app/auth?ref=${profile.referral_code}`}
              </code>
            </div>

            <button 
              onClick={() => { 
                const link = `${window.location.origin}/auth?ref=${profile.referral_code}`;
                navigator.clipboard.writeText(link); 
                alert('Direct Signup Link Copied! Send this link to friends so they land on the signup page.'); 
              }}
              className="btn-primary" 
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Share2 size={18} /> Copy Direct Share Link
            </button>
          </div>

          <div className="glass-card" style={{ padding: '32px', borderRadius: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '12px' }}>Apply a Friend's Code</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Received a referral code from a creator or friend? Activate it below to get your free 100 Coin Welcome Package instantly.
            </p>

            {profile.referred_by ? (
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={20} />
                <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>Referral Bonus Active! You were referred successfully.</span>
              </div>
            ) : (
              <form onSubmit={handleApplyReferral} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input 
                  type="text" 
                  value={friendCodeInput}
                  onChange={(e) => setFriendCodeInput(e.target.value)}
                  placeholder="ENTER REFERRAL CODE" 
                  style={{ padding: '14px', borderRadius: '12px', textTransform: 'uppercase', fontSize: '1.1rem', fontWeight: '800', letterSpacing: '1px', textAlign: 'center', border: '2px solid var(--border-glass)', background: 'var(--bg-glass)' }}
                />

                {referralStatus && (
                  <div style={{ fontSize: '0.85rem', color: referralStatus.success ? '#10b981' : '#ef4444', background: referralStatus.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', fontWeight: '600' }}>
                    {referralStatus.message}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={applyingReferral || !friendCodeInput.trim()}
                  className="btn-primary"
                  style={{ padding: '12px', fontWeight: '800' }}
                >
                  {applyingReferral ? <Loader2 className="animate-spin" size={20} /> : 'Claim 100 Referral Coins'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Boost' && (
        <div className="glass-card" style={{ padding: '32px', borderRadius: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Flame style={{ color: '#f59e0b' }} /> Supercharge & Boost Reels
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
            Use your earned or purchased coins to elevate your content directly onto the primary Trending Feeds. Indico platform earns directly from these premium boosts.
          </p>

          {posts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {posts.map((post: any) => (
                <div key={post.id} style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-glass)', border: post.is_boosted ? '2px solid #f59e0b' : '1px solid var(--border-light)', position: 'relative' }}>
                  {post.is_boosted && (
                    <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'linear-gradient(90deg, #f59e0b, #ef4444)', color: '#fff', fontSize: '0.7rem', fontWeight: '800', padding: '2px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Flame size={12} /> Boosted ({post.boost_coins || 0}c)
                    </span>
                  )}
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '12px', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                    {post.content || 'Untitled Visual Reel'}
                  </p>
                  {post.media_urls?.[0] && (
                    <div style={{ width: '100%', height: '140px', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', background: '#000' }}>
                      {typeof post.media_urls[0] === 'string' && post.media_urls[0].match(/\.(mp4|webm)/i) ? (
                        <video src={post.media_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                      ) : (
                        <img src={post.media_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ❤️ {post.like_count || 0} Likes
                    </span>

                    <button 
                      onClick={() => handleDirectCoinBoost(post.id, 100)}
                      disabled={boostingPostId === post.id}
                      className="btn-primary" 
                      style={{ padding: '6px 14px', fontSize: '0.8rem', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', minHeight: '32px' }}
                    >
                      {boostingPostId === post.id ? <Loader2 size={14} className="animate-spin" /> : 'Boost Reel (100c)'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>You haven't uploaded any reels or posts yet to boost.</p>
          )}
        </div>
      )}

      {activeTab === 'Payout' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '32px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CreditCard style={{ color: 'var(--accent-primary)' }} /> Setup Payout Account
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
              Enter your UPI ID or Bank Account Details where you want to receive your earnings.
            </p>

            <form onSubmit={handleUpdatePayoutAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>ACCOUNT DETAILS (UPI ID / Bank Acc)</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. yourname@upi or Acc: 1234..."
                  value={payoutAccountInput}
                  onChange={(e) => setPayoutAccountInput(e.target.value)}
                  className="glass-card"
                  style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', color: 'white', background: 'rgba(255,255,255,0.05)' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={updatingPayout || !payoutAccountInput.trim()}
                className="btn-secondary" 
                style={{ padding: '12px', borderRadius: '12px', fontWeight: '800' }}
              >
                {updatingPayout ? <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto' }} /> : 'Save Payout Details'}
              </button>
            </form>
          </div>

          <div className="glass-card" style={{ padding: '32px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wallet style={{ color: '#10b981' }} /> Withdraw Funds
            </h2>
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '16px', borderRadius: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Available Balance</span>
              <strong style={{ fontSize: '1.4rem', color: '#10b981' }}>₹{(profile.wallet_balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
            </div>

            <form onSubmit={handleWithdrawFunds} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-secondary)' }}>WITHDRAW AMOUNT (INR)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: '700', fontSize: '1.1rem' }}>₹</span>
                  <input 
                    required
                    type="number" 
                    min="100"
                    max={profile.wallet_balance || 0}
                    placeholder="Min. 100"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="glass-card"
                    style={{ width: '100%', padding: '14px 16px 14px 36px', borderRadius: '12px', border: '1px solid var(--border-light)', color: 'white', background: 'rgba(255,255,255,0.05)', fontSize: '1.1rem', fontWeight: '700' }}
                  />
                </div>
              </div>

              {!profile.payout_account && (
                <div style={{ fontSize: '0.85rem', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  <span>Please setup your payout account first to withdraw.</span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={withdrawing || !withdrawAmount || Number(withdrawAmount) <= 0 || !profile.payout_account}
                className="btn-primary" 
                style={{ padding: '14px', borderRadius: '12px', fontWeight: '800', background: 'linear-gradient(135deg, #10b981, #059669)' }}
              >
                {withdrawing ? <Loader2 className="animate-spin" size={20} style={{ margin: '0 auto' }} /> : 'Initiate Withdrawal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Simulated Premium Razorpay Gateway Dialog Overlay */}
      {rzpModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%', maxWidth: '440px', padding: '0', borderRadius: '24px', overflow: 'hidden',
            border: '1px solid rgba(59,130,246,0.4)', background: '#0f172a',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            {/* Razorpay branded header */}
            <div style={{ background: 'linear-gradient(90deg, #0284c7, #2563eb)', padding: '20px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, display: 'block', fontWeight: '700' }}>Secured Gateway</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Razorpay Checkout</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                TEST MODE
              </div>
            </div>

            <div style={{ padding: '28px 24px' }}>
              {rzpModal.step === 'options' ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Payable Amount</span>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', marginTop: '2px' }}>
                      ₹{rzpModal.amount}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'block', marginTop: '4px' }}>✓ Secured processing via SSL</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Select Payment Method</span>
                    
                    {[
                      { name: 'UPI Fast Pay', desc: 'GooglePay, PhonePe, Paytm', icon: '⚡' },
                      { name: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay', icon: '💳' },
                      { name: 'Netbanking', desc: 'HDFC, SBI, ICICI, Axis', icon: '🏦' },
                    ].map((m, i) => (
                      <div key={i} style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} className="hover-glass">
                        <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                        <div>
                          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', display: 'block' }}>{m.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => setRzpModal(prev => ({ ...prev, show: false }))} 
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '12px' }}
                      disabled={rzpModal.processing}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={processRazorpaySimulatedPayment} 
                      className="btn-primary" 
                      style={{ flex: 2, padding: '12px', background: 'linear-gradient(90deg, #0284c7, #2563eb)' }}
                      disabled={rzpModal.processing}
                    >
                      {rzpModal.processing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Loader2 className="animate-spin" size={18} /> Processing...
                        </div>
                      ) : (
                        `Authorize Pay ₹${rzpModal.amount}`
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10b981' }}>
                    <Check size={36} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Payment Successful!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                    Transaction authenticated by Razorpay Gateway. Split revenue & platform tokens allocated instantly.
                  </p>
                  <button 
                    onClick={() => setRzpModal(prev => ({ ...prev, show: false }))}
                    className="btn-primary"
                    style={{ width: '100%', background: '#10b981' }}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
            
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              Indico Checkout API v2 • Secured by Razorpay India
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
