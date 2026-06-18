import { FormEvent, useEffect, useMemo, useState } from "react";

type ProjectFile = {
  path: string;
  content: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type ProjectSnapshot = {
  summary: string;
  messageHistory: Message[];
  files: ProjectFile[];
  updatedAt: string;
  previewUrl: string;
};

const examplePrompt =
  "Update the project to show a pricing section with three plans.";

export function App() {
  const [prompt, setPrompt] = useState(examplePrompt);
  const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>("src/App.tsx");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshProject().catch((caughtError) => {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load project files.",
      );
    });
  }, []);

  const selectedFile = useMemo(() => {
    if (!snapshot) return null;
    return (
      snapshot?.files?.find((file) => file.path === selectedPath) ??
      snapshot.files?.[0] ??
      null
    );
  }, [snapshot, selectedPath]);

  async function refreshProject() {
    const response = await fetch("/api/project");
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not load project files.");
    }

    setSnapshot(payload);
    setSelectedPath(
      (currentPath) =>
        payload?.files?.find((file: ProjectFile) => file?.path === currentPath)
          ?.path ??
        payload?.files?.[0]?.path ??
        "",
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Request failed.");
      }

      setSnapshot(payload);
      setSelectedPath(
        payload.files.find((file: ProjectFile) => file.path === selectedPath)
          ?.path ??
          payload.files[0]?.path ??
          "",
      );
      setPrompt("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Lovable-style builder</p>
          <h1>Assignment Starter</h1>
        </div>
        <div className="status-pill">
          {snapshot ? "Project folder loaded" : "Loading project"}
        </div>
      </section>

      <section className="workspace">
        <aside className="prompt-panel">
          <form onSubmit={handleSubmit}>
            <label htmlFor="prompt">Change request</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe what the app should do..."
            />
            <button type="submit" disabled={isLoading || !prompt.trim()}>
              {isLoading ? "Asking Gemini..." : "Ask agent to update files"}
            </button>
          </form>

          {error && <div className="error-box">{error}</div>}

          <div className="history">
            <h2>Prompt history</h2>
            {snapshot?.messageHistory?.length ? (
              snapshot.messageHistory.map((message) => (
                <article
                  key={`${message.createdAt}-${message.role}`}
                  className={`message ${message.role}`}
                >
                  <span>{message.role}</span>
                  <p>{message.content}</p>
                </article>
              ))
            ) : (
              <p className="muted">
                Send a request to see the conversation log.
              </p>
            )}
          </div>
        </aside>

        <section className="files-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Files</p>
              <h2>{snapshot?.summary ?? "Editable project files"}</h2>
            </div>
          </div>

          <div className="file-list">
            {snapshot?.files?.length ? (
              snapshot.files.map((file) => (
                <button
                  key={file.path}
                  className={file.path === selectedFile?.path ? "active" : ""}
                  type="button"
                  onClick={() => setSelectedPath(file.path)}
                >
                  {file.path}
                </button>
              ))
            ) : (
              <p className="muted">No files yet.</p>
            )}
          </div>

          <pre className="code-view">
            <code>
              {selectedFile?.content ??
                "Select or generate a file to inspect the code."}
            </code>
          </pre>
        </section>

        <section className="preview-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Preview</p>
              <h2>Running React app</h2>
            </div>
          </div>

          {snapshot?.previewUrl ? (
            <iframe title="Project preview" src={snapshot.previewUrl} />
          ) : (
            <div className="empty-preview">
              Preview server is not configured.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
