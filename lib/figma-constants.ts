export const FIGMA_CONSTANTS = {
  shadcncraftUrl: "https://shadcraft.com?atp=tweakcn",
  previewUrl:
    "https://www.figma.com/design/AowV2WsmEZ4NXBlHlrsBg8/shadcncraft-Pro-%E2%80%A2-v3.0.2-Beta-%E2%80%A2-Preview?node-id=7053-59081",
  designers: [
    { name: "Designer 1", avatar: "/figma-onboarding/avatar-1.png", fallback: "D1" },
    { name: "Designer 2", avatar: "/figma-onboarding/avatar-2.png", fallback: "D2" },
    { name: "Designer 3", avatar: "/figma-onboarding/avatar-3.png", fallback: "D3" },
    { name: "Designer 4", avatar: "/figma-onboarding/avatar-4.png", fallback: "D4" },
    { name: "Designer 5", avatar: "/figma-onboarding/avatar-5.png", fallback: "D5" },
  ],
  steps: [
    {
      step: "Step 1",
      title: "Download the kit",
      description: "Get the comprehensive shadcncraft Figma UI kit",
    },
    {
      step: "Step 2",
      title: "Open the plugin",
      description: "Launch the shadcncraft Figma plugin",
    },
    {
      step: "Step 3",
      title: "Apply your theme",
      description: "Transform components with your custom theme",
    },
  ],
  features: [
    "All shadcn/ui Figma Kit official blocks & components",
    "121 Pro Blocks",
    "242 Pro Components",
    "14 Pro Pages, 1 Site",
    "Figma plugin",
    "Fast support",
  ],
};

export const redirectToShadcncraft = () => {
  window.open(FIGMA_CONSTANTS.shadcncraftUrl, "_blank");
};
