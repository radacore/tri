import { useQuery } from "@tanstack/react-query";
import { get } from "../api/client";

/** Category dropdown fed by /categories (falls back to free text). */
export default function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const { data } = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<{ name: string }[]> => {
      try {
        const r = await get<{ name: string }[] | { items: { name: string }[] }>(
          "/categories"
        );
        return Array.isArray(r) ? r : (r.items ?? []);
      } catch {
        return [];
      }
    },
  });
  const names = (data ?? []).map((c) => c.name);
  if (names.length === 0 || !names.includes(value)) {
    return (
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Tech"
      />
    );
  }
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {names.map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}
