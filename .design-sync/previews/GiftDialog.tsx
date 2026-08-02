import * as React from 'react';
import * as S from "@ds-stories/ui/src/GiftDialog.stories";

function compose(S: any, key: string) {
  const meta: any = S.default ?? {};
  const st: any = S[key];
  const args: any = { ...(meta.args ?? {}), ...(st && st.args ? st.args : {}) };
  // Storybook resolves argTypes.mapping (control value -> real arg) before
  // rendering; mirror that so mapped args don't render raw.
  const at: any = { ...(meta.argTypes ?? {}), ...(st && st.argTypes ? st.argTypes : {}) };
  for (const k of Object.keys(args)) {
    const m = at[k] && at[k].mapping;
    if (m && typeof m === 'object' && args[k] in m) args[k] = m[args[k]];
  }
  const title: string = typeof meta.title === 'string' ? meta.title : '';
  const ctx: any = {
    args, name: key, title, kind: title, id: '', componentId: '',
    globals: {}, viewMode: 'story',
    parameters: (st && st.parameters) ?? meta.parameters ?? {},
  };
  let render: (() => any) | null = null;
  if (st && typeof st.render === 'function') render = () => st.render(args, ctx);
  else if (typeof st === 'function') render = () => st(args, ctx);
  else if (typeof meta.render === 'function') render = () => meta.render(args, ctx);
  else {
    const C = (st && st.component) || meta.component;
    if (C) render = () => React.createElement(C, args);
  }
  if (!render) return () => null;
  // [].concat: a single function is legal CSF decorator shorthand. A
  // decorator returning undefined (stubbed addon) falls through to the inner
  // render — otherwise one unrecognized addon blanks the cell silently.
  const decorators: any[] = ([] as any[]).concat((st && st.decorators) ?? []).concat(meta.decorators ?? []);
  return decorators.reduce((inner: any, dec: any) => () => {
    const out = dec(inner, ctx);
    return out === undefined ? inner() : out;
  }, render);
}


// The overlay is `position: fixed`, so a story whose only child is the overlay
// measures 0px tall and its product card collapses. A transformed wrapper
// becomes the containing block for fixed descendants, giving the card real
// height while still rendering the REAL open overlay — containment, not
// neutralisation: the open state being verified is untouched.
const stage = (Comp: any, h: number) =>
  function Staged() {
    return (
      <div
        style={{
          position: 'relative',
          transform: 'translate(0)',
          height: h,
          overflow: 'hidden',
          borderRadius: 14,
        }}
      >
        <Comp />
      </div>
    );
  };

export const Default = /* Default */ stage(compose(S, "Default"), 620);
export const EmptyBinder = /* Empty Binder */ stage(compose(S, "EmptyBinder"), 620);
export const Sending = /* Sending */ stage(compose(S, "Sending"), 620);
export const Failed = /* Failed */ stage(compose(S, "Failed"), 620);
export const Closed = /* Closed */ stage(compose(S, "Closed"), 620);
