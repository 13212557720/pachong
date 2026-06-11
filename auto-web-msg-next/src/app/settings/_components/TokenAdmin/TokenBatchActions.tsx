"use client";

interface TokenBatchActionsProps {
  selectedSize: number;
  handleBatchDelete: () => void;
  handleBatchBlacklist: (blacklist: boolean) => void;
}

export function TokenBatchActions({
  selectedSize,
  handleBatchDelete,
  handleBatchBlacklist,
}: TokenBatchActionsProps) {
  if (selectedSize === 0) return null;

  return (
    <div className="flex gap-2">
      <button
        onClick={handleBatchDelete}
        className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
      >
        批量删除 ({selectedSize})
      </button>
      <button
        onClick={() => void handleBatchBlacklist(true)}
        className="px-3 py-1.5 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
      >
        批量拉黑
      </button>
      <button
        onClick={() => void handleBatchBlacklist(false)}
        className="px-3 py-1.5 border rounded hover:bg-gray-50 text-sm"
      >
        批量解封
      </button>
    </div>
  );
}
