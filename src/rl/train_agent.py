import torch
import torch.nn.functional as F

from src.rl.football_env import FootballEnv
from src.rl.tactical_agent import TacticalAgent


def train_agent():

    env = FootballEnv()

    agent = TacticalAgent()

    optimizer = torch.optim.Adam(
        agent.parameters(),
        lr=0.001
    )

    gamma = 0.99

    for episode in range(500):

        state = torch.tensor(
            env.reset(),
            dtype=torch.float
        )

        done = False

        while not done:

            q_values = agent(state)

            action = torch.argmax(q_values).item()

            next_state, reward, done = env.step(action)

            next_state = torch.tensor(
                next_state,
                dtype=torch.float
            )

            target = reward + gamma * torch.max(
                agent(next_state)
            )

            loss = F.mse_loss(
                q_values[action],
                target
            )

            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

            state = next_state

        print("episode", episode)