"use client";

type CollabTraceItem = {
  title: string;
  payload: unknown;
};

type CollabTraceProps = {
  trace: CollabTraceItem[];
};

export function CollabTrace({ trace }: CollabTraceProps) {
  return (
    <section className="panel">
      <h2>Collaboration Trace</h2>
      <div className="trace-list">
        {trace.map((item, index) => (
          <div className="trace-card" key={`${item.title}-${index}`}>
            <strong>{item.title}</strong>
            <code>{JSON.stringify(item.payload, null, 2)}</code>
          </div>
        ))}
      </div>
    </section>
  );
}
