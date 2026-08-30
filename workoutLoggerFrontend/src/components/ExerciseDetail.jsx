import React from 'react';

// free-exercise-db images are served from jsDelivr rather than bundled.
export const IMG_CDN = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

/**
 * Renders an exercise's start/end photos + numbered instructions. `detail` is either the
 * loaded object ({ instructions, images }), the string 'loading', 'error', or null.
 */
export default function ExerciseDetail({ detail }) {
  if (detail === 'loading') return <p className="text-sm text-muted">Loading…</p>;
  if (detail === 'error') return <p className="text-sm text-danger">Couldn't load details.</p>;
  if (!detail) return null;

  return (
    <>
      {detail.images && detail.images.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          {detail.images.map((img, i) => (
            <img
              key={i}
              src={`${IMG_CDN}${img}`}
              alt=""
              loading="lazy"
              className="w-full rounded-lg border border-line object-cover"
            />
          ))}
        </div>
      )}
      {detail.instructions && detail.instructions.length > 0 ? (
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
          {detail.instructions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted">No instructions available.</p>
      )}
    </>
  );
}
