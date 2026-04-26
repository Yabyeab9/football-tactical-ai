import { Bot, SendHorizontal } from "lucide-react";
import { useState } from "react";

import { MainLayout } from "@/components/layouts/MainLayout";
import { PageHero } from "@/components/platform/PageHero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getDashboardSummary, sendAIChat } from "@/db/api";
import { usePollingResource } from "@/hooks/use-polling-resource";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function AIAssistant() {
  const { data } = usePollingResource({
    fetcher: getDashboardSummary,
    intervalMs: 60000,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "I’m your football manager-style analyst. Ask me about match control, player output, tactical risks, or what substitution pattern I’d make next.",
    },
  ]);
  const [matchId, setMatchId] = useState<string>("");
  const [playerId, setPlayerId] = useState<string>("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const contextMatches = data?.live_board ?? [];
  const contextPlayers = data?.featured_players ?? [];
  const activeTeamId = matchId ? contextMatches.find((item) => item.id === matchId)?.home_team.id ?? undefined : undefined;

  const handleSend = async () => {
    if (!input.trim()) {
      return;
    }

    const nextMessage: ChatMessage = { role: "user", content: input };
    const nextMessages = [...messages, nextMessage];
    setMessages(nextMessages);
    setInput("");
    setSending(true);

    try {
      const response = await sendAIChat({
        message: nextMessage.content,
        match_id: matchId || undefined,
        player_id: playerId || undefined,
        team_id: activeTeamId,
        conversation: nextMessages.slice(-6),
      });

      setMessages((current) => [...current, { role: "assistant", content: response.reply }]);
    } catch (err) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: err instanceof Error ? err.message : "The assistant could not answer right now.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PageHero
          eyebrow="AI Football Assistant"
          title="Chat with a manager-style football analyst that uses platform context."
          description="The assistant can anchor its answer in match tactical analysis, player analytics, and team form instead of generic football talk. Choose context below, then ask the question you’d ask a coach or performance analyst."
          badge="Context-aware football chat"
        />

        <div className="grid gap-6 xl:grid-cols-[1fr_0.34fr]">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bot className="h-5 w-5 text-primary" />
                Analyst Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="flex h-[42rem] flex-col gap-4">
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-6 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="grid gap-3 md:grid-cols-2">
                <Select value={matchId} onValueChange={setMatchId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional match context" />
                  </SelectTrigger>
                  <SelectContent>
                    {contextMatches.map((match) => (
                      <SelectItem key={match.id} value={match.id}>
                        {match.home_team.name} vs {match.away_team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={playerId} onValueChange={setPlayerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Optional player context" />
                  </SelectTrigger>
                  <SelectContent>
                    {contextPlayers.map((player) => (
                      <SelectItem key={player.player.id} value={player.player.id}>
                        {player.player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3">
                <Textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about substitutions, tactical risks, prediction confidence, player usage, or team form..."
                  className="min-h-28"
                />
                <Button onClick={handleSend} disabled={sending}>
                  <SendHorizontal className="mr-2 h-4 w-4" />
                  {sending ? "Thinking..." : "Send to analyst"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="text-xl">Prompt Ideas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                "Why is the home side controlling territory but not creating enough shot quality?",
                "Which player should the manager rotate first if injury risk matters most?",
                "What tactical switch would most likely change the win probability?",
                "Explain the strongest weakness the away side should target next.",
              ].map((idea) => (
                <Badge key={idea} variant="outline" className="whitespace-normal text-left">
                  {idea}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
