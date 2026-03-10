import torch


def choose_action(agent, state):

    state = torch.tensor(state, dtype=torch.float)

    with torch.no_grad():

        q_values = agent(state)

    return torch.argmax(q_values).item()