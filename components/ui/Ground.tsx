/**
 * The atmospheric field behind the whole product.
 *
 * Deliberately static and deliberately a server component — there is nothing
 * to hydrate and nothing to animate. A background that moves is a background
 * people look at, and this one sits behind a product someone opens when
 * something has gone wrong.
 *
 * It exists so the glass has something to refract. Without it every pane
 * samples a flat colour and the depth system collapses into grey rectangles.
 */
export function Ground() {
  return <div className="tl-ground" aria-hidden="true" />;
}
