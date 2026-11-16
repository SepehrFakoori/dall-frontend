import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Icon } from '../../shared/icon';
import {
  displayName,
  profileSchema,
  type Account,
  type ProfileInput,
} from '../../shared/account-api';
import { useSession } from '../../shared/session';
import { UnsavedChanges } from '../../shared/unsaved-changes';
import { useLocale } from '../../shared/preferences';
import { ApiError } from '../../shared/http';
import { Avatar, Button, Field, PageHeader, useNotify } from '../../shared/ui';

const fields = [
  { name: 'first_name', label: 'firstName', complete: 'given-name' },
  { name: 'last_name', label: 'lastName', complete: 'family-name' },
  { name: 'email', label: 'email', complete: 'email' },
] as const;

function editableProfile({ first_name, last_name, email }: Account): ProfileInput {
  return { first_name, last_name, email };
}

export function Component() {
  const { user } = useSession();
  return user && <Profile key={user.id} user={user} />;
}
function Profile({ user }: { user: Account }) {
  const { t } = useLocale();
  const { updateProfile } = useSession();
  const notify = useNotify();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    values: editableProfile(user),
    resetOptions: { keepDirtyValues: true },
  });
  return (
    <>
      <PageHeader title={t('myAccount')} description={t('accountIntro')} />
      <form
        className="member-form"
        noValidate
        onSubmit={handleSubmit(async (values) => {
          try {
            const updated = await updateProfile(values);
            reset(editableProfile(updated));
            notify(t('saved'));
          } catch (error) {
            if (error instanceof ApiError && error.status === 400) {
              const invalid = fields.filter(({ name }) => name in error.fields);
              if (invalid.length) {
                invalid.forEach(({ name }) => setError(name, { type: 'server' }));
                return;
              }
            }
            setError('root', { type: 'save' });
          }
        })}
      >
        <fieldset className="panel settings-section account-panel" disabled={isSubmitting}>
          <legend className="sr-only">{t('profile')}</legend>
          <div className="account-identity">
            <Avatar name={displayName(user)} />
            <div>
              <h2>
                <bdi>{displayName(user)}</bdi>
              </h2>
              <p className="muted">
                {t('username')} · <bdi>{user.username}</bdi>
              </p>
            </div>
          </div>
          <div className="form-grid">
            {fields.map(({ name, label, complete }) => (
              <div key={name} className={name === 'email' ? 'span-all' : undefined}>
                <Field
                  label={t(label)}
                  error={errors[name] && t(name === 'email' ? 'invalidEmail' : 'nameTooLong')}
                >
                  {(props) => (
                    <input
                      {...props}
                      {...register(name)}
                      type={name === 'email' ? 'email' : 'text'}
                      autoComplete={complete}
                      dir={name === 'email' ? 'ltr' : 'auto'}
                      maxLength={name === 'email' ? 254 : 150}
                    />
                  )}
                </Field>
              </div>
            ))}
          </div>
          {errors.root && (
            <p className="alert danger" role="alert">
              {t('saveProfileFailed')}
            </p>
          )}
          <div className="form-actions">
            <Button
              type="button"
              disabled={!isDirty}
              variant="secondary"
              onClick={() => reset(editableProfile(user))}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={!isDirty} loading={isSubmitting}>
              <Icon name="clipboard-tick" size={16} />
              {t('save')}
            </Button>
          </div>
        </fieldset>
      </form>
      {isDirty && <UnsavedChanges />}
    </>
  );
}
