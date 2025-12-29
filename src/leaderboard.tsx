import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Calendar, TrendingUp } from 'lucide-react';

// Process real data
const processRealData = (apiData, period, startDate, endDate) => {
  const tiers = ['Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'];
  
  if (!apiData || !apiData.addressToPointsSorted) {
    return {
      period,
      startDate,
      endDate,
      pointsDistributed: 0,
      nextDistribution: new Date().toISOString().split('T')[0],
      entries: []
    };
  }
  
  const entries = apiData.addressToPointsSorted.map((item, index) => {
    const [address, rawPoints] = item;
    // Convert from wei-like units to readable points (divide by 10^24)
    const points = Math.floor(Number(rawPoints) / 1e24);
    
    return {
      rank: index + 1,
      address: `${address.slice(0, 6)}...${address.slice(-4)}`,
      fullAddress: address,
      ens: null,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${address}`,
      badgeTier: tiers[Math.floor(Math.random() * tiers.length)],
      points,
      lifetimePoints: points,
      joinDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
    };
  });
  
  const totalPoints = entries.reduce((sum, entry) => sum + entry.points, 0);
  
  // Set next distribution to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return {
    period,
    startDate,
    endDate,
    pointsDistributed: totalPoints,
    nextDistribution: tomorrow.toISOString().split('T')[0],
    entries
  };
};

const getMondayOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getSundayOfWeek = (date) => {
  const monday = getMondayOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return sunday;
};

const generateWeekOptions = () => {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (i * 7));
    const monday = getMondayOfWeek(weekStart);
    const sunday = getSundayOfWeek(weekStart);
    options.push({
      label: `${monday.getDate()} ${monday.toLocaleString('en', { month: 'short' })} – ${sunday.getDate()} ${sunday.toLocaleString('en', { month: 'short' })}`,
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0]
    });
  }
  return options;
};

const generateMonthOptions = () => {
  const options = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    options.push({
      label: date.toLocaleString('en', { month: 'long', year: 'numeric' }),
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
  }
  return options;
};

const formatNumber = (num) => {
  return num.toLocaleString('en-US');
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // Check if it's tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Every day. Midnight UTC';
  }
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const MedalIcon = ({ rank }) => {
  if (rank === 1) return <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs font-bold">🥇</div>;
  if (rank === 2) return <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">🥈</div>;
  if (rank === 3) return <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center text-xs font-bold">🥉</div>;
  return null;
};

const TierBadge = ({ tier }) => {
  const colors = {
    Diamond: 'bg-cyan-100 text-cyan-700 border-cyan-300',
    Platinum: 'bg-slate-100 text-slate-700 border-slate-300',
    Gold: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Silver: 'bg-gray-100 text-gray-700 border-gray-300',
    Bronze: 'bg-orange-100 text-orange-700 border-orange-300'
  };
  
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[tier]}`}>
      {tier}
    </span>
  );
};

const NFTBadge = () => {
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium border bg-purple-100 text-purple-700 border-purple-300 whitespace-nowrap">
      42&nbsp;NFT
    </span>
  );
};

const LeaderboardDashboard = () => {
  const [period, setPeriod] = useState('weekly');
  const [dateRange, setDateRange] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const weekOptions = generateWeekOptions();
  const monthOptions = generateMonthOptions();

  useEffect(() => {
    if (period === 'weekly' && !dateRange) {
      setDateRange(weekOptions[0]);
    } else if (period === 'monthly' && !dateRange) {
      setDateRange(monthOptions[0]);
    } else if (period === 'all_time') {
      setDateRange(null);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    
    const fetchData = async () => {
      try {
        const response = await fetch('https://api-points.ltv.finance/address-to-points-sorted');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const apiData = await response.json();
        const start = dateRange?.start || '2024-01-01';
        const end = dateRange?.end || new Date().toISOString().split('T')[0];
        const processedData = processRealData(apiData, period, start, end);
        setData(processedData);
        setLoading(false);
      } catch (err) {
        setError(true);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [period, dateRange]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod === 'weekly') {
      setDateRange(weekOptions[0]);
    } else if (newPeriod === 'monthly') {
      setDateRange(monthOptions[0]);
    } else {
      setDateRange(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto" style={{ maxWidth: '50rem' }}>
        {/* Header */}
        <div className="mb-8">
          {/* Alpha Testing Warning Banner */}
          <div style="display: none;" className="mb-6 bg-red-600 text-white rounded-xl p-6 shadow-2xl border-4 border-red-800">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">⚠️</span>
              <span className="text-2xl md:text-3xl font-extrabold tracking-wide uppercase">ALPHA TESTING: Data can be incorrect</span>
              <span className="text-3xl">⚠️</span>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">LTV Points Leaderboard</h1>
          </div>
          <p className="text-slate-600 mb-3">Top users by points earned</p>
          <div className="text-sm text-slate-600 space-y-2 max-w-3xl">
            <p>Points are awarded for participating in the LTV Protocol's first production vault — the wstETH (Lido) ↔ ETH Vault.</p>
            <p>LTV leverage token holders earn points depending on the position size and duration.</p>
            <p className="font-medium">42 NFT holders receive a 42% points boost.</p>
          </div>
        </div>



        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-medium text-slate-600">Total Points Distributed</h3>
            </div>
            {loading ? (
              <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-slate-800">
                {formatNumber(data?.pointsDistributed || 0)} <span className="text-lg text-slate-500">points</span>
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-medium text-slate-600">Distribution</h3>
            </div>
            {loading ? (
              <div className="h-8 w-40 bg-slate-200 rounded animate-pulse"></div>
            ) : (
              <p className="text-3xl font-bold text-slate-800">
                {data?.nextDistribution ? formatDate(data.nextDistribution) : 'N/A'}
              </p>
            )}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {error ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 mb-4">Unable to load leaderboard data. Please try again.</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Badges</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="h-6 w-8 bg-slate-200 rounded animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="h-6 w-20 bg-slate-200 rounded animate-pulse"></div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse ml-auto"></div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    data?.entries.map((entry) => (
                      <tr key={entry.rank} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-700">{entry.rank}</span>
                            <MedalIcon rank={entry.rank} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <a 
                            href={`https://etherscan.io/address/${entry.fullAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            {entry.ens || entry.address}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          <NFTBadge />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-bold text-slate-800">{formatNumber(entry.points)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {!loading && !error && (
          <div className="mt-4 text-center text-sm text-slate-500">
            LTV Points Leaderboard. Powered by leverage, patience, and bad sleep.
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardDashboard;
