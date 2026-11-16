import spriteUrl from '../assets/icons/iconsax-outline.svg?no-inline';

export type IconName =
  | 'add'
  | 'arrow-3'
  | 'arrow-down-1'
  | 'arrow-left'
  | 'arrow-left-2'
  | 'arrow-right-1'
  | 'arrow-right-3'
  | 'buildings'
  | 'category'
  | 'clipboard-tick'
  | 'close-circle'
  | 'color-swatch'
  | 'danger'
  | 'designtools'
  | 'edit-2'
  | 'element-4'
  | 'eye'
  | 'eye-slash'
  | 'global'
  | 'info-circle'
  | 'layer'
  | 'menu-1'
  | 'message-question'
  | 'monitor'
  | 'moon'
  | 'more'
  | 'profile-2user'
  | 'refresh'
  | 'refresh-2'
  | 'search-normal-1'
  | 'setting-2'
  | 'shield-tick'
  | 'sun-1'
  | 'tick-circle'
  | 'translate'
  | 'tree'
  | 'user'
  | 'user-minus'
  | 'user-tick'
  | 'warning-2';

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
};

export function Icon({ name, size = 24, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <use href={spriteUrl + '#' + name} />
    </svg>
  );
}
