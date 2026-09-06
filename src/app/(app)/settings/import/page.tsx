import { TallyImportClient } from "./tally-import-client";

export default function TallyImportPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold" data-testid="tally-import-heading">
        Tally import (stub)
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Preview CSV/XML-ish text locally. Confirm records an audit stub — does not
        mutate ledgers yet.
      </p>
      <div className="mt-6">
        <TallyImportClient />
      </div>
    </div>
  );
}
