/**
 * Compatibility shim over `lib/incident/recovery-plan.ts`.
 *
 * This module used to hold its own incident advice for seven action states.
 * The contract in `docs/openapi.yaml` defines twelve, and the real engine now
 * lives in `lib/incident/recovery-plan.ts` with fake-recovery-agent warnings,
 * routed official channels and a mandatory disclaimer.
 *
 * Two sets of incident advice is a genuine hazard for a safety feature — the
 * next person to import one of them gets whichever happens to be stale, and
 * the stale one here had no recovery-scam warning on an approved payment. So
 * this file keeps its old signature for the existing components and delegates
 * everything else.
 *
 * The legacy state names are mapped below. Where a legacy name is ambiguous it
 * maps to the *more* exposed state, because under-warning is the dangerous
 * direction.
 */

import {
  recoveryPlanFor,
  type RecoveryPlan,
  type UserActionState as ContractActionState,
} from '../incident/recovery-plan';
import type { UserActionState } from './types';

/**
 * The full plan. Wider than the shape this module used to return — it gained
 * `actionState`, `urgency`, `officialChannels` and `disclaimer` — so existing
 * callers reading title, summary and steps are unaffected.
 */
export type ResponsePlan = RecoveryPlan;

/**
 * Legacy seven states onto the contract's twelve.
 *
 * `shared_credentials` becomes `shared_otp_or_pin` rather than
 * `entered_credentials`: the copy it replaced explicitly covered "bank, UPI,
 * card, or OTP details" and led with calling the bank, which is the
 * OTP-grade response. Treating it as a password-only exposure would downgrade
 * the urgency of the more serious half.
 */
const LEGACY_TO_CONTRACT: Record<Exclude<UserActionState, 'not_acted'>, ContractActionState> = {
  opened_link: 'opened_link',
  shared_credentials: 'shared_otp_or_pin',
  installed_app: 'installed_app',
  remote_access: 'granted_remote_access',
  approved_payment: 'approved_payment_request',
  sent_money: 'transferred_money',
};

/**
 * Turns the user's reported action into a response sequence.
 *
 * Guidance only. Never a claim that a payment can be reversed or an account
 * recovered — see `disclaimer` on the returned plan.
 */
export function responsePlanFor(state: UserActionState | null | undefined): ResponsePlan | null {
  if (!state || state === 'not_acted') return null;
  const mapped = LEGACY_TO_CONTRACT[state];
  if (!mapped) return null;
  return recoveryPlanFor(mapped);
}
