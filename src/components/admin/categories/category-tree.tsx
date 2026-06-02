"use client";

import React from "react";
import type { CategoryTreeNode } from "@/services/categories";

function Node({ node, depth = 0 }: { node: CategoryTreeNode; depth?: number }) {
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2">
        <div style={{ marginLeft: depth * 12 }} className="text-sm font-medium">
          {node.name}
        </div>
        <div className="text-xs text-muted-foreground">{node.slug}</div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="ml-3 border-l pl-3">
          {node.children.map((c) => (
            <Node key={c.id} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTree({ tree }: { tree: CategoryTreeNode[] }) {
  if (!tree || tree.length === 0) {
    return <div className="text-sm text-muted-foreground">No categories yet</div>;
  }

  return (
    <div className="space-y-2">
      {tree.map((node) => (
        <Node key={node.id} node={node} />
      ))}
    </div>
  );
}
