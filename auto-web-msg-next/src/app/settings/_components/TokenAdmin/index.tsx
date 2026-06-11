"use client";

import { useCallback, useEffect, useState } from "react";
import {
  checkIsSuperKeyAction,
  listTokensAction,
  createTokenAction,
  deleteTokenAction,
  updateTokenAction,
} from "@/actions/settings-actions";

import { TokenCreateForm } from "./TokenCreateForm";
import { TokenBatchActions } from "./TokenBatchActions";
import { TokenTable } from "./TokenTable";

interface TokenItem {
  id: string;
  token_value: string;
  remark: string | null;
  is_blacklisted: boolean;
  created_at: string;
  updated_at: string;
}

export function TokenAdmin() {
  const [isSuperKey, setIsSuperKey] = useState<boolean | null>(null);
  const [tokens, setTokens] = useState<TokenItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [createRemark, setCreateRemark] = useState("");
  const [createValidDays, setCreateValidDays] = useState("365");
  const [createUsername, setCreateUsername] = useState("");
  const [createCount, setCreateCount] = useState("1");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null
  );

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listTokensAction();
      if (!res.success) {
        setMsg({ type: "err", text: `加载失败: ${res.error}` });
        return;
      }
      const items = res.data?.items ?? [];
      setTokens(items.map((i) => i.body));
    } catch (e) {
      setMsg({
        type: "err",
        text: `加载失败: ${e instanceof Error ? e.message : String(e)}`,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const res = await checkIsSuperKeyAction();
      if (res.success && res.data === true) {
        setIsSuperKey(true);
      } else {
        setIsSuperKey(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isSuperKey) {
      queueMicrotask(() => void loadTokens());
    }
  }, [isSuperKey, loadTokens]);

  if (isSuperKey === false) {
    return null;
  }

  const handleCreate = async () => {
    try {
      const count = parseInt(createCount, 10) || 1;
      if (count < 1) {
        setMsg({ type: "err", text: "生成数量必须大于0" });
        return;
      }

      setLoading(true);
      const newTokens: string[] = [];
      const body: { remark?: string; valid_days?: number; username?: string } = {};

      if (createValidDays) body.valid_days = parseInt(createValidDays, 10);
      if (createUsername) body.username = createUsername;

      for (let i = 0; i < count; i++) {
        const currentBody: {
          remark?: string;
          valid_days?: number;
          username?: string;
        } = { ...body };
        const currentRemark =
          count > 1 && createRemark ? `${createRemark} - ${i + 1}` : createRemark;
        if (currentRemark) {
          currentBody.remark = currentRemark;
        }

        const res = await createTokenAction(currentBody);
        if (!res.success) {
          setMsg({ type: "err", text: `创建第 ${i + 1} 个失败: ${res.error}` });
          if (newTokens.length > 0) break;
          setLoading(false);
          return;
        }
        if (res.data?.token_value) {
          newTokens.push(res.data.token_value);
        }
      }

      if (newTokens.length > 0) {
        setCreatedToken(newTokens.join("\n"));
        setMsg({
          type: "ok",
          text: `成功创建 ${newTokens.length} 个 Token！请立即复制，仅显示一次`,
        });
      }

      setCreateRemark("");
      setCreateValidDays("365");
      setCreateUsername("");
      setCreateCount("1");
      void loadTokens();
    } catch (e) {
      setMsg({
        type: "err",
        text: `创建失败: ${e instanceof Error ? e.message : String(e)}`,
      });
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteTokenAction(id);
    if (!res.success) {
      setMsg({ type: "err", text: `删除失败: ${res.error}` });
      return;
    }
    void loadTokens();
  };

  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    for (const id of selected) {
      await deleteTokenAction(id);
    }
    setSelected(new Set());
    void loadTokens();
  };

  const handleToggleBlacklist = async (id: string, blacklisted: boolean) => {
    const res = await updateTokenAction(id, !blacklisted);
    if (!res.success) {
      setMsg({ type: "err", text: `更新失败: ${res.error}` });
      return;
    }
    void loadTokens();
  };

  const handleBatchBlacklist = async (blacklist: boolean) => {
    if (selected.size === 0) return;
    for (const id of selected) {
      await updateTokenAction(id, blacklist);
    }
    setSelected(new Set());
    void loadTokens();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToken = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Token 管理（超级密钥）</h3>
        {msg && (
          <span
            className={`text-sm ${
              msg.type === "ok" ? "text-green-600" : "text-red-600"
            }`}
          >
            {msg.text}
          </span>
        )}
      </div>

      <TokenCreateForm
        createdToken={createdToken}
        createRemark={createRemark}
        setCreateRemark={setCreateRemark}
        createValidDays={createValidDays}
        setCreateValidDays={setCreateValidDays}
        createUsername={createUsername}
        setCreateUsername={setCreateUsername}
        createCount={createCount}
        setCreateCount={setCreateCount}
        handleCreate={() => void handleCreate()}
        copyToken={copyToken}
      />

      <TokenBatchActions
        selectedSize={selected.size}
        handleBatchDelete={() => void handleBatchDelete()}
        handleBatchBlacklist={handleBatchBlacklist}
      />

      <TokenTable
        loading={loading}
        tokens={tokens}
        selected={selected}
        setSelected={setSelected}
        toggleSelect={toggleSelect}
        handleToggleBlacklist={handleToggleBlacklist}
        handleDelete={handleDelete}
      />

      <div className="flex justify-end">
        <button
          onClick={() => void loadTokens()}
          disabled={loading}
          className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50 disabled:opacity-50"
        >
          刷新列表
        </button>
      </div>
    </div>
  );
}
