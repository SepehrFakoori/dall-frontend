import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import {
  Users,
  UserCheck,
  Building2,
  UserRoundMinus,
  Plus,
  ArrowUpRight,
  Settings2,
  ArrowRight,
  Layers3,
} from 'lucide-react';
import { membersQuery } from '../members/api';
import { useLocale } from '../../shared/preferences';
import { useSession } from '../../shared/session';
import { Avatar, Badge, Empty, ErrorState, Loading, PageHeader } from '../../shared/ui';
export function Component() {
  const { data, error, isPending, refetch } = useQuery(membersQuery());
  const { t, number } = useLocale();
  const { can } = useSession();
  if (isPending) return <Loading />;
  if (error) return <ErrorState error={error} retry={() => void refetch()} />;
  const active = data.filter((m) => m.status === 'active').length;
  const percent = data.length ? Math.round((active / data.length) * 100) : 0;
  const metrics = [
    { label: 'directoryTotal', value: data.length, icon: Users },
    { label: 'activeMembers', value: active, icon: UserCheck },
    { label: 'departments', value: new Set(data.map((m) => m.department)).size, icon: Building2 },
    { label: 'inactiveMembers', value: data.length - active, icon: UserRoundMinus },
  ] as const;
  return (
    <>
      <PageHeader
        eyebrow={t('overviewTitle')}
        title={t('welcome')}
        description={t('overviewIntro')}
        action={
          can('member.write') && (
            <Link className="button primary" to="/members/new">
              <Plus size={16} />
              {t('newMember')}
            </Link>
          )
        }
      />
      <div className="metrics">
        {metrics.map(({ label, value, icon: Icon }) => (
          <section className="metric" key={label}>
            <div className="metric-top">
              <span>{t(label)}</span>
              <Icon size={18} />
            </div>
            <strong>{number(value)}</strong>
            <small>{t('lastUpdated')}</small>
          </section>
        ))}
      </div>
      <div className="overview-grid">
        <section className="panel recent-panel">
          <div className="panel-header">
            <div>
              <h2>{t('recentMembers')}</h2>
              <p>{t('directory')}</p>
            </div>
            <Link className="text-link" to="/members">
              {t('viewAll')}
              <ArrowUpRight size={15} className="directional" />
            </Link>
          </div>
          {data.length ? (
            <div className="recent-list">
              {[...data]
                .sort((a, b) => b.joined.localeCompare(a.joined))
                .slice(0, 5)
                .map((member) => (
                  <Link key={member.id} className="recent-row" to={`/members/${member.id}`}>
                    <Avatar name={member.name} />
                    <div className="person">
                      <strong>
                        <bdi>{member.name}</bdi>
                      </strong>
                      <span>{t(member.department)}</span>
                    </div>
                    <Badge status={member.status} />
                    <ArrowRight size={16} className="directional muted" />
                  </Link>
                ))}
            </div>
          ) : (
            <Empty />
          )}
        </section>
        <section className="panel health-panel">
          <div className="panel-header">
            <div>
              <h2>{t('directoryHealth')}</h2>
              <p>{t('healthHint')}</p>
            </div>
            <span className="icon-tile">
              <Users size={18} />
            </span>
          </div>
          <div className="health-value">
            <strong>
              {number(percent)}
              <span>%</span>
            </strong>
            <p>{t('activeShare')}</p>
          </div>
          <div
            className="health-bar"
            role="img"
            aria-label={`${t('activeMembers')}: ${number(percent)}%`}
          >
            <span style={{ width: `${percent}%` }} />
          </div>
          <div className="legend">
            <span>
              <i className="status-dot active-dot" />
              {t('active')}
              <strong>{number(active)}</strong>
            </span>
            <span>
              <i className="status-dot inactive-dot" />
              {t('inactive')}
              <strong>{number(data.length - active)}</strong>
            </span>
          </div>
          <div className="health-note">
            <Layers3 size={18} />
            <p>{t('assignmentHint')}</p>
          </div>
        </section>
        <section className="panel shortcut-panel">
          <div className="panel-header">
            <h2>{t('quickActions')}</h2>
          </div>
          <div className="shortcuts">
            {can('member.write') && (
              <Link to="/members/new">
                <span className="icon-tile">
                  <Plus size={19} />
                </span>
                <div>
                  <strong>{t('newMember')}</strong>
                  <p>{t('addHint')}</p>
                </div>
                <ArrowUpRight size={18} className="directional" />
              </Link>
            )}
            <Link to="/settings">
              <span className="icon-tile">
                <Settings2 size={19} />
              </span>
              <div>
                <strong>{t('preferences')}</strong>
                <p>{t('settingsHint')}</p>
              </div>
              <ArrowUpRight size={18} className="directional" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
