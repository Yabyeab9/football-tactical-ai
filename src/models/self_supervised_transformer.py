import torch
import torch.nn as nn


class FootballBERT(nn.Module):

    def __init__(
        self,
        vocab_size=120,
        d_model=128,
        heads=4,
        layers=4
    ):

        super().__init__()

        self.embedding = nn.Embedding(
            vocab_size,
            d_model
        )

        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=heads
        )

        self.transformer = nn.TransformerEncoder(
            encoder_layer,
            num_layers=layers
        )

        self.fc = nn.Linear(
            d_model,
            vocab_size
        )

    def forward(self, x):

        x = self.embedding(x)

        x = x.permute(1,0,2)

        out = self.transformer(x)

        out = out.permute(1,0,2)

        return self.fc(out)