import { useBeforeUnload, useBlocker } from 'react-router';
import { useLocale } from './preferences';
import { Confirm } from './ui';

export function UnsavedChanges({ hasChanges = () => true }: { hasChanges?: () => boolean }) {
  const { t } = useLocale();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      currentLocation.pathname !== nextLocation.pathname && hasChanges(),
  );
  useBeforeUnload((event) => {
    if (hasChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  if (blocker.state !== 'blocked') return null;
  return (
    <Confirm
      open
      onOpenChange={(open) => {
        if (!open) blocker.reset();
      }}
      title={t('leaveTitle')}
      description={t('leaveHint')}
      confirm={t('discard')}
      onConfirm={blocker.proceed}
    />
  );
}
