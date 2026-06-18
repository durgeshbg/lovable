import "dotenv/config";
import cors from "cors";
import express from "express";
import { listProjectFiles, writeProjectFile } from "./projectFiles.js";
import type { Message, ProjectSnapshot } from "./types.js";
import { generateWithGemini } from "./gemini.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);
const previewUrl = process.env.PROJECT_PREVIEW_URL ?? "http://localhost:5174";
const messageHistory: Message[] = [];

// update this prompt to be more efficient
const systemPrompt = `You are coding agent that helps user using their prompts to make necessary file changes in the below formated JSON only\
  {
    role: "assistant",
    message: "You response",
    files: [
      {
        path: 'App.jsx',
        comtent: 'File contents to completly overwrite'
      },
      ... So on
    ]
  }
  `;

messageHistory.push({
  role: "assistant",
  content: systemPrompt,
  createdAt: new Date().toISOString(),
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/project", async (_request, response) => {
  const projectSnapshot: ProjectSnapshot = {
    files: await listProjectFiles(),
    messageHistory: messageHistory.map((m) => {
      let content;
      try {
        content = JSON.parse(m.content);
        content = content.message;
      } catch (e) {
        content = m.content;
      }
      return {
        role: m.role,
        content,
        createdAt: m.createdAt,
      };
    }),
    previewUrl,
    updatedAt: new Date().toISOString(),
    summary: "Project loaded successfully",
  };
  response.json(projectSnapshot);
});

app.post("/api/messages", async (request, response) => {
  const message = request.body;
  const files = await listProjectFiles();
  messageHistory.push({
    role: "user",
    content: JSON.stringify({
      message: message.message,
      files,
    }),
    createdAt: new Date().toISOString(),
  });
  const aiContent = await generateWithGemini(JSON.stringify({ message }));
  const parsedContent = JSON.parse(aiContent);

  messageHistory.push({
    role: "assistant",
    content: JSON.stringify({
      message: parsedContent.message,
      files: parsedContent.files,
    }),
    createdAt: new Date().toISOString(),
  });

  const parsedFiles = parsedContent.files as {
    path: string;
    content: string;
  }[];

  for (const file of parsedFiles) {
    await writeProjectFile(file.path, file.content);
  }

  const projectSnapshot: ProjectSnapshot = {
    files: await listProjectFiles(),
    messageHistory: messageHistory.map((m) => {
      let content;
      try {
        content = JSON.parse(m.content);
        content = content.message;
      } catch (e) {
        content = m.content;
      }
      return {
        role: m.role,
        content,
        createdAt: m.createdAt,
      };
    }),
    previewUrl,
    updatedAt: new Date().toISOString(),
    summary: "Files updated successfully",
  };

  response.json(projectSnapshot);
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
