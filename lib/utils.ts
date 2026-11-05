import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Join class names, letting a later Tailwind utility win over an earlier one
 * in the same group.
 *
 * Plain string concatenation does not do that: `"p-2" + " p-4"` leaves both in
 * the class list and the cascade decides, which is why a `className` prop
 * sometimes silently fails to override a component's default. `twMerge`
 * resolves the conflict by group, so the caller's value is the one that lands.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
