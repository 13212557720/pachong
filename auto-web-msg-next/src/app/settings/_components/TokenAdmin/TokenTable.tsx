"use client";

interface TokenItem {
  id: string;
  token_value: string;
  remark: string | null;
  is_blacklisted: boolean;
  created_at: string;
  updated_at: string;
}

interface TokenTableProps {
  loading: boolean;
  tokens: TokenItem[];
  selected: Set<string>;
  setSelected: (val: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  toggleSelect: (id: string) => void;
  handleToggleBlacklist: (id: string, blacklisted: boolean) => void;
  handleDelete: (id: string) => void;
}

export function TokenTable({
  loading,
  tokens,
  selected,
  setSelected,
  toggleSelect,
  handleToggleBlacklist,
  handleDelete,
}: TokenTableProps) {
  if (loading) {
    return <p className="text-sm text-gray-400">加载中...</p>;
  }

  if (tokens.length === 0) {
    return <p className="text-sm text-gray-400">暂无 Token</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2 px-2 w-8">
              <input
                type="checkbox"
                checked={selected.size === tokens.length && tokens.length > 0}
                onChange={() => {
                  if (selected.size === tokens.length) {
                    setSelected(new Set());
                  } else {
                    setSelected(new Set(tokens.map((t) => t.id)));
                  }
                }}
              />
            </th>
            <th className="py-2 px-2">Token</th>
            <th className="py-2 px-2">备注</th>
            <th className="py-2 px-2">状态</th>
            <th className="py-2 px-2">创建时间</th>
            <th className="py-2 px-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.id} className="border-b hover:bg-gray-50">
              <td className="py-2 px-2">
                <input
                  type="checkbox"
                  checked={selected.has(token.id)}
                  onChange={() => toggleSelect(token.id)}
                />
              </td>
              <td className="py-2 px-2 font-mono text-xs max-w-xs break-all">
                {token.token_value}
              </td>
              <td className="py-2 px-2 text-xs">{token.remark ?? "-"}</td>
              <td className="py-2 px-2">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    token.is_blacklisted
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {token.is_blacklisted ? "已拉黑" : "有效"}
                </span>
              </td>
              <td className="py-2 px-2 text-xs">
                {new Date(token.created_at).toLocaleString()}
              </td>
              <td className="py-2 px-2">
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      void handleToggleBlacklist(token.id, token.is_blacklisted)
                    }
                    className="text-xs px-1.5 py-0.5 border rounded hover:bg-gray-100"
                  >
                    {token.is_blacklisted ? "解封" : "拉黑"}
                  </button>
                  <button
                    onClick={() => void handleDelete(token.id)}
                    className="text-xs px-1.5 py-0.5 border rounded text-red-600 hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
