// Small line icons, drawn to match the app's thin gold-on-navy look. 24px grid, 1.6px stroke.

import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 22, children, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  )
}

export const BackIcon = (p: IconProps) => <Icon {...p}><path d="M15 5l-7 7 7 7" /></Icon>
export const CloseIcon = (p: IconProps) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>
export const PlusIcon = (p: IconProps) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
export const MoreIcon = (p: IconProps) => <Icon {...p}><circle cx="12" cy="5.5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="18.5" r="1" fill="currentColor" /></Icon>
export const SearchIcon = (p: IconProps) => <Icon {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></Icon>
export const PlayIcon = (p: IconProps) => <Icon {...p}><path d="M8 5.5v13l10-6.5z" /></Icon>
export const MenuIcon = (p: IconProps) => <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>
export const BookIcon = (p: IconProps) => <Icon {...p}><path d="M5 4.5h10.5a2.5 2.5 0 012.5 2.5v13H7.5A2.5 2.5 0 015 17.5z" /><path d="M5 17.5A2.5 2.5 0 017.5 15H18" /></Icon>
export const ImageIcon = (p: IconProps) => <Icon {...p}><rect x="4" y="5" width="16" height="14" rx="1.5" /><circle cx="9" cy="10" r="1.5" /><path d="M4.5 17l4.5-4.5 3.5 3.5 2.5-2.5 4.5 4.5" /></Icon>
export const TrashIcon = (p: IconProps) => <Icon {...p}><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></Icon>
export const ShareIcon = (p: IconProps) => <Icon {...p}><path d="M12 4v11M8 8l4-4 4 4M5 13v6h14v-6" /></Icon>
export const ImportIcon = (p: IconProps) => <Icon {...p}><path d="M12 15V4M8 11l4 4 4-4M5 13v6h14v-6" /></Icon>

// The hex the app's brand and floating widget use.
export const HexIcon = (p: IconProps) => <Icon {...p}><path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z" /><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" /></Icon>
