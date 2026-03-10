import numpy as np


class FootballEnv:

    def __init__(self):

        self.state = np.zeros(4)

    def reset(self):

        self.state = np.random.rand(4)

        return self.state

    def step(self, action):

        reward = np.random.randn()

        next_state = np.random.rand(4)

        done = np.random.rand() < 0.05

        self.state = next_state

        return next_state, reward, done