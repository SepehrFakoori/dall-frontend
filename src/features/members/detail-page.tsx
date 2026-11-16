import { Link, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '../../shared/icon';
import { memberQuery } from './api';
import { useLocale } from '../../shared/preferences';
import { useSession } from '../../shared/session';
import { Avatar, Badge, ErrorState, Help, Loading, PageHeader, Tabs } from '../../shared/ui';
export function Component() {
  const { id } = useParams();
  const { data, error, isPending, refetch } = useQuery(memberQuery(id || ''));
  const { t, date } = useLocale();
  const { can } = useSession();
  if (!can('member.read')) return <ErrorState />;
  if (isPending) return <Loading />;
  if (error) return <ErrorState error={error} retry={() => void refetch()} />;
  return (
    <>
      <Link className="back-link" to="/members">
        <Icon name="arrow-left" className="directional" size={15} />
        {t('backMembers')}
      </Link>
      <PageHeader
        title={data.name}
        description={t('memberSince', { date: date(data.joined) })}
        action={
          can('member.write') && (
            <Link className="button secondary" to={`/members/${data.id}/edit`}>
              <Icon name="edit-2" size={15} />
              {t('edit')}
            </Link>
          )
        }
      />
      <section className="panel detail-summary">
        <Avatar name={data.name} />
        <div>
          <h2>
            <bdi>{data.name}</bdi>
          </h2>
          <span dir="ltr">{data.email}</span>
        </div>
        <Badge status={data.status} />
      </section>
      <Tabs.Root defaultValue="general" className="detail-tabs">
        <Tabs.List className="tabs" aria-label={t('details')}>
          <Tabs.Trigger value="general">{t('general')}</Tabs.Trigger>
          <Tabs.Trigger value="security">{t('security')}</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="general">
          <div className="panel form-section">
            <h2>{t('profile')}</h2>
            <dl className="detail-grid">
              {[
                ['username', data.username],
                ['email', data.email],
                ['department', t(data.department)],
                ['phone', data.phone || '—'],
                ['memberId', data.id],
                ['joined', date(data.joined)],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt>{t(key as 'username')}</dt>
                  <dd>
                    <bdi dir={['phone', 'email', 'memberId'].includes(key) ? 'ltr' : 'auto'}>
                      {value}
                    </bdi>
                  </dd>
                </div>
              ))}
            </dl>
            <hr />
            <h3>{t('notes')}</h3>
            <p dir="auto" className="preserve-lines">
              {data.notes || t('noNotes')}
            </p>
          </div>
        </Tabs.Content>
        <Tabs.Content value="security">
          <section className="panel form-section">
            <h2>
              <Icon name="shield-tick" size={18} />
              {t('security')}
              <Help>{t('tooltip')}</Help>
            </h2>
            <p>{t('permissionsNote')}</p>
          </section>
        </Tabs.Content>
      </Tabs.Root>
    </>
  );
}
