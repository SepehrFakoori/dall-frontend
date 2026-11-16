import { useRef } from 'react';
import { Link, useBeforeUnload, useBlocker, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import { memberApi, memberKeys, memberQuery } from './api';
import { departments, memberSchema, type Member, type MemberInput } from './model';
import { ApiError } from '../../shared/http';
import { useLocale } from '../../shared/preferences';
import { useSession } from '../../shared/session';
import type { MessageKey } from '../../shared/i18n/messages';
import {
  Button,
  Confirm,
  ErrorState,
  Field,
  Loading,
  PageHeader,
  useNotify,
} from '../../shared/ui';
export function Component() {
  const { id } = useParams();
  const { can } = useSession();
  const canWrite = can('member.write');
  const { data, error, isPending, refetch } = useQuery({
    ...memberQuery(id || ''),
    enabled: !!id && canWrite,
  });
  if (!canWrite) return <ErrorState error={new ApiError('forbidden', 403)} />;
  if (id && isPending) return <Loading />;
  if (error) return <ErrorState error={error} retry={() => void refetch()} />;
  return <MemberForm key={id || 'new'} member={data} />;
}
export function MemberForm({ member }: { member?: Member }) {
  const { t } = useLocale();
  const notify = useNotify();
  const navigate = useNavigate();
  const client = useQueryClient();
  const submitted = useRef(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<MemberInput>({
    resolver: zodResolver(memberSchema),
    defaultValues: member || {
      name: '',
      username: '',
      email: '',
      phone: '',
      department: 'engineering',
      status: 'active',
      notes: '',
    },
  });
  const mutation = useMutation({
    mutationFn: (input: MemberInput) => memberApi.save(input, member?.id),
    onSuccess: async (saved) => {
      submitted.current = true;
      await client.invalidateQueries({ queryKey: memberKeys.all });
      notify(t('saved'));
      void navigate(`/members/${saved.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError)
        Object.entries(error.fields).forEach(([field, key]) => {
          if (field in memberSchema.shape)
            setError(field as keyof MemberInput, { message: key }, { shouldFocus: true });
        });
    },
  });
  const blocker = useBlocker(() => isDirty && !submitted.current);
  useBeforeUnload((event) => {
    if (isDirty && !submitted.current) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  const disabled = isSubmitting || mutation.isPending;
  const message = (key: keyof MemberInput) =>
    errors[key]?.message ? t(errors[key]?.message as MessageKey) : undefined;
  return (
    <>
      <Link className="back-link" to="/members">
        <ArrowLeft size={15} className="directional" />
        {t('backMembers')}
      </Link>
      <PageHeader
        title={t(member ? 'edit' : 'newMember')}
        description={t(member ? 'editIntro' : 'createIntro')}
      />
      <form
        className="member-form"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          try {
            await mutation.mutateAsync(values);
          } catch {
            /* Input is retained and errors are rendered. */
          }
        })}
      >
        <p className="required-note">{t('required')}</p>
        <fieldset disabled={disabled} className="panel form-section">
          <legend className="sr-only">{t('profile')}</legend>
          <div className="form-section-heading">
            <h2>{t('profile')}</h2>
            <p>{t('profileHint')}</p>
          </div>
          <div className="form-grid">
            <Field label={t('name')} required error={message('name')}>
              {(props) => (
                <input
                  {...props}
                  {...register('name')}
                  required
                  autoComplete="name"
                  dir="auto"
                  maxLength={100}
                />
              )}
            </Field>
            <Field label={t('username')} required error={message('username')}>
              {(props) => (
                <input
                  {...props}
                  {...register('username')}
                  required
                  dir="ltr"
                  autoComplete="username"
                  maxLength={50}
                />
              )}
            </Field>
            <Field label={t('email')} required error={message('email')}>
              {(props) => (
                <input
                  {...props}
                  {...register('email')}
                  required
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  maxLength={254}
                />
              )}
            </Field>
            <Field label={t('phone')} error={message('phone')}>
              {(props) => (
                <input
                  {...props}
                  {...register('phone')}
                  type="tel"
                  dir="ltr"
                  autoComplete="tel"
                  maxLength={30}
                />
              )}
            </Field>
          </div>
        </fieldset>
        <fieldset disabled={disabled} className="panel form-section">
          <legend className="sr-only">{t('assignment')}</legend>
          <div className="form-section-heading">
            <h2>{t('assignment')}</h2>
            <p>{t('assignmentHint')}</p>
          </div>
          <div className="form-grid">
            <Field label={t('department')} required>
              {(props) => (
                <select {...props} {...register('department')}>
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {t(d)}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={t('status')} required>
              {(props) => (
                <select {...props} {...register('status')}>
                  <option value="active">{t('active')}</option>
                  <option value="inactive">{t('inactive')}</option>
                </select>
              )}
            </Field>
            <div className="span-all">
              <Field label={t('notes')} error={message('notes')}>
                {(props) => (
                  <textarea
                    {...props}
                    {...register('notes')}
                    dir="auto"
                    maxLength={1000}
                    rows={4}
                  />
                )}
              </Field>
            </div>
          </div>
        </fieldset>
        {mutation.error && !Object.keys(errors).length && <ErrorState error={mutation.error} />}
        <div className="form-actions">
          <Link className="button secondary" to="/members">
            {t('cancel')}
          </Link>
          <Button type="submit" loading={disabled}>
            <Save size={16} />
            {t(disabled ? 'saving' : member ? 'save' : 'createMember')}
          </Button>
        </div>
      </form>
      <Confirm
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.state === 'blocked') blocker.reset();
        }}
        title={t('leaveTitle')}
        description={t('leaveHint')}
        confirm={t('discard')}
        onConfirm={() => {
          if (blocker.state === 'blocked') blocker.proceed();
        }}
      />
    </>
  );
}
