import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

export default function loading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      <p className={"text-lg font-bold mt-4 text-center"}>Hold tight!</p>
      <p className={"text-sm text-center"}>
        We are weaving magic into every pixel just for you.
      </p>
    </main>
  );
}
