"use client";

import { Button, Descriptions, Form, InputNumber, message, Modal } from "antd";
import { EditOutlined } from "@ant-design/icons";
import { useState } from "react";
import { updateUser } from "@/services/api/users.service";
import { AdminUserRow, UserAttributes, UserStats } from "@/services/_types";

// function calculateRating(stats: AdminUserRow["stats"]): string {
//   if (!stats) return "0.0";
//   const {
//     goals = 0,
//     assists = 0,
//     motm = 0,
//     wins = 0,
//     losses = 0,
//     matchesPlayed = 0,
//   } = stats;
//   if (matchesPlayed === 0) return "0.0";
//   const raw = (goals + assists + motm * 2 + wins - losses) / matchesPlayed;
//   return Math.min(10, Math.max(0, raw)).toFixed(1);
// }

export default function Stats({
  user,
  onUpdated,
}: {
  user: AdminUserRow;
  onUpdated: () => void;
}) {
  const [statsOpen, setStatsOpen] = useState(false);
  const [attrsOpen, setAttrsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statsForm] = Form.useForm<UserStats>();
  const [attrsForm] = Form.useForm<UserAttributes>();

  const handleSaveStats = async () => {
    setSubmitting(true);
    try {
      const values = await statsForm.validateFields();
      await updateUser(user.id, { stats: values });
      message.open({ type: "success", content: "Stats updated." });
      setStatsOpen(false);
      onUpdated();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      const err = e as { error?: string };
      message.open({ type: "error", content: err?.error ?? "Update failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAttrs = async () => {
    setSubmitting(true);
    try {
      const values = await attrsForm.validateFields();
      await updateUser(user.id, { attributes: values });
      message.open({ type: "success", content: "Attributes updated." });
      setAttrsOpen(false);
      onUpdated();
    } catch (e: unknown) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      const err = e as { error?: string };
      message.open({ type: "error", content: err?.error ?? "Update failed." });
    } finally {
      setSubmitting(false);
    }
  };

  const statItems = [
    { label: "Matches Played", value: user.stats?.matchesPlayed ?? 0 },
    { label: "Goals", value: user.stats?.goals ?? 0 },
    { label: "Assists", value: user.stats?.assists ?? 0 },
    { label: "Man of the Match", value: user.stats?.motm ?? 0 },
    { label: "Average Rating", value: user.stats?.rating?.toFixed(1) ?? "0.0" },
    // { label: "Average Rating", value: calculateRating(user.stats) },
    { label: "Wins", value: user.stats?.wins ?? 0 },
    { label: "Draws", value: user.stats?.draws ?? 0 },
    { label: "Losses", value: user.stats?.losses ?? 0 },
  ];

  const attrItems = [
    { label: "Pace", value: user.attributes?.pace ?? 0 },
    { label: "Shooting", value: user.attributes?.shooting ?? 0 },
    { label: "Passing", value: user.attributes?.passing ?? 0 },
    { label: "Dribbling", value: user.attributes?.dribbling ?? 0 },
    { label: "Defense", value: user.attributes?.defense ?? 0 },
    { label: "Physical", value: user.attributes?.physical ?? 0 },
    { label: "Stamina", value: user.attributes?.stamina ?? 0 },
    { label: "Work Rate", value: user.attributes?.workRate ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base">Match Statistics</h3>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              statsForm.setFieldsValue(user.stats ?? {});
              setStatsOpen(true);
            }}
          >
            Edit Stats
          </Button>
        </div>
        <Descriptions bordered column={{ xs: 2, sm: 4 }} size="small">
          {statItems.map((s) => (
            <Descriptions.Item key={s.label} label={s.label}>
              {s.value}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base">Player Attributes (1–100)</h3>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              attrsForm.setFieldsValue(user.attributes ?? {});
              setAttrsOpen(true);
            }}
          >
            Edit Attributes
          </Button>
        </div>
        <Descriptions bordered column={{ xs: 2, sm: 4 }} size="small">
          {attrItems.map((a) => (
            <Descriptions.Item key={a.label} label={a.label}>
              {a.value}
            </Descriptions.Item>
          ))}
        </Descriptions>
      </div>

      <Modal
        title="Edit Match Statistics"
        open={statsOpen}
        destroyOnHidden
        mask={{ closable: false }}
        okText="Save"
        confirmLoading={submitting}
        onOk={handleSaveStats}
        onCancel={() => setStatsOpen(false)}
      >
        <Form form={statsForm} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-x-4">
            {(
              [
                "matchesPlayed",
                "goals",
                "assists",
                "motm",
                "wins",
                "draws",
                "losses",
              ] as const
            ).map((field) => (
              <Form.Item
                key={field}
                label={field.replace(/([A-Z])/g, " $1").trim()}
                name={field}
              >
                <InputNumber min={0} className="w-full" />
              </Form.Item>
            ))}
            <Form.Item label="Rating (0–10)" name="rating">
              <InputNumber min={0} max={10} step={0.1} className="w-full" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Edit Player Attributes"
        open={attrsOpen}
        destroyOnHidden
        mask={{ closable: false }}
        okText="Save"
        confirmLoading={submitting}
        onOk={handleSaveAttrs}
        onCancel={() => setAttrsOpen(false)}
      >
        <Form form={attrsForm} layout="vertical" className="mt-4">
          <div className="grid grid-cols-2 gap-x-4">
            {(
              [
                "pace",
                "shooting",
                "passing",
                "dribbling",
                "defense",
                "physical",
                "stamina",
                "workRate",
              ] as const
            ).map((field) => (
              <Form.Item
                key={field}
                label={field.replace(/([A-Z])/g, " $1").trim()}
                name={field}
              >
                <InputNumber min={0} max={100} className="w-full" />
              </Form.Item>
            ))}
          </div>
        </Form>
      </Modal>
    </div>
  );
}
