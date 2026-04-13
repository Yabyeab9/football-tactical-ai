import httpx
import os


class AIAnalyst:
    def __init__(self):
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        self.api_key = os.getenv("GEMINI_API_KEY")

    async def get_tactical_insight(self, match_context: str, user_query: str):
        prompt = f"""
        You are a World-Class Football Tactical Analyst.
        Context: {match_context}
        User Query: {user_query}

        Provide a concise, data-driven tactical response. Mention specific metrics 
        like xG, PPDA, or Field Tilt if relevant. Be sharp and professional.
        """

        # In a real scenario, call Gemini/OpenAI here
        # Returning a simulated response for now
        return f"Based on the data, the high press is yielding a PPDA of 8.4, which is suffocating their buildup play."