# Marginal — AI RAG PDF Chat App

An AI-powered PDF interaction tool: upload PDFs, chat with them using retrieval-augmented
generation, collaborate in real-time shared Spaces, and organize documents into Collections.

## Tech Stack

| Layer         | Technology                                      |
|---------------|--------------------------------------------------|
| Frontend      | React 18 (Vite), Tailwind CSS, React Router, Socket.io-client |
| Backend       | Node.js, Express.js, Socket.io                  |
| Database      | MongoDB (Mongoose)                              |
| Vector DB     | Pinecone (serverless)                           |
| Embeddings    | Hugging Face Inference API (`sentence-transformers/all-MiniLM-L6-v2` by default) |
| LLM           | Groq API — LLaMA 3.3 70B, LLaMA 3.1 8B, Mixtral 8x7B, Gemma 2 9B |
| Auth          | JWT + bcrypt                                    |
| File uploads  | Multer                                          |

## Features

- **Multi-model chat** — switch between Groq-hosted models per question.
- **RAG pipeline** — PDF text is parsed, chunked (sliding window, 220 words / 40 overlap),
  embedded, and stored in a per-document Pinecone namespace. Questions are answered strictly
  from the top-K retrieved chunks, with inline `[Source N]` citations shown in the UI.
- **Spaces** — generate a shareable code from any PDF; anyone who joins sees the same
  live chat feed via Socket.io (presence indicators included).
- **Collections** — group PDFs into named playlists for structured retrieval. 
- **Async ingestion** — upload returns immediately; parsing/embedding happens in the
  background while the frontend polls `/pdfs/:id/status`.

# DEMO
link - https://youtu.be/kVWkrmmR0tE 
# UI
<img width="1887" height="841" alt="image" src="https://github.com/user-attachments/assets/d2404937-109b-4b0a-b658-2fa5f165d9ac" />
<img width="1902" height="917" alt="image" src="https://github.com/user-attachments/assets/1a1f08e6-bcb0-4f21-b354-22d0a7232b13" />


## Project Structure

```
ai-rag-pdf-app/
├── backend/
│   ├── config/          # MongoDB + Pinecone client setup
│   ├── middleware/       # JWT auth guard, Multer upload config
│   ├── models/           # User, Pdf, Collection, Space, ChatMessage
│   ├── routes/           # auth, pdf, collection, space, chat
│   ├── services/         # pdfParser, embedding (HF), pinecone, groq
│   ├── socket/            # Socket.io room/presence handler
│   ├── utils/chunkText.js
│   └── server.js
└── frontend/
    └── src/
        ├── api/axios.js          # axios instance with JWT interceptor
        ├── context/AuthContext.jsx
        ├── components/           # Navbar, PdfCard, ChatWindow, ModelSelector, ProtectedRoute
        ├── pages/                # Login, Register, Dashboard, Chat, Space, Collections, CollectionDetail
        ├── App.jsx
        └── main.jsx
```

## Setup

### Prerequisites
- Node.js 18+
- A MongoDB instance (local or Atlas)
- API keys: [Groq](https://console.groq.com), [Hugging Face](https://huggingface.co/settings/tokens), [Pinecone](https://app.pinecone.io)

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# fill in MONGO_URI, JWT_SECRET, GROQ_API_KEY, HF_API_KEY, PINECONE_API_KEY
npm run dev
```

The server starts on `http://localhost:5000`. On first run it will auto-create the
Pinecone index named in `PINECONE_INDEX` if it doesn't already exist (dimension must match
your embedding model — 384 for `all-MiniLM-L6-v2`).

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:5173`.

## Notes on Choosing an Embedding Model

The default `sentence-transformers/all-MiniLM-L6-v2` outputs 384-dim vectors and is fast/cheap
on Hugging Face's free inference tier. If you swap to a different model, update
`HF_EMBEDDING_MODEL` **and** `PINECONE_DIMENSION` in `backend/.env` together — Pinecone indexes
are fixed-dimension, so a mismatch will fail on upsert.

## Notes on Groq Models

`GET /api/chat/models` returns the list the frontend's model selector renders from
(`backend/services/groq.service.js`). Add or remove entries there as Groq's catalog changes.

## Extending This Further

- Add PDF preview (e.g. `react-pdf`) alongside the chat pane so users can see the source page.
- Add per-space typing indicators to the UI (the socket event `typing` is already emitted server-side).
- Add role-based space permissions (currently anyone with the code can join).
- Swap Multer disk storage for S3/Cloud Storage for multi-instance deployments.
- Add rate limiting (`express-rate-limit`) in front of `/chat/:pdfId/ask` since it's the
  most expensive route (embedding + Pinecone query + Groq completion per call).
