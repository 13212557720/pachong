import type { InstagramUserFilters } from "@/types/api";
import type { SharedFilterFormFields } from "@/types/filter-form";
import { parseDelimitedInput, parseNonNegativeIntegerInput } from "@/utils/filter-input";

export interface GetDataFilterFormState extends SharedFilterFormFields {
  is_completed: "all" | "true" | "false";
  repeat_count_min: string;
  repeat_count_max: string;
}


export function toGetDataFilters(form: GetDataFilterFormState): InstagramUserFilters {
  const filters: InstagramUserFilters = {};

  if (form.id.trim()) {
    filters.id = form.id.trim();
  }
  if (form.username.trim()) {
    filters.username = form.username.trim();
  }
  if (form.is_completed === "true") {
    filters.is_completed = true;
  } else if (form.is_completed === "false") {
    filters.is_completed = false;
  }

  const minRaw = parseNonNegativeIntegerInput(form.repeat_count_min);
  const maxRaw = parseNonNegativeIntegerInput(form.repeat_count_max);
  if (minRaw !== null || maxRaw !== null) {
    filters.repeat_count = {
      min: minRaw,
      max: maxRaw,
    };
  }

  if (form.ip_location.trim()) {
    filters.ip_location = form.ip_location.trim();
  }

  const ipLocationIn = parseDelimitedInput(form.ip_location_in);
  if (ipLocationIn.length > 0) {
    filters.ip_location_in = ipLocationIn;
  }

  const ipLocationNotIn = parseDelimitedInput(form.ip_location_not_in);
  if (ipLocationNotIn.length > 0) {
    filters.ip_location_not_in = ipLocationNotIn;
  }

  if (form.ip_location_not_include_null) {
    filters.ip_location_not_include_null = true;
  }

  if (form.created_at_min.trim()) {
    filters.created_at_min = form.created_at_min.trim();
  }
  if (form.created_at_max.trim()) {
    filters.created_at_max = form.created_at_max.trim();
  }

  return filters;
}
