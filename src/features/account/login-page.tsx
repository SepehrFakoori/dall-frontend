import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useForm } from 'react-hook-form';
import { Icon } from '../../shared/icon';
import { demoCredentials, demoMode } from '../../shared/account-api';
import { ApiError } from '../../shared/http';
import { useLocale } from '../../shared/preferences';
import { useSession } from '../../shared/session';
import { Button, Field } from '../../shared/ui';

function destination(from: unknown) {
  const home = demoMode ? '/' : '/account';
  if (typeof from !== 'string' || !from.startsWith('/')) return home;
  try {
    const url = new URL(from, window.location.origin);
    return url.origin === window.location.origin &&
      !url.pathname.startsWith('//') &&
      url.pathname !== '/login'
      ? url.pathname + url.search + url.hash
      : home;
  } catch {
    return home;
  }
}

export function Component() {
  const { user, signIn } = useSession();
  const location = useLocation();
  const { t, update, preferences } = useLocale();
  const [visible, setVisible] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{ username: string; password: string }>();
  const title = t('signIn');
  const app = t('app');
  useEffect(() => {
    document.title = `${title} · ${app}`;
  }, [title, app]);
  if (user) return <Navigate to={destination(location.state?.from)} replace />;
  const nextLanguage = preferences.language === 'fa' ? 'en' : 'fa';
  return (
    <main className="login-page">
      <div className="login-wrap">
        <header className="login-masthead">
          <div className="brand">
            <span className="brand-mark">
              <Icon name="tree" size={23} />
            </span>
            <span>{app}</span>
          </div>
          <Button
            variant="ghost"
            lang={nextLanguage}
            onClick={() => update({ language: nextLanguage })}
          >
            <Icon name="translate" size={16} />
            {nextLanguage === 'fa' ? 'فارسی' : 'English'}
          </Button>
        </header>
        <section className="panel login-card" aria-labelledby="login-title">
          <div>
            <h1 id="login-title">{title}</h1>
            <p className="muted">{t('signInIntro')}</p>
          </div>
          <form
            noValidate
            onSubmit={handleSubmit(async ({ username, password }) => {
              try {
                await signIn(username.trim(), password);
              } catch (error) {
                const key =
                  error instanceof ApiError && error.status === 401
                    ? 'invalidCredentials'
                    : 'signInFailed';
                setError('root', { type: key });
              }
            })}
          >
            <fieldset disabled={isSubmitting} className="login-fields">
              <Field label={t('username')} error={errors.username && t('enterUsername')}>
                {(props) => (
                  <input
                    {...props}
                    {...register('username', { validate: (v) => !!v.trim() })}
                    autoComplete="username"
                    dir="auto"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                  />
                )}
              </Field>
              <Field label={t('password')} error={errors.password && t('enterPassword')}>
                {(props) => (
                  <div className="password-field">
                    <input
                      {...props}
                      {...register('password', { required: true })}
                      type={visible ? 'text' : 'password'}
                      dir="auto"
                      autoComplete="current-password"
                      spellCheck={false}
                      required
                    />
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={t(visible ? 'hidePassword' : 'showPassword')}
                      onClick={() => setVisible(!visible)}
                    >
                      <Icon name={visible ? 'eye-slash' : 'eye'} size={17} />
                    </button>
                  </div>
                )}
              </Field>
              {errors.root && (
                <p className="alert danger" role="alert">
                  {t(
                    errors.root.type === 'invalidCredentials'
                      ? 'invalidCredentials'
                      : 'signInFailed',
                  )}
                </p>
              )}
              <Button loading={isSubmitting} type="submit">
                {title}
                <Icon name="arrow-right-1" size={16} className="directional" />
              </Button>
            </fieldset>
          </form>
          {demoMode && (
            <aside className="sample-login">
              <h2>{t('sampleAccount')}</h2>
              <dl>
                <div>
                  <dt>{t('username')}</dt>
                  <dd>
                    <bdi dir="ltr">{demoCredentials.username}</bdi>
                  </dd>
                </div>
                <div>
                  <dt>{t('password')}</dt>
                  <dd>
                    <bdi dir="ltr">{demoCredentials.password}</bdi>
                  </dd>
                </div>
              </dl>
            </aside>
          )}
        </section>
      </div>
    </main>
  );
}
