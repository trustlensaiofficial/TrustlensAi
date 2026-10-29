/**
 * The background every flow page sits on.
 *
 * Server component on purpose: it renders no interactivity, so it costs the
 * client bundle nothing. The drift is CSS, so it starts with the first paint
 * rather than after hydration.
 */
export function LiquidStage() {
  return (
    <div className="lq-stage" aria-hidden="true">
      <span className="lq-aurora a1" />
      <span className="lq-aurora a2" />
      <span className="lq-aurora a3" />
      <span className="lq-grid" />
      <span className="lq-grain" />
    </div>
  );
}
