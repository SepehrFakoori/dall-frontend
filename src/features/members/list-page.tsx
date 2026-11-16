import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { memberApi, memberKeys, membersQuery } from './api';
import { filterMembers as selectMembers } from './model';
import { PAGE_SIZE, parseList } from './model';
import { useLocale } from '../../shared/preferences';
import { useSession } from '../../shared/session';
import { DataTable } from '../../shared/data-table';
import {
  ActionMenu,
  Avatar,
  Badge,
  Button,
  Confirm,
  Empty,
  ErrorState,
  Loading,
  PageHeader,
  useNotify,
} from '../../shared/ui';
export function Component() {
  const { t, count } = useLocale();
  const { can } = useSession();
  const notify = useNotify();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [params, setParams] = useSearchParams();
  const state = parseList(params);
  const { data, error, isPending, refetch, isFetching } = useQuery(membersQuery());
  function change(patch: Record<string, string>) {
    const next = new URLSearchParams(params);
    next.delete('page');
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: !!patch.q });
  }
  if (isPending) return <Loading />;
  if (error) return <ErrorState error={error} retry={() => void refetch()} />;
  return (
    <>
      <PageHeader
        title={t('members')}
        description={t('memberIntro')}
        action={
          can('member.write') && (
            <Link className="button primary" to="/members/new">
              <Plus size={16} />
              {t('newMember')}
            </Link>
          )
        }
      />
      <section className="panel directory-panel">
        <div className="directory-heading">
          <h2>
            <Users size={18} />
            {t('directory')}
            <span className="count-pill">{count(data.length)}</span>
          </h2>
          <button
            className="icon-button"
            aria-label={t('refresh')}
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw size={16} />
          </button>
        </div>
        <div className="table-toolbar">
          <label className="search-box">
            <Search size={17} />
            <input
              type="search"
              dir="auto"
              aria-label={t('search')}
              placeholder={t('search')}
              value={state.search}
              onChange={(e) => change({ q: e.target.value })}
            />
            {state.search && (
              <button
                className="icon-button"
                aria-label={t('clearSearch')}
                onClick={() => change({ q: '' })}
              >
                <X size={14} />
              </button>
            )}
          </label>
          <select
            aria-label={t('status')}
            value={state.status}
            onChange={(e) => change({ status: e.target.value })}
          >
            <option value="">{t('all')}</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
          <select
            aria-label={t('sort')}
            value={state.sort}
            onChange={(e) => change({ sort: e.target.value })}
          >
            <option value="newest">{t('newest')}</option>
            <option value="az">{t('az')}</option>
            <option value="za">{t('za')}</option>
          </select>
          {(state.search || state.status) && (
            <Button variant="ghost" onClick={() => setParams({})}>
              {t('clear')}
            </Button>
          )}
        </div>
        <Directory
          key={params.toString()}
          data={data}
          state={state}
          canWrite={can('member.write')}
          navigate={navigate}
          onPage={(page) => {
            const next = new URLSearchParams(params);
            next.set('page', String(page));
            setParams(next);
          }}
          onChange={async () => {
            await client.invalidateQueries({ queryKey: memberKeys.all });
            notify(t('deactivated'));
          }}
        />
        {isFetching && (
          <span className="sr-only" role="status">
            {t('loading')}
          </span>
        )}
      </section>
    </>
  );
}
function Directory({
  data,
  state,
  canWrite,
  navigate,
  onPage,
  onChange,
}: {
  data: Awaited<ReturnType<typeof memberApi.list>>;
  state: ReturnType<typeof parseList>;
  canWrite: boolean;
  navigate: ReturnType<typeof useNavigate>;
  onPage: (page: number) => void;
  onChange: () => Promise<void>;
}) {
  const { t, number, date } = useLocale();
  const filtered = selectMembers(data, state);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(state.page, pages);
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const [selected, setSelected] = useState<string[]>([]);
  const [targets, setTargets] = useState<string[]>([]);
  const mutation = useMutation({
    mutationFn: memberApi.deactivate,
    onSuccess: async () => {
      setTargets([]);
      setSelected([]);
      await onChange();
    },
  });
  const eligible = rows.filter((m) => m.status === 'active');
  const allSelected = eligible.length > 0 && eligible.every((m) => selected.includes(m.id));
  const ask = (ids: string[]) => {
    mutation.reset();
    setTargets(ids);
  };
  return (
    <>
      {canWrite && selected.length > 0 && (
        <div className="selection-bar" role="status">
          <strong>{t('selected', { count: number(selected.length) })}</strong>
          <Button variant="secondary" onClick={() => ask(selected)}>
            {t('deactivate')}
          </Button>
          <Button variant="ghost" onClick={() => setSelected([])}>
            {t('cancel')}
          </Button>
        </div>
      )}
      {rows.length ? (
        <>
          <DataTable label={t('directory')}>
            <thead>
              <tr>
                {canWrite && (
                  <th className="check-cell">
                    <input
                      type="checkbox"
                      aria-label={t('selectAll')}
                      checked={allSelected}
                      disabled={!eligible.length}
                      ref={(node) => {
                        if (node) node.indeterminate = selected.length > 0 && !allSelected;
                      }}
                      onChange={(e) =>
                        setSelected(e.target.checked ? eligible.map((m) => m.id) : [])
                      }
                    />
                  </th>
                )}
                <th>
                  {t('name')}
                  <ArrowDownUp size={12} aria-hidden="true" />
                </th>
                <th>{t('department')}</th>
                <th>{t('status')}</th>
                <th>{t('joined')}</th>
                <th className="action-cell">
                  <span className="sr-only">{t('actions')}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((member) => (
                <tr key={member.id} data-selected={selected.includes(member.id)}>
                  {canWrite && (
                    <td className="check-cell">
                      <input
                        type="checkbox"
                        aria-label={t('selectRow', { name: member.name })}
                        disabled={member.status === 'inactive'}
                        checked={selected.includes(member.id)}
                        onChange={(e) =>
                          setSelected((s) =>
                            e.target.checked
                              ? [...s, member.id]
                              : s.filter((id) => id !== member.id),
                          )
                        }
                      />
                    </td>
                  )}
                  <td>
                    <div className="member-cell">
                      <Avatar name={member.name} />
                      <div className="person">
                        <Link to={`/members/${member.id}`}>
                          <bdi>{member.name}</bdi>
                        </Link>
                        <span dir="ltr">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{t(member.department)}</td>
                  <td>
                    <Badge status={member.status} />
                  </td>
                  <td className="date-cell">{date(member.joined)}</td>
                  <td className="action-cell">
                    <ActionMenu
                      label={`${t('actions')}: ${member.name}`}
                      items={[
                        { label: t('view'), onSelect: () => navigate(`/members/${member.id}`) },
                        ...(canWrite
                          ? [
                              {
                                label: t('edit'),
                                onSelect: () => navigate(`/members/${member.id}/edit`),
                              },
                              {
                                label: t('deactivate'),
                                onSelect: () => ask([member.id]),
                                danger: true,
                                disabled: member.status === 'inactive',
                              },
                            ]
                          : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
          <div className="pagination">
            <span>
              {t('results', {
                from: number((page - 1) * PAGE_SIZE + 1),
                to: number(Math.min(page * PAGE_SIZE, filtered.length)),
                count: number(filtered.length),
              })}
            </span>
            <div>
              <button
                className="icon-button"
                aria-label={t('previous')}
                disabled={page === 1}
                onClick={() => onPage(page - 1)}
              >
                <ChevronLeft size={17} className="directional" />
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 1)
                .map((p) => (
                  <button
                    key={p}
                    className={`page-button ${p === page ? 'current' : ''}`}
                    aria-current={p === page ? 'page' : undefined}
                    onClick={() => onPage(p)}
                  >
                    {number(p)}
                  </button>
                ))}
              <button
                className="icon-button"
                aria-label={t('next')}
                disabled={page === pages}
                onClick={() => onPage(page + 1)}
              >
                <ChevronRight size={17} className="directional" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <Empty filtered={!!state.search || !!state.status} />
      )}
      <Confirm
        open={canWrite && targets.length > 0}
        onOpenChange={(open) => {
          if (!open) setTargets([]);
        }}
        title={t('deactivateTitle')}
        description={t('deactivateHint')}
        confirm={t('confirm')}
        busy={mutation.isPending}
        error={mutation.error}
        onConfirm={() => mutation.mutate(targets)}
      />
    </>
  );
}
