export interface SharedIdentityFilterFormFields {
  id: string;
  username: string;
}

export interface SharedLocationFilterFormFields {
  ip_location: string;
  ip_location_in: string;
  ip_location_not_in: string;
  ip_location_not_include_null: boolean;
}

export interface SharedDateRangeFilterFormFields {
  created_at_min: string;
  created_at_max: string;
}

export interface SharedFilterFormFields
  extends SharedIdentityFilterFormFields,
    SharedLocationFilterFormFields,
    SharedDateRangeFilterFormFields {}
