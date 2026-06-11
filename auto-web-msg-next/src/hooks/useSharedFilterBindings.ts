import { Dispatch, SetStateAction } from "react";

export interface SharedFilterBindingOptions<T> {
  id?: keyof T;
  username?: keyof T;
  ip_location_in?: keyof T;
  ip_location_not_in?: keyof T;
  ip_location_not_include_null?: keyof T;
  created_at_min?: keyof T;
  created_at_max?: keyof T;
}

/**
 * 统一将各种不同名字的表单字段，绑定为 SharedDataFilterPanel 所需的标准 props
 */
export function useSharedFilterBindings<T>(
  form: T,
  setForm: Dispatch<SetStateAction<T>> | ((updater: (prev: T) => T) => void),
  keyMapping?: SharedFilterBindingOptions<T>
) {
  const mapKey = (defaultKey: string) =>
    (keyMapping && keyMapping[defaultKey as keyof typeof keyMapping]) || defaultKey;

  const setField = (key: string, value: unknown) => {
    const targetKey = mapKey(key);
    // 兼容 useState 和 Zustand 的 updater
    setForm((prev: T) => ({ ...prev, [targetKey]: value } as unknown as T));
  };

  return {
    id: (form[mapKey("id") as keyof T] as unknown as string) || "",
    setId: (v: string) => setField("id", v),

    username: (form[mapKey("username") as keyof T] as unknown as string) || "",
    setUsername: (v: string) => setField("username", v),

    ipLocationIn: (form[mapKey("ip_location_in") as keyof T] as unknown as string) || "",
    setIpLocationIn: (v: string) => setField("ip_location_in", v),

    ipLocationNotIn: (form[mapKey("ip_location_not_in") as keyof T] as unknown as string) || "",
    setIpLocationNotIn: (v: string) => setField("ip_location_not_in", v),

    ipLocationNotIncludeNull: (form[mapKey("ip_location_not_include_null") as keyof T] as unknown as boolean) || false,
    setIpLocationNotIncludeNull: (v: boolean) => setField("ip_location_not_include_null", v),

    createdAtMin: (form[mapKey("created_at_min") as keyof T] as unknown as string) || "",
    setCreatedAtMin: (v: string) => setField("created_at_min", v),

    createdAtMax: (form[mapKey("created_at_max") as keyof T] as unknown as string) || "",
    setCreatedAtMax: (v: string) => setField("created_at_max", v),
  };
}
