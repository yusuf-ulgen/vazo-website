import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Inbox, Building2, Mail, Users } from 'lucide-react';
import { AdminPageHeader } from '@/admin/ui';
import { ContactMessagesTab } from '../components/ContactMessagesTab';
import { TradeApplicationsTab } from '../components/TradeApplicationsTab';
import { NewsletterTab } from '../components/NewsletterTab';

type SubmissionTab = 'contact' | 'trade' | 'newsletter';

export function AdminSubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as SubmissionTab | null;

  const [activeTab, setActiveTab] = useState<SubmissionTab>(
    tabFromUrl && ['contact', 'trade', 'newsletter'].includes(tabFromUrl)
      ? tabFromUrl
      : 'contact'
  );

  useEffect(() => {
    if (tabFromUrl && ['contact', 'trade', 'newsletter'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (tab: SubmissionTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const tabs: { id: SubmissionTab; label: string; icon: typeof Inbox }[] = [
    { id: 'contact', label: 'İletişim Mesajları', icon: Mail },
    { id: 'trade', label: 'Toptan & B2B Başvuruları', icon: Building2 },
    { id: 'newsletter', label: 'E-Bülten Aboneleri', icon: Users },
  ];

  return (
    <div className="space-y-6 text-left animate-fade-in">
      <AdminPageHeader
        title="Gelen Başvurular & İletişim"
        description="Müşteri iletişim mesajları, kurumsal toptan (trade) başvuruları ve bülten aboneliklerini yönetin."
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border-subtle overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                isActive
                  ? 'bg-action-primary text-action-primary-text shadow-xs'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-surface-muted'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'contact' && <ContactMessagesTab />}
        {activeTab === 'trade' && <TradeApplicationsTab />}
        {activeTab === 'newsletter' && <NewsletterTab />}
      </div>
    </div>
  );
}
