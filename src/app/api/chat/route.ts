import { NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { searchSimilar } from "@/lib/vector-store";
import { logger } from "@/lib/logger";

export const maxDuration = 60; // Allow enough time for LLM streaming

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        "OpenAI API Key is missing. Please add OPENAI_API_KEY to your .env file to use the Chat feature.",
        { status: 401 }
      );
    }

    const latestMessage = messages[messages.length - 1].content;
    
    // 1. Generate embedding for the user's latest question
    logger.info(\`RAG Search started for: "\${latestMessage.slice(0, 50)}..."\`);
    const queryEmbedding = await generateEmbedding(latestMessage);
    
    // 2. Fetch top 5 matching code chunks
    const results = await searchSimilar(queryEmbedding, 5);
    
    // 3. Construct the RAG augmented system prompt
    let systemContext = \`You are 'Antigravity Command Center', a senior developer assistant managing my local machine.
You have direct access to snippets of my local source code related to my questions.
Always use this local context to answer accurately. If the context doesn't contain the answer, say so.\n\n\`;

    if (results.length > 0) {
      systemContext += "LOCAL SOURCE CODE CONTEXT:\\n";
      results.forEach((r, i) => {
        // We ensure we maintain token economy by slicing massive chunks
        const snippet = r.text.slice(0, 1500); 
        systemContext += \`--- Snippet \${i + 1} ---\n\${snippet}\n\`;
      });
    } else {
      systemContext += "No local code matched this query.";
    }

    // 4. Send to OpenAI
    const openAiMessages = [
      { role: "system", content: systemContext },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${apiKey}\`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openAiMessages,
        stream: true,
        temperature: 0.3, // Lower temp for factual code answers
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.error("OpenAI API Error", { errText });
      return new Response("Failed to connect to AI provider.", { status: 500 });
    }

    // 5. Stream the response directly back to the client
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    logger.error("Chat API error", { error: error.message });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
