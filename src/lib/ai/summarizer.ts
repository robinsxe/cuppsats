export async function summarizeAbstract(
  title: string,
  abstract: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY saknas. Lägg till den i .env för att aktivera AI-sammanfattning."
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Du är en akademisk assistent som hjälper en socionomstudent. Sammanfatta följande forskningsartikel på svenska i 2-3 meningar. Fokusera på huvudresultat och relevans för socialt arbete.

Titel: ${title}

Abstract: ${abstract}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Anthropic API error:", response.status, errorBody);
    throw new Error("Kunde inte generera sammanfattning");
  }

  const data = await response.json();
  const textBlock = data.content?.find(
    (block: { type: string }) => block.type === "text"
  );

  return textBlock?.text ?? "Ingen sammanfattning genererad";
}
