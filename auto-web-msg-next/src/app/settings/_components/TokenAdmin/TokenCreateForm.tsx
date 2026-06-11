"use client";

interface TokenCreateFormProps {
  createdToken: string | null;
  createRemark: string;
  setCreateRemark: (val: string) => void;
  createValidDays: string;
  setCreateValidDays: (val: string) => void;
  createUsername: string;
  setCreateUsername: (val: string) => void;
  createCount: string;
  setCreateCount: (val: string) => void;
  handleCreate: () => void;
  copyToken: (text: string) => void;
}

export function TokenCreateForm({
  createdToken,
  createRemark,
  setCreateRemark,
  createValidDays,
  setCreateValidDays,
  createUsername,
  setCreateUsername,
  createCount,
  setCreateCount,
  handleCreate,
  copyToken,
}: TokenCreateFormProps) {
  return (
    <div className="border rounded p-4 space-y-3">
      <h4 className="font-medium">创建新 Token</h4>
      {createdToken && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm font-medium text-green-800 mb-1">
            新 Token 已创建（仅显示一次，请立即复制）：
          </p>
          <div className="flex items-start gap-2">
            <code className="text-xs bg-white border rounded px-2 py-1 flex-1 break-all font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
              {createdToken}
            </code>
            <button
              onClick={() => copyToken(createdToken)}
              className="text-xs px-2 py-1 border rounded hover:bg-gray-100"
            >
              复制
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={createRemark}
          onChange={(e) => setCreateRemark(e.target.value)}
          placeholder="备注（可选）"
          className="flex-1 min-w-[120px] border rounded px-3 py-1.5 text-sm"
        />
        <input
          type="number"
          value={createValidDays}
          onChange={(e) => setCreateValidDays(e.target.value)}
          placeholder="有效天数"
          className="w-28 border rounded px-3 py-1.5 text-sm"
        />
        <input
          type="text"
          value={createUsername}
          onChange={(e) => setCreateUsername(e.target.value)}
          placeholder="用户名（可选）"
          className="flex-1 min-w-[120px] border rounded px-3 py-1.5 text-sm"
        />
        <input
          type="number"
          min={1}
          value={createCount}
          onChange={(e) => setCreateCount(e.target.value)}
          placeholder="生成数量"
          className="w-24 border rounded px-3 py-1.5 text-sm"
        />
        <button
          onClick={handleCreate}
          className="px-4 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
        >
          创建
        </button>
      </div>
      <p className="text-xs text-gray-400">
        默认有效期 365 天，无上下限。后端自动生成 JWT。
      </p>
    </div>
  );
}
