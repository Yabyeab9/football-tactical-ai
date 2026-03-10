import torch
import math


class PositionalEncoding(torch.nn.Module):

    def __init__(self, d_model, max_len=100):

        super().__init__()

        pe = torch.zeros(max_len, d_model)

        for pos in range(max_len):

            for i in range(0, d_model, 2):

                pe[pos, i] = math.sin(pos / (10000 ** (i / d_model)))

                if i + 1 < d_model:
                    pe[pos, i+1] = math.cos(pos / (10000 ** (i / d_model)))

        self.pe = pe.unsqueeze(0)

    def forward(self, x):

        return x + self.pe[:, :x.size(1)]