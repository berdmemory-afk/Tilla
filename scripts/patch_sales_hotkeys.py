from pathlib import Path

p = Path("src/app/(app)/vouchers/sales/new/sales-form.tsx")
t = p.read_text()
if "bindVoucherHotkeys" in t:
    print("already")
    raise SystemExit(0)

t = t.replace(
    "use client";\nimport { useMemo, useState } from \"react\";",
    "use client";\nimport { useEffect, useMemo, useRef, useState } from \"react\";",
1)
t = t.replace(
    'import { computeGst, invoiceTotal, round2 } from "@/lib/tax/gst";",
    'import { computeGst, invoiceTotal, round2 } from "@/lib/tax/gst";\nimport { bindVoucherHotkeys } from "@/lib/ui/voucher-hotkeys";',
1)
print('ok imports')
p.write_text(t)
