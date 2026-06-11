import type { ColumnFilter, FilterFormState } from "../types";

export function parseStringList(input: string): string[] {
  if (!input.trim()) return [];
  return input
    .split(/[,\\n，]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function createFilterFromForm(
  form: FilterFormState,
  selectedColumnType?: string
): ColumnFilter | null {
  if (!form.filterColumn) return null;

  const filter: ColumnFilter = { column: form.filterColumn };

  if (form.keywordInput.trim()) {
    filter.keyword = form.keywordInput.trim();
  }

  const inValues = parseStringList(form.inValuesInput);
  if (inValues.length > 0) {
    filter.inValues = inValues;
  }

  const notInValues = parseStringList(form.notInValuesInput);
  if (notInValues.length > 0) {
    filter.notInValues = notInValues;
  }

  if (selectedColumnType === "integer" || selectedColumnType === "bigint" || selectedColumnType === "numeric") {
    const min = parseInt(form.rangeMinInput, 10);
    const max = parseInt(form.rangeMaxInput, 10);
    if (!isNaN(min)) filter.rangeMin = min;
    if (!isNaN(max)) filter.rangeMax = max;
  }

  if (selectedColumnType === "boolean") {
    filter.boolTrue = form.boolTrue;
    filter.boolFalse = form.boolFalse;
  }

  filter.includeNull = form.includeNull;

  const hasFilter =
    filter.keyword !== undefined ||
    filter.inValues !== undefined ||
    filter.notInValues !== undefined ||
    filter.rangeMin !== undefined ||
    filter.rangeMax !== undefined ||
    filter.boolTrue ||
    filter.boolFalse ||
    filter.includeNull;

  return hasFilter ? filter : null;
}

export function createPgFilterForm(): FilterFormState {
  return {
    filterColumn: "",
    keywordInput: "",
    inValuesInput: "",
    notInValuesInput: "",
    rangeMinInput: "",
    rangeMaxInput: "",
    boolTrue: false,
    boolFalse: false,
    includeNull: false,
  };
}
