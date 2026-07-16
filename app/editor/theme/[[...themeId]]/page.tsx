import { getTheme } from "@/actions/themes";
import Editor from "@/components/editor/editor";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "probablyharsh — Theme Generator for shadcn/ui",
  description:
    "Easily customize and preview your shadcn/ui theme with probablyharsh. Modify colors, fonts, and styles in real-time.",
};

export default async function EditorPage({ params }: { params: Promise<{ themeId: string[] }> }) {
  const { themeId } = await params;
  const themePromise = themeId?.length > 0 ? getTheme(themeId?.[0]) : Promise.resolve(null);

  return <Editor themePromise={themePromise} />;
}
