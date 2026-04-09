"use client";

import { Checkbox, Input, List, Spin } from "antd";
import { useEffect, useState } from "react";
import { useSystemPermissions } from "@/services/api/settings.service";
import { type SystemRoleRow } from "@/services/_types";

interface RoleFormData {
  name: string;
  permissionKeys: string[];
}

interface Props {
  isEditingData: SystemRoleRow | null;
  onDataChange: (data: RoleFormData) => void;
}

export default function ModalAddRolePermission({
  isEditingData,
  onDataChange,
}: Props) {
  const { data: permissionsData, isLoading } = useSystemPermissions();

  const [name, setName] = useState(isEditingData?.name ?? "");
  const [selectedKeys, setSelectedKeys] = useState<string[]>(
    isEditingData?.permissions.map((p) => p.key) ?? [],
  );

  // Bubble up to parent on every change
  useEffect(() => {
    onDataChange({ name, permissionKeys: selectedKeys });
  }, [name, selectedKeys, onDataChange]);

  const toggle = (key: string, checked: boolean) => {
    setSelectedKeys((prev) =>
      checked ? [...prev, key] : prev.filter((k) => k !== key),
    );
  };

  const toggleGroup = (keys: string[], checked: boolean) => {
    setSelectedKeys((prev) => {
      const without = prev.filter((k) => !keys.includes(k));
      return checked ? [...without, ...keys] : without;
    });
  };

  const grouped = permissionsData?.grouped ?? {};
  const groupEntries = Object.entries(grouped).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <div className="flex flex-col gap-4 overflow-auto">
      <div className="max-w-lg">
        <label className="block mb-1 text-sm font-medium text-gray-700">
          Role Name <span className="text-red-500">*</span>
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Match Manager"
          size="large"
        />
      </div>

      <p className="font-bold text-sm">Select permissions</p>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          bordered
          dataSource={groupEntries}
          rowKey={([group]) => group}
          renderItem={([group, perms]) => {
            const allSelected = perms.every((p) =>
              selectedKeys.includes(p.key),
            );
            const someSelected = perms.some((p) =>
              selectedKeys.includes(p.key),
            );

            return (
              <List.Item>
                <div className="grid md:grid-cols-4 w-full gap-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected && !allSelected}
                      onChange={(e) =>
                        toggleGroup(
                          perms.map((p) => p.key),
                          e.target.checked,
                        )
                      }
                    />
                    <p className="font-semibold text-sm">{group}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:col-span-3">
                    {perms.map((perm) => (
                      <label
                        key={perm.key}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
                      >
                        <Checkbox
                          checked={selectedKeys.includes(perm.key)}
                          onChange={(e) => toggle(perm.key, e.target.checked)}
                        />
                        <span className="text-xs font-medium">
                          {perm.key
                            .replace(/_/g, " ")
                            .toLowerCase()
                            .replace(/^\w/, (c) => c.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
}
