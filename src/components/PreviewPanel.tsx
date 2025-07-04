import { WebContainer } from "@webcontainer/api";
import React, { useEffect, useState } from "react";

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer | undefined;
}

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  // In a real implementation, this would compile and render the preview
  const [url, setUrl] = useState("");

  async function main() {
    const installProcess = await webContainer?.spawn("npm", ["install"]);

    installProcess?.output.pipeTo(
      new WritableStream({
        write(data) {
          console.log(data);
        },
      })
    );

    await webContainer?.spawn("npm", ["run", "dev"]);

    // Wait for `server-ready` event
    webContainer?.on("server-ready", (port, url) => {
      // ...
      console.log(url);
      console.log(port);
      setUrl(url);
    });

    // setTimeout(() => {
    //   if (!url) {
    //     console.log("Server ready event timeout, checking for default URL");
    //     // Try common development server URLs
    //     const defaultUrl = "http://localhost:5173"; // Vite default
    //     setUrl(defaultUrl);
    //   }
    // }, 10000);
  }

  useEffect(() => {
    main();
  }, []);
  return (
    <div className="h-full flex items-center justify-center text-gray-400">
      {!url && (
        <div className="text-center">
          <p className="mb-2">Loading...</p>
        </div>
      )}
      {url && <iframe width={"100%"} height={"100%"} src={url} />}
    </div>
  );
}
