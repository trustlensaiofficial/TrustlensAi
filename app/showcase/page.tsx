import { redirect } from 'next/navigation';

/**
 * The showcase used to be one page with three phases. The experience is now
 * a route per step (/ → /login → /story → /features), so this path only
 * exists to keep older links working.
 */
export default function ShowcaseRedirect(): never {
  redirect('/story');
}
