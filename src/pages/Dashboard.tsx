import React, { useEffect, useState } from 'react';
import { FileText, FolderOpen, Mail, Users, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useLocale } from '../contexts/LocaleContext';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalCategories: 0,
    totalSubscribers: 0,
    totalMessages: 0,
  });

  const [recentArticles, setRecentArticles] = useState<any[]>([]);
  const { t } = useLocale();

  useEffect(() => {
    // fetch on mount
    fetchStats();
    fetchRecentArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      const [articlesRes, categoriesRes, subscribersRes, messagesRes] = await Promise.all([
        supabase.from('articles').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalArticles: articlesRes.count || 0,
        totalCategories: categoriesRes.count || 0,
        totalSubscribers: subscribersRes.count || 0,
        totalMessages: messagesRes.count || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, author, published_date')
        .order('published_date', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentArticles(data || []);
    } catch (error) {
      console.error('Error fetching recent articles:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dashboard')}</h1>
        <p className="text-gray-600">{t('welcome')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('total_articles')} value={stats.totalArticles} icon={<FileText size={24} />} color="green" trend="+12%" />
        <StatCard title={t('total_categories')} value={stats.totalCategories} icon={<FolderOpen size={24} />} color="blue" />
        <StatCard title={t('subscribers')} value={stats.totalSubscribers} icon={<Users size={24} />} color="gold" trend="+8%" />
        <StatCard title={t('messages')} value={stats.totalMessages} icon={<Mail size={24} />} color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#00A86B]/10 rounded-lg">
              <TrendingUp className="text-[#00A86B]" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t('recent_activity')}</h2>
          </div>
          <div className="space-y-4">
            {recentArticles.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('no_recent_articles')}</p>
            ) : (
              recentArticles.map((article) => (
                <div key={article.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-white rounded-md shadow-sm">
                    <FileText size={16} className="text-[#00A86B]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{article.title}</p>
                    <p className="text-sm text-gray-500">
                      {t('by')} {article.author} • {article.published_date ? new Date(article.published_date).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('quick_stats')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#00A86B]/5 to-[#00A86B]/10 rounded-lg">
              <span className="text-gray-700 font-medium">{t('articles_this_month')}</span>
              <span className="text-2xl font-bold text-[#00A86B]">{stats.totalArticles}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0077B6]/5 to-[#0077B6]/10 rounded-lg">
              <span className="text-gray-700 font-medium">{t('active_subscribers')}</span>
              <span className="text-2xl font-bold text-[#0077B6]">{stats.totalSubscribers}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#FFD700]/5 to-[#FFD700]/10 rounded-lg">
              <span className="text-gray-700 font-medium">{t('unread_messages')}</span>
              <span className="text-2xl font-bold text-[#FFC700]">{stats.totalMessages}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
