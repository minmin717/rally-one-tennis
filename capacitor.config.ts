import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.rallyone.tennis",
  appName: "RALLY ONE",
  webDir: "dist-native",
  ios: {
    contentInset: "always",
    backgroundColor: "#173a2b",
    preferredContentMode: "mobile",
  },
};

export default config;
