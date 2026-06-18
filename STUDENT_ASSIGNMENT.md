# Student Assignment

## Goal

Build the backend loop that updates the React app inside `project/` from user messages.

The main app already has:

- A message box.
- A file viewer.
- A preview iframe for the running React project.

Your job is to make `/api/messages` use Gemini and file tools to update files in `project/`.

## Run the App

```bash
npm install
npm run dev
```

Open:

- Main app: `http://localhost:5173`
- Project preview: `http://localhost:5174`

## What to Implement

Work mainly in `server/src/index.ts`.

1. Keep user and assistant messages in the in-memory `messageHistory` array.
2. Make `GET /api/project` return a `ProjectSnapshot`:

   ```ts
   {
     summary: string;
     messageHistory: Message[];
     files: ProjectFile[];
     updatedAt: string;
     previewUrl: string;
   }
   ```

3. Make `POST /api/messages`:
   - Read the user message from the request body.
   - Add it to `messageHistory`.
   - Send the message history and project file context to Gemini.
   - Let Gemini decide which project files to read or write.
   - Write changes only inside `project/`.
   - Return a fresh `ProjectSnapshot`.

## File Tools

Use the helpers in `server/src/projectFiles.ts`:

```ts
listProjectFiles()
readProjectFile(path)
writeProjectFile(path, content)
```

Most edits should happen in:

- `project/src/App.tsx`
- `project/src/styles.css`

## Reset

To restore the default React project:

```bash
npm run reset:project
```

## Out of Scope

Do not add auth, database storage, deployment, streaming, or package installation.
