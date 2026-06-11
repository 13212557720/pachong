import type { InstagramUserFilters } from "@/types/api";
import type { SharedFilterFormFields } from "@/types/filter-form";
import { parseDelimitedInput } from "@/utils/filter-input";

export interface ExtraDataFilterFormState extends SharedFilterFormFields {
  is_private_true: boolean;
  is_private_false: boolean;
  followers_count_min: string;
  followers_count_max: string;
}


function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toExtraDataFilters(form: ExtraDataFilterFormState): InstagramUserFilters {
  const isPrivateIn = [
    ...(form.is_private_true ? [true] : []),
    ...(form.is_private_false ? [false] : []),
  ];
  const ipLocationIn = parseDelimitedInput(form.ip_location_in);
  const ipLocationNotIn = parseDelimitedInput(form.ip_location_not_in);

  return {
    id: form.id.trim() || undefined,
    username: form.username.trim() || undefined,
    is_private_in: isPrivateIn.length > 0 ? isPrivateIn : undefined,
    is_private: null,
    followers_count_min: parseOptionalNumber(form.followers_count_min),
    followers_count_max: parseOptionalNumber(form.followers_count_max),
    ip_location: form.ip_location.trim() || undefined,
    ip_location_in: ipLocationIn.length > 0 ? ipLocationIn : undefined,
    ip_location_not_in: ipLocationNotIn.length > 0 ? ipLocationNotIn : undefined,
    ip_location_not_include_null: form.ip_location_not_include_null,
    created_at_min: form.created_at_min.trim() || undefined,
    created_at_max: form.created_at_max.trim() || undefined,
  };
}
