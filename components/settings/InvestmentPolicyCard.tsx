"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card, SectionLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function InvestmentPolicyCard() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const [editing, setEditing] = useState(false);
  const [principlesText, setPrinciplesText] = useState(settings.principles.join("\n"));
  const [goal, setGoal] = useState(settings.goal);

  function startEditing() {
    setPrinciplesText(settings.principles.join("\n"));
    setGoal(settings.goal);
    setEditing(true);
  }

  async function handleSave() {
    const principles = principlesText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    await updateSettings({ principles, goal: goal.trim() });
    setEditing(false);
  }

  if (!editing) {
    return (
      <Card>
        <div className="flex items-center justify-between">
          <SectionLabel>投資方針</SectionLabel>
          <button className="text-xs text-stone-500" onClick={startEditing}>
            編集
          </button>
        </div>

        {settings.principles.length === 0 && !settings.goal ? (
          <p className="mt-3 text-sm text-stone-500">まだ設定されていません</p>
        ) : (
          <>
            <ul className="mt-3 space-y-1.5 text-sm text-stone-200">
              {settings.principles.map((p, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-gold">・</span>
                  {p}
                </li>
              ))}
            </ul>
            {settings.goal && (
              <div className="mt-3 border-t border-border pt-3 text-sm">
                <span className="text-xs text-stone-500">目標</span>
                <div className="mt-1 text-stone-100">{settings.goal}</div>
              </div>
            )}
          </>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <SectionLabel>投資方針を編集</SectionLabel>
      <div className="mt-3 space-y-3 text-sm">
        <label className="block">
          <span className="mb-1 block text-xs text-stone-400">方針（1行に1つ）</span>
          <textarea
            className="h-32 w-full rounded-lg border border-border bg-transparent px-3 py-2"
            value={principlesText}
            onChange={(e) => setPrinciplesText(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-stone-400">目標</span>
          <input
            type="text"
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </label>
        <div className="flex gap-2 pt-1">
          <Button variant="primary" className="flex-1" onClick={handleSave}>
            保存
          </Button>
          <Button className="flex-1" onClick={() => setEditing(false)}>
            キャンセル
          </Button>
        </div>
      </div>
    </Card>
  );
}
